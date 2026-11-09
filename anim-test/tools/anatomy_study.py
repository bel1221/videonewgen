"""Anatomy pass over mesh_study output: front/back, facing angle, and movement relative to facing, per character per frame.
python -I anatomy_study.py OUTDIR NAME [NAME ...]
COCO keypoints: 0 nose 1/2 eyes 3/4 ears 5/6 shoulders(L/R) 7/8 elbows 9/10 wrists 11/12 hips 13/14 knees 15/16 ankles.
 - front vs back: face points visible + shoulder order (character's left shoulder on image RIGHT = facing camera)
 - facing yaw: |yaw| = acos(shoulder width / (0.85 * torso height)) clipped; sign/side from the ear that is visible
 - movement: hip-centre velocity (px/frame, smoothed) split into along-facing (advance/retreat) and across (strafe)
Writes NAME_anat_frames/*.jpg (annotated), NAME_anat_sheet.jpg, NAME_anat_timeline.png, NAME_anat.json."""
import sys, os, json, glob
import numpy as np, cv2, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
out = sys.argv[1]
V = lambda k, i: k[i][2] > 0.25
summary = {}
for name in sys.argv[2:]:
    rec = json.load(open(f'{out}/{name}_kp.json')); os.makedirs(f'{out}/{name}_anat_frames', exist_ok=True)
    hist = {}; rows = []
    for fi, r in enumerate(rec):
        img = cv2.imread(f'{out}/{name}_frames/{fi:04d}.jpg')
        for pp in r['people']:
            k = pp['kp']; tid = pp['id']
            if not (V(k, 5) and V(k, 6)): continue
            ls, rs = np.array(k[5][:2]), np.array(k[6][:2])
            face = sum(V(k, i) for i in (0, 1, 2))
            hips = [np.array(k[i][:2]) for i in (11, 12) if V(k, i)]
            sh_c = (ls + rs) / 2; hip_c = np.mean(hips, 0) if hips else sh_c + np.array([0, 60])
            torso = max(8.0, np.linalg.norm(hip_c - sh_c)); sw = np.linalg.norm(ls - rs)
            yaw_mag = float(np.degrees(np.arccos(np.clip(sw / (0.85 * torso), 0, 1))))
            facing_cam = ls[0] > rs[0]                         # left shoulder appears on image right
            if face >= 2 and facing_cam: view = 'FRONT'
            elif face == 0 and not facing_cam: view = 'BACK'
            elif yaw_mag > 55: view = 'SIDE'
            else: view = 'FRONT' if facing_cam else 'BACK'
            # facing direction in the picture: perpendicular to the shoulder line, toward the face side
            sv = rs - ls; perp = np.array([-sv[1], sv[0]]) / (np.linalg.norm(sv) + 1e-6)
            side = (1 if V(k, 3) else -1) if V(k, 3) != V(k, 4) else (1 if facing_cam else -1)
            fdir = np.array([np.sign(sv[0]) * -side if yaw_mag > 40 else 0.0, 0.0])
            if np.linalg.norm(fdir) == 0: fdir = np.array([0.0, 1.0]) if facing_cam else np.array([0.0, -1.0])
            h = hist.setdefault(tid, []); h.append((fi, hip_c)); vel = np.zeros(2)
            if len(h) >= 3 and h[-1][0] - h[-3][0] <= 4: vel = (h[-1][1] - h[-3][1]) / (h[-1][0] - h[-3][0])
            spd = float(np.linalg.norm(vel)); along = float(vel @ fdir) if np.linalg.norm(fdir) else 0.0
            move = 'still' if spd < 1.5 else ('advance' if along > 0.5 * spd else 'retreat' if along < -0.5 * spd else 'strafe')
            rows.append(dict(f=fi, t=r['t'], id=tid, view=view, yaw=round(yaw_mag), speed=round(spd, 1), move=move, torso_px=round(torso, 1)))
            # draw
            col = {'FRONT': (80, 220, 120), 'BACK': (60, 120, 255), 'SIDE': (40, 210, 255)}[view]
            p0 = tuple(sh_c.astype(int)); cv2.arrowedLine(img, p0, tuple((sh_c + fdir * 55).astype(int)), col, 3, tipLength=0.35)
            if spd >= 1.5: cv2.arrowedLine(img, tuple(hip_c.astype(int)), tuple((hip_c + vel / spd * min(90, spd * 8)).astype(int)), (255, 255, 255), 2, tipLength=0.35)
            lab = f'#{tid} {view} yaw~{yaw_mag:.0f} {move}'
            org = (int(sh_c[0]) - 60, max(40, int(sh_c[1]) - 50))
            cv2.putText(img, lab, org, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 3, cv2.LINE_AA); cv2.putText(img, lab, org, cv2.FONT_HERSHEY_SIMPLEX, 0.5, col, 1, cv2.LINE_AA)
            cv2.circle(img, tuple(ls.astype(int)), 6, (0, 0, 255), 2); cv2.circle(img, tuple(rs.astype(int)), 6, (255, 0, 0), 2)   # L red, R blue
        cv2.imwrite(f'{out}/{name}_anat_frames/{fi:04d}.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    n = len(rec); ims = [cv2.resize(cv2.imread(f'{out}/{name}_anat_frames/{i:04d}.jpg'), (320, 180)) for i in range(0, n, 3)]
    while len(ims) % 6: ims.append(np.zeros_like(ims[0]))
    cv2.imwrite(f'{out}/{name}_anat_sheet.jpg', np.vstack([np.hstack(ims[i:i + 6]) for i in range(0, len(ims), 6)]), [cv2.IMWRITE_JPEG_QUALITY, 84])
    # timeline: view + speed per character
    fig, ax = plt.subplots(2, 1, figsize=(12, 4.5), sharex=True)
    for tid in sorted({x['id'] for x in rows}):
        xs = [x for x in rows if x['id'] == tid]
        if len(xs) < 4: continue
        ax[0].scatter([x['t'] for x in xs], [{'FRONT': 2, 'SIDE': 1, 'BACK': 0}[x['view']] + tid * 0.07 for x in xs], s=12, label=f'#{tid}')
        ax[1].plot([x['t'] for x in xs], [x['speed'] for x in xs], label=f'#{tid}')
    ax[0].set_yticks([0, 1, 2]); ax[0].set_yticklabels(['BACK', 'SIDE', 'FRONT']); ax[0].legend(fontsize=7, loc='upper right'); ax[0].set_title(f'{name}: which side of each character faces the camera')
    ax[1].set_ylabel('hip speed px/frame'); ax[1].set_xlabel('seconds'); plt.tight_layout(); plt.savefig(f'{out}/{name}_anat_timeline.png', dpi=80); plt.close()
    json.dump(rows, open(f'{out}/{name}_anat.json', 'w'))
    from collections import Counter
    summary[name] = dict(views=dict(Counter(x['view'] for x in rows)), moves=dict(Counter(x['move'] for x in rows)),
                         view_switches=sum(1 for a, b in zip(rows, rows[1:]) if a['id'] == b['id'] and a['view'] != b['view']),
                         median_speed=float(np.median([x['speed'] for x in rows])) if rows else 0)
print(json.dumps(summary, indent=0))

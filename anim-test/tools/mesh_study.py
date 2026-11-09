"""Per-frame character meshing + skeleton tracking on a video clip (study tool, no rendering of new video).
python -I mesh_study.py VIDEO T0 T1 OUTDIR NAME
 - segmentation (YOLOv8-seg): each character's silhouette as a filled mask + polygon outline (the 'mesh')
 - pose (YOLOv8-pose, COCO 17 keypoints): skeleton per character, tracked frame to frame by nearest centroid
 - writes OUTDIR/NAME_frames/*.jpg overlays, NAME_sheet.jpg (every 3rd frame), NAME_kp.json (all joints, all frames)
Minecraft characters are blocky humanoids: detections run at a low confidence floor and every frame is kept (misses are
recorded as gaps, they are part of the finding)."""
import sys, os, json, subprocess
import numpy as np, cv2
from ultralytics import YOLO

src, t0, t1, out, name = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], sys.argv[5]
os.makedirs(f'{out}/{name}_frames', exist_ok=True)
seg = YOLO('yolov8m-seg.pt'); pose = YOLO('yolov8m-pose.pt')
W, H = 960, 540
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t0), '-t', str(t1 - t0), '-i', src, '-vf', f'fps=30,scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
SK = [(5, 7), (7, 9), (6, 8), (8, 10), (5, 6), (5, 11), (6, 12), (11, 12), (11, 13), (13, 15), (12, 14), (14, 16), (0, 5), (0, 6)]
COL = [(80, 220, 120), (255, 140, 60), (90, 160, 255), (230, 90, 230)]
tracks = []; prev = []; rec = []
for i, f in enumerate(frames):
    img = f.copy(); t = t0 + i / 30
    s = seg(f, conf=0.12, verbose=False, retina_masks=True)[0]
    p = pose(f, conf=0.12, verbose=False)[0]
    masks = []
    if s.masks is not None:
        for m, c in zip(s.masks.data.cpu().numpy(), s.boxes.cls.cpu().numpy()):
            if int(c) != 0: continue                     # person class only
            masks.append((cv2.resize(m, (W, H)) > 0.5).astype(np.uint8))
    people = []
    if p.keypoints is not None and len(p.keypoints):
        kps = p.keypoints.data.cpu().numpy()             # (n,17,3)
        for k in kps:
            vis = k[:, 2] > 0.25
            if vis.sum() < 4: continue
            people.append(k)
    # track ids by centroid
    cur = []
    for k in people:
        c = k[k[:, 2] > 0.25, :2].mean(0)
        j = min(range(len(prev)), key=lambda q: np.hypot(*(prev[q][1] - c)), default=None) if prev else None
        tid = prev[j][0] if j is not None and np.hypot(*(prev[j][1] - c)) < 120 else len(tracks)
        if tid == len(tracks): tracks.append(tid)
        cur.append((tid, c, k))
    prev = [(a, b) for a, b, _ in cur]
    # draw: mesh = filled mask + contour polygon (approximated) + wireframe triangulation of the contour
    for mi, m in enumerate(masks):
        col = COL[mi % 4]; ov = img.copy(); ov[m > 0] = (0.55 * np.array(col) + 0.45 * ov[m > 0]).astype(np.uint8); img = cv2.addWeighted(ov, 0.55, img, 0.45, 0)
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in cs:
            if cv2.contourArea(cnt) < 150: continue
            poly = cv2.approxPolyDP(cnt, 2.5, True); cv2.polylines(img, [poly], True, col, 2, cv2.LINE_AA)
            r = cv2.boundingRect(poly); sub = cv2.Subdiv2D((r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4))
            for q in poly[:, 0]: sub.insert((float(q[0]), float(q[1])))
            for tr in sub.getTriangleList():
                pts = tr.reshape(3, 2).astype(int); cen = pts.mean(0).astype(int)
                if 0 <= cen[1] < H and 0 <= cen[0] < W and m[cen[1], cen[0]]: cv2.polylines(img, [pts], True, (255, 255, 255), 1, cv2.LINE_AA)
    for tid, c, k in cur:
        col = COL[tid % 4]
        for a, b in SK:
            if k[a, 2] > 0.25 and k[b, 2] > 0.25: cv2.line(img, tuple(k[a, :2].astype(int)), tuple(k[b, :2].astype(int)), (20, 20, 20), 5, cv2.LINE_AA); cv2.line(img, tuple(k[a, :2].astype(int)), tuple(k[b, :2].astype(int)), col, 3, cv2.LINE_AA)
        for q in k:
            if q[2] > 0.25: cv2.circle(img, (int(q[0]), int(q[1])), 4, (255, 255, 255), -1)
    cv2.putText(img, f'{name} t={t:.2f}s  meshes={len(masks)} skeletons={len(cur)}', (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 3); cv2.putText(img, f'{name} t={t:.2f}s  meshes={len(masks)} skeletons={len(cur)}', (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 1)
    cv2.imwrite(f'{out}/{name}_frames/{i:04d}.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    rec.append(dict(t=round(t, 3), masks=len(masks), area=[int(m.sum()) for m in masks], people=[dict(id=int(tid), kp=k.round(1).tolist()) for tid, c, k in cur]))
json.dump(rec, open(f'{out}/{name}_kp.json', 'w'))
# sheet: every 3rd frame, 6 columns
ims = [cv2.resize(cv2.imread(f'{out}/{name}_frames/{i:04d}.jpg'), (320, 180)) for i in range(0, len(frames), 3)]
while len(ims) % 6: ims.append(np.zeros_like(ims[0]))
cv2.imwrite(f'{out}/{name}_sheet.jpg', np.vstack([np.hstack(ims[r:r + 6]) for r in range(0, len(ims), 6)]), [cv2.IMWRITE_JPEG_QUALITY, 84])
det = np.mean([r['masks'] > 0 for r in rec]); sk = np.mean([len(r['people']) > 0 for r in rec])
print(f'{name}: {len(frames)} frames, mesh found in {det:.0%}, skeleton in {sk:.0%}')

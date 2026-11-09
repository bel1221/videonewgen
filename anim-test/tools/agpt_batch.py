"""Batch AnimationGPT generation with variations (seeds), for a fight library.

  motion\.venv\Scripts\python.exe motion\agpt_batch.py PROMPTS.json OUTDIR --seeds 1234,7,42

PROMPTS.json = {"name": "prompt", ...}. For every seed the model is loaded once and all prompts run in one batch;
each result is retargeted with anim-test/tools/motion2rig.py to OUTDIR/<name>__s<seed>.json and the raw joints are
kept as OUTDIR/raw/<name>__s<seed>.npy (so clips can be re-retargeted without re-generating).
"""
import argparse, glob, json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
MGPT = os.path.join(HERE, 'MotionGPT')
PY = os.path.join(HERE, '.venv', 'Scripts', 'python.exe')
M2R = os.path.normpath(os.path.join(HERE, '..', 'videonewgen', 'anim-test', 'tools', 'motion2rig.py'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('prompts'); ap.add_argument('out'); ap.add_argument('--seeds', default='1234')
    a = ap.parse_args()
    P = json.load(open(a.prompts, encoding='utf-8')); names = list(P)
    os.makedirs(os.path.join(a.out, 'raw'), exist_ok=True)
    base = open(os.path.join(MGPT, 'config_AGPT.yaml'), encoding='utf-8').read()
    with open(os.path.join(MGPT, 'input_batch.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(P[n].replace('\n', ' ') for n in names) + '\n')
    env = dict(os.environ, PYTHONIOENCODING='utf-8')
    for seed in [int(s) for s in a.seeds.split(',')]:
        cfg = os.path.join(MGPT, f'config_AGPT_s{seed}.yaml')
        open(cfg, 'w', encoding='utf-8').write(f'SEED_VALUE: {seed}\n' + base)
        before = set(glob.glob(os.path.join(MGPT, 'results', 'mgpt', 'debug--AGPT', 'samples_*')))
        r = subprocess.run([PY, 'demo.py', '--cfg', os.path.basename(cfg), '--example', './input_batch.txt'], cwd=MGPT, env=env,
                           capture_output=True, text=True, encoding='utf-8', errors='replace')
        if r.returncode:
            sys.stderr.write(r.stdout[-3000:] + r.stderr[-3000:]); return r.returncode
        run = sorted(set(glob.glob(os.path.join(MGPT, 'results', 'mgpt', 'debug--AGPT', 'samples_*'))) - before)[-1]
        for i, n in enumerate(names):
            tag = f'{n}__s{seed}'
            shutil.copy(os.path.join(run, f'{i}_out.npy'), os.path.join(a.out, 'raw', tag + '.npy'))
            subprocess.run([PY, M2R, os.path.join(a.out, 'raw', tag + '.npy'), os.path.join(a.out, tag + '.json'),
                            '--prompt', P[n], '--fps-out', '20', '--smooth', '3'], check=True, capture_output=True)
        print('seed', seed, 'done:', run, flush=True)


if __name__ == '__main__':
    sys.exit(main())

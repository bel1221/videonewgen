# Contact sheet of QA stills. python -X utf8 tools/sheet.py out.jpg t1,t2,...  (renders the stills first)
import sys, subprocess
from PIL import Image
ts = sys.argv[2].split(',')
subprocess.run([sys.executable, '-X', 'utf8', 'tools/br_scenes.py', 'still', sys.argv[2]], check=True)
cols = 2; rows = (len(ts) + 1) // 2
S = Image.new('RGB', (960 * cols, 540 * rows))
for i, t in enumerate(ts):
    S.paste(Image.open(f'qa/m_{float(t):05.2f}.jpg'), ((i % cols) * 960, (i // cols) * 540))
S.save(sys.argv[1], quality=82)
print('ok', sys.argv[1])

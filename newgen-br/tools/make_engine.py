# Builds tools/mg.py from the Ranked 2vs2 engine with the Battle Royale background. python -X utf8 tools/make_engine.py
s = open('../newgen-ranked/tools/mg.py', encoding='utf8').read()
def rep(a, b):
    global s
    assert a in s, a
    s = s.replace(a, b)
rep("# NewGen showcase - clean motion graphics. python3 tools/mg.py F0 F1 out.mp4 | still t1,..",
    "# NewGen motion-graphics engine (built by tools/make_engine.py from newgen-ranked/tools/mg.py). Used by tools/br_scenes.py")
rep("Image.open('src/background.jpg')", "Image.open('src/map_castle.png')")
rep("_b = _b * 0.9 + np.array([10, 4, 14], np.float32)", "_b = _b * 0.74 + np.array([4, 10, 12], np.float32)")
rep("c = (255, int(170 + r.random() * 50), int(200 + r.random() * 40)) if i % 4 else (255, 245, 250)",
    "c = (int(190 + r.random() * 50), 255, int(200 + r.random() * 40)) if i % 4 else (255, 250, 240)")
rep("for k in ('graph_blur', 'map_castle', 'map_lobby', 'map_canyon', 'lb_kills', 'lb_champ', 'lb_wins', 'legend1', 'legend2', 'lb_mr'):",
    "for k in ('map_castle', 'map_lobby', 'map_canyon'):")
open('tools/mg.py', 'w', encoding='utf8').write(s)
print('ok')

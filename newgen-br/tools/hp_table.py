# Measures which frame of the keyed heart clip shows exactly k hearts -> src/hp_table.json. Run after tools/prep_gs.py.
import json
import numpy as np
hp = np.load('src/hp_keyed.npy')
red = (hp[..., 0] > 200) & (hp[..., 1] < 70) & (hp[..., 2] < 70) & (hp[..., 3] > 128)
n = red.reshape(len(hp), -1).sum(1); hearts = n / (n[0] / 10.0)
tab = {str(k): int(np.nonzero(hearts <= k + 0.02)[0][0]) for k in range(10, -1, -1)}
assert n[tab['0']] == 0, 'the 0-heart frame still has red pixels'
json.dump(tab, open('src/hp_table.json', 'w')); print(tab)

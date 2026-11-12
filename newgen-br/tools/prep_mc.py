# Copies the Minecraft item textures the video uses from the locally installed game into src/mc (not kept in git).
# python tools/prep_mc.py [path to a Minecraft version .jar]
import os, sys, zipfile, glob
jar = sys.argv[1] if len(sys.argv) > 1 else sorted(glob.glob(os.path.expanduser('~/AppData/Roaming/.minecraft/versions/*/*.jar')))[-1]
z = zipfile.ZipFile(jar); names = set(z.namelist()); os.makedirs('src/mc', exist_ok=True)
for n in ('diamond_pickaxe', 'iron_pickaxe', 'wooden_pickaxe', 'diamond', 'coal', 'gold_ingot', 'raw_iron', 'ender_pearl', 'iron_helmet', 'iron_chestplate',
          'iron_leggings', 'iron_boots', 'diamond_helmet', 'diamond_chestplate', 'golden_apple', 'diamond_sword'):
    open(f'src/mc/{n}.png', 'wb').write(z.read(f'assets/minecraft/textures/item/{n}.png'))
open('src/mc/hotbar.png', 'wb').write(z.read('assets/minecraft/textures/gui/sprites/hud/hotbar.png'))
print('ok', jar)

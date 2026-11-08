from PIL import Image
Image.MAX_IMAGE_PIXELS = None
T, NF = 360, 144
for n in ('aegisblade', 'veilblade', 'oceansword', 'thundermaul'):
    im = Image.open(f'spin_{n}.png'); h = im.height // 2
    out = Image.new('RGB', (16 * T, 9 * T * 2))
    for f in range(NF):
        sx, sy = (f % 12) * T, (f // 12) * T; dx, dy = (f % 16) * T, (f // 16) * T
        out.paste(im.crop((sx, sy, sx + T, sy + T)), (dx, dy)); out.paste(im.crop((sx, sy + h, sx + T, sy + h + T)), (dx, dy + 9 * T))
    out.save(f'spin_{n}.png', optimize=True)

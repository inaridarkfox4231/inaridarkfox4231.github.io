# pythonのpillowを使って透過画像を作成したい
# -*- coding:utf-8 -*-

from PIL import Image

# スペース区切りの文字の並びから配列を作成して返す関数
def intinput(message):
    numArray = input(message)
    data = numArray.split()
    array = []
    N = len(data)
    for i in range(N):
        array.append(int(data[i]))
    return array

# 透過したい画像を読み込み
filename = input("ファイル名を入力してください（拡張子は除く）")
org = Image.open(filename + ".png")

# 同じサイズの画像を作成
trans = Image.new('RGBA', org.size, (0, 0, 0, 0))

width = org.size[0]
height = org.size[1]

# 色指定か場所指定か選ばせる
mode = int(input("色指定の場合は0, 場所指定の場合は1を指定してください"))
if mode == 0:
    # 色を指定させる。スペース区切りで3つ。
    rgb = intinput("透明にしたい色のRGB値を指定してください")
    for x in range(width):
        for y in range(height):
            pixel = org.getpixel((x, y))
            # 白なら処理しない
            if pixel[0] == rgb[0] and pixel[1] == rgb[1] and pixel[2] == rgb[2]:
                continue
            # 白以外なら、用意した画像にピクセルを書き込み
            trans.putpixel((x, y), pixel)
elif mode == 1:
    # 場所を指定させる。スペース区切りで2つ。
    pos = intinput("透明にしたい色が存在する位置を指定してください")
    rgb = org.getpixel((pos[0], pos[1])) 
    for x in range(width):
        for y in range(height):
            pixel = org.getpixel((x, y))
            # 白なら処理しない
            if pixel[0] == rgb[0] and pixel[1] == rgb[1] and pixel[2] == rgb[2]:
                continue
            # 白以外なら、用意した画像にピクセルを書き込み
            trans.putpixel((x, y), pixel)

# 透過画像を保存
print("処理が完了しました")
trans.save(filename + ".png")

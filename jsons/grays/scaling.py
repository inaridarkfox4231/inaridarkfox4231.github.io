# 8段階グレースケールにした画像を対象とする。
# 255は無視してそれ以外、32で割った値（0～7）を付与する。
# そして点描画の際にその情報でもって点の色とする。

from PIL import Image
import os

filename = input("ファイル名を入力：")
org = Image.open(filename + ".png")

data = []

width = org.size[0]
height = org.size[1]

for x in range(width):
    for y in range(height):
        pixel = org.getpixel((x, y))
        if pixel[0] == 255: continue
        scale = pixel[0] // 32
        data.append("{\"x\":" + str(x) + ",\"y\":" + str(y) + ",\"scale\":" + str(scale) + "}")

arrayString = "["

for i in range(len(data) - 1):
    arrayString += data[i] + ", "

arrayString += data[len(data) - 1] + "]"

data_json = "{\"size\":" + str(len(data)) + ", \"text_scaledata\":" + arrayString + "}"

json_text = open(filename + "_scaledata.json", mode = "w")
json_text.write(data_json)
json_text.close()

print(data_json)


# 今回は画像を読み込んで文字のある所だけ抜き出して点の配列を返す
# プログラムを作りたいですね。とりあえず黒でAでやってみようね。

from PIL import Image
import os

filename = input("ファイル名を入力してください（拡張子は除く）：")
org = Image.open(filename + ".png")

# とりあえずr + g + b < 255のところを抜き出す感じかな・・
# 形式は文字列で{x:123, y:456}みたいな。
data = []

width = org.size[0]   # sizeの0と1に横幅と縦幅が入ってる。
height = org.size[1]

for x in range(width):
    for y in range(height):
        pixel = org.getpixel((x, y))
        if(pixel[0] + pixel[1] + pixel[2] < 128):
            data.append("{\"x\":" + str(x) + ", \"y\":" + str(y) + "}")

arrayString = "["

for i in range(len(data) - 1):
    arrayString += data[i] + ", "

arrayString += data[len(data) - 1] + "]"

data_json = "{\"text_posdata\":" + arrayString + ", \"size\":" + str(len(data)) + "}"


json_text = open(filename + "_posdata.json", mode = "w")
json_text.write(data_json)
json_text.close()

# print(data_json)

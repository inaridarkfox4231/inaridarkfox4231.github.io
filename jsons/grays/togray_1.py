# グレー8段階
# 面倒だから全部足して765の何%かで分けようかな・・
# -*- coding:utf-8 -*-

from PIL import Image
import os

def main():
    filename = input("ファイル名を入力してください（拡張子は除く）")
    org = Image.open(filename + ".png") # originalのorgだと思う。

    # 同じサイズの画像を作成
    grayed = Image.new('RGBA', org.size, (0, 0, 0, 0))

    width = org.size[0]
    height = org.size[1]

    for x in range(width):
        for y in range(height):
            pixel = org.getpixel((x, y))
            average = (pixel[0] + pixel[1] + pixel[2]) // 3
            scale = int(average / 32) #0, 1, 2, ..., 7くらい。これに32を掛ける。
            if average == 255:
                v = 255
            else:
                v = scale * 32
            grayedpixel = (v, v, v, 255)
            grayed.putpixel((x, y), grayedpixel)

    print("グレー化完了")
    grayed.save(filename + "_gray.png")


if __name__ == "__main__":
    main()


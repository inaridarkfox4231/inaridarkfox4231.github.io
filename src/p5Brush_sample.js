// ------------------------------------------------------- //

let _system;

// 2022/07/05
// exportできるように書き換えします

// 大幅にリファクタリングします。
// 統一します。分けるのがめんどくさいからです。
// 2022/07/12
// 統一完了しました。自由です。

// 使い方
// まず描き込みたいベースを自前で用意する
// それを使ってSystemを生成
// レイヤーを用意
// pointerを用意
// ブラシを用意
// すべて登録
// pointerとレイヤーの紐付け
// pointerとブラシの紐付け
// あとは好きに描くだけ
// ベースに描画されるのであとは好きに
// 毎フレームクリアしないと延々と重ね掛けされるので注意してください
// そこらへんはたとえばbackground(0,9)とかしたい場合を考慮して
// 自由度を持たせてあります。その代わり使う際は自己責任でよろしく。

let myCanvas;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // myCanvasを渡してそこに描画させる感じ
  myCanvas = createGraphics(width, height);

  // myCanvasを渡してそこに描画させる
  _system = new p5Brush.System(myCanvas);

  _system.addLayer({key:"bg"});
  _system.addLayer({key:"main"});
  _system.addLayer({key:"main2"});
  const bg = _system.getGraphic("bg");
  bg.background("#000");

  _system.addBrush(new p5Brush.LineBrush({w:2}), "line");
  _system.addBrush(new p5Brush.MultiLineBrush({}), "multiLine");
  _system.addBrush(new p5Brush.MusicBrush({}), "music");

  _system.addBrush(new p5Brush.TriangleBrush({}), "triangle");

  _system.addBrush(new p5Brush.ThornBrush({colorBand:0.8, thick:0.02}), "thorn");

  _system.addBrush(new p5Brush.CurveIconBrush({intervalFactor:1.35}), "heart");
  _system.addBrush(new p5Brush.CurveIconBrush({intervalFactor:1.1, kinds:"star"}), "star");
  _system.addBrush(new p5Brush.ScatterIconBrush({w:40, secondCol:"#fff", kinds:"moon star triangle", intervalFactor:0.25, sizeMinRatio:0.2, sizeMaxRatio:0.5}), "scatterMoon");
  _system.addBrush(new p5Brush.AirBrush({w:128}), "air");
  // 0.8の方がそれっぽいから
  // 修正しないといけないかもしれない
  // SVGデータ作り直すの面倒なのでこのデータをいじります

  // 星屑とかやってみたいわね
  // scatterは月とか。

  // _systemにブラシをセットすることはなくなった。
  // とはいえまあ今一つしかないので...
  // 切り替える形にするつもり。

  const p = new p5Brush.MousePointer();
  _system.addPointer(p);
  _system.setBrush(0, "air");
  _system.setCol(0, "#fff");
  _system.setTarget(0, "main");


  const q = new p5Brush.MirrorPointer(p, "mirrorXY");
  _system.addPointer(q);
  _system.setBrush(1, "music");
  _system.setCol(1, "#ff0");
  _system.setTarget(1, "main2");

}

function draw() {
  clear();
  // myCanvasの必要に応じたclearはこっちでやる
  myCanvas.clear();
  // 引数がなくなりました。
  _system.update();
  _system.draw();
  image(myCanvas, 0, 0);
}

// ------------------------------------------------------- //
// interaction.

// 以下の2つは自由に点が動く場合要らないのです
// これを分離したくてリファクタリングしてた
function mousePressed(){
  _system.startAll(mouseX, mouseY);
}

function mouseReleased(){
  _system.completeAll();
}

function keyTyped(){
  // Dキーで全消し
  if(keyCode==68){ _system.clear("main"); }
  // Ctrl+Zで戻る機能（そのうち実装）
  if(keyIsDown(17)&&keyCode==90){ console.log("back"); }
  // Ctrl+Yで進む機能（そのうち実装）
  if(keyIsDown(17)&&keyCode==89){ console.log("forward"); }
  // Shift+Aキーでブラシを変える機能。設定はデバッグモードで
  // 詳細表示予定
  if(keyIsDown(16)&&keyCode==65){
    console.log("change brush");
  }
  // レイヤー変更...
}

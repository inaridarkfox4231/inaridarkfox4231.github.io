// 得体のしれないmyP5JS.js
// 頼んでないのに線のグラデーションが実行されてる
// どういうことなのよ

// 多分いろいろおかしなことになってるんだと思う
// あそこ、drawBuffersいじったせいで。
// 原因は不明

// "https://inaridarkfox4231.github.io/src/p5js_1_5_0_bezier.js"
// これにしたら中央のsphereが消滅しました
// だからおそらく方向性はあってるんだけど
// 不可解な現象が起きてるので喜べません
// もうおかしくなりそう

// ベジエテストしてみる
// 簡単です
// あれ
// curFillとcurStrokeをシンプルに補間するだけ
// あの人の頭のおかしい提案ほんとは受けるつもりなかった
// 何が何でも実装する必要あったから妥協しただけ
// 頭おかしいよあいつ

// 線のグラデーション消滅しました
// もういや

// とりあえず同じように実装してみて
// 様子を見ることにしましょう
// 何を？線のグラデーションを。
// また同じことするだけなので楽ちんですよ。
// たぶんあれ
// 単に更新が遅れてただけだと思う

// やっぱbezierほにゃららでは消えてしまいますね
// sphereが
// とりあえず今後の流れとしては
// まずmyP5JSにstroke gradation実装してください
// 失うものはないんで突き進むだけですよ
// つまずいたら
// やりなおし！

// 昨日出先でいじって三角形4枚を追加したんですけど
// _bezierのやつでも中央の正方形表示されるんですよ
// sphereは消えるのに...
// それで調べてみました
// そしたらですね
// スマホの方
// まずimageからの正方形だと無事消えるんですけど
// bezierですね
// この一連の流れをやるとなぜか
// 中央の正方形が描画されるんですよね
// なぜ！？
// ほんと、わけわからん...

// bezierがあるとCubeも表示されますね。
// sphereは消えてくれるのに
// おそらく表示されるための条件が他にもあって
// いろいろあるんでしょう

// そしてパッチを当てるとジオメトリー全部真っ黒！！
// もういやだ！！

// あの仕様変更が稚拙で
// パッチ処理と相性が悪いってことなんでしょう。
// この後、頂点色ライティング実装するけど、
// もし仮に同じやり方だと、
// 真っ黒になってしまう可能性、
// ありますね...

function setup() {
  createCanvas(500,500,WEBGL);

  background(128);

  let gr = createGraphics(40,40);
  gr.background(99,77,111);
  image(gr, -250, -250, 40, 40);


  strokeWeight(6);
  beginShape();
  stroke(255);
  fill(255,0,0);
  vertex(-200,-200);
  stroke(0);
  fill(255,128,0);
  vertex(200,-200);
  stroke(128,128,255);
  fill(128,255,0);
  vertex(200,200);
  stroke(0,0,255);
  fill(128,255,128);
  vertex(-200,200);
  endShape(CLOSE);

  beginShape();
  stroke(255);
  fill(0);
  vertex(-200,0);
  stroke(0);
  fill(255);
  bezierVertex(-100,-100,0,100,200,0);
  endShape();

  fill(0, 0, 255);
  stroke(128);
  strokeWeight(2);
  translate(0,200);
  sphere(60);
  translate(0,-200);


  fill(255);
  directionalLight(255,255,255,0,0,-1);
  ambientLight(64);
  ambientMaterial(127);
  const geom = new p5.Geometry();
  geom.vertices = [
    createVector(0, 0, 20),
    createVector(-20, -20, 20), createVector(20, -20, 20),
    createVector(20, 20, 20), createVector(-20, 20, 20)];
  geom.faces = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1]];
  geom.computeNormals();
  this._renderer.createBuffers('mysquare',geom);
  this._renderer.drawBuffers('mysquare');

  translate(160, 0, 0);
  prepareCubeGeom("myCube");
  fill(255, 0, 0);
  this._renderer.drawBuffersScaled("myCube", 40, 40, 40);
}

function prepareCubeGeom(name){
  const v = createVector();
  const setV = (x,y,z) => v.set(x,y,z).copy();

  const geom = new p5.Geometry();

  geom.vertices.push(
    setV(-1,-1,1),setV(1,-1,1),setV(1,1,1),setV(-1,1,1),
    setV(-1,-1,-1),setV(1,-1,-1),setV(1,1,-1),setV(-1,1,-1)
  );
  geom.faces.push(
    [0,1,2],[0,2,3],[4,7,6],[4,6,5],
    [3,2,6],[3,6,7],[0,3,7],[0,7,4],
    [2,1,5],[2,5,6],[1,0,4],[1,4,5]
  );
  geom.computeNormals();
  this._renderer.createBuffers(name, geom);
}

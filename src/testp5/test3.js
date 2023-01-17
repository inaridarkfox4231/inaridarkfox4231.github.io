// resetMatrixのテスト。
// https://github.com/processing/p5.js/pull/5899
// これも修正済みだったわ。パス。
// カメラ行列でリセットしようって話

// ついでにquadのテストしようよ
// https://github.com/processing/p5.js/pull/5905

// さらにstrokeがONなのでカリングもテストしよう
// https://github.com/processing/p5.js/pull/5906
// これすんなりマージされたの未だに謎
// もう直ってるね
// となると線のグラデーション以降か。どのファイルだっけ...

// stroke gradationはあとで仕様が変わったんですよね。
// やることは一緒です。あの、こっちが変えたところとあのpull requestで変えたところだけに
// focusすればいいのよ。まずは...

// --- p5.Geometry.js ---
//   p5.Geometry
//   _edgesToVertices
// --- Immediate.js ---
//   vertex
//   _drawImmediateStroke
// --- Retained.js ---
//   drawBuffers
// --- RendererGL.js ---
//   RendererGL
//   _setStrokeUniforms
// --- line.frag, line.vert ---
// unit testは省略
// その後修正が入り...
// shader以外すべて修正入ってますね。まとめましょう、後で。

function setup() {
  createCanvas(400, 400, WEBGL);

  const gl = this._renderer.GL;
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);

  background(0);

  translate(100, 0, 0);
  fill(255,0,0);
  sphere(60);

  resetMatrix();

  translate(-100, 0, 0);
  fill(0,0,255);
  sphere(60);

  resetMatrix();

  translate(0, 100, 0);
  fill(0, 255, 0);
  quad(-50, -50, 0, 50, -50, 0, 50, 50, 0, -50, 50, 0);
}

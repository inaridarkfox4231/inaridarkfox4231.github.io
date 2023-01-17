// stroke gradation test.
// https://github.com/processing/p5.js/pull/5915
// https://github.com/processing/p5.js/pull/5928

// 大工事でした。今でもバグの可能性があるかもと思うと怖いねぇ。

// TESSがデフォになったやつとかあとで追加しないと

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

// ああー、isProcessingVerticesのところも書き換えないといけないのか...
// TESSがデフォ
// https://github.com/processing/p5.js/pull/5909
// ふざけたエラーを殺す
// https://github.com/processing/p5.js/pull/5910

// \nuniform bool uUseLineColor;\nuniform vec4 uMaterialColor;
// attribute vec4 aVertexColor;\n
// varying vec4 vColor;\n

// あと...

// 何を調べるんだっけ
// とりあえずこのテストではimmediateでのlineのグラデーション
// Retainedでのstrokeのグラデーション
// プリミティブのstrokeは常に単色
// とりあえずこの3つは絶対に確かめないといけないのよね

// ここの例↓ https://github.com/processing/p5.js/pull/5928

function setup() {
  createCanvas(400, 400, WEBGL)
}

function draw() {
  orbitControl()
  push()
  background(255)
  stroke(0)
  fill(200)

  push()
  translate(-100, 0)
  sphere(50)
  pop()

  push()
  translate(100, -100)
  beginShape(QUAD_STRIP)
  vertex(-20, -20)
  vertex(-20, 20)
  vertex(20, -20)
  vertex(20, 20)
  endShape()
  pop()

  push()
  translate(100, 100)
  beginShape()
  for (let i = 0; i < 30; i++) {
    const t = i/30
    vertex(20*cos(t*TWO_PI), 20*sin(t*TWO_PI))
  }
  endShape(CLOSE)
  pop()
}

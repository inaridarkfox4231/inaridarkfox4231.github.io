// stroke gradation test.

// 何を調べるんだっけ
// とりあえずこのテストではimmediateでのlineのグラデーション
// Retainedでのstrokeのグラデーション
// プリミティブのstrokeは常に単色
// とりあえずこの3つは絶対に確かめないといけないのよね

// がんばろー！
// その前に確かめよう。

function setup() {
  createCanvas(400, 400, WEBGL)
}

function draw() {
  push()
  background(255)
  stroke(0)
  fill(200)

  push()
  translate(-100, 0)
  sphere(50)
  pop()

  push()
  translate(100, 0)
  beginShape(QUADS)
  vertex(-20, -20)
  vertex(-20, 20)
  vertex(20, -20)
  vertex(20, 20)
  endShape(CLOSE)
  pop()
}

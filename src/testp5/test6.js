// stroke gradation test.

// 何を調べるんだっけ
// とりあえずこのテストではimmediateでのlineのグラデーション
// Retainedでのstrokeのグラデーション
// プリミティブのstrokeは常に単色
// とりあえずこの3つは絶対に確かめないといけないのよね

// がんばろー！
// その前に確かめよう。

function setup() {
  createCanvas(640, 640, WEBGL);
  colorMode(HSB, 100);
  strokeWeight(2);
  noFill();

  // 線のグラデーション
  translate(-160, 0, 0);
  beginShape();
  for(let i=0; i<=100; i++){
    const x = 100 * cos(i*TAU/100);
    const y = 100 * sin(i*TAU/100);
    stroke(55, 50 + 50*sin(i*TAU/100), 100);
    vertex(x, y, 0);
  }
  endShape();

  // geometryによるグラデーション
  const geom = new p5.Geometry();
  geom.vertices = [
    createVector(-100, -100, 0),
    createVector(100, -100, 0),
    createVector(100, 100, 0),
    createVector(-100, 100, 0)
  ];
  geom.edges = [[0, 1], [1, 2], [2, 3], [3, 0]];
  geom.vertexStrokeColors = [1, 1, 1, 1,  1, 0, 0, 1,  0, 1, 0, 1,  0, 0, 1, 1];
  geom._edgesToVertices();
  this._renderer.createBuffers("myStroke", geom);
  translate(320, 0, 0);
  this._renderer.drawBuffers("myStroke");

  strokeWeight(1);

  // 通常のジオメトリ（単色）
  translate(-160, 160, 0);
  stroke(5, 100, 100);
  sphere(60);
}

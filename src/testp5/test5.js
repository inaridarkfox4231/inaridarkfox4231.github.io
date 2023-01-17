// stroke gradation test.

// ここの例↓ https://github.com/processing/p5.js/issues/5926
// OKですね

function setup() {
  createCanvas(400, 400, WEBGL);
}

function draw() {
  push();
  background(255);
  stroke(0);
  fill(200);

  push();
  translate(-100, 0);
  sphere(50);
  pop();

  push();
  translate(100, 0);
  beginShape(QUADS);
  vertex(-20, -20);
  vertex(-20, 20);
  vertex(20, -20);
  vertex(20, 20);
  endShape(CLOSE);
  pop();
}

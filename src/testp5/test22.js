function setup() {
  createCanvas(400, 400, WEBGL);
  background(0);
  strokeWeight(32);
  stroke(64, 64);
  line(-100, -100, 100, -100);
  stroke(64, 64, 64);
  line(-100, 0, 100, 0);
  stroke(64, 64, 64, 64);
  line(-100, 100, 100, 100);
}

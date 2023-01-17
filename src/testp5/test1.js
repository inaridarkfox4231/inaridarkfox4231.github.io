// textAlignのテスト
// https://github.com/processing/p5.js/pull/5885

// ごめんもう修正済みだった。白だわ。まあそれはそうか。

// textAlign(*, CENTER/BOTTOM)に対するtest.

function setup() {
  createCanvas(400, 400);
  background(0);
  noStroke();
  fill(255);

  textSize(18);
  textAlign(CENTER, TOP);
  text("first\nsecond\nthird", 80, 200);
  textAlign(CENTER, BASELINE);
  text("first\nsecond\nthird", 160, 200);
  textAlign(CENTER, BOTTOM);
  text("first\nsecond\nthird", 240, 200);
  textAlign(CENTER, CENTER);
  text("first\nsecond\nthird", 320, 200);

  textSize(14);
  text("TOP", 80, 120);
  text("BASELINE", 160, 120);
  text("BOTTOM", 240, 120);
  text("CENTER", 320, 120);
  stroke(255);
  line(0,200,400,200);
}

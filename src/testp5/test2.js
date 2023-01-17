// textAlignのテスト
// https://github.com/processing/p5.js/pull/5885

// ごめんもう修正済みだった。白だわ。まあそれはそうか。

// rectMode:CENTERに対するtest.

function setup() {
  createCanvas(400, 400);
  background(0);
  noStroke();
  fill(255);
  rectMode(CENTER);

  textSize(24);
  textAlign(CENTER, BASELINE);
  text("first\nsecond\nthird\nfourth", 50, 200, 100, 400);
  textAlign(CENTER, TOP);
  text("first\nsecond\nthird\nfourth", 150, 200, 100, 400);
  textAlign(CENTER, CENTER);
  text("first\nsecond\nthird\nfourth", 250, 200, 100, 400);
  textAlign(CENTER, BOTTOM);
  text("first\nsecond\nthird\nfourth", 350, 200, 100, 400);

  noFill();
  stroke(255);
  rect(50, 200, 100, 400);
  rect(150, 200, 100, 400);
  rect(250, 200, 100, 400);
  rect(350, 200, 100, 400);
}

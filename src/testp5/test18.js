// triangle.
// UVについては雑でいいと思う
// どうせ誰も使えないそんな情報
// どうしたって歪むんだから考えるだけ時間の無駄
// それについても言及したらいいかもね

function setup(){
  createCanvas(400, 400, WEBGL);
  directionalLight(255, 255, 255, 0, 0, -1);
  ambientLight(64);
  ambientMaterial(255);
  fill(255, 128, 0);
  triangle(0, 0, 200, 0, 200, 200);
}

/*
const gr = createGraphics(200, 200);
gr.textAlign(CENTER, CENTER);
gr.textSize(50);
gr.fill(255);
gr.background(0, 128, 255);
gr.text("竜", 100, 100);
texture(gr);
*/

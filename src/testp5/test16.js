// 頂点色ライティングのテスト
// 成功です。
// どっちもグラデーションついてますね。
// 成功おめでとう。

let _gl;

function setup() {
	createCanvas(400, 400, WEBGL);
  noStroke();
}

function draw() {
	background(0);
  noStroke();

	translate(0, -100, 0);
  vertexColoredPlane();

	directionalLight(255, 255, 255, 0, 0, -1);
	ambientLight(64);
	ambientMaterial(128);

	translate(0, 200, 0);
	vertexColoredPlane();
}

function vertexColoredPlane(){
	beginShape();
  fill(255);
	vertex(-80, -80);
	fill(255, 0, 0);
	vertex(80, -80);
	fill(0, 255, 0);
	vertex(80, 80);
	fill(0, 0, 255);
	vertex(-80, 80);
	endShape();
}

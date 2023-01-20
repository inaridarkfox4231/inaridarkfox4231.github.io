// 得体のしれないmyP5JS.js
// 頼んでないのに線のグラデーションが実行されてる
// どういうことなのよ

// 多分いろいろおかしなことになってるんだと思う
// あそこ、drawBuffersいじったせいで。
// 原因は不明

// "https://inaridarkfox4231.github.io/src/p5js_1_5_0_bezier.js"
// これにしたら中央のsphereが消滅しました
// だからおそらく方向性はあってるんだけど
// 不可解な現象が起きてるので喜べません
// もうおかしくなりそう

// ベジエテストしてみる
// 簡単です
// あれ
// curFillとcurStrokeをシンプルに補間するだけ
// あの人の頭のおかしい提案ほんとは受けるつもりなかった
// 何が何でも実装する必要あったから妥協しただけ
// 頭おかしいよあいつ

function setup() {
	createCanvas(500,500,WEBGL);

	background(0);

	let gr = createGraphics(40,40);
	gr.background(255);
	image(gr, -250, -250, 40, 40);

	strokeWeight(6);
	beginShape();
	stroke(255);
	fill(255,0,0);
	vertex(-200,-200);
	stroke(0);
	fill(255,128,0);
	vertex(200,-200);
	stroke(128,128,255);
	fill(128,255,0);
	vertex(200,200);
	stroke(0,0,255);
	fill(128,255,128);
	vertex(-200,200);
	endShape(CLOSE);

	beginShape();
	stroke(255);
	fill(0);
	vertex(-200,0);
	stroke(0);
	fill(255);
	bezierVertex(-100,-100,0,100,200,0);
	endShape();

	fill(0, 0, 255);
	stroke(128);
	strokeWeight(2);
  translate(0,200);
	sphere(60);
}

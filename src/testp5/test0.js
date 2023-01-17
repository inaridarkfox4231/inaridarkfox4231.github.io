// ここでテストしてから送った方が有意義

const config = {
	useImage0: false,
	useImage1: false,
	useLight: false
}

function createGUI(){
  const gui = new lil.GUI();
  gui.add(config, "useImage0");
	gui.add(config, "useImage1");
	gui.add(config, "useLight");
}

let gr;
let gr2;
let gr3;

function setup() {
  createCanvas(640, 640, WEBGL);
	pixelDensity(1);

	noStroke();

	gr = createGraphics(256, 256);
	gr.noStroke();
	for(i=0;i<256;i++){ gr.fill(i);gr.rect(0,i,256,1); }
	gr2 = createGraphics(640, 640);
	gr2.noStroke();
	gr2.fill(255, 242, 36);
	gr2.textStyle(ITALIC);
	gr2.textAlign(RIGHT, BOTTOM);
	gr2.textSize(24);

	gr3 = createGraphics(640, 640);
	gr3.noStroke();
	for(i=0;i<320;i++){ gr3.fill(0, 0, i*128/320); gr3.rect(0,2*i,640,2); }

	createGUI();
}
function draw(){
  background(0);
	const gl = this._renderer.GL;

	if (config.useImage0) {
		image(gr3, -320, -320);
	} else {
	  gl.disable(gl.DEPTH_TEST);
	  camera(0, 0, 320*1.732, 0, 0, 0, 0, 1, 0);
	  texture(gr3);
		plane(640);
		gl.enable(gl.DEPTH_TEST);
	}

	const t = frameCount*TAU/240;
	directionalLight(255,255,255,0,0,-1);
	ambientLight(64);
	ambientMaterial(255);
	translate(-200,0,0);
	fill(255,0,0);
	rotateX(t);
	sphere(60,32);
	//plane(60);
	rotateX(-t);
	translate(200,0,0);
	fill(0,128,0);
	rotateY(t);
	torus(80,20,32);
	rotateY(-t);
	translate(200,0,0);
	texture(gr);
	rotateZ(t);
	rotateY(t);
	box(100);
	rotateY(-t);
	rotateZ(-t);
	translate(-200,0,0);

	// これを使わないとimage()のlightの影響を受けない、の部分で差が出てしまう
	if(!config.useLight){ noLights(); }

	gr2.clear();
	gr2.text("use image() for background: " + config.useImage0, 630, 570);
	gr2.text("use image() for texts: " + config.useImage1, 630, 600);
	gr2.text("draw primitives", 630, 630);

	if (config.useImage1) {
		image(gr2, -320, -320);
	} else {	gl.disable(gl.DEPTH_TEST);
	  camera(0, 0, 320*1.732, 0, 0, 0, 0, 1, 0);
	  texture(gr2);
	  plane(640);
		gl.enable(gl.DEPTH_TEST);
	}
}

/* バグ対応用の自作image関数。バリデーションサボってるのであくまで検証用。実用性はありません。 */
function myImage(img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight){
	push();

	noLights();
	texture(img);
	textureMode(NORMAL);

	var u0 = 0;
	if (sx <= img.width) {
		u0 = sx / img.width;
	}
	var u1 = 1;
	if (sx + sWidth <= img.width) {
		u1 = (sx + sWidth) / img.width;
	}
	var v0 = 0;
	if (sy <= img.height) {
		v0 = sy / img.height;
	}
	var v1 = 1;
	if (sy + sHeight <= img.height) {
		v1 = (sy + sHeight) / img.height;
	}

	const gl = this._renderer.GL;

	const depthTestIsValid = gl.getParameter(gl.DEPTH_TEST);
	const cullFaceIsValid = gl.getParameter(gl.CULL_FACE);

	gl.disable(gl.DEPTH_TEST);
	gl.disable(gl.CULL_FACE);

	this._renderer._curCamera._setDefaultCamera();

	// 消えなくなりました。ばんざい。
	// じゃあプリミティブで書き直すか...immediateの。
	// でないとUVをいじれない。
	// textureとplaneの合わせ技だと部分的にってことができないのよ。
	//translate(dx + dWidth/2, dy + dHeight/2, 0);
	//plane(dWidth, dHeight);

	// というわけでこれでいいみたいですね。いいみたいですね...
	const geom = new p5.Geometry();
	geom.vertices = [createVector(dx, dy, 0),
									 createVector(dx + dWidth, dy, 0),
									 createVector(dx + dWidth, dy + dHeight, 0),
									 createVector(dx, dy + dHeight, 0)];
	geom.faces = [[0, 1, 2], [0, 2, 3]];
	geom.uvs = [u0, v0, u1, v0, u1, v1, u0, v1];
	this._renderer.createBuffers("image", geom);
	this._renderer.drawBuffers("image");

	/*
	beginShape();
	vertex(dx, dy, 0, u0, v0);
	vertex(dx + dWidth, dy, 0, u1, v0);
	vertex(dx + dWidth, dy + dHeight, 0, u1, v1);
	vertex(dx, dy + dHeight, 0, u0, v1);
	endShape(CLOSE);
	*/

	if (depthTestIsValid) { gl.enable(gl.DEPTH_TEST); }
	if (cullFaceIsValid) { gl.enable(gl.CULL_FACE); }

	pop();
}

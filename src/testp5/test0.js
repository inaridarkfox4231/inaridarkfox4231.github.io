const config = {
	drawBackground: false,
	drawTexts: false,
	useImage0: false,
	useImage1: false
}

let myGeom1, myGeom2, myGeom3;

function createGUI(){
  const gui = new lil.GUI();
	gui.add(config, "drawBackground");
	gui.add(config, "drawTexts");
  gui.add(config, "useImage0");
	gui.add(config, "useImage1");
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

	myGeom1 = new p5.Geometry(1, 1, function() {
		this.gid = 'vertexColorTest1';
		this.vertices.push(createVector(-64, -64));
		this.vertices.push(createVector(64, -64));
		this.vertices.push(createVector(64, 64));
		this.vertices.push(createVector(-64, 64));
		this.faces.push([0, 1, 2]);
		this.faces.push([0, 2, 3]);
		this.vertexColors.push(
			200/255, 0, 0, 1,
			200/255, 0, 0, 1,
			0, 0, 200/255, 1,
			0, 0, 200/255, 1
		);
		this.computeNormals();
	});

	myGeom2 = new p5.Geometry(1, 1, function() {
		this.gid = 'vertexColorTest2';
    const v = createVector();
    const setV = (x,y,z) => v.set(x*60,y*60,z*60).copy();

    this.vertices.push(setV(-1,-1,1),setV(1,-1,1),setV(1,1,1),setV(-1,1,1),
                       setV(-1,-1,-1),setV(1,-1,-1),setV(1,1,-1),setV(-1,1,-1)
    );
    this.vertexColors.push(
      0,0,1,1, 0,1,0,1, 1,0,0,1, 1,1,1,1,
      1,1,0,1, 1,0,1,1, 0,1,1,1, 1,1,1,1
    );
    this.faces.push([0,1,2],[0,2,3],[4,7,6],[4,6,5],
                    [3,2,6],[3,6,7],[0,3,7],[0,7,4],
                    [2,1,5],[2,5,6],[1,0,4],[1,4,5]
    );
    this.computeNormals();
	});

	myGeom3 = new p5.Geometry(1, 1, function() {
		this.gid = 'vertexColorTest3';
    const v = createVector();
    const setV = (x,y,z) => v.set(x*60,y*60,z*60).copy();

    this.vertices.push(setV(-1,-1,1),setV(1,-1,1),setV(1,1,1),setV(-1,1,1),
                       setV(-1,-1,-1),setV(1,-1,-1),setV(1,1,-1),setV(-1,1,-1)
    );
    this.faces.push([0,1,2],[0,2,3],[4,7,6],[4,6,5],
                    [3,2,6],[3,6,7],[0,3,7],[0,7,4],
                    [2,1,5],[2,5,6],[1,0,4],[1,4,5]
    );
    this.computeNormals();
	});
}
function draw(){
  background(0);
	const gl = this._renderer.GL;

	if (config.drawBackground) {
		if (config.useImage0) {
			image(gr3, -320, -320);
			//myImage(gr3, -320, -320, 640, 640, 0, 0, 640, 640);
		} else {
			gl.disable(gl.DEPTH_TEST);
			camera(0, 0, 320*1.732, 0, 0, 0, 0, 1, 0);
			texture(gr3);
			plane(640);
			gl.enable(gl.DEPTH_TEST);
		}
	}
	const frag_on_bg = this._renderer._useVertexColor;

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

	const frag_on_primitive = this._renderer._useVertexColor;

	// これを描画するとフラグが立つようです。
	// これを描画して以降の、単色のplane以外のプリミティブが表示されなくなります。
	// geometryであってもあそこが空っぽだと描画されない？
	fill(0);
	translate(0, 200, 0);
	model(myGeom1);
	translate(0, -200, 0);

	// vertexColorsになんか入ってればセーフ
	fill(0);
	translate(-200, 200, 0);
	rotateY(t);
	model(myGeom2);
	rotateY(-t);
	translate(200, -200, 0);

	const frag_on_geometry = this._renderer._useVertexColor;

	// 単色のretainedが消える謎の現象が発生しています(plane以外)
	fill(255, 128, 0);
	translate(0, -200, 0);
	rotateY(t);
	box(100);
	rotateY(-t);
	translate(0, 200, 0);

	// immediateModeは常に頂点色描画なので影響ないようです
	translate(200, -200);
	fill(255, 242, 33);
	beginShape();
	vertex(-80, -80);
	vertex(80, -80);
	vertex(80, 80);
	vertex(-80, 80);
	endShape(CLOSE);
	translate(-200, 200);

	// planeは描画されるようです
	translate(-200, -200, 0);
	fill(255, 0, 255);
	plane(80);
	translate(200, 200, 0);

	// vertexColorsに何も入っていないgeometry.
	// 描画されません。仮説は正しいようです。
	translate(200, 200, 0);
	fill(42, 128 - 128*cos(t), 128 + 128*cos(t));
	rotateX(t);
	model(myGeom3);
	rotateX(-t);
	translate(-200, -200, 0);

	gr2.clear();
	gr2.text("frag on bg: " + frag_on_bg, 630, 480);
	gr2.text("frag on primitive: " + frag_on_primitive, 630, 510);
	gr2.text("frag on geometry: " + frag_on_geometry, 630, 540);
	gr2.text("use image() for background: " + config.useImage0, 630, 570);
	gr2.text("use image() for texts: " + config.useImage1, 630, 600);
	gr2.text("draw primitives", 630, 630);

	if (config.drawTexts) {
		if (config.useImage1) {
			image(gr2, -320, -320);
			//myImage(gr2, -320, -320, 640, 640, 0, 0, 640, 640);
		} else {	gl.disable(gl.DEPTH_TEST);
			camera(0, 0, 320*1.732, 0, 0, 0, 0, 1, 0);
			texture(gr2);
			plane(640);
			gl.enable(gl.DEPTH_TEST);
		}
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
	/*
	const geom = new p5.Geometry();
	geom.vertices = [createVector(dx, dy, 0),
									 createVector(dx + dWidth, dy, 0),
									 createVector(dx + dWidth, dy + dHeight, 0),
									 createVector(dx, dy + dHeight, 0)];
	geom.faces = [[0, 1, 2], [0, 2, 3]];
	geom.uvs = [u0, v0, u1, v0, u1, v1, u0, v1];
	this._renderer.createBuffers("image", geom);
	this._renderer.drawBuffers("image");
	*/

	beginShape();
	vertex(dx, dy, 0, u0, v0);
	vertex(dx + dWidth, dy, 0, u1, v0);
	vertex(dx + dWidth, dy + dHeight, 0, u1, v1);
	vertex(dx, dy + dHeight, 0, u0, v1);
	endShape(CLOSE);


	if (depthTestIsValid) { gl.enable(gl.DEPTH_TEST); }
	if (cullFaceIsValid) { gl.enable(gl.CULL_FACE); }

	pop();
}

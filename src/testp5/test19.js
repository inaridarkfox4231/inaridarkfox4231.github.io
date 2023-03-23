// _normalTriangulateのテスト
// いずれ格上げしてもらうつもり

// sayoさんの作品
// text3D: https://openprocessing.org/sketch/956215

// fork版
// p5.jsが1.5.0になった際に
// _triangulateの仕様が大幅に変更されました
// その影響で
// 従来の使い方ができなくなったので
// 従来の使い方を移植した改造版のp5.jsを用意しました
// 便利な関数なので
// 次世代に引き継ぐために
// このような次第となりました

// _normalTriangulateのテスト
// いずれ格上げしてもらうつもり

// sayoさんの作品
// text3D: https://openprocessing.org/sketch/956215

// 更新が遅いんですけど？？？？
// 20230131
// 2月になる前に復活させたいところだわね
// 更新終わりました。
// しかしどうするかな
// 格上げ...そう簡単にはいかないと思うけれど
// 便利だからなー
// あとから改造するしかないのかもしれない

const str1 = 'p5.js';
const str2 = 'abcdefghijklmnopqrstuvwxyz1234567890!?';
const n = 40;

let font;


function preload() {
	font = loadFont('https://inaridarkfox4231.github.io/assets/KosugiMaru-Regular.ttf');
}

let bg;

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	bg = createGraphics(width, height, WEBGL);
	bg.noStroke();
	bg.beginShape();
	bg.fill(0, 128, 255);
	bg.vertex(-width/2, -height/2);
	bg.vertex(width/2, -height/2);
	bg.fill(0);
	bg.vertex(width/2, height/2);
	bg.vertex(-width/2, height/2);
	bg.endShape();
}


function draw() {
	clear();
	//background(64, 192, 255);
	const gl = this._renderer.GL;
	gl.disable(gl.DEPTH_TEST);
	push();
	camera(0, 0, height*0.5*sqrt(3), 0, 0, 0, 0, 1, 0);
	image(bg, -width/2, -height/2);
	pop();
	gl.enable(gl.DEPTH_TEST);

	directionalLight(255, 255, 255, 0.5, 0.5, -1.0);
	ambientLight(64);
  ambientMaterial(255);
	orbitControl();

	noStroke();
	fill(0, 64, 128);
	const ry0 = frameCount*TAU/240;
	rotateY(ry0);
	text3D(font, str1, 200, 50, 5, 24);
	rotateY(-ry0);

	fill(32, 64, 255);
	// push～pop嫌いなのでちょっと書き換えます
	for (let i=0; i<n; i++) {
		const tx = width * (noise(i, 0) - 0.5) * 2.0;
		const ty = height * (noise(i, 1) - 0.5) * 2.0;
		const rx = millis() / 2000.0 + noise(i, 2) * 10;
		const ry = millis() / 2000.0 + noise(i, 3) * 10;
		translate(tx, ty, -500);
		rotateX(rx);
		rotateY(ry);
		text3D(font, str2[i%str2.length], 200, 50, 5, i);
		rotateY(-ry);
		rotateX(-rx);
		translate(-tx, -ty, 500);
	}
}


function text3D(font, text, size, depth, divisions, hueId, horizontal_align, vertical_align) {
	if (typeof text !== 'string') {
		text = str(text);
	}

	if (typeof horizontal_align === 'undefined') {
		horizontal_align = CENTER;
	}
	if (typeof vertical_align === 'undefined') {
		vertical_align = CENTER;
	}

	const gId = `${font}|${text}|${divisions}`;

	if (!this._renderer.geometryInHash(gId)) {
		const textGeom = new p5.Geometry();
		const bodyColor = _HSV(hueId/n, 1, 1);

		const vertices = textToVertices(font, text, 1, divisions, horizontal_align, vertical_align);
		const z1 = new p5.Vector(0, 0, 0.5);
		const z2 = new p5.Vector(0, 0, -0.5);
		let id = 0;

		// 表面・裏面
		let tesselateVertices = this._renderer._normalTriangulate(verticesToArray(vertices));
		tesselateVertices = arrayToVertices(tesselateVertices);
		tesselateVertices = verticesFilter(tesselateVertices);

		for (let i=0; i<tesselateVertices.length; i++) {
			textGeom.vertices.push(p5.Vector.add(tesselateVertices[i], z1));
			textGeom.vertexColors.push(1, 1, 1, 1);
		}
		for (let i=0; i<tesselateVertices.length; i++) {
			textGeom.vertices.push(p5.Vector.add(tesselateVertices[tesselateVertices.length-(i+1)], z2));
			textGeom.vertexColors.push(bodyColor.r, bodyColor.g, bodyColor.b, 1);
		}

		for (let i=0; i<tesselateVertices.length * 2; i+=3) {
			textGeom.faces.push([i, i+1, i+2]);
		}

		id = tesselateVertices.length * 2;

		// 側面
		for (const vers of vertices) {
			for (const ver of vers) {
				textGeom.vertices.push(p5.Vector.add(ver, z1));
				textGeom.vertices.push(p5.Vector.add(ver, z2));
				textGeom.vertexColors.push(1, 1, 1, 1);
				textGeom.vertexColors.push(bodyColor.r, bodyColor.g, bodyColor.b, 1);
			}

			let len = vers.length * 2;
			for (let i=0; i<len; i+=2) {
				textGeom.faces.push([id + i,         id + i+1,       id + (i+2)%len]);
				textGeom.faces.push([id + (i+3)%len, id + (i+2)%len, id + i+1]);
			}

			id += len;
		}

		// 法線・辺計算
		textGeom.computeNormals();
		textGeom._makeTriangleEdges()._edgesToVertices();

		// バッファ作成
		this._renderer.createBuffers(gId, textGeom);
	}

	// 描画
	this._renderer.drawBuffersScaled(gId, size, size, depth);
}


function textToVertices(font, text, size, divisions, horizontal_align, vertical_align) {
	const bounds = font.textBounds(text, 0, 0, size);

	let x, y;
	switch (horizontal_align) {
		case RIGHT:
			x = - bounds.x - bounds.w;
			break;
		case CENTER:
			x = - bounds.x - bounds.w / 2;
			break;
		case LEFT:
			x = - bounds.x;
			break;
	}
	switch (vertical_align) {
		case TOP:
			y = - bounds.y - bounds.h;
			break;
		case CENTER:
			y = - bounds.y - bounds.h / 2;
			break;
		case BOTTOM:
			y = - bounds.y;
			break;
	}

	const pdata = font.font.getPath(text, x, y, size).commands;

	let all_vertices = [];
	let vertices = [];
	let current_pos = new p5.Vector();

	for (const cmd of pdata) {
    if (cmd.type === 'M') {
			vertices = [];
			current_pos.set(cmd.x, cmd.y, 0.0);
			vertices.push(current_pos.copy());
    } else if (cmd.type === 'L') {
			if (current_pos.x == cmd.x && current_pos.y == cmd.y) continue;
			current_pos.set(cmd.x, cmd.y, 0.0);
			vertices.push(current_pos.copy());
    } else if (cmd.type === 'C') {
			for (let i=1; i<divisions; i++) {
				const x = bezierPoint(current_pos.x, cmd.x1, cmd.x2, cmd.x, i/divisions);
				const y = bezierPoint(current_pos.y, cmd.y1, cmd.y2, cmd.y, i/divisions);
				vertices.push(new p5.Vector(x, y, 0.0));
			}
      current_pos.set(cmd.x, cmd.y, 0.0);
			vertices.push(current_pos.copy());
    } else if (cmd.type === 'Q') {
			for (let i=1; i<divisions; i++) {
				const x = bezierPoint(current_pos.x, cmd.x1, cmd.x1, cmd.x, i/divisions);
				const y = bezierPoint(current_pos.y, cmd.y1, cmd.y1, cmd.y, i/divisions);
				vertices.push(new p5.Vector(x, y, 0.0));
			}
      current_pos.set(cmd.x, cmd.y, 0.0);
			vertices.push(current_pos.copy());
    } else if (cmd.type === 'Z') {
			if (current_pos.x == vertices[0].x && current_pos.y == vertices[0].y) {
				vertices.pop();
			}
      all_vertices.push(vertices);
    }
  }

	return all_vertices;
}


function verticesToArray(vertices) {
	let all_array = [];

	for (let vers of vertices) {
		let array = [];
		for (let ver of vers) {
		　array = array.concat(ver.x, ver.y, ver.z);
		}
		all_array.push(array);
	}

	return all_array;
}


function arrayToVertices(array) {
	let vertices = [];

	for (let i=0; i<array.length; i+=3) {
		vertices.push(new p5.Vector(array[i], array[i+1], array[i+2]));
	}

	return vertices;
}

function _HSV(h, s, v){
  h = constrain(h, 0, 1);
  s = constrain(s, 0, 1);
  v = constrain(v, 0, 1);
  let _r = constrain(abs(((6 * h) % 6) - 3) - 1, 0, 1);
  let _g = constrain(abs(((6 * h + 4) % 6) - 3) - 1, 0, 1);
  let _b = constrain(abs(((6 * h + 2) % 6) - 3) - 1, 0, 1);
  _r = _r * _r * (3 - 2 * _r);
  _g = _g * _g * (3 - 2 * _g);
  _b = _b * _b * (3 - 2 * _b);
  let result = {};
  result.r = v * (1 - s + s * _r);
  result.g = v * (1 - s + s * _g);
  result.b = v * (1 - s + s * _b);
  return result;
}


function verticesFilter(vertices) {
  let filtered = [];
  for (let i = 0; i < vertices.length; i += 3) {
    let ba = p5.Vector.sub(vertices[i+1], vertices[i]);
    let bc = p5.Vector.sub(vertices[i+1], vertices[i+2]);
    let cross = p5.Vector.cross(ba, bc);

    if (p5.Vector.mag(cross) != 0) {
      filtered.push(vertices[i], vertices[i+1], vertices[i+2]);
    }
  }

  return filtered;
}

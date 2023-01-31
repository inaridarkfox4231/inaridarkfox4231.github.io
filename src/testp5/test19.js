// _normalTriangulateのテスト
// いずれ格上げしてもらうつもり

// sayoさんの作品
// text3D: https://openprocessing.org/sketch/956215

const str1 = 'p5.js';
const str2 = 'abcdefghijklmnopqrstuvwxyz1234567890!?';
const n = 40;

let font;


function preload() {
	font = loadFont('https://inaridarkfox4231.github.io/assets/KosugiMaru-Regular.ttf');
}


function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
}


function draw() {
	background(250);
	directionalLight(200, 200, 200, 0.5, 0.5, -1.0);
	ambientLight(64);
  ambientMaterial(255);
	orbitControl();

	noStroke();
	fill(255, 50, 100);
	text3D(font, str1, 200, 50, 5);

	fill(255, 150, 200);
	for (let i=0; i<n; i++) {
		push();
		translate(width * (noise(i, 0) - 0.5) * 2.0, height * (noise(i, 1) - 0.5) * 2.0, -500);
		rotateX(millis() / 2000.0 + noise(i, 2) * 10);
		rotateY(millis() / 2000.0 + noise(i, 3) * 10);
		text3D(font, str2[i%str2.length], 200, 50, 5);
		pop();
	}
}


function text3D(font, text, size, depth, divisions, horizontal_align, vertical_align) {
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
		}
		for (let i=0; i<tesselateVertices.length; i++) {
			textGeom.vertices.push(p5.Vector.add(tesselateVertices[tesselateVertices.length-(i+1)], z2));
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

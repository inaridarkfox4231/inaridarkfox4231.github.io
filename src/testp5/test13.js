

let gl;

function setup() {
  createCanvas(640, 640, WEBGL);
	pixelDensity(1);
  noStroke();

  let geom = new p5.Geometry();

  const v = createVector();
  const setV = (x,y,z) => v.set(x,y,z).copy();

  geom.vertices.push(
		setV(-1,-1,1),setV(1,-1,1),setV(1,1,1),setV(-1,1,1),
    setV(-1,-1,-1),setV(1,-1,-1),setV(1,1,-1),setV(-1,1,-1)
  );
  /*
  geom.vertexColors.push(
    0,0,1,1, 0,1,0,1, 1,0,0,1, 1,1,1,1,
    1,1,0,1, 1,0,1,1, 0,1,1,1, 1,1,1,1
  );
  */
  geom.faces.push(
		[0,1,2],[0,2,3],[4,7,6],[4,6,5],
    [3,2,6],[3,6,7],[0,3,7],[0,7,4],
    [2,1,5],[2,5,6],[1,0,4],[1,4,5]
  );
  geom.computeNormals();
  this._renderer.createBuffers("myCube", geom);

	gl = this._renderer.GL;
}
function draw(){
  background(0);
	//resetMatrix();

  directionalLight(255,255,255,0,0,-1);
  ambientLight(64);
  ambientMaterial(128);

  push();
  rotateX(frameCount*TAU/240);
  rotateY(frameCount*TAU/320);

  fill(255);
  this._renderer.drawBuffersScaled("myCube", 100, 100, 100);
  pop();

	//resetMatrix();
	translate(0, 100, 0);
	fill(255);
  box(90);
	translate(0, -200, 0);
	fill(255, 128, 0);
	box(90);
	translate(100, 100, 0);
	fill(0, 128, 255);
	sphere(100);
	translate(-200, 0, 0);
	fill(40, 222, 66);
	const t = frameCount*TAU/300;
	rotateX(t);
	torus(90, 12);
	rotateX(-t);
}

// こういうの用意するとインデックス考えるのが楽になります
/*
上面：0----1    側面：3---2   2---1
      3----2          7---6   6---5
下面：4----5    側面：0---3   1---0
      7----6          4---7   5---4
*/

// モデル消滅バグを調べるテスト（スマホ版）
// いくつかのモデルを用意する

// はい。見事！
// geom0とgeom1が消えました。

let noLoopFlag = false;

let _gl, gl;

function setup() {
  createCanvas(640, 640, WEBGL);
  _gl = this._renderer;
  gl = _gl.GL;

  prepareCubeGeom("geom0");
  prepareCubeGeom("geom1");

  preparePlaneGeom("geom2");
  preparePlaneGeom("geom3");

  noStroke();
}

function draw() {
  background(99, 77, 33);

  const t = frameCount*TAU/480;

  directionalLight(255, 255, 255, 0, 0, -1);
  ambientLight(64);
  ambientMaterial(255);

  fill(255);
  drawGeom("geom2", -100, -100, 60, t);

  fill(255, 128, 0);
  drawGeom("geom3", 100, -100, 60, t);

  fill(128, 128, 255);
  drawPlane(0, 0, 60, t);

  fill(0, 128, 255);
  drawGeom("geom0", 100, 100, 60, t);

  fill(44, 199, 44);
  drawGeom("geom1", -100, 100, 60, t);

  if (noLoopFlag) { noLoop(); }
}

function prepareCubeGeom(name){
  const v = createVector();
  const setV = (x,y,z) => v.set(x,y,z).copy();

  const geom = new p5.Geometry();

  geom.vertices.push(
    setV(-1,-1,1),setV(1,-1,1),setV(1,1,1),setV(-1,1,1),
    setV(-1,-1,-1),setV(1,-1,-1),setV(1,1,-1),setV(-1,1,-1)
  );
  geom.faces.push(
    [0,1,2],[0,2,3],[4,7,6],[4,6,5],
    [3,2,6],[3,6,7],[0,3,7],[0,7,4],
    [2,1,5],[2,5,6],[1,0,4],[1,4,5]
  );
  geom.computeNormals();
  _gl.createBuffers(name, geom);
}

function preparePlaneGeom(name){
  const v = createVector();
  const setV = (x,y,z) => v.set(x,y,z).copy();

  const geom = new p5.Geometry();

  geom.vertices.push(
    setV(-1,-1,0),setV(1,-1,0),setV(1,1,0),setV(-1,1,0)
  );
  geom.faces.push([0,1,2],[0,2,3]);

  geom.computeNormals();
  _gl.createBuffers(name, geom);
}

function drawGeom(name, x, y, s, rotation = 0){
  translate(x, y, 0);
  rotateX(rotation);
  rotateY(rotation);
  _gl.drawBuffersScaled(name, s, s, s);
  rotateY(-rotation);
  rotateX(-rotation);
  translate(-x, -y, 0);
}

function drawPlane(x, y, s, rotation = 0){
  translate(x, y, 0);
  rotateX(rotation);
  rotateY(rotation);
  plane(s);
  rotateY(-rotation);
  rotateX(-rotation);
  translate(-x, -y, 0);
}

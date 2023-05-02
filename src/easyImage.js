// image()を使いやすくするためのパッチ
// 却下されたのでパッチ化しました。
// image()使いやすくしたいので。

p5.RendererGL.prototype.image = function (img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
  if (this._isErasing) {
    this.blendMode(this._cachedBlendMode);
  }
  this._pInst.push();
  this._pInst.noLights();
  this._pInst.noStroke();
  this._pInst.texture(img);
  this._pInst.textureMode(NORMAL);
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

  // デプスとカリングを一時的に殺す
  const gl = this.GL;
  const depthTestIsEnable = gl.getParameter(gl.DEPTH_TEST);
  const cullFaceIsEnable = gl.getParameter(gl.CULL_FACE);
	const mode = [ADD, SCREEN, MULTIPLY, OVERLAY, SOFT_LIGHT, HARD_LIGHT];
	// ambientModeがADDでないといけない。こういう問題が発生するわけだ。難しいね.....
	// image関数が、noLights()であるにも関わらずライティングシェーダを使っていることが問題なのです。
	// それはおかしいので。
	// だから別のシェーダ、カスタムシェーダを用意してそれを使わせればいいんだよな。
	// 今は暫定的にこの処理でいいけど。いずれ、何とかしましょう。
	// そうすればカメラをいじる必要もなくなるはず...
	const currentAmbientMode = (this.ambientMode !== undefined ? mode[this.ambientMode] : undefined);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  // カメラをデフォルトにする
  this._curCamera._setDefaultCamera();

  this.beginShape();
  this.vertex(dx, dy, 0, u0, v0);
  this.vertex(dx + dWidth, dy, 0, u1, v0);
  this.vertex(dx + dWidth, dy + dHeight, 0, u1, v1);
  this.vertex(dx, dy + dHeight, 0, u0, v1);
  this.endShape(CLOSE);

  // 戻す
  if (depthTestIsEnable) { gl.enable(gl.DEPTH_TEST); }
  if (cullFaceIsEnable) { gl.enable(gl.CULL_FACE); }
	if (currentAmbientMode !== undefined) { ambientMode(currentAmbientMode); }

  this._pInst.pop();
  if (this._isErasing) {
    this.blendMode(REMOVE);
  }
};

p5.Camera.prototype.copy = function () {
  var _cam = new p5.Camera(this._renderer);
  _cam.cameraFOV = this.cameraFOV;
  _cam.aspectRatio = this.aspectRatio;
  _cam.eyeX = this.eyeX;
  _cam.eyeY = this.eyeY;
  _cam.eyeZ = this.eyeZ;
  _cam.centerX = this.centerX;
  _cam.centerY = this.centerY;
  _cam.centerZ = this.centerZ;
  _cam.cameraNear = this.cameraNear;
  _cam.cameraFar = this.cameraFar;
  _cam.cameraType = this.cameraType;
  _cam.cameraMatrix = this.cameraMatrix.copy();
  _cam.projMatrix = this.projMatrix.copy();

  // コピーされたカメラがデフォルトの情報を持っていないのはバグです。
  // push()の際にコピーされたカメラが取り置きされるんだけどそのときにデフォルト情報が
  // 抜け落ちる、それを防ぐ。
  _cam._computeCameraDefaultSettings();
  return _cam;
};

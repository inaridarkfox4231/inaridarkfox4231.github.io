// GitHubから持ってきました
// 書き換え終えたら元に戻す...

// change log: 2023-05-23
// verticalをnormalizeする必要は無いので修正
// camPhiの計算にangleBetweenを使用
// camPhiとcamThetaを最初から定数で用意
// 整合性を考えて順序変更
// その他、いくつかのコメントを修正
// 承認されました！！！！！🎉🎉🎉

// 軽微なバグ修正
// angleBetween()の使用をやめて従来の計算方法に戻しました。

// 修正1：マウスが外にあるときキャンセルする処理をカット
// 修正2：pointersInCanvasを用意
// 修正3：touchで計算
// 修正4：touchに関するインタラクションの開始終了を定義
// 修正5：マウスについても同様に
// 修正6：フラグ処理をいじる。
// 修正7：名前をexecuteZoomとexecuteRotateAndMoveにした方がいい？
// 字数の問題があるから長い名前は避けたいんだけど。

// 2023-06-04
// マウスダウンしたまま外に出すと止まるバグを修正
// オプションを追加（freeRotation:trueでEasyCamのような挙動になる）
// これで一応完成です

p5.prototype.orbitControl = function(
  sensitivityX,
  sensitivityY,
  sensitivityZ,
  options
) {
  this._assert3d('orbitControl');
  // 引数の個数に関するチェックが通らないので。まあぶっちゃけこの処理要るのか？って感じだけどね...
  // Three.jsとかはやってないと思う
  //p5._validateParameters('orbitControl', arguments);

  if (this._renderer.prevTouches === undefined) {
    this._renderer.prevTouches = [];
  }
  if (this._renderer.zoomVelocity === undefined) {
    this._renderer.zoomVelocity = 0;
  }
  if (this._renderer.rotateVelocity === undefined) {
    this._renderer.rotateVelocity = createVector(0, 0);
  }
  if (this._renderer.moveVelocity === undefined) {
    this._renderer.moveVelocity = createVector(0, 0);
  }
  if (this._renderer.executeRotateAndMove === undefined) {
    this._renderer.executeRotateAndMove = false;
  }
  if (this._renderer.executeZoom === undefined) {
    this._renderer.executeZoom = false;
  }

  const cam = this._renderer._curCamera;

  if (typeof sensitivityX === 'undefined') {
    sensitivityX = 1;
  }
  if (typeof sensitivityY === 'undefined') {
    sensitivityY = sensitivityX;
  }
  if (typeof sensitivityZ === 'undefined') {
    sensitivityZ = 1;
  }
  if (typeof options !== 'object') {
    options = {};
  }

  // default right-mouse and mouse-wheel behaviors (context menu and scrolling,
  // respectively) are disabled here to allow use of those events for panning and
  // zooming. However, whether or not to disable touch actions is an option.

  // disable context menu for canvas element and add 'contextMenuDisabled'
  // flag to p5 instance
  if (this.contextMenuDisabled !== true) {
    this.canvas.oncontextmenu = () => false;
    this._setProperty('contextMenuDisabled', true);
  }

  // disable default scrolling behavior on the canvas element and add
  // 'wheelDefaultDisabled' flag to p5 instance
  if (this.wheelDefaultDisabled !== true) {
    this.canvas.onwheel = () => false;
    this._setProperty('wheelDefaultDisabled', true);
  }

  // disable default touch behavior on the canvas element and add
  // 'touchActionsDisabled' flag to p5 instance
  const { disableTouchActions = true } = options;
  if (this.touchActionsDisabled !== true && disableTouchActions) {
    this.canvas.style['touch-action'] = 'none';
    this._setProperty('touchActionsDisabled', true);
  }

  // If option.freeRotation is true, the camera always rotates freely in the direction
  // the pointer moves. default value is false (normal behavior)
  const { freeRotation = false } = options;

  // get moved touches.
  const movedTouches = [];

  this.touches.forEach(curTouch => {
    this._renderer.prevTouches.forEach(prevTouch => {
      if (curTouch.id === prevTouch.id) {
        const movedTouch = {
          x: curTouch.x,
          y: curTouch.y,
          px: prevTouch.x,
          py: prevTouch.y
        };
        movedTouches.push(movedTouch);
      }
    });
  });

  this._renderer.prevTouches = this.touches;

  // The idea of using damping is based on the following website. thank you.
  // https://github.com/freshfork/p5.EasyCam/blob/9782964680f6a5c4c9bee825c475d9f2021d5134/p5.easycam.js#L1124

  // variables for interaction
  let deltaRadius = 0;
  let deltaTheta = 0;
  let deltaPhi = 0;
  let moveDeltaX = 0;
  let moveDeltaY = 0;
  // constants for dampingProcess
  const damping = 0.85;
  const rotateAccelerationFactor = 0.6;
  const moveAccelerationFactor = 0.15;
  // For touches, the appropriate scale is different
  // because the distance difference is multiplied.
  const mouseZoomScaleFactor = 0.0001;
  const touchZoomScaleFactor = 0.0004;
  const scaleFactor = this.height < this.width ? this.height : this.width;
  // Flag whether the mouse or touch pointer is inside the canvas
  let pointersInCanvas = false;

  // calculate and determine flags and variables.
  if (movedTouches.length > 0) {
    /* for touch */
    // if length === 1, rotate
    // if length > 1, zoom and move

    // for touch, it is calculated based on one moved touch pointer position.
    pointersInCanvas =
      movedTouches[0].x > 0 && movedTouches[0].x < this.width &&
      movedTouches[0].y > 0 && movedTouches[0].y < this.height;

    if (movedTouches.length === 1) {
      const t = movedTouches[0];
      deltaTheta = -sensitivityX * (t.x - t.px) / scaleFactor;
      deltaPhi = sensitivityY * (t.y - t.py) / scaleFactor;
    } else {
      const t0 = movedTouches[0];
      const t1 = movedTouches[1];
      const distWithTouches = Math.hypot(t0.x - t1.x, t0.y - t1.y);
      const prevDistWithTouches = Math.hypot(t0.px - t1.px, t0.py - t1.py);
      const changeDist = distWithTouches - prevDistWithTouches;
      // move the camera farther when the distance between the two touch points
      // decreases, move the camera closer when it increases.
      deltaRadius = -changeDist * sensitivityZ * touchZoomScaleFactor;
      // Move the center of the camera along with the movement of
      // the center of gravity of the two touch points.
      moveDeltaX = 0.5 * (t0.x + t1.x) - 0.5 * (t0.px + t1.px);
      moveDeltaY = 0.5 * (t0.y + t1.y) - 0.5 * (t0.py + t1.py);
    }
    if (this.touches.length > 0) {
      if (pointersInCanvas) {
        // Initiate an interaction if touched in the canvas
        this._renderer.executeRotateAndMove = true;
        this._renderer.executeZoom = true;
      }
    } else {
      // End an interaction when the touch is released
      this._renderer.executeRotateAndMove = false;
      this._renderer.executeZoom = false;
    }
  } else {
    /* for mouse */
    // if wheelDeltaY !== 0, zoom
    // if mouseLeftButton is down, rotate
    // if mouseRightButton is down, move

    // For mouse, it is calculated based on the mouse position.
    pointersInCanvas =
      (this.mouseX > 0 && this.mouseX < this.width) &&
      (this.mouseY > 0 && this.mouseY < this.height);

    if (this._mouseWheelDeltaY !== 0) {
      // zoom the camera depending on the value of _mouseWheelDeltaY.
      // move away if positive, move closer if negative
      deltaRadius = this._mouseWheelDeltaY * sensitivityZ;
      deltaRadius *= mouseZoomScaleFactor;
      this._mouseWheelDeltaY = 0;
      // start zoom when the mouse is wheeled within the canvas.
      if (pointersInCanvas) this._renderer.executeZoom = true;
    } else {
      // quit zoom when you stop wheeling.
      this._renderer.zoomFlag = false;
    }
    if (this.mouseIsPressed) {
      if (this.mouseButton === this.LEFT) {
        deltaTheta = -sensitivityX * this.movedX / scaleFactor;
        deltaPhi = sensitivityY * this.movedY / scaleFactor;
      } else if (this.mouseButton === this.RIGHT) {
        moveDeltaX = this.movedX;
        moveDeltaY = this.movedY;
      }
      // start rotate and move when mouse is pressed within the canvas.
      if (pointersInCanvas) this._renderer.executeRotateAndMove = true;
    } else {
      // quit rotate and move if mouse is released.
      this._renderer.executeRotateAndMove = false;
    }
  }

  // interactions

  // zoom process
  if (deltaRadius !== 0 && this._renderer.executeZoom) {
    // accelerate zoom velocity
    this._renderer.zoomVelocity += deltaRadius;
  }
  if (Math.abs(this._renderer.zoomVelocity) > 0.001) {
    // if freeRotation is true, we use _orbitFree() instead of _orbit()
    if (freeRotation) {
      this._renderer._curCamera._orbitFree(
        0, 0, this._renderer.zoomVelocity
      );
    } else {
      this._renderer._curCamera._orbit(
        0, 0, this._renderer.zoomVelocity
      );
    }
    // In orthogonal projection, the scale does not change even if
    // the distance to the gaze point is changed, so the projection matrix
    // needs to be modified.
    if (this._renderer.uPMatrix.mat4[15] !== 0) {
      this._renderer.uPMatrix.mat4[0] *= Math.pow(
        10, -this._renderer.zoomVelocity
      );
      this._renderer.uPMatrix.mat4[5] *= Math.pow(
        10, -this._renderer.zoomVelocity
      );
    }
    // damping
    this._renderer.zoomVelocity *= damping;
  } else {
    this._renderer.zoomVelocity = 0;
  }

  // rotate process
  if ((deltaTheta !== 0 || deltaPhi !== 0) &&
  this._renderer.executeRotateAndMove) {
    // accelerate rotate velocity
    this._renderer.rotateVelocity.add(
      deltaTheta * rotateAccelerationFactor,
      deltaPhi * rotateAccelerationFactor
    );
  }
  if (this._renderer.rotateVelocity.magSq() > 0.000001) {
    // if freeRotation is true, the camera always rotates freely in the direction the pointer moves
    if (freeRotation) {
      this._renderer._curCamera._orbitFree(
        -this._renderer.rotateVelocity.x,
        this._renderer.rotateVelocity.y,
        0
      );
    } else {
      this._renderer._curCamera._orbit(
        this._renderer.rotateVelocity.x,
        this._renderer.rotateVelocity.y,
        0
      );
    }
    // damping
    this._renderer.rotateVelocity.mult(damping);
  } else {
    this._renderer.rotateVelocity.set(0, 0);
  }

  // move process
  if ((moveDeltaX !== 0 || moveDeltaY !== 0) &&
  this._renderer.executeRotateAndMove) {
    // Normalize movement distance
    const ndcX = moveDeltaX * 2/this.width;
    const ndcY = -moveDeltaY * 2/this.height;
    // accelerate move velocity
    this._renderer.moveVelocity.add(
      ndcX * moveAccelerationFactor,
      ndcY * moveAccelerationFactor
    );
  }
  if (this._renderer.moveVelocity.magSq() > 0.000001) {
    // Translate the camera so that the entire object moves
    // perpendicular to the line of sight when the mouse is moved
    // or when the centers of gravity of the two touch pointers move.
    var local = cam._getLocalAxes();

    // Calculate the z coordinate in the view coordinates of
    // the center, that is, the distance to the view point
    const diffX = cam.eyeX - cam.centerX;
    const diffY = cam.eyeY - cam.centerY;
    const diffZ = cam.eyeZ - cam.centerZ;
    const viewZ = Math.sqrt(diffX * diffX + diffY * diffY + diffZ * diffZ);

    // position vector of the center.
    let cv = new p5.Vector(cam.centerX, cam.centerY, cam.centerZ);

    // Calculate the normalized device coordinates of the center.
    cv = cam.cameraMatrix.multiplyPoint(cv);
    cv = this._renderer.uPMatrix.multiplyAndNormalizePoint(cv);

    // Move the center by this distance
    // in the normalized device coordinate system.
    cv.x -= this._renderer.moveVelocity.x;
    cv.y -= this._renderer.moveVelocity.y;

    // Calculate the translation vector
    // in the direction perpendicular to the line of sight of center.
    let dx, dy;
    const uP = this._renderer.uPMatrix.mat4;

    if (uP[15] === 0) {
      dx = ((uP[8] + cv.x)/uP[0]) * viewZ;
      dy = ((uP[9] + cv.y)/uP[5]) * viewZ;
    } else {
      dx = (cv.x - uP[12])/uP[0];
      dy = (cv.y - uP[13])/uP[5];
    }

    // translate the camera.
    cam.setPosition(
      cam.eyeX + dx * local.x[0] + dy * local.y[0],
      cam.eyeY + dx * local.x[1] + dy * local.y[1],
      cam.eyeZ + dx * local.x[2] + dy * local.y[2]
    );
    // damping
    this._renderer.moveVelocity.mult(damping);
  } else {
    this._renderer.moveVelocity.set(0, 0);
  }

  return this;
};

// ------------------------------------------------------------------- //
// _orbitFree.

// dx, dyの方向に回転させる感じです。
// frontが画面真正面向き、sideがその右方向。この2つを外積して...
// 正規直交基底ができますね。sideとverticalはそれぞれマウスのx,y軸の
// 正の方向に一致していますので、dxとdyにマイナスの付いてない値が入れば...
p5.Camera.prototype._orbitFree = function(dx, dy, dRadius) {
  // Calculate the vector and its magnitude from the center to the viewpoint
  const diffX = this.eyeX - this.centerX;
  const diffY = this.eyeY - this.centerY;
  const diffZ = this.eyeZ - this.centerZ;
  let camRadius = Math.hypot(diffX, diffY, diffZ);
  // front vector. unit vector from center to eye.
  const front = new p5.Vector(diffX, diffY, diffZ).normalize();
  // up vector. camera's up vector.
  const up = new p5.Vector(this.upX, this.upY, this.upZ);
  // side vector. Right when viewed from the front. (like x-axis)
  const side = new p5.Vector.cross(up, front).normalize();
  // down vector. Bottom when viewed from the front. (like y-axis)
  const down = new p5.Vector.cross(front, side);

  // side vector and down vector are no longer used as-is.
  // Create a vector representing the direction of rotation
  // in the form cos(direction)*side + sin(direction)*down.
  // Make the current side vector into this.
  const directionAngle = Math.atan2(dy, dx);
  down.mult(Math.sin(directionAngle));
  side.mult(Math.cos(directionAngle)).add(down);
  // The amount of rotation is the size of the vector (dx, dy).
  const rotAngle = Math.sqrt(dx*dx + dy*dy);
  // The vector that is orthogonal to both the front vector and
  // the rotation direction vector is the rotation axis vector.
  const axis = new p5.Vector.cross(front, side);

  // update camRadius
  camRadius *= Math.pow(10, dRadius);
  // prevent zooming through the center:
  if (camRadius < this.cameraNear) {
    camRadius = this.cameraNear;
  }
  if (camRadius > this.cameraFar) {
    camRadius = this.cameraFar;
  }

  // If the axis vector is likened to the z-axis, the front vector is
  // the x-axis and the side vector is the y-axis. Rotate the up and front
  // vectors respectively by thinking of them as rotations around the z-axis.

  // Calculate the components by taking the dot product and
  // calculate a rotation based on that.
  const c = Math.cos(rotAngle);
  const s = Math.sin(rotAngle);
  const dotFront = up.dot(front);
  const dotSide = up.dot(side);
  const ux = dotFront * c + dotSide * s;
  const uy = -dotFront * s + dotSide * c;
  const uz = up.dot(axis);
  up.x = ux * front.x + uy * side.x + uz * axis.x;
  up.y = ux * front.y + uy * side.y + uz * axis.y;
  up.z = ux * front.z + uy * side.z + uz * axis.z;
  // We won't be using the side vector and the front vector anymore,
  // so let's make the front vector into the vector from the center to the new eye.
  side.mult(-s);
  front.mult(c).add(side).mult(camRadius);

  // it's complete. let's update camera.
  this.camera(
    front.x + this.centerX,
    front.y + this.centerY,
    front.z + this.centerZ,
    this.centerX, this.centerY, this.centerZ,
    up.x, up.y, up.z
  );
}

p5.Camera.prototype._orbit = function(dTheta, dPhi, dRadius) {
  // Calculate the vector and its magnitude from the center to the viewpoint
  const diffX = this.eyeX - this.centerX;
  const diffY = this.eyeY - this.centerY;
  const diffZ = this.eyeZ - this.centerZ;
  let camRadius = Math.hypot(diffX, diffY, diffZ);
  // front vector. unit vector from center to eye.
  const front = new p5.Vector(diffX, diffY, diffZ).normalize();
  // up vector. normalized camera's up vector.
  const up = new p5.Vector(this.upX, this.upY, this.upZ).normalize(); // y-axis
  // side vector. Right when viewed from the front
  const side = new p5.Vector.cross(up, front).normalize(); // x-axis
  // vertical vector. normalized vector of projection of front vector.
  const vertical = new p5.Vector.cross(side, up); // z-axis

  // update camRadius
  camRadius *= Math.pow(10, dRadius);
  // prevent zooming through the center:
  if (camRadius < this.cameraNear) {
    camRadius = this.cameraNear;
  }
  if (camRadius > this.cameraFar) {
    camRadius = this.cameraFar;
  }

  // calculate updated camera angle
  // Find the angle between the "up" and the "front", add dPhi to that.
  // angleBetween() may return negative value. Since this specification is subject to change
  // due to version updates, it cannot be adopted, so here we calculate using a method
  // that directly obtains the absolute value.
  const camPhi =
    Math.acos(Math.max(-1, Math.min(1, p5.Vector.dot(front, up)))) + dPhi;
  // Rotate by dTheta in the shortest direction from "vertical" to "side"
  const camTheta = dTheta;

  // Invert camera's upX, upY, upZ if dPhi is below 0 or above PI
  if(camPhi <= 0 || camPhi >= Math.PI){
    this.upX *= -1;
    this.upY *= -1;
    this.upZ *= -1;
  }

  // update eye vector by calculate new front vector
  up.mult(Math.cos(camPhi));
  vertical.mult(Math.cos(camTheta) * Math.sin(camPhi));
  side.mult(Math.sin(camTheta) * Math.sin(camPhi));

  front.set(up).add(vertical).add(side);

  this.eyeX = camRadius * front.x + this.centerX;
  this.eyeY = camRadius * front.y + this.centerY;
  this.eyeZ = camRadius * front.z + this.centerZ;

  // update camera
  this.camera(
    this.eyeX, this.eyeY, this.eyeZ,
    this.centerX, this.centerY, this.centerZ,
    this.upX, this.upY, this.upZ
  );
};

p5.Camera.prototype.ortho = function (left, right, bottom, top, near, far) {
  if (left === undefined) left = -this._renderer.width / 2;
  if (right === undefined) right = +this._renderer.width / 2;
  if (bottom === undefined) bottom = -this._renderer.height / 2;
  if (top === undefined) top = this._renderer.height / 2;
  if (near === undefined) near = 0;
  if (far === undefined) far = Math.max(this._renderer.width, this._renderer.height);

  this.cameraNear = near;
  this.cameraFar = far;

  var w = right - left;
  var h = top - bottom;
  var d = far - near;
  var x = + 2 / w;
  var y = + 2 / h;
  var z = - 2 / d;
  var tx = - (right + left) / w;
  var ty = - (top + bottom) / h;
  var tz = - (far + near) / d;
  this.projMatrix = p5.Matrix.identity();
  /* eslint-disable indent */
  this.projMatrix.set(x, 0, 0, 0, 0, -y, 0, 0, 0, 0, z, 0, tx, ty, tz, 1);
  /* eslint-enable indent */
  if (this._isActive()) {
    this._renderer.uPMatrix.set(this.projMatrix.mat4[0], this.projMatrix.mat4[1], this.projMatrix.mat4[2], this.projMatrix.mat4[3], this.projMatrix.mat4[4], this.projMatrix.mat4[5], this.projMatrix.mat4[6], this.projMatrix.mat4[7], this.projMatrix.mat4[8], this.projMatrix.mat4[9], this.projMatrix.mat4[10], this.projMatrix.mat4[11], this.projMatrix.mat4[12], this.projMatrix.mat4[13], this.projMatrix.mat4[14], this.projMatrix.mat4[15]);
  }
  this.cameraType = 'custom';
};

p5.Camera.prototype.frustum = function (left, right, bottom, top, near, far) {
  if (left === undefined) left = -this._renderer.width * 0.05;
  if (right === undefined) right = +this._renderer.width * 0.05;
  if (bottom === undefined) bottom = +this._renderer.height * 0.05;
  if (top === undefined) top = -this._renderer.height * 0.05;
  if (near === undefined) near = this.defaultCameraNear;
  if (far === undefined) far = this.defaultCameraFar;

  this.cameraNear = near;
  this.cameraFar = far;

  var w = right - left;
  var h = top - bottom;
  var d = far - near;
  var x = + (2 * near) / w;
  var y = + (2 * near) / h;
  var z = - (2 * far * near) / d;
  var tx = (right + left) / w;
  var ty = (top + bottom) / h;
  var tz = - (far + near) / d;
  this.projMatrix = p5.Matrix.identity();
  /* eslint-disable indent */
  this.projMatrix.set(x, 0, 0, 0, 0, -y, 0, 0, tx, ty, tz, - 1, 0, 0, z, 0);
  /* eslint-enable indent */
  if (this._isActive()) {
    this._renderer.uPMatrix.set(this.projMatrix.mat4[0], this.projMatrix.mat4[1], this.projMatrix.mat4[2], this.projMatrix.mat4[3], this.projMatrix.mat4[4], this.projMatrix.mat4[5], this.projMatrix.mat4[6], this.projMatrix.mat4[7], this.projMatrix.mat4[8], this.projMatrix.mat4[9], this.projMatrix.mat4[10], this.projMatrix.mat4[11], this.projMatrix.mat4[12], this.projMatrix.mat4[13], this.projMatrix.mat4[14], this.projMatrix.mat4[15]);
  }
  this.cameraType = 'custom';
};

p5.Matrix.prototype.multiplyVec4 = function(x, y, z, w) {
  const result = new Array(4);

  result[0] = this.mat4[0] * x + this.mat4[4] * y + this.mat4[8] * z + this.mat4[12] * w;
  result[1] = this.mat4[1] * x + this.mat4[5] * y + this.mat4[9] * z + this.mat4[13] * w;
  result[2] = this.mat4[2] * x + this.mat4[6] * y + this.mat4[10] * z + this.mat4[14] * w;
  result[3] = this.mat4[3] * x + this.mat4[7] * y + this.mat4[11] * z + this.mat4[15] * w;

  return result;
};

p5.Matrix.prototype.multiplyPoint = function(v) {
  const array = this.multiplyVec4(v.x, v.y, v.z, 1);
  return new p5.Vector(array[0], array[1], array[2]);
};

p5.Matrix.prototype.multiplyAndNormalizePoint = function(v) {
  const array = this.multiplyVec4(v.x, v.y, v.z, 1);
  array[0] /= array[3];
  array[1] /= array[3];
  array[2] /= array[3];
  return new p5.Vector(array[0], array[1], array[2]);
};

p5.Matrix.prototype.multiplyDirection = function(v) {
  const array = this.multiplyVec4(v.x, v.y, v.z, 0);
  return new p5.Vector(array[0], array[1], array[2]);
};

// copy()がupX,upY,upZをコピーしない致命的なバグがあったので修正します
p5.Camera.prototype.copy = function() {
  const _cam = new p5.Camera(this._renderer);
  _cam.cameraFOV = this.cameraFOV;
  _cam.aspectRatio = this.aspectRatio;
  _cam.eyeX = this.eyeX;
  _cam.eyeY = this.eyeY;
  _cam.eyeZ = this.eyeZ;
  _cam.centerX = this.centerX;
  _cam.centerY = this.centerY;
  _cam.centerZ = this.centerZ;
  _cam.upX = this.upX;
  _cam.upY = this.upY;
  _cam.upZ = this.upZ;
  _cam.cameraNear = this.cameraNear;
  _cam.cameraFar = this.cameraFar;

  _cam.cameraType = this.cameraType;

  _cam.cameraMatrix = this.cameraMatrix.copy();
  _cam.projMatrix = this.projMatrix.copy();

  return _cam;
};

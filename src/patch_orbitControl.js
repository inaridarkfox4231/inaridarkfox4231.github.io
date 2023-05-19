// GitHubから持ってきました
// 書き換え終えたら元に戻す...

p5.prototype.orbitControl = function(
  sensitivityX,
  sensitivityY,
  sensitivityZ,
  options
) {
  this._assert3d('orbitControl');
  p5._validateParameters('orbitControl', arguments);

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

  // If the mouse is not in bounds of the canvas, disable all behaviors:
  const mouseInCanvas =
    this.mouseX < this.width &&
    this.mouseX > 0 &&
    this.mouseY < this.height &&
    this.mouseY > 0;
  if (!mouseInCanvas) return;

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

  // get moved touches.
  const movedTouches = [];
  for(let i = 0; i < this.touches.length; i++){
    const curTouch = this.touches[i];
    for(let k=0; k < this._renderer.prevTouches.length; k++){
      const prevTouch = this._renderer.prevTouches[k];
      if(curTouch.id === prevTouch.id){
        const movedTouch = {
          x: curTouch.x,
          y: curTouch.y,
          px: prevTouch.x,
          py: prevTouch.y
        };
        movedTouches.push(movedTouch);
      }
    }
  }
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

  // calculate and determine flags and variables.
  if (movedTouches.length > 0) {
    /* for touch */
    // if length === 1, rotate
    // if length > 1, zoom and move
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
  } else {
    /* for mouse */
    // if wheelDeltaY !== 0, zoom
    // if mouseLeftButton is down, rotate
    // if mouseRightButton is down, move
    if (this._mouseWheelDeltaY !== 0) {
      // zoom the camera depending on the value of _mouseWheelDeltaY.
      // move away if positive, move closer if negative
      deltaRadius = this._mouseWheelDeltaY * sensitivityZ;
      deltaRadius *= mouseZoomScaleFactor;
      this._mouseWheelDeltaY = 0;
    }
    if (this.mouseIsPressed) {
      if (this.mouseButton === this.LEFT) {
        deltaTheta = -sensitivityX * (this.mouseX - this.pmouseX) / scaleFactor;
        deltaPhi = sensitivityY * (this.mouseY - this.pmouseY) / scaleFactor;
      } else if (this.mouseButton === this.RIGHT) {
        moveDeltaX = this.mouseX - this.pmouseX;
        moveDeltaY = this.mouseY - this.pmouseY;
      }
    }
  }

  // interactions

  // zoom process
  if (deltaRadius !== 0) {
    // accelerate zoom velocity
    this._renderer.zoomVelocity += deltaRadius;
  }
  if (Math.abs(this._renderer.zoomVelocity) > 0.001) {
    this._renderer._curCamera._orbit(0, 0, this._renderer.zoomVelocity);
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
  if (deltaTheta !== 0 || deltaPhi !== 0) {
    // accelerate rotate velocity
    this._renderer.rotateVelocity.add(
      deltaTheta * rotateAccelerationFactor,
      deltaPhi * rotateAccelerationFactor,
      0
    );
  }
  if (this._renderer.rotateVelocity.mag() > 0.001) {
    this._renderer._curCamera._orbit(
      this._renderer.rotateVelocity.x,
      this._renderer.rotateVelocity.y,
      0
    );
    // damping
    this._renderer.rotateVelocity.mult(damping);
  } else {
    this._renderer.rotateVelocity.set(0, 0);
  }

  // move process
  if (moveDeltaX !== 0 || moveDeltaY !== 0) {
    // Normalize movement distance
    const ndcX = moveDeltaX * 2/this.width;
    const ndcY = -moveDeltaY * 2/this.height;
    // accelerate move velocity
    this._renderer.moveVelocity.add(
      ndcX * moveAccelerationFactor,
      ndcY * moveAccelerationFactor
    );
  }
  if (this._renderer.moveVelocity.mag() > 0.001) {
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

p5.Camera.prototype._orbit = function (dTheta, dPhi, dRadius) {
  var diffX = this.eyeX - this.centerX;
  var diffY = this.eyeY - this.centerY;
  var diffZ = this.eyeZ - this.centerZ;
  // get spherical coorinates for current camera position about origin
  var camRadius = Math.sqrt(diffX * diffX + diffY * diffY + diffZ * diffZ); // from https://github.com/mrdoob/three.js/blob/dev/src/math/Spherical.js#L72-L73
  var camTheta = Math.atan2(diffX, diffZ);
  // equatorial angle
  var camPhi = Math.acos(Math.max( - 1, Math.min(1, diffY / camRadius))); // polar angle
  var newUpY = this.upY > 0 ? 1 : - 1;
  // add change according to the direction of newupY
  camTheta += newUpY * dTheta;
  camPhi += newUpY * dPhi;
  // if camPhi becomes >= PI or <= 0,
  // upY of camera need to be flipped to the other side
  if (camPhi <= 0 || camPhi >= Math.PI) {
    newUpY *= - 1;
  }
  camRadius *= Math.pow(10, dRadius);

  // prevent zooming through the center:
  if (camRadius < this.cameraNear) {
    camRadius = this.cameraNear;
  }
  if (camRadius > this.cameraFar) {
    camRadius = this.cameraFar;
  }

  // from https://github.com/mrdoob/three.js/blob/dev/src/math/Vector3.js#L628-L632
  var _x = Math.sin(camPhi) * camRadius * Math.sin(camTheta);
  var _y = Math.cos(camPhi) * camRadius;
  var _z = Math.sin(camPhi) * camRadius * Math.cos(camTheta);
  this.camera(_x + this.centerX, _y + this.centerY, _z + this.centerZ, this.centerX, this.centerY, this.centerZ, 0, newUpY, 0);
};

// ortho()がthis.cameraFarとthis.cameraNearに設定するように仕様変更

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

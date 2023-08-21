// --------------------------- //
// まず、...
// うまくいくんかいな。まあ別に死ぬわけじゃないし。死にかけたし。気楽にやろ。死ぬことが無いなら何でもできる。

// まるごと移してしまえ。えいっ
// でもってalphaをtrueで上書き。えいっ（どうなっても知らないよ...）

// 1.7.0はwebgl2なのでもう不要です
// 卍解済み

// 2023-07-18
// 暫定的にこれでいこう
// copyPainterのalphaBlendingをいじりました
// Separateのone,oneでalphaを掛ける
// とりあえずこれで。
// って思ったのに
// Separateやめたら綺麗になった・・
// もうわからん～

// offsetがoffseyになってたので直しました
// OpenProcessingが原因で発生する余計なインデントを殺しました

// ジオメトリインスタンシング導入しました
// 使い方は簡単。divisorを1以上に指定してshaderサイドでそれを使っていろいろ計算するだけ
// Instancedの付いたドローコールをしないとひとつしか描画されませんので注意しましょう

// transformFeedbackを導入しました
// ラスタライズしない処理を導入しました

// 2023-08-05
// transform feedback
// enableAttributesにおいて
// 「attrがundefined」という条件を追加しました
// これがないと描画と同時に更新することができないんですよね
// attributeの入れ替えの際に入れ替えたattributeがoutIndexをもって
// いない、また入れ替えでinされるattributeがoutIndexを持っている
// ことにより不具合が生じるわけ
// 同じIndexを指定しておくことで、これを回避できる。

// そういうことです
// TFでoutIndex>=0であってもattrがundefinedでないならば
// つまりinで宣言されているならば
// 通常の処理をしないといけないし
// 逆に通常の処理をしていたattributeにTF処理をさせたかったら
// あらかじめoutIndexを設定しておかないといけないのだよ
// 以上だよ。

// CUBE_MAPですが、いけそうですね...
// ほとんどのパートはTEXTURE_2DをTEXTURE_CUBE_MAPに変えるだけ。
// 登録時に6枚要求するところ以外はほぼ一緒

// getMat3を追加
// ex.getInverseTranspose3x3を追加

// orbitControlのパッチ
// 回転のYと移動のYの向きを逆にしただけ
// 参考：https://openprocessing.org/sketch/1886629
p5.prototype.orbitControl = function(
  sensitivityX,
  sensitivityY,
  sensitivityZ,
  options
) {
  this._assert3d('orbitControl');
  p5._validateParameters('orbitControl', arguments);

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
  const mouseZoomScaleFactor = 0.01;
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
      deltaPhi = -sensitivityY * (t.y - t.py) / scaleFactor;
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
      deltaRadius = Math.sign(this._mouseWheelDeltaY) * sensitivityZ;
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
        deltaPhi = -sensitivityY * this.movedY / scaleFactor;
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
      cam._orbitFree(
        0, 0, this._renderer.zoomVelocity
      );
    } else {
      cam._orbit(
        0, 0, this._renderer.zoomVelocity
      );
    }
    // In orthogonal projection, the scale does not change even if
    // the distance to the gaze point is changed, so the projection matrix
    // needs to be modified.
    if (cam.projMatrix.mat4[15] !== 0) {
      cam.projMatrix.mat4[0] *= Math.pow(
        10, -this._renderer.zoomVelocity
      );
      cam.projMatrix.mat4[5] *= Math.pow(
        10, -this._renderer.zoomVelocity
      );
      // modify uPMatrix
      this._renderer.uPMatrix.mat4[0] = cam.projMatrix.mat4[0];
      this._renderer.uPMatrix.mat4[5] = cam.projMatrix.mat4[5];
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
      cam._orbitFree(
        -this._renderer.rotateVelocity.x,
        this._renderer.rotateVelocity.y,
        0
      );
    } else {
      cam._orbit(
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
    const ndcY = moveDeltaY * 2/this.height;
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
    const local = cam._getLocalAxes();

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

// p5wgex.
// glからRenderNodeを生成します。glです。(2022/10/02)
const p5wgex = (function(){

  // ---------------------------------------------------------------------------------------------- //
  // utility.

  // HSVをRGBにしてくれる関数. ただし0～1で指定してね
  function hsv2rgb(h, s, v){
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

  // 直接配列の形で返したい場合はこちら
  function hsvArray(h, s, v){
    const obj = hsv2rgb(h, s, v);
    return [obj.r, obj.g, obj.b];
  }

  // colがconfig経由の値の場合、それを正しく解釈できるようにするための関数.
  // 戻り値は0～255指定。なのでお手数ですが255で割ってください。
  function getProperColor(col){
    if(typeof(col) === "object"){
      return {r:col.r, g:col.g, b:col.b};
    }else if(typeof(col) === "string"){
      col = color(col);
      return {r:red(col), g:green(col), b:blue(col)};
    }
    return {r:255, g:255, b:255};
  }

  // window.alertがうっとうしいので1回しか呼ばないように
  // noLoopで書き換えようと思います。
  // 引数を増やすかどうかは応相談
  function myAlert(_string){
    window.alert(_string);
    console.log("myAlert: " + _string);
    noLoop();
  }

  // ---------------------------------------------------------------------------------------------- //
  // Timer.

  // stumpの概念を有するタイマー。デフォルトスタンプを持って初期化出来る。常に最後に発火したタイミングを保持
  // しておりそこに到達するたびにそのタイミングを更新しつつtrueを返す。
  // 上位互換になるな...Timerは廃止かもしれない（え？）
  // たとえばscaleに1000/60を指定すれば...っていう感じなので。
  // 関数を設定してもいいんだけどtargetとかfuncNameとか引数とかややこしいので勝手にやってくれって感じ...
  // 従来通り使うなら普通にinitialize(name)でいいしsetで現在時刻登録されるしgetDeltaで秒数、
  // fps欲しいなら1000/60をスケールに設定、そんなところ。

  // なんとポーズ機能が無いことに気付いたので実装します。内容的にはpauseしたタイミングを記録しておいて
  // 終わったら停止していた時間の分をstumpに加えます。なお停止中に問い合わせがあった場合その時間から
  // pauseTimeを引いた分をstumpに加算して計算する...と思う。つまりどんなに時間が経過してもその分引く数も
  // 大きくなることで停止中であることを表現する...というわけ。getDeltaMillisだけ書き換えればいい(pauseで分岐処理)
  // getDeltaMillisの結果を、pauseの場合にlastPause-stumpにすれば良さそう。
  class Timer{
    constructor(){
      this.timers = {};
    }
    initialize(keyName, info = {}){
      if(info.stump === undefined){ info.stump = window.performance.now(); } // 未定義の場合は現在の時刻
      if(info.duration === undefined){ info.duration = Infinity; } // 未定義の場合は無限
      if(info.scale === undefined){ info.scale = 1000; } // 返すときに何かで割りたいときにどうぞ。未定義の場合は1000.
      // なぜならほとんどの場合秒数として使用するので（メトロノームなどの場合は具体的に指定するだろう）
      // 最後に発火したタイミングと、次の発火までの時間間隔(duration)を設定（Infinityの場合は間隔を用意しない感じで）
      this.timers[keyName] = {stump:info.stump, duration:info.duration, scale:info.scale, pause:false, lastPause:info.stump};
    }
    validateKeyName(keyName, methodName){
      if(this.timers[keyName] === undefined){
        myAlert(methodName + " failure: invalid name.");
        return null;
      }
      return true;
    }
    set(keyName, duration){
      // 意図的にstumpの値を現在の時刻にすることで、こちらで何かあってからの経過時間を計測する、
      // 従来の使い方もできるようにしよう。また、initializeされてない場合はエラーを返すようにする。
      if(!this.validateKeyName(keyName, "set")){ return; }
      this.timers[keyName].stump = window.performance.now();
      // durationを決めることでcheckで一定時間ごとの処理ができるようになるね。
      if(duration !== undefined){ this.timers[keyName].duration = duration; }
    }
    getDelta(keyName){
      // 最後に発火してからの経過時間をscaleで割った値を返す感じ。
      // こっちの方が基本的に使用されるのでこれをgetDeltaとした。
      if(!this.validateKeyName(keyName, "getDelta")){ return null; }
      const _timer = this.timers[keyName];
      return this.getDeltaMillis(keyName) / _timer.scale;
    }
    getProgress(keyName){
      // stumpからの経過時間をdurationで割ることで進捗を調べるのに使う感じ
      if(!this.validateKeyName(keyName, "getProgress")){ return null; }
      const _timer = this.timers[keyName];
      if(_timer.duration > 0){
        return Math.min(1, this.getDeltaMillis(keyName) / _timer.duration);
      }
      return 1; // durationが0の場合...つまり無限大ということ。
    }
    getDeltaMillis(keyName){
      // 最後に発火してからの経過時間を生のミリ秒表示で取得する。使い道は検討中。
      if(!this.validateKeyName(keyName, "getDeltaMillis")){ return null; }
      const _timer = this.timers[keyName];
      if(_timer.pause){
        return _timer.lastPause - _timer.stump; // 最後に停止するまでの時間
      }
      return window.performance.now() - _timer.stump; // 普通に現在までの時間
    }
    getDeltaDiscrete(keyName, interval = 1000, modulo = 1){
      // deltaをintervalで割ってfloorした結果を返す。
      // moduloが1より大きい場合はそれで%を取る。1の場合はそのまま整数を返す。
      // たとえば250であれば0,1,2,3,...と1秒に4増えるし、moduloを4にすれば0,1,2,3,0,1,2,3,...となるわけ。
      if(!this.validateKeyName(keyName, "getDeltaDiscrete")){ return null; }
      const _delta = this.getDeltaMillis(keyName);
      const n = Math.floor(_delta / interval);
      if(modulo > 1){
        return n % modulo;
      }
      return n;
    }
    check(keyName, nextDuration){
      // durationを経過時間が越えたらstumpを更新する
      // nextDurationは未定義なら同じ値を継続
      // 毎回違うでもいい、自由に決められるようにする。
      if(!this.validateKeyName(keyName, "check")){ return false; }
      const _timer = this.timers[keyName];
      const elapsedTime = this.getDeltaMillis(keyName);
      if(elapsedTime > _timer.duration){
        _timer.stump += _timer.duration;
        if(nextDuration !== undefined){
          _timer.duration = nextDuration;
        }
        return true;
      }
      return false;
    }
    pause(keyName){
      if(!this.validateKeyName(keyName, "pause")){ return; }
      const _timer = this.timers[keyName];
      if(_timer.pause){ return; } // 重ね掛け回避
      _timer.pause = true;
      _timer.lastPause = window.performance.now();
    }
    reStart(keyName){
      if(!this.validateKeyName(keyName, "reStart")){ return; }
      const _timer = this.timers[keyName];
      if(!_timer.pause){ return; } // 重ね掛け回避
      _timer.pause = false;
      _timer.stump += window.performance.now() - _timer.lastPause;
    }
    pauseAll(){
      for(let keyName of Object.keys(this.timers)){
        this.pause(keyName);
      }
    }
    reStartAll(){
      for(let keyName of Object.keys(this.timers)){
        this.reStart(keyName);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // dictionary.
  // gl定数を外部から文字列でアクセスできるようにするための辞書

  function getDict(gl){
    const d = {};
    // -------textureFormat-------//
    d.float = gl.FLOAT;
    d.half_float = gl.HALF_FLOAT;
    d.ubyte = gl.UNSIGNED_BYTE;
    d.uint = gl.UNSIGNED_INT;
    d.rgb = gl.RGB;
    d.rgba = gl.RGBA; // rgba忘れてたっ
    d.rgba16f = gl.RGBA16F;
    d.rgba32f = gl.RGBA32F;
    d.r16f = gl.R16F;
    d.r32f = gl.R32F;
    d.rg32f = gl.RG32F;
    d.red = gl.RED;
    d.rg = gl.RG;
    d.short = gl.SHORT;
    d.ushort = gl.UNSIGNED_SHORT;
    d.int = gl.INT;
    d.alpha = gl.ALPHA;
    d.red_integer = gl.RED_INTEGER;
    // -------usage-------//
    d.static_draw = gl.STATIC_DRAW;
    d.dynamic_draw = gl.DYNAMIC_DRAW;
    d.stream_draw = gl.STREAM_DRAW;
    d.static_read = gl.STATIC_READ;
    d.dynamic_read = gl.DYNAMIC_READ;
    d.stream_read = gl.STREAM_READ;
    d.static_copy = gl.STATIC_COPY;
    d.dynamic_copy = gl.DYNAMIC_COPY;
    d.stream_copy = gl.STREAM_COPY;
    // -------texture-------//
    d.texture_2d = gl.TEXTURE_2D;
    d.texture_cube_map = gl.TEXTURE_CUBE_MAP;
    // -------textureParam-------//
    d.linear = gl.LINEAR;
    d.nearest = gl.NEAREST;
    d.repeat = gl.REPEAT;
    d.mirror = gl.MIRRORED_REPEAT;
    d.clamp = gl.CLAMP_TO_EDGE;
    // -------mipmapParam-------//
    d.nearest_nearest = gl.NEAREST_MIPMAP_NEAREST;
    d.nearest_linear = gl.NEAREST_MIPMAP_LINEAR;
    d.linear_nearest = gl.LINEAR_MIPMAP_NEAREST;
    d.linear_linear = gl.LINEAR_MIPMAP_LINEAR;
    // -------internalFormat for renderbuffer-------//
    d.depth16 = gl.DEPTH_COMPONENT16;
    d.depth24 = gl.DEPTH_COMPONENT24;
    d.depth32f = gl.DEPTH_COMPONENT32F;
    d.rgba4 = gl.RGBA4;
    d.rgba8 = gl.RGBA8;
    d.stencil8 = gl.STENCIL_INDEX8;
    // -------drawCall-------//
    d.points = gl.POINTS;
    d.lines = gl.LINES;
    d.line_loop = gl.LINE_LOOP;
    d.line_strip = gl.LINE_STRIP;
    d.triangles = gl.TRIANGLES;
    d.triangle_strip = gl.TRIANGLE_STRIP;
    d.triangle_fan = gl.TRIANGLE_FAN;
    // -------blendOption-------//
    d.one = gl.ONE;
    d.zero = gl.ZERO;
    d.src_color = gl.SRC_COLOR;
    d.dst_color = gl.DST_COLOR;
    d.one_minus_src_color = gl.ONE_MINUS_SRC_COLOR;
    d.one_minus_dst_color = gl.ONE_MINUS_DST_COLOR;
    d.src_alpha = gl.SRC_ALPHA;
    d.dst_alpha = gl.DST_ALPHA;
    d.one_minus_src_alpha = gl.ONE_MINUS_SRC_ALPHA;
    d.one_minus_dst_alpha = gl.ONE_MINUS_DST_ALPHA;
    // -------enable-------//
    d.blend = gl.BLEND;
    d.cull_face = gl.CULL_FACE;
    d.depth_test = gl.DEPTH_TEST;
    d.stencil_test = gl.STENCIL_TEST;
    // -------cullFace-------//
    d.front = gl.FRONT;
    d.back = gl.BACK;
    d.front_and_back = gl.FRONT_AND_BACK;
    // -------targetName------- //
    d.array_buf = gl.ARRAY_BUFFER;
    d.element_buf = gl.ELEMENT_ARRAY_BUFFER;
    d.transform_feedback_buf = gl.TRANSFORM_FEEDBACK_BUFFER; // こんなところで。
    // -------rasterizer-------//
    d.rasterizer_discard = gl.RASTERIZER_DISCARD; // TFに使う。使わない場合もあるが。
    return d;
  }

  // ---------------------------------------------------------------------------------------------- //
  // utility for RenderNode.

  // シェーダーを作る
  function _getShader(name, gl, source, type){
    if(type !== "vs" && type !== "fs"){
      myAlert("invalid type");
      return null;
    }

    // シェーダーを代入
    let _shader;
    if(type === "vs"){ _shader = gl.createShader(gl.VERTEX_SHADER); }
    if(type === "fs"){ _shader = gl.createShader(gl.FRAGMENT_SHADER); }

    // コンパイル
    gl.shaderSource(_shader, source);
    gl.compileShader(_shader);
    // 結果のチェック
    if(!gl.getShaderParameter(_shader, gl.COMPILE_STATUS)){
      console.error(gl.getShaderInfoLog(_shader));
      myAlert("name: " + name + ", " + type + ", compile failure.");
      return null;
    }

    return _shader;
  }

  // プログラムを作る
  // TFの場合はTF用のプログラムを作る。
  function _getProgram(name, gl, sourceV, sourceF, outVaryings = []){
    // isTFで分岐処理。
    const isTF = (outVaryings.length > 0);
    // isTFならTFの準備をする。
    let transformFeedback;
    if (isTF) {
      transformFeedback = gl.createTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
    }
    const vShader = _getShader(name, gl, sourceV, "vs");
    const fShader = _getShader(name, gl, sourceF, "fs");

    // プログラムの作成
    let _program = gl.createProgram();
    // シェーダーにアタッチ → リンク
    gl.attachShader(_program, vShader);
    gl.attachShader(_program, fShader);
    // TFの場合はoutVaryingsによりちょっと複雑な処理をする。
    // インターリーブは未習得なのでパス。
    if (isTF) {
      gl.transformFeedbackVaryings(_program, outVaryings, gl.SEPARATE_ATTRIBS);
    }
    gl.linkProgram(_program);

    // 結果のチェック
    if(!gl.getProgramParameter(_program, gl.LINK_STATUS)){
      myAlert('Could not initialize shaders. ' + "name: " + name + ", program link failure.");
      return null;
    }
    if (isTF) {
      // 必要かどうかは不明。
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    }
    return _program;
  }

  // _loadAttributes. glを引数として。最初からそうしろよ...って今更。
  // sizeとtypeは意図した挙動をしなかったので廃止。
  // sizeはなぜかvec2なのに1とか出してくるし
  // typeはgl.FLOATとかじゃなくてFLOAT_VEC2とかだしでbindに使えない
  // まあそういうわけでどっちも廃止。
  // TRANSFORM_FEEDBACK_VARYINGSを使えば入力と出力をそれぞれ取得できる？要検証
  function _loadAttributes(gl, pg){
    // 属性の総数を取得
    const numAttributes = gl.getProgramParameter(pg, gl.ACTIVE_ATTRIBUTES);
    const attributes = {};
    // 属性を格納していく
    for(let i = 0; i < numAttributes; i++){
      const attr = {};
      const attrInfo = gl.getActiveAttrib(pg, i); // 情報を取得
      const name = attrInfo.name;
      attr.name = name; // 名前
      attr.location = gl.getAttribLocation(pg, name); // bindに使うlocation情報
      attributes[name] = attr; // 登録！
    }
    return attributes;
  }

  // _loadUniforms. glを引数に。
  function _loadUniforms(gl, pg){
    // ユニフォームの総数を取得
    const numUniforms = gl.getProgramParameter(pg, gl.ACTIVE_UNIFORMS);
    // uniformの型一覧：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
    const uniforms = {};
    // ユニフォームを格納していく
    // サンプラのインデックスはシェーダー内で0ベースで異なってればOK, を検証してみる。
    let samplerIndex = 0;
    // samplerTargetの種類別に格納する
    const samplerTargetArray = [];
    for(let i = 0; i < numUniforms; i++){
      const uniform = {};
      const uniformInfo = gl.getActiveUniform(pg, i); // ほぼ一緒ですね
      let name = uniformInfo.name;
      // このnameはuniform変数が配列の場合"uColor[0]"のようにおしりに[0]が付くという（そうなんだ）
      // p5jsはこれをトリミングでカットしているのでそれに倣う（sizeで保持するので情報は失われない）
      if(uniformInfo.size > 1){
        name = name.substring(0, name.indexOf('[0]'));
      }
      uniform.name = name; // 改めて名前を設定
      uniform.size = uniformInfo.size; // 配列の場合はこれが2とか3とか10になる感じ
      uniform.location = gl.getUniformLocation(pg, name);
      uniform.type = uniformInfo.type; // gl.FLOATなどの型情報
      // TEXTURE_2Dのケース
      if(uniform.type === gl.SAMPLER_2D){
        uniform.samplerIndex = samplerIndex++; // 名前からアクセスして...setTextureで使う
        samplerTargetArray.push(gl.TEXTURE_2D);
      // TEXTURE_CUBE_MAPのケース
      } else if(uniform.type === gl.SAMPLER_CUBE) {
        uniform.samplerIndex = samplerIndex++;
        samplerTargetArray.push(gl.TEXTURE_CUBE_MAP);
      }

      // isArrayの情報...は、いいや。普通に書く。それで問題が生じないか見る。
      uniforms[name] = uniform;
    }
    uniforms.maxSamplerIndex = samplerIndex; // samplerIndexの上限を取得して格納する
    uniforms.samplerTargetArray = samplerTargetArray;
    return uniforms;
  }

  // setUniformの移植。size>1の場合にvを使うのとか注意。uniform[1234][fi][v]もしくはuniformMatrix[234]fv.
  // 引数のuniformは名前とcurrentPainterから取得して渡す
  // この流れで行くと最終的にcurrentShaderの概念無くなる可能性あるな...あれsetUniformしやすいからって残してただけだし
  // あとサンプラは扱う予定無いのでそれ以外ですね。まとめて扱うなんて無理。
  // あとwebgl2はuiっていってunsignedのintも扱えるらしいですね...
  function _setUniform(gl, uniform, data){
    const location = uniform.location;

    switch(uniform.type){
      case gl.BOOL:
        if(uniform.size > 1){
          gl.uniform1fv(location, data.map((value) => (value ? 1 : 0)));
        }else{
          if(data === true){ gl.uniform1i(location, 1); }else{ gl.uniform1i(location, 0); }
        }
        break;
      case gl.INT:
        if(uniform.size > 1){
          gl.uniform1iv(location, data);
        }else{
          gl.uniform1i(location, data);
        }
        break;
      case gl.FLOAT:
        if(uniform.size > 1){
          gl.uniform1fv(location, data);
        }else{
          gl.uniform1f(location, data);
        }
        break;
      case gl.UNSIGNED_INT:
        if(uniform.size > 1){
          gl.uniform1uiv(location, data);
        }else{
          gl.uniform1ui(location, data);
        }
        break;
      case gl.FLOAT_MAT2:
        gl.uniformMatrix2fv(location, false, data); // 2次元で使い道ないかな～（ないか）
        break;
      case gl.FLOAT_MAT3:
        gl.uniformMatrix3fv(location, false, data); // falseは転置オプションなので常にfalseだそうです
        break;
      case gl.FLOAT_MAT4:
        gl.uniformMatrix4fv(location, false, data); // しかしなんで常にfalseなのに用意したのか...
        break;
      case gl.FLOAT_VEC2:
        if (uniform.size > 1) {
          gl.uniform2fv(location, data);
        } else {
          gl.uniform2f(location, data[0], data[1]);
        }
        break;
      // floatです。
      case gl.FLOAT_VEC3:
        if (uniform.size > 1) {
          gl.uniform3fv(location, data);
        } else {
          gl.uniform3f(location, data[0], data[1], data[2]);
        }
        break;
      case gl.FLOAT_VEC4:
        if (uniform.size > 1) {
          gl.uniform4fv(location, data);
        } else {
          gl.uniform4f(location, data[0], data[1], data[2], data[3]);
        }
        break;
      // intです。
      case gl.INT_VEC2:
        if (uniform.size > 1) {
          gl.uniform2iv(location, data);
        } else {
          gl.uniform2i(location, data[0], data[1]);
        }
        break;
      case gl.INT_VEC3:
        if (uniform.size > 1) {
          gl.uniform3iv(location, data);
        } else {
          gl.uniform3i(location, data[0], data[1], data[2]);
        }
        break;
      case gl.INT_VEC4:
        if (uniform.size > 1) {
          gl.uniform4iv(location, data);
        } else {
          gl.uniform4i(location, data[0], data[1], data[2], data[3]);
        }
        break;
      // 使う日は来るのだろうか
      case gl.UNSIGNED_INT_VEC2:
        if (uniform.size > 1) {
          gl.uniform2uiv(location, data);
        } else {
          gl.uniform2ui(location, data[0], data[1]);
        }
        break;
      case gl.UNSIGNED_INT_VEC3:
        if (uniform.size > 1) {
          gl.uniform3uiv(location, data);
        } else {
          gl.uniform3ui(location, data[0], data[1], data[2]);
        }
        break;
      case gl.UNSIGNED_INT_VEC4:
        if (uniform.size > 1) {
          gl.uniform4uiv(location, data);
        } else {
          gl.uniform4ui(location, data[0], data[1], data[2], data[3]);
        }
        break;
    }
  }

  // FigureとVAOFigureで同じ処理してるので、こっちでこういう形でまとめた方がいいと思うんだよね。
  function _validateForAttribute(attr){
    if (attr.usage === undefined) { attr.usage = "static_draw"; }
    if (attr.type === undefined) { attr.type = "float"; } // ていうか色でもFLOATでいいんだ？？
    if (attr.divisor === undefined) { attr.divisor = 0; } // インスタンス化に使う除数。1以上の場合、インスタンスアトリビュート。
    if (attr.outIndex === undefined) { attr.outIndex = -1; } // TransformFeedback用のvaryingsにおける配列の番号。0以上の場合、TFに使われる。
  }

  // attrの構成例：{name:"aPosition", size:2, data:[-1,-1,-1,1,1,-1,1,1], usage:"static_draw"}
  // ああそうか隠蔽するからこうしないとまずいわ...修正しないと。"static"とか。
  // usage指定：static_draw, dynamic_drawなど。
  function _createVBO(gl, attr, dict){
    _validateForAttribute(attr); // これでいいはず...
    const _usage = dict[attr.usage];
    const _type = dict[attr.type];

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.data), _usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return {
      name: attr.name,
      buf: vbo,
      data: attr.data,
      count: attr.data.length, // countに名前を変更
      size: attr.size, // vec2なら2ですし、vec4なら4です。作るときに指定。
      type: _type,  // いつの日か整数属性を使う時が来たら考える。今は未定義でgl.FLOATになるくらいで。
      usage: attr.usage,
      divisor: attr.divisor, // インスタンシング用
      outIndex: attr.outIndex // TF用
    };
  }

  // vao生成関数。そのうちね...vbo保持する必要がなくなるのでstatic_draw前提なのよね。
  // だからstatic指定の場合にvao使うように誘導する方がいいかもしれない。とはいえどうせ隠蔽されるのであんま意味ないけどね...
  // vboの情報があった方がいい場合もあるかもしれないけどね。
  // iboの梱包はやめました。
  function _createVAO(gl, attrs, dict){
    const vao = gl.createVertexArray();
    const vbos = {};

    gl.bindVertexArray(vao);
    let attrCount; // drawArraysで使うデータの個数のような何か、あるいは抽象化された「数」
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      _validateForAttribute(attr); // これでいいはず...
      const _usage = dict[attr.usage];
      const _type = dict[attr.type];
      const vbo = gl.createBuffer();
      attrCount = Math.floor(attr.data.length / attr.size); // 繰り返し上書き
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.data), _usage);
      gl.enableVertexAttribArray(i); // locationは通し番号で0,1,2,...
      gl.vertexAttribPointer(i, attr.size, _type, false, 0, 0);
      // divisorが1以上の場合はvertexAttribDivisorを呼び出す
      if (attr.divisor > 0) {
        gl.vertexAttribDivisor(i, attr.divisor);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      vbos[attr.name] = vbo; // bufだけでいいと思う
    }
    gl.bindVertexArray(null);
    // 一応bufで統一する。
    return {
      buf: vao,
      vbos: vbos, // buf以外は要らないか。
      attrCount: attrCount, // drawArrays用。
    };
  }

  // attrsはattrの配列
  function _createVBOs(gl, attrs, dict){
    const vbos = {};
    for(let attr of attrs){
      vbos[attr.name] = _createVBO(gl, attr, dict);
    }
    return vbos;
  }

  // ibo用のvalidation関数。基本staticで。多めの場合にlargeをtrueにすればよろしくやってくれる。
  function _validateForIBO(gl, info){
    if(info.usage === undefined){ info.usage = "static_draw"; } // これも基本STATICですね...
    if(info.large === undefined){ info.large = false; } // largeでT/F指定しよう. 指定が無ければUint16.
    if(info.large){
      info.type = Uint32Array;
      info.intType = gl.UNSIGNED_INT; // drawElementsで使う
    }else{
      info.type = Uint16Array;
      info.intType = gl.UNSIGNED_SHORT; // drawElementsで使う
    }
  }

  // infoの指定の仕方
  // 必須: dataにインデックス配列を入れる。そんだけ。nameは渡すときに付与されるので要らない。
  // 任意：usageは"static_draw"か"dynamic_draw"を指定
  function _createIBO(gl, info, dict){
    _validateForIBO(gl, info);
    const _usage = dict[info.usage];

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new (info.type)(info.data), _usage);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return {
      name: info.name,
      buf: ibo,
      type: info.type,
      intType: info.intType,
      data: info.data,
      count: info.data.length, // countに変更
      usage: info.usage,
    };
  }

  // ---------------------------------------------------------------------------------------------- //
  // utility for Texture.

  // ubyte: gl.UNSIGNED_BYTE, float: gl.FLOAT, half_float: gl.HALF_FLOAT
  // nearest: gl.NEAREST, linear: gl.LINEAR
  // clamp: gl.CLAMP_TO_EDGE, repeat: gl.REPEAT, mirror: gl.MIRRORED_REPEAT. ミラーもいいよね。使ってみたい。
  // テクスチャ作る関数も作るつもり。そのうち...
  // r32fとか使ってみたいわね。効率性よさそう
  // これtextureの話しかしてないからこれでいいね？
  // reference: https://registry.khronos.org/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
  // gl.RG32F --- gl.RG --- gl.FLOAT
  // gl.RGBA32F --- gl.RGBA --- gl.FLOAT
  // gl.RGBA16F --- gl.RGBA --- gl.FLOAT
  // gl.RGBA16F --- gl.RGBA --- gl.HALF_FLOAT
  // gl.RGBA --- gl.RGBA --- gl.UNSIGNED_BYTE
  // gl.R32F --- gl.RED --- gl.FLOAT
  // ここで設定する項目一覧
  // format関連3つとwrap1つとfilter1つ。んー...mipmap...で、全部かな。今んとこ。実は8つだけど...wとhも...
  // wとhはframebufferのものを使うのでここ、そうね。
  // mipmapは縮小コピーで縮小時の精度を上げるためのものなのでMINfilterオンリーのfilter指定になります。静止画用ってわけ。
  // そういうことでこれからはmag, min, sWrap, tWrapという指定にする...（片方が未指定ならもう片方は合わせる形）
  // 双方未指定なら双方nearest/clampとする。あちこち変えないといけない。
  function _validateForTexture(info){
    // targetは基本2Dだが、CUBE_MAPもOKにする。
    // 指定の仕方は"2d"もしくは"cube_map"だが、具体的に指定する場合"2d"と記述することはないと思う。
    // 仮に...framebufferにcube_mapを関連付けるのであれば、typeなどと一緒にtargetを"cube_map"に指定する。あとは_createTextureの仕事。
    // ...ではないのよね。framebufferTexture2Dを使わないと駄目らしい。該当fbがbindされているときにね。なのでそこらへんちょっと工夫が必要かも。
    // そうしないとおそらく0番にしか描画されない。
    if(info.target === undefined){ info.target = "2d"; }
    switch(info.target){
      case "2d": info.target = "texture_2d"; break;
      case "cube_map": info.target = "texture_cube_map"; break;
    }
    // textureType. "ubyte", "half_float", "float"で指定
    // 画像用なら普通にubyte, float textureでやりたいならfloatを指定しましょう（流体やブルーム、パーティクル）
    if(info.type === undefined){ info.type = "ubyte"; }
    // textureInternalFormatとtextureFormatについて
    if(info.internalFormat === undefined){
      switch(info.type){
        case "ubyte":
          info.internalFormat = "rgba"; break;
        case "float":
          info.internalFormat = "rgba32f"; break;
        case "half_float":
          info.internalFormat = "rgba16f"; break;
      }
    }
    if(info.format === undefined){ info.format = "rgba"; } // とりあえずこれで。あの3種類みんなこれ。
    // textureFilter. "nearest", "linear"で指定
    if(info.magFilter === undefined && info.minFilter === undefined){
      // info.typeがubyteの場合はlinearが妥当でしょう
      // 明示されていない場合はそうするべき
      // floatならnearestにすべき。使い方によっては違うかもだけど。
      if (info.type === "ubyte") {
        info.magFilter = info.minFilter = "linear";
      } else {
        info.magFilter = info.minFilter = "nearest";
      }
    }else{
      if(info.magFilter === undefined){ info.magFilter = info.minFilter; }
      else if(info.minFilter === undefined){ info.minFilter = info.magFilter; }
    }
    // textureWrap. "clamp", "repeat", "mirror"で指定
    if(info.sWrap === undefined && info.tWrap === undefined){
      info.sWrap = info.tWrap = "clamp";
    }else{
      if(info.sWrap === undefined){ info.sWrap = info.tWrap; }
      else if(info.tWrap === undefined){ info.tWrap = info.sWrap; }
    }
    // mipmapはデフォルトfalseで。一応後から作れるようにしといた（null引数だと作られ無さそだし、実際作れないだろ。）
    if(info.mipmap === undefined){ info.mipmap = false; }
    // srcがnullでない場合に限りwとhは未定義でもOK
    if(info.src !== undefined){
      //let td;
      let td = _getTextureData(info.target, info.src);
      if (info.target === "texture_cube_map") { td = td.xp; } // どれか。どれでもOK.
      // テクスチャデータから設定されるようにする。理由：めんどくさいから！！
      if(info.w === undefined){ info.w = td.width; }
      if(info.h === undefined){ info.h = td.height; }
    }
  }

  // info.srcが用意されてないならnullを返す。一種のバリデーション。
  // これをデフォとしていろいろ作ればいい
  function _getTextureDataFromSrc(src){
    if(src === undefined){ return null; }
    if(src instanceof Uint8Array || src instanceof Float32Array){ return src; }
    if(src instanceof HTMLImageElement){ return src; }
    if(src instanceof p5.Graphics){ return src.elt; }
    if(src instanceof p5.Image){ return src.canvas; }
    myAlert("You cannot extract data from that source.");
    return null;
  }

  // 汎用
  function _getTextureData(target, src){
    switch (target) {
      case "texture_2d":
        return _getTextureDataFromSrc(src);
      case "texture_cube_map":
        const result = {};
        result.xp = _getTextureDataFromSrc(src.xp);
        result.xn = _getTextureDataFromSrc(src.xn);
        result.yp = _getTextureDataFromSrc(src.yp);
        result.yn = _getTextureDataFromSrc(src.yn);
        result.zp = _getTextureDataFromSrc(src.zp);
        result.zn = _getTextureDataFromSrc(src.zn);
        return result;
    }
    myAlert("invalid texture target or texture src.");
    return null;
  }

  // texImageの簡易版
  // internalFormat, format, typeはgl定数に翻訳済み
  function _texImage(gl, target, data, w, h, internalFormat, format, type){
    switch(target) {
      case gl.TEXTURE_2D:
        gl.texImage2D(target, 0, internalFormat, w, h, 0, format, type, data);
        break;
      case gl.TEXTURE_CUBE_MAP:
        const cubemapTargets = [
          gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
          gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
          gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        const dataArray = [data.xp, data.xn, data.yp, data.yn, data.zp, data.zn];
        for (let textureIndex = 0; textureIndex < 6; textureIndex++) {
          gl.texImage2D(cubemapTargets[textureIndex], 0, internalFormat, w, h, 0, format, type, dataArray[textureIndex]);
        }
        break;
    }
  }

  // dictも要るね。いずれはテクスチャ配列も使えるようにしたいところ。
  // テクスチャ配列のMRTとかできるのかしら（無理だと思うけれど...）？案外できそうな気がしてきた（おい）
  // いや無理でしょ...どうやって格納するの...32x1024とかして...あー、そゆこと？いけるんかね。
  function _createTexture(gl, info, dict){
    // targetですね。gl.TEXTURE_2Dもしくはgl.TEXTURE_CUBE_MAP;
    const target = dict[info.target];
    // texImage2Dに使うデータ。cube_mapの場合はxp,xn,yp,yn.zp,znの6枚がある。
    const data = _getTextureData(info.target, info.src);
    // テクスチャを生成する
    let tex = gl.createTexture();
    // テクスチャをバインド
    gl.bindTexture(target, tex);

    // テクスチャにメモリ領域を確保。ここの処理はCUBE_MAPの場合ちょっと異なる。場合分けする。
    _texImage(gl, target, data, info.w, info.h, dict[info.internalFormat], dict[info.format], dict[info.type]);

    // mipmapの作成はどうも失敗してるみたいです。原因は調査中。とりあえず使わないで。
    //if(info.mipmap){ gl.generateMipmap(gl.TEXTURE_2D); }

    // テクスチャのフィルタ設定（サンプリングの仕方を決める）
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, dict[info.magFilter]); // 拡大表示用
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, dict[info.minFilter]); // 縮小表示用

    // mipmapを作成するのMDNが後回しにしてたのでこれで実験してみる
    if(info.mipmap){ gl.generateMipmap(target); }

    // テクスチャのラッピング設定（範囲外のUV値に対する挙動を決める）
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, dict[info.sWrap]);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, dict[info.tWrap]);
    // テクスチャのバインドを解除
    gl.bindTexture(target, null);
    return tex;
  }

  // 基本デプスで使うんだけどな。
  function _validateForRenderbuffer(info){
    if(info.internalFormat === undefined){
      info.internalFormat = "depth32f"; // depth16とかdepth32f.もしくはstencil8.
      // stencilも基本レンダーバッファで使うからいつか役に立つかな。
    }
  }

  // というわけでレンダーバッファ作成関数。まあ、そうなるわな。
  function _createRenderbuffer(gl, info, dict){
    // まずレンダーバッファを用意する
    let renderbuffer = gl.createRenderbuffer();
    // レンダーバッファをバインド
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    // レンダーバッファを深度バッファとして設定(32F使えるそうです)
    gl.renderbufferStorage(gl.RENDERBUFFER, dict[info.internalFormat], info.w, info.h);
    // レンダーバッファのバインドを解除
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    return renderbuffer;
  }

  function _validateForEachInfo(attachType, info){
    // 各々のinfoのvalidation. noneの場合、何もしない。
    switch(attachType){
      case "renderbuffer":
        _validateForRenderbuffer(info); break;
      case "texture":
        _validateForTexture(info); break;
    }
    // "none"は何もしない。たとえばdepth:{attachType:"none"}とすればdepthは用意されない。
  }

  function _createEachBuffer(gl, attachType, info, dict){
    // renderbuffer又はtextureを返す。
    // _createTextureにおいてdataはnullです。framebufferの場合dataを用意するわけでは無いので。
    switch(attachType){
      case "renderbuffer":
        return _createRenderbuffer(gl, info, dict);
      case "texture":
        return _createTexture(gl, info, dict);
    }
    return null; // noneは何も用意しない。
  }

  function _connectWithFramebuffer(gl, attachment, attachType, buffer){
    // bufferをframebufferと関連付けする。
    switch(attachType){
      case "renderbuffer":
        // レンダーバッファの関連付け
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, buffer); break;
      case "texture":
        // テクスチャの関連付け
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, buffer, 0); break;
    }
  }

  // framebufferに渡されるinfoのvalidation.
  function _validateForFramebuffer(gl, info, dict){
    if(info.depth === undefined){
      info.depth = {};
      info.depth.attachType = "renderbuffer"; // depthはレンダーバッファ形式を採用する
      info.depth.info = {};
    }
    if(info.color === undefined){
      info.color = {};
      info.color.attachType = "texture"; // colorはテクスチャ形式を採用する
      info.color.info = {};
    }
    if(info.stencil === undefined){
      info.stencil = {};
      info.stencil.attachType = "none"; // stencilは用意しない。いつか仲良くしてください...
      info.stencil.info = {};
    }

    if(info.depth.attachType === undefined){ info.depth.attachType = "renderbuffer"; }
    if(info.color.attachType === undefined){ info.color.attachType = "texture"; }
    if(info.stencil.attachType === undefined){info.stencil.attachType = "renderbuffer"; } // 使うならrenderbuffer.

    // 各種infoにvalidationを掛ける準備
    const depthInfo = info.depth.info;
    const colorInfo = info.color.info;
    const stencilInfo = info.stencil.info;

    // wとhはここで付与してしまおう。なお全体のinfoにnameはもう付与済み（のはず）
    // 全部一緒じゃないとエラーになるのです。
    depthInfo.w = info.w;   depthInfo.h = info.h;
    if(!info.MRT){
      colorInfo.w = info.w;   colorInfo.h = info.h;
    }else{
      // 配列の場合
      for(let eachInfo of colorInfo){
        eachInfo.w = info.w;   eachInfo.h = info.h;
      }
    }
    stencilInfo.w = info.w;   stencilInfo.h = info.h;

    // ここでバリデーション掛ければいいのか
    _validateForEachInfo(info.depth.attachType, depthInfo);
    if(!info.MRT){
      _validateForEachInfo(info.color.attachType, colorInfo);
    }else{
      // 配列の場合
      for(let eachInfo of colorInfo){
        _validateForEachInfo(info.color.attachType, eachInfo);
      }
    }
    _validateForEachInfo(info.stencil.attachType, stencilInfo);
  }

  // ---------------------------------------------------------------------------------------------- //
  // framebuffer.

  // というわけでややこしいんですが、
  // 「gl.RGBAーgl.RGBAーgl.UNSIGNED_BYTE」「gl.RGBA32Fーgl.RGBAーgl.FLOAT」「gl.RGBA16Fーgl.RGBAーgl.HALF_FLOAT」
  // という感じなので、Typeの種類にInternalFormatとFormatが左右されるのですね。
  // ていうかFormatだと思ってた引数の正式名称はTypeでしたね。色々間違ってる！！textureTypeに改名しないと...

  // infoの指定の仕方
  // 必須：wとhだけでOK. nameは定義時。
  // 任意：textureType: テクスチャの種類。色なら"ubyte"(デフォルト), 浮動小数点数なら"float"や"half_float"
  // 他のパラメータとか若干ややこしいのでそのうち何とかしましょう...webgl2はややこしいのだ...
  // 場合によってはtextureInternalFormatとtextureFormatも指定するべきなんだろうけど
  // まだ扱ったことが無くて。でもおいおい実験していかなければならないだろうね。てか、やりたい。やらせてください（OK!）

  // 最後にinfo.srcですがこれがundefinedでないなら然るべくdataを取得してそれを放り込む形となります。

  // textureFilter: テクスチャのフェッチの仕方。通常は"nearest"（点集合など正確にフェッチする場合など）、
  // 学術計算とかなら"linear"使うかも
  // textureWrap: 境界処理。デフォルトは"clamp"だが"repeat"や"mirror"を指定する場合もあるかも。
  // 色として普通に使うなら全部指定しなくてOK. 点情報の格納庫として使うなら"float"だけ要ると思う。

  // mipmap（h_doxasさんのサイト）
  // mipmapはデフォルトfalseで使うときtrueにしましょう
  // んでtextureFilterは次の物から選ぶ...mipmapが無いとコンパイルエラーになる（はず）
  // "nearest_nearest": 近いものを一つだけ取りnearestでサンプリング
  // "nearest_linear": 近いものを一つだけ取りlinearでサンプリング
  // "linear_nearest": 近いものを二つ取りそれぞれnearestでサンプリングしたうえで平均
  // "linear_linear": 近いものを二つ取りそれぞれlinearでサンプリングしてさらにそれらを平均（トライリニアサンプリング）
  // 高品質を追求するならlinear_linearってことのようですね！

  // 2DをCUBE_MAPや2D_ARRAYにしても大丈夫っていうのは...まあ、まだ無理ね...
  // ちょっと内容整理。デプス、色、関連付け。くっきりはっきり。この方が分かりやすい。
  function _createFBO(gl, info, dict){
    _validateForFramebuffer(gl, info, dict);
    const depthInfo = info.depth.info;
    const colorInfo = info.color.info;
    const stencilInfo = info.stencil.info;
    // ここでバリデーションは終わってて、あとは...
    let depthBuffer, colorBuffer, stencilBuffer;
    let colorBuffers = [];

    depthBuffer = _createEachBuffer(gl, info.depth.attachType, depthInfo, dict);
    if(!info.MRT){
      colorBuffer = _createEachBuffer(gl, info.color.attachType, colorInfo, dict);
    }else{
      for(let i=0, N=colorInfo.length; i<N; i++){
        colorBuffers.push(_createEachBuffer(gl, info.color.attachType, colorInfo[i], dict));
      }
    }
    stencilBuffer = _createEachBuffer(gl, info.stencil.attachType, stencilInfo, dict);

    // フレームバッファを生成。怖くないよ！！
    const framebuffer = gl.createFramebuffer();

    // フレームバッファをバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // 関連付け
    _connectWithFramebuffer(gl, gl.DEPTH_ATTACHMENT, info.depth.attachType, depthBuffer);
    if(!info.MRT){
      _connectWithFramebuffer(gl, gl.COLOR_ATTACHMENT0, info.color.attachType, colorBuffer);
    }else{
      // 複数の場合はあそこをインクリメントする
      let enums = [];
      for(let i=0, N=colorInfo.length; i<N; i++){
        _connectWithFramebuffer(gl, gl.COLOR_ATTACHMENT0 + i, info.color.attachType, colorBuffers[i]);
        enums.push(gl.COLOR_ATTACHMENT0 + i);
      }
      // 配列の場合はdrawBuffersを使って書き込まれるバッファを決める感じ。基本、すべて。まあそうよね。
      gl.drawBuffers(enums); // これでいいらしい。んー。
    }
    _connectWithFramebuffer(gl, gl.STENCIL_ATTACHMENT, info.stencil.attachType, stencilBuffer);
    // フレームバッファのバインドを解除
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // オブジェクトを返して終了。
    const result = {};
    result.f = framebuffer;
    if(depthBuffer !== null){ result.depth = depthBuffer; }
    if(!info.MRT){
      if(colorBuffer !== null){ result.color = colorBuffer; }
      result.MRT = false;
    }else{
      // この場合、前提としてnullでないのです。
      result.color = colorBuffers;
      result.MRT = true;
    }
    if(stencilBuffer !== null){ result.stencil = stencilBuffer; }
    result.w = info.w;
    result.h = info.h;
    result.double = false;
    return result;
  }

  // テクスチャはクラスにするつもり。もう少々お待ちを...canvas要素から生成できるように作るつもり。

  // fboのダブル。TFFとは違うのよね。フレームの別の場所参照できるから。そこが異なるようです。
  // validateの重ね掛けは問題ないので、そのままぶちこめ。
  function _createDoubleFBO(gl, info, dict){
    let fbo0 = _createFBO(gl, info, dict);
    let fbo1 = _createFBO(gl, info, dict);
    return {
      read: fbo0,
      write: fbo1,
      swap: function(){
        let tmp = this.read;
        this.read = this.write;
        this.write = tmp;
      },
      name: info.name, w: info.w, h: info.h, double: true, // texelSizeこれが持つ必要ないな。カット。wとhはbindで使うので残す。
      MRT:false,
    }
    // infoの役割終了
  }

  // あとはp5の2D,webgl画像からテクスチャを作るのとか用意したいね.
  // 登録しておいてそこから取り出して編集とか。そうね。それでもいいかも。bgManagerの後継機みたいな。さすがにクラスにしないと...

  // ---------------------------------------------------------------------------------------------- //
  // Texture.
  // 画像データないしはUint8Arrayから作る。Float32ArrayからでもOK？pavelさんのあれは必要ないわけだ。）

  // 生成関数はあっちでも使うので移植しました。

  // 名前で管理
  // RenderNodeに管理させる。textureそれ自体に触れることはまずないので。srcだけアクセス可能にする。
  // glとdictが無いと...もっともこれを直接いじる必要性を感じない、基本シェーダーで書き込むものだから。
  // そう割り切ってしまってもいいのよね...というかさ、今まで通りテクスチャを直接...
  // あー、p5のTexture使いたくないんだっけ。じゃあ仕方ないな。

  // デフォルトは2DですがCUBE_MAPも使えるようにします
  // そのためにはinfo指定でtarget:"cube_map"ってやればいいです。デフォルトは"2d"です。
  // ただしtargetには"texture_2d"もしくは"texture_cube_map"が入ります。dictと組み合わせてgl定数を取得するためです。
  // infoの方はめんどくさいので2dもしくはcube_mapで指定できるようにします...が、2dはデフォなので明示することはないかも。
  // targetが"cube_map"の場合、{src:~~~}ではなく、{src:{xp:~~, xn:~~, yp:~~, yn:~~, zp:~~, zn:~~}}
  // ってやればいいと思う。それぞれにグラフィックを入れる。
  // getTextureSourceについても{xp:~~,yp:~~}の形でそのまま返すようにしよう
  class TextureEx{
    constructor(gl, info, dict){
      this.gl = gl;
      this.dict = dict;
      this.name = info.name;
      this.src = info.src; // ソース。p5.Graphicsの場合これを使って...
      _validateForTexture(info); // _createTexture内部ではやらないことになった
      this.target = info.target; // テクスチャターゲット。デフォルトは2dですがcube_mapも使えるようにします。
      this.tex = _createTexture(gl, info, dict);
      // infoのバリデーションが済んだので各種情報を格納
      this.w = (info.w !== undefined ? info.w : 1);
      this.h = (info.h !== undefined ? info.h : 1);
      this.wrapParam = {s:info.sWrap, t:info.tWrap}; // → info.sWrap, info.tWrap
      this.filterParam = {magFilter:info.magFilter, minFilter:info.minFilter}; // → info.mag, info.min
      this.formatParam = {internalFormat:info.internalFormat, format:info.format, type:info.type};
    }
    generateMipmap(){
      // mipmap作るやつ。使うかどうかは、知らん。
      // cubemapにも対応させたが...うーん。
      const {gl, dict} = this;
      const target = dict[this.target];
      gl.bindTexture(target, this.tex);
      gl.generateMipmap(target);
      gl.bindTexture(target, null);
    }
    setFilterParam(param = {}){
      const {gl, dict} = this;
      const target = dict[this.target];
      if(param.magFilter !== undefined){ this.filterParam.magFilter = param.magFilter; }
      if(param.minFilter !== undefined){ this.filterParam.minFilter = param.minFilter; }
      // フィルタ設定関数
      gl.bindTexture(target, this.tex);
      gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, dict[this.filterParam.magFilter]); // 拡大表示用
      gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, dict[this.filterParam.minFilter]); // 縮小表示用
      gl.bindTexture(target, null);
    }
    setWrapParam(param = {}){
      const {gl, dict} = this;
      const target = dict[this.target];
      if(param.sWrap !== undefined){ this.wrapParam.sWrap = param.sWrap; }
      if(param.tWrap !== undefined){ this.wrapParam.tWrap = param.tWrap; }
      // ラッピング設定関数
      gl.bindTexture(target, this.tex);
      gl.texParameteri(target, gl.TEXTURE_WRAP_S, dict[this.wrapParam.sWrap]);
      gl.texParameteri(target, gl.TEXTURE_WRAP_T, dict[this.wrapParam.tWrap]);
      gl.bindTexture(target, null);
    }
    getTextureSource(){
      // Source取得関数。主にp5の2D用。cubemapの場合はxp,xn,yp,yn,zp,znごとにsourceが入ってるやつが来る感じで。
      return this.src;
    }
    updateTexture(){
      const {gl, dict} = this;
      const target = dict[this.target];
      // texSubImage2Dを使って内容を上書きする。主にp5の2D用。
      // cubemapの場合はそれぞれ別々にやればできる...か？
      // 上書きはsourceを取得して個別に行なうのよね。
      // ほぼ同じ処理のコピペだな...メソッド化するわ、そのうち。
      // これについてはテストが必要ですね（やります）

      const data = _getTextureData(this.target, this.src);
      gl.bindTexture(target, this.tex);
      _texImage(gl, target, data, this.w, this.h, dict[this.formatParam.internalFormat], dict[this.formatParam.format], dict[this.formatParam.type]);

      gl.bindTexture(target, null);
      // 果たしてこれでちゃんと上書きされるのか...
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Vec3. normalの計算でもこれ使おう。

  // とりあえずこんなもんかな。まあ難しいよねぇ。
  // CameraExのパラメータをベクトルで管理したいのですよね。でもp5.Vector使い勝手悪いので。自前で...

  // xxとかyyとかyxyとかであれが出るのとか欲しいな～（だめ）
  class Vec3{
    constructor(x, y, z){
      const r = _getValidation(x, y, z);
      this.x = r.x;
      this.y = r.y;
      this.z = r.z;
    }
    set(a, b, c){
      const r = _getValidation(a, b, c);
      this.x = r.x;
      this.y = r.y;
      this.z = r.z;
      return this;
    }
    toArray(){
      return [this.x, this.y, this.z];
    }
    toString(){
      // 文字列化も必要でしょう。
      return "(" + (this.x).toFixed(3) + ", " + (this.y).toFixed(3) + ", " + (this.z).toFixed(3) + ")";
    }
    add(a, b, c){
      const r = _getValidation(a, b, c);
      this.x += r.x;
      this.y += r.y;
      this.z += r.z;
      return this;
    }
    addScalar(v, s = 1){
      // vはベクトル限定。vのs倍を足し算する処理。なぜ用意するのか？不便だから。
      this.x += s * v.x;
      this.y += s * v.y;
      this.z += s * v.z;
      return this;
    }
    sub(a, b, c){
      const r = _getValidation(a, b, c);
      this.x -= r.x;
      this.y -= r.y;
      this.z -= r.z;
      return this;
    }
    mult(a, b, c){
      const r = _getValidation(a, b, c, 1); // 掛け算のデフォは1でしょう
      this.x *= r.x;
      this.y *= r.y;
      this.z *= r.z;
      return this;
    }
    divide(a, b, c){
      const r = _getValidation(a, b, c, 1); // 割り算のデフォも1でしょう
      if(r.x === 0.0 || r.y === 0.0 || r.z === 0.0){
        myAlert("Vec3 divide: zero division error!");
        return null;
      }
      this.x /= r.x;
      this.y /= r.y;
      this.z /= r.z;
      return this;
    }
    dot(a, b, c){
      const r = _getValidation(a, b, c);
      return this.x * r.x + this.y * r.y + this.z * r.z;
    }
    mag(v){
      // いわゆる大きさ。自分の二乗のルート。
      return Math.sqrt(this.dot(this));
    }
    dist(v){
      // vとの距離。
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      const dz = this.z - v.z;
      return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    cross(a, b, c){
      // ベクトルでなくてもいいのかなぁ。んー。まあ3成分でもOKにするか。
      const r = _getValidation(a, b, c);
      const {x:x0, y:y0, z:z0} = this;
      this.x = y0 * r.z - z0 * r.y;
      this.y = z0 * r.x - x0 * r.z;
      this.z = x0 * r.y - y0 * r.x;
      return this;
    }
    rotate(v, theta){
      // ベクトルvの周りにtだけ回転させる処理。vはVec3ですがx,y,z...まあ、いいか。
      const L = v.mag();
      const a = v.x/L;
      const b = v.y/L;
      const c = v.z/L;
      const s = 1 - Math.cos(theta);
      const t = Math.cos(theta);
      const u = Math.sin(theta);
      // GLSL内部の計算に準拠して0,1,2で左、3,4,5で中央、6,7,8で右の列。それを自身を列ベクトルとみなして
      // それに掛けているイメージですね。迷ったらvを(0,0,1)にしましょう。理屈はちゃんとあります（クォータニオン）
      this.multMat([
        s*a*a + t,   s*a*b + u*c, s*a*c - u*b,
        s*a*b - u*c, s*b*b + t,   s*b*c + u*a,
        s*a*c + u*b, s*b*c - u*a, s*c*c + t
      ]);
      return this;
      // OK??
    }
    normalize(){
      const L = this.mag();
      if(L == 0.0){
        myAlert("Vec3 normalize: zero division error!");
        return null;
      }
      this.divide(L);
      return this;
    }
    multMat(m){
      // mは3x3行列を模した長さ9の配列、成分の並びは縦。つまり0,1,2で列ベクトル1で、3,4,5で列ベクトル2で、
      // 6,7,8で列ベクトル3という、これを縦に並んだthis.x,this.y,this.zに掛け算するイメージ。です。
      if(m === undefined){
        // 一応未定義の時のために単位行列おいとくか
        m = new Array(9);
        m[0] = 1; m[1] = 0; m[2] = 0;
        m[3] = 0; m[4] = 1; m[5] = 0;
        m[6] = 0; m[7] = 0; m[8] = 1;
      }
      const {x:a, y:b, z:c} = this;
      this.x = m[0] * a + m[3] * b + m[6] * c;
      this.y = m[1] * a + m[4] * b + m[7] * c;
      this.z = m[2] * a + m[5] * b + m[8] * c;
      return this;
    }
    copy(){
      return new Vec3(this.x, this.y, this.z); // copy欲しいです
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // utility for Vec3.

  // 汎用バリデーション関数
  // aがnumberならb,cもそうだろうということでa,b,cで確定
  // aがArrayなら適当に長さ3の配列をあてがってa[0],a[1],a[2]で確定
  // それ以外ならa.x,a.y,a.zを割り当てる。最終的にオブジェクトで返す。
  // なお_defaultはaがnumberだった場合に用いられるaのデフォルト値
  // ...defaultは予約語なので_を付ける必要があるわね。
  function _getValidation(a, b, c, _default = 0){
    const r = {};
    if(a === undefined){ a = _default; }
    if(typeof(a) === "number"){
      if(b === undefined){ b = a; }
      if(c === undefined){ c = b; }
      r.x = a; r.y = b; r.z = c;
    }else if(a instanceof Array || a instanceof Float32Array || a instanceof Uint8Array){
      if(a[0] === undefined){ a[0] = _default; }
      if(a[1] === undefined){ a[1] = a[0]; }
      if(a[2] === undefined){ a[2] = a[1]; }
      r.x = a[0]; r.y = a[1]; r.z = a[2];
    }
    if(r.x !== undefined){ return r; } // あ、===と!==間違えた...
    return a; // aがベクトルとかの場合ね。.x,.y,.zを持ってる。
  }

  // utility for Vec3.
  function _tripleMultiple(u, v, w){
    let result = 0;
    result += u.x * v.y * w.z;
    result += u.y * v.z * w.x;
    result += u.z * v.x * w.y;
    result -= u.y * v.x * w.z;
    result -= u.z * v.y * w.x;
    result -= u.x * v.z * w.y;
    return result;
  }

  // ---------------------------------------------------------------------------------------------- //
  // Painter.

  // shaderは廃止。いいのかどうかは知らない。
  // getProgramで名前を渡す。理由は原因追及をしやすくするため。
  class Painter{
    constructor(gl, name, vs, fs, outVaryings = []){
      this.gl = gl;
      this.name = name;
      this.outVaryings = outVaryings; // TF用
      this.program = _getProgram(name, this.gl, vs, fs, outVaryings); // TFの場合はoutVaryingsの長さが1以上
      this.attributes = _loadAttributes(this.gl, this.program); // 属性に関するshader情報
      this.uniforms = _loadUniforms(this.gl, this.program); // ユニフォームに関するshader情報
    }
    use(){
      // これでいいはず。ただ以前GPUパーティクルでこれやったとき変なちらつきが起きたのよね。
      // それが気になったのでやめたんですよね。今回はどうかな...
      this.gl.useProgram(this.program);
    }
    getProgram(){
      return this.program;
    }
    getAttributes(){
      return this.attributes;
    }
    getAttribute(name){
      return this.attributes[name];
    }
    getUniforms(){
      return this.uniforms;
    }
    getUniform(name){
      // ピンポイントでuniformを取得する個別の関数。あると便利かもしれない。
      return this.uniforms[name];
    }
    setUniform(name, data){
      // ていうかsetUniformこいつの仕事だろ。
      // texture以外です。
      _setUniform(this.gl, this.uniforms[name], data);
    }
    setTexture2D(name, _texture){
      // 非推奨。
      // 後方互換性のために非推奨指定したうえで残しておきます。
      const gl = this.gl;
      const uniform = this.uniforms[name];
      // activateする番号とuniform1iで登録する番号は一致しており、かつsamplerごとに異なる必要があるということ
      gl.activeTexture(gl.TEXTURE0 + uniform.samplerIndex);
      gl.bindTexture(gl.TEXTURE_2D, _texture);
      gl.uniform1i(uniform.location, uniform.samplerIndex);
    }
    setTexture(name, _texture){
      // 2d, cube_map, 2d_arrayなどを想定
      const gl = this.gl;
      const uniform = this.uniforms[name];
      const target = this.uniforms.samplerTargetArray[uniform.samplerIndex];
      // activateする番号とuniform1iで登録する番号は一致しており、かつsamplerごとに異なる必要があるということ
      gl.activeTexture(gl.TEXTURE0 + uniform.samplerIndex);
      gl.bindTexture(target, _texture);
      gl.uniform1i(uniform.location, uniform.samplerIndex);
    }
    unbindTexture2D(){
      // 非推奨。
      const gl = this.gl;
      // 後方互換性のために非推奨指定したうえで残しておきます。
      // 最初から...まあいいや。
      // 2Dや3Dのテクスチャがbindされていたら解除(今は2D only.)
      // maxSamplerIndexでサンプラーインデックスの上限が分かる
      // そこまでのすべてのtextureUnitの中身をからっぽにする（従来の処理ではひとつしかnullにできなかった）
      for(let i = 0; i < this.uniforms.maxSamplerIndex; i++){
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
    }
    unbindTexture(){
      // targetが異なってもやることは同じ。
      const gl = this.gl;
      for(let i = 0; i < this.uniforms.maxSamplerIndex; i++){
        const target = this.uniforms.samplerTargetArray[i];
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(target, null);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // defaultPainter.
  // まあ、なんかあった方がいいよね。

  function _validateForView(view, align = "left_top"){
    // viewをいじって左下ベースにする。この処理は汎用的かもしれない。
    const alignText = align.split("_");
    const xAlign = alignText[0];
    const yAlign = alignText[1];
    const {x, y, w, h} = view;
    switch(xAlign){
      case "left": view.x = x; break;
      case "right": view.x = x-w; break;
      case "center": view.x = x-w/2; break;
    }
    switch(yAlign){
      case "top": view.y = 1-y-h; break;
      case "bottom": view.y = 1-y; break;
      case "center": view.y = 1-y-h/2; break;
    }
  }

  function _validateForSrc(info = {}){
    // textureかframebufferか。
    if(info.type === undefined){
      info.type = "tex";
    }
    // flipはtextureの場合trueでframebufferの場合falseが基本
    if(info.flip === undefined){
      if(info.type === "tex"){
        info.flip = true;
      }else if(info.type === "fb"){
        info.flip = false;
      }else{
        myAlert("validateForCopySrcInfo error: invalid type.");
        return;
      }
    }
    // align.
    if(info.align === undefined){
      info.align = "left_top";
    }
    // view.
    if(info.view === undefined){
      info.view = {x:0, y:0, w:1, h:1};
    }else if(Array.isArray(info.view)){
      // 配列でも指定できた方がいいよねぇ
      info.view = {x:info.view[0], y:info.view[1], w:info.view[2], h:info.view[3]};
    }
    // 汎用処理。左下ベースにする。
    _validateForView(info.view, info.align);

    // opacity. sourceColor計算後にaに掛ける。
    if(info.opacity === undefined){ info.opacity = 1; }
    // tintとambient.
    if(info.tint === undefined){ info.tint = [1,1,1]; }
    if(info.ambient === undefined){ info.ambient = [0,0,0]; }
    // uvShift. uvをずらしたい場合。textureはmirrorやrepeatを付けておかないとね。
    if(info.uvShift === undefined){ info.uvShift = [0,0]; }
    // gradationStart. グラデーションのスタート。デフォは(0,0,0,0,0).
    // (u,v,r,g,b)で、(u,v)が起点となる。(r,g,b)から変化していく。
    // gradationStop. グラデーションのストップ。デフォは(1,1,0,0,0).
    // (u,v,r,g,b)で、(u,v)が終点となる。(r,g,b)で終わる。smoothstepを使う。
    if(info.gradationFlag === undefined){ info.gradationFlag = 0; } // none.
    if(info.gradationStart === undefined){ info.gradationStart = [0,0,0,0,0,0]; }
    if(info.gradationStop === undefined){ info.gradationStop = [0,0,0,0,0,0]; }

    // attachとcolorはfbの場合。indexはMRTの場合。
    if(info.type === "fb"){
      // fbのcolor, depth, stencilのどれを使うか、colorであればindexはどれか、を指定。depthが見たいのよね。
      if(info.attach === undefined){ info.attach = "color"; }
      if(info.attach === "color"){
        if(info.index === undefined){ info.index = 0; } // たとえばindexだけ指定するような場合「attach:"color"」は不要。
      }
    }
  }

  function _validateForCopy(info = {}){
    if(info.dst === undefined){
      info.dst = {type:null};
    }
    if(info.dst.type === "fb" && info.dst.name === undefined){
      myAlert("validateForCopy error: invalid fbo name.");
      return;
    }
    // 外側のviewでは描画範囲のviewportを指定する...これもできた方がいいと思うので。
    if(info.view === undefined){
      info.view = [0, 0, 1, 1]; // （左上指定）
    }
    // blendは基本trueでsrc_alphaとone_minus_src_alphaで上から貼り付ける感じで使います
    // falseにする場合もある。floatの場合とか。使うか知らないけど。floatだと切らないといろいろまずい。
    if(info.blend === undefined){
      info.blend = true;
    }
    // まあ使い方によっては乗算とかね。使うのか知らんけど。
    if(info.blend === true && info.blendFunc === undefined){
      info.blendFunc = {src:"src_alpha", dst:"one_minus_src_alpha"};
    }
    // depthOffは板ポリ描画の際は常に切るようにするか～ていうかblendが機能する場合これは常に切るんよね（本来）
    // 重ねることができるのはLEQUALだから。同じ場合は上書きする。LESSだと上書きできない。p5.jsの厚意。
    if(info.depthOff === undefined){
      info.depthOff = true;
    }
    // info.srcは一つの場合でも配列化する。
    if(Array.isArray(info.src)){
      for(let srcInfo of info.src){
        // 長くなるので別立て。
        _validateForSrc(srcInfo);
      }
    }else{
      _validateForSrc(info.src); // 戻り値はないので...
      info.src = [info.src]; // まあ、infoを返してもいいんだけどね。今更統一できないので。
    }
    // 以上。swapはメインコードで。
  }

  // copy.
  function getCopyShaders(){
    // flipとviewを配列にして渡す。あとはシェーダの仕事。
    const vs =
    `#version 300 es
    in float aIndex;
    in vec2 aUv;
    uniform bool uFlips[8];
    uniform vec4 uViews[8];
    uniform float uOpacity[8];
    uniform vec3 uTint[8];
    uniform vec3 uAmbient[8];
    uniform vec2 uUvShift[8];
    uniform int uGradationFlag[8];
    uniform vec4 uGradationAnchor[8];
    uniform vec4 uStartColor[8];
    uniform vec4 uStopColor[8];
    out vec2 vUv;
    flat out int vIndex; // indexBufferで書き直したらflatでいけました。
    out float vOpacity;
    out vec3 vTint;
    out vec3 vAmbient;
    flat out int vGradationFlag;
    out vec4 vGradationAnchor;
    out vec4 vStartColor;
    out vec4 vStopColor;
    void main(){
      int index = int(aIndex / 4.0);
      //int index = int(boardIndex);
      bool flip = uFlips[index];
      vec4 view = uViews[index];
      float pointIndex = mod(aIndex, 4.0);
      vec2 p;
      // -1.0～1.0ベースで考えるんだっけね...つまり2倍して1を引く。
      p.x = view.x + (mod(pointIndex, 2.0) == 0.0 ? 0.0 : view.z);
      p.y = view.y + (floor(pointIndex / 2.0) == 0.0 ? 0.0 : view.w);
      p.x = 2.0 * p.x - 1.0;
      p.y = 2.0 * p.y - 1.0;
      if(flip){
        vUv = vec2(aUv.x, 1.0 - aUv.y);
      }else{
        vUv = aUv;
      }
      vUv -= uUvShift[index]; // uvをshiftさせる場合。マイナスするのはいわゆる「平行移動の原理」ってやつ。
      gl_Position = vec4(p, 0.0, 1.0);
      vIndex = int(index);
      vOpacity = uOpacity[index];
      vTint = uTint[index];
      vAmbient = uAmbient[index];
      vGradationFlag = uGradationFlag[index];
      vGradationAnchor = uGradationAnchor[index];
      vStartColor = uStartColor[index];
      vStopColor = uStopColor[index];
    }
    `;
    // テクスチャを配列にするのはめんどくさい処理なので直書きでOKです。
    const fs =
    `#version 300 es
    precision mediump float;
    in vec2 vUv;
    flat in int vIndex;
    in float vOpacity;
    in vec3 vTint;
    in vec3 vAmbient;
    flat in int vGradationFlag;
    in vec4 vGradationAnchor;
    in vec4 vStartColor;
    in vec4 vStopColor;
    const int LINEAR_GRADIENT = 1;
    const int RADIAL_GRADIENT = 2;
    uniform sampler2D uTex0;
    uniform sampler2D uTex1;
    uniform sampler2D uTex2;
    uniform sampler2D uTex3;
    uniform sampler2D uTex4;
    uniform sampler2D uTex5;
    uniform sampler2D uTex6;
    uniform sampler2D uTex7;
    out vec4 fragColor;
    // 線形グラデーション
    void applyLinearGradient(in vec2 p, inout vec4 result){
      vec2 start = vGradationAnchor.xy;
      vec2 stop = vGradationAnchor.zw;
      vec2 n = normalize(stop - start);
      float ratio = clamp(dot(p-start, n) / length(stop - start), 0.0, 1.0);
      vec4 gradColor = (1.0-ratio)*vStartColor + ratio*vStopColor;
      // アルファブレンディング、やっぱこっちのが正解っぽいな。テキストが汚くなる。
      //result = result.a * result + (1.0 - result.a) * gradColor;
      // 一旦戻します
      result.rgb = result.a * result.rgb + (1.0 - result.a) * gradColor.rgb;
      result.a = result.a + gradColor.a - result.a * gradColor.a;
    }
    // 放射状グラデーション
    void applyRadialGradient(in vec2 p, inout vec4 result){
      vec2 start = vGradationAnchor.xy;
      vec2 stop = vGradationAnchor.zw;
      float ratio = clamp(length(p - start)/length(stop - start), 0.0, 1.0);
      vec4 gradColor = (1.0-ratio)*vStartColor + ratio*vStopColor;
      result = result.a * result + (1.0 - result.a) * gradColor;
    }
    // メイン
    void main(){
      //int i = vBoardIndex;
      vec4 result;
      if(vIndex == 0){ result = texture(uTex0, vUv); }
      if(vIndex == 1){ result = texture(uTex1, vUv); }
      if(vIndex == 2){ result = texture(uTex2, vUv); }
      if(vIndex == 3){ result = texture(uTex3, vUv); }
      if(vIndex == 4){ result = texture(uTex4, vUv); }
      if(vIndex == 5){ result = texture(uTex5, vUv); }
      if(vIndex == 6){ result = texture(uTex6, vUv); }
      if(vIndex == 7){ result = texture(uTex7, vUv); }
      result.a *= vOpacity;
      if(vGradationFlag == LINEAR_GRADIENT){ applyLinearGradient(vUv, result); }
      if(vGradationFlag == RADIAL_GRADIENT){ applyRadialGradient(vUv, result); }
      result.rgb *= vTint;
      result.rgb += vAmbient;
      //if(result.a < 0.001){ discard; }
      fragColor = result * vec4(vec3(result.a), 1.0);
    }
    `;
    return {v:vs, f:fs};
  }

  // infoの仕様(example)
  // swapはnodeが要るのでここで判断に入れるのはやめよう
  // {dst:{type:null/"fb", name:dstName},
  //  src:{type:"tex"/"fb", name:srcName, flip:true/false(typeによりデフォ分岐),
  //       view:[0,0,0.5,0.5], align:"left_top" ,attach:"color", index:0},
  //  blend:true/false, blendFunc:{src:"src_alpha", dst:"one_minus_src_alpha"}, depthOff:false/true}

  // 第一弾。copyPainter.（苦労したぜ...）
  // info.dstで描画先のframebufferを指定
  // そこにinfo.srcの内容を描画する
  // 描画位置をviewで指定できる（デフォルトはべったり全体）
  // srcを配列にすることで複数表示も可能
  // blendモードもいじれる
  // alignで右下とかもできる（自由）
  // MRTの場合は何番のtextureを貼り付けるかとか指示できる
  // 最大数は8です
  // 高い技術があれば50とか行けるらしいが...未知の技術...
  function copyPainter(node, info = {}){
    // バリデーション
    _validateForCopy(info);
    // blendがある場合は適用、最後に戻す。デフォtrue.
    if(info.blend){
      node.enable("blend")
          .blendFunc(info.blendFunc.src, info.blendFunc.dst); // Separateじゃない方がいいのだろうか...
          //.blendFuncSeparate(info.blendFunc.src, info.blendFunc.dst, "one", "one");
    }
    // depthOffがある場合はdepthを切る. デフォtrue.
    if(info.depthOff){
      node.disable("depth_test");
    }
    const {dst:_dst, src:_src} = info;

    // 終わったらその時のFBOに戻すので
    const previousFBO = node.getCurrentFBO();

    // fboのbind
    if(_dst.type === null){
      node.bindFBO(null);
    }else{
      node.bindFBO(_dst.name);
    }
    node.setViewport(...info.view);
    // painter準備
    node.use("foxCopyPainter", "foxQuads");

    // uniformの準備
    const flips = new Array(8);
    const views = new Array(4*8);
    const opacities = new Array(8); // 透明度補正
    const tints = new Array(3*8); // 乗算
    const ambients = new Array(3*8); // 加算
    const uvShifts = new Array(2*8); // uvScroll
    const gradationFlags = new Array(8); // グラデーションフラグ。0:なし、1:線形、2:放射状
    const gradAnchors = new Array(4*8); // グラデーションのアンカー
    const startColors = new Array(4*8); // 開始色
    const stopColors = new Array(4*8); // 終了色
    const count = _src.length;
    for(let i=0; i<count; i++){
      const _srcData = _src[i];
      const {x, y, w, h} = _srcData.view;
      // textureの準備
      if(_srcData.type === "tex"){
        node.setTexture2D("uTex" + i, _srcData.name);
      }
      if(_srcData.type === "fb"){
        node.setFBOtexture2D("uTex" + i, _srcData.name, _srcData.attach, _srcData.index);
      }
      flips[i] = _srcData.flip;
      views[4*i] = x; views[4*i+1] = y; views[4*i+2] = w; views[4*i+3] = h;
      opacities[i] = _srcData.opacity;
      tints[3*i] = _srcData.tint[0]; tints[3*i+1] = _srcData.tint[1]; tints[3*i+2] = _srcData.tint[2];
      ambients[3*i] = _srcData.ambient[0]; ambients[3*i+1] = _srcData.ambient[1]; ambients[3*i+2] = _srcData.ambient[2];
      uvShifts[2*i] = _srcData.uvShift[0]; uvShifts[2*i+1] = _srcData.uvShift[1];
      const gs = _srcData.gradationStart;
      const gp = _srcData.gradationStop;
      gradationFlags[i] = _srcData.gradationFlag;
      gradAnchors[4*i] = gs[0]; gradAnchors[4*i+1] = gs[1]; gradAnchors[4*i+2] = gp[0]; gradAnchors[4*i+3] = gp[1];
      startColors[4*i] = gs[2]; startColors[4*i+1] = gs[3]; startColors[4*i+2] = gs[4]; startColors[4*i+3] = gs[5];
      stopColors[4*i] = gp[2];  stopColors[4*i+1] = gp[3];  stopColors[4*i+2] = gp[4]; stopColors[4*i+3] = gp[5];
    }
    node.setUniform("uFlips", flips);
    node.setUniform("uViews", views);
    node.setUniform("uOpacity", opacities);
    node.setUniform("uTint", tints);
    node.setUniform("uAmbient", ambients);
    node.setUniform("uUvShift", uvShifts);
    node.setUniform("uGradationFlag", gradationFlags);
    node.setUniform("uGradationAnchor", gradAnchors);
    node.setUniform("uStartColor", startColors);
    node.setUniform("uStopColor", stopColors);

    node.bindIBO("foxIBOForQuads");
    node.drawElements("triangles");
    // 戻す
    if(info.depthOff){
      node.enable("depth_test");
    }
    if(info.blend){
      node.disable("blend");
    }
    // 普通に考えたら「doubleの場合は常にswap」って迷惑でしかない気が...保留。
    // 呼び出すたびにreadが空になるのおかしいでしょ。
    // 後始末
    node.unbind();

    // 元のFBOに戻す
    node.bindFBO(previousFBO);
  }

  // ---------------------------------------------------------------------------------------------- //
  // Figure.
  // いろいろやることあるんかなぁ。今はこんな感じ。dict渡したけどまあ、何かに使えるでしょう...分かんないけど。
  // こっちもインスタンスで拡張できるはず...除数を指定するだけでしょ？
  class Figure{
    constructor(gl, name, attrs, dict){
      this.gl = gl;
      this.name = name;
      this.useVAO = false; // VAOFigureと区別する。
      this.vbos = _createVBOs(gl, attrs, dict);
      // countはもう計算してしまおう（面倒）
      const attrName = Object.keys(this.vbos)[0];
      this.count = this.vbos[attrName].count / this.vbos[attrName].size; // countを持たせてしまう。
    }
    getVBOs(){
      return this.vbos;
    }
    swapAttribute(attrName0, attrName1){
      // この機能はVAOではサポートされません。
      // TFのための機能であり、TFはVAOと共存できないためです。
      const vbos = this.getVBOs();
      if (vbos[attrName0] === undefined || vbos[attrName1] === undefined) {
        myAlert("invalid attribute name (Figure_swapAttribute)");
        return;
      }
      const tmpAttr = vbos[attrName0];
      vbos[attrName0] = vbos[attrName1];
      vbos[attrName1] = tmpAttr;
    }
  }

  // VAOです
  // IBOは扱いません。別にします。
  class VAOFigure{
    constructor(gl, name, attrs, dict){
      this.gl = gl;
      this.name = name;
      this.useVAO = true; // VAOFigureです
      this.vao = _createVAO(gl, attrs, dict);
      // countはもう計算してしまおう（面倒）
      this.count = this.vao.attrCount;
    }
    getVAO(){
      // この中のvbosに名前経由でbufが入ってる感じ（動的更新で使う）
      return this.vao;
    }
  }

  // TransformFeedback用のFigureは要らないかも。

  // ---------------------------------------------------------------------------------------------- //
  // utility for Figure.

  // getNormals
  // verticesは3つずつ頂点座標が入ってて
  // indicesは3つずつ三角形の頂点のインデックスが入ってるわけね

  // y軸が上の右手系にしました（射影行列いじった）
  // その関係でu0,u1,u2取得部分は元に戻します。以上です。

  // indicesの3*i,3*i+1,3*i+2それぞれに対して
  // たとえばk=indices[3*i]に対して
  // verticesの3*k,3*k+1,3*k+2番目の成分を取り出してベクトルを作る
  // それを3つやる
  // 次にv0,v1,v2で作る三角形のそれぞれの内角の大きさを出す
  // なお外積とarcsinで出すのでそのまま正規化されてる
  // 向きについてはv0,v1,v2の順に時計回りであることが想定されてる
  // 得られた角度を法線ベクトル（大きさ1）にかけて
  // それぞれk番目のnormalsに加える
  // 終わったらnormalsをすべて正規化
  // あとは成分ごとにばらして終了

  // あーなるほど...p5.jsのベクトル使ってるのね...
  // 確かに、これVec3で書き換えたいわね。
  // よく見るとこれ、Vec3なら一切createVector要らんな...全く必要ないわ。
  // まあ新しいベクトル一切作らなくていいことがパフォーマンスにどう影響するかって言ったら
  // 微々たるもんだろうけど。でも、しないにこしたことはないわよね。
  // んー。でもそのためには...
  // そうね。追加でverticesのベクトルをセットするVec3が3つ、要るかもだね。
  // 最後のとこはcreateVector...本家でもaddって普通に足せるらしい...そうなんだ...
  // まあそれでも実装するけど。

  // おそらく合ってるはず. いいや。普通に成分だけで。
  function getNormals(vertices, indices){
    const N = Math.floor(vertices.length / 3);
    let normals = new Array(N);
    for(let i = 0; i < N; i++){
      normals[i] = new Vec3(0);
    }
    let v0 = new Vec3(0);
    let v1 = new Vec3(0);
    let v2 = new Vec3(0);
    let u0 = new Vec3(0);
    let u1 = new Vec3(0);
    let u2 = new Vec3(0);
    let m0, m1, m2, sin0, sin1, sin2, angle0, angle1, angle2;
    for(let i = 0; i < Math.floor(indices.length / 3); i++){
      const id = [indices[3*i], indices[3*i+1], indices[3*i+2]];
      v0.set(vertices[3*id[0]], vertices[3*id[0]+1], vertices[3*id[0]+2]);
      v1.set(vertices[3*id[1]], vertices[3*id[1]+1], vertices[3*id[1]+2]);
      v2.set(vertices[3*id[2]], vertices[3*id[2]+1], vertices[3*id[2]+2]);
      u0.set(v1).sub(v0);
      u1.set(v2).sub(v0);
      u2.set(v2).sub(v1);
      m0 = u0.mag();
      m1 = u1.mag();
      m2 = u2.mag();
      v0.set(u0).cross(u1);
      v1.set(u0).cross(u2);
      v2.set(u1).cross(u2);
      sin0 = v0.mag() / (m0 * m1);
      sin1 = v1.mag() / (m0 * m2);
      sin2 = v2.mag() / (m1 * m2);
      // ここでこれらの値が1を微妙に超えてしまうことでエラーになる場合がある(asinは-1～1の外は未定義)
      // その逆に-1を下回ってもエラーになる。
      // どうしようもないので1を超えたら2から引いて-1を下回ったら-2から引くことで間に合わせよう
      // 実は|u|^2・|v|^2 = |uxv|^2 + |u・v|^2 なんだけどね
      // 内積の方でやってもそっちが1を越えたりするからね。どうしようも、ないのです。
      if(sin0 > 1){ sin0 = 2-sin0; }
      if(sin0 < -1){ sin0 = -2-sin0; }
      if(sin1 > 1){ sin1 = 2-sin1; }
      if(sin1 < -1){ sin1 = -2-sin1; }
      if(sin2 > 1){ sin2 = 2-sin2; }
      if(sin2 < -1){ sin2 = -2-sin2; }
      angle0 = Math.asin(sin0);
      angle1 = Math.asin(sin1);
      angle2 = Math.asin(sin2);
      v0.normalize();
      normals[id[0]].addScalar(v0, angle0);
      normals[id[1]].addScalar(v0, angle1);
      normals[id[2]].addScalar(v0, angle2);
    }
    let result = new Array(3*N);
    for(let i=0; i<N; i++){
      normals[i].normalize();
      result[3*i] = normals[i].x;
      result[3*i+1] = normals[i].y;
      result[3*i+2] = normals[i].z;
    }
    return result;
  }

  // ---------------------------------------------------------------------------------------------- //
  // Meshes.

  // 立方体
  // まあキューブマップ使いましょうね
  function getCubeMesh(_size = 1){
    // 上の方の正方形がxMinusでその下にzPlus,xPlus,zMinusと続く
    // zPlusの左側がyMinusで、zPlusの右側がyPlusです。
    // つまり十字のクロスしたところにzPlusが来て下にxPlus,右にyPlusというイメージ。
    const v=[-1,-1,-1, -1,1,-1, -1,-1,1, -1,1,1, // x-minus
             -1,-1,1, -1,1,1, 1,-1,1, 1,1,1, // z-plus
             1,-1,1, 1,1,1, 1,-1,-1, 1,1,-1, // x-plus
             1,-1,-1, 1,1,-1, -1,-1,-1, -1,1,-1, // z-minus
             -1,-1,-1, -1,-1,1, 1,-1,-1, 1,-1,1, // y-minus
             -1,1,1, -1,1,-1, 1,1,1, 1,1,-1] // y-plus.
    for(let i=0; i<v.length; i++) { v[i] *= _size; }
    const f = [0,2,3, 0,3,1, 4,6,7, 4,7,5, 8,10,11, 8,11,9, 12,14,15, 12,15,13, 16,18,19, 16,19,17, 20,22,23, 20,23,21];
    const n = ex.getNormals(v, f);
    const createUV = (a,b) => { return [a, b, a+0.25, b, a, b+0.25, a+0.25, b+0.25]; }
    const uv = [];
    uv.push(...createUV(0.375, 0));
    uv.push(...createUV(0.375, 0.25));
    uv.push(...createUV(0.375, 0.5));
    uv.push(...createUV(0.375, 0.75));
    uv.push(...createUV(0.125, 0.25));
    uv.push(...createUV(0.625, 0.25));
    return {v, f, n, uv};
  }

  // 雑。z軸に平行な平面。
  function getPlaneMesh(_size = 1){
    const v = [-1,-1,0, 1,-1,0, -1,1,0, 1,1,0];
    for(let i=0; i<_size; i++) { v[i] *= _size; }
    const uv = [0, 1, 1, 1, 0, 0, 1, 0];
    const f = [0, 1, 2, 2, 1, 3];
    const n = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
    return {v, f, n, uv};
  }

  // UVめんどくさいな
  // 頂点を重複させればいい
  function getSphereMesh(_size = 1){
    const r = _size;
    const ds = 32;
    const dt = 48;
    const v = [];
    let n = [];
    const f = [];
    const uv = []; // ディテールでUVを張る

    // 頂点は重複させる
    for(let k=0; k<=ds; k++){
      const theta = Math.PI*k/ds;
      for(let m=0; m<=dt; m++){
        const phi = 2*Math.PI*m/dt;
        v.push(
          r*sin(theta)*cos(phi), r*sin(theta)*sin(phi), r*cos(theta)
        );
        n.push(
          sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta)
        );
        uv.push(m/dt, k/ds);
      }
    }

    for(let k=0; k<ds; k++){
      // 平面と同じようにする
      for(let m=0; m<dt; m++){
        const leftUp = k*(dt+1) + m;
        const leftDown = (k+1)*(dt+1) + m;
        const rightUp = leftUp+1;
        const rightDown = leftDown+1;
        f.push(leftUp, leftDown, rightDown, leftUp, rightDown, rightUp);
      }
    }

    return {v, f, n, uv};
  }

  function getTorusMesh(a=1.0, b=0.4){
    // 今回はトーラスで。紙の上で計算してるけどロジックは難しくないのよ。
    const ds = 32;
    const dt = 32;
    const v = [];
    const n = [];
    const uv = [];
    const f = [];
    const dTheta = Math.PI*2/ds;
    const dPhi = Math.PI*2/dt;
    // イメージ的にはkがx軸でlがy軸で原点左下の座標系を考えている
    // この原点はx軸aでz軸bの点で、そこから右と上にxとyをそれぞれ伸ばす感じ。
    for(let l=0; l<=dt; l++){
      for(let k=0; k<=ds; k++){
        const index = (dt+1)*l + k;
        const px = Math.cos(dPhi*l);
        const py = Math.sin(dPhi*l);
        const nx = Math.sin(dTheta*k)*px;
        const ny = Math.sin(dTheta*k)*py;
        const nz = Math.cos(dTheta*k);
        const x = a*px + b*nx;
        const y = a*py + b*ny;
        const z = b*nz;
        v.push(x, y, z);
        n.push(nx, ny, nz);
        uv.push((k+1)/ds, (l+1)/dt);
      }
    }
    // kとlに着目すると分かりやすいかもしれない。
    for(let l=0; l<dt; l++){
      for(let k=0; k<ds; k++){
        const index = dt*l + k;
        f.push(
          l*(ds+1) + k, l*(ds+1) + k+1, (l+1)*(ds+1) + k+1,
          l*(ds+1) + k, (l+1)*(ds+1) + k+1, (l+1)*(ds+1) + k
        );
      }
    }
    return {v, f, n, uv};
  }

  // v, n, uv, fは予約されているとする。
  // 他にも使いたい場合は配列の形で付加的に用意する。
  // まずメッシュ、次いで名前、最後に追加のattr
  // たとえば{name:"aColor", size:4, data:頂点色データ}
  // こんな感じ。要するに普通にattrを追加するだけ。
  // IBOは普通にname + IBOになるので注意しましょう
  function registMesh(node, mesh, meshName, otherAttrs = []){
    const attrData = [];
    attrData.push(
      {name:"aPosition", size:3, data:mesh.v},
      {name:"aNormal", size:3, data:mesh.n},
      {name:"aTexCoord", size:2, data:mesh.uv}
    );
    // これだとインスタンシングやトラフィーに対応できないのでそのままぶち込めばいい
    /*
    for(const attr of otherAttrs){
      attrData.push({name:attr.name, size:attr.size, data:attr.data});
    }
    */
    attrData.push(...otherAttrs);
    // そのうえでregistFigureすればいい
    node.registFigure(meshName, attrData);
    node.registIBO(meshName + "IBO", {data:mesh.f});
  }

  // ---------------------------------------------------------------------------------------------- //
  // RenderNode.

  class RenderNode{
    constructor(gl){
      this.gl = gl;
      this.painters = {};
      this.figures = {};
      this.fbos = {};
      this.ibos = {};
      this.textures = {}; // textures!
      this.currentPainter = undefined;
      this.currentFigure = undefined;
      this.currentIBO = undefined; // このくらいはいいか。
      this.currentFBO = null; // これがないとfbの一時的な切り替えができないので。文字列またはnull.
      this.enableExtensions(); // 拡張機能
      this.dict = getDict(this.gl); // 辞書を生成
      this.prepareDefault(); // defaultShaderの構築
      this.inTransformFeedback = false; // TFしてるかどうかのフラグ
    }
    enableExtensions(){
      // color_buffer_floatのEXT処理。pavelさんはこれ使ってwebgl2でもfloatへの書き込みが出来るようにしてた。
      // これによりframebufferはFRAMEBUFFER_COMPLETEを獲得する：https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float
      // 書き込み可能になるInternalFormatは「gl.R16F, gl.RG16F, gl.RGBA16F, gl.R32F, gl.RG32F, gl.RGBA32F, gl.R11FG11FB10F」？
      // 最後のはなんじゃい...
      this.gl.getExtension('EXT_color_buffer_float');
    }
    prepareDefault(){
      // copy.
      const _copy = getCopyShaders();
      this.registPainter("foxCopyPainter", _copy.v, _copy.f);
      // 一般的なboard. 要するにfoxBoardって書けば普通にこれ使えるので、もういちいち用意しなくていいんよ。
      this.registFigure("foxBoard", [{size:2, name:"aPosition", data:[-1,-1,1,-1,-1,1,1,1]}]);
      // 4枚のquad. 必要なだけ使う。UVは表示する際に適宜いじる。indexで位置を決めるのでaPositionは不要。
      const aIndexArray = new Array(4*8);
      const aUvArray = new Array(2*4*8);
      for(let i=0; i<4*8; i++){ aIndexArray[i] = i; }
      for(let i=0; i<8; i++){
        aUvArray[8*i] = 0; aUvArray[8*i+1] = 0; aUvArray[8*i+2] = 1; aUvArray[8*i+3] = 0;
        aUvArray[8*i+4] = 0; aUvArray[8*i+5] = 1; aUvArray[8*i+6] = 1; aUvArray[8*i+7] = 1;
      }
      this.registFigure("foxQuads", [{size:1, name:"aIndex", data:aIndexArray}, {size:2, name:"aUv", data:aUvArray}]);
      this.registIBO("foxIBOForQuads", {data:[0,1,2, 2,1,3, 4,5,6, 6,5,7, 8,9,10, 10,9,11, 12,13,14, 14,13,15,
                                        16,17,18, 18,17,19, 20,21,22, 22,21,23, 24,25,26, 26,25,27, 28,29,30, 30,29,31]});
    }
    clearColor(r, g, b, a){
      // clearに使う色を決めるところ
      this.gl.clearColor(r, g, b, a);
      return this;
    }
    clear(){
      // 通常のクリア。対象はスクリーンバッファ、もしくはその時のフレームバッファ
      // カスタムできた方がいいのかどうかはまだよくわからないが...
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      return this;
    }
    getDrawingBufferSize(fboName = null){
      // drawingBufferのsizeを取得する関数.
      // fboの名前の場合はそれを返す。スクリーンの場合はdrawingBufferWidthとdrawingBufferHeight.
      if(fboName === null){
        return {w:this.gl.drawingBufferWidth, h:this.gl.drawingBufferHeight};
      }
      let fbo = this.fbos[fboName];
      if(!fbo){
        // fboが無い場合の警告
        myAlert("bind failure: The corresponding framebuffer does not exist.");
        return null;
      }
      return {w:fbo.w, h:fbo.h};
    }
    enable(name){
      if(this.dict[name] === undefined){
        myAlert("enable failured: invalid name.");
        return null;
      }
      // 有効化指定(cull_face, depth_test, blendなど)
      this.gl.enable(this.dict[name]);
      return this;
    }
    cullFace(mode){
      if(this.dict[mode] === undefined){
        myAlert("cullFace failured: invalid mode name.");
        return null;
      }
      // デフォルトはBACK（上から見て反時計回り）
      this.gl.cullFace(this.dict[mode]); // default: back.
      return this;
    }
    blendFunc(sFactorName, dFactorName){
      // blendFunc. ファクターを一律に決める。
      this.gl.blendFunc(this.dict[sFactorName], this.dict[dFactorName]);
      return this;
    }
    blendFuncSeparate(sRGBFactorName, dRGBFactorName, sAFactorName, dAFactorName){
      // separate.
      this.gl.blendFuncSeparate(this.dict[sRGBFactorName], this.dict[dRGBFactorName], this.dict[sAFactorName], this.dict[dAFactorName]);
      return this;
    }
    disable(name){
      if(this.dict[name] === undefined){
        myAlert("disable failured: invalid name.");
        return null;
      }
      // 非有効化(cull_face, depth_test, blend)
      this.gl.disable(this.dict[name]);
      return this;
    }
    registPainter(name, vs, fs, outVaryings = []){
      // outVaryingsが[]かどうかで分岐処理する(TFに使う)
      const newPainter = new Painter(this.gl, name, vs, fs, outVaryings);
      this.painters[name] = newPainter;
      return this;
    }
    registFigure(name, attrs){
      // attrsは配列です。
      const newFigure = new Figure(this.gl, name, attrs, this.dict);
      this.figures[name] = newFigure;
      return this;
    }
    registVAOFigure(name, attrs){
      // vao版。作るのはVAOFigureです。どうしようね。figuresには入れよう。で、useVAOがあるかどうかで分ける。
      // Figureの方でuseVAO=falseってやる。もしかしたら継承使った方がいいのかも。
      // locationは配列に従って通し番号で設定されるのでshaderの設計が前提となります
      const newFigure = new VAOFigure(this.gl, name, attrs, this.dict);
      this.figures[name] = newFigure;
      return this;
    }
    registIBO(name, info){
      info.name = name; // infoは{data:[0,1,2,2,1,3]}みたいなので問題ないです。配列渡すのでもいいんだけど...柔軟性考えるとね...
      const newIBO = _createIBO(this.gl, info, this.dict);
      this.ibos[name] = newIBO;
      return this;
    }
    registFBO(name, info){
      // nameはここで付ける。wとhは必ず指定してください。
      info.name = name;
      if(info.color !== undefined && Array.isArray(info.color.info)){
        info.MRT = true; // MRTフラグ
      }else{
        info.MRT = false; // デフォルト
      }
      const newFBO = _createFBO(this.gl, info, this.dict);
      if(newFBO === undefined){
        myAlert("failure to create framebuffer.");
        return null;
      }
      this.fbos[name] = newFBO;
      return this;
    }
    registDoubleFBO(name, info){
      // nameはここで付ける。wとhは必ず指定してください。doubleのtrue,falseはあとで指定します。
      info.name = name;
      const newFBO = _createDoubleFBO(this.gl, info, this.dict);
      this.fbos[name] = newFBO;
      if(newFBO === undefined){
        myAlert("failure to create doubleFramebuffer.");
        return null;
      }
      return this;
    }
    registTexture(name, info = {}){
      // お待たせしました！！
      info.name = name;
      const newTexture = new TextureEx(this.gl, info, this.dict);
      this.textures[name] = newTexture;
      return this;
    }
    getTexture(name){
      // 使うかわかんないけどgetTexture. Wrapモードとかいじる必要があるならまあ、あった方がいいかなと。
      return this.textures[name];
    }
    getTextureSource(name){
      // source取得。これでp5.Graphicsを取得...
      return this.textures[name].getTextureSource();
    }
    updateTexture(name){
      // まあいいか。
      this.textures[name].updateTexture();
      return this;
    }
    usePainter(name){
      // Painter単独の有効化関数。複数のFigureをまとめてdrawする場合など。
      this.currentPainter = this.painters[name];
      this.currentPainter.use();
      return this;
    }
    drawFigure(name, tfDrawCall = undefined){
      // 異なるポリゴンを同じシェーダでレンダリングする際に重宝する。
      this.currentFigure = this.figures[name];
      // 属性の有効化（ここをvaoかそうでないかで分ける可能性があるわね）
      // vaoの場合はshaderの方のattribLocationを使わないからです。
      this.enableAttributes(tfDrawCall);
      return this;
    }
    use(painterName, figureName, tfDrawCall = undefined){
      // painter, figureの順に...さすがにめんどくさい。
      this.usePainter(painterName);
      // Painterが定義されていないと属性の有効化が出来ないのでこの順番でないといけない
      // tfDrawCallが設定されている場合はこれを渡すことでTFの準備をする
      this.drawFigure(figureName,  tfDrawCall);
      return this;
    }
    enableAttributes(tfDrawCall = undefined){
      // tfDrawCallがある場合にはoutIndexを持つattrに対して特別な処理を実行する。VAOは出てこない。TFと共存しないので。
      const isTF = (tfDrawCall !== undefined);
      // 設定できるthDrawCallはpoints, lines, triangles,の3種類だけのようです
      // 一応myAlertを出しておきます
      if (isTF && (tfDrawCall !== "points") && (tfDrawCall !== "lines") && (tfDrawCall !== "triangles")) {
        myAlert("There are only 3 types of draw calls for transformFeedback: points, lines and triangles.");
        return null;
      }
      // useVAO === trueの場合、vaoをbindするだけ。
      if (this.currentFigure.useVAO) {
        // こんだけ！！！！
        this.gl.bindVertexArray(this.currentFigure.getVAO().buf);
      } else {
        // 属性の有効化
        const attributes = this.currentPainter.getAttributes();
        const vbos = this.currentFigure.getVBOs();
        // どっちかっていうとvbosの方に従うべきかな...
        // 使わないattributeがあってもいいので
        for(let attrName of Object.keys(vbos)){
          const vbo = vbos[attrName];
          const attr = attributes[attrName];
          // 処理系によってはattrが取得できない（処理系がvbosサイドのattributeの一部を不要と判断するケースがある）ので、
          // その場合は処理をスキップするようにしましょう。ただ、なるべく過不足のない記述をしたいですね。
          if(vbo === undefined){ continue; }
          // TFの場合、outIndex>=0であるようなattributeは書き込み用で、
          // inで宣言されてないためshaderが捕捉できないので、
          // outIndexだけ見て個別に対処する。やっかいですね。
          // TFでない場合ここは完全に無視されて従来の挙動です。
          if (isTF && vbo.outIndex >= 0 && attr === undefined) {
            // isTFでなおかつoutIndexが0以上の場合はこのようにbindBufferBaseを用いる
            this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, vbo.outIndex, vbo.buf);
            // そしてこの処理が実行される場合、TFにおいてoutIndexが0以上の
            // attributeはshaderがattrとして認識していないので次の処理で
            // 自動的にcontinueされますが、念のため以降の処理が必要ないことを
            // 明示するためにここでcontinueします。
            // まずかったですね
            // 「attrがundefined」という条件を追加しました
            // これがないと描画と同時に更新することができないんですよね
            // attributeの入れ替えの際に入れ替えたattributeがoutIndexをもって
            // いない、また入れ替えでinされるattributeがoutIndexを持っている
            // ことにより不具合が生じるわけ
            // 同じIndexを指定しておくことで、これを回避できる。
            continue;
          }
          if(attr === undefined){ continue; }
          // isTFでないかisTFでもoutIndexが明示されていない場合は通常の処理。
          // vboをbindする
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo.buf);
          // attributeLocationを有効にする
          this.gl.enableVertexAttribArray(attr.location);
          // attributeLocationを通知し登録する
          this.gl.vertexAttribPointer(attr.location, vbo.size, vbo.type, false, 0, 0);
          // divisorが1以上の場合はvertexAttribDivisorを呼び出す
          // vboからdivisorを持ってこないといけないのね。

          // isTFの場合はdivisorを適用しない
          // こうしないとインスタンシングのattrだけ動的に更新する際に不具合が起きる。
          if (!isTF && vbo.divisor > 0) {
            this.gl.vertexAttribDivisor(attr.location, vbo.divisor);
          }
        }
      }
      if (isTF) {
        this.gl.beginTransformFeedback(this.dict[tfDrawCall]);
        this.inTransformFeedback = true;
      }
      return this;
    }
    bufferSubData(bufName, targetName, dstByteOffset, srcData, srcOffset = 0){
      // いわゆる動的更新。currentFigureに対し、それがもつ属性の名前と放り込む際に使う配列を渡して更新させる。
      // targetNameは array_buf: ARRAY_BUFFER で element_buf: ELEMENT_ARRAY_BUFFER ということですね。OK!
      // srcOffsetは常に0でいいですね。dstByteOffsetは何処のバイトから書き換えるか。srcDataのデータでそれを
      // 置き換える。たとえばfloat vec4で1番を置き換えるなら16を指定する。
      // ...現時点ではvaoは未対応だけど、おそらくvaoでもできるはず。vbosを取得しておけば。
      // attrNameが"ibo"の場合にiboを更新しよう。
      // iboの場合、Uint16ArrayのケースとUint32Arrayのケースがあり、2バイトずつ動かすか4バイトずつ動かすかが違うので注意する。
      let buf;
      if (bufName === "ibo") {
        buf = this.currentIBO.buf;
      } else {
        buf = (this.currentFigure.useVAO ?
          this.currentFigure.getVAO().vbos[bufName] :
          this.currentFigure.getVBOs()[bufName].buf
        );
      }
      // この関数はこの時点でFigureもしくはIBOがbindされていることが前提なので
      // ここは要らないかもしれないって思ったけどVAOだと必須みたいです
      if (bufName !== "ibo" && this.currentFigure.useVAO) {
        // VAOの場合だけこれを実行する（個別にbufferを操作しないといけないわけ）
        this.gl.bindBuffer(this.dict[targetName], buf);
      }
      this.gl.bufferSubData(this.dict[targetName], dstByteOffset, srcData, srcOffset); // srcDataはFloat32Arrayの何か
      return this;
    }
    setTexture2D(name, _texture){
      // 非推奨（後方互換性）
      // 有効になっているPainterがテクスチャユニフォームを持っているとして、それを使えるようにbindする。
      // 分岐処理！
      // _textureがstringの場合は登録されているのを使う。
      if(typeof(_texture) === "string"){
        this.currentPainter.setTexture2D(name, this.textures[_texture].tex);
        return this;
      }
      // そうでない場合は直接放り込む形で。
      this.currentPainter.setTexture2D(name, _texture);
      return this;
    }
    setTexture(name, _texture){
      // なるべくこっちを使ってね
      // _textureがstringの場合は登録されているのを使う。
      if(typeof(_texture) === "string"){
        this.currentPainter.setTexture(name, this.textures[_texture].tex);
        return this;
      }
      // そうでない場合は直接放り込む形で。
      this.currentPainter.setTexture(name, _texture);
      return this;
    }
    setUniform(name, data){
      // 有効になってるシェーダにuniformをセット（テクスチャ以外）
      // shaderProgramは設定されたuniform変数が内部で使われていないときにエラーを返すんですが
      // どれなのか判然とせず混乱するのでここはtry～catchを使いましょう。
      try{
        this.currentPainter.setUniform(name, data);
      }catch(error){
        myAlert("setUniform method error!. " + name);
        console.log(error.message);
        console.log(error.stack);
        return null;
      }
      return this;
    }
    setViewport(x, y, w, h){
      // 仕様変更で(x,y)は左上の割合座標、wだけそこから右、hだけそこから下にしよう。分かりづらいから。
      // currentのFBOの概念があれば簡単でしょ。たとえば0, 0, 0.5, 0.5なら左上1/4領域。
      const _size = this.getDrawingBufferSize(this.currentFBO);
      x *= _size.w;
      y = (1-y-h)*_size.h;
      w *= _size.w;
      h *= _size.h;
      this.gl.viewport(x, y, w, h);
      return this;
    }
    bindIBO(name){
      // iboをbindする。vaoとは無関係な処理とする。やっぱとっかえひっかえできた方がいいと思う。
      const ibo = this.ibos[name];
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo.buf);
      this.currentIBO = ibo;
      return this;
    }
    bindFBO(target){
      const gl = this.gl;
      // targetは名前、もしくはnull.
      if(typeof(target) == 'string'){
        let fbo = this.fbos[target];
        if(!fbo){
          // fboが無い場合の警告
          myAlert("bind failure: The corresponding framebuffer does not exist.");
          return null;
        }
        if(fbo.double){
          // doubleの場合はwriteをbind
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.write.f);
          gl.viewport(0, 0, fbo.w, fbo.h);
          this.currentFBO = target;
          return this;
        }
        // 通常時
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.f);
        gl.viewport(0, 0, fbo.w, fbo.h);
        this.currentFBO = target;
        return this;
      }
      if(target == null){
        // nullの場合はスクリーンに直接
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // drawingBufferWidthとdrawingBufferHeightってやらないとpixelDensityに邪魔されて
        // 全画面になってくれないようです...気を付けないと。これも確かpavelさんやってたな...
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.currentFBO = null;
        return this;
      }
      // targetがfboそのものの場合。
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.f);
      gl.viewport(0, 0, target.w, target.h);
      this.currentFBO = target.name;
      return this;
    }
    clearFBO(){
      // そのときにbindしているframebufferのクリア操作
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      return this;
    }
    getCurrentFBO(){
      // 現在bindしているfboの名前を返す
      return this.currentFBO;
    }
    setFBOtexture2D(uniformName, fboName, kind = "color", index = 0){
      // CUBE_MAPも使うようになればいずれ非推奨、今は無理。

      // FBOを名前経由でセット。ダブルの場合はreadをセット。
      // texture限定。fbo.tやfbo.read.tの代わりに[kind]で場合によっては[index]を付ける。
      // つまり従来のcolorからtexture取得の場合は変える必要なし。
      if(fboName === undefined || (typeof fboName !== 'string')){
        // 指定の仕方に問題がある場合
        myAlert("setFBOtexture2D failure: Inappropriate name setting.");
        return null;
      }
      let fbo = this.fbos[fboName];
      if(!fbo){
        // fboが無い場合の警告
        myAlert("setFBOtexture2D failure: The corresponding framebuffer does not exist.");
        return null;
      }
      if(fbo.double){
        // doubleの場合はreadをセットする
        // 配列の場合は...
        const _texture_double = (Array.isArray(fbo.read[kind]) ? fbo.read[kind][index] : fbo.read[kind]);
        this.setTexture2D(uniformName, _texture_double);
        return this;
      }
      // 通常時
      // 配列の場合は...
      const _texture = (Array.isArray(fbo[kind]) ? fbo[kind][index] : fbo[kind]);
      this.setTexture2D(uniformName, _texture);
      return this;
    }
    swapFBO(fboName){
      // ダブル前提。ダブルの場合にswapする
      if(fboName == null){ return this; }
      let fbo = this.fbos[fboName];
      if(!fbo){
        // fboが無い場合の警告
        myAlert("The corresponding framebuffer does not exist.");
        return null;
      }
      if(fbo.read && fbo.write){ fbo.swap(); }
      return this;
    }
    swapAttribute(attrName0, attrName1){
      const fig = this.currentFigure;
      if (fig.useVAO) {
        myAlert("this function doesn't support VAO.");
        return null;
      }
      fig.swapAttribute(attrName0, attrName1);
      return this;
    }
    drawArrays(mode, first, count){
      // modeは文字列指定でドローの仕方を指定する(7種類)。
      // 残りの引数は0とMAXでいいです。
      // firstはvertexのスタート、countはそこからの個数なので、たとえば8つあって
      // 終わりの4つだけ使う場合は(4,4)のように指定する。4,5,6,7というわけ。
      // こういうのは説明きちんとしないと混乱するわね...英語見ろよって話ではあるんだけど、
      // fool proofって大事だと思うので。誤解の原因は常に撲滅すべきだと思う。

      // modeの文字列からgl定数を取得
      // 実行
      // countはundefinedの場合は事前計算
      // TFで追加attrだけ更新する実験中
      if (count === undefined) { count = this.currentFigure.count; }
      this.gl.drawArrays(this.dict[mode], first, count);
      return this;
    }
    drawElements(mode){
      // typeとsizeがそのまま使えると思う
      this.gl.drawElements(this.dict[mode], this.currentIBO.count, this.currentIBO.intType, 0);
      return this;
    }
    drawArraysInstanced(mode, instanceCount, first, count){
      // countはundefinedの場合は事前計算
      if (count === undefined) { count = this.currentFigure.count; }
      this.gl.drawArraysInstanced(this.dict[mode], first, count, instanceCount);
      return this;
    }
    drawElementsInstanced(mode, instanceCount){
      /*これでいいはず*/
      this.gl.drawElementsInstanced(this.dict[mode], this.currentIBO.count, this.currentIBO.intType, 0, instanceCount);
      return this;
    }
    unbind(){
      // 各種bind解除
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
      if (this.currentFigure.useVAO) {
        this.gl.bindVertexArray(null);
      } else if (this.inTransformFeedback) {
        // TFはVAO関係ないのでここに処理を書く
        // transformFeedback状態を解除（設定側）
        this.gl.endTransformFeedback();
        // vbosのうちoutIndex >= 0であるものについてunbind処理を実行する
        // 0以上ですよ。>=0ですよ。>0じゃないです。
        const vbos = this.currentFigure.getVBOs();
        for (const vboKeys of Object.keys(vbos)) {
          const vbo = vbos[vboKeys];
          if (vbo.outIndex >= 0) {
            this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, vbo.outIndex, null);
          }
        }
        // transformFeedback状態を解除（フラグ側）
        this.inTransformFeedback = false;
      }
      this.currentIBO = undefined;
      //this.currentPainter.unbindTexture2D();
      this.currentPainter.unbindTexture(); // 試しに
      return this;
    }
    flush(){
      this.gl.flush();
      return this;
    }
    readPixels(x, y, w, h, format, type, pixels){
      // bindされているfbの「color, texture, index:0」から読みだす。
      // xとyは0～1指定にしよう。どうせマウスでしか使わない...し。
      // xから右へ、wだけ行ったら下へ。
      // x,yは読み出しのスタートでformatは読みだされる側のformat,たとえば色やvec4であればgl.RGBAでいいっぽい。
      // 色だけならgl.RGBで透明度だけならgl.ALPHAで数値ならgl.REDでいいのかなぁ知らんけど。typeは格納する側の
      // まあ色ならgl.UNSIGNED_BYTEとか小数ならgl.FLOATかな。INTやUNSIGNED_INTやHALF_FLOATも使えるみたい。
      this.gl.readPixels(x, y, w, h, this.dict[format], this.dict[type], pixels);
      // これで格納されます。pixelsは事前に用意しておきましょう。
      // ubyteならUint8Array, floatならFloat32Arrayがいいでしょう。
    }
    getAttrInfo(painterName){
      // デバッグ用。PainterのAttrに関する情報を取得しようかと。Program側の「このattr使う！」の指定方法が処理系依存なので。
      const _painter = this.painters[painterName];
      if(_painter === undefined){
        myAlert("getAttrInfo failure: The corresponding painter does not exist.");
        return null;
      }
      const attrs = _painter.getAttributes();
      // とりあえず配列形式
      const infoArray = [];
      for(let _key of Object.keys(attrs)){
        infoArray.push({name:_key, location:attrs[_key].location});
      }
      // おそらくこっちの方が使いやすいテキスト形式
      let infoText = painterName + ":";
      for(let eachInfo of infoArray){
        infoText += "[" + eachInfo.name + ": " + eachInfo.location + "] ";
      }
      // そのまま貼り付けてもいいしarrayの方をいじってもいい。選択肢があるのは大事なことです。
      return {array:infoArray, text:infoText};
    }
    drawBuffers(flags){
      // MRTに適したfbに対して描画するか否かの命令を下す。0:NONE, 1:然るべきATTACHMENT定数, -1:BACK（指定するなよ）
      // よく考えたらbindされてるfboにしか効果が無いからこれでいいんだったわ。（うっかり！）
      let fbo = this.fbos[this.currentFBO];
      if(!fbo){
        // fboが無い場合の警告
        myAlert("drawBuffers failure: The corresponding framebuffer does not exist.");
        return null;
      }else if(!fbo.MRT){
        // MRTでない場合は適用されない
        myAlert("drawBuffers failure: The corresponding framebuffer is not for MRT.");
        return null;
      }
      const N = fbo.color.length; // 色only.
      const commandArray = new Array(N);
      // undefinedなら1が入るので、全部描画させたいならdrawBuffers([])でOK.
      for(let i=0; i<N; i++){
        const flag = (flags[i] !== undefined ? flags[i] : 1); // デフォは描画命令
        switch(flag){
          case 1:
            commandArray[i] = this.gl.COLOR_ATTACHMENT0 + i; break;
          case 0:
            commandArray[i] = this.gl.NONE; break;
          case -1:
            commandArray[i] = this.gl.BACK; break; // よくわからんので指定するなよ
        }
      }
      this.gl.drawBuffers(commandArray);
      return this;
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Matrix4x4.
  // 自前で用意しなくてもいいんだろうけど、
  // 正規化デバイス座標系の出し方とかそこら辺の知識が無いと影とか出来ないですから。

  // 4x4正方行列
  // イメージ的には行指定で0,1,2,3で最上段、以下下の段4,5,6,7,と続く。
  // こっちにも例のメソッドを移植する
  class Mat4{
    constructor(data){
      this.m = new Array(16).fill(0);
      if(data === undefined){
        this.initialize();
      }else{
        for(let i=0; i<16; i++){
          this.m[i] = (data[i] !== undefined ? data[i] : 0);
        }
      }
    }
    initialize(){
      this.m = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
    }
    copy(){
      return new Mat4(this.m);
    }
    set(data){
      // 値をセットする
      for(let i=0; i<16; i++){
        this.m[i] = data[i];
      }
    }
    getMat4(){
      return this.m;
    }
    getMat3(){
      return [
        this.m[0], this.m[1], this.m[2],
        this.m[4], this.m[5], this.m[6],
        this.m[8], this.m[9], this.m[10]
      ];
    }
    mult(s){
      // sは長さ16の配列で、4x4行列とみなす。
      // sを左からmに掛けることでthis.mを変化させる
      const data = getMult4x4(s, this.m);
      this.set(data);
    }
    transpose(){
      // 転置。
      const data = getTranspose4x4(this.m);
      this.set(data);
    }
    apply(v, transpose = true, copy = false){
      // Vec3型のvに掛け算。ただし転置して左上の3x3を適用する。
      // 基本転置したものを適用する。falseの場合はそうではない。
      // copyがtrueの場合はvを変化させずに新しいVec3を返す。転置がデフォなのはGLSLの都合。
      let w;
      if(copy){
        w = new Vec3();
      }else{
        w = v;
      }
      const {x, y, z} = v;
      const m = this.m;
      if(transpose){
        w.set(m[0]*x + m[4]*y + m[8]*z, m[1]*x + m[5]*y + m[9]*z, m[2]*x + m[6]*y + m[10]*z);
      }else{
        w.set(m[0]*x + m[1]*y + m[2]*z, m[4]*x + m[5]*y + m[6]*z, m[8]*x + m[9]*y + m[10]*z);
      }
      return w;
    }
    applyProj(v, transpose = true, copy = false){
      // Vec3型の行列に対し、[v.x, v.y, v.z, 1]としてVec4を作りそれに適用した結果を第4成分で割って、
      // 残りの成分としてのVec3を返す。copyがtrueの場合はvを変化させずに元のやつを返す。転置がデフォなのは(ry
      let w;
      if(copy){
        w = new Vec3();
      }else{
        w = v;
      }
      const {x, y, z} = v;
      const m = this.m;
      let divider = 0;
      if(transpose){
        w.set(m[0]*x + m[4]*y + m[8]*z + m[12],  m[1]*x + m[5]*y + m[9]*z + m[13], m[2]*x + m[6]*y + m[10]*z + m[14]);
        divider = m[3]*x + m[7]*y + m[11]*z + m[15];
      }else{
        w.set(m[0]*x + m[1]*y + m[2]*z + m[3],   m[4]*x + m[5]*y + m[6]*z + m[7], m[8]*x + m[9]*y + m[10]*z + m[11]);
        divider = m[12]*x + m[13]*y + m[14]*z + m[15];
      }
      w.divide(divider); // dividerで割る
      return w;
    }
    rotateX(t){
      // x軸の周りにtラジアン回転の行列を掛ける
      const data = getRotX(t);
      this.mult(data);
    }
    rotateY(t){
      // y軸の周りにtラジアン回転の行列を掛ける
      const data = getRotY(t);
      this.mult(data);
    }
    rotateZ(t){
      // z軸の周りにtラジアン回転の行列を掛ける
      const data = getRotZ(t);
      this.mult(data);
    }
    rotate(t, a, b, c){
      // 単位軸ベクトル(a, b, c)の周りにtラジアン回転の行列
      const data = getRot(t, a, b, c);
      this.mult(data);
    }
    translate(a, b, c){
      // a, b, cの平行移動の行列を掛ける
      const data = getTranslate(a, b, c);
      this.mult(data);
    }
    scale(sx, sy, sz){
      // sx, sy, sz倍の行列を掛ける
      const data = getScale(sx, sy, sz);
      this.mult(data);
    }
  }

  /*
    // 一番上の行
    this.m[0] = s.m[0]*_m[0] + _s.m[1]*_m[4] + _s.m[2]*_m[8] + _s.m[3]*_m[12];
    this.m[1] = s.m[0]*_m[1] + _s.m[1]*_m[5] + _s.m[2]*_m[9] + _s.m[3]*_m[13];
    this.m[2] = s.m[0]*_m[2] + _s.m[1]*_m[6] + _s.m[2]*_m[10] + _s.m[3]*_m[14];
    this.m[3] = s.m[0]*_m[3] + _s.m[1]*_m[7] + _s.m[2]*_m[11] + _s.m[3]*_m[15];
    // 以下これを繰り返す、のだがめんどくさいので...でもまあそのまま書くか。
    this.m[4] = s.m[4]*_m[0] + _s.m[5]*_m[4] + _s.m[6]*_m[8] + _s.m[7]*_m[12];
    this.m[5] = s.m[4]*_m[1] + _s.m[5]*_m[5] + _s.m[6]*_m[9] + _s.m[7]*_m[13];
    this.m[6] = s.m[4]*_m[2] + _s.m[5]*_m[6] + _s.m[6]*_m[10] + _s.m[7]*_m[14];
    this.m[7] = s.m[4]*_m[3] + _s.m[5]*_m[7] + _s.m[6]*_m[11] + _s.m[7]*_m[15];
    // そのうち楽に書く...けどね...
    this.m[8] = s.m[8]*_m[0] + _s.m[9]*_m[4] + _s.m[10]*_m[8] + _s.m[11]*_m[12];
    this.m[9] = s.m[8]*_m[1] + _s.m[9]*_m[5] + _s.m[10]*_m[9] + _s.m[11]*_m[13];
    this.m[10] = s.m[8]*_m[2] + _s.m[9]*_m[6] + _s.m[10]*_m[10] + _s.m[11]*_m[14];
    this.m[11] = s.m[8]*_m[3] + _s.m[9]*_m[7] + _s.m[10]*_m[11] + _s.m[11*_m[15];
    // 見栄え悪いけどパフォーマンスには問題ないと思うよ
    this.m[12] = s.m[12]*_m[0] + _s.m[13]*_m[4] + _s.m[14]*_m[8] + _s.m[15]*_m[12];
    this.m[13] = s.m[12]*_m[1] + _s.m[13]*_m[5] + _s.m[14]*_m[9] + _s.m[15]*_m[13];
    this.m[14] = s.m[12]*_m[2] + _s.m[13]*_m[6] + _s.m[14]*_m[10] + _s.m[15]*_m[14];
    this.m[15] = s.m[12]*_m[3] + _s.m[13]*_m[7] + _s.m[14]*_m[11] + _s.m[15]*_m[15];
  */

  // ---------------------------------------------------------------------------------------------- //
  // utility for Matrix4x4.

  // この関数で必要ならモデルとビューを（モデル、ビュー）で掛け算して
  // モデルビューにしてsetUniformで渡す。他にも...まあ色々。
  // いっそ（（モデル、ビュー）、プロジェ）で全部掛けてしまってもいいし。なのでexportします。
  // 切り離すのはまあ、使い回しとか色々考えるとね...
  function getMult4x4(s, m){
    // sとmは長さ16の配列であることが前提。掛け算の結果を返す。
    const result = new Array(16).fill(0);
    // 文字列で整理。これも泥臭い計算結果があれば一瞬で、高い知能とか要らない
    // というか知能高くないので無理です
    for(let k=0; k<16; k++){
      const a = 4*Math.floor(k/4);
      const b = k % 4; // kのとこaって...間違えた！
      result[k] += s[a] * m[b];
      result[k] += s[a+1] * m[b+4];
      result[k] += s[a+2] * m[b+8];
      result[k] += s[a+3] * m[b+12];
    }
    return result;
  }

  // 3x3バージョン
  function getMult3x3(s, m){
    const result = new Array(9).fill(0);
    for(let k=0; k<9; k++){
      const a = 3*Math.floor(k/3);
      const b = k % 3;
      result[k] += s[a] * m[b];
      result[k] += s[a+1] * m[b+3];
      result[k] += s[a+2] * m[b+6];
    }
    return result;
  }

  function getTranspose4x4(m){
    // mは長さ16の配列でこれを行列とみなしたうえでその転置であるような配列を返す感じ（わかる？）
    const result = new Array(16).fill(0);
    for(let i=0; i<4; i++){
      for(let k=0; k<4; k++){
        result[4*i+k] = m[i+4*k];
      }
    }
    return result;
  }

  // 3x3バージョン
  function getTranspose3x3(m){
    const result = new Array(9).fill(0);
    for(let i=0; i<3; i++){
      for(let k=0; k<3; k++){
        result[3*i+k] = m[i+3*k];
      }
    }
    return result;
  }

  function getRotX(t){
    // x軸の周りにtラジアン回転の行列
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  }

  function getRotY(t){
    // y軸の周りにtラジアン回転の行列
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  }

  function getRotZ(t){
    // z軸の周りにtラジアン回転の行列
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  function getRot(t, a, b, c){
    // 単位軸ベクトル(a, b, c)の周りにtラジアン回転の行列
    if(a === undefined){
      a=0; b=0; c=1;
    }
    let L = Math.sqrt(a*a + b*b + c*c);
    // 0,0,0を設定してしまった場合はz軸正方向とします
    // ていうか単位ベクトルとか長さがきちんとしてるのを使ってくださいねお願いだから
    if(L < 1e-6){ a=0; b=0; c=1; L=1; }
    a /= L;
    b /= L;
    c /= L;
    const u = Math.cos(t);
    const v = Math.sin(t);
    const w = 1 - u;
    const m0 = w*a*a + u;
    const m1 = w*a*b + v*c;
    const m2 = w*a*c - v*b;
    const m4 = w*a*b - v*c;
    const m5 = w*b*b + u;
    const m6 = w*b*c + v*a;
    const m8 = w*a*c + v*b;
    const m9 = w*b*c - v*a;
    const m10 = w*c*c + u;
    return [m0, m1, m2, 0, m4, m5, m6, 0, m8, m9, m10, 0, 0, 0, 0, 1];
  }

  function getTranslate(a, b, c){
    // a, b, cの平行移動の行列
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, a, b, c, 1];
  }

  function getScale(sx, sy, sz){
    // sx, sy, sz倍の拡大を行う行列
    return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
  }

  // 最後に、Transformとビュー行列を（モデル、ビュー）で掛けたやつ(4x4)から
  // その左上の3x3の逆転置を取り出してuNmatrixとして使うっていうのをやるのでそれをやります
  // 対象は3x3で（テストのため）
  // テスト成功しました。OKです。これでノーマルを取れるね。
  function getInverseTranspose3x3(m){
    // mは長さ9の配列で3x3とみなされている
    const n = new Array(9).fill(0);
    n[0] = m[0]; n[3] = m[1]; n[6] = m[2];
    n[1] = m[3]; n[4] = m[4]; n[7] = m[5];
    n[2] = m[6]; n[5] = m[7]; n[8] = m[8];
    // nを転置するのは終わってるので逆行列を取って終わり。
    // n[0] n[1] n[2]  48-57  27-18  15-24
    // n[3] n[4] n[5]  56-38  08-26  23-05
    // n[6] n[7] n[8]  37-46  16-07  04-13
    const result = new Array(9).fill(0);
    const det = n[0]*n[4]*n[8] + n[1]*n[5]*n[6] + n[2]*n[3]*n[7] - n[2]*n[4]*n[6] - n[1]*n[3]*n[8] - n[0]*n[5]*n[7];
    const indices = [4,8,5,7, 2,7,1,8, 1,5,2,4,
                     5,6,3,8, 0,8,2,6, 2,3,0,5,
                     3,7,4,6, 1,6,0,7, 0,4,1,3];
    for(let i=0; i<9; i++){
      const offset = i*4;
      const a0 = indices[offset];
      const a1 = indices[offset+1];
      const a2 = indices[offset+2];
      const a3 = indices[offset+3];
      result[i] = (n[a0] * n[a1] - n[a2] * n[a3]) / det;
    }
    return result;
  }

  // ベースにあるのが射影のPでそこにビューのVを掛けてさらにモデルのMを掛けていく
  // 例えば離れたところで回転させる場合は単純に平行移動→回転、と考えてOK
  // それが内部ではまず回転、次いで平行移動、のように作用する。
  // 点に対する作用なのでそれでOK.
  // というか点の移動がメインで行列を掛けるのはそれを実現するための単なる手段、だから難しいことは何もない。ですよね。

  // （2Dは知らんけど...2Dは原点の位置と軸をいじってるんだよなぁ...しかもスケールも影響される、
  // webglと違って点の位置を動かすとかそういう考え方じゃないからたとえば線の太さが変わったりするんだよなぁ。）

  // ---------------------------------------------------------------------------------------------- //
  // CameraEx.
  // ビューとプロジェクションを担うパート。
  // 完全に切り離したかったんだけど射影行列が距離依存になってしまった...距離はビューの概念...
  // でもこの方がnearとfarを視点との距離に対して定義出来て便利なのでOKです。メソッド分離でいいのです。

  // 動かすのはテストが終わってからにしましょう。
  // 実装予定：zoom（倍率を指定して矩形を拡縮）,spin（視点を中心の周りに横に回転）,arise（同、縦回転。ただしtopは越えない。）,
  // pan（視点を中心の横にずらす、これも回転）,tilt（同、縦方向。ただしtopは越えない）,move（一緒にローカル軸で平行移動）
  // moveはローカル軸ベースの移動。たとえばzを増やす場合は中心とともに逆方向に遠ざかる感じ...ローカル軸は固定。
  // とはいえ中心が動くので行列は再計算されるわね。dolly:視点を中心に近づけたり離したりする。
  // parallel:グローバル軸に対して視点と中心のセットを平行移動させる。需要があるかどうかは不明。
  // lookAt: 中心だけ強制的に動かす。
  // moveはあれなんですよね。一人称で、動きを同期させたりするのに...まあ、使うんかな...
  // って思ったけど同期させるなら直接eyeとcenterいじった方が早い気がする((

  // 新カメラ。
  // infoの指定の仕方、topは常に正規化、Vec3で統一、ローカル軸の名称変更、動かすメソッド追加, etc...

  // バリデーション忘れてた。ごめん。
  function _validateForPersProj(w, h, info = {}){
    // 基本pers. nearとfarはdistanceに対する比率
    if(info.fov === undefined){ info.fov = Math.PI/3; }
    if(info.aspect === undefined){ info.aspect = w/h; }
    if(info.near === undefined){ info.near = 0.1; }
    if(info.far === undefined){ info.far = 10; }
  }

  function _validateForOrthoProj(w, h, info = {}){
    // farは一応distanceの4倍くらいで。
    if(info.left === undefined){ info.left = -w/2; }
    if(info.right === undefined){ info.right = w/2; }
    if(info.bottom === undefined){ info.bottom = -h/2; }
    if(info.top === undefined){ info.top = h/2; }
    if(info.near === undefined){ info.near = 0.01; }
    if(info.far === undefined){ info.far = 4; }
  }

  function _validateForFrustumProj(w, h, info = {}){
    const h0 = Math.tan(Math.PI/6) * 0.1; // distanceの値に対する比率
    const w0 = h0 * w/h; // そこにaspect比を掛ける
    if(info.left === undefined){ info.left = -w0; }
    if(info.right === undefined){ info.right = w0; }
    if(info.bottom === undefined){ info.bottom = -h0; }
    if(info.top === undefined){ info.top = h0; }
    if(info.near === undefined){ info.near = 0.1; }
    if(info.far === undefined){ info.far = 10; }
  }

  // ユーティリティを追加します
  // まずgetViewPosition(p): これは設定されたカメラの情報を元にglobalのpからview座標を出す
  // getNDC(p): これはglobalのpから正規化デバイスの座標を出す（ついでに-1～1の深度も出す）
  // getViewFromNDC(x, y): これはNDCのx,yからz座標が1であるようなビュー座標を出す
  // getParallelPosition(p, x, y): これはglobalのpに対してそれと同じビュー座標におけるzを持ち
  // さらにNDCがx,yであるようなグローバルポジションを返す。以上。
  class CameraEx{
    constructor(info = {}){
      this.eye = new Vec3();
      this.center = new Vec3();
      this.top = new Vec3();
      this.ciel = new Vec3(); // デフォルトのtopベクトルの方向。リセットで戻す。
      this.side = new Vec3();
      this.up = new Vec3();
      this.front = new Vec3();
      this.viewMat = new Mat4();
      this.projMat = {pers:new Mat4(), ortho: new Mat4(), frustum: new Mat4()};
      this.distance = 0; // 視点と中心との距離
      // matはそれぞれのモードに持たせて変更する場合だけ再計算されるように
      // 切り替えで計算する必要ないので
      this.projData = {mode:"pers", pers:{}, ortho:{}, frustum:{}};
      this.initialize(info);
    }
    initialize(info = {}){
      // デフォルト設定用のwとhを用意。
      let w, h;
      if(info.w === undefined){ w = window.innerWidth; }else{ w = info.w; }
      if(info.h === undefined){ h = window.innerHeight; }else{ h = info.h; }
      // ------ view part ------ //
      // まあ指定が無ければデフォルトで
      // まずeyeはz軸正方向で。（見下ろしではなくレイマのイメージで横から）
      if(info.eye === undefined){ this.eye.set(0, 0, Math.sqrt(3)*h*0.5); }else{ this.eye.set(info.eye); }
      // centerは原点で
      if(info.center === undefined){ this.center.set(0, 0, 0); }else{ this.center.set(info.center); }
      // distanceの計算
      this.calcDistance();
      // topは基本y軸正の方向。
      if(info.top === undefined){
        this.top.set(0, 1, 0);
      }else{
        this.top.set(info.top).normalize(); /* topは正規化しておく */
      }
      this.ciel.set(this.top);  // cielにtopを記録
      // ここでviewMatを構成すると同時にside,up,frontを決定する。これらはカメラのローカル軸x,y,zを与えるもの。
      // topとは概念が異なる。これらはtopに常に制約を受ける。具体的にはtopを越えることが許されない（ゆえに「top」）.
      this.calcViewMat();
      // ------ projection part ------ //
      if(info.pers === undefined){ info.pers = {}; }
      _validateForPersProj(w, h, info.pers);
      this.projData.pers = info.pers;

      if(info.ortho === undefined){ info.ortho = {}; }
      _validateForOrthoProj(w, h, info.ortho);
      this.projData.ortho = info.ortho;

      if(info.frustum === undefined){ info.frustum = {}; }
      _validateForFrustumProj(w, h, info.frustum);
      this.projData.frustum = info.frustum;

      this.calcPersMat();
      this.calcOrthoMat();
      this.calcFrustumMat();
    }
    calcDistance(){
      // メソッドに落とし込む。eyeとcenterの距離取るだけ。
      this.distance = this.eye.dist(this.center);
      // 射影行列が距離依存なので更新
      this.calcProjMat();
    }
    calcViewMat(){
      // eye,center,topが変更された場合に行列の再計算を行なうパート
      // まずfrontを作る。center → eye, の単位ベクトル
      this.front.set(this.eye).sub(this.center).normalize();
      // sideはtopとfrontの外積で作る。ゆえに常にtopに直交するのでtopが動かない限りたとえば画面の揺れなどは起こらない
      this.side.set(this.top).cross(this.front).normalize();
      // upはfrontとsideの外積で作る。画面の上方向を向くベクトルとなる。
      this.up.set(this.front).cross(this.side).normalize();
      // side,up,frontからなる右手系がカメラ座標系となる
      const data = [this.side.x, this.up.x, this.front.x, 0,
                    this.side.y, this.up.y, this.front.y, 0,
                    this.side.z, this.up.z, this.front.z, 0,
                    0, 0, 0, 1];
      this.viewMat.set(data);
      // そしてeyeの分だけ平行移動しないといけないんですね...なるほど。eyeの位置が原点に来るように。
      this.viewMat.translate(-this.eye.x, -this.eye.y, -this.eye.z);
      // おつかれさま！
    }
    calcProjMat(){
      // そのときのモードの射影行列を更新する
      switch(this.projData.mode){
        case "pers": this.calcPersMat(); break;
        case "ortho": this.calcOrthoMat(); break;
        case "frustum": this.calcFrustumMat(); break;
      }
    }
    calcPersMat(){
      // persデータを元に行列を構築する。
      // fov, aspect, near, farから行列を計算してセットする。
      // fovは視野角、aspectは横/縦の比。オーソドックスな指定方法。
      const {fov, aspect, near, far} = this.projData.pers;
      const factor = 1 / Math.tan(fov/2);
      const c0 = factor / aspect;
      const c5 = factor; // 符号反転！
      const c10 = (near + far) / (near - far); // ここは次元0なので比率そのままでOK
      const c11 = -1;
      const c14 = 2 * this.distance * near * far / (near - far); // 次元1なのでdistanceの1乗を掛ける
      const data = [c0, 0, 0, 0, 0, c5, 0, 0, 0, 0, c10, c11, 0, 0, c14, 0];
      this.projMat.pers.set(data);
    }
    calcOrthoMat(){
      // orthoデータを元に行列を構築する。
      // left,right,bottom,top,near,farを取得して...
      // xをleft~right,yをbottom~top,zを-near~-farにおいて-1～1に落とすだけなのでラクチンです。
      const {left, right, bottom, top, near, far} = this.projData.ortho;
      const c0 = 2 / (right - left);
      const c5 = 2 / (top - bottom); // 符号反転！
      const c10 = -2 / (this.distance * (far - near)); // ここは掛け算して合わせないといけない。
      const c12 = -(right + left) / (right - left);
      const c13 = -(top + bottom) / (top - bottom);
      const c14 = -(far + near) / (far - near); // ここは次元0なので無修正
      const c15 = 1;
      const data = [c0, 0, 0, 0, 0, c5, 0, 0, 0, 0, c10, 0, c12, c13, c14, c15];
      this.projMat.ortho.set(data);
    }
    calcFrustumMat(){
      // frustumデータの読み方。nearのところに無限平面を用意して、sideベクトルとupベクトルで張られるとし、
      // そこにおけるleft~right,bottom~topの領域を切り取る。その4隅にeyeから稜線を伸ばすことでfrustumを形成し
      // そこに落とす。persと違って矩形の重心がeyeからcenterへ向かう半直線と交わるとは限らないところと、
      // 通常のカメラのように切り取る範囲を設定できるところが特徴です。
      // 2022/10/11: near, far, left, right, bottom, topすべてdistanceとの比になったのでそこら辺仕様変更。
      const {left, right, bottom, top, near, far} = this.projData.frustum;
      const c0 = 2 * near / (right - left);
      const c5 = 2 * near / (top - bottom);
      const c8 = (right + left) / (right - left);
      const c9 = (top + bottom) / (top - bottom);
      const c10 = -(far + near) / (far - near);
      const c11 = -1;
      const c14 = -2 * this.distance * far * near / (far - near);
      const data = [c0, 0, 0, 0, 0, c5, 0, 0, c8, c9, c10, c11, 0, 0, c14, 0];
      this.projMat.frustum.set(data);
      // ふぅ...（理屈はちゃんと確かめてますがテストするまでわかんねぇなこれ...）GUIで試したいね。ぐりぐりして。
      // その際プリミティブがたくさん必要になるのでそういう関数も作らないと
    }
    setView(info = {}){
      // eye,center,topの指定。配列で[0,1,0]のように書けるようになりました。
      if(info.eye !== undefined){ this.eye.set(info.eye); }
      if(info.center !== undefined){ this.center.set(info.center); }
      if(info.top !== undefined){ this.top.set(info.top).normalize(); /* topは正規化しておく */ }
      this.calcDistance();
      this.calcViewMat();
    }
    setPers(info = {}){
      // fov, aspect, near, farの指定。nearとfarはview関係ないので切り離すべきなのです。
      const projData = this.projData.pers;
      if(info.fov !== undefined){ projData.fov = info.fov; }
      if(info.aspect !== undefined){ projData.aspect = info.aspect; }
      if(info.near !== undefined){ projData.near = info.near; }
      if(info.far !== undefined){ projData.far = info.far; }
      this.calcPersMat();
      this.projData.mode = "pers"; // 自動的にpersになる
    }
    setOrtho(info = {}){
      const projData = this.projData.ortho;
      if(info.left !== undefined){ projData.left = info.left; }
      if(info.right !== undefined){ projData.right = info.right; }
      if(info.bottom !== undefined){ projData.bottom = info.bottom; }
      if(info.top !== undefined){ projData.top = info.top; }
      if(info.near !== undefined){ projData.near = info.near; }
      if(info.far !== undefined){ projData.far = info.far; }
      this.calcOrthoMat();
      this.projData.mode = "ortho"; // 自動的にorthoになる
    }
    setFrustum(info = {}){
      const projData = this.projData.frustum;
      const prevNear = projData.near; // 変更前のnearの値を記憶しておく
      if(info.left !== undefined){ projData.left = info.left; }
      if(info.right !== undefined){ projData.right = info.right; }
      if(info.bottom !== undefined){ projData.bottom = info.bottom; }
      if(info.top !== undefined){ projData.top = info.top; }
      if(info.near !== undefined){ projData.near = info.near; }
      // もしnearが変更され、かつleft,right,bottom,topの変更が無い場合、
      // これらをnearの値に応じて見た目が変わらないように変化させる（具体的にはnear/prevNearを掛ける）
      if(info.near !== undefined && info.left === undefined && info.right === undefined && info.bottom === undefined && info.top === undefined){
        const ratio = info.near / prevNear;
        projData.left *= ratio;
        projData.right *= ratio;
        projData.bottom *= ratio;
        projData.top *= ratio;
      }
      // farは関係ない。
      if(info.far !== undefined){ projData.far = info.far; }
      this.calcFrustumMat();
      this.projData.mode = "frustum"; // 自動的にfrustumになる
    }
    getViewMat(){
      // ビュー行列の取得
      return this.viewMat;
    }
    getProjMat(){
      // 射影行列の取得
      return this.projMat[this.projData.mode]; // モードごと、違う物を返す。
    }
    getViewData(){
      // viewのdataであるVec3の取得
      return {eye:this.eye, center:this.center, top:this.top};
    }
    getLocalAxes(){
      // いわゆるカメラ座標系の3軸を取得(Axesが複数形だそうです)
      return {side:this.side, up:this.up, front:this.front};
    }
    getProjData(mode){
      // modeごとの射影変換に使うdataの取得。あんま使いそうにないな。fovとaspectをレイマ用に...とかで使いそう。
      // レイマでもorthoとかpointLight普通に使えるから色々試してみたいわね
      return this.projData[this.projData.mode];
    }
    zoom(delta, sensitivity = 1){
      // すべての場合に矩形のサイズを(1+delta)倍する。だからdeltaが正なら大きくなるし逆なら小さくなる。
      if(delta < -1){ return; }
      // ここでマイナスにしないと...あの、視界を大きくするにはfovを小さく絞る、ので、逆なんですね。
      const ratio = (1 - delta) * sensitivity;
      switch(this.projData.mode){
        case "pers":
          // fovから1の距離のところの矩形の縦の長さの半分を出して倍率を掛けてから引き戻す。
          const {fov} = this.projData.pers;
          const _scale = Math.tan(fov/2) * ratio;
          this.setPers({fov:Math.atan(_scale) * 2.0});
          break;
        case "ortho":
          const {left:l0, right:r0, bottom:b0, top:t0} = this.projData.ortho;
          this.setOrtho({left:l0*ratio, right:r0*ratio, bottom:b0*ratio, top:t0*ratio});
          break;
        case "frustum":
          const {left:l1, right:r1, bottom:b1, top:t1} = this.projData.frustum;
          this.setFrustum({left:l1*ratio, right:r1*ratio, bottom:b1*ratio, top:t1*ratio});
          break;
      }
    }
    spin(delta, sensitivity = 1){
      // 視点を中心の周りに反時計回りに回転させる。角度。
      // 計算がめんどくさいね...で、camの方は間違ってた、か...centerからeyeに向かうベクトルをtopの周りに回転させるのだ。
      // あれ使うか。
      // あ！！中心...まずいじゃん。
      const t = delta * sensitivity;
      // 中心を引いて、回転して、また中心を足す。今中心が(0,0,0)で固定なので...なんとかしたいね。デバッグするうえで不利。
      this.eye.sub(this.center).rotate(this.top, t).add(this.center);
      this.calcDistance();
      this.calcViewMat();
    }
    arise(delta, sensitivity = 1){
      // 視点を中心の周りに上昇させる。ただしtopベクトルを超えないようにする。角度。frontとupでeyeを再計算。
      // centerは変化しないのでそれを無視して計算し最後にcenterを足す。
      const d = this.distance;
      const t = delta * sensitivity;
      // 答えを作る
      this.eye.set(this.front).mult(d * Math.cos(t)).addScalar(this.up, d * Math.sin(t));
      // このベクトル三重積でなす角thetaに対するd*sin(theta)が出るのでそれとd*0.001を比べて...
      // sin(0.001)～0.001.
      // あ、そうか、sinだけだとどっちだかわからん。内積で符号取らないと。
      // つまり上でBANするならこれでいいけど下でBANする場合は-topでないと失敗するんだわ。
      // ここは答えのeyeで。
      const tm = _tripleMultiple(this.top, this.eye, this.side);
      if(tm < d * 0.001){
        this.side.cross(this.top); // あとで再計算するのでとりあえずsideを使わせてもらう。
        // topに直交するeye方向の単位ベクトルsideを使ってちょっとずらす感じ
        // dotSignでどっち側か調べないと駄目。
        const dotSign = (this.top.dot(this.eye) > 0 ? 1 : -1);
        this.eye.set(this.top).mult(dotSign).addScalar(this.side, 0.001).normalize().mult(d);
      }
      this.eye.add(this.center); // centerを足す。
      this.calcDistance();
      this.calcViewMat();
    }
    dolly(delta, sensitivity = 1){
      // 視点を対象物に近づける処理。zoomと違ってfov等は変化しない。正の時近づけたいのでマイナスで。
      const d = this.distance;
      const t = delta * sensitivity;
      if(d + t < 0.001){ return; }
      this.eye.addScalar(this.front, -t);
      this.calcDistance();
      this.calcViewMat(); // これでよいはず。
    }
    pan(delta, sensitivity = 1){
      // eyeからcenterに向かうベクトルを右に振る。t<0の場合は左に振る。なおcenterが動くので注意。
      // center-eyeでeyeからcenterに向かうベクトルになるがこれの正の向きの変化は時計回りなのでマイナスを付ける。
      // centerを動かす処理なので早速問題が発生している...
      const t = delta * sensitivity;
      this.center.sub(this.eye).rotate(this.top, -t).add(this.eye);
      this.calcDistance();
      this.calcViewMat();
    }
    tilt(delta, sensitivity = 1){
      // eyeからcenterに向かうベクトルを上に振る。t<0の場合は下に振る。これもtopベクトルに制限を受ける。
      // centerを答えにして色々計算して最後にeyeを足して答えとする。
      const d = this.distance;
      const t = delta * sensitivity;
      // 答えを作る. -frontとupでtに対して計算する。
      this.center.set(this.front).mult(-1 * d * Math.cos(t)).addScalar(this.up, d * Math.sin(t));
      const tm = -_tripleMultiple(this.top, this.center, this.side); // ここも逆だ...
      if(tm < d * 0.001){
        this.side.cross(this.top); // これは逆を向いてるのであとでマイナスをつける。
        const dotSign = (this.top.dot(this.center) > 0 ? 1 : -1); // ここはcenterで。
        this.center.set(this.top).mult(dotSign).addScalar(this.side, -0.001).normalize().mult(d);
      }
      this.center.add(this.eye);
      this.calcDistance();
      this.calcViewMat();
    }
    roll(delta, sensitivity = 1){
      // topベクトルをfrontの周りに回転させる。画面の横揺れ。
      // 結果だけ述べると、tが正解です。-tではない。まずfrontの周りに反時計回りに回転させるともともとのtopに対して
      // 左に傾く。これが新しいtopだとするならば、それを上として座標系を作る場合、それがてっぺんに来ることを想像すれば、
      // 全体は右に傾くと分かる。だからそのまんまでいい。
      const t = delta * sensitivity;
      this.top.rotate(this.front, t);
      this.calcViewMat();
    }
    topReset(){
      // topを初期状態に戻す
      this.top.set(this.ciel);
      this.calcViewMat();
    }
    move(a, b, c){
      const v = _getValidation(a, b, c);
      // で、この分だけ全体を移動する。eyeとcenterをそれぞれ...side, up, front方向に。
      // sideは要するに画面右方向へ平行移動、upは要するに画面上、傾いてる場合、斜めの移動になる。
      // frontはこれdollyではないよ。centerも動いてるからね。
      // ...たとえば地形がある場合、frontではなく前方向になるように補正がかかる...？
      // zだけマイナスを掛けてるのは正の時に奥に行く方が自然だから。
      this.eye.addScalar(this.side, v.x).addScalar(this.up, v.y).addScalar(this.front, -v.z);
      this.center.addScalar(this.side, v.x).addScalar(this.up, v.y).addScalar(this.front, -v.z);
      this.calcDistance();
      this.calcViewMat();
    }
    lookAt(a, b, c){
      const v = _getValidation(a, b, c);
      // (a,b,c)にcenterを強制移動。topは動かさない。以上。デバッグ...？
      // centerのtop方向にeyeがきちゃうのまずいよねって話。ただ、まあ、いいか...
      this.center.set(v);
      this.calcDistance();
      this.calcViewMat();
    }
    getViewPosition(p){
      // pはVec3です。View座標を出します。eyeを引いてviewMatをapplyするだけ！
      p.sub(this.eye);
      return this.viewMat.apply(p);
    }
    getNDC(p){
      // pはVec3です。NDC出します。
      const q = this.getViewPosition(p);
      return this.getProjMat().applyProj(q);
    }
    getViewPositionFromNDC(x, y, z = 1, centerBased = false){
      // NDCからView座標を算出する。z値はこっちで決める。デフォの場合、結果はz値が1の時のものとなる。
      // って思ったけどよく考えたらOrthoの場合は錐体じゃないからこの方法だと簡単に外に出てしまうね
      // OrthoってViewにおける座標、x,yだけなんよ。zによらないのです。だからzを掛けちゃいけないのよ。
      // centerBasedはこれがtrueの場合zの代わりにz*this.distanceを使う、という意味。
      // つまりcenterのところの平面におけるViewの位置が出るということ。3Dお絵描きに応用できそう。
      const m = this.getProjMat().m;
      // projのモードで場合分け。疎行列なので計算はとても簡単なのです。
      let u, v;
      switch(this.projData.mode){
        case "pers":
          u = -x/m[0]; v = -y/m[5]; break;
        case "ortho":
          u = (x-m[12])/m[0]; v = (y-m[13])/m[5]; break;
        case "frustum":
          u = (-m[8]-x)/m[0]; v = (-m[9]-y)/m[5]; break;
      }
      const result = new Vec3(u, v, 1);
      if(centerBased){ z *= this.distance; } // centerBasedならzの代わりにz*this.distanceを使う。
      if(this.projData.mode === "ortho"){
        result.z = z;   // orthoの場合はz成分をzにするだけ
      }else{
        result.mult(z); // pers, frustumの場合はzが比例定数になる
      }
      return result;
    }
    getGlobalPositionFromNDC(x, y, z = 1, cenetrBased = false){
      // NDCが(x,y)でViewにおける深さがzであるようなGlobalの点の位置を取得する。3Dお絵描きに応用できそう。
      const p = this.getViewPositionFromNDC(x, y, z, centerBased);
      // viewの3x3部分の逆行列（＝転置）を掛けてeyeを足すだけ。ラクチン。
      this.viewMat.apply(p, false);
      p.add(this.eye);
      return p;
    }
    getParallelPosition(p, x, y){
      // グローバルのpに対し正規化デバイス座標が(x,y)であるようなグローバルの点qを返す。これは一意のはずである。
      // はじめにpのviewを出して。
      const pView = this.getViewPosition(p);
      // それのzを持つView空間の点を求めて
      const q = this.getViewPositionFromNDC(x, y, pView.z);
      // 引き戻す。それにはviewMatをtransposeを適用せずに掛けてeyeを足せばいい...はず。
      this.viewMat.apply(q, false);
      q.add(this.eye);
      return q;
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // TransformEx.
  // 単位行列。初期化。要するにモデル行列。
  // rotとかいろいろこっちに移すかな...あっちに持たせても仕方ないわな。

  class TransformEx{
    constructor(data){
      this.mat = new Mat4(data);
    }
    initialize(){
      this.mat.initialize();
      return this;
    }
    getModelMat(){
      // モデル行列を取り出す。これを...渡す。
      return this.mat;
    }
    rotateX(t){
      // x軸の周りにtラジアン回転の行列を掛ける
      this.mat.rotateX(t);
      //const data = getRotX(t);
      //this.mat.mult(data);
      return this;
    }
    rotateY(t){
      // y軸の周りにtラジアン回転の行列を掛ける
      this.mat.rotateY(t);
      //const data = getRotY(t);
      //this.mat.mult(data);
      return this;
    }
    rotateZ(t){
      // z軸の周りにtラジアン回転の行列を掛ける
      this.mat.rotateZ(t);
      //const data = getRotZ(t);
      //this.mat.mult(data);
      return this;
    }
    rotate(t, a, b, c){
      // 単位軸ベクトル(a, b, c)の周りにtラジアン回転の行列
      this.mat.rotate(t, a, b, c);
      //const data = getRot(t, a, b, c);
      //this.mat.mult(data);
      return this;
    }
    translate(a, b, c){
      // a, b, cの平行移動の行列を掛ける
      this.mat.translate(a, b, c);
      //const data = getTranslate(a, b, c);
      //this.mat.mult(data);
      return this;
    }
    scale(sx, sy, sz){
      // sx, sy, sz倍の行列を掛ける
      this.mat.scale(sx, sy, sz);
      //const data = getScale(sx, sy, sz);
      //this.mat.mult(data);
      return this;
    }
  }

  // getNormalMatrix.
  // モデルビューは既に4x4の配列として計算済み。それに対し左上の3x3から逆転置を作って返す。
  // この中で掛け算するのはいろいろと二度手間になりそうだったので却下。
  // normalMatrixはVSで計算することになったので廃止で。いろいろ変えないとね...
  /*
  function getNormalMat(modelView){
    const result = new Array(9).fill(0);
    result[0] = modelView[0]; result[1] = modelView[1]; result[2] = modelView[2];
    result[3] = modelView[4]; result[4] = modelView[5]; result[5] = modelView[6];
    result[6] = modelView[8]; result[7] = modelView[9]; result[8] = modelView[10];
    return getInverseTranspose3x3(result);
  }
  */

  // 順番としては
  // TransformExとCameraExを用意 → モデルとビューでモデルビュー作って法線も作って
  // プロジェも作ってモデルビューとプロジェと法線を送り込んで計算。
  // 現時点でTransformExの便利な書き方がないので困ったね～...（後回し）

  // ゆくゆくはVec4とかQuarternionやりたいけど必要が生じて明確な利用方法の目途が立ってからでないと駄目ね。
  // 別に派手なことをしたいとかね、そういう話ではないので。基礎固め。地味な話です。
  // てか、ああそうか、Vec4作ってVec3から(x,y,z,1)作るメソッドを...そうすれば自由に...
  // となるとゆくゆくはside,up,frontはVec4というかQuarternionとして扱うことになる？それでもいいけどね。

  // ---------------------------------------------------------------------------------------------- //
  // Snipet.
  const snipet = {
    lightingRoutines:
      `
        // ---------- lighting process ---------- //

        float lambertDiffuse(vec3 lightDirection, vec3 surfaceNormal){
          return max(0.0, dot(-lightDirection, surfaceNormal));
        }

        // view座標で計算してる
        float phongSpecular(vec3 lightDirection, vec3 viewDirection, vec3 surfaceNormal){
          vec3 R = reflect(lightDirection, surfaceNormal);
          return pow(max(0.0, dot(R, viewDirection)), uShininess);
        }

        // directionalLightの計算
        void applyDirectionalLight(vec3 direction, vec3 diffuseColor, vec3 specularColor,
                                   vec3 modelPosition, vec3 normal, out vec3 diffuse, out vec3 specular){
          vec3 viewDirection = normalize(-modelPosition);
          vec3 lightVector = (uViewMatrix * vec4(direction, 0.0)).xyz;
          vec3 lightDir = normalize(lightVector);
          // 色計算
          vec3 lightColor = diffuseColor;
          float diffuseFactor = lambertDiffuse(lightDir, normal);
          diffuse += diffuseFactor * lightColor; // diffuse成分を足す。
          if(uUseSpecular){
            float specularFactor = phongSpecular(lightDir, viewDirection, normal);
            specular += specularFactor * lightColor * specularColor;
          }
        }

        // PointLight項の計算。attenuationも考慮。
        void applyPointLight(vec3 location, vec3 diffuseColor, vec3 specularColor,
                             vec3 modelPosition, vec3 normal, out vec3 diffuse, out vec3 specular){
          vec3 viewDirection = normalize(-modelPosition);
          vec3 lightPosition = (uViewMatrix * vec4(location, 1.0)).xyz;
          vec3 lightVector = modelPosition - lightPosition;
          vec3 lightDir = normalize(lightVector);
          float lightDistance = length(lightVector);
          float d = lightDistance;
          float lightFalloff = 1.0 / dot(uAttenuation, vec3(1.0, d, d*d));
          // 色計算
          vec3 lightColor = lightFalloff * diffuseColor;
          float diffuseFactor = lambertDiffuse(lightDir, normal);
          diffuse += diffuseFactor * lightColor; // diffuse成分を足す。
          if(uUseSpecular){
            float specularFactor = phongSpecular(lightDir, viewDirection, normal);
            specular += specularFactor * lightColor * specularColor;
          }
        }

        // SpotLight項の計算。attenuationは共通で。
        // locationとdirectionが両方入っているうえ、光源の開き(angle)と集中度合い(conc)が追加されて複雑になってる。
        void applySpotLight(vec3 location, vec3 direction, float angle, float conc, vec3 diffuseColor, vec3 specularColor,
                            vec3 modelPosition, vec3 normal, out vec3 diffuse, out vec3 specular){
          vec3 viewDirection = normalize(-modelPosition);
          vec3 lightPosition = (uViewMatrix * vec4(location, 1.0)).xyz; // locationは光の射出位置
          vec3 lightVector = modelPosition - lightPosition; // 光源 → モデル位置
          vec3 lightDir = normalize(lightVector);
          float lightDistance = length(lightVector);
          float d = lightDistance;
          float lightFalloff = 1.0 / dot(uAttenuation, vec3(1.0, d, d*d));
          // falloffは光それ自身の減衰で、これに加えてspot（angleで定義されるcone状の空間）からのずれによる減衰を考慮
          float spotFalloff;
          vec3 lightDirection = (uViewMatrix * vec4(direction, 0.0)).xyz;
          // lightDirはモデルに向かうベクトル、lightDirectionはスポットライトの向きとしての光の向き。そこからのずれで減衰させる仕組み。
          float spotDot = dot(lightDir, normalize(lightDirection));
          if(spotDot < cos(angle)){
            spotFalloff = 0.0;
          }else{
            spotFalloff = pow(spotDot, conc); // cosが大きいとは角度が小さいということ
          }
          lightFalloff *= spotFalloff;
          // あとはpointLightと同じ計算を行ない最後にfalloffを考慮する
          // 色計算
          vec3 lightColor = lightFalloff * diffuseColor;
          float diffuseFactor = lambertDiffuse(lightDir, normal);
          diffuse += diffuseFactor * lightColor; // diffuse成分を足す。
          if(uUseSpecular){
            float specularFactor = phongSpecular(lightDir, viewDirection, normal);
            specular += specularFactor * lightColor * specularColor;
          }
        }

        // ライティングの計算
        // diffuseの分にambient成分を足してrgbに掛けて色を出して
        // specular成分を足して完成
        // この中でrgb関連の処理を実行しrgbをそれで置き換える。
        vec3 totalLight(vec3 modelPosition, vec3 normal, vec3 materialColor){
          vec3 diffuse = vec3(0.0); // diffuse成分
          vec3 specular = vec3(0.0); // ついでに
          // directionalLightの影響を加味する
          for(int i=0; i<uDirectionalLightCount; i++){
            applyDirectionalLight(uLightingDirection[i], uDirectionalDiffuseColor[i], uDirectionalSpecularColor[i],
                                  modelPosition, normal, diffuse, specular);
          }
          // pointLightの影響を加味する
          for(int i=0; i<uPointLightCount; i++){
            applyPointLight(uPointLightLocation[i], uPointLightDiffuseColor[i], uPointLightSpecularColor[i],
                            modelPosition, normal, diffuse, specular);
          }
          // spotLightの影響を加味する
          for(int i=0; i<uSpotLightCount; i++){
            applySpotLight(uSpotLightLocation[i], uSpotLightDirection[i], uSpotLightAngle[i], uSpotLightConc[i],
                           uSpotLightDiffuseColor[i], uSpotLightSpecularColor[i],
                           modelPosition, normal, diffuse, specular);
          }
          diffuse *= diffuseCoefficient;
          specular *= specularCoefficient;
          vec3 result = diffuse + uAmbientColor;
          result *= materialColor;
          result += specular;
          return result;
        }
      `,
    hsv2rgb:
      `
        vec3 hsv2rgb(vec3 color){
          vec3 rgb = clamp(abs(mod(color.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          rgb = rgb * rgb * (3.0 - 2.0 * rgb);
          return color.z * mix(vec3(1.0), rgb, color.y);
        }
      `,
    overlay:
      `
        vec3 overLay(vec3 src, vec3 dst){
          vec3 result;
            if(dst.r < 0.5){ result.r = 2.0*src.r*dst.r; }else{ result.r = 2.0*(src.r+dst.r-src.r*dst.r)-1.0; }
            if(dst.g < 0.5){ result.g = 2.0*src.g*dst.g; }else{ result.g = 2.0*(src.g+dst.g-src.g*dst.g)-1.0; }
            if(dst.b < 0.5){ result.b = 2.0*src.b*dst.b; }else{ result.b = 2.0*(src.b+dst.b-src.b*dst.b)-1.0; }
          return result;
        }
      `,
    softLight:
      `
        // softLight.
        vec3 softLight(vec3 src, vec3 dst){
          vec3 result;
          if(src.r < 0.5){ result.r = 2.0*src.r*dst.r + dst.r*dst.r*(1.0-2.0*src.r); }
          else{ result.r = 2.0*dst.r*(1.0-src.r) + sqrt(dst.r)*(2.0*src.r-1.0); }
          if(src.g < 0.5){ result.g = 2.0*src.g*dst.g + dst.g*dst.g*(1.0-2.0*src.g); }
          else{ result.g = 2.0*dst.g*(1.0-src.g) + sqrt(dst.g)*(2.0*src.g-1.0); }
          if(src.b < 0.5){ result.b = 2.0*src.b*dst.b + dst.b*dst.b*(1.0-2.0*src.b); }
          else{ result.b = 2.0*dst.b*(1.0-src.b) + sqrt(dst.b)*(2.0*src.b-1.0); }
          return result;
        }
      `
  }

  // ---------------------------------------------------------------------------------------------- //
  // utility for ShaderPrototype.
  // 重複部分が多い場合、同じのをいちいち書くのが面倒なので、
  // テンプレートを作りましょうって話。

  // utilities.
  function _convertAttributesToText(attrs, version = 2){
    let result = ``;
    const prefix = (version === 2 ? `in` : `attribute`);
    for(let i=0; i<attrs.length; i++){
      const attr = attrs[i];
      result += prefix +  ` ` + attr.type + ` ` + attr.name + `;`;
    }
    return result;
  }

  function _convertVaryingsToText(varyings, location, version = 2){
    let result = ``;
    const prefix = (version === 1 ? `varying` : (location === `vs` ? `out` : `in`));
    for(let i=0; i<varyings.length; i++){
      const varying = varyings[i];
      result += prefix +  ` ` + varying.type + ` ` + varying.name + `;`;
    }
    return result;
  }

  // ---------------------------------------------------------------------------------------------- //
  // ShaderPrototype.
  // Shaderの基本形を用意しておこうかと
  // 完全ではないかもだけどね

  // addLocation: "vs"/"fs"
  // addTarget: "routines", "preProcess", "mainProcess", "postProcess"
  // たとえばmainにaddすることでライティングを適用した色をいじったりできる

  // これのコンポジットでやるつもり
  // その継承として書き直せたらいいですね
  // Prototypeの継承を単独で使うこともできるし
  // RenderingSystemの方を使ってもいい、柔軟性を獲得することを目指す。
  class ShaderPrototype{
    constructor(){
      this.attrs = [];
      this.varyings = [];

      this.vs = {};
      this.vs.precisions = ``;
      this.vs.constants = ``;
      this.vs.uniforms = ``;
      this.vs.routines = ``; // 関数群
      this.vs.preProcess = ``;
      this.vs.mainProcess = ``;
      this.vs.postProcess = ``;

      this.fs = {};
      this.fs.precisions = ``;
      this.fs.constants = ``;
      this.fs.uniforms = ``;
      this.fs.outputs = ``;
      this.fs.routines = ``; // 関数群
      this.fs.preProcess = ``;
      this.fs.mainProcess = ``;
      this.fs.postProcess = ``;
    }
    initialize(options = {}){
      return this;
    }
    clearAttrs(){
      this.attrs = [];
      return this;
    }
    addAttr(type, name){
      this.attrs.push({type, name});
      return this;
    }
    clearVaryings(){
      this.varyings = [];
      return this;
    }
    addVarying(type, name){
      this.varyings.push({type, name});
      return this;
    }
    addUniform(type, name, addLocation){
      this[addLocation].uniforms +=
        `
          uniform ` + type + ` ` + name + `;
        `;
      return this;
    }
    addConstant(type, name, value, addLocation){
      this[addLocation].uniforms +=
        `
          const ` + type + ` ` + name + ` = ` + value + `;
        `;
      return this;
    }
    addOutputs(type, name, outputLocation = -1){
      // 主にMRTでの利用を想定...というより
      // outputが複数ある＝MRTだけれどね
      const prefix = (outputLocation >= 0 ? `layout (location = ` + outputLocation + `) ` : ``);
      this.fs.outputs += `
        ` + prefix + `out ` + type + ` ` + name + `;
      `;
      return this;
    }
    clearOutputs(){
      // MRTを使うには一旦クリアするか
      // outputが空っぽのTemplateを用意して全部自前で用意する感じですね
      this.fs.outputs = ``;
      return this;
    }
    addCode(content, addTarget, addLocation){
      this[addLocation][addTarget] += content;
      return this;
    }
    clearCode(clearTarget, clearLocation){
      this[clearLocation][clearTarget] = ``;
      return this;
    }
    registPainter(node, name, options = {}){
      let _vs =
      `#version 300 es
      `;
      _vs += this.vs.precisions;
      _vs += _convertAttributesToText(this.attrs);
      _vs += this.vs.constants;
      _vs += this.vs.uniforms;
      _vs += _convertVaryingsToText(this.varyings, "vs");
      _vs += this.vs.routines;
      _vs +=
      `
        void main(){
      `;
      _vs += this.vs.preProcess;
      _vs += this.vs.mainProcess;
      _vs += this.vs.postProcess;
      _vs +=
      `
        }
      `;

      let _fs =
      `#version 300 es
      `;
      _fs += this.fs.precisions;
      _fs += this.fs.constants;
      _fs += this.fs.uniforms;
      _fs += _convertVaryingsToText(this.varyings, "fs", 2);
      _fs += this.fs.outputs;
      _fs += this.fs.routines;
      _fs +=
      `
        void main(){
      `;
      _fs += this.fs.preProcess;
      _fs += this.fs.mainProcess;
      _fs += this.fs.postProcess;
      _fs +=
      `
        }
      `;
      // 出来上がったshaderを確認するためのオプション
      const {showVertexShader = false} = options;
      const {showFragmentShader = false} = options;
      if (showVertexShader) { console.log(_vs); }
      if (showFragmentShader) { console.log(_fs); }
      // 登録
      node.registPainter(name, _vs, _fs);
      return this;
    }
  }

  class ForwardLightingShader extends ShaderPrototype{
    constructor(){
      super();
    }
    initialize(options = {}){
      this.attrs = [
        {type:"vec3", name:"aPosition"},
        {type:"vec3", name:"aNormal"}
      ];
      this.varyings = [
        {type:"vec3", name:"vLocalPosition"},
        {type:"vec3", name:"vGlobalPosition"},
        {type:"vec3", name:"vViewPosition"},
        {type:"vec3", name:"vGlobalNormal"},
        {type:"vec3", name:"vViewNormal"}
      ];

      this.vs.precisions = ``;
      this.vs.constants = ``;
      this.vs.uniforms =
      `
        uniform mat4 uModelMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjMatrix;
        uniform mat3 uNormalMatrix;
        uniform mat3 uModelNormalMatrix;
      `;

      this.vs.routines = ``;
      this.vs.preProcess =
      `
        vec3 position = aPosition;
        vec3 normal = aNormal;
      `;
      this.vs.mainProcess =
      `
        // 位置と法線の計算
        vLocalPosition = position;
        vGlobalPosition = (uModelMatrix * vec4(position, 1.0)).xyz;
        vec4 viewModelPosition = uModelViewMatrix * vec4(position, 1.0);
        vViewPosition = viewModelPosition.xyz;
        vViewNormal = normalize(uNormalMatrix * normal);
        vGlobalNormal = normalize(uModelNormalMatrix * normal);

        gl_Position = uProjMatrix * viewModelPosition;
      `;
      this.vs.postProcess = ``;

      this.fs.precisions =
      `
        precision highp float;
      `;
      this.fs.constants =
      `
        const float diffuseCoefficient = 0.73;
        const float specularCoefficient = 2.0;
      `;

      // optionで増やせるようにする
      const {directionalLightCountMax = 5} = options;
      const {pointLightCountMax = 5} = options;
      const {spotLightCountMax = 5} = options;

      this.fs.uniforms =
      `
        uniform mat4 uViewMatrix;

        // 汎用色
        uniform vec3 uAmbientColor;
        uniform float uShininess; // specularに使う、まあこれが大きくないと見栄えが悪いのです。光が集中する。
        uniform vec3 uAttenuation; // デフォルトは1,0,0. pointLightで使う

        // directionalLight関連
        uniform int uDirectionalLightCount; // デフォ0なのでフラグ不要
      ` +
      `uniform vec3 uLightingDirection[` + directionalLightCountMax +`];` +
      `uniform vec3 uDirectionalDiffuseColor[5];` +
      `uniform vec3 uDirectionalSpecularColor[5];` +
      `
      // pointLight関連
      uniform int uPointLightCount; // これがデフォルトゼロであることによりフラグが不要となる。
      ` +
      `uniform vec3 uPointLightLocation[` + pointLightCountMax +`];` +
      `uniform vec3 uPointLightDiffuseColor[` + pointLightCountMax +`];` +
      `uniform vec3 uPointLightSpecularColor[` + pointLightCountMax +`];` +
      `
        // spotLight関連
        uniform int uSpotLightCount; // 0～5
      ` +
      `uniform vec3 uSpotLightDirection[` + spotLightCountMax +`];` +
      `uniform vec3 uSpotLightLocation[` + spotLightCountMax +`];` +
      `uniform float uSpotLightAngle[` + spotLightCountMax +`];` +
      `uniform float uSpotLightConc[` + spotLightCountMax +`];` +
      `uniform vec3 uSpotLightDiffuseColor[` + spotLightCountMax +`];` +
      `uniform vec3 uSpotLightSpecularColor[` + spotLightCountMax +`];` +
      `
        // light flag.
        uniform bool uUseLight;
        uniform bool uUseSpecular; // デフォルトはfalse;
        uniform vec4 uMonoColor; // monoColorの場合
        uniform int uMaterialFlag; // 0:mono. 1以降はお好みで
      `;

      this.fs.outputs =
      `
        out vec4 fragColor;
      `

      this.fs.routines = snipet.lightingRoutines;
      this.fs.preProcess =
      `
        vec3 position = vViewPosition;
        vec3 normal = vViewNormal;
        vec4 color = vec4(1.0);
        if(uMaterialFlag == 0) {
          color = uMonoColor;  // uMonoColor単色
        }
      `;
      this.fs.mainProcess =
      `
        if (uUseLight) {
          vec3 result = totalLight(position, normal, color.rgb);
          color.rgb = result;
        }
      `;
      this.fs.postProcess =
      `
        fragColor = color * vec4(vec3(color.a), 1.0);
      `;

      // たとえばvsPreProcessでvec4 color = aColor;とかして
      // colorをいじって
      // vsPostProcessでvColor = color;みたいにできる。
      // texCoordでも同じことができる
      const {useColor = false} = options;
      const {useTexCoord = false} = options;
      // colorを使う場合はaColorを追加.
      if (useColor) {
        // TODO
        this.addAttr("vec4", "aColor");
        this.addVarying("vec4", "vColor");
        this.addCode(`
          vec4 color = aColor;
        `, "preProcess", "vs");
        this.addCode(`
          vColor = color;
        `, "postProcess", "vs");
      }
      if (useTexCoord) {
        // TODO
        this.addAttr("vec2", "aTexCoord");
        this.addVarying("vec2", "vTexCoord");
        this.addCode(`
          vec2 texCoord = aTexCoord;
        `, "preProcess", "vs");
        this.addCode(`
          vTexCoord = texCoord;
        `, "postProcess", "vs");
      }
      return this;
    }
  }

  // MRT前提のディファード用シェーダ
  class DeferredPrepareShader extends ShaderPrototype{
    constructor(){
      super();
    }
    initialize(options = {}){
      // TODO
    }
  }
  // こっちはディファードをライティングするためのシェーダ
  class DeferredLightingShader extends ShaderPrototype{
    constructor(){
      super();
    }
    initialize(options = {}){
      // TODO
    }
  }

  // -1～1にしたかったらこっちでvUv = 2.0*vUv-1.0;とかする。
  // そのほうが柔軟性高そう。
  // foxBoard使えばそのまま板ポリ芸に移行できる。

  // foxBoardの利用を想定してる。
  // data:[-1,-1,1,-1,-1,1,1,1]でtriangle_strip
  // ですから"foxBoard"ってやればそこに落ちる
  // もちろん描画先を別のfbにすることも可能。
  // vUvのままではまずいのでuvを用意しましょう。
  class PlaneShader extends ShaderPrototype{
    constructor(){
      super();
    }
    initialize(options={}){
      this.attrs =[{type:"vec2", name:"aPosition"}];
      this.varyings =[{type:"vec2", name:"vUv"}];
      this.fs.outputs =
        `out vec4 fragColor;`;
      this.vs.preProcess =
        `vUv = aPosition * 0.5 + 0.5; vUv.y = 1.0 - vUv.y;`;
      this.vs.mainProcess =
        `gl_Position = vec4(aPosition, 0.0, 1.0);`;
      this.fs.precisions =
        `precision highp float;`;
      this.fs.preProcess =
        `vec4 color = vec4(1.0); vec2 uv = vUv;`;
      this.fs.mainProcess =
        `fragColor = color;`;
      return this;
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // RenderingSystem.

  // Composite. 複数のShaderPrototypeを合わせて使うことを想定する。
  // FilterSystemもこれでいける...かどうか知らないけど。
  // 冗談みたいにコピペしまくってるけど許して
  // こうすることでbindで切り替えできるでしょ。
  class RenderingSystem{
    constructor(){
      this.shaders = {};
      this.currentShader = undefined;
    }
    registShader(name, _shaderPrototype){
      // 渡す前に作っておく
      if (this.shaders[name] !== undefined) { return this; }
      this.shaders[name] = _shaderPrototype;
      this.bindShader(name);
      return this;
    }
    bindShader(name){
      this.currentShader = this.shaders[name];
      return this;
    }
    initialize(options = {}){
      // これは個別にいろいろやる感じでいいんじゃないかと思うけどね...
      return this;
    }
    addAttr(type, name){
      this.currentShader.addAttr(type, name);
      return this;
    }
    addVarying(type, name){
      this.currentShader.addVarying(type, name);
      return this;
    }
    addUniform(type, name, addLocation){
      this.currentShader.addUniform(type, name, addLocation);
      return this;
    }
    addConstant(type, name, value, addLocation){
      this.currentShader.addConstant(type, name, value, addLocation);
      return this;
    }
    addOutputs(type, name, outputLocation = -1){
      this.currentShader.addOutputs(type, name, outputLocation);
      return this;
    }
    clearOutputs(){
      this.currentShader.clearOutputs();
      return this;
    }
    addCode(content, addTarget, addLocation){
      this.currentShader.addCode(content, addTarget, addLocation);
      return this;
    }
    clearCode(clearTarget, clearLocation){
      this.currentShader.clearCode(clearTarget, clearLocation);
      return this;
    }
    registPainter(node, name, options = {}){
      this.currentShader.registPainter(node, name, options);
      return this;
    }
  }

  // StandardLightingSystemです。はい。
  class StandardLightingSystem extends RenderingSystem{
    constructor(){
      super();
      this.registShader("forwardLight", new ForwardLightingShader());
      this.registShader("deferredPrepare", new DeferredPrepareShader());
      this.registShader("deferredLight", new DeferredLightingShader());
      this.prepareLightingParameters();
      this.renderingType = "forward";
    }
    initialize(options = {}){
      const {
        type = "forward", // forward/deferred
        forwardLight = {},
        deferredPrepare = {},
        deferredLight = {}
      } = options;
      switch(type) {
        case "forward":
          this.shaders.forwardLight.initialize(forwardLight);
          this.renderingType = "forward";
          this.bindShader("forwardLight");
          break;
        case "deferred":
          this.shaders.deferredPrepare.initialize(deferredPrepare);
          this.shaders.deferredLight.initialize(deferredLight);
          this.renderingType = "deferred";
          this.bindShader("deferredPrepare");
          break;
      }
      return this;
    }
    prepareLightingParameters(){
      this.lightingParams = {
        use:false,
        ambient:[0.5, 0.5, 0.5],
        shininess:40,
        attenuation:[1, 0, 0],
        useSpecular:false
      };
      this.directionalLightParams = {
        use:false,
        count:1,
        direction:[0, 0, -1],
        diffuseColor:[0.5,0.5,0.5],
        specularColor:[1, 1, 1]
      };
      this.pointLightParams = {
        use:false,
        count:1,
        location:[0, 0, 0],
        diffuseColor:[1, 1, 1],
        specularColor:[1, 1, 1]
      };
      this.spotLightParams = {
        use:false,
        count:1,
        location:[0, 0, 4],
        direction:[0, 0, -1],
        angle:Math.PI/4,
        conc:100,
        diffuseColor:[1, 1, 1],
        specularColor:[1, 1, 1]
      };
    }
    setLight(node, info = {}){
      const keys = Object.keys(info);
      for(const _key of keys){ this.lightingParams[_key] = info[_key]; }
      this.lightingParams.use = true;
    }
    // directionalLight.
    setDirectionalLight(node, info = {}){
      const keys = Object.keys(info);
      for(const _key of keys){ this.directionalLightParams[_key] = info[_key]; }
      if (this.directionalLightParams.count > 0) { this.directionalLightParams.use = true; }
    }
    // pointLight.
    setPointLight(node, info = {}){
      const keys = Object.keys(info);
      for(const _key of keys){ this.pointLightParams[_key] = info[_key]; }
      if (this.pointLightParams.count > 0) { this.pointLightParams.use = true; }
    }
    // spotLight.
    setSpotLight(node, info = {}){
      const keys = Object.keys(info);
      for(const _key of keys){ this.spotLightParams[_key] = info[_key]; }
      if (this.spotLightParams.count > 0) { this.spotLightParams.use = true; }
    }
    lightOn(node){
      // 即時的に切り替える処理にする
      this.lightingParams.use = true;
      node.setUniform("uUseLight", this.lightingParams.use);
      return this;
    }
    lightOff(node){
      this.lightingParams.use = false;
      node.setUniform("uUseLight", this.lightingParams.use);
      return this;
    }
    setLightingUniforms(node){
      // forwardの場合は事前にやるんだけど
      // deferredの場合は後回し
      node.setUniform("uUseLight", this.lightingParams.use);
      if (!this.lightingParams.use) { return; } // noLights.

      node.setUniform("uAmbientColor", this.lightingParams.ambient);
      node.setUniform("uShininess", this.lightingParams.shininess);
      node.setUniform("uAttenuation", this.lightingParams.attenuation);
      node.setUniform("uUseSpecular", this.lightingParams.useSpecular);

      if (this.directionalLightParams.use){
        node.setUniform("uDirectionalLightCount", this.directionalLightParams.count);
        node.setUniform("uLightingDirection", this.directionalLightParams.direction);
        node.setUniform("uDirectionalDiffuseColor", this.directionalLightParams.diffuseColor);
        node.setUniform("uDirectionalSpecularColor", this.directionalLightParams.specularColor);
      }

      if(this.pointLightParams.use){
        node.setUniform("uPointLightCount", this.pointLightParams.count);
        node.setUniform("uPointLightLocation", this.pointLightParams.location);
        node.setUniform("uPointLightDiffuseColor", this.pointLightParams.diffuseColor);
        node.setUniform("uPointLightSpecularColor", this.pointLightParams.specularColor);
      }

      if (this.spotLightParams.use) {
        node.setUniform("uSpotLightCount", this.spotLightParams.count);
        node.setUniform("uSpotLightLocation", this.spotLightParams.location);
        node.setUniform("uSpotLightDirection", this.spotLightParams.direction);
        node.setUniform("uSpotLightAngle", this.spotLightParams.angle);
        node.setUniform("uSpotLightConc", this.spotLightParams.conc);
        node.setUniform("uSpotLightDiffuseColor", this.spotLightParams.diffuseColor);
        node.setUniform("uSpotLightSpecularColor", this.spotLightParams.specularColor);
      }
    }
    setMatrixUniforms(node, tf, cam){
      // deferredの場合はuViewMatrixを使わないので送らない
      // もちろん用意することは可能でその場合はカスタマイズで何とかする
      const modelMat = tf.getModelMat();
      const viewMat = cam.getViewMat();
      const projMat = cam.getProjMat();
      const modelViewMat = new ex.Mat4(ex.getMult4x4(modelMat.m, viewMat.m));
      const normalMat = ex.getInverseTranspose3x3(modelViewMat.getMat3());
      const modelNormalMat = ex.getInverseTranspose3x3(modelMat.getMat3());
      // forwardの場合は使うけどdeferredの場合は後でやる
      // deferredの方、内部で法線計算とかしてて若干内容が古いので
      // そのうち何とかします
      if (this.renderingType === "forward") {
        node.setUniform("uViewMatrix", viewMat.m);
      }
      node.setUniform("uModelMatrix", modelMat.m)
          .setUniform("uModelViewMatrix", modelViewMat.m)
          .setUniform("uProjMatrix", projMat.m)
          .setUniform("uNormalMatrix", normalMat)
          .setUniform("uModelNormalMatrix", modelNormalMat);
    }
    renderPrepare(node, tf, cam, process = [], initializeTransform = true){
      // render改めrenderPrepare.
      // ここでは準備するだけにしよう。
      // forwardは個別のレンダリング用。
      // deferredはシーンを用意するだけ。
      // デフォルトではtfをレンダーのたびに初期化します
      if (initializeTransform) tf.initialize();
      // トランスフォームの実行
      for(let i=0; i<process.length; i++){
        const tfElement = process[i];
        const tfKind = Object.keys(tfElement)[0];
        const tfData = tfElement[tfKind];
        switch(tfKind){
          case "t": tf.translate(...tfData); break;
          case "rx": tf.rotateX(tfData); break;
          case "ry": tf.rotateY(tfData); break;
          case "rz": tf.rotateZ(tfData); break;
          case "r": tf.rotate(...tfData); break;
          case "s": tf.scale(...tfData); break;
          case "ss": tf.scale(tfData, tfData, tfData); break;
        }
      }
      this.setMatrixUniforms(node, tf, cam);
      // いろんなケースに対応するのがしんどいので（重複部分が多いので）
      // ここは外から命令しましょう
      //node.drawElements("triangles");
      return this;
    }
    output(){
      // deferred用。そのうち準備する。
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  //　Performance checker
  // 前でも後でもOKなフレームレート表示用関数
  // クラスで定義します
  // いい加減面倒になってきたので

  // 作るときにキャンバスのサイズを指定します
  // 必要ならレートも指定します
  // options詳細
  // wとhで枠のサイズ
  // bgColorは背景色、グラデーションを使わないならこれ
  // barColorはパフォーマンスバーの色。使わないなら0,0,0,0を指定
  // gradationのflag:true, start,stopは初めの2つでオフセット、
  // そのあとの4つで色指定。
  // textはsize, style, alignを指定できる。p5に依存しまくり
  // p5便利
  // colorでtext色、offsetはalignにフィットさせる
  // 以上です
  class PerformanceChecker{
    constructor(node, width, height, targetFrameRate = 60){
      this.node = node;
      this.w = width;
      this.h = height;
      this.targetFrameRate = targetFrameRate;
      this.bgColor = [];
      this.barColor = [];
      this.gradationInfo = {};
      this.textInfo = {};
    }
    loadGraphic(){
      return this.node.getTextureSource("foxPerformanceChecker");
    }
    updateGraphic(){
      this.node.updateTexture("foxPerformanceChecker");
    }
    initialize(options = {}){
      const {w = 60} = options;
      const {h = 28} = options;
      this.node.registTexture("foxPerformanceChecker", {src:createGraphics(w, h)});
      const {bgColor = [0,0,0,1]} = options; // nonGrad用背景色
      this.bgColor = bgColor;
      const {barColor = [1,1,1,0.3]} = options; // barColor.
      this.barColor = barColor;
      const {gradation = {}} = options;
      const {flag = false} = gradation;
      const {start = []} = gradation;
      const {stop = []} = gradation;
      this.gradationInfo = {flag, start, stop};
      const {text = {}} = options;
      const {style = ITALIC} = text;
      const {size = 18} = text;
      const {align = [CENTER, CENTER]} = text;
      const {color = [1,1,1,1]} = text;
      const {offset = [w/2, h/2]} = text;
      this.textInfo = {color, offset};
      const gr = this.loadGraphic();
      gr.textStyle(style);
      gr.textSize(size);
      gr.textAlign(...align);
      this.updateGraphic();
    }
    show(){
      const gr = this.loadGraphic();
      gr.clear();
      const param = {};
      param.name = "foxPerformanceChecker";
      param.view = [0, 0, gr.width/this.w, gr.height/this.h];
      if (this.gradationInfo.flag) {
        param.gradationFlag = this.gradationInfo.flag;
        param.gradationStart = this.gradationInfo.start;
        param.gradationStop = this.gradationInfo.stop;
      } else {
        const c = this.bgColor;
        gr.background(c[0]*255, c[1]*255, c[2]*255, c[3]*255);
      }
      const t = this.textInfo.color;
      gr.fill(t[0]*255, t[1]*255, t[2]*255, t[3]*255);
      const o = this.textInfo.offset;
      const rate = frameRate();
      gr.text(rate.toFixed(2), o[0], o[1]);
      const b = this.barColor;
      gr.fill(b[0]*255, b[1]*255, b[2]*255, b[3]*255);
      const level = rate / this.targetFrameRate;
      gr.rect(0,0, gr.width*level, gr.height);
      this.updateGraphic();
      copyPainter(this.node, {src:param});
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Export.
  const ex = {};

  // utility.
  ex.getNormals = getNormals;
  ex.getMult3x3 = getMult3x3; // 3x3の使い道があるかもしれない的な
  ex.getMult4x4 = getMult4x4; // こっちは使い道あるかもしれない
  ex.getInverseTranspose3x3 = getInverseTranspose3x3;
  ex.hsv2rgb = hsv2rgb;
  ex.hsvArray = hsvArray;
  ex.PerformanceChecker = PerformanceChecker; // パフォーマンスチェック用

  // geometry.
  ex.getCubeMesh = getCubeMesh;
  ex.getSphereMesh = getSphereMesh;
  ex.getPlaneMesh = getPlaneMesh;
  ex.getTorusMesh = getTorusMesh;
  ex.registMesh = registMesh; // 登録用

  // snipet.
  ex.snipet = snipet; // glslのコードの略記用

  // shaderPrototype.
  ex.ShaderPrototype = ShaderPrototype;
  ex.PlaneShader = PlaneShader; // 板ポリ芸用
  ex.RenderingSystem = RenderingSystem;
  ex.StandardLightingSystem = StandardLightingSystem; // 古典的なフォン/ランバートのライティングによるフォワード/ディファードのライティングテンプレート

  // class.
  ex.Timer = Timer;
  ex.Painter = Painter;
  ex.Figure = Figure;
  ex.RenderNode = RenderNode;
  ex.TextureEx = TextureEx;
  ex.Mat4 = Mat4;
  ex.CameraEx = CameraEx;
  ex.TransformEx = TransformEx;
  ex.Vec3 = Vec3;

  // defaultShader.
  // axisHelper（座標軸を長さ指定して可視化）
  // cameraHelper（種類に応じてfrustumを可視化）
  // customRectHelper（自由に直方体を指定して辺描画で位置を可視化）
  // data格納用のシェーダ欲しいですね...欲しい...めんどくさい...
  ex.copyPainter = copyPainter;

  return ex;
})();

// --------------------------------------------------------------------------------------------------------------------------- //

// foxIA.
// manual...
/*
外部から上書きするメソッドの一覧
pointerPrototype:
  mouseDownAction(e):
    e.offsetXとe.offsetYでそのときのマウス位置
    それによりなんかしたい場合に使います
  mouseMoveAction(e):
    e.offsetXとe.offsetYでマウスの位置
    e.movementXとe.movementYで前との位置の変化...
    ただこれに相当するタッチの方のあれが見当たらないので使わない方がいいかも
  mouseUpAction():
    マウスアップで何かしたい場合
  touchStartAction(t):
    t.pageXとt.pageYでそのポインタの位置です（使わないかも）
    initializeでxとyになんか入るので使わないんだよね
    消しちゃうか...
  touchMoveAction(t):
  touchEndAction(t):

Interaction:
  mouseDownDefaultAction(e):
    e.offsetXやe.offsetYを使って、マウスダウンの際の一般的なイベントを記述
  mouseMoveDefaultAction(e):
    e.offsetXやe.offsetYを使って...
    e.movementXやe.movementYも使うかも？マウスはポインタが1つしか
    ないからそういう選択肢もあるわね
  mouseUpDefaultAction():
    マウスアップの際の一般的な処理
    上記2つもそうだがInteraction独自の処理を書くことの方が多いです
  wheelAction(e):
    e.offsetXやe.offsetYで位置、
    e.deltaYでホイールの変化。下に回すと大きな値。
  clickAction():
    clickイベント。クリックは左前提なので注意。
  mouseEnterAction():
    マウスがキャンバスに入った時の処理
  mouseLeaveAction():
    マウスがキャンバスから出て行った時の処理
  doubleClickAction():
    ダブルクリック。まあ、非推奨って言われてるけどね。
  doubleTapAction():
    ダブルクリックで併用できるが、これが用意されている場合
    タッチではこっちが優先される
  touchStartDefaultAction(e):
    eの扱いは検討中
    とにかくタッチがスタートした場合の一般的な処理（あんま使わない？）
  touchSwipeAction(dx, dy, x, y, px, py):
    指一本で動かす場合の処理
  touchPinchInOutAction(value, x, y, px, py):
    指二本で動かす場合の、距離が離れた場合の処理
  touchMultiSwipeAction(dx, dy, x, y, px, py):
    指二本で動かす場合の、重心が移動した場合の処理
  touchEndDefaultAction(e):
    これもよくわからん。使わないのでは？
  keyDownAction(e):
    キーダウン時。これもデスクトップ用。主にデバッグ用？
    blenderで多用されてる。
    e.keyよりe.codeを使った方がいい
    ShiftやCtrlの左右を区別してくれる優れもの
  keyUpAction(e):
    同様。
以上です。
*/

/*
e.codeを用いる場合のキー内容一覧（https://developer.mozilla.org/ja/docs/Web/API/KeyboardEvent/code を参照）
アルファベット：keyA,keyB,...,keyZ.
ShiftRight, ShiftLeft.
Enter, CapsLock,Space,ControlLeft,ControlRight,ArrowUp,ArrowDown,ArrowLeft,ArrowRight.
Numpad0,Numpad1,Numpad2,...,Numpad9.
NumpadDecimal,NumpadEnter,NumpadAdd.
上の方の数字キー：Digit0,Digit1,Digit2,...,Digit9.
BackSpace,まあ、後は調べてください...
あんま難しいこと考えても仕方ないですね。
*/

const foxIA = (function(){
  const fox = {};

  class PointerPrototype{
    constructor(){
      this.id = -1;
      this.x = 0;
      this.y = 0;
      this.dx = 0;
      this.dy = 0;
      this.prevX = 0;
      this.prevY = 0;
      this.button = -1; // マウス用ボタン記録。-1:タッチですよ！の意味
    }
    mouseInitialize(e){
      this.x = e.offsetX;
      this.y = e.offsetY;
      this.prevX = this.x;
      this.prevY = this.y;
      this.button = e.button; // 0:left, 1:center, 2:right
    }
    mouseDownAction(e){
    }
    mouseUpdate(e){
      this.prevX = this.x;
      this.prevY = this.y;
      this.dx = (e.offsetX - this.x);
      this.dy = (e.offsetY - this.y);
      this.x = e.offsetX;
      this.y = e.offsetY;
    }
    mouseMoveAction(e){
    }
    mouseUpAction(){
    }
    touchInitialize(t){
      this.id = t.identifier;
      this.x = t.pageX; // 要するにmouseX的なやつ
      this.y = t.pageY; // 要するにmouseY的なやつ
      this.prevX = this.x;
      this.prevY = this.y;
    }
    touchStartAction(t){
    }
    touchUpdate(t){
      this.prevX = this.x;
      this.prevY = this.y;
      this.dx = (t.pageX - this.x);
      this.dy = (t.pageY - this.y);
      this.x = t.pageX;
      this.y = t.pageY;
    }
    touchMoveAction(t){
    }
    touchEndAction(t){
    }
  }

  // pointerの生成関数で初期化する。なければPointerPrototypeが使われる。
  // 一部のメソッドはオプションで用意するかしないか決めることにしましょう
  // mouseLeaveとかdoubleClickとか場合によっては使わないでしょう
  // そこらへん
  class Interaction{
    constructor(factory = (() => new PointerPrototype())){
      this.pointers = [];
      this.factory = factory;
      this.width = 0;
      this.height = 0;
      this.tapCount = 0; // ダブルタップ判定用
      this.firstTapped = {x:0, y:0};
    }
    initialize(canvas, options = {}){
      // 横幅縦幅を定義
      this.width = Number((canvas.style.width).split("px")[0]);
      this.height = Number((canvas.style.height).split("px")[0]);
      // 右クリック時のメニュー表示を殺す
      document.oncontextmenu = (e) => { e.preventDefault(); }
      // touchのデフォルトアクションを殺す
      canvas.style["touch-action"] = "none";
      // イベントリスナー
      // optionsになったのね。じゃあそうか。passiveの規定値はfalseのようです。指定する必要、ないのか。
      // そして1回のみの場合はonceをtrueにするようです。
      // たとえば警告なんかに使えるかもしれないですね。ていうか明示した方がいいのか。
      // 以降はdefaultIAと名付ける、これがtrueデフォルトで、falseにするとこれらを用意しないようにできる。
      // たとえば考えにくいけどホイールしか要らないよって場合とか。
      const {defaultIA = true, wheel = true} = options;
      if (defaultIA) {
        // マウス
        canvas.addEventListener('mousedown', this.mouseDownAction.bind(this), {passive:false});
        canvas.addEventListener('mousemove', this.mouseMoveAction.bind(this), {passive:false});
        window.addEventListener('mouseup', this.mouseUpAction.bind(this), {passive:false});
        // タッチ（ダブルタップは無いので自前で実装）
        canvas.addEventListener('touchstart', this.touchStartAction.bind(this), {passive:false});
        canvas.addEventListener('touchmove', this.touchMoveAction.bind(this), {passive:false});
        window.addEventListener('touchend', this.touchEndAction.bind(this), {passive:false});
      }
      // ホイール
      if (wheel) { window.addEventListener('wheel', this.wheelAction.bind(this), {passive:false}); }

      // options. これらは基本パソコン環境前提なので（スマホが関係ないので）、オプションとします。
      const {mouseenter = false, mouseleave = false, click = false, dblclick = false, keydown = false, keyup = false} = options;
      // マウスの出入り
      if (mouseenter) { canvas.addEventListener('mouseenter', this.mouseEnterAction.bind(this), {passive:false}); }
      if (mouseleave) { canvas.addEventListener('mouseleave', this.mouseLeaveAction.bind(this), {passive:false}); }
      // クリック
      if (click) { canvas.addEventListener('click', this.clickAction.bind(this), {passive:false}); }
      if (dblclick) { canvas.addEventListener('dblclick', this.doubleClickAction.bind(this), {passive:false}); }
      // キー(keypressは非推奨とのこと）
      // いわゆる押しっぱなしの時の処理についてはフラグの切り替えのために両方必要になるわね
      if (keydown) { window.addEventListener('keydown', this.keyDownAction.bind(this), {passive:false}); }
      if (keyup) { window.addEventListener('keyup', this.keyUpAction.bind(this), {passive:false}); }
    }
    mouseDownAction(e){
      this.mouseDownPointerAction(e);
      this.mouseDownDefaultAction(e);
    }
    mouseDownPointerAction(e){
      const p = this.factory();
      p.mouseInitialize(e);
      p.mouseDownAction(e);
      this.pointers.push(p);
    }
    mouseDownDefaultAction(e){
      // Interactionサイドの実行内容を書く
    }
    mouseMoveAction(e){
      this.mouseMovePointerAction(e);
      this.mouseMoveDefaultAction(e);
    }
    mouseMovePointerAction(e){
      if(this.pointers.length == 0){ return; }
      const p = this.pointers[0];
      p.mouseUpdate(e);
      p.mouseMoveAction(e);
    }
    mouseMoveDefaultAction(e){
      // Interactionサイドの実行内容を書く
    }
    mouseUpAction(){
      this.mouseUpPointerAction();
      this.mouseUpDefaultAction();
    }
    mouseUpPointerAction(){
      if(this.pointers.length == 0){ return; }
      // ここで排除するpointerに何かさせる...
      const p = this.pointers[0];
      p.mouseUpAction();
      this.pointers.pop();
    }
    mouseUpDefaultAction(){
      // Interactionサイドの実行内容を書く
    }
    wheelAction(e){
      // Interactionサイドの実行内容を書く
      // e.deltaXとかe.deltaYが使われる。下にホイールするとき正の数、上にホイールするとき負の数。
      // 速くホイールすると大きな数字が出る。おそらく仕様によるもので-1000～1000の100の倍数になった。0.01倍して使うといいかもしれない。
      // 当然だが、拡大縮小に使う場合は対数を使った方が挙動が滑らかになるしスケールにもよらないのでおすすめ。
    }
    clickAction(){
      // Interactionサイドの実行内容を書く。クリック時。左クリック。
    }
    mouseEnterAction(){
      // Interactionサイドの実行内容を書く。enter時。
    }
    mouseLeaveAction(){
      // Interactionサイドの実行内容を書く。leave時。
    }
    doubleClickAction(){
      // Interactionサイドの実行内容を書く。ダブルクリック時。
    }
    doubleTapAction(){
      // Interactionサイドの実行内容を書く。ダブルタップ時。自前で実装するしかないようです。初めて知った。
    }
    touchStartAction(e){
      this.touchStartPointerAction(e);
      this.touchStartDefaultAction(e);

      // 以下、ダブルタップ用
      // マルチタップ時にはイベントキャンセル（それはダブルタップではない）
      if(this.pointers.length > 1){ this.tapCount = 0; return; }
      // シングルタップの場合、0ならカウントを増やしつつ350ms後に0にするカウントダウンを開始
      if(this.tapCount === 0){
        // thisをbindしないとおかしなことになると思う
        setTimeout((function(){ this.tapCount = 0; }).bind(this), 350);
        this.tapCount++;
        this.firstTapped.x = this.pointers[0].x;
        this.firstTapped.y = this.pointers[0].y;
      } else {
        this.tapCount++;
        // 最初のタップした場所とあまりに離れている場合はダブルとみなさない
        // 25くらいあってもいい気がしてきた
        const {x, y} = this.pointers[0];
        if(Math.hypot(this.firstTapped.x - x, this.firstTapped.y - y) > 25){ this.tapCount = 0; return; }
        if(this.tapCount === 2){
          this.doubleTapAction();
          this.tapCount = 0;
        }
      }
    }
    touchStartPointerAction(e){
      e.preventDefault();
      // targetTouchesを使わないとcanvas外のタッチオブジェクトを格納してしまう
      const currentTouches = e.targetTouches; // touchオブジェクトの配列
      const newPointers = [];
      // 新入りがいないかどうか調べていたら増やす感じですね
      // targetTouchesのうちでpointersに入ってないものを追加する処理です
      // 入ってないかどうかはidで調べます
      for (let i = 0; i < currentTouches.length; i++){
        let equalFlag = false;
        for (let j = 0; j < this.pointers.length; j++){
          if (currentTouches[i].identifier === this.pointers[j].id){
            equalFlag = true;
            break;
          }
        }
        if(!equalFlag){
          const p = this.factory();
          p.touchInitialize(currentTouches[i]);
          p.touchStartAction(currentTouches[i]);
          newPointers.push(p);
        }
      }
      this.pointers.push(...newPointers);
    }
    touchStartDefaultAction(e){
      // Interactionサイドの実行内容を書く。touchがスタートした時
    }
    touchMoveAction(e){
      // pointerごとにupdateする
      this.touchMovePointerAction(e);
      if (this.pointers.length === 1) {
        // swipe.
        const p0 = this.pointers[0];
        this.touchSwipeAction(
          p0.x - p0.prevX, p0.y - p0.prevY, p0.x, p0.y, p0.prevX, p0.prevY
        );
      } else if (this.pointers.length > 1) {
        // pinch in/out.
        const p = this.pointers[0];
        const q = this.pointers[1];
        // pとqから重心の位置と変化、距離の変化を
        // 計算して各種アクションを実行する
        const gx = (p.x + q.x) * 0.5;
        const gPrevX = (p.prevX + q.prevX) * 0.5;
        const gy = (p.y + q.y) * 0.5;
        const gPrevY = (p.prevY + q.prevY) * 0.5;
        const gDX = gx - gPrevX;
        const gDY = gy - gPrevY;
        const curDistance = Math.hypot(p.x - q.x, p.y - q.y);
        const prevDistance = Math.hypot(p.prevX - q.prevX, p.prevY - q.prevY)
        // 今の距離 - 前の距離
        const diff = curDistance - prevDistance;
        // 今の距離 / 前の距離
        const ratio = curDistance / prevDistance;
        // 差も比も使えると思ったので仕様変更
        this.touchPinchInOutAction(diff, ratio, gx, gy, gPrevX, gPrevY);
        this.touchMultiSwipeAction(gDX, gDY, gx, gy, gPrevX, gPrevY);
        // rotateは要検討
      }
    }
    touchMovePointerAction(e){
      e.preventDefault();
      const currentTouches = e.targetTouches;
      for (let i = 0; i < currentTouches.length; i++){
        const t = currentTouches[i];
        for (let j = 0; j < this.pointers.length; j++){
          if (t.identifier === this.pointers[j].id){
            const p = this.pointers[j];
            p.touchUpdate(t);
            p.touchMoveAction(t);
          }
        }
      }
    }
    touchSwipeAction(dx, dy, x, y, px, py){
      // Interactionサイドの実行内容を書く。
      // dx,dyが変位。
    }
    touchPinchInOutAction(diff, ratio, x, y, px, py){
      // Interactionサイドの実行内容を書く。
      // diffは距離の変化。正の場合大きくなる。ratioは距離の比。
    }
    touchMultiSwipeAction(dx, dy, x, y, px, py){
      // Interactionサイドの実行内容を書く。
      // dx,dyは重心の変位。
    }
    touchRotateAction(value, x, y, px, py){
      // TODO.
    }
    touchEndAction(e){
      // End時のアクション。
      this.touchEndPointerAction(e);
      this.touchEndDefaultAction(e);
    }
    touchEndPointerAction(e){
      const changedTouches = e.changedTouches;
      for (let i = 0; i < changedTouches.length; i++){
        for (let j = this.pointers.length-1; j >= 0; j--){
          if (changedTouches[i].identifier === this.pointers[j].id){
            // ここで排除するpointerに何かさせる...
            const p = this.pointers[j];
            p.touchEndAction(changedTouches[i]);
            this.pointers.splice(j, 1);
          }
        }
      }
    }
    touchEndDefaultAction(e){
      // Interactionサイドの実行内容を書く。touchEndが発生した場合。
      // とはいえ難しいだろうので、おそらくpointersが空っぽの時とかそういう感じになるかと。
    }
    keyDownAction(e){
      // Interactionサイドの実行内容を書く。
      // キーが押されたとき
    }
    keyUpAction(e){
      // Interactionサイドの実行内容を書く。
      // キーが離れた時
      //console.log(e.code);
    }
    getPointers(){
      return this.pointers;
    }
  }

  // dampedAction.
  // 汎用的なモーション作成ツール
  // 要するに力を加えた時に速度が発生してそれによりなんか動かすのに
  // 使えるわけです
  // ベクトル版作ったら面白い？一次元なので。
  // 0.85は摩擦部分でここを大きくするといわゆる「滑り」が大きくなるのね
  // option = {friction:0.15} みたいにして指定できる。よ。
  // とはいえ実際にはvalueが正や負の値を取りつつ減衰するだけなので
  // これを単位ベクトルに掛ければ2次元でも使えなくはないと思う...よ。

  // 使い方...難しいと思うんだけどね。
  // ScalarDampedActionに改名しました
  // actionCallBackはそのまま関数です。どんな関数でもいいわけではなくて、基本的に1変数です。
  // そこに放り込まれる値というのが、このScalarDampedActionを実行するたびに減衰していって0になる。
  // まあそういうこと。
  // quitで0.0になることからわかるようにactionには0が入った場合は何もしないことが想定されていますね。
  // たとえばですけどxを与えられた場合にあるものをxだけ動かす、そういった挙動が想定されているのでしょうね。
  // だからベクトルだったら特定の方向に入力だけ動かす、そういった感じかと。思います。
  // 適用事例：https://openprocessing.org/sketch/1923156
  // 長方形をvalueだけ動かしていますね。制限を設けていますが。こういう使い方...
  // ではあるんだけどね。関数を即席で作ってなおかつbindしてるのがあんま綺麗じゃないのよね。まあ柔軟性...
  // あー、たとえば？関数の処理の一部、何かを動かす部分に、その、部分的に当てはめる使い方が想定されていますね。
  class ScalarDampedAction{
    constructor(actionCallBack, option = {}){
      const {friction = 0.15} = option;
      this.value = 0.0;
      this.damping = 1.0 - friction; // デフォルトは0.85になります
      this.action = actionCallBack;
    }
    addForce(force){
      this.value += force;
    }
    step(){
      const active = (this.value * this.value > 1e-6);
      if(active){
        this.action(this.value);
        this.value *= this.damping;
      }else{
        this.quit();
      }
      return active;
    }
    quit(){
      this.value = 0.0;
    }
  }

  // ScalarDampedAction
  // VectorDampedAction
  // 2つ用意するといいと思う

  fox.Interaction = Interaction;
  fox.PointerPrototype = PointerPrototype;
  fox.ScalarDampedAction = ScalarDampedAction;

  return fox;
})();

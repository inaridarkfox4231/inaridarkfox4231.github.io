// 加速版を個別に作る...もしくは改造する。

// 加速度の場合、インタラクションでは加速のみが為される。
// 摩擦による減衰や速度に基づくアップデートは毎フレームなされるので
// アップデート用の関数を用意して毎フレーム呼び出す必要があるのよね

// exIAを引数に取り、Interactionの継承で作る。
// この作り方が基本となる。
const exOC = (function(IA){

  const ex = {};

  function validateCameraConfig(canvas, config = {}){
    if(config.mode === undefined){ config.mode = "global"; }
    if(config.front === undefined){ config.front = [0, 0, 1]; }
    if(config.side === undefined){ config.side = [1, 0, 0]; }
    if(config.up === undefined){ config.up = [0, 1, 0]; }
    if(config.top === undefined){
      config.top = config.up;
    }
    if(config.eye === undefined){
      // Numberをかますのが正式なやり方。かまさないと文字列になる。
      const h = Number(canvas.style.height.split("px")[0]);
      config.eye = [0, 0, 0.5 * Math.sqrt(3) * h];
    }
    if(config.center === undefined){
      config.center = [0, 0, 0];
    }
  }

  // どこまでやるかだけどね...
  // マジックナンバーをどこまで減らすかっていう話
  class CameraController extends IA.Interaction{
    constructor(factory = (() => new IA.PointerPrototype())){
      super(factory);
      this.mode = "global";
      //this.pointers = pointers; // 継承なので不要
      this.front = new Vec3();
      this.side = new Vec3();
      this.up = new Vec3();
      this.top = new Vec3(); // hemiSphereモードで使う
      this.eye = new Vec3();
      this.center = new Vec3();
      this.defaultInformation = {};
      this.defaultEyeDistance = 0; // eyeとcenterの距離
      this.distanceRatio = 1;
      this.minDistanceLog = -0.9;
      this.maxDistanceLog = 0.9;
      this.rotationFactor = 0.01; // 回転のファクター
      this.mouseZoomFactor = 0.0003; // マウススクロール拡縮用ファクター
      this.touchZoomFactor = 0.001; // いわゆるピンチインアウト拡縮用ファクター
      this._gl = undefined; // 射影行列を取得するための_gl
    }
    cameraInitialize(canvas, _gl, config = {}){
      validateCameraConfig(canvas, config);
      // デフォルト登録
      const info = this.defaultInformation;
      info.front = config.front;
      info.side = config.side;
      info.up = config.up;
      info.top = config.top;
      info.eye = config.eye;
      info.center = config.center;
      // ベクトル用意
      this.front.set(config.front);
      this.side.set(config.side);
      this.up.set(config.up);
      this.top.set(config.top);
      this.eye.set(config.eye);
      this.center.set(config.center);
      // デフォルト距離
      this.defaultEyeDistance = this.eye.dist(this.center);
      // イベントリスナー
      canvas.addEventListener('mousemove', this.mouseMoveCameraAction.bind(this));
      canvas.addEventListener('mousewheel', this.mouseWheelCameraAction.bind(this));
      canvas.addEventListener('touchmove', this.touchMoveCameraAction.bind(this), false);
      this._gl = _gl;
    }
    setting(config = {}){
      // 定数
      if(config.minDistanceLog !== undefined){
        this.minDistanceLog = config.minDistanceLog;
      }
      if(config.maxDistanceLog !== undefined){
        this.maxDistanceLog = config.maxDistanceLog;
      }
      if(config.rotationFactor !== undefined){
        this.rotationFactor = config.rotationFactor;
      }
      if(config.mouseZoomFactor !== undefined){
        this.mouseZoomFactor = config.mouseZoomFactor;
      }
      if(config.touchZoomFactor !== undefined){
        this.touchZoomFactor = config.touchZoomFactor;
      }
    }
    getCamera(){
      return this;
    }
    mouseMoveCameraAction(e){
      if(this.pointers.length == 0){ return; }
      const p = this.pointers[0];
      // buttonで分ける。0:回転、1:移動、2:リセット

      if(p.button === 0){
        // 左クリックで回転
        this.cameraGlobalRotation(p.dx, p.dy);
      }else if(p.button === 1){
        // 中央クリックで移動
        this.cameraMove(p.dx, p.dy);
      }else if(p.button === 2){
        // 右クリックの場合はeyeとcenterをリセット、スケールも必然的にリセット
        this.cameraReset();
      }
    }
    mouseWheelCameraAction(e){
      e.preventDefault();
      // deltaYが100でこれを使えばいいみたいです。deltaXとdeltaZは0です。
      // 100で0.0003なので0.03が送られる。
      this.cameraZoom(e.deltaY * this.mouseZoomFactor);
    }
    touchMoveCameraAction(e){
      if(this.pointers.length == 0){ return; }

      e.preventDefault();
      const p = this.pointers[0];

      if(this.pointers.length === 1){
        this.cameraGlobalRotation(p.dx, p.dy);
      }else if(this.pointers.length === 2){
        // ここでズームインアウト及び視点移動を行う感じです
        const q = this.pointers[1];

        const prevDist = Math.hypot(p.prevX - q.prevX, p.prevY - q.prevY);
        const currentDist = Math.hypot(p.x - q.x, p.y - q.y);
        // 差を取って...currentDistの方が大きいなら大きくするのです。だからprev-currentでOKのはず。
        // この0.001も適当です。ぶっちゃけ答えなんてわからないので...
        this.cameraZoom((prevDist-currentDist) * this.touchZoomFactor);
        const centerDeltaX = 0.5 * (p.x + q.x - p.prevX - q.prevX);
        const centerDeltaY = 0.5 * (p.y + q.y - p.prevY - q.prevY);
        this.cameraMove(centerDeltaX, centerDeltaY);

      }else if(this.pointers.length > 2){
        // 3本指の場合にリセット
        this.cameraReset();
      }
    }
    cameraGlobalRotation(dx, dy){
      // まずdx,dyとside,upを使って回す方向の単位ベクトルを...
      // それとfrontで外積作って回す軸を...
      // 軸の周りに回転させるときにdx,dyの大きさの何倍だけ回転させるかを決める
      const m = Math.hypot(dx, dy);
      if(m < 0.00001){ return; } // これがないとNaNエラーが発生することがある
      const rotationMagnitude = m * this.rotationFactor;
      dx /= m;
      dy /= m;
      // rotationVectorはdx,dy,side,upで計算する。addScalarが便利。
      // axisはそのベクトルとfrontVectorで外積を取る感じ
      const rotationVector = new Vec3(0, 0, 0);
      rotationVector.addScalar(this.side, dx);
      rotationVector.addScalar(this.up, dy);
      const axisVector = this.front.copy();
      axisVector.cross(rotationVector); // これで回転軸が出る

      this.front.rotate(axisVector, -rotationMagnitude);
      this.up.rotate(axisVector, -rotationMagnitude);
      this.side.rotate(axisVector, -rotationMagnitude);
      const eyeDist = this.defaultEyeDistance * this.distanceRatio;
      this.eye.set(this.center).addScalar(this.front, eyeDist);
    }
    cameraZoom(d){
      let distanceLog = Math.log10(this.distanceRatio);
      distanceLog += d;
      if(distanceLog < this.minDistanceLog){
        distanceLog = this.minDistanceLog;
      }
      if(distanceLog > this.maxDistanceLog){
        distanceLog = this.maxDistanceLog;
      }
      this.distanceRatio = Math.pow(10, distanceLog);
      const eyeDist = this.defaultEyeDistance * this.distanceRatio;
      this.eye.set(this.center).addScalar(this.front, eyeDist);
    }
    cameraMove(dx, dy){
      const moveVector = new Vec3(0, 0, 0);
      moveVector.addScalar(this.side, -dx);
      moveVector.addScalar(this.up, -dy);
      this.eye.add(moveVector);
      this.center.add(moveVector);
    }
    cameraReset(){
      const info = this.defaultInformation;
      this.front.set(info.front);
      this.side.set(info.side);
      this.up.set(info.up);
      this.top.set(info.top);
      this.eye.set(info.eye);
      this.center.set(info.center);
      this.distanceRatio = 1; // 距離もリセット
    }
  }

  // --------------------------------------------------------------------------- //
  // Vec3. normalの計算でもこれ使おう。

  // とりあえずこんなもんかな。まあ難しいよねぇ。
  // CameraExのパラメータをベクトルで管理したいのですよね。
  // でもp5.Vector使い勝手悪いので。自前で...

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
        window.alert("Vec3 divide: zero division error!");
        noLoop();
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
        window.alert("Vec3 normalize: zero division error!");
        noLoop();
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
      return new Vec3(this.x, this.y, this.z);
    }
  }

  // ------------------------------------------------------------- //
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

  ex.CameraController = CameraController;
  ex.Vec3 = Vec3;

  return ex;
})(exIA);

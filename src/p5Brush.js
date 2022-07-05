// Systemの改善案
// 案1:スケッチネーム
// これを用意して保存の際に使う（なければ""で初期化）
// かぶらないように秒数を使う
// 案2:サイズ変更の際のオプション
//   CUT:元の画像を左上ベースでコピペ。はみ出た分は消える。
//   STRETCH:元の画像を新しい画像に合うように比率調整
//   CLEAR:元の画像を破棄してすべてのレイヤーをクリアする
//   加えてサイズを指定できるようにしてもいいと思う
//   初期サイズをコンストラクタで指定できるようにはする
//   読み込み画像使う際にそれが出来ないと不便なので
//   他にもいろいろ...
// 案3:カスタム背景
//   というかこちらで用意した画像を背景として使えるようにする

// こんな感じで
const p5Brush = (() => {

  const DRAW_DETAIL = 100; // 本家は100なんですよね
  // 100でいいみたいですね...なぜなんだ...でもまあいいか。
  // 円と月を追加

  const pathData = {
    heart:"M 0 0.56 C -1 -0.14 -0.5 -0.84 0 -0.35 C 0.5 -0.84 1 -0.14 0 0.56",
    star:"M 0 -0.5 L 0.1123 -0.1545 L 0.4755 -0.1545 L 0.1816 0.059 L 0.2939 0.4045 L 0 0.191 L -0.2939 0.4045 L -0.1816 0.059 L -0.4755 -0.1545 L -0.1123 -0.1545 Z",
    circle:"M 0.5 0 A 0.5 0.5 0 1 1 0.5 -0.01 Z",
    moon:"M 0.5 0.49 A 0.7 0.7 0 1 1 0.5 -0.49 A 0.5 0.5 0 1 0 0.5 0.49 Z",
  // 0.8倍にした
  // つまり線の間隔は8です（標準で）
    quarterRest:"M -1.714 -12.000 L 4.190 -4.952 C 0.000 -0.635 1.334 2.413 5.016 5.778 L 4.762 6.222 C 3.302 5.524 1.905 5.270 0.318 6.286 C -0.889 7.619 0.190 8.889 1.650 10.158 L 1.270 10.540 C -0.571 8.698 -3.619 6.032 -1.905 4.127 C -0.698 2.540 0.826 3.048 1.968 3.492 L -2.603 -1.460 C -1.587 -3.132 0.381 -4.952 0.571 -6.603 C 0.635 -8.952 -0.889 -10.286 -1.968 -11.682 Z",
    eighthNoteFlag:"M 3.722 -28.174 L 3.548 -0.348 L 4.418 -0.348 L 4.418 -19.478 C 7.548 -17.566 8.591 -15.304 9.634 -12.000 C 10.157 -10.087 9.634 -7.826 8.766 -5.566 C 7.896 -4.000 9.461 -2.782 9.982 -4.870 C 11.200 -7.304 11.896 -12.174 9.809 -15.652 C 8.070 -19.478 5.809 -21.739 4.766 -25.566 L 4.418 -28.174 Z",
    eighthRest:"M -1.000 -4.500 C 0.750 -6.500 -0.750 -8.500 -2.000 -8.500 C -5.000 -9.000 -5.250 -5.500 -3.500 -4.000 C -1.250 -2.750 0.500 -2.500 2.500 -4.000 L -1.000 8.000 L 0.750 8.000 L 4.750 -8.250 L 3.500 -8.500 C 3.500 -6.000 2.000 -4.500 0.000 -4.000 Z",
  }

  // パス2Dの生成
  const paths = {};
  for(let _key of Object.keys(pathData)){
    paths[_key] = new Path2D(pathData[_key]);
  }

  // リズムたち
  const rhythmPatterns = [[2,1,2,1],[1,1,2,1],[0,0,2,0],[2,2,1,3],[0,0,2,2,],[2,3,2,3],[2,2,2,1]];

  // ----------------------------------------------------------- //
  // utility.

  // パス描画
  function drawPath(gr, name, col, size, fillFlag = true){
    if(fillFlag){
      gr.fill(col);
      gr.noStroke();
      gr.scale(size);
      gr.drawingContext.fill(paths[name]);
    }else{
      gr.stroke(col);
      gr.strokeWeight(0.1);
      gr.noFill();
      gr.scale(size);
      gr.drawingContext.stroke(paths[name]);
    }
  }

  // 直線ax+by=1と中心(cx,cy)半径rの円の交点を出す汎用関数
  // ax+by=1だと計算が楽になる上に直線の取り扱いが容易なのよね
  // これでまあまあ便利です
  function calcIntersections(a, b, cx, cy, r){
    let result = [];
    let divisor = a*a + b*b;
    let k = divisor * Math.pow(r, 2) - Math.pow(cx*a + cy*b - 1, 2);
    if(k < 0){ return []; }
    let g = cx*b - cy*a;
    let det = Math.sqrt(k);
    let x1 = (a + b*g + b*det) / divisor;
    let y1 = (b - a*g - a*det) / divisor;
    result.push({x:x1, y:y1});
    if(det === 0){ return []; }
    let x2 = (a + b*g - b*det) / divisor;
    let y2 = (b - a*g + a*det) / divisor;
    result.push({x:x2, y:y2});
    return result;
  }

  // HSV→RGB変換。
  // これはexportしてもいいかもしれない
  function HSV2RGB(h, s, v){
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

  // -------------------------------------------------------- //
  // System.
  // nodeLayerは描画先のキャンバスです。ここに描画されます。
  class System{
    constructor(nodeLayer){
      this.nodeLayer = nodeLayer;
      this.baseLayer = createGraphics(nodeLayer.width, nodeLayer.height);
      this.paintLayer = createGraphics(nodeLayer.width, nodeLayer.height);
      this.infoLayer = createGraphics(nodeLayer.width, nodeLayer.height); // デバッグ用
      this.prepareBaseLayer();
      this.prepareInfoLayer();
      this.brushes = {};
      this.pointers = [];
    }
    registPointer(pointer){
      // paintLayerが現状唯一の書き込み可能なレイヤー
      // （背景は固定）
      pointer.setTargetLayer(this.paintLayer);
      this.pointers.push(pointer);
    }
    prepareBaseLayer(){
      let bl = this.baseLayer;
      bl.background(0, 32, 64);
    }
    prepareInfoLayer(){
      let il = this.infoLayer;
      il.fill(255);
      il.noStroke();
      il.rect(0, 0, 100, 50);
      il.fill(0);
      il.textSize(14);
      il.textAlign(LEFT, TOP);
      il.text("drawing test", 10, 10);
      il.text("D: clear", 10, 30);
    }
    registBrush(newBrush){
      const name = newBrush.getName();
      this.brushes[name] = newBrush;
    }
    setBrush(name, index = 0){
      const brush = this.brushes[name];
      this.pointers[index].setBrush(brush);
    }
    setCol(col, index = 0){
      this.pointers[index].setCol(col);
    }
    configBrush(name, param = {}){
      const _brush = this.brushes[name];
      for(let key of Object.keys(param)){
        _brush.setParam(key, param[key]);
      }
    }
    start(x, y, index = 0){
      // トリガーでpointerの位置を決める。
      // マウスとは限らない場合を考慮しx,yとしました。
      this.pointers[index].setPos(x, y);
      this.pointers[index].activate();
    }
    startAll(x, y){
      for(let p of this.pointers){
        p.setPos(x, y);
        p.activate();
      }
    }
    update(){
      for(let p of this.pointers){ p.update(); }
    }
    complete(index = 0){
      this.pointers[index].inActivate();
    }
    completeAll(){
      for(let p of this.pointers){
        p.inActivate();
      }
    }
    clear(){
      this.paintLayer.clear();
    }
    draw(){
      // ここで手持ちのpointerにブラシを持たないものがあった場合
      // 適当にブラシをあてがう処理を用意しないと
      // うかつにpointerを増やせないので何とかしてください
      this.nodeLayer.clear();
      // 背景
      this.nodeLayer.image(this.baseLayer, 0, 0);
      // これまで描画した内容をpaintLayerにおいていく
      this.nodeLayer.image(this.paintLayer, 0, 0);
      // 描画途中のpointerによる描画内容をおく(activeな場合)
      for(let p of this.pointers){ p.draw(); }
      // 必要ならinfo.
      this.nodeLayer.image(this.infoLayer, 0, 0);
    }
  }

  // -------------------------------------------------------- //
  // pointer.
  class Pointer{
  constructor(targetNode){
    this.pos = {x:0, y:0, px:0, py:0, lx:0, ly:0};
    this.col = "#fff"; // デフォルト：白
    this.force = 1; // wをこれで可変にする。渡すとき考慮。
    this.brush = undefined; // ブラシ
    this.targetNode = targetNode; // 描画先のノード
    this.targetLayer = undefined; // 描画終了時の貼付先レイヤー
    // offscreen. リサイズではこっちもいじらないとなぁ。
    // どう設定するかはbrushが決める。
    this.offscreen = createGraphics(targetNode.width, targetNode.height);
    this.active = false; // activeなときに
    this.params = {}; // 特殊なブラシ用のパラメータセット
    // マウスダウンからの距離と総合距離
    this.tempDist = 0;
    this.totalDist = 0;
    // firstDrawedはparamsに含めることにしよう。
    // でないといろいろめんどくさい。
  }
  setPos(x, y){
    this.pos.x = x;
    this.pos.y = y;
    this.pos.px = x;
    this.pos.py = y;
    this.pos.lx = x;
    this.pos.ly = y;
  }
  setCol(col){
    this.col = col;
  }
  setForce(force){
    this.force = force;
  }
  setBrush(brush){
    this.brush = brush;
  }
  setTargetLayer(targetLayer){
    this.targetLayer = targetLayer;
  }
  getPos(){
    return this.pos;
  }
  getCol(){
    return this.col;
  }
  getForce(){
    return this.force;
  }
  getBrush(){
    return this.brush;
  }
  distUpdate(){
    const _dist = mag(this.pos.x - this.pos.px, this.pos.y - this.pos.py);
    this.tempDist += _dist;
    this.totalDist += _dist;
  }
  activate(){
    this.active = true;
    // オフスクリーンに描画準備
    // startUpとは...
    this.brush.startUp(this.offscreen, this.params);
    this.tempDist = 0;
  }
  inActivate(){
    this.active = false;
    // targetLayerに結果を貼り付けてクリアする
    this.targetLayer.image(this.offscreen, 0, 0);
    this.offscreen.clear();
  }
  isActive(){
    return this.active;
  }
  update(){
    /* 位置更新処理 */
    if(!this.active){ return; }
    this.distUpdate();
  }
  draw(){
    /* colとforceを使ってbrushでtargetに描画 */
    // よく考えたらstepの方が正解だったわ
    // stepの中でdrawするんだったわ
    if(!this.active){ return; }
    // offscreenに描画してから
    this.brush.step(this.offscreen, this.pos, this.col, this.force, this.params);
    // ノードに貼り付け。ノードは毎フレームクリアされるので
    // これでOK.
    this.targetNode.image(this.offscreen, 0, 0);
    }
  }

  class MousePointer extends Pointer{
    constructor(targetNode, speedFactor = 0.1){
      super(targetNode);
      this.speedFactor = speedFactor;
    }
    update(){
      if(!this.active){ return; }
      // マウス位置に向かって動かす
      const mx = mouseX;
      const my = mouseY;
      let {pos} = this;
      pos.px = pos.x;
      pos.py = pos.y;
      pos.x += (mx - pos.x) * this.speedFactor;
      pos.y += (my - pos.y) * this.speedFactor;
      this.distUpdate();
    }
  }

  // 対象ポインターの位置をパクるだけ
  // ミラー処理は簡略化をさぼっています（こら）
  class MirrorPointer extends Pointer{
    constructor(targetNode, friend, mirrorOption = "mirrorX"){
      super(targetNode);
      this.friend = friend;
      this.mirrorOption = mirrorOption;
    }
    setPos(x, y){
      const _data = this.getMirrorData(x, y, x, y);
      this.pos.x = _data.x;
      this.pos.y = _data.y;
      this.pos.px = _data.x;
      this.pos.py = _data.y;
      this.pos.lx = _data.x;
      this.pos.ly = _data.y;
    }
    getMirrorData(x, y, px, py){
      const w = this.targetNode.width;
      const h = this.targetNode.height;
      switch(this.mirrorOption){
        case "mirrorX":
          return {x:w-x, y:y, px:w-px, py:py};
        case "mirrorY":
          return {x:x, y:h-y, px:px, py:h-py};
        case "mirrorXY":
          return {x:w-x, y:h-y, px:w-px, py:h-py};
      }
    }
    update(){
      if(!this.active){ return; }
      const {pos:q} = this.friend;
      const _data = this.getMirrorData(q.x, q.y, q.px, q.py);
      this.pos.x = _data.x;
      this.pos.y = _data.y;
      this.pos.px = _data.px;
      this.pos.py = _data.py;
      this.distUpdate();
    }
  }

  // 累積距離に応じて色がカラフルに変化するpointer
  // hueとsatは関数で変えられる、hueは距離に応じて変化
  class ColorfulMousePointer extends MousePointer{
    constructor(targetNode, speedFactor = 0.1, sat = 1, blt = 1, colorSpan = 600){
      super(targetNode);
      this.speedFactor = speedFactor;
      this.sat = sat;
      this.blt = blt;
      this.colorSpan = colorSpan;
    }
    setSat(s){
      this.sat = s;
    }
    setBlt(b){
      this.blt = b;
    }
    update(){
      super.update();
      // _HSVをRGBに変換してカラーオブジェクト作って文字列に変換
      // 容易だけどめんどくさいのでまた今度
      const rgbValue = HSV2RGB((this.totalDist % this.colorSpan) / this.colorSpan, this.sat, this.blt);
      const _r = rgbValue.r * 255;
      const _g = rgbValue.g * 255;
      const _b = rgbValue.b * 255;
      this.col = color(_r, _g, _b).toString("#rrggbb");
    }
  }

  // こっちに持たせよう
  class CompositePointer extends Pointer{
    constructor(targetNode, controller){
      super(targetNode);
      this.controller = controller;
    }
    update(){
      /* controllerから位置情報をパクる */
      // あらかじめcontrollerクラスに位置とか取得できる関数を
      // 用意しておくとなおよし。
      if(!this.active){ return; }
      // getPosDataという関数で
      // x,y,px,pyを取得出来ればOK
      const _data = this.controller.getPosData();
      this.pos.x = _data.x;
      this.pos.y = _data.y;
      this.pos.px = _data.px;
      this.pos.py = _data.py;
      this.distUpdate();
    }
  }

  // あとノイズや波でforceを変化させても面白そう。

  class Brush{
    constructor(name){
      this.name = name; // ブラシの名前
    }
    startUp(gr, params){
      // offscreenとparamsで
      // 描画開始時に行う処理。
    }
    registParam(param, paramName, dft){
      // paramのparamName属性があればそれを設定、なければdftを設定
      this.setParam(paramName, param[paramName], dft);
    }
    setParam(paramName, value, dft = undefined){
      // 汎用パラメータ設定関数
      // valueがundefinedの場合はdftを設定する感じ
      // 無くてもいい
      if(value == undefined){ this[paramName] = dft; return; }
      this[paramName] = value;
    }
    getName(){
      return this.name;
    }
    /*
    set(x, y){
      this.cx = x;
      this.cy = y;
      this.lastX = x;
      this.lastY = y;
      this.noStart = true;
    }
    */
    step(target, pos, col, force, params){
      // 逐次更新処理。この中でdrawを実行する。

      // pointerの情報からx,y,px,pyを抜き出す感じなので
      // lastX,lastY以外は要らないかなと。
      // ていうかこの2つは最後に描画した時のx,yです
      // こちらで使う情報ではないのです

      // 位置更新はポインターに任せてここでは描画だけやります
      let px = pos.px;
      let py = pos.py;
      let qx = pos.x;
      let qy = pos.y;
      let speed = mag(qx-px,qy-py);
      if(speed<1){ return; }
      let dx = (qx-px)/speed;
      let dy = (qy-py)/speed;
      for(let i = 0; i < DRAW_DETAIL; i++){
        let ax = px + (qx - px) * i / DRAW_DETAIL;
        let ay = py + (qy - py) * i / DRAW_DETAIL;
        this.draw(target, ax, ay, dx, dy, pos, col, force, params);
      }
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      // brushごとの描画処理
      // (dx,dy)が単位ベクトル
      // xとyが描画に使う位置情報。あっちではほんとにこのくらい
      // しか使ってない。simple is best.

      // forceは普段1だしparamsは普段{}で使われない
      // posのlxとlyを更新する必要がある
    }
  }

  // wは基本的に直径もしくは線の太さ

  // シンプルに
  // ただ内容がかぶってるのでおそらく廃止されます（
  // intervalFactorはwの何倍離すか
  class CircleBrush extends Brush{
    constructor(name, param){
      super(name);
      //this.registParam(param, "col", "#fff");
      this.registParam(param, "w", 10);
      this.registParam(param, "intervalFactor", 1.5);
    }
    startUp(gr, params){
      gr.blendMode(BLEND);
      gr.noStroke();
      params.firstDrawed = false;
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      // たとえばw*0.5だけ進んだ時描画するようにするなど
      const _w = this.w * force;
      if(!params.firstDrawed){ params.firstDrawed = true; }
      if(mag(pos.lx - x, pos.ly - y) < _w * this.intervalFactor){ return; }
      // これからはこっちでcolやforceを使っていく...
      gr.fill(col);
      gr.circle(x, y, _w);
      pos.lx = x;
      pos.ly = y;
    }
  }

  // 線を引く
  class LineBrush extends Brush{
    constructor(name, param){
      super(name);
      this.registParam(param, "w", 2);
    }
    startUp(gr, params){
      gr.blendMode(BLEND);
      gr.noFill();
      params.firstDrawed = false;
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      const _w = this.w * force;
      if(!params.firstDrawed){ params.firstDrawed = true; }
      if(mag(pos.lx - x, pos.ly - y) < _w * 0.5){ return; }
      gr.stroke(col);
      gr.strokeWeight(_w);
      gr.line(pos.lx, pos.ly, x, y);
      pos.lx = x;
      pos.ly = y;
    }
  }

  // 多重線を引く
  class MultiLineBrush extends Brush{
    constructor(name, param){
      super(name);
      this.registParam(param, "w", 1);
      this.registParam(param, "multiple", 5);
      this.registParam(param, "intervalFactor", 10);
    }
    startUp(gr, params){
      gr.blendMode(BLEND);
      gr.noFill();
      params.lastXs = [];
      params.lastYs = [];
      params.firstDrawed = false;
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      const _w = this.w * force;
      const d = _w * this.intervalFactor;
      const l = (this.multiple-1) * 0.5 * d;
      if(!params.firstDrawed){
        for(let i = 0; i < this.multiple; i++){
          params.lastXs.push(x-dy*(-l+i*d));
          params.lastYs.push(y+dx*(-l+i*d));
        }
        params.firstDrawed = true;
      }
      const m = mag(pos.lx - x, pos.ly - y);
      if(m < _w * 0.5){ return; }
      gr.stroke(col);
      gr.strokeWeight(_w)

      for(let i = 0; i < this.multiple; i++){
        const nextX = x-dy*(-l+i*d);
        const nextY = y+dx*(-l+i*d);
        gr.line(params.lastXs[i], params.lastYs[i], nextX, nextY);
        params.lastXs[i] = nextX;
        params.lastYs[i] = nextY;
      }
      pos.lx = x;
      pos.ly = y;
    }
  }

  // やっぱややこしいから1でいいや。
  // つまり音符とかも細い長方形で描くということ...
  // 四分休符はあれで。4で割って幅とする。

  // 致命的なバグだ...
  // 直します。

  // lastXs,lastYs,barProg, tone, rhythmArray, rhythm,
  // drawFlag, tupletParamまで。spaceはその都度計算するし、
  // path関連はグローバルを使う。
  class MusicBrush extends Brush{
    constructor(name, param){
      super(name);
      this.registParam(param, "w", 1);
    }
    startUp(gr, params){
      gr.blendMode(BLEND);
      // 各種パラメタ
      params.lastXs = [];
      params.lastYs = [];
      params.barProg = 0;
      params.tone = 0;
      params.rhythmArray = [0,1,2,3];
      params.rhythm = 0;
      params.drawFlag = true;
      params.tupletParam = {close:{x:0,y:0}, far:{x:0,y:0}, lower:false};
      params.firstDrawed = false;
    }
    draw5line(gr, x, y, dx, dy, space, params){
      const l = 2*space;
      for(let i = 0; i < 5; i++){
        const nextX = x-dy*(-l+i*space);
        const nextY = y+dx*(-l+i*space);
        gr.line(params.lastXs[i], params.lastYs[i], nextX, nextY);
        params.lastXs[i] = nextX;
        params.lastYs[i] = nextY;
      }
    }
    setRhythm(params){
      params.rhythmArray = random(rhythmPatterns);
      // おいおいね
      // いくつかのパターンから選ばれるようにするとか？
    }
    drawQuarterNote(gr, x, y, dx, dy, col, tone, size, space, inv = false){
      gr.push();
      gr.translate(x, y); // x, yに行く
      gr.rotate(atan2(dy, dx)); // 進行方向
      gr.translate(0, tone*space*0.5); // 縦ずれ
      if(inv){
        gr.rotate(Math.PI); // 上の場合
      }

      gr.noStroke();
      gr.fill(col);
      gr.rotate(1+PI/2); // 楕円描画
      gr.ellipse(0, 0, space*1.1, space*0.8);
      gr.rotate(-1-PI/2); // 楕円描画終わり

      gr.stroke(col);
      gr.noFill();
      gr.line(space*0.5, -size*2, space*0.5, -size*2-space*3.3); // 3.5だったんですけど小さくしました
      gr.pop();
    }
    drawQuarterRest(gr, x, y, dx, dy, col, size){
      gr.push();
      gr.translate(x, y);
      gr.rotate(atan2(dy, dx));
      drawPath(gr, "quarterRest", col, size);
      gr.pop();
    }
    drawEighthRest(gr, x, y, dx, dy, col, size){
      gr.push();
      gr.translate(x, y);
      gr.rotate(atan2(dy, dx));
      drawPath(gr, "eighthRest", col, size);
      gr.pop();
    }
    drawEighthNote(gr, x, y, dx, dy, col, tone, size, space, inv = false){
      gr.push();
      gr.noStroke();
      gr.fill(col);
      gr.translate(x, y); // x, yに行く
      gr.rotate(atan2(dy, dx)); // 進行方向
      gr.translate(0, tone*space*0.5); // 縦ずれ
      if(inv){
        gr.rotate(Math.PI); // 上の場合
      }
      gr.rotate(1+PI/2); // 楕円描画
      gr.ellipse(0, 0, space*1.1, space*0.8);
      gr.rotate(-1-PI/2); // 楕円描画終わり
      // TODO:ここで旗
      if(tone < 0){
        gr.rotate(Math.PI); // 戻す
        gr.applyMatrix(1,0,0,-1,0,0);
        gr.translate(-space, -size*2); // 割と力ずく
      }
      drawPath(gr, "eighthNoteFlag", col, size);
      gr.pop();
    }
    setTuplesParam(x, y, dx, dy, tone, space, tupletParam, lower){
      tupletParam.lower = lower;
      // upperがtrueの場合はdx,dy方向にずらしてからdy,-dx方向に
      // spaceの2.7と3.5で...どのくらいずらすかというとspace/2です。
      const t = tone;
      const d = space * 0.5;
      const e = (lower ? -1:1);
      tupletParam.close = {x:x - dy*t*d + e*dx*d + e*dy*d*7.5, y:y + dx*t*d + e*dy*d - e*dx*d*7.5};
      tupletParam.far = {x:x - dy*t*d + e*dx*d + e*dy*d*6.3, y:y + dx*t*d + e*dy*d - e*dx*d*6.3};
    }
    drawTuplesFlag(gr, x, y, dx, dy, col, tone, space, tupletParam){
      // 向きは記録されたものを使う。
      const {x:x1, y:y1} = tupletParam.close;
      const {x:x2, y:y2} = tupletParam.far;
      const t = tone;
      const d = space * 0.5;
      const e = (tupletParam.lower ? -1:1);

      gr.noStroke();
      gr.fill(col);
      gr.quad(x1,y1,x - dy*t*d + e*dx*d + e*dy*d*7.5,y + dx*t*d + e*dy*d - e*dx*d*7.5, x - dy*t*d + e*dx*d + e*dy*d*6.3, y + dx*t*d + e*dy*d - e*dx*d*6.3, x2, y2);
    }
    getNextTone(t){
      // tに対して±5の範囲で行き先をランダムに取得
      const _min = max(t-5, -4);
      const _max = min(t+5, 4);
      return _min + Math.floor(Math.random()*(_max-_min));
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      // 五線譜描画は基本で、それとは別になんか置いていく。
      const _w = this.w * force;
      const space = _w*8; // 間隔
      const l = 2*space;
      if(!params.firstDrawed){
        for(let i = 0; i < 5; i++){
          params.lastXs.push(x-dy*(-l+i*space));
          params.lastYs.push(y+dx*(-l+i*space));
        }
        params.firstDrawed = true;
      }
      const m = mag(pos.lx - x, pos.ly - y);
      if(m < _w * 0.5){ return; }
      gr.stroke(col);
      gr.strokeWeight(_w);
      this.draw5line(gr, x, y, dx, dy, space, params);

      pos.lx = x;
      pos.ly = y;

      // 以下、音符など
      const prevBP = Math.floor(params.barProg / _w);
      params.barProg += m; // 累積距離
      // ここでbpが増えた場合にのみ
      // 描画命令の可否をリセットする
      const bp = Math.floor(params.barProg / _w);
      if(prevBP < bp){ params.drawFlag = true; }
      // するとあるbarProgで描画がなされたとき、そのあとのフレームで
      // bpが増えなければ、同じところへの描画は為されない。
      // ちょっと気になったので。
      if(bp > 165){
        // 区切り線を引く
        gr.push();
        gr.translate(x, y);
        gr.rotate(atan2(dy, dx));
        gr.stroke(col);
        gr.strokeWeight(_w);
        gr.line(0, -space*2, 0, space*2);
        gr.pop();
        this.setRhythm(params);
        params.barProg = 0;
      }
      const rhythmId = Math.floor(bp / 40);
      if(bp % 40 == 0 && rhythmId < 4){
        params.rhythm = params.rhythmArray[rhythmId];
        if(params.rhythm !== 3){
          // 音程を決める
          params.tone = Math.floor(random()*9)-4;
        }
      }

      if(bp % 40 == 26 && params.drawFlag){
        if(params.rhythm == 0){
          this.drawQuarterNote(gr, x, y, dx, dy, col, params.tone, _w, space, (params.tone < 0));
        }
        if(params.rhythm == 3){
          this.drawQuarterRest(gr, x, y, dx, dy, col, _w);
        }
        params.drawFlag = false;
      }
      if((bp % 40 == 16 || bp % 40 == 36) && params.drawFlag){
        if(params.rhythm == 1){
          if(bp % 40 == 16){
            this.drawEighthNote(gr, x, y, dx, dy, col, params.tone, _w, space, (params.tone < 0));
          }else{
            this.drawEighthRest(gr, x, y, dx, dy, col, _w);
          }
          params.drawFlag = false;
          if(bp % 40 == 16){
            // 再生成
            params.tone = Math.floor(random()*9)-4;
          }
        }
        if(params.rhythm == 2){
          if(bp % 40 == 16){
            this.drawQuarterNote(gr, x, y, dx, dy, col, params.tone, _w, space, (params.tone < 0));
            params.drawFlag = false;
            // ここで位置を記録
            this.setTuplesParam(x, y, dx, dy, params.tone, space, params.tupletParam, (params.tone < 0));
            // 再計算
            params.tone = this.getNextTone(params.tone);
          }
          if(bp % 40 == 36){
            this.drawQuarterNote(gr, x, y, dx, dy, col, params.tone, _w, space, params.tupletParam.lower);
            // ここで旗を描画
            this.drawTuplesFlag(gr, x, y, dx, dy, col, params.tone, space, params.tupletParam);
            params.drawFlag = false;
          }
        }
      }
    }
  }

  // 三角形移しますね。

  // これもSVGの方がいいかなって思ってしまった
  // グラデも統一的に付けられるしなー
  // 進行方向に向かって、とか。
  class TriangleBrush extends Brush{
    constructor(name, param){
      super(name);
      this.registParam(param, "w", 16);
      // 縦方向の伸びに対する横幅の半分（デフォは1/3）
      this.registParam(param, "widthFactor", 0.333);
      //this.registParam(param, "col", "#fff");
      this.registParam(param, "intervalFactor", 1.2);
      // 白抜きの場合の直径に対する線の太さ
      this.registParam(param, "strokeWeightFactor", 0.05);
      // 白抜きかどうか
      this.registParam(param, "fill", true);
      // 三角形の形（正三角形とか）いじっても面白そうだけど。
    }
    startUp(gr, params){
      gr.blendMode(BLEND);
      params.firstDrawed = false;
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      const _w = this.w * force;
      if(!params.firstDrawed){ params.firstDrawed = true; }
      if(mag(pos.lx - x, pos.ly - y) < _w * this.intervalFactor){ return; }
      // ここで描画

      if(this.fill){
        gr.fill(col);
        gr.noStroke();
      }else{
        gr.noFill();
        gr.stroke(col);
        gr.strokeWeight(max(1,_w*this.strokeWeightFactor));
      }
      // (横幅の半分)/(縦の伸び)
      const wf = this.widthFactor;
      gr.triangle(pos.lx-dy*_w*wf, pos.ly+dx*_w*wf, pos.lx+dy*_w*wf, pos.ly-dx*_w*wf, pos.lx + dx * _w, pos.ly + dy * _w);
      pos.lx = x;
      pos.ly = y;
    }
  }

  // baseColはベース色
  // intervalはとげの配置間隔（ピクセル）で1～1.5が良き
  // 幅は40くらいを想定
  // colorBandは色のブレ具合で0.7くらいだといい感じ
  // thickはとげの厚さでデフォは0.04くらい、要するに渡しに対する幅
  class ThornBrush extends Brush{
    constructor(name, param){
      super(name);
      this.registParam(param, "w", 45);
      this.registParam(param, "interval", 1);
      this.registParam(param, "colorBand", 0.7);
      this.registParam(param, "thick", 0.04);

    }
    startUp(gr, params){
      gr.blendMode(LIGHTEST);
      params.firstDrawed = false;
    }
    drawThorn(gr, x0, y0, x1, y1){
      const midX = (x0+x1)/2;
      const midY = (y0+y1)/2;
      const diffX = (y0-y1)*this.thick;
      const diffY = (x1-x0)*this.thick;
      // quadにしよう。
      gr.quad(x0,y0,midX+diffX,midY+diffY,x1,y1,midX-diffX,midY-diffY);
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      const _w = this.w * force;
      if(!params.firstDrawed){ params.firstDrawed = true; }
      if(mag(pos.lx - x, pos.ly - y)<this.interval){ return; }
      // 1～w/2のランダム値
      let r1 = 1 + Math.random()*(_w/2-1);
      let t1 = Math.random()*Math.PI*2;
      let x1 = r1*cos(t1);
      let y1 = r1*sin(t1);
      let rt1 = calcIntersections(cos(t1)/r1, sin(t1)/r1, 0, 0, this.w/2+1);
      let rt2 = calcIntersections(cos(t1)/r1, sin(t1)/r1, 0, 0, this.w);
      let p0 = rt2[0];
      let p1 = rt1[0];
      let p2 = rt1[1];
      let p3 = rt2[1];
      if(mag(p0.x-p1.x,p0.y-p1.y) > mag(p0.x-p2.x,p0.y-p2.y)){
        let tmpX = p2.x; let tmpY = p2.y;
        p2.x = p1.x; p2.y = p1.y;
        p1.x = tmpX; p1.y = tmpY;
      }
      let h0 = Math.random();
      let h1 = Math.random();
      let q0 = {};
      q0.x = p0.x + (p1.x-p0.x)*h0;
      q0.y = p0.y + (p1.y-p0.y)*h0;
      let q1 = {};
      q1.x = p2.x + (p3.x-p2.x)*h1;
      q1.y = p2.y + (p3.y-p2.y)*h1;
      // 次に色。
      const h = Math.random();
      const band = this.colorBand;
      //let _r, _g, _b;
      const _color = color(col);
      let _r = red(_color);
      let _g = green(_color);
      let _b = blue(_color);
      if(h < 0.5){
        _r = _r * (1 - band + h * band * 2);
        _g = _g * (1 - band + h * band * 2);
        _b = _b * (1 - band + h * band * 2);
      }else{
        _r = _r + (255 - _r) * (h - 0.5) * band * 2;
        _g = _g + (255 - _g) * (h - 0.5) * band * 2;
        _b = _b + (255 - _b) * (h - 0.5) * band * 2;
      }
      gr.noStroke();
      gr.fill(_r, _g, _b);
      // このq0,q1がx,yからのdiffになる感じ。
      this.drawThorn(gr, x+q0.x, y+q0.y, x+q1.x, y+q1.y);
      pos.lx = x;
      pos.ly = y;
    }
  }

  // カーブアイコンブラシ
  // ハート 星 など

  // 文字列のところ、スペース区切りを使うことで
  // 複数種類できるようにしたら面白そう
  // split使えば簡単に実装できるはず
  // IconListってやる
  class CurveIconBrush extends Brush{
    constructor(name, param){
      super(name);
      this.registParam(param, "w", 20);
      this.registParam(param, "kind", "heart");
      this.registParam(param, "intervalFactor", 1.2);
      this.registParam(param, "fill", true);
      this.registParam(param, "blendOption", BLEND);
    }
    startUp(gr, params){
      gr.blendMode(this.blendOption);
      params.firstDrawed = false;
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      const _w = this.w * force;
      if(!params.firstDrawed){ params.firstDrawed = true; }
      if(mag(pos.lx - x, pos.ly - y)<_w * this.intervalFactor){ return; }
      gr.push();
      gr.translate(x, y);
      gr.rotate(atan2(dy, dx));
      drawPath(gr, this.kind, col, _w, this.fill);
      gr.pop();
      pos.lx = x;
      pos.ly = y;
    }
  }

  // 色を2つ指定するとその間のblend（線形補間）で
  // いろんな色のいろんな大きさのオブジェクトが配置される感じ
  // 向きもランダムで
  class ScatterIconBrush extends Brush{
    constructor(name, param){
      super(name);
      this.registParam(param, "w", 20);
      this.registParam(param, "secondCol", this.col); // 補間色
      this.registParam(param, "kind", "star");
      this.registParam(param, "intervalFactor", 0.25);
      this.registParam(param, "sizeMinRatio", 0.3); // 1.0～0.3倍
      this.registParam(param, "sizeMaxRatio", 1); // 一応。
      this.registParam(param, "fill", true);
      this.registParam(param, "blendOption", BLEND);
    }
    startUp(gr, params){
      gr.blendMode(this.blendOption);
      params.firstDrawed = false;
    }
    draw(gr, x, y, dx, dy, pos, col, force, params){
      const _w = this.w * force;
      if(!params.firstDrawed){ params.firstDrawed = true; }
      if(mag(pos.lx - x, pos.ly - y)<_w * this.intervalFactor){ return; }
      gr.push();
      const _radius = Math.sqrt(Math.random())*this.w;
      const _angle = Math.random()*Math.PI*2;
      gr.translate(x + _radius * Math.cos(_angle), y + _radius * Math.sin(_angle));
      const rotationAngle = Math.random()*Math.PI*2;
      gr.rotate(rotationAngle);
      const sizeFactor = this.sizeMinRatio + Math.random()*(this.sizeMaxRatio - this.sizeMinRatio);

      const iconCol = lerpColor(color(col), color(this.secondCol), Math.random());
      drawPath(gr, this.kind, iconCol, _w * sizeFactor, this.fill);
      gr.pop();
      pos.lx = x;
      pos.ly = y;
    }
  }

  let ex = {};
  ex.System = System;

  ex.Pointer = Pointer;
  ex.MousePointer = MousePointer;
  ex.MirrorPointer = MirrorPointer;
  ex.ColorfulMousePointer = ColorfulMousePointer;
  ex.CompositePointer = CompositePointer;

  ex.Brush = Brush;
  ex.CircleBrush = CircleBrush;
  ex.LineBrush = LineBrush;
  ex.MultiLineBrush = MultiLineBrush;
  ex.MusicBrush = MusicBrush;
  ex.TriangleBrush = TriangleBrush;
  ex.ThornBrush = ThornBrush;
  ex.CurveIconBrush = CurveIconBrush;
  ex.ScatterIconBrush = ScatterIconBrush;

  ex.createSystem = function(nodeLayer){
    return new System(nodeLayer);
  }
  ex.createPointer = function(targetNode){
    return new Pointer(targetNode);
  }
  ex.createMousePointer = function(targetNode, speedFactor = 0.1){
    return new MousePointer(targetNode, speedFactor);
  }
  ex.createMirrorPointer = function(targetNode, friend, mirrorOption = "mirrorX"){
    return new MirrorPointer(targetNode, friend, mirrorOption);
  }
  ex.createColorfulMousePointer = function(targetNode, speedFactor = 0.1, sat = 1, blt = 1, colorSpan = 600){
    return new ColorfulMousePointer(targetNode, speedFactor, sat, blt, colorSpan);
  }
  ex.createCompositePointer = function(targetNode, controller){
    return new CompositePointer(targetNode, controller);
  }

  ex.util = {};
  ex.util.HSV2RGB = function(h, s, v){
    return HSV2RGB(h, s, v);
  }

  return ex;
})();

// ここまで。

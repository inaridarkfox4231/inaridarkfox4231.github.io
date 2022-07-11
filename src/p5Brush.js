// Systemの改善案
// sketchName

// 2022/07/11/moo
// ver3.0

// setSelfColorがクソ重い処理だった
// getが重いのかな...
// まあとりあえず毎フレームその場の色を取得するのは
// やめておこう

// エアブラシとかノイズブラシ

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

// optionで背景なくす...てかそれ以前に背景って結局のところ
// レイヤーなんです。レイヤーが2枚あって、今そのうち上の方の
// 1枚にしか描き込めない状況なのよ。
// offscreenってpointerが持ってるでしょ。
// Nodeに貼り付けるタイミングが2枚目を描画した後なのも
// targetのlayerが2枚目だからで、たとえばだけど背景となる
// 下のレイヤーがターゲットならこれ導入するタイミングも
// ずれるわけ。そんな感じですね...

// リサイズが課題
// そうですね...
// てかあれ？
// これもしかして作品作りこれ使えばめっちゃ楽じゃん？
// レイヤー別に作業できるの神過ぎる...
// 今までだといちいち用意しないとだったからね...
// swapとか用意しますか
// ポストエフェクトもそろえたくなってきた(shaderで)

// こんな感じで
const p5Brush = (() => {

  const DRAW_DETAIL = 100; // 本家は100なんですよね
  // 100でいいみたいですね...なぜなんだ...でもまあいいか。
  // 円と月を追加

  const pathData = {
    heart:"M 0 0.56 C -1 -0.14 -0.5 -0.84 0 -0.35 C 0.5 -0.84 1 -0.14 0 0.56",
    star:"M 0 -0.5 L 0.1123 -0.1545 L 0.4755 -0.1545 L 0.1816 0.059 L 0.2939 0.4045 L 0 0.191 L -0.2939 0.4045 L -0.1816 0.059 L -0.4755 -0.1545 L -0.1123 -0.1545 Z",
    circle:"M 0.5 0 A 0.5 0.5 0 1 1 0.5 -0.01 Z",
    triangle:"M 0.866 0 L -0.433 0.75 L -0.433 -0.75 Z",
    moon:"M 0.5 0.49 A 0.7 0.7 0 1 1 0.5 -0.49 A 0.5 0.5 0 1 0 0.5 0.49 Z",
  // 0.8倍にした
  // つまり線の間隔は8です（標準で）
    quarterRest:"M -1.714 -12.000 L 4.190 -4.952 C 0.000 -0.635 1.334 2.413 5.016 5.778 L 4.762 6.222 C 3.302 5.524 1.905 5.270 0.318 6.286 C -0.889 7.619 0.190 8.889 1.650 10.158 L 1.270 10.540 C -0.571 8.698 -3.619 6.032 -1.905 4.127 C -0.698 2.540 0.826 3.048 1.968 3.492 L -2.603 -1.460 C -1.587 -3.132 0.381 -4.952 0.571 -6.603 C 0.635 -8.952 -0.889 -10.286 -1.968 -11.682 Z",
    eighthNoteFlag:"M 3.722 -28.174 L 3.548 -0.348 L 4.418 -0.348 L 4.418 -19.478 C 7.548 -17.566 8.591 -15.304 9.634 -12.000 C 10.157 -10.087 9.634 -7.826 8.766 -5.566 C 7.896 -4.000 9.461 -2.782 9.982 -4.870 C 11.200 -7.304 11.896 -12.174 9.809 -15.652 C 8.070 -19.478 5.809 -21.739 4.766 -25.566 L 4.418 -28.174 Z",
    eighthRest:"M -1.000 -4.500 C 0.750 -6.500 -0.750 -8.500 -2.000 -8.500 C -5.000 -9.000 -5.250 -5.500 -3.500 -4.000 C -1.250 -2.750 0.500 -2.500 2.500 -4.000 L -1.000 8.000 L 0.750 8.000 L 4.750 -8.250 L 3.500 -8.500 C 3.500 -6.000 2.000 -4.500 0.000 -4.000 Z",
  }

  const shaders = {
    vs_airBrush:
      "precision mediump float;" +
      "attribute vec3 aPosition;" +
      "void main(){" +
      "  gl_Position = vec4(aPosition, 1.0);" +
      "}",

    fs_airBrush:
      "precision mediump float;" +
      "uniform vec2 uResolution;" +
      "uniform float uDensity;" +
      "uniform vec3 uBaseColor;" +
      "uniform float uSizeFactor;" +
      "void main(){" +
      "  vec2 p = (2.0 * gl_FragCoord.xy - uResolution.xy) / uResolution.xy;" +
      "  float r = length(p);" +
      "  if(r>0.99*uSizeFactor){ discard; }" +
      "  r /= uSizeFactor;" + // これでOK
      "  r = r*r*(3.0-2.0*r);" +
      "  float d = uDensity;" +
      "  d = pow(d,4.0);" +
      "  float alpha = d*(1.0-r);" +
      "  gl_FragColor = vec4(uBaseColor,alpha);" +
      "}",
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
  function drawPath(gr, name, col, size, fillFlag = true, alpha = 255){
    const _color = color(col);
    const _r = red(_color);
    const _g = green(_color);
    const _b = blue(_color);
    if(fillFlag){
      gr.fill(_r, _g, _b, alpha);
      gr.noStroke();
      gr.scale(size);
      gr.drawingContext.fill(paths[name]);
    }else{
      gr.stroke(_r, _g, _b, alpha);
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
  // layerはメソッドで追加します。取得できます。
  // indexで指定したものをpointerに登録するとpointerがその
  // layerに登録します。blendもこちらで操作できます。
  // 名前を付けると名前でのアクセスもできます。
  // pointerもそうしないと...ByName？

  // 汎用辞書
  // 名前でも数字でもアクセス可能
  class Dict{
    constructor(){
      this.objs = {};
      this.objArray = [];
      this.length = 0;
    }
    getLength(){
      return this.length;
    }
    loop(methodName, args = []){
      for(let i = 0; i < this.length; i++){
        this.objArray[i][methodName](...args);
      }
    }
    add(obj, _key){
      if(_key == undefined){
        _key = "obj" + this.length.toString();
      }
      if(_key == ""){ return false; }
      obj.key = _key;
      obj.index = this.length;
      this.objArray.push(obj);
      this.objs[_key] = obj;
      this.length++;
      return true;
    }
    get(_key){
      if(typeof(_key) == "string"){
        return this.objs[_key];
      }else if(typeof(_key) == "number"){
        return this.objArray[_key];
      }else{
        alert("invalid type error.");
      }
      return undefined;
    }
    setName(index, newKey){
      const obj = this.objArray[index];
      if(obj == undefined){ return false; }
      const prevKey = obj.key;
      for(let otherKey of Object.keys(this.objs)){
        if(otherKey == prevKey){
          this.objs[otherKey] = undefined;
          this.objs[newKey] = obj;
          obj.key = newKey;
          return true;
        }
      }
      return false;
    }
    delete(_key){
      const obj = this.get(_key);
      if(obj == undefined){ return false; }
      for(let i=obj.index+1; i<this.length; i++){
        const other = this.get(i);
        other.index--;
      }
      this.objArray.splice(obj.index, 1);
      this.objs[obj.key] = undefined;
      this.length--;
      return true;
    }
  }

  // レイヤー
  // グラフィックとそれを重ねる際の適用するblendModeと
  // ということは通常描画...
  // あれを模したものを作るのであれば
  // レイヤーごとの描画はそうなるでしょうね。せいぜい透明度。
  // つまりレイヤーごとにblendModeという形ではなくて
  // 各々のレイヤーへの描画は通常モードで
  // baseに落とす際にbaseのblendModeが適用される形なのね。
  class Layer{
    constructor(w, h, blendCommand = BLEND){
      this.w = w;
      this.h = h;
      this.graphic = createGraphics(w, h);
      this.blendCommand = blendCommand;
      this.visible = true;
    }
    setBlendCommand(newCommand){
      this.blendCommand = newCommand;
    }
    getGraphic(){
      return this.graphic;
    }
    paste(base){
      base.blendMode(this.blendCommand);
      base.image(this.graphic, 0, 0);
    }
    clear(){
      this.graphic.clear();
    }
    isVisible(){
      return this.visible;
    }
    hide(){
      this.visible = false;
    }
    show(){
      this.visible = true;
    }
  }

  class LayerSet{
    constructor(w, h){
      this.w = w;
      this.h = h;
      this.layerDict = new Dict();
      this.length = 0;
    }
    addLayer(option = {}){
      if(option.blendCommand == undefined){
        option.blendCommand = BLEND;
      }
      const newLayer = new Layer(this.w, this.h, option.blendCommand);
      if(option.key == undefined){
        option.key = "layer" + this.length.toString();
      }
      this.layerDict.add(newLayer, option.key);
      this.length++;
    }
    getLayer(_key){
      return this.layerDict.get(_key);
    }
    deleteLayer(_key){
      this.layerDict.delete(_key);
      this.length--;
    }
    draw(base){
      for(let i=0; i<this.layerDict.length; i++){
        const layer = this.layerDict.get(i);
        if(layer.isVisible()){ layer.paste(base); }
      }
    }
  }

  // Dictでいいのかどうかわかんないけどね...
  // baseLayerを取得する関数は存在しません。
  class System{
    constructor(baseLayer){
      // たとえばbaseLayerをclearするかどうかとか
      // background(0,9)するかどうかとか
      // そういうの全部向こうでできるようにするよ
      this.baseLayer = baseLayer;
      this.width = this.baseLayer.width;
      this.height = this.baseLayer.height;
      this.layerSet = new LayerSet(this.width, this.height);
      this.brushes = new Dict();
      this.pointers = new Dict();
    }
    addLayer(option = {}){
      this.layerSet.addLayer(option);
    }
    getLayer(_key){
      return this.layerSet.getLayer(_key);
    }
    getGraphic(_key){
      return this.getLayer(_key).getGraphic();
    }
    addBrush(newBrush, _key){
      // Brushとnameは分離すべきかなぁ。付随させる意味が
      // あんま無さそう。あったら戻すけど。
      this.brushes.add(newBrush, _key);
    }
    getBrush(_key){
      return this.brushes.get(_key);
    }
    addPointer(newPointer, _key){
      // pointerにも名前を付けられるよ、と。
      this.pointers.add(newPointer, _key);
    }
    getPointer(_key){
      return this.pointers.get(_key);
    }
    setBrush(pointerKey, brushKey){
      // pointerのkeyでpointerを取りbrushの名前でブラシを...
      // 数字でもOK.
      const pointer = this.getPointer(pointerKey);
      const brush = this.getBrush(brushKey);
      pointer.setBrush(brush);
    }
    setTarget(pointerKey, layerKey){
      const pointer = this.getPointer(pointerKey);
      // layer経由でgraphicを取得
      const target = this.getLayer(layerKey).getGraphic();
      pointer.setTarget(target);
    }
    setCol(pointerKey, col){
      // keyで色を決める。0とか1でもいい。
      const pointer = this.getPointer(pointerKey);
      pointer.setCol(col);
    }
    configBrush(_key, param = {}){
      const brush = this.brushes.get(_key);
      for(let paramKey of Object.keys(param)){
        brush.setParam(paramKey, param[paramKey]);
      }
    }
    start(_key = 0, x = 0, y = 0){
      const pointer = this.pointers.get(_key);
      pointer.setPos(x, y);
      pointer.activate();
      // トリガーでpointerの位置を決める。
    }
    startAll(x = 0, y = 0){
      this.pointers.loop("setPos", [x, y]);
      this.pointers.loop("activate");
    }
    update(){
      this.pointers.loop("update");
    }
    complete(_key = 0){
      const pointer = this.pointers.get(_key);
      this.pointers[index].inActivate();
    }
    completeAll(){
      this.pointers.loop("inActivate");
    }
    clear(_key){
      const layer = this.getLayer(_key);
      layer.clear();
    }
    setBlendMode(name, blendOption){
      const layer = this.layers.get(name);
      layer.blendMode(blendOption);
    }
    draw(){
      this.pointers.loop("draw");
      this.layerSet.draw(this.baseLayer);
      //this.setSelfColor(); // 毎フレームだと重い
    }
    setSelfColor(){
      // baseの計算後の色を取得する
      const N = this.pointers.getLength();
      for(let i=0; i<N; i++){
        const pointer = this.pointers.get(i);
        const {x, y} = pointer.getPos();
        const col = this.baseLayer.get(x, y);
        pointer.setSelfColor({r:col[0], g:col[1], b:col[2]});
      }
    }
  }

  // -------------------------------------------------------- //
  // pointer.
  // あ、そうかtargetってレイヤーのグラフィック部分だ。
  // 隠蔽されてるから生成時にアクセスできないんだっけ...
  class Pointer{
    constructor(){
      this.pos = {x:0, y:0, px:0, py:0, lx:0, ly:0};
      this.col = "#fff"; // デフォルト：白
      this.force = 1; // wをこれで可変にする。渡すとき考慮。
      this.brush = undefined; // ブラシ
      this.target = undefined; // system側で指定
      this.active = false; // activeなときに
      this.params = {}; // 特殊なブラシ用のパラメータセット
      // マウスダウンからの距離と総合距離
      this.tempDist = 0;
      // totalDistは廃止
      // 描画開始フラグ
      this.firstDrawed = false;
      // 代わりに描画終了フラグ
      this.lastDrawed = true;
      // inActivateするとendFlagがonになる
      // これを折ることでinActivate.その時に必要なら
      // 最後の描画を行う。
      // firstDrawedはparamsに含めることにしよう。
      // でないといろいろめんどくさい。
      // 0～255であらわされるその位置の色（baseの色）
      this.selfColor = {r:0,g:0,b:0};
      this._w = 0; // 「this.force*ブラシのw」を格納するスペース
      this.distance = 0; // 「x,yとlx,lyの距離」を格納するスペース
    }
    setPos(x = 0, y = 0){
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
    setTarget(target){
      this.target = target;
    }
    setSelfColor(col){
      this.selfColor = col;
    }
    getSelfColor(){
      return this.selfColor;
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
      this.firstDrawed = false; // ここでONにしてこれがONのときに
      // firstDrawがdraw時に発動する
      this.tempDist = 0;
    }
    inActivate(){
      this.lastDrawed = false;
      // ここでは終了フラグを立てるだけ。
      // あとでブラシの中でkill.
    }
    kill(){
      this.active = false;
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
      if(!this.active){ return; }
      // offscreenに描画してから
      this.brush.step(this); // こうかなぁ
      // ノードに貼り付け。ノードは毎フレームクリアされるので
      // これでOK.
    }
  }

  class MousePointer extends Pointer{
    constructor(speedFactor = 0.1){
      super();
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
    constructor(friend, mirrorOption = "mirrorX"){
      super();
      this.friend = friend;
      this.mirrorOption = mirrorOption;
    }
    setPos(x = 0, y = 0){
      const _data = this.getMirrorData(x, y, x, y);
      this.pos.x = _data.x;
      this.pos.y = _data.y;
      this.pos.px = _data.x;
      this.pos.py = _data.y;
      this.pos.lx = _data.x;
      this.pos.ly = _data.y;
    }
    getMirrorData(x, y, px, py){
      const w = this.target.width;
      const h = this.target.height;
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
    constructor(speedFactor = 0.1, sat = 1, blt = 1, colorSpan = 600){
      super();
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
  // 使う場合はgetPosDataという関数を持たせてください
  // x,y,px,pyに現在位置x,yと直前位置px,pyが格納されて
  // いる感じ
  class CompositePointer extends Pointer{
    constructor(controller){
      super();
      this.controller = controller;
    }
    setPos(x = 0, y = 0){
      // x,yは使いません
      const {x:_x,y:_y} = this.controller.getPosData();
      this.pos.x = _x;
      this.pos.y = _y;
      this.pos.px = _x;
      this.pos.py = _y;
      this.pos.lx = _x;
      this.pos.ly = _y;
    }
    update(){
      /* controllerから位置情報をパクる */
      // あらかじめcontrollerクラスに位置とか取得できる関数を
      // 用意しておくとなおよし。
      if(!this.active){ return; }
      // controllerは自前でupdateしてください（柔軟性）
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

  // ------------------------------------------------- //
  // Brush.
  // テンプレ化ね
  // intervalFactorとblendOptionを常設にする
  // んでforceとの計算を実行して_wを渡すのと
  // 新たにstartDrawを用意すると。

  class Brush{
    constructor(param = {}){
      this.initialize(param);
      // 名前はSystemに組み込む際に付ける（廃止）
    }
    getDefaultParam(){
      // デフォルトパラメータ群を用意する。初期化で使う。
      // 引数にないものはこの値で初期化される。もちろん
      // 後でいじることができる。
      return {w:1, intervalFactor:0.5};
    }
    parameterAdjustment(){
      // 基本的には何もしない
    }
    initialize(param){
      const dft = this.getDefaultParam();
      for(let _key of Object.keys(dft)){
        this.registParam(param, _key, dft[_key]);
      }
      // paramについて何かしたい場合
      this.parameterAdjustment();
    }
    registParam(param, paramName, dft){
      // paramのparamName属性があればそれを設定
      // なければdftを設定
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
    step(p){
      const {pos} = p;
      // 逐次更新処理。この中でdrawを実行する。
      // pointerの情報からpos,col,force,paramsを使う
      // 位置更新はポインターに任せてここでは描画だけ
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
        this.draw(p, ax, ay, dx, dy);
      }
    }
    firstDraw(p, x, y, dx, dy){
      // 最初のdrawでだけ実行
    }
    mainDraw(p, x, y, dx, dy){
      // メイン処理
    }
    lastDraw(p, x, y, dx, dy){
      // 最後のdrawでだけ実行
    }
    draw(p, x, y, dx, dy){
      // brushごとの描画処理
      // (x,y)が描画位置の基準で(dx,dy)が単位ベクトル
      // やることが多いですがテンプレとしては
      // _wをthis.w*forceとして設定
      // firstDrawedがfalseなら
      // ---- firstDraw ----
      // 何か処理してtrueにする
      // (lx,ly)と(x,y)との距離に応じてバリデーション
      // ---- mainDraw ----
      // 描画が実行されたら(lx,ly)を(x,y)で更新
      // pointerがisEndであれば
      // ---- lastDraw ----
      // kill. ここまでがテンプレ。
      // こっからが天ぷら（とり天美味しいです）
      p._w = this.w * p.force;
      const {pos} = p;
      p.distance = mag(x - pos.lx, y - pos.ly);
      // 最初の描画時だけ実行される処理（あれば）
      if(!p.firstDrawed){
        this.firstDraw(p, x, y, dx, dy);
        p.firstDrawed = true;
      }
      if(p.distance > p._w * this.intervalFactor){
        this.mainDraw(p, x, y, dx, dy);
        pos.lx = x;
        pos.ly = y;
      }
      // 描画終了フラグが立っている場合の処理（あれば）
      if(!p.lastDrawed){
        // たとえば線のキャップとかヘビの頭とか。
        this.lastDraw(p, x, y, dx, dy);
        p.lastDrawed = true;
        p.kill();
      }
    }
  }

  // circleBrushはcurveIconとかぶってるので廃止。
  // 以降はcurveIconで"circle"を指定してください。
  // 単純な線
  class LineBrush extends Brush{
    constructor(param){
      super(param);
    }
    getDefaultParam(){
      // 概要
      // w:線の太さ(1～200,1刻み)
      // intervalFactor:描画間隔。0.5～50で0.1刻み。折れ線。
      return {w:1, intervalFactor:0.5};
    }
    mainDraw(p, x, y, dx, dy){
      const {target, pos, col, _w} = p;
      target.stroke(col);
      target.strokeWeight(_w);
      target.line(pos.lx, pos.ly, x, y);
    }
  }

  // 多重線を引く
  class MultiLineBrush extends Brush{
    constructor(param){
      super(param);
    }
    getDefaultParam(){
      // w:1～100,1
      // multiple:1～20,1
      // intervalFactor:0.5～50,0.1
      // intervalFactorOfLines:10～20,1
      return {w:1, multiple:5, intervalFactor:0.5, intervalFactorOfLines:10};
    }
    firstDraw(p, x, y, dx, dy){
      const {params, _w} = p;
      params.lastXs = [];
      params.lastYs = [];
      const d = _w * this.intervalFactorOfLines;
      const l = (this.multiple - 1) * 0.5 * d;
      for(let i = 0; i < this.multiple; i++){
        params.lastXs.push(x-dy*(-l+i*d));
        params.lastYs.push(y+dx*(-l+i*d));
      }
    }
    mainDraw(p, x, y, dx, dy){
      const {params, target, pos, col, _w} = p;
      target.stroke(col);
      target.strokeWeight(_w);
      const d = _w * this.intervalFactorOfLines;
      const l = (this.multiple - 1) * 0.5 * d;
      for(let i = 0; i < this.multiple; i++){
        const nextX = x-dy*(-l+i*d);
        const nextY = y+dx*(-l+i*d);
        target.line(params.lastXs[i], params.lastYs[i], nextX, nextY);
        params.lastXs[i] = nextX;
        params.lastYs[i] = nextY;
      }
    }
  }

  // カーブアイコンブラシ
  // ハート 星 など

  // 文字列のところ、スペース区切りを使うことで
  // 複数種類できるようにしたら面白そう
  // split使えば簡単に実装できるはず
  // IconListってやる
  class CurveIconBrush extends Brush{
    constructor(param){
      super(param);
    }
    getDefaultParam(){
      // w:5～100,1
      // kindsはチェックボックスで
      // intervalFactor:0.5～10,0.1
      // fillもチェックボックス
      // alpha:1～255,1
      return {w:20, kinds:"heart", intervalFactor:1.2, fill:true, alpha:255};
    }
    parameterAdjustment(){
      // kindsを配列に変換する
      this.kinds = this.kinds.split(" ");
    }
    mainDraw(p, x, y, dx, dy){
      const {target, col, _w} = p;
      target.push();
      target.translate(x, y);
      target.rotate(atan2(dy, dx));
      const kind = random(this.kinds);
      drawPath(target, kind, col, _w, this.fill, this.alpha);
      target.pop();
    }
  }

  // lastXs,lastYs,barProg, tone, rhythmArray, rhythm,
  // drawFlag, tupletParamまで。spaceはその都度計算するし、
  // path関連はグローバルを使う。
  class MusicBrush extends Brush{
    constructor(param){
      super(param);
    }
    getDefaultParam(){
      return {w:1, intervalFactor:0.5};
    }
    firstDraw(p, x, y, dx, dy){
      const {params, _w} = p;
      params.lastXs = [];
      params.lastYs = [];
      params.barProg = 0;
      params.tone = 0;
      params.rhythmArray = [0,1,2,3];
      params.rhythm = 0;
      params.drawFlag = true;
      params.tupletParam = {close:{x:0,y:0}, far:{x:0,y:0}, lower:false};
      const space = _w*8; // 間隔
      const l = 2*space;
      for(let i = 0; i < 5; i++){
        params.lastXs.push(x-dy*(-l+i*space));
        params.lastYs.push(y+dx*(-l+i*space));
      }
    }
    draw5line(p, x, y, dx, dy, space){
      const {params, target} = p;
      const l = 2*space;
      for(let i = 0; i < 5; i++){
        const nextX = x-dy*(-l+i*space);
        const nextY = y+dx*(-l+i*space);
        target.line(params.lastXs[i], params.lastYs[i], nextX, nextY);
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
    mainDraw(p, x, y, dx, dy){
      //gr.blendMode(BLEND);
      const {params, distance, target, pos, col, _w} = p;
      // 五線譜描画は基本で、それとは別になんか置いていく。
      //const _w = this.w * force;
      const space = _w*8; // 間隔
      const l = 2*space;

      target.stroke(col);
      target.strokeWeight(_w);
      this.draw5line(p, x, y, dx, dy, space);

      // 以下、音符など
      const prevBP = Math.floor(params.barProg / _w);
      params.barProg += distance; // 累積距離
      // ここでbpが増えた場合にのみ
      // 描画命令の可否をリセットする
      const bp = Math.floor(params.barProg / _w);
      if(prevBP < bp){ params.drawFlag = true; }
      // するとあるbarProgで描画がなされたとき、そのあとのフレームで
      // bpが増えなければ、同じところへの描画は為されない。
      // ちょっと気になったので。
      if(bp > 165){
        // 区切り線を引く
        target.push();
        target.translate(x, y);
        target.rotate(atan2(dy, dx));
        target.stroke(col);
        target.strokeWeight(_w);
        target.line(0, -space*2, 0, space*2);
        target.pop();
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
      // draw系はもうめんどくさいので直接渡す

      if(bp % 40 == 26 && params.drawFlag){
        if(params.rhythm == 0){
          this.drawQuarterNote(target, x, y, dx, dy, col, params.tone, _w, space, (params.tone < 0));
        }
        if(params.rhythm == 3){
          this.drawQuarterRest(target, x, y, dx, dy, col, _w);
        }
        params.drawFlag = false;
      }
      if((bp % 40 == 16 || bp % 40 == 36) && params.drawFlag){
        if(params.rhythm == 1){
          if(bp % 40 == 16){
            this.drawEighthNote(target, x, y, dx, dy, col, params.tone, _w, space, (params.tone < 0));
          }else{
            this.drawEighthRest(target, x, y, dx, dy, col, _w);
          }
          params.drawFlag = false;
          if(bp % 40 == 16){
            // 再生成
            params.tone = Math.floor(random()*9)-4;
          }
        }
        if(params.rhythm == 2){
          if(bp % 40 == 16){
            this.drawQuarterNote(target, x, y, dx, dy, col, params.tone, _w, space, (params.tone < 0));
            params.drawFlag = false;
            // ここで位置を記録
            this.setTuplesParam(x, y, dx, dy, params.tone, space, params.tupletParam, (params.tone < 0));
            // 再計算
            params.tone = this.getNextTone(params.tone);
          }
          if(bp % 40 == 36){
            this.drawQuarterNote(target, x, y, dx, dy, col, params.tone, _w, space, params.tupletParam.lower);
            // ここで旗を描画
            this.drawTuplesFlag(target, x, y, dx, dy, col, params.tone, space, params.tupletParam);
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
    constructor(param){
      super(param);
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
    getDefaultParam(){
      // widthFactorは縦の伸びに対する横伸び割合(の半分)
      // strokeWeightFactorは白抜きの場合の線の太さ
      return {w:16, widthFactor:0.333, intervalFactor:1.2, strokeWeightFactor:0.05, fill:true};
    }
    mainDraw(p, x, y, dx, dy){
      // ここで描画
      const {params, target, pos, col, _w} = p;

      if(this.fill){
        target.fill(col);
        target.noStroke();
      }else{
        target.noFill();
        target.stroke(col);
        target.strokeWeight(max(1,_w*this.strokeWeightFactor));
      }
      // (横幅の半分)/(縦の伸び)
      const wf = this.widthFactor;
      target.triangle(pos.lx-dy*_w*wf, pos.ly+dx*_w*wf, pos.lx+dy*_w*wf, pos.ly-dx*_w*wf, pos.lx + dx * _w, pos.ly + dy * _w);
    }
  }

  // baseColはベース色
  // intervalはとげの配置間隔（ピクセル）で1～1.5が良き
  // 幅は40くらいを想定
  // colorBandは色のブレ具合で0.7くらいだといい感じ
  // thickはとげの厚さでデフォは0.04くらい、要するに渡しに対する幅
  class ThornBrush extends Brush{
    constructor(param){
      super(param);
      this.registParam(param, "w", 40);
      this.registParam(param, "intervalFactor", 0.022);
      this.registParam(param, "colorBand", 0.7);
      this.registParam(param, "thick", 0.04);
    }
    getDefaultParam(){
      return {w:40, intervalFactor:0.03, colorBand:0.7, thick:0.04};
    }
    drawThorn(gr, x0, y0, x1, y1){
      const midX = (x0+x1)/2;
      const midY = (y0+y1)/2;
      const diffX = (y0-y1)*this.thick;
      const diffY = (x1-x0)*this.thick;
      // quadにしよう。
      gr.quad(x0,y0,midX+diffX,midY+diffY,x1,y1,midX-diffX,midY-diffY);
    }
    mainDraw(p, x, y, dx, dy){
      const {target, params, pos, col, _w} = p;
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
      target.noStroke();
      target.fill(_r, _g, _b);
      // このq0,q1がx,yからのdiffになる感じ。
      this.drawThorn(target, x+q0.x, y+q0.y, x+q1.x, y+q1.y);
    }
  }

  // 色を2つ指定するとその間のblend（線形補間）で
  // いろんな色のいろんな大きさのオブジェクトが配置される感じ
  // 向きもランダムで
  class ScatterIconBrush extends Brush{
    constructor(param){
      super(param);
    }
    getDefaultParam(){
      return {w:20, secondCol:"#fff", kinds:"star", intervalFactor:0.25, sizeMinRatio:0.3, sizeMaxRatio:1, fill:true, alpha:255};
    }
    parameterAdjustment(){
      // kindsを配列に変換する
      this.kinds = this.kinds.split(" ");
    }
    mainDraw(p, x, y, dx, dy){
      const {target, params, pos, col, _w} = p;
      target.push();
      const _radius = Math.sqrt(Math.random())*this.w;
      const _angle = Math.random()*Math.PI*2;
      target.translate(x + _radius * Math.cos(_angle), y + _radius * Math.sin(_angle));
      const rotationAngle = Math.random()*Math.PI*2;
      target.rotate(rotationAngle);
      const sizeFactor = this.sizeMinRatio + Math.random()*(this.sizeMaxRatio - this.sizeMinRatio);

      const iconCol = lerpColor(color(col), color(this.secondCol), Math.random());
      const kind = random(this.kinds);
      drawPath(target, kind, iconCol, _w * sizeFactor, this.fill, this.alpha);
      target.pop();
    }
  }

  class AirBrush extends Brush{
    constructor(param){
      super(param);
      this.prepareAirBrushShader();
    }
    getDefaultParam(){
      return {w:64, density:0.6, intervalFactor:0.1}
    }
    prepareAirBrushShader(){
      this.airGr = createGraphics(512, 512, WEBGL);
      this.airGr.pixelDensity(1);
      // 必須(p5.1.4.1以降)
      this.airGr.setAttributes("alpha", true);
      this.airShader = this.airGr.createShader(shaders.vs_airBrush, shaders.fs_airBrush);
      this.airGr.shader(this.airShader);
    }
    createAirBrushGraphic(_w, r, g, b){
      this.airShader.setUniform("uResolution", [512, 512]);
      this.airShader.setUniform("uDensity", this.density);
      this.airShader.setUniform("uBaseColor", [r, g, b]);
      this.airShader.setUniform("uSizeFactor", _w/512);
      this.airGr.quad(-1,-1,-1,1,1,1,1,-1);
    }
    mainDraw(p, x, y, dx, dy){
      const {target, col, _w} = p;
      const _col = color(col);
      const _r = red(_col)/255;
      const _g = green(_col)/255;
      const _b = blue(_col)/255;
      this.createAirBrushGraphic(_w, _r, _g, _b);
      target.image(this.airGr, x-256, y-256);
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
  ex.LineBrush = LineBrush;
  ex.MultiLineBrush = MultiLineBrush;
  ex.CurveIconBrush = CurveIconBrush;

  ex.MusicBrush = MusicBrush;
  ex.TriangleBrush = TriangleBrush;


  ex.ThornBrush = ThornBrush;

  ex.ScatterIconBrush = ScatterIconBrush;

  ex.AirBrush = AirBrush;

  ex.util = {};
  ex.util.HSV2RGB = function(h, s, v){
    return HSV2RGB(h, s, v);
  }

  return ex;
})();

// ここまで。

/*
マニュアル
Mキーを押しながらクリック：パスの起点を追加
Lキーを押しながらクリック：前の点から伸びる直線を引く
Qキーを押しながらクリック：前の点から伸びる2次ベジエ曲線を引く
Bキーを押しながらクリック：前の点から伸びる3次ベジエ曲線を引く
ドラッグドロップで点を移動する
制御点も移動できる
選択されている点は色が変わる（基本すべて白）
既に曲線が配置されているときに別の位置でMを押してクリックすると
新しいパスが生成される（マルチパス）
Tキーを押すと編集中のパスを変更することができる
点が選択されているときにEキーを押しながらクリックすることで点を消せる
制御点は消すことができない。
Mキーで作った点（起点）を消すとパス自体が削除される
両側が制御点であるような点を選択したままVを押すと
後ろの制御点が前の制御点と選択点に関して対称の位置に移動する
点を選択中にFキーを押しながらXやYを押すと
コンフィグでfixのところのxやyで指定した座標位置に移動する
たとえばデフォルトでは320が入っているので
点を選択したままFを押しつつXを押すと選択中の点のx座標が320になる
シフトキーを押しながらパスを選択すると青い線が表示される
このときにLやQを押しながらクリックするとその位置に点が挿入される
Zキーを押すと終点の位置を始点の位置に合わせることができる（逆は駄目）
エンターキーを押すとパスデータが出力される
デフォルトでは中心(0,0)のy軸下方で、±1に正規化されて出力される
y軸に関して反転させたりスケールを変えたい場合は
outputのコンフィグをいじるとよい

マウスホイールで拡大、縮小。
拡大した場合に点が選択されていないときにマウスダウンドラッグで
表示位置の平行移動ができる←new!

平行移動時のアイコンを変更するとか（提案）
Pキー
Vと違って両側の制御点の選択点との距離を保ちつつ、
後ろの制御点の位置を前の制御点から選択点に伸びる半直線上に配置する
*/

let paths = [];
let pathId = -1;
let pointId = -1;

let curveLayer;
let separateLayer;
let infoLayer;
let insertData = {};

// 拡大縮小用
let displayScale = 1;
let displayOffsetX = 0;
let displayOffsetY = 0;
let scalingVelocity = 0;

// TwitterBird（スケール1でロード、フリップ無し）
const loadingData = "M -141.000 -122.000 Q -84.500 -54.000 2.000 -50.000 C -3.333 -139.667 79.333 -154.333 124.000 -115.000 Q 145.500 -116.000 167.000 -129.000 Q 158.500 -104.000 142.000 -91.000 Q 163.000 -93.500 179.000 -104.000 Q 165.500 -79.000 146.000 -70.000 C 132.000 140.333 -53.000 181.667 -163.000 115.000 Q -106.500 111.500 -68.000 86.000 Q -116.000 68.000 -130.000 35.000 Q -112.000 38.000 -96.000 35.000 Q -153.500 11.500 -153.000 -38.000 Q -139.500 -28.000 -125.000 -29.000 Q -165.500 -74.500 -141.000 -122.000 Z";

// 肉球（スケール300でロード、フリップ無し）
const loadingData2 = "M 0.063 0.298 C 0.109 0.311 0.150 0.329 0.200 0.364 C 0.225 0.376 0.250 0.398 0.275 0.417 C 0.287 0.439 0.313 0.454 0.341 0.489 C 0.360 0.505 0.380 0.522 0.400 0.539 C 0.425 0.573 0.450 0.604 0.478 0.636 C 0.506 0.661 0.539 0.694 0.566 0.742 C 0.588 0.792 0.556 0.820 0.503 0.836 C 0.463 0.851 0.394 0.864 0.325 0.886 C 0.247 0.898 0.139 0.917 0.056 0.932 C -0.014 0.938 -0.083 0.943 -0.153 0.948 C -0.212 0.954 -0.287 0.911 -0.313 0.867 C -0.317 0.829 -0.334 0.798 -0.294 0.745 C -0.272 0.698 -0.241 0.679 -0.225 0.654 C -0.200 0.616 -0.175 0.577 -0.159 0.542 C -0.125 0.495 -0.104 0.447 -0.072 0.398 C -0.044 0.365 -0.006 0.328 0.047 0.301 Z M -0.469 0.066 C -0.434 0.100 -0.388 0.128 -0.350 0.163 C -0.329 0.188 -0.306 0.212 -0.300 0.237 C -0.283 0.277 -0.279 0.317 -0.275 0.356 C -0.287 0.392 -0.300 0.427 -0.325 0.450 C -0.346 0.471 -0.384 0.478 -0.412 0.487 C -0.452 0.487 -0.492 0.487 -0.531 0.487 C -0.575 0.478 -0.613 0.447 -0.641 0.425 C -0.662 0.397 -0.662 0.366 -0.675 0.328 C -0.678 0.303 -0.700 0.256 -0.697 0.216 C -0.694 0.188 -0.681 0.128 -0.662 0.097 C -0.647 0.078 -0.637 0.069 -0.616 0.053 C -0.588 0.041 -0.537 0.041 -0.487 0.056 Z M 0.700 -0.159 C 0.719 -0.141 0.738 -0.122 0.756 -0.103 C 0.775 -0.078 0.787 -0.013 0.787 0.034 C 0.787 0.059 0.784 0.116 0.772 0.169 C 0.766 0.200 0.756 0.237 0.731 0.275 C 0.713 0.309 0.688 0.331 0.637 0.350 C 0.600 0.356 0.566 0.353 0.525 0.341 C 0.500 0.331 0.469 0.316 0.441 0.294 C 0.426 0.270 0.411 0.246 0.400 0.216 C 0.394 0.190 0.391 0.157 0.388 0.125 C 0.388 0.100 0.402 0.063 0.409 0.031 C 0.424 0.000 0.439 -0.031 0.453 -0.063 C 0.477 -0.087 0.497 -0.122 0.525 -0.138 C 0.534 -0.153 0.563 -0.169 0.631 -0.178 C 0.600 -0.175 0.659 -0.172 0.681 -0.169 Z M -0.269 -0.694 C -0.248 -0.692 -0.227 -0.680 -0.197 -0.662 C -0.181 -0.647 -0.163 -0.631 -0.141 -0.606 C -0.125 -0.581 -0.100 -0.550 -0.097 -0.522 C -0.087 -0.482 -0.084 -0.441 -0.081 -0.403 C -0.080 -0.348 -0.079 -0.293 -0.078 -0.237 C -0.078 -0.178 -0.084 -0.131 -0.100 -0.075 C -0.113 -0.034 -0.150 -0.009 -0.191 0.006 C -0.223 0.018 -0.261 0.020 -0.300 0.022 C -0.347 0.025 -0.388 0.013 -0.425 -0.019 C -0.453 -0.050 -0.487 -0.087 -0.503 -0.134 C -0.512 -0.156 -0.516 -0.206 -0.519 -0.266 C -0.522 -0.306 -0.516 -0.347 -0.512 -0.384 C -0.503 -0.431 -0.491 -0.469 -0.478 -0.509 C -0.463 -0.544 -0.444 -0.575 -0.419 -0.603 C -0.397 -0.622 -0.375 -0.647 -0.353 -0.659 C -0.330 -0.672 -0.307 -0.684 -0.287 -0.694 Z M 0.269 -0.759 C 0.293 -0.752 0.317 -0.745 0.341 -0.738 C 0.360 -0.720 0.380 -0.702 0.397 -0.681 C 0.428 -0.641 0.441 -0.609 0.450 -0.572 C 0.454 -0.525 0.458 -0.478 0.463 -0.431 C 0.463 -0.378 0.463 -0.322 0.459 -0.284 C 0.456 -0.234 0.447 -0.197 0.441 -0.172 C 0.431 -0.141 0.425 -0.109 0.403 -0.078 C 0.384 -0.053 0.350 -0.031 0.313 -0.009 C 0.284 0.000 0.247 0.009 0.203 0.003 C 0.169 -0.009 0.128 -0.034 0.100 -0.059 C 0.075 -0.094 0.063 -0.109 0.050 -0.134 C 0.045 -0.169 0.040 -0.203 0.034 -0.237 C 0.033 -0.274 0.025 -0.303 0.028 -0.334 C 0.028 -0.384 0.041 -0.425 0.044 -0.469 C 0.053 -0.500 0.069 -0.541 0.078 -0.572 C 0.097 -0.609 0.116 -0.644 0.138 -0.684 C 0.159 -0.709 0.175 -0.734 0.194 -0.753 C 0.215 -0.761 0.229 -0.764 0.244 -0.762 Z M -0.694 -0.056 C -0.703 -0.072 -0.722 -0.081 -0.750 -0.097 C -0.762 -0.103 -0.787 -0.097 -0.800 -0.084 C -0.803 -0.066 -0.800 -0.047 -0.794 -0.034 C -0.784 -0.025 -0.772 -0.016 -0.750 -0.003 C -0.744 -0.008 -0.731 0.000 -0.713 -0.006 C -0.688 -0.022 -0.688 -0.037 -0.684 -0.044 Z M -0.309 -0.753 C -0.331 -0.759 -0.362 -0.759 -0.375 -0.784 C -0.376 -0.800 -0.377 -0.822 -0.378 -0.844 C -0.372 -0.860 -0.366 -0.877 -0.356 -0.884 C -0.342 -0.899 -0.324 -0.904 -0.309 -0.897 C -0.297 -0.887 -0.287 -0.878 -0.278 -0.863 C -0.269 -0.838 -0.275 -0.803 -0.278 -0.791 C -0.278 -0.778 -0.297 -0.759 -0.297 -0.762 Z M 0.250 -0.972 C 0.272 -0.969 0.297 -0.947 0.303 -0.919 C 0.306 -0.897 0.303 -0.887 0.291 -0.856 C 0.306 -0.872 0.269 -0.841 0.263 -0.838 C 0.241 -0.838 0.225 -0.847 0.212 -0.866 C 0.200 -0.872 0.203 -0.897 0.206 -0.922 C 0.211 -0.942 0.223 -0.955 0.237 -0.969 Z M 0.778 -0.328 C 0.800 -0.313 0.809 -0.294 0.803 -0.281 C 0.803 -0.263 0.803 -0.247 0.794 -0.228 C 0.791 -0.216 0.778 -0.200 0.750 -0.197 C 0.725 -0.200 0.715 -0.214 0.703 -0.225 C 0.702 -0.245 0.707 -0.268 0.719 -0.284 C 0.727 -0.303 0.742 -0.316 0.762 -0.334 Z";

// これを回転させる（フリップあり）
/*
const utuwa = "M 0.000 -0.388 Q 0.162 -0.386 0.355 -0.335 Q 0.549 -0.283 0.645 -0.003 Q 0.735 0.277 0.756 0.372 Q 0.764 0.411 0.773 0.421 Q 0.784 0.430 0.795 0.419 Q 0.802 0.409 0.797 0.362 Q 0.748 0.180 0.682 -0.025 Q 0.603 -0.218 0.549 -0.271 Q 0.460 -0.352 0.342 -0.384 Q 0.320 -0.393 0.321 -0.425 Q 0.321 -0.464 0.320 -0.523 Q 0.292 -0.544 0.279 -0.489 Q 0.276 -0.449 0.278 -0.406 Q 0.150 -0.447 0.001 -0.444 Z";
*/
// ツボの右半分
const tubo = "M 0.001 -0.713 Q 0.323 -0.745 0.504 -0.583 Q 0.610 -0.483 0.630 -0.356 Q 0.651 -0.230 0.557 -0.103 Q 0.476 0.005 0.352 0.044 Q 0.231 0.086 0.166 0.194 Q 0.089 0.309 0.158 0.430 Q 0.187 0.477 0.232 0.502 Q 0.294 0.542 0.304 0.639 Q 0.317 0.708 0.362 0.697 Q 0.409 0.686 0.402 0.625 Q 0.397 0.553 0.335 0.497 Q 0.277 0.455 0.235 0.395 Q 0.194 0.338 0.257 0.213 Q 0.302 0.152 0.393 0.123 Q 0.499 0.084 0.598 -0.005 Q 0.712 -0.124 0.726 -0.267 Q 0.728 -0.352 0.683 -0.472 Q 0.642 -0.571 0.569 -0.657 Q 0.497 -0.740 0.406 -0.771 Q 0.295 -0.813 0.186 -0.813 L -0.004 -0.813 Z";

const config = {
  outputScale:1,
  output_yFlip:false, // フリップするときtrueなのでfalseで1ですね。
  inputScale:1,
  input_yFlip:false,
  fixCoord_x:320,
  fixCoord_y:320,
  strokeColor:"#000"
};

function createGUI(){
  const gui = new lil.GUI();
  gui.add(config, "outputScale", 1, 320, 1);
  gui.add(config, "output_yFlip");
  gui.add(config, "inputScale",1,320,1);
  gui.add(config, "input_yFlip");
  gui.add(config, "fixCoord_x", 0, 640, 1);
  gui.add(config, "fixCoord_y", 0, 640, 1);
  gui.addColor(config, "strokeColor");
}

/*
let dlImg, img;
function preload(){
  dlImg = loadImage("toon.png");
}
*/


function setup() {
  createCanvas(640, 640);
  createGUI();

  curveLayer = createGraphics(640, 640);
  curveLayer.noFill();

  separateLayer = createGraphics(640, 640);
  separateLayer.noFill();
  separateLayer.strokeWeight(3);

  infoLayer = createGraphics(640, 640);
  infoLayer.textSize(16);
  infoLayer.textAlign(LEFT, TOP);

  noStroke();

  //img = createGraphics(640, 640);
  //img.image(dlImg, 0, 0, 640, 640, 0, 0, dlImg.width, dlImg.height);
}

function draw() {
  //clear();
  background(200);
  //displayLoadedImage(img);
  image(curveLayer, 0, 0);

  // スケールチェンジを毎フレーム行なうことで滑らかな変更を実現する
  updateScale();

  if (pathId >= 0) {
    const currentPath = paths[pathId];
    // ここもいじらないといけない
    // スケールに応じて移動距離を蛙足すいすい潜るの大好き
    // ちがーう！
    // 具体的にはスケールで割る必要があるね
    if (mouseIsPressed) {
      if (mouseButton === LEFT) {
        if (pointId >= 0) {
          const p = currentPath[pointId];
          p.x += (mouseX - pmouseX)/displayScale;
          p.y += (mouseY - pmouseY)/displayScale;
          updateCurveLayer();
        } else {
          // 点が選択されていない場合は表示位置の平行移動とする
          displayOffsetX -= (mouseX - pmouseX)/displayScale;
          displayOffsetY -= (mouseY - pmouseY)/displayScale;
          calcOffset();
          updateCurveLayer();
        }
      }
    } else {
      const candidates = [];
      // ここはあれだね...マウス位置そのまま使わないとだ。
      // 理由は「10」という数字をそのまま使いたいので。
      // そういうわけでpの方をいじる必要がある
      for(let i=0; i<currentPath.length; i++){
        const p = currentPath[i];
        // 表示上の位置で判定する
        const dp = calcDisplayCoord(p);
        const d = Math.hypot(dp.x - mouseX, dp.y - mouseY);
        if (d < 10) {
          candidates.push({p:p, d:d, pId:i});
        }
      }
      if (candidates.length > 0) {
        candidates.sort((p0, p1) => {
          if (p0.d < p1.d) return -1;
          if (p0.d > p1.d) return 1;
          return 0;
        });
        pointId = candidates[0].pId;
      } else {
          pointId = -1;
      }
    }

    if (keyIsDown(16)){
      updateSeparateLayer();
      image(separateLayer,0,0);
    }

    // ここの描画はオフセットとスケールに影響される
    // 補正関数は一本化するといい
    for(let i=0;i<currentPath.length;i++){
      const p = currentPath[i];
      if (i === pointId) {
        switch(p.type){
          case "M": fill("gray"); break;
          case "L": fill("forestgreen"); break;
          case "Q": fill("red"); break;
          case "QC": fill("orange"); break;
          case "B": fill("blue"); break;
          case "BC": fill("skyblue"); break;
        }
      }
      else { fill(255); }
      // pを表示上の位置に補正する
      const dp = calcDisplayCoord(p);
      circle(dp.x, dp.y, 10);
    }
  }
  // infoは常に表示
  updateInfoLayer();
  image(infoLayer,0,0);
}

function displayLoadedImage(loadedImg){
  // これでいいの？
  const sx = map(displayOffsetX, 0, 640, 0, loadedImg.width);
  const sy = map(displayOffsetY, 0, 640, 0, loadedImg.height);
  const sw = loadedImg.width/displayScale;
  const sh = loadedImg.height/displayScale;
  image(loadedImg, 0, 0, 640, 640, sx, sy, sw, sh);
}

// tキーでパス変更
// zキーで終点を始点の位置にくっつける
function keyTyped(){

  // すっからかんでエンターの場合
  if (keyIsDown(13) && pathId < 0) {

    loadPathData(tubo);
    pathId = 0;
    updateCurveLayer();
    return;
  }
  // これ以降はパスがある場合の処理

  if (pathId < 0) return;
  if (key === 't') {
    pathId = (pathId + 1) % paths.length;
    updateCurveLayer();
    return;
  }
  if (key === 'z') {
    const path = paths[pathId];
    const head = path[0];
    const tail = path[path.length-1];
    tail.x = head.x;
    tail.y = head.y;
    updateCurveLayer();
    return;
  }
  // エンターキーでログ出力
  if (keyIsDown(13) && pathId >= 0){
    console.log(getPathData());
    return;
  }
  // fを押しながらxまたはy
  // これで固定される（fはfixのf）
  if (keyIsDown(70)) {
    if (key === 'x'){
      fixCoord('x');
      return;
    }
    if (key === 'y'){
      fixCoord('y');
      return;
    }
  }
  // vでQかBの点の両側の制御点をいじる（vは形のイメージ）
  if (key === 'v'){
    alignControlPoint();
  }
}

// 'x'と'y'に応じて座標固定
function fixCoord(fixType){
  if (pointId < 0) return;
  const p = paths[pathId][pointId];
  if (fixType === 'x'){
    p.x = config.fixCoord_x;
    updateCurveLayer();
  }
  if (fixType === 'y'){
    p.y = config.fixCoord_y;
    updateCurveLayer();
  }
}

function updateScale(){
  displayScale *= pow(2, scalingVelocity);
  displayScale = constrain(displayScale, 1, 16);
  calcOffset();
  updateCurveLayer();
  scalingVelocity *= 0.85;
  if (abs(scalingVelocity) < 0.0001) scalingVelocity = 0;
}

function mouseWheel(e){
  // マウスホイール
  // 一般に拡大するのは上ホイール、e.delta<0ですね
  // 下ホイールで縮小、e.delta>0ですね。
  if (mouseX < 0 || mouseX > 640 || mouseY < 0 || mouseY > 640) return;
  e.preventDefault();
  scalingVelocity -= e.delta * 0.0005;
}

// 選択点がQ/Bで、次の点もQ/Bの場合に、
// その点の前後の点を見て、後の点を前の点と選択点に関して対称な位置に移す
function alignControlPoint(){
  if (pointId < 0) return;
  const path = paths[pathId];
  const p = path[pointId];
  if (p.type !== 'Q' && p.type !== 'B') return;
  // 次の点を見つけるの難しいね...
  // 単純に次の点を見て、Lなら無視、QCかBCなら...でOK.
  // というかQCかBCでいいだろ。それで判断しよう。
  const nextPointType = path[pointId+1].type;
  if (nextPointType !== 'QC' && nextPointType !== 'BC') return;
  const q = (nextPointType === 'QC' ? path[pointId+2] : path[pointId+3]);
  const prevCP = path[pointId-1];
  const nextCP = path[pointId+1];
  nextCP.x = 2*p.x - prevCP.x;
  nextCP.y = 2*p.y - prevCP.y;
  updateCurveLayer();
}

// 点の追加
  // シフトキー押してる場合は挿入モード

// 追加する点の位置を計算する際、実際の位置になるように補正を掛ける必要がある
// ね。
function mouseClicked(){
  // 実際の位置は先に計算しておいて使いまわす
  const mPos = calcRealCoord(mouseX, mouseY);

  // Mキーで開始点を追加
  if (keyIsDown(77)){
    // pathId<0の場合は新しいパスを作る
    if (pathId < 0) {
      paths.push([]);
      pathId = 0;
    } else {
      paths.push([]);
      pathId = paths.length-1;
    }
    // マウス位置から実際の位置を計算してそれを元に点を生成する
    paths[pathId].push({x:mPos.x, y:mPos.y, type:"M"});
    updateCurveLayer();
    return;
  }
  if (pathId < 0) return;
  const currentPath = paths[pathId];
  // Lキーで点を追加
  if (keyIsDown(76)){
    if (!keyIsDown(16)) {
      // ここも実際の位置で。
      currentPath.push({x:mPos.x, y:mPos.y, type:"L"});
    }else if (insertData.insertable){
      currentPath.splice(insertData.prevId+1, 0, {x:mPos.x, y:mPos.y, type:"L"});
    }
    updateCurveLayer();
    return;
  }
  // Qキーで制御点とともに2次ベジエ点を追加
  if (keyIsDown(81)){

    if (!keyIsDown(16)) {
      const lastPoint = currentPath[currentPath.length-1];
      const middlePoint = {x:(lastPoint.x + mPos.x) * 0.5, y:(lastPoint.y + mPos.y) * 0.5, type:"QC"};
      currentPath.push(middlePoint);
      currentPath.push({x:mPos.x, y:mPos.y, type:"Q"});
    }else if(insertData.insertable){
      const lastPoint = currentPath[insertData.prevId];
      const middlePoint = {x:(lastPoint.x + mPos.x) * 0.5, y:(lastPoint.y + mPos.y) * 0.5, type:"QC"};
      currentPath.splice(insertData.prevId+1, 0, {x:mPos.x, y:mPos.y, type:"Q"});
      currentPath.splice(insertData.prevId+1, 0, middlePoint);
    }
    updateCurveLayer();
    return;
  }
  // Bキーで制御点とともに3次ベジエ点を追加

  if (keyIsDown(66)){
    if (!keyIsDown(16)){
      const lastPoint = currentPath[currentPath.length-1];
      const firstPoint = {x:(lastPoint.x*2.0 + mPos.x) / 3.0, y:(lastPoint.y*2.0 + mPos.y) / 3.0, type:"BC"};
      const secondPoint = {x:(lastPoint.x + mPos.x*2.0) / 3.0, y:(lastPoint.y + mPos.y*2.0) / 3.0, type:"BC"};

      currentPath.push(firstPoint, secondPoint);
      currentPath.push({x:mPos.x, y:mPos.y, type:"B"});
    }else if(insertData.insertable){
      const lastPoint = currentPath[insertData.prevId];
      const firstPoint = {x:(lastPoint.x*2.0 + mPos.x) / 3.0, y:(lastPoint.y*2.0 + mPos.y) / 3.0, type:"BC"};
      const secondPoint = {x:(lastPoint.x + mPos.x*2.0) / 3.0, y:(lastPoint.y + mPos.y*2.0) / 3.0, type:"BC"};
      currentPath.splice(insertData.prevId+1, 0, {x:mPos.x, y:mPos.y, type:"B"});
      currentPath.splice(insertData.prevId+1, 0, secondPoint);
      currentPath.splice(insertData.prevId+1, 0, firstPoint);
    }
    updateCurveLayer();
    return;
  }
  // Eキーで点を削除
  if (keyIsDown(69) && pointId >= 0){
    const p = currentPath[pointId];
    switch(p.type){
      case "L":
        currentPath.splice(pointId, 1);
        pointId = -1;
        break;
      case "Q":
        currentPath.splice(pointId-1, 2);
        pointId = -1;
        break;
      case "B":
        currentPath.splice(pointId-2, 3);
        pointId = -1;
        break;
      case "M":
        currentPath.length = 0;
        paths.splice(pathId, 1);
        if (paths.length === 0){
          //paths.push([]);
          pathId = -1;
        }
        pointId = -1;
        break;
      }
    updateCurveLayer();
    return;
  }
}

// ここの処理はオフセットとスケールに依存する
// 描画部分を分離するとよい。
function updateCurveLayer(){
  curveLayer.clear();
  if (pathId < 0) return;
  for(let k=0; k<paths.length; k++){
    const strokeWeightValue = (k === pathId ? 2 : 1);
    curveLayer.strokeWeight(strokeWeightValue);
    const path = paths[k];
    for(let i=1; i<path.length; i++){
      const p = path[i];
      switch(p.type){
        case "L":
          const prevL = path[i-1];
          curveLayer.stroke(config.strokeColor);
          addLine(curveLayer, p, prevL);
          //curveLayer.line(p.x, p.y, prevL.x, prevL.y);
          break;
        case "Q":
          const prevQ = path[i-2];
          const cp = path[i-1];
          curveLayer.stroke(128);
          addLine(curveLayer, prevQ, cp);
          addLine(curveLayer, cp, p);
          //curveLayer.line(prevQ.x, prevQ.y, cp.x, cp.y);
          //curveLayer.line(cp.x, cp.y, p.x, p.y);
          curveLayer.stroke(config.strokeColor);
          addBezier2(curveLayer, prevQ, cp, p);
          break;
        case "B":
          const prevB = path[i-3];
          const cp0 = path[i-2];
          const cp1 = path[i-1];
          curveLayer.stroke(128);
          addLine(curveLayer, prevB, cp0);
          addLine(curveLayer, cp0, cp1);
          addLine(curveLayer, cp1, p);
          //curveLayer.line(prevB.x, prevB.y, cp0.x, cp0.y);
          //curveLayer.line(cp0.x, cp0.y, cp1.x, cp1.y);
          //curveLayer.line(cp1.x, cp1.y, p.x, p.y);
          curveLayer.stroke(config.strokeColor);
          addBezier3(curveLayer, prevB, cp0, cp1, p);
          //curveLayer.bezier(prevB.x, prevB.y, cp0.x, cp0.y, cp1.x, cp1.y, p.x, p.y);
          break;
      }
    }
  }
}

function updateSeparateLayer(){
  insertData.insertable = false;
  separateLayer.clear();
  if (pathId < 0) return;
  const path = paths[pathId];
  const keyPoints = [];
  for(let i=0; i<path.length; i++){
    const p = path[i];
    if (p.type !== "QC" && p.type !== "BC") keyPoints.push(
      {v:createVector(p.x,p.y), id:i}
    );
  }
  if (keyPoints.length < 2) return;
  const data = [];
  // ここで使うマウス位置は実際の...じゃないな。判定に使う距離を考えると...
  // マウス位置はそのままで、キーポイントの方をいじる必要があるわね。
  // 表示位置を計算し、それに基づいて線を渡す。
  const m = createVector(mouseX, mouseY);
  const displayedKeyPoints = [];
  for(let i=0; i<keyPoints.length; i++){
    const dp = calcDisplayCoord(keyPoints[i].v);
    displayedKeyPoints.push(createVector(dp.x, dp.y));
  }
  for(let i=1; i<keyPoints.length; i++){
    const eachData = distWithSegment(
      m, displayedKeyPoints[i-1], displayedKeyPoints[i]
    );
    eachData.prevId = keyPoints[i-1].id;
    eachData.prev = keyPoints[i-1].v;
    eachData.next = keyPoints[i].v;
    // splice(insertId, 0, 挿入したい点)で挿入される
    data.push(eachData);
  }
  data.sort((a, b) => {
    if (a.d < b.d) return -1;
    if (a.d > b.d) return 1;
    return 0;
  });
  const target = data[0];
  if (target.d > 10) return;
  separateLayer.stroke(0,128,255);
  // pとqは使わなくてよくて、これは描画であるが、実際の位置を使う必要がある。
  // addLineの方を修正して、見た目の位置に描画されるようにする。
  addLine(separateLayer, target.prev, target.next);
  //separateLayer.line(target.p.x, target.p.y, target.q.x, target.q.y);
  insertData = target;
  insertData.insertable = true;
}

// mx,myは実際の位置になるようにいじる必要がある。
function updateInfoLayer(){
  infoLayer.clear();
  infoLayer.text("hello! I'm fine!", 5, 5);
  const mPos = calcRealCoord(mouseX, mouseY);
  infoLayer.text("(" + (mPos.x).toFixed(2) + ", " + (mPos.y).toFixed(2) + ")", 5, 25);
  infoLayer.text("scale:" + displayScale.toFixed(2), 5, 45);
  infoLayer.text("offset:(" + displayOffsetX.toFixed(2) + ", " + displayOffsetY.toFixed(2) + ")", 5, 65);
}

// 以下の関数でオフセットとかいろいろ調整する
function addLine(gr, p, q){
  const dp = calcDisplayCoord(p);
  const dq = calcDisplayCoord(q);
  gr.line(dp.x, dp.y, dq.x, dq.y);
}

function addBezier2(gr, p, c, q){
  const dp = calcDisplayCoord(p);
  const dc = calcDisplayCoord(c);
  const dq = calcDisplayCoord(q);
  gr.beginShape();
  gr.vertex(dp.x, dp.y);
  gr.quadraticVertex(dc.x, dc.y, dq.x, dq.y);
  gr.endShape();
}
function addBezier3(gr, p, c0, c1, q){
  const dp = calcDisplayCoord(p);
  const dc0 = calcDisplayCoord(c0);
  const dc1 = calcDisplayCoord(c1);
  const dq = calcDisplayCoord(q);
  gr.bezier(dp.x, dp.y, dc0.x, dc0.y, dc1.x, dc1.y, dq.x, dq.y);
}

// ここは座標から計算されるようにしないと...
// たとえばpはマウス位置ではなく実際の
// pはマウス位置でいいのか。p1とp2が表示用の位置じゃないとまずいわけだ。
// 0～640の...という意味。pはマウス位置でいい。
// 変更はdistWithSegmentを使うところだけでいい。そこは一ヶ所しかない。
function distWithSegment(p, p1, p2){
  const v1 = p5.Vector.sub(p2, p1);
  const v2 = p5.Vector.sub(p, p1);
  const h1 = p5.Vector.dot(v1, v2) / p5.Vector.dot(v1, v1);
  let obj = {};
  const h2 = constrain(h1, 0, 1);
  obj.h = h2;
  const q = p5.Vector.lerp(p1, p2, h2);
  obj.d = p5.Vector.dist(p, q); // sgとの距離(obj.dist)
  return obj;
}

function getPathData(){
  // 変換する
  // Zで締めて次を用意する
  // 半角で放り込んでく
  // toFixed(3)でやる
  // とりあえず300,300を引く

  const outputScale = config.outputScale/320; // ゆくゆくは「ほしいスケール」/300
  const yFlip = (config.output_yFlip ? -1 : 1); // フリップするとき-1

  let result = "M";
  for(let i=0; i<paths.length; i++){
    const path = paths[i];
    for(let k=0; k<path.length; k++){
      const p = path[k];
      const x = (p.x - 320) * outputScale;
      const y = (p.y - 320) * outputScale * yFlip;
      switch(p.type){
        case "M":
          if (i > 0) { result += " M"; }
          result += " " + x.toFixed(3) + " " + y.toFixed(3);
          break;
        case "L":
          result += " L";
          result += " " + x.toFixed(3) + " " + y.toFixed(3);
          break;
        case "Q":
          const c = path[k-1];
          const cx = (c.x - 320) * outputScale;
          const cy = (c.y - 320) * outputScale * yFlip;
          result += " Q";
          result += " " + cx.toFixed(3) + " " + cy.toFixed(3);
          result += " " + x.toFixed(3) + " " + y.toFixed(3);
          break;
        case "B":
          const c0 = path[k-2];
          const c1 = path[k-1];
          const c0x = (c0.x - 320) * outputScale;
          const c0y = (c0.y - 320) * outputScale * yFlip;
          const c1x = (c1.x - 320) * outputScale;
          const c1y = (c1.y - 320) * outputScale * yFlip;
          result += " C"; // 記法的には3次ベジエはBじゃなくてCなんですよね
          result += " " + c0x.toFixed(3) + " " + c0y.toFixed(3);
          result += " " + c1x.toFixed(3) + " " + c1y.toFixed(3);
          result += " " + x.toFixed(3) + " " + y.toFixed(3);
          break;
      }
    }
    result += " Z";
  }
  return result;
}

// pathDataから復元する
function loadPathData(data){
  // pathsが空の場合のみインプットされる
  if (paths.length > 0) return;

  const inputScale = config.inputScale;
  const yFlip = (config.input_yFlip ? -1 : 1); // フリップするとき-1
  const dataArray = data.split(" ");
  // Mから始まって点が次々とでてくるので随時放り込んでいく
  let i = 0;

  let curPath;
  while(i < dataArray.length) {
    const cmd = dataArray[i];
    // Mの場合：paths.push([])ののちcurPathId++;して
    // curPath=paths[curPathId]する、んで次の2つの数字を必要ならフリップしてから
    // スケール倍して300を足して放り込む
    // Zの場合：なにもしない
    // Lの場合：点を1つ入れる
    // Qの場合：点を2つ入れる
    // Cの場合：Bにするので注意。点を3つ入れる
    switch(cmd){
      case "M":
        paths.push([]);
        curPath = paths[paths.length-1];
        curPath.push(getCmdData(
          Number(dataArray[i+1]), Number(dataArray[i+2]), inputScale, yFlip, "M"
        ));
        i+=3;
        break;
      case "Z":
        i++;
        break;
      case "L":
        curPath.push(getCmdData(
          Number(dataArray[i+1]), Number(dataArray[i+2]), inputScale, yFlip, "L"
        ));
        i+=3;
        break;
      case "Q":
        curPath.push(getCmdData(
          Number(dataArray[i+1]), Number(dataArray[i+2]), inputScale, yFlip, "QC"
        ));
        curPath.push(getCmdData(
          Number(dataArray[i+3]), Number(dataArray[i+4]), inputScale, yFlip, "Q"
        ));
        i+=5;
        break;
      case "C":
        curPath.push(getCmdData(
          Number(dataArray[i+1]), Number(dataArray[i+2]), inputScale, yFlip, "BC"
        ));
        curPath.push(getCmdData(
          Number(dataArray[i+3]), Number(dataArray[i+4]), inputScale, yFlip, "BC"
        ));
        curPath.push(getCmdData(
          Number(dataArray[i+5]), Number(dataArray[i+6]), inputScale, yFlip, "B"
        ));
        i+=7;
        break;
      default:
        i++; // バグ対策
    }
  }
}

function getCmdData(x,y,inputScale,yFlip,cmdType){
  x *= inputScale;
  y *= yFlip * inputScale;
  x += 320;
  y += 320;
  return {x:x, y:y, type:cmdType};
}

// ------------------------------------------------------------------- //
// 位置補正用関数

// マウス位置とスケールからオフセットを計算する
// 画面外に行かないように補正を施す。
// なんかまずい？
// オフセットの補正をするだけでいいと思う
// ...
// まずマウス位置の割合
// mouseX/640, mouseY/640
// と、displayRangeからoffsetの位置が出て...あとは同じ。
function calcOffset(){
  const displayRange = 640/displayScale;
  const mPos = calcRealCoord(mouseX, mouseY);
  const left = mPos.x - displayRange * (mouseX/640);
  const top = mPos.y - displayRange * (mouseY/640);
  //const bottom = mouseY + displayRange/2;
  // 基本leftだが、leftが0より小さければ0.
  // またrightが640より大きいときはright-640を引く。
  displayOffsetX = constrain(left, 0, 640-displayRange);
  displayOffsetY = constrain(top, 0, 640-displayRange);
}

// オフセットとスケールから表示位置を計算する
// 描画にはこれが使われる。
function calcDisplayCoord(p){
  const result = {};
  const displayRange = 640/displayScale;
  result.x = map(p.x, displayOffsetX, displayOffsetX + displayRange, 0, 640);
  result.y = map(p.y, displayOffsetY, displayOffsetY + displayRange, 0, 640);
  return result;
}

// 逆に表示位置から実際の位置を計算する。これはマウス位置の補正に使われる。
// 点の追加をするときはこれを使う。
function calcRealCoord(x, y){
  const result = {};
  const displayRange = 640/displayScale;
  result.x = map(x, 0, 640, displayOffsetX, displayOffsetX + displayRange);
  result.y = map(y, 0, 640, displayOffsetY, displayOffsetY + displayRange);
  return result;
}

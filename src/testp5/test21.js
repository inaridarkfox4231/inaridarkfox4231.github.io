// 2021年コード書き修め！
// 空中に文字を描くのやってみたかった。きついね！達成感。

// mode変更(board, bevel, dimple, separate)
// 処理(create, delete, deleteAll)

// とりあえず中心で回転するようにはしました。
// button追加。fix,rolling,move
// fixは固定。rollingはその場で回転。moveは回転しながら動く。
// 速度は2～7のスピードでランダムで。角度とか。
// ほんとはイコササンプリングで方向が均等にばらけるように
// しないといけないんだけどめんどくさいのでね・・・・・
// ていうかやったことないです（おい）

// たとえばえーと。中心？の・・座標を上げる？？
// んー。カメラが縦の場合・・・？には、たとえば360°回転する場合、
// 初期位相をその分回せばいい。

// どうしようもないのでボタンで切り替えます
// cameraFlag==trueの場合はカメラが動くよ。

// この手法を使えば、空中にオブジェクト作るのをできるわけです・・
// たとえばマウスドラッグで線を引くみたいなことも自由自在なわけで。
// たとえばチューブを流したりとかもできる・・応用すればいくらでも。
// グリーズペンシル的な？知らないけど。。

// あそこ普通にカメラ行列でいいはず。
// ただ逆変換を考えるとそこまで単純でもなさそうな・・んー。

// 2022年の黒狐はとても冷静なので
// 自作コンフィグをやめることにしました（当然）
// dat.GUI! かもーん！
// 内部メソッドはほぼいじらないので、コンフィグだけです。
// めちゃめちゃ苦労したあれこれをいじることはしません（というか無理）
// configで統一。

// 内容復習

// delete Folder.
// まずdeleteFirstは最初に作ったものを消す
// deleteLastは最後に作ったものを消す
// clearはすべて消す
// 描画モード

// drawMode Folder.
// text厚さ: 厚さをいじる
// ラジオボタン
// BOARDで通常の板
// BEVELでベベル
// DIMPLEでくぼんでるやつ
// SPLITはばらばらにする（大変だった）
// 動きについて

// moveMode Folder.
// FIXで固定
// ROLLINGでその場で回転
// FLYAWAYでとんでく(MOVEから改名)

// createボタンでcreate
// reDrawは書き途中の線を消す（resetのところ）
// CAMERAでカメラ切り替え
// saveで画面セーブ発動
// forwardColor,backColorで表と裏の色指定

// さらに

// default Folder
// まずラジオボタンでnoneとtextとflowerを指定できるように
// noneは何も用意されない
// textやflowerを指定すると最後にそれが追加される
// 基本的にはカーソル位置を中心として
// ガイドが描画されるのでそれに基づいて追加される感じですかね
// テキストの場合はサイズと文字の内容と字間隔をいじれる
// flowerの場合はいろいろ調整したうえでそれ。やはりカーソル中心
// できますか？？

// 問題発生
// dat.GUIをいじるためのマウス操作で線が引かれちゃう
// まずいのです
// 調べたらmouseReleasedの段階ではまだ内容が変化してない
// なので
// !mouseIsPressedの間だけconfigの値をメモする関数を作って
// それと一致しているか調べて
// 一致していないのがあった時に_drawer.reset()でredrawを呼び出す
// ことにする
// あとguiFunctionを呼び出す際にも全部_drawer.reset()する方向で
// よろしく！

// 問題解決しました。
// 今現在実装されている機能はすべて実装したので、ひとまず
// 余計なコードを削除します。

// 次に・・
// DefaultFigure: none, textで。
// textの場合・・
// contentとsizeとmarginを操作する。
// contentは内容でsizeは大きさでmarginは中身

// Textについて。
// DEFAULT_TEXTの場合に一番最後に、その、テッセレートする段階で、
// 文字のcontoursが追加される。そんだけ。ただ、それがどこなのか
// わかりづらいので、複数からなる文字についてはばらばらに
// したうえでmarginを設けて間をあける処理を行なうのと、
// それがどんな風になるのかガイドを設けたいと思う。
// つまり所定のfontで文字を描画する必要があるということ・・・

// heightの情報も使おう。で、bottomにする。で、
// heightのmaxを取って半分にしてオフセットにする。

/*
document.body.addEventListener( 'click', function(event) {
  console.log(event.target.className); //クラス
});
これ使ってclassNameがp5canvasでない場合に
処理させなければいい
それでいけるはずです
*/

// なんかビースト明朝の無料版とかいうの見つかったから入れてみた
// 機能制限がすごいけど綺麗。フォント作る人は、すごいね・・・。
// あとはんなり明朝追加

// 仕様変更
// マウスダウン時にTEXTやFLOWERの場合はそのままそのcontoursが
// 追加される形にする
// その際レイヤーにも描画されるようにする。
// そんだけ！
// 完了。

// jsonでcontourを用意してそれスタンプみたいにしても面白そうだわね

// ていうかね
// bgManagerの中で_node使ってるじゃん
// NGなんですよ（クラス定義内でグローバルインスタンスを使うのは
// 一種のスパゲティコード、完全にタブー）。
// だからnode渡さないといけないわけです。
// そのくらいの仕様変更はしてもいいと思うのですよね。
// 頑張って！

// UVはどうも帯については頂点が重複してるみたいです
// そのうち解消しようと思ってたけどその必要はないかな
// 上面下面については単純に256で割った値を使おうと思う
// 具体的にはw*0.5とh*0.5を足して256で割った値をそのまま格納する感じ
// 側面はそれをそのまま押し広げる形で最初が0で長さに応じてって感じで
// 長さの計算大変だけども
// まとめてやってしまうこともできるので・・
// それでそれを256で割った値を格納する・・まんまでもいいけど

// 先に付加情報だけ順繰りに配列に入れちゃってそのあとでまとめてUV付ける
// 感じでいいと思う
// {type:"plane", x:(~~+w*0.5)/256, y:(~~+h*0.5)/256}
// {type:"side", d:距離(累計距離)/256,h:高さ(0かmax値のどっちか)/256}
// これらをフラグメントシェーダ内で参照してfract取って
// mapを反映させる感じでどうかな
// てかこれでUVになってるからこれでいいな・・・・・
// あとはUV着色の場合Tessaに今vertexでやってるのをあれしないといけない
// のでそこら辺いじらないといけないですね

// 一旦BOARDに対してのみこれを実装する
// 他のモードに関しては仮にNOISEにしたとしても自動的にvertexが
// 採用される形にする
// 内容的には設定したmainColorがそのまま掛け算される形式でよろしく
// うまくいくようなら他のモードにも実装する感じですね

// ちょっと変更ですね。あの、ノイズエフェクトって形で。
// つまりフラグだけ渡してwhiteとラープして。。

// ノイズいい感じなので他のモードにも適用しますね
// 入りましたよ。

// じゃあ次はチェック模様とwaveですかね。
// wave一応できたので次はチェック模様やりたいです。
// やりたいんですけどセットできるテクスチャに限りがあるので
// まとめないといけないのです(個別は駄目)
// 16パターンを1024x1024に配置したい感じですね。
// わたすのは番号だけって感じにする

// 今後
// テクスチャを増やす。星とか水玉とかピカチュウとか青海波とか
// 三崩しこうじつなぎ矢絣フリー素材とかつぶプロにはもうこだわらなくていい
// から自由。七宝でも。あさのは。三角形。月と星。うろこ。雲。
// 雲作ったけどつなぎ目の問題が解消できないね。。
// まあいいでしょう。
// つなぎ目解消しました。1.0/TEXTURE_SIZEではしっこごまかした。
// とりあえずこれでいけるはずです。不自然になるよりはまし。

// 改めて今後
// 1.床のバリエーション（フォグが成功したので）
// (フォグについてはRenderNodeへのフィードバックも行うつもり)
// 2.テクスチャのバリエーション
// 3.SPLITをフラグにしてDIMPLEなどと共存させる（完了）
// 4.MOVEとDRAWを分離してMOVEの方で回転スピードや初速度をいじれるように
// (RANDOMも許す感じでそこはフラグで)（完了）
// こんなもんで

// やっぱspeedと・・horizontalAngleで0～TAUの
// verticalAngleの0～PIがいいな～とか言って。

// 帰りました。突然ですが仕様変更です。
// textureTable廃止。こっちでシェーダー計算で出す。できれば
// シンプレックス雲でいく。つなぎめどうこう面倒なので。256で割るのは
// 変えなくていいです。青海波も亀甲も工字繋ぎもそのままぶちこむ。それで
// いいよ。めんどうでしょ。以上。
// あんま変えるとこはないです。シェーダの記述量が増えてtexture読み込みが
// 無くなるだけだから。

// 背景と床同じパターン使えるので使い回す
// とりあえず256x256でなんかパターン作るGLSLを量産する
// フォーマット揃えて
// すべてはそれからだ
// それぞれ1次元の変数で変化させるモーションを付随させる
// ものによってはseed使っても可（random,雲やボロノイなど）
// つまり連続seedと離散seedってわけね

// preset使ってもいいかもしれない。複雑なものはpresetの方がいい。
// presetでないと表現できないものもあるでしょう。使い分け。
// フラグで切り替えてpresetのときはそっちが採用される形に。

// やめようプリセットオンリーでいいよもう
// めんどくさい
// 色指定で#表記が可能になるように仕様変更しました

// 床の色を変える準備してる
// 取得時は文字列からでも取得できるようにする処理を忘れずに
// それでいける
// worldタブを用意しましょうね
// 空の色もついでに変えちゃうか

// uTextureColorがproper取得になってないバグを修正しました

// 5,6,7ですね～
// 5の青海波はそのままでOK!
// 6のこうじつなぎは内部で
/*
"  p *= mat2(0.5,-sqrt(3.0)*0.5,0.5,sqrt(3.0)*0.5);" + // これを掛ければいい
"  p = fract(p*4.0);" + // ついでに4倍して
*/
// 7のあさのはは内部で
/*
"  p.y = fract(p.y*2.0/sqrt(3.0));" + // ここでyにこうしたあとで
"  p = fract(p*2.0);" + // 2倍でOKです。これでOKですね～
*/
// をすればOKですね～

// --------------------------------------------------------------- //
// prepare GUI.
// setup内で呼び出す予定。
// 今回は関数も利用するので内部関数方式は使えないのです。

const MODE_BOARD = 0;
const MODE_BEVEL = 1;
const MODE_DIMPLE = 2;

const MODE_NONE = 0;
const MODE_TEXT = 1;
const MODE_FLOWER = 2;

const FONT_REGULAR = 0;
const FONT_HUI = 1;
const FONT_BEAST = 2; // ビースト明朝無料
const FONT_HANNARI = 3; // はんなり明朝
const FONT_KOSUGIMARU = 4;
const FONT_ZCOOL = 5; // ZCOOLという一種のOpenFont(https://fonts.google.com/specimen/ZCOOL+QingKe+HuangYou)
const FONT_RABBITMOON = 6; // うさぎさんとまんげつのサンセリフのフリー版（https://typingart.stores.jp/items/630829c47acd160432beef23）

// 色のグラデーション方向
const MODE_X = 0;
const MODE_Y = 1;
const MODE_Z = 2;
const MODE_RANDOM = 3; // ランダム

const FLOWER_DETAIL = 400;

const TEXTURE_SIZE = 256; // 256x256のテクスチャを使います
// テクスチャタイプ
const TEXTURE_NONE = 0; // なにもなし（黒一色）
const TEXTURE_RANDOM = 1; // ランダム
const TEXTURE_CHECK = 2; // とりあえず3つ
const TEXTURE_CLOUD = 3;
const TEXTURE_TRIANGLES = 4;
const TEXTURE_SEIGAIHA = 5;
const TEXTURE_KOJI = 6;
const TEXTURE_ASANOHA = 7;

let config = {
  boardHeight:10,
  drawMode:MODE_BOARD,
  splitFlag:false,
  speed:0.0, // speed.
  horizontalAngle:0.0, // xy平面内での方向
  verticalAngle:0.0, // 持ち上げ角
  velocityRandomFlag:false,
  rotationX:0.00,
  rotationY:0.00,
  rotationZ:0.00,
  rotationRandomFlag:false,
  textureType:TEXTURE_NONE,
  waveFlag:false,
  camera:false,
  mainColor:{r:0, g:128, b:255},
  subColor:{r:255, g:255, b:255},
  textureColor:{r:255, g:255, b:255},
  colorVariation:MODE_Z,
  mode:MODE_NONE,
  textContent:"",
  textSize:60,
  fontType:FONT_REGULAR,
  flowerM:3, // 1～30
  flowerN:2, // 1～30
  flowerR:160, // 80～320
  flowerRatio:0.3, // 0.0～1.0
  floorColor:{r:0, g:178, b:255},
  floorTextureType:TEXTURE_TRIANGLES,
  skyColor:{r:0, g:178,b:255}
}
// flowerのdetailは800でいいやね（うん）

function startGUI(){
  let gui = new dat.GUI({ width:240 });
  // 削除用
  let deleteFolder = gui.addFolder('Delete');
  deleteFolder.add({fun:guiDeleteFirst }, 'fun').name('deleteFirst');
  deleteFolder.add({fun:guiDeleteLast}, 'fun').name('deleteLast');
  deleteFolder.add({fun:guiClear}, 'fun').name('clear');
  // 描画モード変更用
  let objectFolder = gui.addFolder('object');
  objectFolder.add(config, 'boardHeight', 1, 120, 1);
  objectFolder.add(config, 'drawMode', {'BOARD':MODE_BOARD, 'BEVEL':MODE_BEVEL, 'DIMPLE':MODE_DIMPLE}).name('mode');
  objectFolder.add(config, 'splitFlag').name('split');
  objectFolder.add(config, 'textureType', {'NONE':TEXTURE_NONE, 'RANDOM':TEXTURE_RANDOM, 'CHECK':TEXTURE_CHECK, 'CLOUD':TEXTURE_CLOUD, 'TRIANGLES':TEXTURE_TRIANGLES, 'SEIGAIHA': TEXTURE_SEIGAIHA, 'KOJITSUNAGI':TEXTURE_KOJI, 'ASANOHA':TEXTURE_ASANOHA}).name('texture');
  objectFolder.add(config, 'waveFlag').name('wave');
  // アクションモード変更用
  let moveFolder = gui.addFolder('move');
  // velocity.
  let velocityFolder = moveFolder.addFolder('velocity');
  velocityFolder.add(config, 'speed', 0.0, 8.0, 0.1).name('speed');
  velocityFolder.add(config, 'horizontalAngle', 0.0, 6.28, 0.01).name('hAngle');
  velocityFolder.add(config, 'verticalAngle', -1.57, 1.57, 0.01).name('vAngle');
  velocityFolder.add(config, 'velocityRandomFlag').name('random');
  // rotation.
  let rotationFolder = moveFolder.addFolder('rotation');
  rotationFolder.add(config, 'rotationX', -0.05, 0.05, 0.001).name('rotationX');
  rotationFolder.add(config, 'rotationY', -0.05, 0.05, 0.001).name('rotationY');
  rotationFolder.add(config, 'rotationZ', -0.05, 0.05, 0.001).name('rotationZ');
  rotationFolder.add(config, 'rotationRandomFlag').name('random');
  // create関数、汎用機能
  gui.add({fun:guiCreateFigure}, 'fun').name('create');
  gui.add({fun:guiRedraw}, 'fun').name('redraw');
  gui.add(config, 'camera');
  gui.add(config, 'mode', {'NONE':MODE_NONE, 'TEXT':MODE_TEXT, 'FLOWER':MODE_FLOWER}).name('mode');
  // テキスト用
  let textFolder = gui.addFolder('Text');
  textFolder.add(config, 'textContent').name('content');
  textFolder.add(config, 'textSize', 40, 200, 1).name('size');
  textFolder.add(config, 'fontType', {'REGULAR':FONT_REGULAR, 'HUI':FONT_HUI, 'BEAST':FONT_BEAST, 'HANNARI':FONT_HANNARI,
																			'KOSUGIMARU':FONT_KOSUGIMARU, 'ZCOOL':FONT_ZCOOL, 'RABBITMOON':FONT_RABBITMOON}).name('font');
  // フラワー用
  let flowerFolder = gui.addFolder('Flower');
  flowerFolder.add(config, 'flowerM', 1, 30, 1).name('m');
  flowerFolder.add(config, 'flowerN', 1, 30, 1).name('n');
  flowerFolder.add(config, 'flowerR', 80, 320, 1).name('radius');
  flowerFolder.add(config, 'flowerRatio', 0, 1, 0.01).name('ratio');
  let worldFolder = gui.addFolder('World');
  worldFolder.addColor(config, 'floorColor');
  worldFolder.add(config, 'floorTextureType', {'NONE':TEXTURE_NONE, 'RANDOM':TEXTURE_RANDOM, 'CHECK':TEXTURE_CHECK, 'CLOUD':TEXTURE_CLOUD, 'TRIANGLES':TEXTURE_TRIANGLES, 'SEIGAIHA': TEXTURE_SEIGAIHA, 'KOJITSUNAGI':TEXTURE_KOJI, 'ASANOHA':TEXTURE_ASANOHA}).name('texture');
  worldFolder.addColor(config, 'skyColor');
  // うっかりセーブしないようにフォルダにいれとく
  let colorAndSaveFolder = gui.addFolder('Color/Save');
  colorAndSaveFolder.addColor(config, 'mainColor');
  colorAndSaveFolder.addColor(config, 'subColor');
  colorAndSaveFolder.addColor(config, 'textureColor');
  colorAndSaveFolder.add(config, 'colorVariation', {'GRADATION_X':MODE_X, 'GRADATION_Y':MODE_Y, 'GRADATION_Z':MODE_Z, 'RANDOM':MODE_RANDOM}).name('variation');
  colorAndSaveFolder.add({fun:guiSave}, 'fun').name('save');
}

// --------------------------------------------------------------- //
// global.

let _gl, gl;

let _node; // これが統括する。

// tessellation関連
const MINIMUM_DISTANCE = 4;
let _drawer;
let _tessellator;

// カメラ変数（クラス化が待たれる）
let posR = 320*Math.sqrt(3);
let defaultPosR = 320 * Math.sqrt(3); // デフォルトとの比率が重要
let posTheta = Math.PI * 0.4;
let posPhi = Math.PI*0.66;
let focusX = 0;
let focusY = 0;
let eyeVector, toCenterVector, sideVector, upVector;

// インフォレイヤー。
// 操作方法載せたりあれ、ガイドとか更新用
let infoLayer;
//let font_hui, font_regular, font_beast, font_hannari; // フォント！
let fonts = [];
let textureTableSource, textureTable; // テクスチャテーブル

let saveFlag = false;
let activatedClassName = "";

// --------------------------------------------------------------- //
// shader.

// テクスチャ関連の関数は床の模様とオブジェクト用で使い回す
let forTexture =
// テクスチャサンプリングのための前処理
"vec2 prepareForTexture(vec2 p){" +
"  if(uTextureId == 6.0){" + // 工字繋ぎ
"    p *= mat2(0.5,-sqrt(3.0)*0.5,0.5,sqrt(3.0)*0.5);" +
"    p = fract(p*4.0);" + // ついでに4倍
"  }else if(uTextureId == 7.0){" + // あさのは
"    p.y = fract(p.y*2.0/sqrt(3.0));" + // ここでyにこうしたあとで
"    p = fract(p);" + // fract.
"  }else{" +
"    p = fract(p);" +
"  }" +
"  return p;" +
"}" +
// テクスチャサンプリング
"float getAmount(vec2 tex){" +
"  float offsetX = mod(uTextureId, 4.0) * 0.25;" +
"  float offsetY = floor(uTextureId / 4.0) * 0.25;" +
"  float delta = 1.0/uTextureSize;" +
// つなぎ目の不自然さを消すための処理。暫定処理だけどこれでいこう。
"  tex.x = clamp(tex.x, delta, 1.0-delta);" +
"  tex.y = clamp(tex.y, delta, 1.0-delta);" +
"  vec2 _tex = vec2(offsetX, offsetY) + tex*0.25;" +
"  float amt = texture2D(uTextureTable, _tex).r;" +
"  return amt;" +
"}";

let lightVert=
"precision mediump float;" +

"attribute vec3 aPosition;" +
"attribute vec4 aVertexColor;" +
"attribute vec3 aNormal;" +
"attribute vec2 aTexCoord;" + // 一応。

"uniform vec3 uAmbientColor;" +

"uniform mat4 uModelViewMatrix;" +
"uniform mat4 uProjectionMatrix;" +
"uniform mat3 uNormalMatrix;" +

"varying vec4 vVertexColor;" +
"varying vec3 vNormal;" +
"varying vec3 vViewPosition;" +
"varying vec3 vAmbientColor;" +
"varying vec2 vTexCoord;" +

"void main(void){" +
  // 場合によってはaPositionをいじる（頂点位置）
  // 場合によってはaNormalもここで計算するかもしれない
"  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);" +

  // Pass varyings to fragment shader
"  vViewPosition = viewModelPosition.xyz;" +
"  gl_Position = uProjectionMatrix * viewModelPosition;" +

"  vNormal = uNormalMatrix * aNormal;" +
"  vVertexColor = aVertexColor;" +
"  vTexCoord = aTexCoord;" + // わたす

"  vAmbientColor = uAmbientColor;" +
"}";

let lightFrag =
"precision mediump float;" +

"uniform mat4 uViewMatrix;" +
// directionalLight関連
"uniform vec3 uLightingDirection;" +
"uniform vec3 uDirectionalDiffuseColor;" +
"uniform vec3 uPointLightLocation;" +
"uniform vec3 uPointLightDiffuseColor;" +
"uniform vec3 uAttenuation;" + // デフォルトは1,0,0.
// pointLight関連
"uniform bool uUseDirectionalLight;" + // デフォルトはfalse.
"uniform bool uUsePointLight;" + // デフォルトはfalse;

"const float diffuseFactor = 0.73;" +
"const int USE_VERTEX_COLOR = 0;" +
"const int USE_MONO_COLOR = 1;" +
// DirectionalLight項の計算。
"vec3 getDirectionalLightDiffuseColor(vec3 normal){" +
"  vec3 lightVector = (uViewMatrix * vec4(uLightingDirection, 0.0)).xyz;" +
"  vec3 lightDir = normalize(lightVector);" +
"  vec3 lightColor = uDirectionalDiffuseColor;" +
"  float diffuse = max(0.0, dot(-lightDir, normal));" +
"  return diffuse * lightColor;" +
"}" +
// PointLight項の計算。attenuationも考慮。
"vec3 getPointLightDiffuseColor(vec3 modelPosition, vec3 normal){" +
"  vec3 lightPosition = (uViewMatrix * vec4(uPointLightLocation, 1.0)).xyz;" +
"  vec3 lightVector = modelPosition - lightPosition;" +
"  vec3 lightDir = normalize(lightVector);" +
"  float lightDistance = length(lightVector); " +
"  float d = lightDistance;" +
"  float lightFallOff = 1.0 / dot(uAttenuation, vec3(1.0, d, d*d));" +
"  vec3 lightColor = lightFallOff * uPointLightDiffuseColor;" +
"  float diffuse = max(0.0, dot(-lightDir, normal));" +
"  return diffuse * lightColor;" +
"}" +
// _lightはこれで。
"vec3 totalLight(vec3 modelPosition, vec3 normal){" +
"  vec3 result = vec3(0.0);" + // 0.0で初期化
// directionalLightの影響を加味する
"  if(uUseDirectionalLight){" +
"    result += getDirectionalLightDiffuseColor(normal);" +
"  }" +
// pointLightの影響を加味する
"  if(uUsePointLight){" +
"    result += getPointLightDiffuseColor(modelPosition, normal);" +
"  }" +
"  result *= diffuseFactor;" +
"  return result;" +
"}" +
// include lighting.glsl
"uniform vec4 uMonoColor;" +
"uniform int uUseColorFlag;" + // 0:vertex. 1:mono.
// 単色にしたいときtrueにして有効化する感じ。
//"uniform bool uUseNoiseTexture;" + // ノイズ番号(4x4で0～15)
"uniform float uTextureId;" +
"uniform float uTextureSize;" + // テクスチャサイズ(256)
// マジックナンバー化を避けるための処理

//"uniform sampler2D uNoiseTex;" + // テクスチャ
"uniform sampler2D uTextureTable;" + // テクスチャテーブル
"uniform vec3 uTextureColor;" + // テクスチャの白部分の色(デフォで白)

"varying vec4 vVertexColor;" +
"varying vec3 vNormal;" +
"varying vec3 vViewPosition;" +
"varying vec3 vAmbientColor;" +
"varying vec2 vTexCoord;" +
forTexture +
// メインコード
"void main(void){" +
"  vec3 diffuse = totalLight(vViewPosition, normalize(vNormal));" +
"  vec4 col = vec4(1.0);" +

"  if(uUseColorFlag == USE_MONO_COLOR) {" +
"    col = uMonoColor;" +  // uMonoColor単色
"  }" +
"  if(uUseColorFlag == USE_VERTEX_COLOR){" +
"    col = vVertexColor;" + // 頂点色
"  }" +
// ポストエフェクト(黒：元の色、白：テクスチャ固有色)
//"  if(uUseNoiseTexture){" +
"  vec2 tex = vTexCoord;" +
"  tex = prepareForTexture(tex);" + // 事前の処理
"  float amt = getAmount(tex);" +
//"    float amt = texture2D(uNoiseTex, tex).r;" +
"  col.rgb = (1.0 - amt) * col.rgb + amt * uTextureColor;" +
//"  }" +
  // diffuseの分にambient成分を足してrgbに掛けて色を出してspecular成分を足して完成みたいな（？？）
"  col.rgb *= (diffuse + vAmbientColor);" +
"  gl_FragColor = col;" +
"}";

// 頂点色つけるだけの簡易シェーダ
let myVert=
"precision mediump float;" +
"attribute vec3 aPosition;" +
"attribute vec4 aVertexColor;" +
"varying vec4 vVertexColor;" +
"uniform mat4 uModelViewMatrix;" +
"uniform mat4 uProjectionMatrix;" +
"void main(){" +
"  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);" +
"  gl_Position = uProjectionMatrix * viewModelPosition;" +
"  vVertexColor = aVertexColor;" +
"}";

let myFrag=
"precision mediump float;" +
"varying vec4 vVertexColor;" +
"void main(){" +
"  gl_FragColor = vVertexColor;" +
"}";

// 空を召喚
const skyVert =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

const skyFrag =
"precision mediump float;" +
"uniform vec2 uResolution;" +
"uniform float uFov;" + // デフォルトではPI/3となっている
"uniform float uAspect;" + // w/hですね
"uniform vec3 uEye;" + // スタート地点
"uniform vec3 uToCenter;" + // カメラから注視点へ
"uniform vec3 uSide;" + // x.
"uniform vec3 uUp;" + // -y.
"uniform sampler2D uTextureTable;" +
"uniform float uTextureSize;" +
"uniform float uTextureId;" + // テクスチャId
"uniform vec3 uFloorColor;" + // 床の色
"uniform vec3 uBaseSkyColor;" + // 空の色
// getRGB.
"vec3 getRGB(float h, float s, float b){" +
"  vec3 c = vec3(h, s, b);" +
"  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);" +
"  rgb = rgb * rgb * (3.0 - 2.0 * rgb);" +
"  return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +
forTexture +
// 空の色
"vec3 getSkyColor(vec3 eye, vec3 ray){" +
"  float z = ray.z + 0.05;" +
"  float amt = sqrt(z*(2.0-z));" +
"  vec3 skyColor = uBaseSkyColor*amt + vec3(1.0)*(1.0-amt);" +
"  return skyColor;" +
"}" +
// 床
"vec3 getBackgroundColor(vec3 eye, vec3 ray){" +
"  if(ray.z > -0.05){" +
"    return getSkyColor(eye, ray);" +
"  }" +
"  float t = -eye.z / ray.z;" +
"  vec2 q = eye.xy + t * ray.xy;" +
"  vec2 iq = floor(q/64.0);" +
"  vec3 result;" +
//"  vec3 mainColor = vec3(0.0, 0.7, 1.0);" +
"  vec3 textureColor = vec3(1.0);" +
//"  vec2 offset = vec2(0.0, 0.25);" +
//"  vec2 tex = fract(q/1024.0);" +
//"  float delta = 1.0/uTextureSize;" +
//"  tex.x = clamp(tex.x, delta, 1.0-delta);" +
//"  tex.y = clamp(tex.y, delta, 1.0-delta);" +
//"  float amt = texture2D(uTextureTable, offset + 0.25 * tex).r;" +
"  vec2 tex = prepareForTexture(q/1024.0);" + // 事前の処理
"  float amt = getAmount(tex);" +
"  result = (1.0-amt)*uFloorColor+amt*textureColor;" +
//"  if(mod(iq.x + iq.y, 2.0) == 0.0){" +
//"    result = mainColor; }else{" +
//"    result = subColor; }" +
// フォグ効果（一応白に寄せる・・黒でもいいけどね）
"  float factor = exp(-length(t*ray.xy)*0.0005);" + // フォグ
"  vec3 fogBaseColor = vec3(1.0);" +
"  result = factor * result + (1.0 - factor) * fogBaseColor;" +
"  return result;" +
"}" +
// メインコード
"void main(){" +
"  vec2 p = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.xy;" +
// pを(-1,-1)～(1,1)にする
// eyeからtoCenterだけ進み
// side x aspect x tan(fov/2)だけ進み
// -up x tan(fov/2) だけ進む
"  vec3 cur = uEye;" +
"  vec3 ray = uToCenter;" +
"  ray += p.x * uAspect * tan(uFov * 0.5) * uSide;" +
"  ray -= p.y * tan(uFov * 0.5) * uUp;" +
"  vec3 col = getBackgroundColor(cur, ray);" +
"  gl_FragColor = vec4(col, 1.0);" +
"}";

// --------------------------------------------------------------- //
// preload.

function preload(){
  fonts.push( loadFont("https://inaridarkfox4231.github.io/assets/Mplus1-Regular.ttf"));
  fonts.push( loadFont("https://inaridarkfox4231.github.io/assets/HuiFont29.ttf"));
  fonts.push(loadFont("https://inaridarkfox4231.github.io/assets/beastMINI.otf"));
  fonts.push(loadFont("https://inaridarkfox4231.github.io/assets/HannariMincho-Regular.otf"));
	fonts.push(loadFont("https://inaridarkfox4231.github.io/assets/KosugiMaru-Regular.ttf"));
	fonts.push(loadFont("https://inaridarkfox4231.github.io/assets/fonts/ZCOOL-Regular.ttf"));
	fonts.push(loadFont("https://inaridarkfox4231.github.io/assets/fonts/RabbitandFullMoon-Regular.otf"));
  textureTableSource = loadImage("https://inaridarkfox4231.github.io/assets/texture/textureTable.png");
}

// --------------------------------------------------------------- //
// setup.

function setup() {
  _gl = createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  gl = _gl.GL; // レンダリングコンテキストの取得

  startGUI();
  document.body.addEventListener( 'mousedown', function(event) {
    // マウスダウン時にクラス名を取得
    // これが"p5Canvas"かどうかで分岐処理する
    activatedClassName = event.target.className;
  });
  textureTable = new p5.Texture(_gl, textureTableSource);

  // カリング間違えてた。難しいね。
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);

  textureFloatCheck();
  Uint32ArrayCheck();

  // nodeを用意
  _node = new RenderNode();

  _shader = createShader(lightVert, lightFrag);
  _node.registRenderSystem('light', _shader);
  _node.useRenderSystem('light')
       .registUniformLocation('uTextureTable');

  // 中で_node使ってるから_node用意してからでないとバグる
  _drawer = new Drawer();
  _tessellator = new Tessellator();

  // 左クリックのメニュー表示禁止
  document.oncontextmenu = (e) => {
    e.preventDefault();
  }
  // インフォ用のレイヤーを準備
  infoLayer = new BackgroundManager();
  infoLayer.addLayer().addLayer().addLayer();
  // 2番目のレイヤーで文字描画. 3番目のレイヤーで花？ですかね。
  prepareForInfoLayer();

  // カメラ関連
  focusX = 0;
  focusY = 0;
  focusZ = height * 0.5;
  posR = height * 0.5 * Math.sqrt(3);
  defaultPosR = height * 0.5 * Math.sqrt(3);

  _shader = createShader(skyVert, skyFrag);
  _node.registRenderSystem('sky', _shader);
  _node.use('sky', 'plane')
       .registAttribute('aPosition', [-1,1,0,1,1,0,-1,-1,0,1,-1,0], 3)
       .registUniformLocation('uTextureTable');

  eyeVector = createVector();
  toCenterVector = createVector();
  sideVector = createVector();
  upVector = createVector();
}

// --------------------------------------------------------------- //
// main loop.

//let performanceRatio = 0;

function draw(){
  _drawer.update();

  // カメラ設定
  if(config.camera){ moveCamera(); }
  eyeVector.set(posR*sin(posTheta)*sin(posPhi)+focusX,
                posR*sin(posTheta)*cos(posPhi)+focusY,
                posR*cos(posTheta)+focusZ);
  camera(eyeVector.x, eyeVector.y, eyeVector.z, focusX, focusY, focusZ, 0, 0, -1);
  const m = _gl.uMVMatrix.copy().mat4;
  toCenterVector.set(-m[2], -m[6], -m[10]);
  sideVector.set(m[0], m[4], m[8]);
  upVector.set(m[1], m[5], m[9]);

  // 空
  gl.disable(gl.DEPTH_TEST);
  camera(0, 0, height * 0.5 * Math.sqrt(3.0), 0, 0, 0, 0, 1, 0);
  const {r:fr, g:fg, b:fb} = getProperColor(config.floorColor);
  const {r:sr, g:sg, b:sb} = getProperColor(config.skyColor);
  _node.use('sky', 'plane')
       .setAttribute()
       .setUniform("uResolution", [width, height])
       .setUniform("uFov", Math.PI / 3)
       .setUniform("uAspect", width / height)
       .setUniform("uEye", [eyeVector.x, eyeVector.y, eyeVector.z])
       .setUniform("uToCenter", [toCenterVector.x, toCenterVector.y, toCenterVector.z])
       .setUniform("uSide", [sideVector.x, sideVector.y, sideVector.z])
       .setUniform("uUp", [upVector.x, upVector.y, upVector.z])
       .setUniform("uTextureSize", 256.0)
       .setUniform("uTextureId", config.floorTextureType)
       .setUniform("uFloorColor", [fr/255, fg/255, fb/255])
       .setUniform("uBaseSkyColor", [sr/255, sg/255, sb/255])
       .setTexture('uTextureTable', textureTable.glTex, 0)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  gl.enable(gl.DEPTH_TEST);

  // tesses.
  _node.useRenderSystem('light')
       .setDirectionalLight(_RGB(1), toCenterVector.x, toCenterVector.y, toCenterVector.z)
       .setAmbientLight(_RGB(0.25))
       .setTexture('uTextureTable', textureTable.glTex, 0)
       .setUniform('uTextureSize', TEXTURE_SIZE);
       // clearで消えちゃうんだこれ

  // カメラ～
  camera(eyeVector.x, eyeVector.y, eyeVector.z, focusX, focusY, focusZ, 0, 0, -1);

  _tessellator.setTranslate(focusX, focusY, focusZ);
  _tessellator.setRotation(-posPhi, -posTheta);
  _tessellator.setScale(posR / defaultPosR);
  _tessellator.display();

  // infoLayer
  infoLayer.setLayer(0).draw("clear")
           .setLayer(2).draw("clear")
           .setLayer(3).draw("clear");
  if(!config.camera){
    if(config.mode == MODE_TEXT){ drawGuideText(); }
    if(config.mode == MODE_FLOWER){ drawFlower(); }
  }
  // drawer
  _drawer.img.setLayer(0)
             .draw("clear")

  // drawer & infoLayer. (save時には描画しない)
  if(!saveFlag){
    infoLayer.display();
    _drawer.display();
  }

  // save処理
  if(saveFlag){
    const elapsedSeconds = hour()*3600 + minute()*60 + second();
    const title = "tessSky_" + elapsedSeconds;
    save(title + ".png");
    saveFlag = false;
  }
  // copy云々の処理は不要になりました。
  // これからdat.GUIを使う場合、このように、gui操作時に
  // マウスダウン処理をさせないやり方が求められる場合も
  // 多いでしょうから、今のうちに慣れておきましょう。
}

// --------------------------------------------------------------- //
// infomation.

function prepareForInfoLayer(){
  prepareForExplainTexts();
  prepareForGuideText();
  prepareForFlower();
}

function prepareForExplainTexts(){
  infoLayer.setLayer(1)
           .draw("fill", [0])
           .draw("noStroke")
           .draw("textSize", [24])
           .draw("textAlign", [CENTER, CENTER])
           .draw("text", ["drawing: mouseLeftDown", width*0.5,height*0.45])
           .draw("text", ["create: mouseRightDown", width*0.5,height*0.45+30]);
}

// ガイドテキスト. ちょっと準備～
function prepareForGuideText(){
  infoLayer.setLayer(2)
           .draw("noFill")
           .draw("stroke", [0, 0, 0, 128])
           .draw("strokeWeight", [2]);
}

function prepareForFlower(){
  infoLayer.setLayer(3)
           .draw("noFill")
           .draw("stroke", [0, 0, 0, 128])
           .draw("strokeWeight", [2]);
}

function drawGuideText(){
  // 若干修正。これで合ってるはずです。
  // 中心付近でないとぴったり行かないのは透視だからです。
  const currentFont = getCurrentFont();
  const {textContent:_txt, textSize:_size} = config;
  const bounds = currentFont.textBounds(_txt, 0, 0, _size);
  const diffX = -bounds.x - bounds.w * 0.5;
  const diffY = -bounds.y - bounds.h * 0.5;
  infoLayer.setLayer(2)
           .draw("textFont", [currentFont])
           .draw("textSize", [_size])
           .draw("text", [_txt, mouseX + diffX, mouseY + diffY]);
}

function drawFlower(){
  infoLayer.setLayer(3);
  const {flowerM:m, flowerN:n, flowerR:R, flowerRatio:ratio} = config;
  infoLayer.draw("translate", [mouseX, mouseY]).draw("beginShape");
  const detail = FLOWER_DETAIL;
  for(let i = -1; i <= detail+1; i++){
    let index = i;
    if(i<0){index++}else if(i>detail){index--}
    const t = TAU * index / detail;
    const x = R * ((1-ratio)*cos(m*t) - ratio*sin(n*t));
    const y = R * ((1-ratio)*sin(m*t) - ratio*cos(n*t));
    infoLayer.draw("curveVertex", [x, y]);
  }
  infoLayer.draw("endShape").draw("resetMatrix");
}

// --------------------------------------------------------------- //
// texture float usability check.
// RenderNodeの処理にした方がいいかもです

// texture floatが使えるかどうかチェック
function textureFloatCheck(){
  let ext;
  ext = gl.getExtension('OES_texture_float') || this._renderer.getExtension('OES_texture_half_float');
  if(ext == null){
    alert('float texture not supported');
    return;
  }
}

// Uint32Arrayが使えるかどうかチェック
function Uint32ArrayCheck(){
  if (!gl.getExtension('OES_element_index_uint')) {
    throw new Error('Unable to render a 3d model with > 65535 triangles. Your web browser does not support the WebGL Extension OES_element_index_uint.');
  }
}

// --------------------------------------------------------------- //
// global functions.

// framebuffer.
// framebufferを生成するための関数
// attribute関連はstaticメソッドに移しました。
// RenderNodeの処理にする・・？

// フレームバッファをオブジェクトとして生成する関数
function create_framebuffer(w, h, format){
  // フォーマットチェック
  let textureFormat = null;
  if(!format){
    textureFormat = gl.UNSIGNED_BYTE;
  }else{
    textureFormat = format;
  }

  // フレームバッファの生成
  let frameBuffer = gl.createFramebuffer();

  // フレームバッファをWebGLにバインド
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

  // 深度バッファ用レンダーバッファの生成とバインド
  let depthRenderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);

  // レンダーバッファを深度バッファとして設定
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);

  // フレームバッファにレンダーバッファを関連付ける
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

  // フレームバッファ用テクスチャの生成
  let fTexture = gl.createTexture();

  // フレームバッファ用のテクスチャをバインド
  gl.bindTexture(gl.TEXTURE_2D, fTexture);

  // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, textureFormat, null);

  // テクスチャパラメータ
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // フレームバッファにテクスチャを関連付ける
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

  // 各種オブジェクトのバインドを解除
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // オブジェクトを返して終了
  return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
}

// vboの作成
function create_vbo(data){
  // バッファオブジェクトの生成
  let vbo = gl.createBuffer();

  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  // バッファにデータをセット
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // 生成したVBOを返して終了
  return vbo;
}

// attributeの登録
function set_attribute(attributes){
  // 引数として受け取った配列を処理する
  for(let name of Object.keys(attributes)){
    const attr = attributes[name];
    // バッファをバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, attr.vbo);

    // attributeLocationを有効にする
    gl.enableVertexAttribArray(attr.location);

    // attributeLocationを通知し登録する
    gl.vertexAttribPointer(attr.location, attr.stride, gl.FLOAT, false, 0, 0);
  }
}

// iboの作成
function create_ibo(data, type){
  // type:Uint16ArrayまたはUint32Array.
  // バッファオブジェクトの生成
  let ibo = gl.createBuffer();

  // バッファをバインドする
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

  // バッファにデータをセット
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new (type)(data), gl.STATIC_DRAW);

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // 生成したIBOを返して終了
  return ibo;
}

// --------------------------------------------------------------- //
// utility.

function _RGB(r, g, b){
  if(arguments.length === 1){
    g = r;
    b = r;
  }
  return {r:r, g:g, b:b};
}

function _HSV(h, s, v){
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

function getCurrentFont(){
  return fonts[config.fontType];
}

// --------------------------------------------------------------- //
// UnionFind.

// 0,1,2,...,n-1をqueryでまとめる
// いくつの塊になったのかとそのレベルを返す感じ（lvで参照できる）
function getUnionFind(n, query){
  let parent = [];
  let rank = [];
  for(let i = 0; i < n; i++){
    parent.push(i);
    rank.push(0);
  }
  function Find(a){
    if(parent[a] == a){
      return a;
    }else{
      parent[a] = Find(parent[a]);
      return parent[a];
    }
  }
  function Union(a, b){
    let aRoot = Find(a);
    let bRoot = Find(b);
    if(rank[aRoot] > rank[bRoot]){
      parent[bRoot] = aRoot;
    }else if(rank[bRoot] > rank[aRoot]){
      parent[aRoot] = bRoot;
    }else if(aRoot != bRoot){
      parent[bRoot] = aRoot;
      rank[aRoot] = rank[aRoot] + 1;
    }
  }
  for(let i = 0; i < 2; i++){
    for(let q of query){
      Union(q[0], q[1]);
    }
  }
  let uf = [];
  for(let i = 0; i < n; i++){
    uf.push({id:i, pt:parent[i]});
  }
  uf.sort((x, y) => {
    if(x.pt < y.pt){ return -1; }
    if(x.pt > y.pt){ return 1; }
    return 0;
  });
  uf[0].lv = 0;
  let count = 1;
  for(let i = 1; i < n; i++){
    if(uf[i].pt == uf[i-1].pt){
      uf[i].lv = uf[i-1].lv;
    }else{
      uf[i].lv = uf[i-1].lv + 1;
      count++;
    }
  }
  uf.sort((x, y) => {
    if(x.id < y.id){ return -1; }
    if(x.id > y.id){ return 1; }
    return 0;
  });
  return {uf:uf, count:count}; // countは集合の個数
}

// --------------------------------------------------------------- //
// RenderSystem class.
// shaderとprogramとtopologyのsetとあとテクスチャのロケーション
// その組です
// topologyはattribute群ですね
// たとえば立方体やトーラスを登録するわけ（もちろん板ポリも）

class RenderSystem{
  constructor(name, _shader){
    this.name = name;
    this.shader = _shader;
    shader(_shader);
    this.program = _shader._glProgram;
    this.topologies = {};
    this.uniformLocations = {};
  }
  getName(){
    return this.name;
  }
  registTopology(topologyName){
    if(this.topologies[topologyName] !== undefined){ return; }
    this.topologies[topologyName] = new Topology(topologyName);
  }
  getProgram(){
    return this.program;
  }
  getShader(){
    return this.shader;
  }
  getTopology(topologyName){
    return this.topologies[topologyName];
  }
  registUniformLocation(uniformName){
    if(this.uniformLocations[uniformName] !== undefined){ return; }
    this.uniformLocations[uniformName] = gl.getUniformLocation(this.program, uniformName);
  }
  setTexture(uniformName, _texture, locationID){
    gl.activeTexture(gl.TEXTURE0 + locationID);
    gl.bindTexture(gl.TEXTURE_2D, _texture);
    gl.uniform1i(this.uniformLocations[uniformName], locationID);
  }
}

// --------------------------------------------------------------- //
// RenderNode class.
// RenderSystemを登録して名前で切り替える感じ
// こっちで統一しよう。で、トポロジー。
// 一つのプログラムに複数のトポロジーを登録できる
// そして同じプログラムを使い回すことができる
// 立方体やトーラスを切り替えて描画したりできるというわけ

class RenderNode{
  constructor(){
    this.renderSystems = {};
    this.currentRenderSystem = undefined;
    this.currentShader = undefined;
    this.currentTopology = undefined;
    this.useTextureFlag = false;
    this.tfMatrix = new p5.Matrix(); // デフォルト4x4行列
    // uMVをここにコピーして使い回す感じ
  }
  registRenderSystem(renderSystemName, _shader){
    if(this.renderSystems[renderSystemName] !== undefined){ return; }
    this.renderSystems[renderSystemName] = new RenderSystem(renderSystemName, _shader);
  }
  use(renderSystemName, topologyName){
    // まとめてやれた方がいい場合もあるので
    if(this.renderSystems[renderSystemName] == undefined){ return; }
    this.useRenderSystem(renderSystemName);
    this.registTopology(topologyName); // 登録済みなら何もしない
    this.useTopology(topologyName);
    return this;
  }
  useRenderSystem(renderSystemName){
    // 使うプログラムを決める
    this.currentRenderSystem = this.renderSystems[renderSystemName];
    this.currentShader = this.currentRenderSystem.getShader();
    this.currentShader.useProgram();
    return this;
  }
  registTopology(topologyName){
    // currentProgramに登録するので事前にuseが必要ですね
    this.currentRenderSystem.registTopology(topologyName);
  }
  useTopology(topologyName){
    // たとえば複数のトポロジーを使い回す場合ここだけ切り替える感じ
    this.currentTopology = this.currentRenderSystem.getTopology(topologyName);
    return this;
  }
  registAttribute(attributeName, data, stride){
    this.currentTopology.registAttribute(this.currentRenderSystem.getProgram(), attributeName, data, stride);
    return this;
  }
  registAttributes(attrData){
    for(let attrName of Object.keys(attrData)){
      const attr = attrData[attrName];
      this.registAttribute(attrName, attr.data, attr.stride);
    }
    return this;
  }
  setAttribute(){
    // その時のtopologyについて準備する感じ
    this.currentTopology.setAttribute();
    return this;
  }
  registIndexBuffer(data, type){
    // デフォルトはUint16Array. 多い場合はUint32Arrayを指定する。
    if(type === undefined){ type = Uint16Array; }
    this.currentTopology.registIndexBuffer(data, type);
    return this;
  }
  bindIndexBuffer(){
    this.currentTopology.bindIndexBuffer();
    return this;
  }
  registUniformLocation(uniformName){
    this.currentRenderSystem.registUniformLocation(uniformName);
    return this;
  }
  setTexture(uniformName, _texture, locationID){
    this.currentRenderSystem.setTexture(uniformName, _texture, locationID);
    this.useTextureFlag = true; // 1回でも使った場合にtrue
    return this;
  }
  setUniform(uniformName, data){
    this.currentShader.setUniform(uniformName, data);
    return this;
  }
  clear(){
    // 描画の後処理
    // topologyを切り替える場合にも描画後にこれを行なったりする感じ
    // 同じプログラム、トポロジーで点描画や線描画を行う場合などは
    // その限りではない（レアケースだけどね）
    this.currentTopology.clear();
    // textureを使っている場合はbindを解除する
    if(this.useTextureFlag){
      gl.bindTexture(gl.TEXTURE_2D, null);
      this.useTextureFlag = false;
    }
  }
  setMatrixStandard(uMV){
    // uMVをuMVMatrixとして一通り通知する関数
    const sh = this.currentShader;
    sh.setUniform('uProjectionMatrix', _gl.uPMatrix.mat4);
    sh.setUniform('uModelViewMatrix', uMV.mat4);
    sh.setUniform('uViewMatrix', _gl._curCamera.cameraMatrix.mat4);
    _gl.uNMatrix.inverseTranspose(uMV);
    sh.setUniform('uNormalMatrix', _gl.uNMatrix.mat3);
  }
  setMatrix(tf){
    // uMVとuPとuViewとuNormalを登録(uNormalは使われないこともあるけど)
    let uMV = _gl.uMVMatrix.copy();
    if(tf !== undefined){
      this.transform(tf, uMV); // tfは配列。tr, rotX, rotY, rotZ, scale.
      // rotAxisも一応残しといて。
    }
    this.setMatrixStandard(uMV);
    return this;
  }
  transform(tf, uMV){
    // tfのコマンドに従っていろいろ。
    for(let command of tf){
      const name = Object.keys(command)[0];
      const value = command[name];
      switch(name){
        case "tr":
          // 長さ1の配列の場合は同じ値にする感じで
          if(value.length === 1){ value.push(value[0], value[0]); }
          uMV.translate(value);
          break;
        // rotX～rotZはすべてスカラー値
        case "rotX":
          uMV.rotateX(value); break;
        case "rotY":
          uMV.rotateY(value); break;
        case "rotZ":
          uMV.rotateZ(value); break;
        case "rotAxis":
          // 角度と、軸方向からなる長さ4の配列
          uMV.rotate(...value); break;
        case "scale":
          // 長さ1の場合は同じ値にする。
          if(value.length === 1){ value.push(value[0], value[0]); }
          uMV.scale(...value); break;
      }
    }
  }
  setVertexColor(){
    const sh = this.currentShader;
    sh.setUniform('uUseColorFlag', 0);
    return this;
  }
  setMonoColor(col, a = 1){
    const sh = this.currentShader;
    sh.setUniform('uUseColorFlag', 1);
    sh.setUniform('uMonoColor', [col.r, col.g, col.b, a]);
    return this;
  }
  setDirectionalLight(col, x, y, z){
    const sh = this.currentShader;
    sh.setUniform('uUseDirectionalLight', true);
    sh.setUniform('uDirectionalDiffuseColor', [col.r, col.g, col.b]);
    sh.setUniform('uLightingDirection', [x, y, z]);
    return this;
  }
  setAmbientLight(col){
    const sh = this.currentShader;
    sh.setUniform('uAmbientColor', [col.r, col.g, col.b]);
    return this;
  }
  setPointLight(col, x, y, z, att0 = 1, att1 = 0, att2 = 0){
    // att0,att1,att2はattenuation（減衰）
    // たとえば0,0,1だと逆2乗の減衰になるわけ
    const sh = this.currentShader;
    sh.setUniform('uUsePointLight', true);
    sh.setUniform('uPointLightDiffuseColor', [col.r, col.g, col.b]);
    sh.setUniform('uPointLightLocation', [x, y, z]);
    sh.setUniform('uAttenuation', [att0, att1, att2]);
    return this;
  }
  drawArrays(mode, first, count){
    // 引数はドローコール、スタートと終わりなんだけどね。んー。
    // トポロジーがサイズ持ってるからそれ使って描画？
    if(arguments.length == 1){
      first = 0;
      count = this.currentTopology.getAttrSize();
    }
    gl.drawArrays(mode, first, count);
    return this;
  }
  drawElements(mode, count){
    // 大きい場合はgl.UNSIGNED_INTを指定
    const _type = this.currentTopology.getIBOType();
    const type = (_type === Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT);
    // 基本的にサイズをそのまま使うので
    if(count === undefined){ count = this.currentTopology.getIBOSize(); }
    gl.drawElements(mode, count, type, 0);
    return this;
  }
  flush(){
    gl.flush();
    return this;
  }
}

// --------------------------------------------------------------- //
// Topology class.
// topologyのsetを用意して、それで・・・うん。
// 同じ内容でもプログラムが違えば違うトポロジーになるので
// 使い回しはできないですね・・・（ロケーション）

class Topology{
  constructor(name){
    this.name = name;
    this.attributes = {}; // Object.keysでフェッチ。delete a[name]で削除。
    this.attrSize = 0;
    this.ibo = undefined;
    this.iboType = undefined;
    this.iboSize = 0;
  }
  getName(){
    return this.name;
  }
  getAttrSize(){
    return this.attrSize;
  }
  getIBOType(){
    return this.iboType;
  }
  getIBOSize(){
    return this.iboSize;
  }
  registAttribute(program, attributeName, data, stride){
    let attr = {};
    attr.vbo = create_vbo(data);
    attr.location = gl.getAttribLocation(program, attributeName);
    attr.stride = stride;
    this.attrSize = Math.floor(data.length / stride); // attrの個数
    this.attributes[attributeName] = attr;
  }
  setAttribute(){
    set_attribute(this.attributes);
  }
  registIndexBuffer(data, type){
    this.ibo = create_ibo(data, type);
    this.iboType = type;
    this.iboSize = data.length; // iboのサイズ
  }
  bindIndexBuffer(){
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
  }
  clear(){
    // 描画が終わったらbindを解除する
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    if(this.ibo !== undefined){ gl.bindBuffer(gl.ELEMENT_BUFFER, null); }
    return this;
  }
}

// ------------------------------------------------------------ //
// computeNormals
// verticesは3つずつ頂点座標が入ってて
// indicesは3つずつ三角形の頂点のインデックスが入ってるわけね

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
function getNormals(vertices, indices){
  let normals = [];
  for(let i = 0; i < Math.floor(vertices.length / 3); i++){
    normals.push(createVector(0, 0, 0));
  }
  let v0 = createVector();
  let v1 = createVector();
  let v2 = createVector();
  for(let i = 0; i < Math.floor(indices.length / 3); i++){
    const id = [indices[3*i], indices[3*i+1], indices[3*i+2]];
    v0.set(vertices[3*id[0]], vertices[3*id[0]+1], vertices[3*id[0]+2]);
    v1.set(vertices[3*id[1]], vertices[3*id[1]+1], vertices[3*id[1]+2]);
    v2.set(vertices[3*id[2]], vertices[3*id[2]+1], vertices[3*id[2]+2]);
    const w0 = p5.Vector.sub(v1, v0);
    const w1 = p5.Vector.sub(v2, v0);
    const w2 = p5.Vector.sub(v2, v1);
    const u0 = p5.Vector.cross(w0, w1);
    const u1 = p5.Vector.cross(w0, w2);
    const u2 = p5.Vector.cross(w1, w2);
    const m0 = w0.mag();
    const m1 = w1.mag();
    const m2 = w2.mag();
    const sin0 = u0.mag() / (m0 * m1);
    const sin1 = u1.mag() / (m0 * m2);
    const sin2 = u2.mag() / (m1 * m2);
    const angle0 = asin(sin0);
    const angle1 = asin(sin1);
    const angle2 = asin(sin2);
    const n = p5.Vector.normalize(u0);
    normals[id[0]].add(createVector(n.x*angle0, n.y*angle0, n.z*angle0));
    normals[id[1]].add(createVector(n.x*angle1, n.y*angle1, n.z*angle1));
    normals[id[2]].add(createVector(n.x*angle2, n.y*angle2, n.z*angle2));
  }
  let result = [];
  for(let n of normals){
    n.normalize();
    result.push(...n.array());
  }
  return result;
}

// ------------------------------------------------------ //
// BackgroundManager.
// やりかたとしては・・ね、
// まずこれを作って、
// 使い方1:普通に2Dでなんか描いてそれずーっとうしろにおいておく
// これはdrawでいろいろ描いたうえでdisplayしまくりだけ
// 使い方2:2Dで以下略

// 名前を付けました。
// これで複数のbgManagerを併用できる。
// _nodeは一つしかないので複数ほしいときに困るわけです・・
// まあメモリ解放すればいいんだろうけど。

class BackgroundManager{
  constructor(){
    const id = BackgroundManager.id++;
    this.name = "bgManager" + id;
    this.layers = [];
    this.layers.push(createGraphics(width, height));
    this.currentLayerId = 0;
    // シェーダーとか用意して_node.use("bgShader", "bg")とでもして
    // もろもろ用意する感じですかね
    // 余裕があればポストエフェクト（・・・）
    let _shader = this.getBGShader();
    _node.registRenderSystem(this.name, _shader);
    _node.use(this.name, 'plane')
         .registAttribute('aPosition', [-1,1,0,1,1,0,-1,-1,0,1,-1,0], 3)
         .registUniformLocation('uTex');
    this.texture = new p5.Texture(_gl, this.layers[0]);
  }
  getBGShader(){
    // bgShader. 背景を描画する。
    const bgVert=
    "precision mediump float;" +
    "attribute vec3 aPosition;" +
    "void main(){" +
    "  gl_Position = vec4(aPosition, 1.0);" +
    "}";
    const bgFrag=
    "precision mediump float;" +
    "uniform sampler2D uTex;" +
    "uniform vec2 uResolution;" +
    "void main(){" +
    "  vec2 p = gl_FragCoord.xy / uResolution.xy;" +
    "  p.y = 1.0 - p.y;" +
    "  vec4 tex = texture2D(uTex, p);" +
    "  if(tex.a < 0.5){ discard; }" + // 透明度0でdiscardしないとダメ
    "  gl_FragColor = tex;" +
    "}";
    return createShader(bgVert, bgFrag);
  }
  addLayer(){
    this.layers.push(createGraphics(width, height));
    return this;
  }
  removeLayer(id){
    if(id === 0){ return; } // 0番は特別なのでリムーブしないでください
    this.layers.splice(id, 1);
  }
  setLayer(id){
    // selectの方が良くない？
    this.currentLayerId = id;
    return this;
  }
  getLayer(id){
    // 柔軟性大事
    return this.layers[id];
  }
  draw(command, args = []){
    this.layers[this.currentLayerId][command](...args);
    return this;
  }
  display(){
    // 0おいて1おいて・・
    gl.disable(gl.DEPTH_TEST);
    // uMVMatrixをいじる必要はないです
    // 「そういう」行列を渡せばいいだけの話なのでいじらないでくださいね
    // 0番に1,2,3,...を乗せていきます
    for(let i = 1; i < this.layers.length; i++){
      this.layers[0].image(this.layers[i], 0, 0);
    }
    this.texture.update();
    camera(0, 0, height * 0.5 * Math.sqrt(3), 0, 0, 0, 0, 1, 0);
    _node.use(this.name, 'plane')
         .setAttribute()
         .setTexture('uTex', this.texture.glTex, 0) // 0はbg用に予約。
         .setUniform("uResolution", [width, height])
         .drawArrays(gl.TRIANGLE_STRIP)
         .clear(); // clearも忘れずに
    gl.enable(gl.DEPTH_TEST);
  }
}

BackgroundManager.id = 0; // 識別子

// ------------------------------------------------------ //
// tessellation関連
// bgManagerと関連付けないといけないので大変ですね・・・
// まあそれ使えば便利なので何とかしましょう。

// 1がもう不要なので1に全部描く感じで
class Drawer{
  constructor(){
    this.img = new BackgroundManager();
    this.img.addLayer();
    //this.prepareBase();
    this.prepareCVS();
    this.points = [];
    this.contours = [];
    this.active = false;
  }
  getContours(){
    return this.contours;
  }
  reset(){
    // テッセレート終わったら消す
    this.points = [];
    this.contours = [];
    this.img.setLayer(1).draw("clear");
  }
  prepareCVS(){
    this.img.setLayer(1)
            .draw("translate", [width * 0.5, height * 0.5])
            .draw("stroke", [0])
            .draw("strokeWeight", [2]);
  }
  addPoint(){
    const l = this.points.length;
    if(l > 1){
    const lastPoint = this.points[l - 1];
    const nextX = mouseX - width * 0.5;
    const nextY = mouseY - height * 0.5;
    if(mag(lastPoint.x - nextX, lastPoint.y - nextY) < MINIMUM_DISTANCE){ return; }
    }
    this.points.push({x:mouseX - width * 0.5, y:mouseY - height * 0.5});
    if(this.points.length > 1){
      const p = this.points;
      const l = p.length;
      const a = p[l-1];
      const b = p[l-2];
      this.img.setLayer(1)
              .draw("line", [a.x, a.y, b.x, b.y]);
    }
  }
  activate(){
    this.active = true;
  }
  inActivate(){
    this.active = false; // 横着はだめですね。
  }
  isActive(){
    return this.active;
  }
  addContour(){
    const p = this.points;
    const l = p.length;
    if(l > 2){
      this.img.setLayer(1)
              .draw("line", [p[l-1].x, p[l-1].y, p[0].x, p[0].y]);
    }
    let q = [];
    for(let i = 0; i < l; i++){
      q.push(p[i].x, p[i].y, 0);
    }
    this.contours.push(q);
    this.points = [];
  }
  addContours(ctrs){
    // 直接contourたちを追加する感じのやつ
    for(let ctr of ctrs){
      this.contours.push(ctr);
    }
  }
  update(){
    if(this.active && !this.tessFlag && config.mode == MODE_NONE){
      this.addPoint();
    }
  }
  display(){
    this.img.display();
  }
}

function getProperColor(col){
  if(typeof(col) == "object"){
    return {r:col.r, g:col.g, b:col.b};
  }else if(typeof(col) == "string"){
    col = color(col);
    return {r:red(col), g:green(col), b:blue(col)};
  }
  return {r:255, g:255, b:255};
}

class Tessellator{
  constructor(){
    this.tesses = [];
    this.translate = createVector(0, 0, 0);
    this.rotationZ = 0;
    this.rotationX = 0;
    this.sizeScale = 1;
  }
  setTranslate(x, y, z){
    this.translate.set(x, y, z);
  }
  setRotation(rotZ = 0, rotX = 0){
    this.rotationZ = rotZ;
    this.rotationX = rotX;
  }
  setScale(sizeScale){
    this.sizeScale = sizeScale;
  }
  setUpperColor(uColor){
    if(uColor === undefined){
      uColor = {r:0,g:0,b:0};
    }
    this.upperPaintColor = uColor;
  }
  setLowerColor(lColor){
    if(lColor === undefined){
      lColor = {r:1,g:1,b:1};
    }
    this.lowerPaintColor = lColor;
  }
  getPaintColor(){
    return {u:this.upperPaintColor, l:this.lowerPaintColor};
  }
  createTessellation(contours){
    // modeに応じて分岐処理
    const mode = config.drawMode;
    const z = config.boardHeight;
    const b = min(4, z); // 暫定的に

    // splitかどうかで場合分け
    if(config.splitFlag){
      let meshes = getSeparateMeshesFromContours(contours, b, b, z, -z, mode);
      for(let mesh of meshes){
        this.createTess(mesh);
      }
    }else{
      let mesh = getSingleMeshFromContours(contours, b, b, z, -z, mode);
      this.createTess(mesh);
    }
  }
  getVertexColor(x, y, z, bound){
    // 色
    let {r:ur, g:ug, b:ub} = getProperColor(config.mainColor);
    let {r:lr, g:lg, b:lb} = getProperColor(config.subColor);
    ur /= 255; ug /= 255; ub /= 255;
    lr /= 255; lg /= 255; lb /= 255;
    const mode = config.colorVariation;
    let value, _min, _max;
    if(mode == MODE_X){
      value = x; _min = bound.xMin; _max = bound.xMax;
    }
    if(mode == MODE_Y){
      value = y; _min = bound.yMin; _max = bound.yMax;
    }
    if(mode == MODE_Z){
      value = z; _min = bound.zMin; _max = bound.zMax;
    }
    // 方向グラデーションの場合
    if(value != undefined){
      const ratio = (_max - value) / (_max - _min);
      return {r:(1-ratio)*ur + ratio*lr, g:(1-ratio)*ug + ratio*lg, b:(1-ratio)*ub + ratio*lb};
    }
    // ランダムの場合
    const randomRatio = Math.random();
    return {r:(1-randomRatio)*ur + randomRatio*lr, g:(1-randomRatio)*ug + randomRatio*lg, b:(1-randomRatio)*ub + randomRatio*lb};
  }
  createTess(mesh){
    // テッセレーション処理を外注
    if(mesh == undefined){ return; }
    let vertexColors = [];

    // ここで重心を計算
    // 重心だけでなくxとyのMAXを取ってそのあとでgxとgyを引く
    const VN = mesh.v.length / 3; // 頂点の個数です
    let g = createVector(0, 0, 0);
    let bound = {xMin:99999, xMax:-99999, yMin:99999, yMax:-99999, zMin:99999, zMax:-99999};
    for(let i = 0; i < VN; i++){
      g.x += mesh.v[3*i]; g.y += mesh.v[3*i+1]; g.z += mesh.v[3*i+2];
      bound.xMin = min(bound.xMin, mesh.v[3*i]);
      bound.xMax = max(bound.xMax, mesh.v[3*i]);
      bound.yMin = min(bound.yMin, mesh.v[3*i+1]);
      bound.yMax = max(bound.yMax, mesh.v[3*i+1]);
      bound.zMin = min(bound.zMin, mesh.v[3*i+2]);
      bound.zMax = max(bound.zMax, mesh.v[3*i+2]);
    }
    g.x /= VN; g.y /= VN; g.z /= VN; // 重心の座標。
    bound.xMin -= g.x; bound.xMax -= g.x;
    bound.yMin -= g.y; bound.yMax -= g.y;
    bound.zMin -= g.z; bound.zMax -= g.z;

    for(let i = 0; i < VN; i++){
      // 重心の分だけ引く
      mesh.v[3*i] -= g.x;
      mesh.v[3*i+1] -= g.y;
      mesh.v[3*i+2] -= g.z;
      // 色付けは別立ての処理にする
      const col = this.getVertexColor(mesh.v[3*i], mesh.v[3*i+1], mesh.v[3*i+2], bound);
      vertexColors.push(col.r, col.g, col.b, 1);
    }

    const tessName = "tess" + (Tessellator.id++);
    _node.use("light", tessName)
         .registAttributes({
           aPosition:{data:mesh.v, stride:3},
           aVertexColor:{data:vertexColors, stride:4},
           aNormal:{data:mesh.n, stride:3},
           aTexCoord:{data:mesh.uv, stride:2}}) // UVを追加
         .registIndexBuffer(mesh.f, Uint32Array);

    // 0,0はそのうちカメラに基づいて適当に・・あとgもカメラの
    // 注視点補正が入るかもしれない・・できるのかなぁ。
    // 速度と回転
    const {speed:speed, horizontalAngle:phi, verticalAngle:theta} = config;
    let velocity = createVector(speed*cos(phi)*cos(theta), speed*sin(phi)*cos(theta), speed*sin(theta));
    if(config.velocityRandomFlag){ velocity = Tessellator.getRandomVelocity(); }
    let rotation = createVector(config.rotationX, config.rotationY, config.rotationZ);
    if(config.rotationRandomFlag){ rotation = Tessellator.getRandomRotation(); }
    // テクスチャ関連
    const textureId = config.textureType; // いずれは・・パターン増やす。
    const waveFlag = config.waveFlag;
    const textureColor = getProperColor(config.textureColor);
    let p = g.copy(); // 初期位置

    // 初期位置の計算(カメラに合わせる処理)
    let {x:px, y:py, z:pz} = p;
    const t1 = this.rotationZ;
    const t2 = this.rotationX;
    const s = this.sizeScale;
    // スケール、rotX,rotZ,translateという順ですよ～
    px *= s;
    py *= s;
    pz *= s;
    p.y = py * cos(t2) - pz * sin(t2);
    p.z = py * sin(t2) + pz * cos(t2);
    py = p.y;
    p.x = px * cos(t1) - py * sin(t1);
    p.y = px * sin(t1) + py * cos(t1);
    p.add(this.translate);
    this.tesses.push(new Tessa(tessName, p, t1, t2, s, velocity, rotation, textureId, waveFlag, textureColor));
  }
  deleteFirst(){
    // 一番最初に作ったのを消す
    this.tesses.shift(0);
  }
  deleteLast(){
    // 一番最後に作ったのを消す
    this.tesses.pop();
  }
  clear(){
    // 全部消す
    this.tesses = [];
  }
  display(){
    if(this.tesses.length == 0){ return; }
    for(let tess of this.tesses){
      tess.update();
      tess.display();
    }
    _node.clear();
  }
  static getRandomVelocity(){
    const speed = 4 + Math.random() * 4;
    const phi = Math.random() * TAU;
    const theta = Math.random() * PI;
    return createVector(speed * Math.cos(phi) * Math.cos(theta), speed * Math.sin(phi) * Math.cos(theta), speed * Math.sin(theta));
  }
  static getRandomRotation(){
    const rx = (0.02 + Math.random() * 0.03) * (Math.random()<0.5?1:-1);
    const ry = (0.02 + Math.random() * 0.03) * (Math.random()<0.5?1:-1);
    const rz = (0.02 + Math.random() * 0.03) * (Math.random()<0.5?1:-1);
    return createVector(rx, ry, rz);
  }
}

Tessellator.id = 0;

// tessaはdrawerで生成したメッシュの・・
// つまり動かさない場合、そのままなんですよね。修正がなければ。
// 当たり前ですけど。
// で、それを取得するにあたり、取得部分を分離します。

// vertices渡さないで中心座標を渡す。で、重心が原点になるように
// 動かしておく。そのうえで初期位置としてx,y,zを設定する感じですかね。
// 場合によっては速度・・も？

// 渡す引数について・・
// positionとrotationで初期の位相を定義しつつ
// rollingの場合は各方向のrotationSpeed（フラグだけ渡すか）
// velocityもフラグだけ渡してこっちで計算します～
// 0.02～0.05くらいでいいそうです
// moveの場合はそれに加えてvelocityも設定する感じ
// 見る方向によってオフセットが異なるのでそれを考慮して設定しないと
// いけないので大変ですが頑張りましょう。ひぇ・・。

// 違うんですよね。
// デフォルト位置に持ってくるトランスフォームを実行してから
// それに重ねる形で平行移動して回転しないといけないんですよ。
// じゃないと、ちゃんと反映されない・・はず。
// だからtransformでx,y,z,rotX,rotZを定義してそれを実行しつつ、
// 付加的に位置のずれとか回転を記述するようにする。
// そうすればカメラから見た位置でx軸周りに回転とかそういうのも
// 記述できるようになるわけ。
// 20220101. 帰ってからやります・・・・
class Tessa{
  constructor(name, position, rotZ, rotX, sizeScale, velocity, rotation, textureId = 0, waveFlag = true, textureColor = {r:255, g:255, b:255}){
    this.name = name;
    this.id = Tessa.id++;
    this.position = position; // 位置の基準
    this.rotationZ = rotZ; // z回転の基準
    this.rotationX = rotX; // x回転の基準
    this.sizeScale = sizeScale; // 逆順で掛ける
    this.positionDiff = createVector(); // 位置の変化
    this.rotationDiff = createVector(); // 回転XYZ.
    //this.rotationSpeedZ = 0;
    //this.rotationSpeedX = 0;
    //if(rotationFlag){ this.setRotationSpeed(); }
    this.velocity = velocity;
    this.rotation = rotation;
    //this.velocity = createVector(0, 0, 0);
    //if(moveFlag){ this.setVelocity(); }
    this.textureId = textureId;
    this.waveFlag = waveFlag;
    this.textureColor = textureColor;
    this.properFrameCount = 0;
  }
  update(){
    const nextX = this.positionDiff.x + this.velocity.x;
    const nextY = this.positionDiff.y + this.velocity.y;
    const nextZ = this.positionDiff.z + this.velocity.z;

    if(nextX < -width || nextX > width){
      this.velocity.x *= -1;
    }
    if(nextY < -height || nextY > height){
      this.velocity.y *= -1;
    }
    if(nextZ < -height || nextZ > height * 2){
      this.velocity.z *= -1;
    }
    this.positionDiff.add(this.velocity);
    // 回転～
    //this.rotationXDiff += this.rotationSpeedX;
    //this.rotationYDiff += this.rotationSpeedY;
    this.rotationDiff.add(this.rotation);
    this.properFrameCount++;
  }
  display(){
    const {x, y, z} = this.position;
    const {x:dx, y:dy, z:dz} = this.positionDiff;
    const {x:rx, y:ry, z:rz} = this.rotationDiff;
    const waveFactor = 2*(this.waveFlag ? noise(this.id, this.properFrameCount*0.01) : 0.5);
    const {r:tr, g:tg, b:tb} = this.textureColor;
    // 初めの4つのトランスフォームはデフォルトで、そこからの変化として
    // 記述するんだけど、ひとつの行列でいい気もする・・
    _node.useTopology(this.name)
         .setAttribute()
         .setMatrix([{tr:[x, y, z]}, {rotZ:this.rotationZ}, {rotX:this.rotationX}, {scale:[this.sizeScale]}, {scale:[1, 1, waveFactor]}, {tr:[dx, dy, dz]}, {rotX:rx}, {rotY:ry}, {rotZ:rz}])
         .setVertexColor()
         .setUniform("uTextureId", this.textureId) // これでOK
         .setUniform("uTextureColor", [tr/255, tg/255, tb/255])
         .bindIndexBuffer()
         .drawElements(gl.TRIANGLES);
         //.clear(); // clearは最後にやります
  }
}

Tessa.id = 0;

function tessellation(){
  let ctrs = _drawer.getContours();
  if(ctrs.length == 0){ return; }
  let maxLength = -1;
  for(let i = 0; i < ctrs.length; i++){
    maxLength = max(maxLength, ctrs[i].length);
  }
  if(maxLength < 3){
    _drawer.reset();
    return;
  }
  // BOARD, BEVEL, DIMPLE, SEPARATEの4種類
  _tessellator.createTessellation(ctrs);
}

// ------------------------------------------------------------- //
// gui functions.
// 実行した後で_drawer.reset()する必要はありません。
// mousePressed内で処理を実行できないようにしたので。

function guiDeleteFirst(){_tessellator.deleteFirst(); }
function guiDeleteLast(){ _tessellator.deleteLast(); }
function guiClear(){ _tessellator.clear(); _drawer.reset(); }
function guiCreateFigure(){ tessellation(); _drawer.reset(); }
function guiRedraw(){ _drawer.reset(); }
function guiSave(){ saveFlag = true; }

// ------------------------------------------------------------- //
// addDefaultContours.
// textとかね、加える。

// これと_drawer.setLayer(1)へのかきこみというか
// infoLayerの2とか3のペーストを同時に行うわけ
// リリース時に
function addDefaultContours(){
  if(config.mode == MODE_TEXT){
    addTextContours();
  }
  if(config.mode == MODE_FLOWER){
    addFlowerContours();
  }
}

// これでよいはず。もっときれいに書けるんだろうけど。
function pasteDefaultFigure(){
  let layerId = -1;
  if(config.mode == MODE_TEXT){ layerId = 2; }
  if(config.mode == MODE_FLOWER){ layerId = 3; }
  if(layerId < 0){ return; }
  _drawer.img.setLayer(1)
             .draw("image", [infoLayer.getLayer(layerId), -width*0.5, -height*0.5]);
}

// テキストcontoursを追加する感じで
// configのtext関連プロパティを使う
// 普通にやってみるか
function addTextContours(){
  const {textContent:_text, textSize:_size} = config;
  const currentFont = getCurrentFont();
  let result = getContoursFromText(currentFont, _text, _size, 8);
  // オフセットを付与
  const mx = mouseX - width * 0.5;
  const my = mouseY - height * 0.5;
  let ctrs = result.contours;
  shiftContours(ctrs, mx, my);
  _drawer.addContours(ctrs);
}

// flowerのContoursを追加するのです！
function addFlowerContours(){
  const {flowerM:m, flowerN:n, flowerR:R, flowerRatio:ratio} = config;
  const ctrs = getContoursFlower(m, n, R, ratio);
  const mx = mouseX - width * 0.5;
  const my = mouseY - height * 0.5;
  shiftContours(ctrs, mx, my);
  _drawer.addContours(ctrs);
}

// シフトcontours.
function shiftContours(contours, x, y){
  for(let ctr of contours){
    for(let i = 0; i < ctr.length / 3; i++){
      ctr[3*i] += x;
      ctr[3*i+1] += y;
    }
  }
}

// ------------------------------------------------------------- //
// interaction.
// configがいじられた場合、mouseReleaseの場合にconfigが変更
// されていたら_drawerをリセットするといいのかも？

function mousePressed(){
  // config操作時は処理を実行しない
  if(activatedClassName != "p5Canvas"){ return; }

  if(config.camera){ return; } // カメラが機能してるときは何もしない
  if(mouseButton == LEFT){
    _drawer.activate(); // _drawerの状態をactiveにするように仕様変更
    return;
  }
  if(mouseButton == RIGHT){
    // ここはシンプルに作るだけ
    tessellation();
    _drawer.reset();
    return;
  }
}

function mouseReleased(){
  // _drawerがactiveなときのみcontourを追加するように処理変更
  // その後inActivateさせる感じで
  if(!_drawer.isActive()){ return; }
  // ここで分岐処理
  if(config.mode == MODE_NONE){
    _drawer.addContour();
  }else{
    addDefaultContours();
    pasteDefaultFigure();
  }
  _drawer.inActivate();
}

// ------------------------------------------------------------ //
// determinant.
// ベクトル(a,b,c),(d,e,f),(g,h,i)に対し
// 位置ベクトルが作る平行六面体の符号付体積
// これが0の場合三角形はつぶれているという証明にもなる
// 1を使う！
// 三角形が平面上にあるときは暫定的にz座標を1にするとかする

// calcDet(a,b,1,c,d,1,e,f,1)のabsを2で割ると(a,b)(c,d)(e,f)を
// 頂点とする三角形の面積が出る

function calcDet(a,b,c,d,e,f,g,h,i){
  const det = a*(e*i-f*h) + b*(f*g-d*i) + c*(d*h-e*g);
  return det;
}

// ------------------------------------------------------------ //
// calculateTessellation.
// pointsは重複なしでの上面の頂点座標群
// contoursはループの集合ですね、ひとつながりとは限らないので。
// facesは三角形のインデックス列の集合で時計回りにポリゴンですね。
// contourに紐付けることも考えたんですけど、
// まあ、めんどくさいですから・・無しで・・・・・・

// contoursをあれ、する。で、{points, contours, faces}を出力する感じ。

function calculateTessellation(ctrs){
  // step0.triangulateする。
  let tr = _gl._triangulate(ctrs);
  // step1:つぶれた三角形を排除
  for(let i = tr.length - 1; i >= 0; i -= 9){
    const localArea = 0.5*Math.abs(calcDet(tr[i-8],tr[i-7],1,tr[i-5],tr[i-4],1,tr[i-2],tr[i-1],1));
    if(localArea < 0.00001){
      for(let k = 0; k < 9; k++){
        tr.splice(i-k, 1);
      }
    }
  }
  const L1 = tr.length / 3; // 片面の重複込みの頂点数
  // ここでL1が0のときはundefinedを返す感じですかね
  if(L1 == 0){ return undefined; }

  // step2:点オブジェクト生成
  let ps = [];
  for(let i = 0; i < L1; i++){
    ps.push({x:tr[3*i], y:tr[3*i+1], z:i});
  }
  // step3:xとyでソート(xが同じならyの小さい順)
  // おそらくほんとに同じ点のはずなので大丈夫
  ps.sort((p, q) => {
    if(p.x < q.x){
      return -1;
    }
    if(p.x == q.x && p.y < q.y){
      return -1;
    }
    return 0;
  });
  // step4:点の数の配列を用意
  let ps2 = new Array(L1); // ここには重複込みでpointが入る
  // step5:Pointオブジェクトを生成
  let points = [];
  let index = 0;
  points.push({x:ps[0].x, y:ps[0].y, id:index, next:[]});
  index++;
  ps2[ps[0].z] = points[0];
  for(let i = 1; i < L1; i++){
    // ps[i]を取る
    // ps[i-1]と一緒だったらps[i-1].zからps2のを取ってそれを
    // 一緒じゃなかったらindexのPoint作って格納しつつindex++;
    if(ps[i].x == ps[i-1].x && ps[i].y == ps[i-1].y){
      ps2[ps[i].z] = ps2[ps[i-1].z];
    }else{
      const newPoint = {x:ps[i].x, y:ps[i].y, id:index, next:[]};
      ps2[ps[i].z] = newPoint;
      points.push(newPoint);
      index++;
    }
  }
  const L = points.length; // 片面の頂点の個数（重複無し）
  // 三角形の個数はL1/3です。ここでL1/3個の[]を生成します。
  // これらひとつひとつが三角形と対応します。
  const T1 = L1 / 3; // T1は三角形の個数

  // step6:3つの頂点をフェッチしつつ・・idを入れていく。
  // queryでfaceIndexをつないでUnionFindにまとめてもらう。


  let faces = [];
  faces.push(ps2[0].id, ps2[1].id, ps2[2].id);
  // fIdは何番目の三角形の辺として現れたかのコード
  // これが隣接辺で参照されるときに三角形同士が接続を得る
  ps2[0].next.push({id:ps2[2].id, fId:0});
  ps2[1].next.push({id:ps2[0].id, fId:0});
  ps2[2].next.push({id:ps2[1].id, fId:0});

  let query = []; // 統合用クエリ配列

  for(let i = 3; i < L1; i += 3){
    const faceIndex = floor(i/3); // faceIndexはiから計算できます
    // iとi+1とi+2を見る
    faces.push(ps2[i].id, ps2[i+1].id, ps2[i+2].id);
    for(let k = 0; k < 3; k++){
      const from = i+k;
      const to = i+((k+2)%3);
      let pFrom = ps2[from];
      let pTo = ps2[to];
      const target = pFrom.id;
      let isDouble = false;
      for(let m = 0; m < pTo.next.length; m++){
        if(pTo.next[m].id === target){
          const _fId = pTo.next[m].fId;// 逆方向辺の属する三角形のid
          query.push([_fId, faceIndex]); // _fIdとfaceIndexを接続します
          pTo.next.splice(m, 1);
          isDouble = true;
          break;
        }
      }
      // 重複しないならば新規のedgeを追加
      if(!isDouble){
        pFrom.next.push({id:pTo.id, fId:faceIndex});
      }
    }
  }
  const ufResult = getUnionFind(T1, query); // T1は三角形の個数
  const islandCount = ufResult.count; // 島の数
  const uf = ufResult.uf; // uf[fId].lvで属するレベルを確認できる
  // nextを排除するときにそのfIdを常に更新していく感じですね
  // どんな値であってもそれがufに入って・・どれでもいいんだっけ？
  // じゃあ最初に決めてしまえ。

  // step7:contoursの生成
  // nextのところでidを参照するようにする以外特に変更はないです
  let debug = 0;
  let _contours = []; // ここにループを入れていく
  let islandLevels = []; // level配列。k番contourのレベルがkに入ってる.

  while(debug < 999999){
    // nextが存在する点を探す
    let hasNextExists = false;
    let hasNextPoint;
    for(let p of points){
      if(p.next.length > 0){
        hasNextPoint = p;
        hasNextExists = true;
        break;
      }
    }
    // 無ければ終了
    if(!hasNextExists){ break; }
    let cur = hasNextPoint;
    let prev; // prevがある場合にチョイスの仕方を工夫する
    // ループの起点のインデックス
    const startId = hasNextPoint.id;
    let _contour = []; // ここにidを入れていく(頭とおしりは重複させる)
    let islandLevel = -1;
    _contour.push(startId);
    while(debug < 999999){

      let targetId = -1;

      if(cur.next.length == 1 || prev == undefined){
        targetId = 0;
      }else{
        // prevが存在してなおかつnextが2以上の場合
        const dirFromCurToPrev = atan2(prev.y - cur.y, prev.x - cur.x);
        let dirs = [];
        const curV = createVector(cur.x, cur.y);
        for(let i = 0; i < cur.next.length; i++){
          let nextP = createVector(points[cur.next[i].id].x, points[cur.next[i].id].y);
          nextP.sub(curV);
          nextP.rotate(-dirFromCurToPrev);
          let _dir = atan2(nextP.y, nextP.x);
          if(_dir<0){ _dir += TAU; }
          dirs.push(_dir);
        }
        // dirsの中身が最小なところを探す
        let minDir = 99999;
        for(let i = 0; i < dirs.length; i++){
          if(dirs[i] < minDir){
            minDir = dirs[i]; targetId = i;
          }
        }
      }

      const _next = cur.next[targetId];
      const nextId = _next.id;
      islandLevel = uf[_next.fId].lv; // これがレベル

      let q = points[nextId];
      cur.next.splice(targetId, 1); // targetIdを排除
      _contour.push(nextId);
      // qが起点の場合は起点のIndexを格納して抜ける
      if(nextId == startId){
        break;
      }
      // そうでない場合は起点を更新しつつループ
      prev = cur; // 2回目以降のチョイスでprevを適用
      cur = q;
      debug++;
    }
    _contours.push(_contour);
    islandLevels.push(islandLevel);
    debug++;
  }
  // countはレベルの個数でlevelsはk番contourの属するレベルがlevels[k]
  // という意味。すなわちcountの長さの配列に次々とcontourを入れていく
  // その際に末尾除くすべてのidについてpointsを参照して点の座標を
  // あれすることで個別にできるわけです。
  return {points:points, contours:_contours, faces:faces, count:islandCount, levels:islandLevels};
}


// ------------------------------------------------------------ //
// ここで・・・
// たとえばtextからcontoursを取得する関数とか
// バラ曲線のcontoursを取得する関数とかほしいわね

// というわけでsayoさんの3Dtextから拝借～～～
// というか生コードにも出てくるけど。
// https://openprocessing.org/sketch/956215 ですよ～怪物コード
// はい
// textBoundsは(文字、x,y,size)ってやると
// デフォルトにおける左端、上端、横幅、縦幅がx,y,w,hでアクセス可能に
// なります（文字のサイズはsizeです）。
// 次にgetPath(文字、x,y,size).commandsが意味するのは
// xとyを左端上端とした場合のsizeがsizeの文字領域の描画データです
// データに基づいてcontoursを構成するわけ(Mが起点でZが終点みたいな)
// たとえばこれでLEFTのTOPを指定して取得してから200,200ってやると
// 200,200がLEFTでTOPの点配置になるというわけ

// ところでftはp5.Fontのクラスでないといけないので
// だいたいはDLしてセットするのよね

// ------------------------------------------------------------ //
// getContoursFlower.
// https://openprocessing.org/sketch/1419415
// でいろいろ遊べます。参考までに。
function getContoursFlower(m, n, r, ratio){
  // んー・・・
  let result = [];
  const detail = FLOWER_DETAIL;
  for(let i = 0; i < detail; i++){
    const t = TAU * i / detail;
    const x = r * ((1-ratio)*cos(m*t) - ratio*sin(n*t));
    const y = r * ((1-ratio)*sin(m*t) - ratio*cos(n*t));
    result.push(x, y, 0);
  }
  return [result];
}

// ------------------------------------------------------------ //
// getContoursFromText.
// CENTER,CENTERだけで・・いいわけないか。

// たとえばLEFT,TOPってやると0,0がLEFTでTOPになります。
// CENTER,CENTERってやると0,0が中央に来るわけ。

// 今回はCENTER,CENTERで。
function getContoursFromText(ft, txt, size, detail){
  const bounds = ft.textBounds(txt, 0, 0, size);

  let x = -bounds.x - bounds.w * 0.5;
  let y = -bounds.y - bounds.h * 0.5;

  let contours = [];
  let contour = [];
  let currentPos = createVector();
  const data = ft.font.getPath(txt, x, y, size).commands;

  for(let i = 0; i < data.length; i++){
    const cmd = data[i];
    switch(cmd.type){
      case "M":
        contour = [];
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "L":
        if(currentPos.x == cmd.x && currentPos.y == cmd.y) continue; // ここの処理オリジナルでは無いけどなんで用意したのか
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "C":
        for(let k = 0; k < detail; k++){
          contour.push(new p5.Vector(bezierPoint(currentPos.x, cmd.x1, cmd.x2, cmd.x, k / detail), bezierPoint(currentPos.y, cmd.y1, cmd.y2, cmd.y, k / detail)));
        }
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "Q":
        for(let k = 0; k < detail; k++){
          contour.push(new p5.Vector(bezierPoint(currentPos.x, cmd.x1, cmd.x1, cmd.x, k / detail), bezierPoint(currentPos.y, cmd.y1, cmd.y1, cmd.y, k / detail)));
        }
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "Z":
        contour.pop();
        // vec2では困るので配列に変換します
        contours.push(vec2ToArray(contour));
    }
  }
  // contoursの他に横幅と縦幅も追加で。配置するのに使う。
  // contoursは原点中心です。
  return {contours:contours, w:bounds.w, h:bounds.h};
}

// vec2の配列を0挿入で長さ1.5倍の配列に変換する
function vec2ToArray(seq){
  let result = [];
  for(let p of seq){
    result.push(p.x, p.y, 0);
  }
  return result;
}

// ------------------------------------------------------------ //
// utility for create contours.
// contours計算用のutility. 同じ処理が増えてきてうっとうしいので。

// pointsの中身をverticesにこの順序で登録しつつ、z座標はzで、
// uvはあれで、そんな感じで（ざっくり）
function registFaceData(vertices, uvs, z, points){
  for(let p of points){
    vertices.push(p.x, p.y, z);
    uvs.push(p.x/TEXTURE_SIZE, p.y/TEXTURE_SIZE);
  }
}

// firstIndexはfacesの中身を作るのに使う。
// zUpperからzLowerまで走査して三角形の面を作っていく。
// uvsは長さの累計に応じて定義する感じで
// 暫定処理としてでかい方を足していく感じでいきましょう。
// らちが明かないので
// hはy方向のuvの差です
function registBandData(vertices, uvs, faces, h, zUpper, zLower, upperPoints, lowerPoints, firstIndex){
  let totalLength = 0;
  let prevUpperP, prevLowerP;
  let index = firstIndex;
  const startUpperP = upperPoints[0];
  const startLowerP = lowerPoints[0];
  vertices.push(startUpperP.x, startUpperP.y, zUpper);
  vertices.push(startLowerP.x, startLowerP.y, zLower);
  index += 2;
  uvs.push(0, 0, 0, h/TEXTURE_SIZE);
  prevUpperP = startUpperP; prevLowerP = startLowerP;
  for(let i = 1; i < upperPoints.length; i++){
    const nextUpperP = upperPoints[i];
    const nextLowerP = lowerPoints[i];
    vertices.push(nextUpperP.x, nextUpperP.y, zUpper);
    vertices.push(nextLowerP.x, nextLowerP.y, zLower);
    index += 2;
    faces.push(index-4, index-2, index-3, index-3, index-2, index-1);
    // UV計算
    const upperL = mag(nextUpperP.x - prevUpperP.x, nextUpperP.y - prevUpperP.y);
    const lowerL = mag(nextLowerP.x - prevLowerP.x, nextLowerP.y - prevLowerP.y);
    totalLength += max(upperL, lowerL);
    // でかい方を足していく。これで不自然にならずに済むはず。
    uvs.push(totalLength/TEXTURE_SIZE, 0, totalLength/TEXTURE_SIZE, h/TEXTURE_SIZE);
    prevUpperP = nextUpperP; prevLowerP = nextLowerP;
  }
  return index; // 再帰処理
}

// ------------------------------------------------------------ //
// contoursからメッシュを取得する関数作ろうかと思って
// boardMesh
// 要するに板です
// 得られるのはvとfとnです色はvから適当にって感じで
// 厚さだけ指定(厚さの半分！)

// z1が上の高さでz2が下の高さ。z2は0にすることもあるということで。

function getBoardMeshFromContours(contours, z1, z2){
  if(z2 === undefined){ z2 = -z1; }
  let tessData = calculateTessellation(contours);
  if(tessData == undefined){ return undefined; }

  let points = tessData.points;
  let _contours = tessData.contours;
  let faces = tessData.faces;

  let vertices = [];
  let uvs = []; // uvを入れる・・

  registFaceData(vertices, uvs, z1, points);
  registFaceData(vertices, uvs, z2, points);

  // 裏面のindexによる三角形を追加。順序はfacesの逆。
  // indexはLを足す。これで出る。
  const L = points.length;
  const F = faces.length;
  // Fまででいいね。
  for(let i = 0; i < F; i+=3){
    faces.push(L+faces[i], L+faces[i+2], L+faces[i+1]);
  }

  // できたのでそれぞれについて処理
  // 隣接idについて壁を作るだけ
  let len = 2*L;

  // ここを自動化する。
  // まず2*LはstartIndexでこれを始点としつつ、
  // 上側の列と下側の列を使う感じ。頭とおしりは重複。

  // 走査
  for(let _contour of _contours){
    let pointArray = [];
    for(let i = 0; i < _contour.length; i++){
      pointArray.push(points[_contour[i]]);
    }
    len = registBandData(vertices, uvs, faces, abs(z1-z2), z1, z2, pointArray, pointArray, len);
  }
  let vertexNormals = getNormals(vertices, faces);
  return {v:vertices, f:faces, n:vertexNormals, uv:uvs};
}

// getBevelMeshFromContours   // bevelされたメッシュ
// 各ループにおいて頂点を両側に出ている辺の内側方向の法線の平均方向に
// 同じだけずらしてからちょっと持ち上げて
// その間のメッシュを追加する感じですかね
// 上面と下面についてはfacesのデータがあるのでそれを流用する

// できません
// あ、分かった
// まず内側にへこませる
// それでbevel辺をつくってしまう
// あっちと同じやり方で外壁も作っちゃう
// bvで厚み
// bhで上方向に大きくする
// 最後にその内側たちでcontoursを再構成したうえで
// 再び_triangulateすることで上面と下面を作る
// OK!!だそうです。

// z1は上面の高さでz2は下面の高さでbvは内側への変位でbhは面に垂直な
// 方向への変位とする
function getBevelMeshFromContours(contours, bv, bh, z1, z2){
  if(z2 === undefined){ z2 = -z1; }
  let tessData = calculateTessellation(contours);

  let points = tessData.points;
  let _contours = tessData.contours;

  let vertices = [];
  let faces = [];
  let uvs = [];

  // 今回は先に壁を作っちゃいましょう
  let len = 0;

  for(let _contour of _contours){

    let pointArray = [];
    for(let i = 0; i < _contour.length; i++){
      pointArray.push(points[_contour[i]]);
    }
    len = registBandData(vertices, uvs, faces, abs(z1-z2), z1, z2, pointArray, pointArray, len);
  }

  // ベベル面を作りましょう
  let innerPointsArray = [];
  let innerContours = [];
  for(let contour of _contours){
    let innerPoints = [];
    let innerContour = [];
    const l = contour.length;
    for(let i = 0; i < l-1; i++){

      // iとi+1とi-1を見る。-1の場合はl-2で参照する。
      const curP = points[contour[i]];
      const nextP = points[contour[i+1]];
      const prevP = points[contour[(i>0 ? i-1 : l-2)]];
      // prevP→curPとcurP→nextPをそれぞれ反時計回り(x,y→y,-x)して
      // 正規化して足し合わせて正規化して
      // bv進んで上にbh進む感じで
      // 加えてどの点から来たのか覚えておく（idでいい）
      const prevN = createVector(curP.y - prevP.y, -(curP.x - prevP.x)).normalize();
      const nextN = createVector(nextP.y - curP.y, -(nextP.x - curP.x)).normalize();
      const bn = p5.Vector.add(prevN, nextN).normalize().mult(bv);
      innerPoints.push({x:curP.x + bn.x, y:curP.y + bn.y, from:curP});
      innerContour.push(curP.x + bn.x, curP.y + bn.y, 0);
    }
    innerPointsArray.push(innerPoints);
    innerContours.push(innerContour);
  }
  // そうしたうえで、ベベル面についても外壁と同じように、
  // 全く新しい頂点群を作る。情報はfromのcurPにある。xとｙだけでいい。

  for(let innerPoints of innerPointsArray){
    let innPoints = [];
    let fromPoints = [];
    for(let i = 0; i <= innerPoints.length; i++){
      const inn = innerPoints[(i<innerPoints.length ? i : 0)];
      innPoints.push(inn);
      fromPoints.push(inn.from);
    }
    const h = sqrt(bv*bv+bh*bh);
    len = registBandData(vertices, uvs, faces, h, z1+bh, z1, innPoints, fromPoints, len);
    len = registBandData(vertices, uvs, faces, h, z2, z2-bh, fromPoints, innPoints, len);
  }

  // 最後に上面と下面。
  let innerTessData = calculateTessellation(innerContours);
  let pts = innerTessData.points;
  let fs = innerTessData.faces;

  const pl = pts.length;

  registFaceData(vertices, uvs, z1+bh, pts);
  registFaceData(vertices, uvs, z2-bh, pts);

  for(let i = 0; i < fs.length; i += 3){
    faces.push(fs[i]+len, fs[i+1]+len, fs[i+2]+len);
    faces.push(fs[i]+len+pl, fs[i+2]+len+pl, fs[i+1]+len+pl);
  }
  // これですべて、のはず・・
  let vertexNormals = getNormals(vertices, faces);
  return {v:vertices, f:faces, n:vertexNormals, uv:uvs};
}

// まず外壁
// そして底面
// 終わったらへこませて
// b1が厚さ（へこみ具合）でb2がそこの厚さ(z2から引く)です
// へこませてその間のところのメッシュ
// へこんだそれについて内壁
// 最後に内部底面は同じように再テッセレート
// 以上
function getDimpleMeshFromContours(contours, b1, b2, z1, z2){
  if(z2 === undefined){ z2 = -z1; }
  let tessData = calculateTessellation(contours);

  let points = tessData.points;
  let _contours = tessData.contours;
  let _faces = tessData.faces; // えーと・・・？？？
  // あー、そうか、どうするかな。。。
  // ごめん。底面が先だわ。

  let vertices = [];
  let faces = [];
  let uvs = [];

  registFaceData(vertices, uvs, z2, points);
  let len = points.length;

  const F = _faces.length;
  for(let i = 0; i < F; i+=3){
    faces.push(_faces[i], _faces[i+2], _faces[i+1]); // 逆向き
  }

  // 外壁！
  for(let _contour of _contours){

    let pointArray = [];
    for(let i = 0; i < _contour.length; i++){
      pointArray.push(points[_contour[i]]);
    }
    len = registBandData(vertices, uvs, faces, abs(z1-z2), z1, z2, pointArray, pointArray, len);
  }

  // 内部点を作りましょう
  // 厚さb1を考慮します(先ほどのbvに当たる)
  let innerPointsArray = [];
  let innerContours = [];
  for(let contour of _contours){
    let innerPoints = [];
    let innerContour = [];
    const l = contour.length;
    for(let i = 0; i < l-1; i++){

      // iとi+1とi-1を見る。-1の場合はl-2で参照する。
      const curP = points[contour[i]];
      const nextP = points[contour[i+1]];
      const prevP = points[contour[(i>0 ? i-1 : l-2)]];
      // prevP→curPとcurP→nextPをそれぞれ反時計回り(x,y→y,-x)して
      // 正規化して足し合わせて正規化して
      // bv進んで上にbh進む感じで
      // 加えてどの点から来たのか覚えておく（idでいい）
      const prevN = createVector(curP.y - prevP.y, -(curP.x - prevP.x)).normalize();
      const nextN = createVector(nextP.y - curP.y, -(nextP.x - curP.x)).normalize();
      const bn = p5.Vector.add(prevN, nextN).normalize().mult(b1);
      innerPoints.push({x:curP.x + bn.x, y:curP.y + bn.y, from:curP});
      innerContour.push(curP.x + bn.x, curP.y + bn.y, 0);
    }
    innerPointsArray.push(innerPoints);
    innerContours.push(innerContour);
  }

  // 内部点との境界を作りましょう
  // 今回は高くしないのでそこが違いますね
  for(let innerPoints of innerPointsArray){

    let innPoints = [];
    let fromPoints = [];
    // 逆方向
    for(let i = 0; i <= innerPoints.length; i++){
      const inn = innerPoints[(i<innerPoints.length ? i : 0)];
      innPoints.push(inn);
      fromPoints.push(inn.from);
    }
    len = registBandData(vertices, uvs, faces, b1, z1, z1, innPoints, fromPoints, len);
  }
  // 内壁を作ります
  // innerをフェッチしていくのですが走査は逆方向です（注意！）
  for(let innerPoints of innerPointsArray){

    let innPoints = [];
    innPoints.push(innerPoints[0]);
    for(let i = innerPoints.length-1; i >= 0; i--){
      innPoints.push(innerPoints[i]);
    }
    len = registBandData(vertices, uvs, faces, abs(z1-z2-b2), z1, z2+b2, innPoints, innPoints, len);
  }
  // 最後に内部底面。これはあっちと同じね
  let innerTessData = calculateTessellation(innerContours);
  let pts = innerTessData.points;
  let fs = innerTessData.faces;

  const pl = pts.length;
  registFaceData(vertices, uvs, z2+b2, pts);

  for(let i = 0; i < fs.length; i += 3){
    faces.push(fs[i]+len, fs[i+1]+len, fs[i+2]+len);
  }

  let vertexNormals = getNormals(vertices, faces);
  return {v:vertices, f:faces, n:vertexNormals, uv:uvs};
}

function getSingleMeshFromContours(contours, b1, b2, z1, z2, mode = MODE_BOARD){
  if(mode == MODE_BOARD){
    return getBoardMeshFromContours(contours, z1, z2);
  }
  if(mode == MODE_BEVEL){
    return getBevelMeshFromContours(contours, b1, b2, z1, z2);
  }
  if(mode == MODE_DIMPLE){
    return getDimpleMeshFromContours(contours, b1, b2, z1, z2);
  }
  return undefined;
}

// getIslandBoardMeshesFromContours.
// アイランドボードメッシュズ。
// 島ごとにv,f,nを計算し配列を返す。
// 一番最後に持ってきました。
function getSeparateMeshesFromContours(contours, b1, b2, z1, z2, mode = MODE_BOARD){
  if(z2 === undefined){ z2 = -z1; }
  let tessData = calculateTessellation(contours);
  if(tessData == undefined){ return undefined; }

  let ps = tessData.points;
  let _ctrs = tessData.contours;

  const count = tessData.count;
  let islands = [];
  for(let i = 0; i < count; i++){ islands.push([]); }
  let levelMap = tessData.levels;
  for(let k = 0; k < _ctrs.length; k++){
    const lv = levelMap[k];
    const contourIds = _ctrs[k];
    let ctr = [];
    // 頭とおしりが重複なので1つ前まで入れる
    for(let h = 0; h < contourIds.length-1; h++){
      const id = contourIds[h];
      ctr.push(ps[id].x, ps[id].y, 0);
    }
    islands[lv].push(ctr);
  }
  // 各々のislands[k]たちで新しく～～～って感じ
  // ここgetBoardMeshで書き換えられませんか
  // 仕様変更にそういうのがあるので
  let meshes = [];
  for(let lv = 0; lv < count; lv++){
    // ここを変えるんですよね
    meshes.push(getSingleMeshFromContours(islands[lv], b1, b2, z1, z2, mode));
  }
  return meshes;
}

// --------------------------------------------------------------- //
// camera.

function moveCamera(){
  if(mouseIsPressed){
    const dx = mouseX - pmouseX;
    const dy = mouseY - pmouseY;
    if(mouseButton == LEFT){
      posPhi += dx * 0.01;
      posTheta = constrain(posTheta + dy * 0.01, PI*0.001, PI*0.499);
    }

    if(mouseButton == CENTER){
      // 注視点を動かすと同時にカメラも動かす
      // 横移動と縦移動の仕様はこんな感じ
      focusX += -cos(posPhi) * dx - sin(posPhi) * dy;
      focusY += sin(posPhi) * dx - cos(posPhi) * dy;
    }
  }
}
function mouseWheel(){
  if(config.camera){ posR = constrain(posR + event.delta*0.5, 320, 2560); }
}

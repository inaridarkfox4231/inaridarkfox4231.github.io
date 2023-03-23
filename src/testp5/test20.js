/*もういいよ。もういいよp5.jsは。つかれた*/

// --------------------------------------------------------------------------- //
/* 誰にとってもどうでもいい格闘の記録 */
/* こっちがメインコンテンツみたいなもん */

// ごめんなさい
// やっぱ0.3でも問題生じるみたいです
// もうどうしようもないんで
// 0.01にして
// 問題が生じないseedをいくつか選んでそれでやります
// もうどうしようもないんで

// 図形ごとにいい感じのseed探してそれで固定します
// もしくはいくつか選んでそれらからMath.random()使って抽出
// いいんだよどうせ演出なんだから適当で

// 最後に真っ黒に赤い線走らせて全部壊れて青空にGLSL太陽きらきら
// までがワンセット
// よろしく
// 基本的には光って消える
// 最後だけばらばらって落ちる
// いくぜ

// wait animationはまずアウトラインが30フレームで描かれた後で
// 30フレームできらーん
// きらーんは黒から色がついてまた黒みたいな？

// system入れました。つかれたー－

// とりあえずuTexだけ用意するか
// んでoffsetを実装してうまくいくか調べる感じで

// とりあえずsetUVColor決めたらテクスチャ反映されるとこまでやりました
// clearとかは全部描画した後でいいよって話でしたね
// 思い出しましたよ
// というわけで頑張ってvTexCoord計算してください
// そうしたらちゃんとばらばらになるので
// そのうえでですね
// 線引いたところに線を引いて・・分裂・・とかできるわけですね

// とりあえず板をやめます
// 厚さとか今回はいいんで。2次元オンリーなので。
// 次にcontoursの生成方法をいじります。
// 0.001とかもういいんで。
// 上と下で別々のcontourの集合にしてそれぞれ別々として出力すれば
// 同じ座標の頂点でもマージされずに済むのでそれでいきます。
// 書き換えないといけないところが多いけど頑張りましょう！！
// あとcontoursたちはデフォルトで反時計回りにしておいて・・
// とりあえずピカチュウはそうなってる。ハートは知らない。
// 月と星が時計回りだ・・逆にしないと。ハートも時計回りやんけー。
// まあどっちでもいいか。辺を適切に分断できればいい・・いや、待って。
// ああ、大丈夫、だと思う、多分。んー。
// 辺の・・
// 辺は常に平行ではない。平行ではないがゆえに、そのあたりのエラーは
// 起きていない。エラーというのは、
// lowerでの割り算がエラーにならないってこと。
// lowerは0ではなく、その符号で両端がどっち側かみたいなことがわかる。
// 具体的には(a,b)側が正なら・・(c,d)側が正なら・・
// それに基づいて2つの頂点をe側と逆e側に分けると、
// e側の頂点はe側にしか現れず、逆e側の頂点は逆e側にしか現れない（はず！）
// それらについてcontourを分類してそれぞれまとめてってやればいけるはず。

// あとは辺を小さい順に並べて
// んー。。
// e側どっちがどっちなのか？
// たとえばe側の頂点が辺・・辺の向きと整合性を取ればOKだと思う。
// なぜなら今回自己交差が生じないことが前提としてあるので。
// というか辺の進む向きで内側外側が切り替わるので・・んー。うん。
// p0→p1をp0→q0==q1→p1に分けるとき、q0は出る側、q1は入る側です。
// それでいけるはず。

// とりあえず板にしました。板でないとテクスチャ貼り付けるときに面倒。
// これでちゃんと板です。

// まず交点を小さい順に並べる。
// 交点について、contour番号とその中のインデックス情報を持たせる。
// どっちからどっちっていう。で、正側と負側。
// まず
// contourのうち分断が起きないものについては
// どっち側なのかを見てそれに基づいて放り込むだけでいい
// まずpContours=[]とnContours=[]を用意しておく
// 分断が起きないものは頂点どれでも取って>0ならpに<=0ならnに放り込む
// 次に分断が起きるものは
// 分断によりp側とn側のセグメントを用意する
// それらのおしりの番号が偶数なら奇数へ、奇数なら偶数へつなげる
// するとセグメントたちはどれも偶数から偶数か、奇数から奇数になる。
// そのうえでまとめる。いくつかのループになる。完成！

// 考えた。
// p頂点とn頂点を用意
// p頂点の辺を用意
// 問題は新しい頂点の間の有向辺
// これはもともとの辺の向きにおいて「出ている」ならそこに入るし
// 「入ってくる」ならそこから出る、でいいかな・・
// そうして頂点の列とそれらをつなぐ辺インデックスの列を作ってしまい
// 別々にまとめた方が正確だし楽だと思う。
// {x:x座標,y:y座標,posi:true/false}で。
// 交差しない辺はそのままそれぞれぶちこむ
// 交差する辺はまず交点を2重に取ってin/outをtrue/falseで持たせて
// 分断点と両端とをつなぐ辺をまず入れる
// んで分断点、ポジとネガをそれぞれまとめて順序でソートして、
// in/outに従ってその間に辺を張る。それぞれ入れる。
// 具体的にはinのものから、偶数なら奇数へ、奇数なら偶数へ張る。
// ポジ側を見て、inならoutへ、ネガ側を見て、inならoutへ張る。
// これですべて入れ終わった・・はず。
// 入れ終わったらindexを使ってつなげる処理を行なう。OK?

// できたかな・・・・
// じゃあテクスチャ
// テクスチャ手ごわいので次回に回す

// テクスチャ手ごわいのでUV座標でどうにかできないか考え中
// まずデフォルトの状態でUVの値を計算しておく
// 次に分割の際にUVがどんな感じで引き継がれるかを計算
// 今回はもうばっちり分かれるので
// もともとの点との比較はできる・・・はず。
// contourがカギになると思う
// contourにUVの情報を付随させて、あとは丁寧に丁寧に
// 情報をリレーしていけばメッシュまでたどり着ける
// UVさえ同じものが使えるなら危険なoffsetなんかに頼らなくても
// 正確に座標を計算できる
// それでいきます
// ひぇぇ・・・・・・
// contourとは別にUVの配列が必要だわね・・・{u:~~,v:~~}的な？
// 分割ではほとんどの点についてはそのままで
// 新規点はlerp
// 計算は一瞬、苦労は永遠。
// ふぁいと！！！！！！

// step0:contoursでやっていたことを点データでやるようにする。
// 具体的には[[{x:...,y:...},{},...], [{},{},...],...]の形にする。
// _triangulateにぶち込むときだけ変換
// toXY0Arrayを作ってそれで適用可能形式にする
// ゆくゆくはここにUV情報を追加する
// UVはあれ、xとyでminとmaxを取って割合でlerpする
// つまりUとVについてもminとmaxを取りそれでlerpするわけ
// map(x, xMin, xMax, uMin, uMax)でuが出て、
// map(y, yMax, yMin, vMin, vMax)でvが出る。
// 分断については、新しい頂点のUVをlerpで追加する処理が必要
// この中で扱う限りXY0形式である必要は皆無なのでそこも変更が必要。
// 大変だけどお願いします・・・！

// step0通過・・！
// 次に、UVです。
// step1:initialへのUV付与終了。
// step2に進む。

// step3:intersecitonパートでUVのlerpを適用
// UV入りました。画像どうしますか？え？？それを言うの？？
// 何も考えてなかったです。。。。
// 輪郭線先にやる？えーと。60フレームでcontoursそれぞれについて
// しゃしゃっと線を引く。これが難しいの。毎フレームどこまで引くのか
// っていうのを考えるのがすごく大変なのですよ。
// 徐々に、だとつぎはぎになってしまうので毎フレーム全体を途中まで
// 引く感じですね。長さを計算しておいて・・そういうことです。

// きらーん作りました。あとは線。
// 30フレームで線を引くのできました。
// これで準備完了。あとは切断の際に・・
// さきに輪郭を付ける作業をしますか。
// ピカチュウ画像は最終的にはお蔵入りです・・まあ、そうですよね。

// さてと、最後に輪郭線ですね・・・
// 輪郭はUVを使います。というか使わないと無理です。
// 今intersectionsでxy返してるけどこれ使えないので
// UVです。これを使って線を足していきます。

// できました・・・Tessaごとにuvsが出てくるので
// それらをすべて使わないといけなかったですね・・
// これでとりあえず形にはなったわね。

// 全画面化しますね
// squareのところを長方形にしたりいろいろしないといけない
// あとサイズについても

// おわりました。今回は大変でしたね。温泉にでも入って休みましょう。本当に、お疲れさまでした。

// --------------------------------------------------------------- //
// global.

let _gl, gl;

let _node; // これが統括する。

let _system; // system.

const PATTERN_NUM = 10; // パターンのMAX.
const INITIAL_PATTERN_INDEX = 0;

let _font; // font.
let pikachu;
//let pikachuImg;

// states.
const CREATE_FIGURE = 0; // 図形生成モーション
const SLICE_FIGURE = 1;  // 図形切断モーション
const DELETE_FIGURE = 2; // 図形消去モーション

const CREATE_FIGURE_TIME = 30;
const SLICE_COUNT = 32;
const SLICE_TIME = 16; // 半分で線を走らせその直後にスライスして
// 残りの半分で動かしつつ線を消す
const WAIT_FOR_DELETE_TIME = 8; // スライス終了から消去開始までの時間
const DELETE_TIME_MAX = 24; // 消去は左下から右上に向かって1つずつ
// 消していくんですけどその際の消えるまでの時間のMAXのこと
// つまり右上ほど遅いわけ
// んで全部消えたらeventCountが0に戻る感じ。stateもCREATE_FIGUREに戻る。

// --------------------------------------------------------------- //
// shader.

let customLightVert=
"precision mediump float;" +

"attribute vec3 aPosition;" +
"attribute vec4 aVertexColor;" +
"attribute vec3 aNormal;" +
"attribute vec2 aTexCoord;" +

"uniform vec3 uAmbientColor;" +

"uniform mat4 uModelViewMatrix;" +
"uniform mat4 uProjectionMatrix;" +
"uniform mat3 uNormalMatrix;" +

"varying vec4 vVertexColor;" +
"varying vec3 vNormal;" +
"varying vec3 vViewPosition;" +
"varying vec3 vAmbientColor;" +

"varying vec2 vTexCoord;" + // 頑張ってこれを手に入れる

"void main(void){" +
  // 場合によってはaPositionをいじる（頂点位置）
  // 場合によってはaNormalもここで計算するかもしれない
"  vTexCoord = aTexCoord;" +

"  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);" +

  // Pass varyings to fragment shader
"  vViewPosition = viewModelPosition.xyz;" +
"  gl_Position = uProjectionMatrix * viewModelPosition;" +

"  vNormal = uNormalMatrix * aNormal;" +
"  vVertexColor = aVertexColor;" +

"  vAmbientColor = uAmbientColor;" +
"}";

let customLightFrag =
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
"const int USE_UV_COLOR = 2;" + // textureを用いるためのフラグ変数:2
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
"uniform int uUseColorFlag;" + // 0:vertex. 1:mono. 2.texture.

"uniform sampler2D uTex;" +

"varying vec4 vVertexColor;" +
"varying vec3 vNormal;" +
"varying vec3 vViewPosition;" +
"varying vec3 vAmbientColor;" +
"varying vec2 vTexCoord;" +

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
"  if(uUseColorFlag == USE_UV_COLOR){" +
"    vec2 tex = vTexCoord;" +
"    tex.y = 1.0 - tex.y;" +
"    col = texture2D(uTex, tex);" +
"    if(col.a < 0.1){ discard; }" +
"  }" +
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

// --------------------------------------------------------------- //
// preload.
function preload(){
  _font = loadFont("https://inaridarkfox4231.github.io/assets/Mplus1-Regular.ttf");
  pikachu = loadJSON("https://inaridarkfox4231.github.io/jsons/pikachu.json");
}

// --------------------------------------------------------------- //
// setup.

function setup() {
  _gl = createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  gl = _gl.GL; // レンダリングコンテキストの取得

  // カリング間違えてた。難しいね。
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);

  // nodeを用意
  _node = new RenderNode();

  textureFloatCheck();
  Uint32ArrayCheck();

  // 左クリックのメニュー表示禁止
  document.oncontextmenu = (e) => {
    e.preventDefault();
  }

  _system = new System();
  _system.prepareShader();
  _system.prepareBG();
  _system.initialize();
}

// --------------------------------------------------------------- //
// main loop.

function draw(){
  _system.update();
  _system.display();
  _system.shift();
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
  setUVColor(){
    const sh = this.currentShader;
    sh.setUniform("uUseColorFlag", 2);
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
// intersections.

// ポジ辺ネガ辺は成分で分かるので
// すべての辺をfrom,to,dirtyFlagで入れてしまい
// まとめて巡回置換分割して
// 各サイクルをネガポジ見て分類すればいい
// dirtyFlagはサイクル分割で走査に使う

// ネガポジチェック(falseの場合は分割しない)
// ここでcontoursが新形式なのでこっちも適用させる
function negaposiCheck(contours, r, theta){
  let posi_n = 0;
  let nega_n = 0;
  for(let ctr of contours){
    //const n = ctr.length / 3;
    const n = ctr.length;
    for(let i = 0; i < n; i++){
      const a = ctr[i].x;
      const b = ctr[i].y;
      if(a*cos(theta) + b*sin(theta) - r > 0){
        posi_n++;
      }else{
        nega_n++;
      }
      if(posi_n > 0 && nega_n > 0){ return true; }
    }
  }
  return false;
}

// こっちも！
// uv実装しました。中間点のuvを計算します。
// 単純にlerpでいいですね。
function getContoursPair(contours, r, theta){
  let points = [];
  let edges = [];
  let posiIntersections = []; // ソートする
  let negaIntersections = []; // ソートする
  let index = 0;

  for(let ctr of contours){
    //const n = ctr.length / 3;
    const n = ctr.length;
    const initialIndex = index;
    for(let i = 0; i < n; i++){
      const a = ctr[i].x;
      const b = ctr[i].y;
      const _u = ctr[i].u;
      const _v = ctr[i].v;
      if(a*cos(theta) + b*sin(theta) - r > 0){
        points.push({i:index, x:a, y:b, u:_u, v:_v, posi:true});
      }else{
        points.push({i:index, x:a, y:b, u:_u, v:_v, posi:false});
      }
      index++;
    }
    for(let i = 0; i < n; i++){
      const i0 = initialIndex + i;
      const i1 = initialIndex + (i+1)%n;
      // ポジ辺
      if(points[i0].posi && points[i1].posi){
        edges.push({from:i0, to:i1, dirtyFlag:false});
      }
      // ネガ辺
      if(!points[i0].posi && !points[i1].posi){
        edges.push({from:i0, to:i1, dirtyFlag:false});
      }
      // ポジからネガへ, もしくはネガからポジへ。
      if(points[i0].posi != points[i1].posi){
        const a = points[i0].x;
        const b = points[i0].y;
        const c = points[i1].x;
        const d = points[i1].y;
        const u0 = points[i0].u;
        const v0 = points[i0].v;
        const u1 = points[i1].u;
        const v1 = points[i1].v;
        const upper = a * cos(theta) + b * sin(theta) - r;
        const lower = (a-c) * cos(theta) + (b-d) * sin(theta);
        const t = upper/lower;
        const xmid = (1-t) * a + t * c;
        const ymid = (1-t) * b + t * d;
        const umid = (1-t) * u0 + t * u1;
        const vmid = (1-t) * v0 + t * v1;
        // ソート用のキー
        const value = xmid * sin(theta) - ymid * cos(theta);
        if(points[i0].posi){
          // ポジからmid,midからネガ。で、inはtrueでfalse.
          const p0 = {i:index, x:xmid, y:ymid, u:umid, v:vmid, posi:true, in:true, value:value};
          const n0 = {i:index+1, x:xmid, y:ymid, u:umid, v:vmid, posi:false, in:false, value:value};
          points.push(p0, n0);
          posiIntersections.push(p0);
          negaIntersections.push(n0);
          edges.push({from:i0, to:index, dirtyFlag:false});
          edges.push({from:index+1, to:i1, dirtyFlag:false});
          index += 2;
        }else{
          // ネガからポジ
          const n1 = {i:index, x:xmid, y:ymid, u:umid, v:vmid, posi:false, in:true, value:value};
          const p1 = {i:index+1, x:xmid, y:ymid, u:umid, v:vmid, posi:true, in:false, value:value};
          points.push(n1, p1);
          negaIntersections.push(n1);
          posiIntersections.push(p1);
          edges.push({from:i0, to:index, dirtyFlag:false});
          edges.push({from:index+1, to:i1, dirtyFlag:false});
          index += 2;
        }
      }
    }
  }
  // 下準備完了。
  const sortFunction = (p, q) => {
    if(p.value < q.value){ return -1; }
    if(p.value > q.value){ return 1; }
    return 0;
  }
  posiIntersections.sort(sortFunction);
  negaIntersections.sort(sortFunction);

  // ここで、このタイミングで・・
  // つまりですね
  // 2*iと2*i+1でinの真偽がかぶってたら2*i+1と2*i+2をスワップ、
  // っていうのを最初から最後まで通してやる。
  // それでいけるはずです。
  // できました・・・・・
  for(let i = 0; i < posiIntersections.length/2 - 1; i++){
    let p0 = posiIntersections[2*i];
    let p1 = posiIntersections[2*i+1];
    if(p0.in == p1.in){
      let p2 = posiIntersections[2*i+2];
      posiIntersections[2*i+2] = {i:p1.i, x:p1.x, y:p1.y, u:p1.u, v:p1.v, posi:p1.posi, in:p1.in};
      posiIntersections[2*i+1] = {i:p2.i, x:p2.x, y:p2.y, u:p2.u, v:p2.v, posi:p2.posi, in:p2.in};
    }
  }
  for(let i = 0; i < negaIntersections.length/2 - 1; i++){
    let n0 = negaIntersections[2*i];
    let n1 = negaIntersections[2*i+1];
    if(n0.in == n1.in){
      let n2 = negaIntersections[2*i+2];
      negaIntersections[2*i+2] = {i:n1.i, x:n1.x, y:n1.y, u:n1.u, v:n1.v, posi:n1.posi, in:n1.in};
      negaIntersections[2*i+1] = {i:n2.i, x:n2.x, y:n2.y, u:n2.u, v:n2.v, posi:n2.posi, in:n2.in};
    }
  }
  // どういうことかというと、
  // クリティカルケースですね、その場合にvalueによるソートが通用しない
  // 場合が出てくるのですよ。
  // それを解消するために、隣接でinがかぶっちゃってるところを
  // ときほぐしたわけです。

  // inで偶数なら奇数へ、inで奇数なら偶数へ引く。
  for(let i = 0; i < posiIntersections.length/2; i++){
    const p0 = posiIntersections[2*i];
    const p1 = posiIntersections[2*i+1];
    if(p0.in){ edges.push({from:p0.i, to:p1.i, dirtyFlag:false}); }
    else if(p1.in){ edges.push({from:p1.i, to:p0.i, dirtyFlag:false}); }
  }
  for(let i = 0; i < negaIntersections.length/2; i++){
    const n0 = negaIntersections[2*i];
    const n1 = negaIntersections[2*i+1];
    if(n0.in){ edges.push({from:n0.i, to:n1.i, dirtyFlag:false}); }
    else if(n1.in){ edges.push({from:n1.i, to:n0.i, dirtyFlag:false}); }
  }
  // これで辺はすべてなので、それぞれつなぎ合わせる。
  // さすがにこれはメソッドにしましょうね・・・
  // edgesにはすべてのインデックスが入っているはず
  // つまりL=edges.lengthとして0,1,2,...,L-1の置換になってるはず
  const cycles = createCycles(edges);
  let posiContours = [];
  let negaContours = [];
  for(let cycle of cycles){
    let c = [];
    let posiFlag = true;
    for(let i = 0; i < cycle.length; i++){
      const index = cycle[i];
      const p = points[index];
      posiFlag = p.posi;
      c.push({x:p.x, y:p.y, u:p.u, v:p.v}); // UV追加
    }
    if(posiFlag){
      posiContours.push(c);
    }else{
      negaContours.push(c);
    }
  }

  // intersectionのuvを使って線を引くための準備
  let intersectionUVs = [];
  for(let i = 0; i < posiIntersections.length; i++){
    const p = posiIntersections[i];
    intersectionUVs.push({u:p.u, v:p.v});
  }

  return {posi:posiContours, nega:negaContours, intersectionUVs:intersectionUVs}; // おつかれさま！
}

// 巡回置換分解。
// edgesは0,1,2,...,L-1をfromとしそのシャッフルをtoとし
// dirtyFlagというbool値がすべてfalseになっていることが前提
function createCycles(edges){
  // edgesに入っている2つの数の組たちから
  // 頭とおしりでつながる数の列の組(cycle)を作って出力
  // そのあと点データに変換するのはあとでやる。0挿入忘れずに。
  const L = edges.length;
  // fromには0,1,2,...,L-1が現れているはずなのでsortする
  edges.sort((e0, e1) => {
    if(e0.from < e1.from){ return -1; }
    if(e0.from > e1.from){ return 1; }
    return 0;
  });
  // これでたとえばedges[k]のto:mだったら次はedges[m]を見ればいい、
  // みたいになる。現れたedgeのflagをtrueにしていってすべてtrueになったら
  // 終了
  let debug = 4*L; // こんくらいでいいと思う
  let result = [];
  while(debug-->0){
    // まず始点を探す
    let hasStartPoint = false;
    let c = [];
    let currentEdge;
    for(let i = 0; i < L; i++){
      const edge = edges[i];
      if(!edge.dirtyFlag){
        hasStartPoint = true;
        c.push(edge.from);
        edge.dirtyFlag = true;
        currentEdge = edge;
        break;
      }
    }
    if(!hasStartPoint){ break; }
    // edge.fromから始まってサーチしていく
    const startId = c[0];
    while(debug-->0 && (currentEdge.to != startId)){
      c.push(currentEdge.to);
      currentEdge = edges[currentEdge.to];
      currentEdge.dirtyFlag = true;
    }
    result.push(c);
  }
  return result;
}

// ここをcontoursの2つ組にする。最初から別々なら問題ない。

// これの320を使えばいい。要するに手抜きです。

// いずれ長方形に・・

// 長方形・・
// そうね。w,h,r,tを引数として・・原点中心横w縦hの長方形にしますか。
// なのでrのところがw*0.5やh*0.5になる感じで、contoursとして例の4つの点
// 出力は0個か2個の点オブジェクトからなるわけです。

// これのwidth, heightを使う。
// 直線の取り方より必ず2つの点が得られるので、
// バリデーションは必要ないよ。
function getIntersectionsWithRect(w, h, r, theta){
  let points = [];
  points.push({x:w*0.5, y:h*0.5});
  points.push({x:-w*0.5, y:h*0.5});
  points.push({x:-w*0.5, y:-h*0.5});
  points.push({x:w*0.5, y:-h*0.5});
  // 次に
  let result = [];
  for(let i = 0; i < 4; i++){
    const j = (i+1)%4;
    const a = points[i].x;
    const b = points[i].y;
    const c = points[j].x;
    const d = points[j].y;
    const tmp0 = a*cos(theta) + b*sin(theta) - r;
    const tmp1 = c*cos(theta) + d*sin(theta) - r;
    if(tmp0 > 0 && tmp1 <= 0 || tmp0 <= 0 && tmp1 > 0){
      const divider = (a-c) * cos(theta) + (b-d) * sin(theta);
      const t = tmp0/divider;
      const xmid = (1-t) * a + t * c;
      const ymid = (1-t) * b + t * d;
      result.push({x:xmid, y:ymid});
    }
  }
  return result;
}

// ------------------------------------------------------ //
// tessellation関連
// bgManagerと関連付けないといけないので大変ですね・・・
// まあそれ使えば便利なので何とかしましょう。

// さてと
//
class Tessellator{
  constructor(){
    this.tesses = [];
    this.paintColor = _RGB(1.0, 0.0, 0.0); // 上面
    // ピッカーで選べるようにする？
    this.slideSpeedMax = 0.9; // これを最後だけ0にすればいいわけですね
  }
  setSlideSpeedMax(speedMax){
    this.slideSpeedMax = speedMax;
  }
  setInitialTess(contours){
    // registNewTessにmeshDataを渡して結果を受け取る
    // その結果と作るのに用いたcontoursからTessaを作って
    // this.tessesに入れる
    // contoursはあの形式でないとまずいですね・・
    // contoursの各元にはもうUVが付与されているのです
    // meshDataにuvを付与します・・
    const meshData = getPlaneMeshFromContours(contours);
    const result = this.registNewTess(meshData);
    this.tesses = [];
    // 最初のoffsetである0を追加
    this.tesses.push(new Tessa(result.tessName, result.cog, meshData.island, this.paintColor));
  }
  isEmpty(){
    return this.tesses.length == 0;
  }
  setPaintColor(colorObj){
    this.paintColor = colorObj;
  }
  registNewTess(meshData){
    // ここで重心を計算して名前と一緒に返す
    // 色
    let {r:ur, g:ug, b:ub} = this.paintColor;
    let vertexColors = [];
    let cog = createVector(0, 0, 0); // 平均を取る
    const VN = meshData.v.length / 3;
    for(let i = 0; i < VN; i++){
      cog.x += meshData.v[3*i];
      cog.y += meshData.v[3*i+1];
      cog.z += meshData.v[3*i+2];
      const seed = Math.random();
      const pur = (1-seed) * ur + seed; // proper.
      const pug = (1-seed) * ug + seed;
      const pub = (1-seed) * ub + seed;
      vertexColors.push(pur, pug, pub, 1);
    }
    cog.mult(1/VN); // 重心の計算

    const tessName = "tess" + (Tessellator.id++);
    _node.use("customLight", tessName)
         .registAttributes({
           aPosition:{data:meshData.v, stride:3},
           aVertexColor:{data:vertexColors, stride:4},
           aNormal:{data:meshData.n, stride:3},
           aTexCoord:{data:meshData.uv, stride:2}})
         .registIndexBuffer(meshData.f, Uint32Array)
         .registUniformLocation("uTex"); // Texを実装
    return {tessName:tessName, cog:cog};
  }
  getChilds(contours, r, t){
    // ここをそのまま子供生成の関数にしてしまおう。
    let newChilds = [];
    let boardMeshes = getIslandPlaneMeshesFromContours(contours);
    if(boardMeshes === undefined){ return []; }

    for(let boardMesh of boardMeshes){
      if(boardMesh == undefined){ continue; }

      const result = this.registNewTess(boardMesh);
      const {tessName, cog} = result;
      let child = new Tessa(tessName, cog, boardMesh.island, this.paintColor);

      // 重心が線の向こうならt方向、反対ならt+PI方向（逆）
      const flag = (cog.x * cos(t) + cog.y * sin(t) - r > 0);
      const direction = (flag ? t : t + Math.PI);
      // ここでspeedMaxを最後だけ0にする方針でいきましょう。
      child.slide(direction, this.slideSpeedMax);
      newChilds.push(child);
    }
    return newChilds;
  }
  update(){
    // 基本的には全部updateするだけ
    for(let tess of this.tesses){ tess.update(); }
  }
  sliceTesses(r, t){
    // 直線{r,t}でtessたちを分割する関数を分離する。
    // これをSystem側から然るべきタイミングで呼び出す。
    // updateの後に。
    let childs = [];
    let uvs = [];

    for(let i = this.tesses.length-1; i>=0; i--){
      let tess = this.tesses[i];
      let contours = tess.getContours();
      // ネガポジチェック(片側オンリーなら切断しない)
      if(!negaposiCheck(contours, r, t)){ continue; }
      // つまり、ここ↓で2つのcontoursを受け取り・・
      let newContoursPair = getContoursPair(contours, r, t);
      uvs.push(...newContoursPair.intersectionUVs);
      // 別々にTessaの集合を取得してそれぞれchildsに放り込む。
      childs.push(...this.getChilds(newContoursPair.posi, r, t));
      childs.push(...this.getChilds(newContoursPair.nega, r, t));
      this.tesses.splice(i, 1); // 親を排除
    }
    this.tesses.push(...childs);
    // getContoursPairでintersection情報を取得して
    // それを元にSystem側でテクスチャ画像に線を引くと
    // 切り分けたパーツの輪郭線を描画できる（最終形態）

    // こんな感じで交点のuvを取得・・このくらいは、許してほしい。
    // コードが汚くなるのでほんとはあまり良くないのです。
    return uvs;
  }
  activateTesses(){
    // DELETE_FIGUREになってからちょっとしたら
    // これを呼び出してtessたちをactivateする
    for(let tess of this.tesses){ tess.activate(); }
  }
  display(){
    if(this.tesses.length == 0){ return; }
    // 描画と排除
    for(let tess of this.tesses){ tess.display(); }
    for(let i = this.tesses.length-1; i>=0; i--){
      let tess=this.tesses[i];
      if(!tess.isAlive()){
        this.tesses.splice(i, 1); // 画面外に出たら排除
      }
    }
  }
}

Tessellator.id = 0;

// tessaはdrawerで生成したメッシュの・・
// つまり動かさない場合、そのままなんですよね。修正がなければ。
// 当たり前ですけど。
// で、それを取得するにあたり、取得部分を分離します。

// offsetについては
// 最初にcreateVector(0,0,0)を持たせたうえで
// 速度を足すたびに引いていき
// シェーダーにはそれにpositionを足した値を渡して0～640x0～640で
// 計算してUVに変換する
// 引き継がせるときに引き継がせる

// contoursを各々の[x,y,0]のところが{x:~~,y:~~}になるように修正します
// それに応じてあちこち変えないといけません
// ふぁいとー
class Tessa{
  constructor(name, centerOfGravity, contours, bodyColor){
    this.name = name;
    this.position = createVector(0, 0, 0);
    this.centerOfGravity = centerOfGravity;
    this.contours = contours;
    this.velocity = createVector(0, 0, 0);
    this.acceleration = createVector(0, 0, 0);
    this.active = false;
    this.slideCount = 0;
    this.delayCount = 0;
    this.bodyColor = bodyColor; // 落ちるときに色付きにしようかなって思って
  }
  slide(direction, speedMax){
    // direction方向にずらす準備
    // 分裂時に実行する
    // 重心(gx,gy)についてgx*cos(t)+gy*sin(t)-rが正ならcos(t),sin(t)の
    // 方向で負なら-cos(t),-sin(t)の方向
    this.slideCount = Math.floor(SLICE_TIME * 0.65);
    const speed = speedMax * (0.6 + 0.4 * Math.random());
    const accell = speed * 0.1;
    this.velocity.set(speed * cos(direction), speed * sin(direction), 0.0);
    this.acceleration.set(-accell*cos(direction), -accell*sin(direction), 0.0);
  }
  activate(){
    this.active = true;
    // delayCount整数値ですね・・何やってるんだか
    this.delayCount = Math.floor(DELETE_TIME_MAX * Math.random());
    const vx = 4*(Math.random()-0.5);
    const vz = 4*(Math.random()-0.5);
    const vy = -3-4*Math.random();
    this.velocity = createVector(vx, vy, vz);
    this.acceleration = createVector(0, 0.5, 0);
  }
  isAlive(){
    if(!this.active){ return true; }
    if(this.centerOfGravity.y + this.position.y < height){ return true; }
    return false;
  }
  getName(){
    return this.name;
  }
  getContours(){
    return this.contours;
  }
  contoursUpdate(){
    // スライド終了時にcontoursの情報を更新。positionの分だけ動かす。
    // ctrはもう{x,y}の列であることが想定されているので
    // そのように書き換えます
    for(let ctr of this.contours){
      for(let i = 0; i < ctr.length; i++){
        ctr[i].x += this.position.x;
        ctr[i].y += this.position.y; // まあこんな感じ
      }
    }
  }
  update(){
    if(!this.active){
      if(this.slideCount == 0){ return; }
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.slideCount--;
      if(this.slideCount == 0){ this.contoursUpdate(); }
      return;
    }
    if(this.delayCount > 0){ this.delayCount--; return; }
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
  }
  display(){
    const {x:px, y:py, z:pz} = this.position;
    _node.useTopology(this.name)
         .setAttribute()
         .setMatrix([{tr:[px, py, pz]}]);
    // activeでかつ落ちるときに色を付ける
    if(this.active && this.delayCount == 0){
			_node.setVertexColor();
    }else{
    // 基本はこっち
      _node.setUVColor();
    }
    _node.bindIndexBuffer()
         .drawElements(gl.TRIANGLES);
         //.clear(); // clearは全部描画してから行えばいいよね
  }
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
// convertToXY0Array.

// XY0形式に変換するだけ
function convertToXY0Array(ctrs){
  let result = [];
  for(let ctr of ctrs){
    let part = [];
    for(let i = 0; i < ctr.length; i++){
      part.push(ctr[i].x, ctr[i].y, 0);
    }
    result.push(part);
  }
  return result;
}

// ------------------------------------------------------------ //
// calculateTessellation.
// pointsは重複なしでの上面の頂点座標群
// contoursはループの集合ですね、ひとつながりとは限らないので。
// facesは三角形のインデックス列の集合で時計回りにポリゴンですね。
// contourに紐付けることも考えたんですけど、
// まあ、めんどくさいですから・・無しで・・・・・・

// contoursをあれ、する。で、{points, contours, faces}を出力する感じ。

// contoursの形式が変わりました。UVもいじらないといけなくなる・・
// まあそれは、おいおい。計算はここでやる。ここでしかできない。
// pointsにそれを付与する形になる。
function calculateTessellation(ctrs){
  // step-1.uvのminとmaxを取得する。
  let uMin = 99;
  let uMax = -99;
  let vMin = 99;
  let vMax = -99;
  for(let ctr of ctrs){
    for(let i = 0; i < ctr.length; i++){
      uMin = min(uMin, ctr[i].u);
      uMax = max(uMax, ctr[i].u);
      vMin = min(vMin, ctr[i].v);
      vMax = max(vMax, ctr[i].v);
    }
  }

  // step0.triangulateする。
  // ctrsは{x,y,...}の列なので_triangulateに入れられる形に変換する
  let xy0Array = convertToXY0Array(ctrs);
  let tr = _gl._triangulate(xy0Array);
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
  // ここでxMax,xMin,yMax,yMinを取得
  let ps = [];
  let xMin = 99999;
  let xMax = -99999;
  let yMin = 99999;
  let yMax = -99999;
  for(let i = 0; i < L1; i++){
    ps.push({x:tr[3*i], y:tr[3*i+1], z:i});
    xMin = min(xMin, tr[3*i]);
    xMax = max(xMax, tr[3*i]);
    yMin = min(yMin, tr[3*i+1]);
    yMax = max(yMax, tr[3*i+1]);
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
  // uvを計算するのはここです。ここでmapによりuvを取得します。
  let initialPoint = {x:ps[0].x, y:ps[0].y, id:index, next:[]};
  initialPoint.u = map(ps[0].x, xMin, xMax, uMin, uMax);
  initialPoint.v = map(ps[0].y, yMax, yMin, vMin, vMax);
  points.push(initialPoint);
  index++;
  ps2[ps[0].z] = points[0];
  for(let i = 1; i < L1; i++){
    // ps[i]を取る
    // ps[i-1]と一緒だったらps[i-1].zからps2のを取ってそれを
    // 一緒じゃなかったらindexのPoint作って格納しつつindex++;
    if(ps[i].x == ps[i-1].x && ps[i].y == ps[i-1].y){
      ps2[ps[i].z] = ps2[ps[i-1].z];
    }else{
      let newPoint = {x:ps[i].x, y:ps[i].y, id:index, next:[]};
      // uとvはこれでいいはず
      newPoint.u = map(ps[i].x, xMin, xMax, uMin, uMax);
      newPoint.v = map(ps[i].y, yMax, yMin, vMin, vMax);
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

  while(debug < 99999){
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
    while(debug < 99999){

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

  // pointsにはuvが付与されています・・！
  return {points:points, contours:_contours, faces:faces, count:islandCount, levels:islandLevels};
}

// ------------------------------------------------------------ //
// contoursからメッシュを取得する関数作ろうかと思って

// Planeで。今回表面のみで板にする必要がないので。

// ここでuvを取得しないとやばいですね。今気づいた！
// pointsに入っているので、そこから作れますね。
function getPlaneMeshFromContours(contours){
  let tessData = calculateTessellation(contours);
  if(tessData == undefined){ return undefined; }

  let points = tessData.points;
  let _contours = tessData.contours;
  let faces = tessData.faces;
  let uvs = [];

  let vertices = [];

  for(let p of points){
    vertices.push(p.x, p.y, 0);
    uvs.push(p.u, p.v); // これでOK!
  }
  let vertexNormals = [];
  for(let i = 0; i < vertices.length; i++){
    vertexNormals.push(0, 0, 1);
  }

  let island = [];
  for(let ctr of _contours){
    let part = [];
    for(let i = 0; i < ctr.length - 1; i++){
      const p = points[ctr[i]]; // UV持ってる
      part.push({x:p.x, y:p.y, u:p.u, v:p.v});
    }
    island.push(part);
  }

  return {v:vertices, f:faces, n:vertexNormals, uv:uvs, island:island};
}

// getIslandBoardMeshesFromContours.
// アイランドボードメッシュズ。
// 島ごとにv,f,nを計算し配列を返す。
function getIslandPlaneMeshesFromContours(contours){
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
      ctr.push({x:ps[id].x, y:ps[id].y, u:ps[id].u, v:ps[id].v});
    }
    islands[lv].push(ctr); // つまりislandがそういう形式になるわけ
  }
  // 各々のislands[k]たちで新しく～～～って感じ
  let meshes = [];
  for(let lv = 0; lv < count; lv++){
    // このislandが生成に用いたcontoursの情報です
    // これを分割に使うので保持しておきます
    // Tessa生成時に放り込む感じですかね
    // 分割が終わったらもうこの情報は使わないです落とすだけなので
    const island = islands[lv];
    let _tess = calculateTessellation(island); // で、ここで渡すと。
    if(_tess == undefined){ continue; }
    let points = _tess.points;
    let _contours = _tess.contours;
    let faces = _tess.faces;
    let uvs = [];

    let vertices = [];
    for(let p of points){
      vertices.push(p.x, p.y, 0);
      uvs.push(p.u, p.v);
    }
    let vertexNormals = [];
    for(let i = 0; i < vertices.length; i++){
      vertexNormals.push(0, 0, 1);
    }
    // 直接渡してるけど・・まあ、いいか。
    meshes.push({v:vertices, f:faces, n:vertexNormals, uv:uvs, island:island});
  }
  return meshes;
}
// islandで作るのに使ったcontoursを取得できるように修正
// これでTessa作るときにcontoursを付与できる

// ----------------------------------------------------------------- //
// System.

class System{
  constructor(){
    this.tessellator = new Tessellator();
    this.bg = new BackgroundManager();
    this.eventCount = 0;
    this.state = CREATE_FIGURE;
    this.sliceLineData = new Array(SLICE_COUNT);
    this.sliceLineIndex = 0; // いちいち計算するのめんどくさい
    this.patternId = INITIAL_PATTERN_INDEX;
    this.hueTable = [0.55, 0.45, 0.35, 0.85, 0.15, 0.1, 0.6, 0.13, 0.25, 0.0];
    // 線とエフェクトの色はこれでいきましょう

    // テクスチャ手ごわいねぇ
    // 最終的にはパターン取得時にテクスチャ画像を取得。
    // 個別に用意しないといけないので。
    this.flash = createGraphics(width, height, WEBGL);
    this.flash.pixelDensity(1);
    this.flashShader = this.createFlashShader();
    this.flash.shader(this.flashShader);
    this.img = createGraphics(width, height);
    this.img.colorMode(HSB, 100);
    this.img.strokeWeight(4);
    this.img.translate(width * 0.5, height * 0.5); // 忘れてた・・・
    this.tex = new p5.Texture(_gl, this.img);

    // 線を引くためのデータ. contoursから計算する。
    this.lineLengths = [];
    this.lengthSums = [];
    this.currentHue = 0.0;
    this.initialContours = undefined;

    // 青空と太陽。
    this.bluesky = createGraphics(width, height, WEBGL);
    this.bluesky.pixelDensity(1);
    this.createBlueSky();
  }
  createFlashShader(){
    const vsFlash =
    "precision mediump float;" +
    "attribute vec3 aPosition;" +
    "void main(){" +
    "  gl_Position = vec4(aPosition, 1.0);" +
    "}";
    const fsFlash =
    "precision mediump float;" +
    "uniform vec2 uResolution;" +
    "uniform float uTime;" +
    "uniform float uHue;" +
    // 定数
    "const float TAU = atan(1.0) * 8.0;" +
    // getRGB(HSBをRGBに変換する関数)
    "vec3 getRGB(float h, float s, float b){" +
    "  vec3 c = vec3(h, s, b);" +
    "  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);" +
    "  rgb = rgb * rgb * (3.0 - 2.0 * rgb);" +
    "  return c.z * mix(vec3(1.0), rgb, c.y);" +
    "}" +
    "void main(){" +
    "  vec2 p = gl_FragCoord.xy / uResolution.xy;" +
    "  float t = (uTime - (p.x + p.y) * 0.25)*TAU;" +
    "  float sat = max(0.0, sin(t));" +
    "  float blt = max(0.0, sin(t));" +
    "  vec3 col = getRGB(uHue, sat, blt);" +
    "  gl_FragColor = vec4(col, 1.0);" +
    "}";
    return this.flash.createShader(vsFlash, fsFlash);
  }
  prepareShader(){
    // 今回はcustomLightShaderということでcustomしたlightShaderを
    // 使います。
    let _shader = createShader(customLightVert, customLightFrag);
    _node.registRenderSystem('customLight', _shader);
  }
  prepareBG(){
    // 線を表示する背景の準備
    this.bg.addLayer();
    this.bg.setLayer(1).draw("translate", [width * 0.5,  height * 0.5])
                       .draw("stroke", [255, 0, 0])
                       .draw("strokeWeight", [4]);
  }
  createBlueSky(){
    // 青空と太陽を作る
    const vsSky =
    "precision mediump float;" +
    "attribute vec3 aPosition;" +
    "void main(){" +
    "  gl_Position = vec4(aPosition, 1.0);" +
    "}";

    const fsSky =
    "precision mediump float;" +
    "uniform vec2 uResolution;" +
    // hsb to rgb.
    "vec3 getRGB(float h, float s, float b){" +
    "    vec3 c = vec3(h, s, b);" +
    "    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);" +
    "    rgb = rgb * rgb * (3.0 - 2.0 * rgb);" +
    "    return c.z * mix(vec3(1.0), rgb, c.y);" +
    "}" +
    "void main(){" +
    "  vec2 p = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);" +
    "  vec2 q = p - vec2(-0.6, 0.8);" +
    "  float r = 0.08;" +
    "  vec4 col = vec4(getRGB(0.55, (1.0 - (r * r) / dot(q, q))*(p.y+1.0)*0.75, 1.0), 1.0);" +
    "  gl_FragColor = col;" +
    "}";
    let skyShader = this.bluesky.createShader(vsSky, fsSky);
    this.bluesky.shader(skyShader);
    skyShader.setUniform("uResolution", [width, height]);
    this.bluesky.quad(-1, -1, -1, 1, 1, 1, 1, -1);
    // 準備完了
  }
  initialize(){
    this.eventCount = 0;
    this.state = CREATE_FIGURE;

    this.currentHue = this.hueTable[this.patternId];
    // UVにしちゃった以上ここは使ってないですが・・
    // 最後Tessaに色を付けたいのでちょっと使おうかな。
    this.tessellator.setPaintColor(_HSV(this.currentHue, 1, 1));

    let r = new Array(SLICE_COUNT);
    let theta = new Array(SLICE_COUNT);
    const rMax = min(width, height) * 0.25;
    for(let i = 0; i < SLICE_COUNT; i++){
      r[i] = 0.01 + rMax * Math.random();
      theta[i] = Math.random() * Math.PI * 2.0;
    }

    // 線の両端の座標を出力しま～す
    for(let i = 0; i < SLICE_COUNT; i++){
      //const data = getIntersectionsWithBound(r[i], theta[i]);
      const result = getIntersectionsWithRect(width, height, r[i], theta[i]);
      this.sliceLineData[i] = {r:r[i], t:theta[i], x0:result[0].x, y0:result[0].y, x1:result[1].x, y1:result[1].y};
      // x0,y0,x1,y1,r,tの情報。
    }
    this.sliceLineIndex = 0; // indexをリセット
    // ここあれになってないとまずい？あ、まずいわ・・
    this.initialContours = this.getInitialContours(this.patternId);
    // ここで線描画用のデータを用意する
    this.calcLineData();
    if(this.initialContours == undefined){ return; }

    this.tessellator.setInitialTess(this.initialContours);
    // imgにもstrokeColorを設定！
    this.img.stroke(this.currentHue*100, 100, 100);

    // 最後だけ動かさない
    if(this.patternId == 9){ this.tessellator.setSlideSpeedMax(0); }
    // 崩れた壁の向こうから青空っていう感じで

    //this.patternId = (this.patternId + 1) % PATTERN_NUM; // パターン更新
    this.patternId++;
  }
  calcLineData(){
    // lineLengthsには線の長さの個別データが入る。
    // lengthSumsには各々のctrの長さが入る。
    this.lineLengths = [];
    this.lengthSums = [];
    for(const ctr of this.initialContours){
      let l = [];
      let sum = 0;
      const n = ctr.length;
      for(let i = 0; i < n; i++){
        const j = (i+1)%n;
        const len = mag(ctr[i].x - ctr[j].x, ctr[i].y - ctr[j].y);
        l.push(len);
        sum += len;
      }
      this.lineLengths.push(l);
      this.lengthSums.push(sum);
    }
  }
  getInitialContours(){
    // ゆくゆくはここでパターンごとのテクスチャ画像を受け取れるようにする
    // getInitialDataとでもしてグラフィックを受け取る感じで
    // 受け取ったらthis.imgに貼り付けてあとは適当にこっちで
    // 更新する必要があれば更新する。
    const id = this.patternId;
    const size = min(width, height);
    //
    if(id == 0){ return getRectContours(size * 0.5, size * 0.5); }
    if(id == 1){ return getCircleContours(size * 0.35, floor(size*0.2)); }
    if(id == 2){ return getCircleContours(size * 0.35, 6); } // 正六角形
    if(id == 3){ return getHeartContours(size); }
    if(id == 4){ return getMoonContours(size * 0.4); }
    if(id == 5){ return getStarContours(size * 0.45); }
    if(id == 6){ return getTextContours(size*9/16); }
    if(id == 7){ return getPikachuContours(size); }
    if(id == 8){ return getRingContours(size*0.4, size*0.3, size*0.2, size*0.1, floor(size*0.2)); } // 環
    if(id == 9){ return getRectContours(width, height); } // 画面全体
    return undefined;
  }
  drawSliceLineOnBackground(){
    // 先にclearしよう
    this.bg.setLayer(1).draw("clear");
    if(this.state != SLICE_FIGURE){ return; }
    let prg = (this.eventCount % SLICE_TIME) / SLICE_TIME;
    // prg<0.5: 伸ばす。 prg>=0.5:縮める
    const data = this.sliceLineData[this.sliceLineIndex];
    const a = data.x0;
    const b = data.y0;
    const c = data.x1;
    const d = data.y1;
    if(prg < 0.5){
      prg = prg * 2.0;
      prg = prg * prg * (3 - 2 * prg);
      this.bg.draw("line", [a, b, a + (c-a) * prg, b + (d-b) * prg]);
    }else{
      prg = 1.0 - (prg - 0.5) * 2.0;
      prg = prg * prg * (3 - 2 * prg);
      this.bg.draw("line", [c + (a-c) * prg, d + (b-d) * prg, c, d]);
    }
  }
  getEventCount(){
    return this.eventCount;
  }
  update(){
    this.drawSliceLineOnBackground();
    this.tessellator.update();
    if(this.state == SLICE_FIGURE){
      if(this.eventCount % SLICE_TIME == Math.floor(SLICE_TIME * 0.5)){
        // ここでスライスしてるわけですね
        const data = this.sliceLineData[this.sliceLineIndex];
        const r = data.r;
        const t = data.t;
        const uvs = this.tessellator.sliceTesses(r, t);
        // ここでresultを受け取ってimgを更新して輪郭線を描ける
        // それしか方法がなさそうです
        // tessellatorに描画してもらうわけにもいかないので
        // 0と1,2と3,...って感じで。
        this.addOutlines(uvs);
      }
    }
    if(this.state == DELETE_FIGURE && this.eventCount == WAIT_FOR_DELETE_TIME){
      this.tessellator.activateTesses();
    }
  }
  addOutlines(uvs){
    // 輪郭線をUVを使って描画する
    for(let i = 0; i < uvs.length/2; i++){
      const w0 = uvs[2*i];
      const w1 = uvs[2*i+1];
      const x0 = w0.u * width - width * 0.5;
      const x1 = w1.u * width - width * 0.5;
      const y0 = height * 0.5 - w0.v * height;
      const y1 = height * 0.5 - w1.v * height;
      this.img.line(x0, y0, x1, y1);
    }
    this.tex.update();
  }
  display(){
    this.bg.setLayer(0)
           .draw("background", [0]);
    // pattrenId==10のときここで青空
    if(this.patternId == 10){
      this.bg.draw("image", [this.bluesky, 0, 0]);
    }
    this.bg.display();

    // ここでCREATE_FIGUREの間、線を引く。
    // まあとはいってもimgに引いて更新するんだけどね。
    // contoursの各contourについて長さの1/30～30/30で線を引く感じ
    // 最終的には全部引いて
    // 分割時には切るたびに輪郭線を追加していく感じですね
    // 残りの30フレームできらーん(？)
    if(this.state == CREATE_FIGURE){
      this.drawFlashEffect(); // 後半でフラッシュ
      this.drawInitialOutline(); // 最終的に全部
      this.tex.update();
    }

    // Tessaたちの描画準備
    _node.useRenderSystem('customLight')
         .setDirectionalLight(_RGB(1), 0, 0, -1)
         .setAmbientLight(_RGB(0.25))
         .setTexture("uTex", this.tex.glTex, 0);
    // Tessaたちを描画
    this.tessellator.display();
    // 後始末
    _node.flush().clear();
  }
  drawFlashEffect(){
    // flashEffect.
    this.flashShader.setUniform("uResolution", [width, height]);
    this.flashShader.setUniform("uHue", this.currentHue);
    let prg = max(0.0, (this.eventCount / CREATE_FIGURE_TIME) * 2.0 - 1.0);
    this.flashShader.setUniform("uTime", prg);
    this.flash.quad(-1, -1, -1, 1, 1, 1, 1, -1);
    this.img.image(this.flash, -width * 0.5, -height * 0.5);
    // これでOK.
  }
  drawInitialOutline(){
    // 0～0.5の範囲で線を引く
    let prg = min(1.0, (this.eventCount / CREATE_FIGURE_TIME) * 2.0);
    prg = prg * prg * (3.0 - 2.0 * prg);
    // sum*prgまで線を引く感じ。
    for(let k = 0; k < this.initialContours.length; k++){
      const ctr = this.initialContours[k];
      const n = ctr.length;
      let sum = this.lengthSums[k];
      sum *= prg;
      for(let i = 0; i < n; i++){
        const j = (i+1)%n;
        const len = this.lineLengths[k][i];
        if(sum > len){
          this.img.line(ctr[i].x, ctr[i].y, ctr[j].x, ctr[j].y);
          sum -= len;
        }else{
          const ratio = sum / len;
          const _x = map(ratio, 0, 1, ctr[i].x, ctr[j].x);
          const _y = map(ratio, 0, 1, ctr[i].y, ctr[j].y);
          this.img.line(ctr[i].x, ctr[i].y, _x, _y);
          break;
        }
      }
    }
  }
  shift(){
    // テッセレータがからっぽになったら初期化する感じで
    if(this.tessellator.isEmpty()){
      if(this.patternId == 10){
        // おわりです
        noLoop();
        return;
      }
      this.initialize(); // この中でstateとかeventCount0を初期化
      return;
    }
    // タイムライン管理
    this.eventCount++;
    if(this.state == CREATE_FIGURE && this.eventCount == CREATE_FIGURE_TIME){
      this.state = SLICE_FIGURE;
      this.eventCount = 0;
      return;
    }
    if(this.state == SLICE_FIGURE){
      if(this.eventCount % SLICE_TIME == 0){
        this.sliceLineIndex++;
      }
      if(this.eventCount == SLICE_COUNT * SLICE_TIME){
        this.state = DELETE_FIGURE;
        this.eventCount = 0;
      }
      return;
    }
  }
}

// ------------------------------------------------------------------ //

// 逆にx,y,0みたいな形式を{x:..,y:..}にする関数
function convertToXYobjArray(c){
  let result = [];
  for(let ctr of c){
    let part = [];
    const n = ctr.length / 3;
    for(let i = 0; i < n; i++){
      part.push({x:ctr[3*i], y:ctr[3*i+1]});
    }
    result.push(part);
  }
  return result;
}

// contoursの各成分に全体の座標から計算したUVを付与する
// それで問題ないです
// とりあえずはね
function addUVattribute(contours){
  for(let ctr of contours){
    const n = ctr.length;
    for(let i = 0; i < n; i++){
      let p = ctr[i];
      p.u = (p.x + width * 0.5) / width;
      p.v = (height * 0.5 - p.y) / height; // yは逆にするの注意ね
    }
  }
  // 終わりです！
}

// ------------------------------------------------------------------ //
// contoursの取得関数

function getRectContours(w, h){
  let c = [];
  c.push([{x:w*0.5, y:h*0.5}, {x:-w*0.5, y:h*0.5},
          {x:-w*0.5, y:-h*0.5}, {x:w*0.5, y:-h*0.5}]);
  addUVattribute(c);
  return c;
}

function getCircleContours(r, detail = 100){
  let c = [];
  let c0 = [];
  for(let i = 0; i < detail; i++){
    const t = TAU * i / detail - PI/2;
    c0.push({x:r * cos(t), y:r * sin(t)});
  }
  c.push(c0);
  addUVattribute(c);
  return c;
}

// wolframAlphaよりハート曲線
// source:https://mathworld.wolfram.com/HeartCurve.html
function getHeartContours(_size){
  let c = [];
  let c0 = [];
  const _scale = _size / 640;
  for(let i = 0; i < 200; i++){
    const t = TAU * i / 200;
    const x = _scale * (16 * 16 * pow(sin(t), 3));
    const y = _scale * (-60-16 * (13*cos(t)-5*cos(2*t)-2*cos(3*t)-cos(4*t)));
    c0.push({x:x, y:y});
  }
  c.push(c0);
  addUVattribute(c);
  return c;
}

function getMoonContours(r){
  let c = [];
  let c0 = [];
  const t1 = PI/8;
  const a = 112;
  let t, x, y;
  for(let i = 0; i <= 200; i++){
    t = t1 + (TAU-2*t1) * i/200;
    x = r*cos(t);
    y = r*sin(t);
    c0.push({x:x, y:y});
  }
  const t2 = atan2(r*sin(t1), r*cos(t1)-a);
  const l = mag(r*cos(t1)-a, r*sin(t1));
  for(let i = 0; i <= 100; i++){
    t = TAU - t2 - (TAU-2*t2)*i/100;
    x = a+l*cos(t);
    y = l*sin(t);
    c0.push({x:x, y:y});
  }
  c.push(c0);
  addUVattribute(c);
  return c;
}

function getStarContours(r){
  let c = [];
  let c0 = [];
  for(let i = 0; i < 5; i++){
    const t0 = TAU*i/5-PI/2;
    const t1 = t0+TAU/10;
    const t2 = t1+TAU/10;
    const r1 = r;
    const r2 = r*sin(PI/10)/cos(PI/5);
    c0.push({x:r1*cos(t0), y:r1*sin(t0)}, {x:r2*cos(t1), y:r2*sin(t1)});
  }
  c.push(c0);
  addUVattribute(c);
  return c;
}

function getTextContours(_size){
  const _text = "p5.js";
  let _c = getContoursFromText(_font, _text, _size, 5, CENTER, CENTER);
  let c = convertToXYobjArray(_c);
  addUVattribute(c);
  return c;
}

function getPikachuContours(_size){
  const {data} = pikachu; // ぴか、ぴかちゅ。
  const _scale = _size / 640;
  let _c = [];
  // すべての成分を_scale倍する
  // 0とか含めて普通に倍しちゃっていい
  for(let i = 0; i < data.length; i++){
    data[i] *= _scale;
  }
  _c.push(data);
  let c = convertToXYobjArray(_c);
  addUVattribute(c);
  return c;
}

function getRingContours(r0, r1, r2, r3, detail = 100){
  let c = [];
  let rData = [r0, r1, r2, r3];
  let sgn = 1;
  for(let r of rData){
    let _c = [];
    for(let i = 0; i < detail; i++){
      const t = sgn * TAU * i / detail - PI/2;
      _c.push({x:r * cos(t), y:r * sin(t)});
    }
    c.push(_c);
    sgn *= -1;
  }
  addUVattribute(c);
  return c;
}

// ------------------------------------------------------------ //
// getContoursFromText.
// CENTER,CENTERだけで・・いいわけないか。

// たとえばLEFT,TOPってやると0,0がLEFTでTOPになります。
// CENTER,CENTERってやると0,0が中央に来るわけ。

function getContoursFromText(ft, txt, size, detail, h_align, v_align){
  const bounds = ft.textBounds(txt, 0, 0, size);
  let x, y;
  switch(h_align){
    case LEFT:
      x = -bounds.x; break;
    case CENTER:
      x = -bounds.x - bounds.w * 0.5; break;
    case RIGHT:
      x = -bounds.x - bounds.w; break;
  }
  switch(v_align){
    case TOP:
      y = -bounds.y; break;
    case CENTER:
      y = -bounds.y - bounds.h * 0.5; break;
    case BOTTOM:
      y = -bounds.y - bounds.h; break;
  }
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
  return contours;
}

// vec2の配列を0挿入で長さ1.5倍の配列に変換する
function vec2ToArray(seq){
  let result = [];
  for(let p of seq){
    result.push(p.x, p.y, 0);
  }
  return result;
}

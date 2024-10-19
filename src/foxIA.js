/*
MANUAL
マニュアルを書きます

この度公開することになったので
えーと。
wheelActionでマウス位置を使いたい
ということなので
マウス位置をゲットする関数を導入します
mouse(e){
  return {x:e.clientX - this.rect.left, y:e.clientY - this.rect.top};
}
ホイールイベントとかでマウス位置が欲しい場合に便利かなと。
タッチの場合はpage...
もしかしてマウスの場合もpageの方がいい？？
みたいですね...
pageにしよう。ごめんなさい。
20241013
pageにしたらresizeの問題が再燃した...
というかそれ以前にリサイズの問題はタッチの方でも解決してなかったのでやり直し...
20241013
pageをすべてclientに変更
さらに
windowのscroll時にもupdateCanvasData
さらに
PointerPrototypeのバグを修正（left,topがl,tになってた）

20241014
スクロールに関する位置取得が失敗していたのでpageをすべてclientに変更
PointerPrototypeにparentを追加（親のInteraction）。使うかどうか不明だが。
Interactionのfactory関数が引数としてthisを取れるようにした（factory内部で情報を使えるようにするため）

PointerPrototypeの仕様と継承の仕方、用意すべき関数について
Interactionの仕様と継承の仕方、用意すべき関数について
特にeとかtなどの引数の有無、それらがイベントの場合とpointerの場合が混在していて若干面倒なことになってるのでね。
PointerPrototypeがeを受け取るのはデータ入力のためです
Interactionがeを受け取るのもInteractionサイドのイベントを記述するため
Interactionの関数でタッチポインターを受け取るのはスワイプとピンチインアウトだけです
スワイプは長さ1の時のみ発火します
ピンチインアウトは長さ2以上の時のみ下の2つによって発火します
それ以外はすべてイベント関数です
キーイベントはcodeで名前が取得できそれにより場合分けします
ホイールイベントはホイールする速さにより、少なくともこの機器では100の倍数だったりします
*/

/*
Swipeですが
やはり起点が重要かなと
dxとdyだけだとまずいかなと
AからBに動くとして、今Bにいる、A→Bの速度というか変位を持ってる、その
変位で何かする、そういう感じかなと思うわけ。
PinchInOutにしても...
まあどっちにしろ大差ない？（根拠があればOK）
そのときの重心の座標と
距離の変化だけ使う（delta）
MultiSwipeとRotate追加したので
じきにテストします

今ちょっと見てきた
んだけど
clickって右とセンターは対象外のようね
左クリック
それしか反応できないみたい
です

手っ取り早いのは
デフォルトアクションになんかコンソールほにゃらら用意して
消して
みたいな？
それで色々テストできる...
まあインタラクションなければ何も起きないですから
大丈夫
playGroundを作る
すべてはそこからですね～

起点はprevX,prevYでいいと思う
重心についても同じく
動きがあったら
前の点を使うのだ
そういう感じで。
ただ
movedX,movedYでああいうこと言っちゃったわけで
あれは～～～...
あれだと前の点？が取れないのです。
タッチだから前の点取れるよ

柔軟性を考えれば
単純にswipeの場合はtを渡してxもyもprevXもprevYも使えるようにするといい
で...
重心については重心のx,y,px,pyを渡す...
もう面倒だから
swipe: ポインターのdx,dy,x,y,px,py
pinchInOut: 重心の変化value,x,y,px,py
multiSwipe: 重心の変化vectorのdx,dy,x,y,px,py
rotate: 回転量value,x,y,px,py
でいいじゃん。
rotateのvalueは両者の重心を一致させたうえでの変化ベクトルのモーメント量
でOKです。

回転はもめそうなので後回し
角度でいいと思う
モーメントだと直感に反する動きをしそう
GoogleMapも角度でやってると思う
*/

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
    とにかくマウスがダウンされたらなんか開始する、その処理を記述する
    これをx,yで書かないのは、要するにタッチだとそれがあちこちになるので不整合、
    そこら辺を考慮してる。詳しくやりたいならPointerを継承すべき。
  mouseMoveDefaultAction(dx, dy, x, y):
    e.clientX/Yからキャンバスの位置座標を引いて計算する -> pageじゃないとスクロールに対応できないのでpageに変更
    マウスポインタが存在しなくても実行されるようにする必要があるのでそういう形になる
    なるんだけど
    それだけ用意してもタッチサイドでは何もできないのでう～んって感じではあるわね
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
    とにかくタッチがスタートしたらなんかする、その場合の処理を記述
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
アルファベット：KeyA,KeyB,...,KeyZ.
Kは大文字ですよ！！！！！！
ShiftRight, ShiftLeft.
Enter, CapsLock, Space, ControlLeft, ControlRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight.
Numpad0,Numpad1,Numpad2,...,Numpad9.
NumpadDecimal,NumpadEnter,NumpadAdd.
上の方の数字キー：Digit0,Digit1,Digit2,...,Digit9.
BackSpace,まあ、後は調べてください...
あんま難しいこと考えても仕方ないですね。
*/
/*
もちろん
p5のようにイベントごとにリスナーを用意する道もあるんですけど
あるんですけどね
たとえばmousePressedだけ用意するにしてもタッチにもってなった場合
そっちも用意しないといけないので
いろいろめんどくさいので
やめましょうってことになったわけです。
*/

// windowにした
// pavelさんのコードは全画面前提なので
// 全画面だとどっちでもいいんですけど
// ここをcanvasにしてしまうと画面内でインタラクションが開始された後で画面外に抜けるときに止まってしまうので
// それを回避するための処理です

// いくつか変更
// InteractionとpointerPrototypeにcanvasLeft/Topを設けました
// これがないと全画面でない場合にきちんとキャンバス上の座標を取得できません
// またtouchMovepointerActionのpreventDefaultを切りました
// スマホなどで画面外を操作したときのスクロールができなくなっていたので。
// 最後に、リサイズ時にcanvasLeft/Topが更新されるようにしました。

const foxIA = (function(){
  const fox = {};

  class PointerPrototype{
    constructor(){
      this.id = -1;
      this.parent = null; // 親のInteractionクラス。KAとかいろいろ応用できそう
      this.x = 0;
      this.y = 0;
      this.dx = 0;
      this.dy = 0;
      this.prevX = 0;
      this.prevY = 0;
      //this.canvasLeft = 0;
      //this.canvasTop = 0;
      this.rect = {width:0, height:0, left:0, top:0};
      this.button = -1; // マウス用ボタン記録。-1:タッチですよ！の意味
    }
    mouseInitialize(e, rect, parent = null){
      this.x = e.clientX - rect.left;
      this.y = e.clientY - rect.top;
      this.parent = parent;
      //this.canvasLeft = left;
      //this.canvasTop = top;
      const {width, height, left, top} = rect;
      this.rect = {width, height, left, top};
      this.prevX = this.x;
      this.prevY = this.y;
      this.button = e.button; // 0:left, 1:center, 2:right
    }
    mouseDownAction(e){
    }
    mouseUpdate(e){
      this.prevX = this.x;
      this.prevY = this.y;
      this.dx = (e.clientX - this.rect.left - this.x);
      this.dy = (e.clientY - this.rect.top - this.y);
      this.x = e.clientX - this.rect.left;
      this.y = e.clientY - this.rect.top;
    }
    mouseMoveAction(e){
    }
    mouseUpAction(e){
    }
    touchInitialize(t, rect, parent = null){
      this.id = t.identifier;
      this.x = t.clientX - rect.left; // 要するにmouseX的なやつ
      this.y = t.clientY - rect.top; // 要するにmouseY的なやつ
      this.parent = parent;
      //this.canvasLeft = left;
      //this.canvasTop = top;
      const {width, height, left, top} = rect;
      this.rect = {width, height, left, top};
      this.prevX = this.x;
      this.prevY = this.y;
    }
    updateCanvasData(rect){
      // マウスでもタッチでも実行する
      const prevLeft = this.rect.left;
      const prevTop = this.rect.top;
      //this.canvasLeft = left;
      //this.canvasTop = top;
      const {width, height, left, top} = rect;
      this.rect = {width, height, left, top};
      this.x += prevLeft - left;
      this.y += prevTop - top;
      this.prevX += prevLeft - left;
      this.prevY += prevTop - top;
    }
    touchStartAction(t){
    }
    touchUpdate(t){
      this.prevX = this.x;
      this.prevY = this.y;
      this.dx = (t.clientX - this.rect.left - this.x);
      this.dy = (t.clientY - this.rect.top - this.y);
      this.x = t.clientX - this.rect.left;
      this.y = t.clientY - this.rect.top;
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
  // canvasで初期化できるようにするか～。で、factoryはoptionsに含めてしまおう。
  // 特に指定が無ければ空っぽのoptionsでやればいい。factoryが欲しい、clickやdblclickを有効化したい場合に
  // optionsを書けばいいわね。
  // setFactoryは必要になったら用意しましょ
  // 仕様変更(20240923): factoryがnullを返す場合はpointerを生成しない。かつ、タッチエンド/マウスアップの際に
  // pointersが空の場合は処理を実行しない。これにより、factoryで分岐処理を用意することで、ポインターの生成が実行されないようにできる。
  class Interaction{
    constructor(canvas, options = {}){
      this.pointers = [];
      this.factory = ((t) => new PointerPrototype());
      //this.width = 0;
      //this.height = 0;
      // leftとtopがwindowのサイズ変更に対応するために必要
      // コンストラクタでは出来ませんね。初期化時の処理。
      this.rect = {width:0, height:0, left:0, top:0};
      //this.canvasWidth = 0;
      //this.canvasHeight = 0;
      //this.canvasLeft = 0; // touch用
      //this.canvasTop = 0; // touch用
      this.tapCount = 0; // ダブルタップ判定用
      this.firstTapped = {x:0, y:0};
      // コンストラクタで初期化しましょ
      this.initialize(canvas, options);
    }
    initialize(canvas, options = {}){
      // 念のためpointersを空にする
      this.pointers = [];
      // factoryを定義
      const {factory = ((t) => new PointerPrototype())} = options;
      this.factory = factory;
      // 横幅縦幅を定義
      //this.width = Number((canvas.style.width).split("px")[0]);
      //this.height = Number((canvas.style.height).split("px")[0]);
      // touchの場合はこうしないときちんとキャンバス上の座標が取得できない
      // どうもrectからwidthとheightが出る？じゃあそれでいいですね。pixelDensityによらない、css上の値。
      //const rect = canvas.getBoundingClientRect();
      const {width, height, left, top} = canvas.getBoundingClientRect();
      this.rect = {width, height, left, top};
      //this.canvasWidth = rect.width;
      //this.canvasHeight = rect.height;
      //this.canvasLeft = rect.left;
      //this.canvasTop = rect.top;
      // 右クリック時のメニュー表示を殺す
      // 一応デフォルトtrueのオプションにするか...（あんま意味ないが）
      const {preventOnContextMenu = true} = options;
      if(preventOnContextMenu){
        document.oncontextmenu = (e) => { e.preventDefault(); }
      }
      // touchのデフォルトアクションを殺す
      //canvas.style["touch-action"] = "none";
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
        window.addEventListener('mousemove', this.mouseMoveAction.bind(this), {passive:false});
        window.addEventListener('mouseup', this.mouseUpAction.bind(this), {passive:false});
        // タッチ（ダブルタップは無いので自前で実装）
        canvas.addEventListener('touchstart', this.touchStartAction.bind(this), {passive:false});
        window.addEventListener('touchmove', this.touchMoveAction.bind(this), {passive:false});
        window.addEventListener('touchend', this.touchEndAction.bind(this), {passive:false});
      }
      // ホイールはキャンバス外で実行することはまずないですね...canvasでいいかと。
      if (wheel) { canvas.addEventListener('wheel', this.wheelAction.bind(this), {passive:false}); }

      // リサイズの際にleftとtopが変更されるのでそれに伴ってleftとtopを更新する
      window.addEventListener('resize', (function(){

        //this.updateCanvasData(newRect.left, newRect.top);
        this.updateCanvasData();
      }).bind(this));
      window.addEventListener('scroll', (function(){
        this.updateCanvasData();
      }).bind(this));

      // options. これらは基本パソコン環境前提なので（スマホが関係ないので）、オプションとします。
      const {
        mouseenter = false, mouseleave = false, click = false, dblclick = false,
        keydown = false, keyup = false
      } = options;
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
    updateCanvasData(){
      const newRect = canvas.getBoundingClientRect();
      // 対象のキャンバスを更新
      const {width, height, left, top} = newRect;
      this.rect = {width, height, left, top};
      //this.canvasLeft = left;
      //this.canvasTop = top;
      for(const p of this.pointers){ p.updateCanvasData(newRect); }
    }
    mouseDownAction(e){
      this.mouseDownPointerAction(e);
      this.mouseDownDefaultAction(e);
    }
    mouseDownPointerAction(e){
      const p = this.factory(this);
      if (p === null) return; // factoryがnullを返す場合はpointerを生成しない
      //p.mouseInitialize(e, this.canvasLeft, this.canvasTop);
      p.mouseInitialize(e, this.rect, this);
      p.mouseDownAction(e);
      this.pointers.push(p);
    }
    mouseDownDefaultAction(e){
      // Interactionサイドの実行内容を書く
    }
    mouseMoveAction(e){
      this.mouseMovePointerAction(e);
      //this.mouseMoveDefaultAction(e.movementX, e.movementY, e.clientX - this.canvasLeft, e.clientY - this.canvasTop);
      // なぜmovementを使っているかというと、
      // このアクションはポインターが無関係だから（ポインターが無くても実行される）
      // まずいのはわかってるけどね...
      // マウスダウン時のPointerの位置の計算についてはmovementが出てこないので
      // マウスダウン時しか要らない場合は使わないのもあり。
      this.mouseMoveDefaultAction(e.movementX, e.movementY, e.clientX - this.rect.left, e.clientY - this.rect.top);
    }
    mouseMovePointerAction(e){
      // pointerが生成されなかった場合は処理を実行しない
      if(this.pointers.length === 0){ return; }
      const p = this.pointers[0];
      p.mouseUpdate(e);
      p.mouseMoveAction(e);
    }
    mouseMoveDefaultAction(dx, dy, x, y){
      // Interactionサイドの実行内容を書く
    }
    mouseUpAction(e){
      this.mouseUpPointerAction(e);
      this.mouseUpDefaultAction(e);
    }
    mouseUpPointerAction(e){
      // pointerが生成されなかった場合は処理を実行しない
      if(this.pointers.length === 0){ return; }
      // ここで排除するpointerに何かさせる...
      const p = this.pointers[0];
      p.mouseUpAction(e);
      this.pointers.pop();
    }
    mouseUpDefaultAction(e){
      // Interactionサイドの実行内容を書く
    }
    mouse(e){
      // ホイールのイベントなどで正確なマウス座標が欲しい場合に有用
      // マウス限定なのでイベント内部などマウスが関係する処理でしか使わない方がいいです
      return {x:e.clientX - this.rect.left, y:e.clientY - this.rect.top};
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
      // ただし、factoryがnullを返すなど、pointerが生成されないならば、実行しない。
      // pointerが無い以上、ダブルタップの判定が出来ないので。
      if(this.pointers.length === 0){ return; }
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
          const p = this.factory(this);
          if (p === null) return; // factoryがnullを返す場合はpointerを生成しない
          //p.touchInitialize(currentTouches[i], this.canvasLeft, this.canvasTop);
          p.touchInitialize(currentTouches[i], this.rect, this);
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
      // pointerが生成されなかった場合は処理を実行しない
      if(this.pointers.length === 0){ return; }
      //e.preventDefault();
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
      // pointerが生成されなかった場合は処理を実行しない
      if(this.pointers.length === 0){ return; }
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
    resizeAction(){
      // リサイズ時の処理。
    }
    getPointers(){
      return this.pointers;
    }
  }

  // addEventの方がよさそう
  // add
  // clear
  // addとclearでよいです
  // addでイベントを追加しclearですべて破棄します
  // addで登録するイベント名をリスナーに合わせました（有効化オプションもこれになってるので倣った形です）
  // 一応touchStartとdbltapと複数登録用意しました、が、一応デスクトップでの運用が主なので、
  // 本格的にやるならCCみたいに継承してね。
  class Inspector extends Interaction{
    constructor(canvas, options = {}){
      super(canvas, options);
      this.functions = {
        mousedown:[],
        mousemove:[],
        mouseup:[],
        wheel:[],
        click:[],
        mouseenter:[],
        mouseleave:[],
        dblclick:[],
        keydown:[],
        keyup:[],
        touchstart:[], // スマホだとclickが発動しないので代わりに。
        dbltap:[] // doubleTapですね。これも用意しておきましょ。
      };
    }
    execute(name, args){
      for (const func of this.functions[name]){
        func(...args);
      }
    }
    add(name, func){
      // 複数のインタラクションを同時に設定できるようにする
      if (typeof name === 'string') {
        this.functions[name].push(func);
      } else if (Array.isArray(name)) {
        for (const functionName of name) {
          this.functions[functionName].push(func);
        }
      }
    }
    clear(name){
      this.functions[name] = [];
    }
    mouseDownDefaultAction(e){
      this.execute("mousedown", arguments);
    }
    mouseMoveDefaultAction(dx, dy, x, y){
      this.execute("mousemove", arguments);
    }
    mouseUpDefaultAction(e){
      this.execute("mouseup", arguments);
    }
    wheelAction(e){
      this.execute("wheel", arguments);
    }
    clickAction(){
      this.execute("click", arguments);
    }
    mouseEnterAction(){
      this.execute("mouseenter", arguments);
    }
    mouseLeaveAction(){
      this.execute("mouseleave", arguments);
    }
    doubleClickAction(){
      this.execute("dblclick", arguments);
    }
    doubleTapAction(){
      this.execute("dbltap", arguments);
    }
    keyDownAction(e){
      this.execute("keydown", arguments);
    }
    keyUpAction(e){
      this.execute("keyup", arguments);
    }
    touchStartDefaultAction(e){
      this.execute("touchstart", arguments);
    }
  }

  // これクラス化しよ？？Locaterがいい。
  // 簡易版。毎フレームupdateする。pointersを調べて末尾を取る。末尾なので、常に新規が採用される。
  // 位置情報を更新する。x,y,dx,dyを使う。また関数を導入できる。
  // 発動時、移動時、activeを前提として常時、終了時のアクションが存在する。終了時はタッチの場合、
  // pointersが空になるとき。なぜなら常に新規で更新されるので。
  // 取得するときclampとnormalizeのoptionを設けるようにしました。
  // factorを設けてすぐに値が変わらないようにできる仕組みを導入しました。
  // 自由に変えられるようにするかどうかは応相談...できるだけ軽量で行きたいので。
  // mouseFreeUpdateにより、マウスの場合にマウス移動で位置更新がされるようにするオプションを追加
  class Locater extends Interaction{
    constructor(canvas, options = {}){
      super(canvas, options);
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.dx = 0;
      this.dy = 0;
      // 位置情報を滑らかに変化させたいときはoptionsでfactorを定義する。
      const {factor = 1} = options;
      this.factor = factor;
      // マウス操作の場合、位置情報をマウス移動に伴って変化させたい場合もあるでしょう。
      // mouseFreeUpdateのoptionを設けてそれが実現されるようにします
      const {mouseFreeUpdate = false} = options;
      this.mouseFreeUpdate = mouseFreeUpdate;
      // 関数族
      this.actions = {}; // activate, inActivate, move.
      // 関数のデフォルト。
      this.actions.activate = (e) => {};
      this.actions.move = (x, y, dx, dy) => {};
      this.actions.update = (x, y, dx, dy) => {};
      this.actions.inActivate = (e) => {};
      // ボタン.
      this.button = -1;
    }
    positionUpdate(x, y, dx, dy){
      // 位置情報の更新を関数化する
      // 急に変化させたくない場合に徐々に変化させる選択肢を設ける
      const factor = this.factor;
      this.x += (x - this.x) * factor;
      this.y += (y - this.y) * factor;
      this.dx += (dx - this.dx) * factor;
      this.dy += (dy - this.dy) * factor;
    }
    update(){
      if (this.pointers.length > 0) {
        // 末尾（新規）を採用する。
        // マウス操作でmouseFreeUpdateの場合これが実行されないようにするには、結局pointer.length>0ということは
        // もうactivateされててbutton>=0であるから、タッチならここが-1だから、そこで判定できる。そこで、
        // (this.button >= 0 && this.mouseFreeUpdate)の場合にキャンセルさせる。この場合!を使った方が分かりやすい。
        // 「マウスアクションにおいてmouseFreeUpdateの場合はactive時にはpositionをupdateしない」という日本語の翻訳になる。
        // buttonを使うことでタッチとマウスの処理を分けられるわけ。
        if (!(this.button >= 0 && this.mouseFreeUpdate)) {
          const p = this.pointers[this.pointers.length - 1];
          this.positionUpdate(p.x, p.y, p.dx, p.dy);
        }
      }
      if (this.active) {
        this.actions.update(this.x, this.y, this.dx, this.dy);
      }
    }
    setAction(name, func){
      // オブジェクト記法に対応
      if (typeof name === 'string') {
        this.actions[name] = func;
      } else if (typeof name === 'object') {
        for(const _name of Object.keys(name)){
          const _func = name[_name];
          this.actions[_name] = _func;
        }
      }
    }
    isActive(){
      return this.active;
    }
    getPos(options = {}){
      const {clamp = false, normalize = false} = options;
      const {width:w, height:h} = this.rect;
      // clampのoptionsがある場合は先にclampしてから正規化する。
      // dxとdyはclampの必要がない。
      const result = {x:this.x, y:this.y, dx:this.dx, dy:this.dy};
      if (clamp) {
        result.x = Math.max(0, Math.min(w, result.x));
        result.y = Math.max(0, Math.min(h, result.y));
      }
      // 正規化して0～1の値を返せるようにする。
      if (normalize) {
        result.x /= w;
        result.y /= h;
        result.dx /= w;
        result.dy /= h;
      }
      return result;
    }
    mouseDownDefaultAction(e){
      // ボタン. 0:left, 1:center, 2:right
      this.button = e.button;
      this.active = true;
      this.actions.activate(e); // e.buttonで処理分けた方が楽だわ。タッチの場合は常に-1だけどね。
    }
    mouseMoveDefaultAction(dx, dy, x, y){
      // mouseFreeUpdateがtrueであれば常に位置更新がされるようにする
      // タッチの場合ここは実行されないため、mouseFreeUpdateがtrueでも問題ない。
      if (this.mouseFreeUpdate) {
        // ああここか
        // xとyをそのまま使っちゃってる
        // ...
        this.positionUpdate(x, y, dx, dy);
      }
      if(this.active){
        this.actions.move(x, y, dx, dy);
      }
    }
    mouseUpDefaultAction(e){
      // activateされていないなら各種の処理は不要
      if (!this.active) return;
      this.active = false;
      this.actions.inActivate(e);
      // ボタンリセット
      this.button = -1;
    }
    touchStartDefaultAction(e){
      this.active = true;
      this.actions.activate(e);
    }
    touchSwipeAction(dx, dy, x, y, px, py){
      if (this.active) {
        this.actions.move(x, y, dx, dy);
      }
    }
    touchEndDefaultAction(e){
      // ここ、タッチポインタが一つでも外れるとオフになる仕様なんだけど、
      // タッチポインタ、末尾採用にしたから、全部空の時だけ発動でいいよ。
      // 空っぽになる場合、この時点でちゃんと空っぽだから。
      // ここもactiveでないのに実行されてしまうようですね...防いでおくか。
      if (this.active && this.pointers.length === 0) {
        this.active = false;
        this.actions.inActivate(e);
      }
    }
  }

  // キーを押したとき(activate), キーを押しているとき(update), キーを離したとき(inActivate),
  // それぞれに対してイベントを設定する。
  // 改変でキーコードが分かるようにするわ（どう使うか？showKeyCode:trueしたうえで使いたいキーをたたくだけ。）

  // キーごとにただひとつ生成されるagent
  // プロパティを持たせることで処理に柔軟性を持たせることができる。
  // もちろんすべてのagentが共通のプロパティを持つ必要はないが、
  // そこはメソッドで無視すればいいだけ。
  class KeyAgent{
    constructor(code){
      this.code = code;
      // tは親のKeyActionで、すなわちそれを受け取る。
      // 他のキーのactive状態などを分岐処理に利用できる。
      this.activateFunction = (t,a)=>{};
      this.updateFunction = (t,a)=>{};
      this.inActivateFunction = (t,a)=>{};
      this.active = false;
    }
    isActive(){
      return this.active;
    }
    activate(t){
      this.activateFunction(t, this);
      this.active = true;
    }
    update(t){
      this.updateFunction(t, this);
    }
    inActivate(t){
      this.inActivateFunction(t, this);
      this.active = false;
    }
    registAction(actionType, func){
      if(typeof actionType)
      this[actionType.concat("Function")] = func;
    }
  }

  // 改善案（同時押し対応）
  // isActiveが未定義の場合nullを返しているところをfalseを返すようにする
  // さらにactivate,update,inActivateの関数登録で引数を持たせられるようにする。その内容は第一引数で、
  // thisである。どう使うかというとたとえば(e)=>{if(e.isActive){~~~}}といった感じで「これこれのキーが押されている場合～～」
  // っていう、いわゆる同時押し対応をできるようにする。その際、たとえばBを押しながらAのときに、Bを押すだけの処理が存在しないと
  // isActiveがnullを返してしまうので、先のように変更したいわけです。
  // 改良版KeyAction.
  // agentをクラス化することでさらに複雑な処理を可能にする.
  // うん
  // PointerPrototypeで遊びたいので
  // オフにするのはやめましょ
  class KeyAction extends Interaction{
    constructor(canvas, options = {}){
      // keydown,keyupは何も指定せずともlistenerが登録されるようにする
      // こういう使い方もあるのだ（superの宣言箇所は任意！）
      options.keydown = true;
      options.keyup = true;
      super(canvas, options);
      this.keys = {};
      this.options = {
        showKeyCode:false, autoRegist:true
      }
      // keyAgentFactoryはcodeを引数に取る
      // codeごとに異なる毛色のagentが欲しい場合に有用
      const {keyAgentFactory = (code) => new KeyAgent(code)} = options;
      this.keyAgentFactory = keyAgentFactory;
      // showKeyCode: デフォルトはfalse. trueの場合、キーをたたくとコンソールにe.codeが表示される
      // autoRegist: デフォルトはtrue. trueの場合、キーをたたくと自動的にkeyActionObjectがそれに対して生成される。
    }
    enable(...args){
      // 各種オプションを有効化します。
      const arg = [...arguments];
      for (const name of arg) {
        this.options[name] = true;
      }
      return this;
    }
    disable(...args){
      // 各種オプションを無効化します。
      const arg = [...arguments];
      for (const name of arg) {
        this.options[name] = false;
      }
      return this;
    }
    registAction(code, actions = {}){
      if (typeof code === 'string') {
        const agent = this.keys[code];
        if (agent === undefined) {
          // 存在しない場合は、空っぽのアクションが生成される。指定がある場合はそれが設定される。
          //const result = {};
          const newAgent = this.keyAgentFactory(code);
          const {
            activate = (t,a) => {},
            update = (t,a) => {},
            inActivate = (t,a) => {}
          } = actions;
          newAgent.registAction("activate", activate);
          newAgent.registAction("update", update);
          newAgent.registAction("inActivate", inActivate);
          this.keys[code] = newAgent;
          //result.activate = activate;
          //result.update = update;
          //result.inActivate = inActivate;
          //result.active = false;
          //this.keys[code] = result;
        } else {
          // 存在する場合、actionsで指定されたものだけ上書きされる。
          for (const actionType of Object.keys(actions)) {
            //agent[actionType] = actions[actionType];
            agent.registAction(actionType, actions[actionType]);
          }
        }
      } else if (typeof code === 'object') {
        // まとめて登録する場合。registActionsなんか要らんですよ。
        for(const name of Object.keys(code)) {
          this.registAction(name, code[name]);
        }
      }
      return this;
    }
    isActive(code){
      const agent = this.keys[code];
      if (agent === undefined) return false; // 未定義の場合はfalse.
      //return agent.active;
      return agent.isActive();
    }
    keyDownAction(e){
      if (this.options.showKeyCode) {
        // showKeyCodeがonの場合、e.codeを教えてくれる。
        console.log(e.code);
      }
      // 何らかのキーが押されると、その瞬間に空っぽのアクションからなる
      // オブジェクトが生成される。それによりactive判定が可能になる。
      if (this.options.autoRegist) {
        this.registAction(e.code);
      }
      const agent = this.keys[e.code];
      if(agent === undefined || agent.isActive())return;
      agent.activate(this);
      //if (agent === undefined || agent.active) return;
      //agent.activate(this); // this.isActiveなどの処理を可能にする。
      //agent.active = true;
    }
    update(){
      for(const name of Object.keys(this.keys)){
        const agent = this.keys[name];
        //if (agent.active) {
        if(agent.isActive()){
          agent.update(this); // this.isActiveなどの処理を可能にする。
        }
      }
    }
    keyUpAction(e){
      const agent = this.keys[e.code];
      if(agent===undefined || !agent.isActive()) return;
      agent.inActivate(this);
      //if (agent === undefined || !agent.active) return;
      //agent.inActivate(this); // this.isActiveなどの処理を可能にする。
      //agent.active = false;
    }
  }

  /*
    使い方
    defaultValueとminValue,maxValueを定義する
    ホイールで動かすなら適当に係数を決めて
    アクションでsetForceを呼び出せばいい
    DamperのgetValue,setParam,setForce,resetValue,updateValueはすべて
    同じ名前で使える
    ピンチインアウトで単純拡縮とか
    そういう使い方もできるでしょ。多分ね。
  */
  class Damper{
    constructor(params = {}){
      const {
        defaultValue = 0,
        minValue = -100,
        maxValue = 0,
        frictionCoeff = 0.15,
      } = params;
      this.value = defaultValue;
      this.velocity = 0;
      this.acceleration = 0;
      this.defaultValue = defaultValue;
      this.minValue = minValue;
      this.maxValue = maxValue;
      this.frictionCoeff = frictionCoeff;
    }
    resetValue(){
      this.value = this.defaultValue;
    }
    setParam(params = {}){
      // 用意されたものだけ変更すればよい
      for(const param of Object.keys(params)){
        if(this[param] === undefined)continue;
        this[param] = params[param];
      }
    }
    setForce(force){
      this.acceleration = force;
    }
    updateValue(){
      this.velocity += this.acceleration;
      this.acceleration = 0;
      this.value += this.velocity;
      if(this.value > this.maxValue){
        this.value = this.maxValue; this.velocity = 0;
      }
      if(this.value < this.minValue){
        this.value = this.minValue; this.velocity = 0;
      }
      this.velocity *= 1.0 - this.frictionCoeff;
      if(Math.abs(this.velocity)<0.001)this.velocity = 0;
    }
    getValue(){
      return this.value;
    }
    getVelocity(){
      return this.velocity;
    }
    implement(target, implementMethodNames = []){
      // targetにメソッドを継承させるコード
      if(implementMethodNames.length === 0){
        // デフォルトで継承するコード
        implementMethodNames.push(
          "getValue", "getVelocity", "resetValue",
          "updateValue", "setParam", "setForce"
        );
      }
      // 引数がどうであっても継承させられる
      for(const methodName of implementMethodNames){
        target[methodName] = (function(){
          return this[methodName](...arguments);
        }).bind(this);
      }
    }
  }

  // とはいえいちいちエクステンション書くのめんどくさいな
  // というわけでdamperにimplementを導入しました

  // 厳密には違うけど。ただの横着。
  class Scroller extends Interaction{
    constructor(cvs, options = {}){
      super(cvs, options);
      const {
        wheelScrollCoeff = 0.05,
        swipeScrollCoeff = 0.2,
        scrollDirection = Math.PI*0.5, // swipeの際にどっちに動かすと増えるか
      } = options;
      this.damper = new Damper(options);
      // こう書くだけでdamperの主要メソッドはすべて継承される
      this.damper.implement(this);

      this.wheelScrollCoeff = wheelScrollCoeff;
      this.swipeScrollCoeff = swipeScrollCoeff;
      this.scrollDirection = scrollDirection;
    }
    wheelAction(e){
      this.setForce(-e.deltaY*this.wheelScrollCoeff);
    }
    applyAcceleration(dx, dy){
      if(this.pointers.length === 0) return; // 必須
      const acceleration = Math.cos(this.scrollDirection) * dx + Math.sin(this.scrollDirection) * dy;
      this.setForce(acceleration * this.swipeScrollCoeff);
    }
    mouseMoveDefaultAction(dx, dy, x, y){
      this.applyAcceleration(dx, dy);
    }
    touchSwipeAction(dx, dy, x, y, px, py){
      this.applyAcceleration(dx, dy);
    }
  }

  fox.Interaction = Interaction;
  fox.PointerPrototype = PointerPrototype;
  fox.Inspector = Inspector;
  fox.Locater = Locater;
  fox.KeyAgent = KeyAgent; // 追加(20240923)
  fox.KeyAction = KeyAction;
  fox.Damper = Damper; // DamperとScrollerを分離(20241010)
  fox.Scroller = Scroller; // 追加(20241008)

  return fox;
})();

/*
MANUAL
マニュアルを書きます

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
        window.addEventListener('mousemove', this.mouseMoveAction.bind(this), {passive:false});
        window.addEventListener('mouseup', this.mouseUpAction.bind(this), {passive:false});
        // タッチ（ダブルタップは無いので自前で実装）
        canvas.addEventListener('touchstart', this.touchStartAction.bind(this), {passive:false});
        window.addEventListener('touchmove', this.touchMoveAction.bind(this), {passive:false});
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

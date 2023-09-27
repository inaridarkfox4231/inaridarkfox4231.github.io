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

// 20230906
// foxIA移植
// OrbitControlのパッチを削除（もう要らない）

// 20230911
// foxIAの移植、カメラの改造/差し替え、Transformなどの改名、改変、CCとCMの導入、などなど。

// 20230914
// 問題発生
// 問題解消しました

// 20230917
// CCとLSを新しくして色々改良中

// 20230926
// copyPainter死んだ
// draw時のblendを可能にした
// 今んとこそんくらい

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
    e.clientX/Yからキャンバスの位置座標を引いて計算する
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
アルファベット：keyA,keyB,...,keyZ.
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
      this.x = 0;
      this.y = 0;
      this.dx = 0;
      this.dy = 0;
      this.prevX = 0;
      this.prevY = 0;
      this.canvasLeft = 0;
      this.canvasTop = 0;
      this.button = -1; // マウス用ボタン記録。-1:タッチですよ！の意味
    }
    mouseInitialize(e, left, top){
      this.x = e.clientX - left;
      this.y = e.clientY - top;
      this.canvasLeft = left;
      this.canvasTop = top;
      this.prevX = this.x;
      this.prevY = this.y;
      this.button = e.button; // 0:left, 1:center, 2:right
    }
    mouseDownAction(e){
    }
    mouseUpdate(e){
      this.prevX = this.x;
      this.prevY = this.y;
      this.dx = (e.clientX - this.canvasLeft - this.x);
      this.dy = (e.clientY - this.canvasTop - this.y);
      this.x = e.clientX - this.canvasLeft;
      this.y = e.clientY - this.canvasTop;
    }
    mouseMoveAction(e){
    }
    mouseUpAction(){
    }
    touchInitialize(t, left, top){
      this.id = t.identifier;
      this.x = t.pageX - left; // 要するにmouseX的なやつ
      this.y = t.pageY - top; // 要するにmouseY的なやつ
      this.canvasLeft = left;
      this.canvasTop = top;
      this.prevX = this.x;
      this.prevY = this.y;
    }
    updateCanvasData(left, top){
      // マウスでもタッチでも実行する
      const prevLeft = this.canvasLeft;
      const prevTop = this.canvasTop;
      this.canvasLeft = left;
      this.canvasTop = top;
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
      this.dx = (t.pageX - this.canvasLeft - this.x);
      this.dy = (t.pageY - this.canvasTop - this.y);
      this.x = t.pageX - this.canvasLeft;
      this.y = t.pageY - this.canvasTop;
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
      this.canvasLeft = 0; // touch用
      this.canvasTop = 0; // touch用
      this.tapCount = 0; // ダブルタップ判定用
      this.firstTapped = {x:0, y:0};
    }
    initialize(canvas, options = {}){
      // 横幅縦幅を定義
      this.width = Number((canvas.style.width).split("px")[0]);
      this.height = Number((canvas.style.height).split("px")[0]);
      // touchの場合はこうしないときちんとキャンバス上の座標が取得できない
      const rect = canvas.getBoundingClientRect();
      this.canvasLeft = rect.left;
      this.canvasTop = rect.top;
      // 右クリック時のメニュー表示を殺す
      document.oncontextmenu = (e) => { e.preventDefault(); }
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
      // リサイズの際にleftとtopが変更されるのでそれに伴ってleftとtopを更新する
      window.addEventListener('resize', (function(){
        const newRect = canvas.getBoundingClientRect();
        this.updateCanvasData(newRect.left, newRect.top);
      }).bind(this));
    }
    updateCanvasData(left, top){
      this.canvasLeft = left;
      this.canvasTop = top;
      for(const p of this.pointers){ p.updateCanvasData(left, top); }
    }
    mouseDownAction(e){
      this.mouseDownPointerAction(e);
      this.mouseDownDefaultAction(e);
    }
    mouseDownPointerAction(e){
      const p = this.factory();
      p.mouseInitialize(e, this.canvasLeft, this.canvasTop);
      p.mouseDownAction(e);
      this.pointers.push(p);
    }
    mouseDownDefaultAction(e){
      // Interactionサイドの実行内容を書く
    }
    mouseMoveAction(e){
      this.mouseMovePointerAction(e);
      this.mouseMoveDefaultAction(e.movementX, e.movementY, e.clientX - this.canvasLeft, e.clientY - this.canvasTop);
    }
    mouseMovePointerAction(e){
      if(this.pointers.length == 0){ return; }
      const p = this.pointers[0];
      p.mouseUpdate(e);
      p.mouseMoveAction(e);
    }
    mouseMoveDefaultAction(dx, dy, x, y){
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
          p.touchInitialize(currentTouches[i], this.canvasLeft, this.canvasTop);
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

  // addEventの方がよさそう
  // add
  // clear
  // addとclearでよいです
  // addでイベントを追加しclearですべて破棄します
  // addで登録するイベント名をリスナーに合わせました（有効化オプションもこれになってるので倣った形です）
  class Inspector extends Interaction{
    constructor(){
      super();
      this.functions = {
        mousedown:[],
        mousemove:[],
        mouseup:[],
        wheel:[],
        click:[],
        mouseenter:[],
        mouseleave:[],
        dblclick:[],
        dbltap:[],
        keydown:[],
        keyup:[]
      };
    }
    execute(name, args){
      for (const func of this.functions[name]){
        func(...args);
      }
    }
    add(name, func){
      this.functions[name].push(func);
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
    mouseUpDefaultAction(){
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
  }

  // これクラス化しよ？？Locaterがいい。
  // タッチの場合は0番のswipeだけを認識する。
  // 単純に位置を取得するだけ。押してる間だけその状態を認識し続ける。
  // 簡易版なので多くを期待しないでください...ちゃんといろいろやりたいならPointerPrototypeを使ってね
  // あっちでいろいろやってIA.Interactionで取得すればしたいことは全部できますので。
  class Locater extends Interaction{
  	constructor(){
  		super();
  		this.active = false;
  		this.x = 0;
  		this.y = 0;
  		this.dx = 0;
  		this.dy = 0;
  	}
  	isActive(){
  		return this.active;
  	}
  	getPos(){
  		return {x:this.x, y:this.y, dx:this.dx, dy:this.dy};
  	}
  	mouseDownDefaultAction(){
  		this.active = true;
  	}
    mouseMoveDefaultAction(dx, dy, x, y){
      if(this.active){
        this.x = x;
        this.y = y;
  			this.dx = dx;
  			this.dy = dy;
      }
    }
    mouseUpDefaultAction(){
      this.active = false;
    }
    touchStartDefaultAction(e){
      this.active = true;
    }
    touchSwipeAction(dx, dy, x, y, px, py){
      if(this.active){
        this.x = x;
        this.y = y;
  			this.dx = dx;
  			this.dy = dy;
      }
    }
    touchEndDefaultAction(e){
      this.active = false;
    }
  }

  fox.Interaction = Interaction;
  fox.PointerPrototype = PointerPrototype;
  fox.Inspector = Inspector;
  fox.Locater = Locater;

  return fox;
})();

// p5wgex.
// glからRenderNodeを生成します。glです。(2022/10/02)
const p5wgex = (function(){

  // ---------------------------------------------------------------------------------------------- //
  // utility.

  // HSVをRGBにしてくれる関数. ただし0～1で指定してね
  function hsv2rgb(h, s, v){
    h = clamp(h, 0, 1);
    s = clamp(s, 0, 1);
    v = clamp(v, 0, 1);
    let _r = clamp(Math.abs(((6 * h) % 6) - 3) - 1, 0, 1);
    let _g = clamp(Math.abs(((6 * h + 4) % 6) - 3) - 1, 0, 1);
    let _b = clamp(Math.abs(((6 * h + 2) % 6) - 3) - 1, 0, 1);
    _r = _r * _r * (3 - 2 * _r);
    _g = _g * _g * (3 - 2 * _g);
    _b = _b * _b * (3 - 2 * _b);
    const result = {};
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

  // softLight関数
  function _softLight(sr, sg, sb, dr, dg, db){
    const func = (s, d) => {
      if(s < 0.5){
        return 2*s*d + d*d*(1-2*s);
      }
      return 2*d*(1-s) + Math.sqrt(d)*(2*s-1);
    }
    return {r:func(sr,dr), g:func(sg,dg), b:func(sb,db)};
  }

  // overlay関数
  function _overlay(sr, sg, sb, dr, dg, db){
    const func = (s, d) => {
      if(d < 0.5){
        return 2*s*d;
      }
      return 2*(s+d-s*d) - 1;
    }
    return {r:func(sr,dr), g:func(sg,dg), b:func(sb,db)};
  }

  // softLightを使ったhsl2rgb関数
  function hsl2rgb_soft(h, s, l){
    const hsv = hsv2rgb(h, s, 1);
    l = clamp(l, 0, 1);
    return _softLight(hsv.r, hsv.g, hsv.b, l, l, l);
  }

  function hslArray_soft(h, s, v){
    const obj = hsl2rgb_soft(h, s, v);
    return [obj.r, obj.g, obj.b];
  }

  // overlayを使ったhsl2rgb関数
  function hsl2rgb_overlay(h, s, l){
    const hsv = hsv2rgb(h, s, 1);
    l = clamp(l, 0, 1);
    return _overlay(hsv.r, hsv.g, hsv.b, l, l, l);
  }

  function hslArray_overlay(h, s, v){
    const obj = hsl2rgb_overlay(h, s, v);
    return [obj.r, obj.g, obj.b];
  }

  // window.alertがうっとうしいので1回しか呼ばないように
  // noLoopで書き換えようと思います。
  // 引数を増やすかどうかは応相談
  function myAlert(_string){
    window.alert(_string);
    console.log("myAlert: " + _string);
    noLoop();
  }

  // 簡単なclamp関数
  // 数と配列が対象
  function clamp(x, _min = 0, _max = 1){
    if (typeof x === "number") {
      return Math.max(_min, Math.min(_max, x));
    }
    if (Array.isArray(x)) {
      const result = [];
      for(let value of x) {
        result.push(clamp(value, _min, _max));
      }
      return result;
    }
    return x;
  }

  // ---------------------------------------------------------------------------------------------- //
  // Timer.

  // というわけでTimer改良しました
  // 差分を取得する処理は完全に累計を取得する処理と分離しているので、同じスロットで両方扱えます。
  // elapsedとdeltaは別の概念。毎フレーム、getDeltaをした後でsetDeltaすることで毎フレームの経過時間を扱えます。
  // pause時には0が返り、reStartした際にdeltaStumpがリセットされるのでジャンプは生じない。
  // 初期化時のstumpによる指定ではelapsedStumpが設定されます。
  // stumpのスタック欲しい？欲しい...ですか？まあ、必要になったら、用意しましょ。

  // stepFunctionとcompleteFunctionを用意
  // stepFunctionはgetProgressを実行すると遂行されるがfalseを指定して実行しないようにもできる
  // セットする関数はいずれもthisのデフォルトが（function(){~~~}表記の場合）インスタンスになるので
  // durationをいじったりみたいなこともできるにはできます、やりたければどうぞ。
  // isActiveを用意しました。progressが正かどうかを見るだけの簡単な関数。

  // 初期化時のstump指定を破棄しましょ。これ使ってないし。代わりにdelayを用意しよう。
  // elapsedStump = window.performance.now() + delay;
  // これで初期化する。たとえばdelayが500の場合、500ミリ秒経過するまではgetElapsedMillis()が負の数を返したり、
  // progressが0を返したりする（clampに修正しました）. そのあとactiveになると。checkを実行してもfalseしか返さないし。
  // ちゃんと最後は終わってくれるので問題なし
  // 寿命を表現したりできるといいね。
  class Timer{
    constructor(){
      this.timers = {};
    }
    initialize(name, params = {}){
      const {
        delay = 0,
        duration = Infinity,
        scale = 1000,
        completeFunction = () => {},
        stepFunction = (prg) => {}
      } = params;
      const newTimer = {};
      // 先に登録を済ませる
      this.timers[name] = newTimer;
      // 場合によっては名前もあった方がいいと思う
      newTimer.name = name;
      // delayをwindow.performance.now()に足す
      newTimer.elapsedStump = window.performance.now() + delay;
      // 前のフレームとの差分の計算をするのに使うstump.
      newTimer.deltaStump = window.performance.now();
      // 時間間隔を使ってなんかする場合に設定する。ミリ秒指定。
      newTimer.duration = duration;
      newTimer.scale = scale;
      newTimer.pause = false;
      // ポーズ時にその瞬間を記録するために使用されるstump.
      // pause中の正確なelapsedTimeを計算するのに使う。
      newTimer.pauseStump = 0;
      // checkがtrueの場合に実行される関数。
      newTimer.completeFunction = completeFunction;
      newTimer.stepFunction = stepFunction;
      newTimer.active = true; // 関数の実行可否
      return this;
    }
    validateName(name, methodName){
      if (this.timers[name] === undefined) {
        myAlert(methodName + " failure: invalid name.");
        return null;
      }
      return true;
    }
    setElapsed(name, duration){
      // elapsedStumpをその時点に設定し、必要ならdurationも変更する。
      // pause中は使えない。
      if (!this.validateName(name, "setElapsed")) return;
      const target = this.timers[name];
      // pause中にelapsedStumpを変更することはできない。
      if (target.pause) return;
      target.elapsedStump = window.performance.now();
      // durationを決めることでcheckで一定時間ごとの処理ができるようになるね。
      if (duration !== undefined) {
        target.duration = duration;
      }
    }
    getElapsedMillis(name){
      // 最後に発火してからの経過時間を生のミリ秒表示で取得する。
      if (!this.validateName(name, "getElapsedMillis")) return null;
      const target = this.timers[name];
      if (target.pause) {
        // elapsedの場合、ポーズ時に記録したstumpとelapsedStumpの差分が返る。つまり定数が返る。
        return target.pauseStump - target.elapsedStump;
      }
      return window.performance.now() - target.elapsedStump; // 普通に現在までの時間
    }
    getElapsed(name){
      // 最後に発火してからの経過時間をscaleで割った値を返す感じ。経過時間なのでelapsedです。
      if (!this.validateName(name, "getElapsed")) return null;
      const target = this.timers[name];
      return this.getElapsedMillis(name) / target.scale;
    }
    getElapsedDiscrete(name, interval = 1000, modulo = 1){
      // deltaをintervalで割ってfloorした結果を返す。これが利用される場合、
      // durationはInfinityを想定している。そうでなくても使えるけど。
      // moduloが1より大きい場合はそれで%を取る。1の場合はそのまま整数を返す。
      // たとえば250であれば0,1,2,3,...と1秒に4増えるし、
      // moduloを4にすれば0,1,2,3,0,1,2,3,...となるわけ。
      if (!this.validateName(name, "getElapsedDiscrete")) return null;
      const elapsed = this.getElapsedMillis(name);
      const n = Math.floor(elapsed / interval);
      if (modulo > 1) {
        return n % modulo;
      }
      return n;
    }
    getProgress(name, executeStepFunction = true){
      // stumpからの経過時間(elapsed)をdurationで割ることで進捗を調べるのに使う感じ
      // executeStepFunctionをfalseにすると
      // stepFunctionを実行させずにprogressを取得するだけという使い方ができる
      if (!this.validateName(name, "getProgress")) return null;
      const target = this.timers[name];
      // getProgressの内部でstepFunction(prg)が実行される。
      // const prg=~~~とかする手間が省ける。
      if (target.duration > 0) {
        const prg = Math.min(1, this.getElapsedMillis(name) / target.duration);
        if (executeStepFunction && target.active) target.stepFunction(prg);
        return prg;
      }
      if (executeStepFunction && target.active) target.stepFunction(1);
      return 1; // durationが0の場合...つまり無限大ということ。
    }
    check(name, nextDuration){
      // durationを経過時間が越えたらelapsedStumpを更新する
      // nextDurationは未定義なら同じ値を継続
      // 毎回違うでもいい、自由に決められるようにする。いわゆるメトロノーム。
      // 実はFALさんのメトロノームのcheckと大体同じことをしてるんですが、あっちではあのですね...
      if (!this.validateName(name, "check")) return false;
      const target = this.timers[name];
      const elapsedTime = this.getElapsedMillis(name);
      if (elapsedTime > target.duration) {
        target.elapsedStump += target.duration;
        // 足しますよね。その時に計算されるelapsedStumpに基づいて計算されるelapsedTimeはduration未満であることが想定されていますが、
        // そうとは限らない。ぶっちゃけていうとelapsedTimeがduration2個分以上の場合困るねって話。その場合についてはFALさんはどうしてるかというと
        // elapsedStumpをperformance.now()にしていますね。要はタイマーリセットですね。おそらくいくつも足すよりかは合理的だと思います。
        // でないとどんどん遅れて狂っていってしまう。リセットした方が合理的。やっと理解できた。
        if (elapsedTime > 2*target.duration) {
          // 2個分以上離れてる場合、1個足すだけでは足りないので、必要なだけ足すのではなく、もういっそelapsedTimeを0にリセットしてしまう。
          // もっともよほどのことが無い限りは実行されない。FALさんのメトロノームの場合、これは異常なほどBPMが速いケースなので、まず実行されない。
          target.elapsedStump = window.performance.now();
        }
        // elapsedStumpを修正したうえでcompleteFunctionを実行する
        // こうしないとcompleteFunction内部でdurationをいじりたい場合に不具合が発生する（邪道だけど）
        // 具体的にはelapsedStumpの値が不自然になる
        if (target.active) target.completeFunction();
        // 引数でnextDurationをいじる場合はそっちが優先される
        // ほんとはdurationをいじる関数用意してもいいんですけど
        // 迂闊に用意するとバグの温床になりかねないので保留してる
        if (nextDuration !== undefined) {
          target.duration = nextDuration;
        }
        return true;
      }
      return false;
    }
    getDeltaMillis(name){
      // 経過時間のミリ秒を返す。差分はdeltaStumpと取るが、setDelta()できちんと定めないと計算できないので注意。
      if (!this.validateName(name, "getDeltaMillis")) return null;
      const target = this.timers[name];
      if(target.pause){
        // deltaの場合、差分は0であることが適当なので、0を返す。
        return 0;
      }
      // 最後にスタンプした瞬間との差分を記録
      const delta = window.performance.now() - target.deltaStump;
      // 直後にスタンプを押す（差分用の）
      target.deltaStump = window.performance.now();
      return delta;
    }
    getDelta(name){
      // 最後にスタンプした瞬間との差分をscaleで割った値を返す感じ。
      if (!this.validateName(name, "getDelta")) return null;
      const target = this.timers[name];
      return this.getDeltaMillis(name) / target.scale;
    }
    pause(name){
      // ポーズの際にpauseStumpを設定し、elapsedはこれと差分を取ることで定数が返るようにする。
      if (!this.validateName(name, "pause")) return;
      const target = this.timers[name];
      if (target.pause) return; // 重ね掛け回避
      target.pause = true;
      target.pauseStump = window.performance.now();
    }
    reStart(name){
      // pause解除。elapsedStumpをその時点とpauseStumpの差分を加えて更新する。
      // 加えることで経過時間などを正確に計算できるようにする。空白部分をノーカンにするための処理である。
      // 差分についてはこのタイミングでdeltaStumpをその時点にします。これにより、ポーズ前と差分を取ることにより発生してしまうジャンプを防ぐことができます。
      if (!this.validateName(name, "reStart")) return;
      const target = this.timers[name];
      if (!target.pause) return; // 重ね掛け回避
      target.pause = false;
      target.elapsedStump += window.performance.now() - target.pauseStump;
      target.deltaStump = window.performance.now();
    }
    pauseAll(){
      for (const name of Object.keys(this.timers)) {
        this.pause(name);
      }
    }
    reStartAll(){
      for (const name of Object.keys(this.timers)) {
        this.reStart(name);
      }
    }
    setCompleteFunction(name, func = () => {}){
      // completeの時の関数を自由に変えたい場合
      // funcのデフォルトは自明関数です
      // たとえばcompleteFunction内でこれを実行すれば1回こっきりとかできますね
      if (!this.validateName(name, "setCompleteFunction")) return;
      this.timers[name].completeFunction = func;
    }
    setStepFunction(name, func = (prg) => {}){
      // getProgressの際にprgを使って何かさせたい場合に用いる
      // funcのデフォルトは自明関数
      // 処理を破棄したい場合にどうぞ
      if (!this.validateName(name, "setStepFunction")) return;
      this.timers[name].stepFunction = func;
    }
    activate(name){
      if (!this.validateName(name, "activate")) return;
      this.timers[name].active = true;
    }
    inActivate(name){
      // 関数の実行だけ止めたい場合
      if (!this.validateName(name, "inActivate")) return;
      this.timers[name].active = false;
    }
    off(name){
      // タイマーをリセットしたうえで関数の実行も止める
      if (!this.validateName(name, "off")) return;
      this.timers[name].active = false;
      this.setElapsed(name);
      this.pause(name);
    }
    on(name){
      // completeFunction内部でoffにすることでnon-looped-timerを実現する
      if (!this.validateName(name, "on")) return;
      this.timers[name].active = true;
      this.reStart(name);
    }
    update(){
      // activeなものだけgetProgressとcheckを実行する
      for(const name of Object.keys(this.timers)){
        const target = this.timers[name];
        if(!target.active) continue;
        this.getProgress(name);
        this.check(name);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Easing.
  // 各種イージング
  // 複数のイージングを組み合わせて新しいの作ったりできる優れもの
  // 関数の登録をfuncの代わりにオブジェクトを使うことでcompositeMultiが適用されるようにしました
  // さらに関数が必要ない場合に登録された関数でapplyで呼び出せるようにしました

  class Easing{
    constructor(){
      this.funcs = {};
      this.initialize();
    }
    initialize(){
      this.regist("linear", x => x); // これは特別。

      // まずSineとかQuadのInバージョンを作り...
      // funcs.easeIn~~~はそのまま
      // funcs.easeOut~~~はそれを加工
      // funcs.easeInOut~~~も別の手法で加工
      // 一通りできたらそれをさらに加工してRevを作る流れ。
      const baseFuncs = {};
      baseFuncs.Sine = x => 1-Math.cos(0.5*Math.PI*x);
      baseFuncs.Quad = x => x*x;
      baseFuncs.Cubic = x => x*x*x;
      baseFuncs.Quart = x => x*x*x*x;
      baseFuncs.Quint = x => x*x*x*x*x;
      baseFuncs.Expo = x => (x > 0 ? Math.pow(2, 10*(x-1)) : 0);
      baseFuncs.Circ = x => 1-Math.sqrt(1-x*x);
      baseFuncs.Back = x => 2.7*x*x*x - 1.7*x*x;
      baseFuncs.Elastic = x => {
        if(x>0 && x<1){
          const c4 = (2 * Math.PI) / 3;
          return -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
        }
        if(x>0){ return 1; }
        return 0;
      }
      const easeOutBounce = x => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if(x < 1 / d1){
          return n1 * x * x;
        }else if (x < 2 / d1){
          return n1 * (x -= 1.5 / d1) * x + 0.75;
        }else if (x < 2.5 / d1){
          return n1 * (x -= 2.25 / d1) * x + 0.9375;
        }
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
      }
      baseFuncs.Bounce = x => 1-easeOutBounce(1-x);
      for(let funcName of Object.keys(baseFuncs)){
        const f = baseFuncs[funcName];
        this.regist("easeIn"+funcName, f);
        this.regist("easeOut"+funcName, (x => 1-f(1-x)));
        this.regist("easeInOut"+funcName, (x => (x < 0.5 ? 0.5*f(2*x) : 1-0.5*f(2*(1-x)))));
      }
      this.regist("zero", (x => 0));
      this.regist("one", (x => 1));
    }
    regist(name, func){
      if (typeof func === "function") {
        // 関数の場合は直接。
        this.funcs[name] = func;
        return;
      }
      // パラメータ指定
      this.funcs[name] = this.compositeMulti(func);
    }
    get(name){
      // 関数が欲しい場合
      return this.funcs[name];
    }
    apply(name, value){
      // 直接値が欲しい場合
      return this.funcs[name](value);
    }
    parseFunc(f){
      if (typeof f === "string") {
        if (typeof this.funcs[f] === "function") {
          return this.funcs[f];
        }
      }
      if (typeof f === "function") return f;
      // 未定義の場合はlinearが返る
      return x => x;
    }
    toClamp(f){
      return Easing.toClamp(this.parseFunc(f));
    }
    toLoop(f){
      return Easing.toLoop(this.parseFunc(f));
    }
    toReverseLoop(f){
      return Easing.toReverseLoop(this.parseFunc(f));
    }
    toInverse(f){
      return Easing.toInverse(this.parseFunc(f));
    }
    compositeMulti(params = {}){
      const {f = [x=>x]} = params;
      for(let k=0; k<f.length; k++){
        f[k] = this.parseFunc(f[k]);
      }
      return Easing.compositeMulti(params);
    }
    static toClamp(f){
      // 0～1でclampする
      return (x) => f(clamp(x, 0, 1));
    }
    static toLoop(f){
      // 元の0～1の関数を延々と
      return (x) => f(((x % 1) + 1) % 1);
    }
    static toReverseLoop(f){
      // 元の0～1から0～1～0～1～...
      // 元の関数をForwardBackしたものをLoopしたもの
      return (x) => {
        const t = (((x/2) % 1) + 1) % 1;
        if (t < 0.5) return f(2*t);
        return f(2-2*t);
      }
    }
    static toInverse(f){
      // 1～0にするだけ
      return (x) => f(1-x);
    }
    static composite(f, g, t, v){
      // 0～tでf, t～1でgという関数を作る。
      // 取る値はf,gともに0～1を想定しており
      // 途中でvになって最後が1ですね
      return (x) => {
        if (x < t) return f(x/t) * v;
        return v + (1-v)*g((x-t)/(1-t));
      }
    }
    static compositeMulti(params = {}){
      // 関数列fの長さをNとすると
      // 時間間隔列tは長さN+1で値の列vも長さN+1を想定
      // tは0から1までの間を単調増加で指定
      // vはそれに対応するように値を用意する
      // f,t,vから0～1に対し値を返す関数を作る
      // 各々のfは0～1ベースの関数であることが想定されている
      // 取る値の範囲も0～1になっているかどうかは問わない（ずっと0とかでもいい）
      // 整合性が取れるかどうかはvの指定次第
      const {f = [x=>x], t = [0,1], v = [0,1]} = params;
      const {loopType = "clamp"} = params;
      const resultFunction = (x) => {
        //x = clamp(x, 0, 1); // optionで選べるようにするかも？
        for(let k=1; k<t.length; k++){
          if (x < t[k]){
            const factor = f[k-1]((x - t[k-1]) / (t[k] - t[k-1]));
            return v[k-1] + (v[k] - v[k-1]) * factor;
          }
        }
        return v[v.length - 1]; // xが1の場合
      }
      switch(loopType){
        case "clamp":
          return Easing.toClamp(resultFunction);
        case "loop":
          return Easing.toLoop(resultFunction);
        case "reverseLoop":
          return Easing.toReverseLoop(resultFunction);
        case "inverse":
          return Easing.toInverse(resultFunction);
      }
      return resultFunction;
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
  class Texture{
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
    div(a, b, c){
      // divideをdivに改名。subやmultが略なのにdivがdivideだと整合性が悪い。VectorもVecだし。
      const r = _getValidation(a, b, c, 1); // 割り算のデフォも1でしょう
      if(r.x === 0.0 || r.y === 0.0 || r.z === 0.0){
        myAlert("Vec3 div: zero division error!");
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
    magSq(v){
      // sqrtだと重い場合に大きさの0判定だけしたい場合などに使う。
      return this.dot(this);
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
      // GLSL内部の計算に準拠しているつもり。multMat修正しました。
      // 0,1,2で1行目、3,4,5で2行目、6,7,8で3行目。合ってるはず。0,1,2で列ベクトルを指定するのはやはり不自然なので。
      this.multMat([
        s*a*a + t,   s*a*b - u*c, s*a*c + u*b,
        s*a*b + u*c, s*b*b + t,   s*b*c - u*a,
        s*a*c - u*b, s*b*c + u*a, s*c*c + t
      ]);
      return this;
      // OK??
    }
    normalize(){
      const L = this.mag();
      if(L == 0.0){
        // 0は0にしましょ。エラー出すよりその方がいいと思う。
        return this;
      }
      this.div(L);
      return this;
    }
    multMat(v1, v2, v3){
      // mは3x3行列を模した長さ9の配列、横並びで決める。つまり0,1,2が1行目、3,4,5が2行目、6,7,8が3行目。
      // ただしベクトル3つで定義できるようにもする。この方が自然だと思うので。
      const m = new Array(9);
      if(v1 === undefined){
        // 一応未定義の時のために単位行列おいとく
        m[0] = 1; m[1] = 0; m[2] = 0;
        m[3] = 0; m[4] = 1; m[5] = 0;
        m[6] = 0; m[7] = 0; m[8] = 1;
      } else if (Array.isArray(v1)) {
        for (let i=0; i<9; i++) m[i] = v1[i];
      } else {
        // v1,v2,v3がベクトルの場合。列ベクトル。
        m[0] = v1.x; m[1] = v2.x; m[2] = v3.x;
        m[3] = v1.y; m[4] = v2.y; m[5] = v3.y;
        m[6] = v1.z; m[7] = v2.z; m[8] = v3.z;
      }
      const {x:a, y:b, z:c} = this;
      this.x = m[0] * a + m[1] * b + m[2] * c;
      this.y = m[3] * a + m[4] * b + m[5] * c;
      this.z = m[6] * a + m[7] * b + m[8] * c;
      return this;
    }
    copy(){
      return new Vec3(this.x, this.y, this.z); // copy欲しいです
    }
    lerp(v, amt){
      // 自分自身とvをlerpで補間する
      this.x = this.x * (1-amt) + v.x * amt;
      this.y = this.y * (1-amt) + v.y * amt;
      this.z = this.z * (1-amt) + v.z * amt;
      return this;
    }
    slerp(v, amt){
      // 自分とvのamtの補間で得られるベクトルで自分を置き換える感じ
      // edge cases.
      if (amt === 0) { return this; }
      if (amt === 1) { return this.set(v); }

      // calculate magnitudes
      const selfMag = this.mag();
      const vMag = v.mag();
      const magmag = selfMag * vMag;
      // if either is a zero vector, linearly interpolate by these vectors
      if (magmag === 0) {
        this.mult(1 - amt).add(v.x * amt, v.y * amt, v.z * amt);
        return this;
      }
      // the cross product of 'this' and 'v' is the axis of rotation
      const axis = this.copy().cross(v);
      const axisMag = axis.mag();
      // Calculates the angle between 'this' and 'v'
      const theta = Math.atan2(axisMag, this.dot(v));

      // However, if the norm of axis is 0, normalization cannot be performed,
      // so we will divide the cases
      if (axisMag > 0) {
        axis.x /= axisMag;
        axis.y /= axisMag;
        axis.z /= axisMag;
      } else if (theta < Math.PI * 0.5) {
        // if the norm is 0 and the angle is less than PI/2,
        // the angle is very close to 0, so do linear interpolation.
        this.mult(1 - amt).add(v.x * amt, v.y * amt, v.z * amt);
        return this;
      } else {
        // If the norm is 0 and the angle is more than PI/2, the angle is
        // very close to PI.
        // In this case v can be regarded as '-this', so take any vector
        // that is orthogonal to 'this' and use that as the axis.
        if (this.z === 0 && v.z === 0) {
          // if both this and v are 2D vectors, use (0,0,1)
          // this makes the result also a 2D vector.
          axis.set(0, 0, 1);
        } else if (this.x !== 0) {
          // if the x components is not 0, use (y, -x, 0)
          axis.set(this.y, -this.x, 0).normalize();
        } else {
          // if the x components is 0, use (1,0,0)
          axis.set(1, 0, 0);
        }
      }

      // Since 'axis' is a unit vector, ey is a vector of the same length as 'this'.
      const ey = axis.copy().cross(this);
      // interpolate the length with 'this' and 'v'.
      const lerpedMagFactor = (1 - amt) + amt * vMag / selfMag;
      // imagine a situation where 'axis', 'this', and 'ey' are pointing
      // along the z, x, and y axes, respectively.
      // rotates 'this' around 'axis' by amt * theta towards 'ey'.
      const cosMultiplier = lerpedMagFactor * Math.cos(amt * theta);
      const sinMultiplier = lerpedMagFactor * Math.sin(amt * theta);
      // then, calculate 'result'.
      this.x = this.x * cosMultiplier + ey.x * sinMultiplier;
      this.y = this.y * cosMultiplier + ey.y * sinMultiplier;
      this.z = this.z * cosMultiplier + ey.z * sinMultiplier;

      return this;
    }
    static add(v1, v2){
      return v1.copy().add(v2);
    }
    static addScalar(v1, v2, s = 1){
      return v1.copy().addScalar(v2, s);
    }
    static sub(v1, v2){
      return v1.copy().sub(v2);
    }
    static mult(v1, a, b, c){
      return v1.copy().mult(a, b, c);
    }
    static div(v1, a, b, c){
      return v1.copy().div(a, b, c);
    }
    static cross(v1, v2){
      return v1.copy().cross(v2);
    }
    static lerp(v1, v2, amt, target){
      // targetを用意することでここにセットされるようにする。
      if (target !== undefined) {
        target.set(v1);
        target.lerp(v2, amt);
        return target;
      }
      return v1.copy().lerp(v2, amt);
    }
    static slerp(v1, v2, amt){
      return v1.copy().slerp(v2, amt);
    }
    static rotate(v, axis, theta){
      return v.copy().rotate(axis, theta);
    }
    static multMat(v, v1, v2, v3){
      return v.copy().multMat(v1, v2, v3);
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
    /*
    // なくしちゃおうね
    // cubemapにも対応してるsetTextureを使ってね
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
    */
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
/*
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
  */
/*
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
*/
  // infoの仕様(example)
  // swapはnodeが要るのでここで判断に入れるのはやめよう
  // {dst:{type:null/"fb", name:dstName},
  //  src:{type:"tex"/"fb", name:srcName, flip:true/false(typeによりデフォ分岐),
  //       view:[0,0,0.5,0.5], align:"left_top" ,attach:"color", index:0},
  //  blend:true/false, blendFunc:{src:"src_alpha", dst:"one_minus_src_alpha"}, depthOff:false/true}
/*
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
  */

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
  /*
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
      // ここでv0,v1,v2のmagはすべて三角形の面積で同一のはず...だけど。
      // それを第一引数とし、第二引数を内積にすれば、0~PIの角度がすべて得られるはず。
      // やってることは2つ。法線はひとつしかないのでそれをv0として出している。それを角度により重み付けしてる。
      // 角度の計算はそれでいいはず。たとえばu0とu1の内積を使ってangle2を出せる。
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
  */

  // ---------------------------------------------------------------------------------------------- //
  // Meshes.

  // もう全部ここにまとめてしまおう。
  const meshUtil = {
    cube:cubeMesh,
    box:boxMesh,
    sphere:sphereMesh,
    ellipsoid:ellipsoidMesh,
    torus:torusMesh,
    plane:planeMesh,
    quad:quadMesh,
    triangle:triangleMesh,
    circle:circleMesh,
    ellipse:ellipseMesh,
    cylinder:cylinderMesh,
    truncatedCone:truncatedConeMesh,
    cone:coneMesh,
    curve:curveMesh,
    band:bandMesh,
    torusKnot:torusKnotMesh,
    icosahedron:icosahedronMesh,
    icoSphere:icoSphereMesh,
    surface:surfaceMesh,
    fs:getFrenetSerret, // 一応。func,t,deltaが引数。
    regist:registMesh,
    create:(() => {return new Geometry()})
  }

  // Partition用の補助関数

  // quadMeshPartition.
  // v0,v1,v2,v3はそれぞれ{v:Vec3, uv:Vec3}というオブジェクトで、
  // dtxとdtyに応じて分割される。結果がmeshに登録される。新たに頂点が追加され、
  // それに基づいて面の番号が追加される。
  // diagonalLineがfalseの場合、対角線は用意されない。
  function quadMeshPartition(mesh, v0, v1, v2, v3, dtx, dty, diagonalLine = true){
    const vn = mesh.v.length/3; // これがベース. 3で割ってね。
    const dx = v1.v.copy().sub(v0.v);
    const dy = v2.v.copy().sub(v0.v);
    const normalVector = dx.copy().cross(dy).normalize();
    for(let k=0; k<=dty; k++){
      const ratioY = k/dty;
      for(let i=0; i<=dtx; i++){
        const ratioX = i/dtx;
        const v01 = v0.v.copy().lerp(v1.v, ratioX);
        const v23 = v2.v.copy().lerp(v3.v, ratioX);
        const v0123 = v01.lerp(v23, ratioY);
        mesh.v.push(...v0123.toArray());
        mesh.n.push(...normalVector.toArray());
        const uv01 = v0.uv.copy().lerp(v1.uv, ratioX);
        const uv23 = v2.uv.copy().lerp(v3.uv, ratioX);
        const uv0123 = uv01.lerp(uv23, ratioY);
        mesh.uv.push(uv0123.x, uv0123.y);
      }
    }
    // 下から上へ
    // lu --- ru
    // || --- ||
    // ld --- rd
    for(let k=0; k<dty; k++){
      for(let i=0; i<dtx; i++){
        const ld = vn + (dtx+1)*k + i;
        const rd = vn + (dtx+1)*k + i+1;
        const lu = vn + (dtx+1)*(k+1) + i;
        const ru = vn + (dtx+1)*(k+1) + i+1;
        mesh.f.push(ld, rd, lu, lu, rd, ru);
        mesh.l.push(ld, rd, ld, lu); // 周だけ
        if (diagonalLine) mesh.l.push(rd, lu); // 対角線
        if (i === dtx-1){
          mesh.l.push(rd, ru);
        }
        if (k === dty-1){
          mesh.l.push(lu, ru);
        }
      }
    }
  }

  // squareMeshPartition.
  // quadでv3がv0とv1から平行四辺形を為すように決まる場合。
  function squareMeshPartition(mesh, v0, v1, v2, dtx, dty, diagonalLine = true){
    const v3 = {};
    const dx = v1.v.copy().sub(v0.v);
    v3.v = v2.v.copy().add(dx);
    const uvx = v1.uv.copy().sub(v0.uv);
    v3.uv = v2.uv.copy().add(uvx);
    quadMeshPartition(mesh, v0, v1, v2, v3, dtx, dty, diagonalLine);
  }

  // triangleMeshPartition.
  // v0,v1,v2が反時計回りになるように法線が決まる。分割もできる。meshに登録する。
  // dt:1...(0,0),(1,0),(0,1)
  // dt:2...(0,0),(1,0),(0,1),(2,0),(1,1),(0,2)って感じです。
  function triangleMeshPartition(mesh, v0, v1, v2, dt){
    const vn = mesh.v.length/3; // これがベース. 3で割ってね。
    const dx = v1.v.copy().sub(v0.v);
    const dy = v2.v.copy().sub(v0.v);
    const normalVector = dx.copy().cross(dy).normalize();
    const uvx = v1.uv.copy().sub(v0.uv);
    const uvy = v2.uv.copy().sub(v0.uv);
    const indices = [];
    let curIndex = 0;
    for(let k=0; k<=dt; k++){
      const ratioY = k/dt;
      indices[k] = [];
      for(let i=0; i<=dt-k; i++){ // i+k=dt
        const ratioX = i/dt;
        const partV = v0.v.copy().addScalar(dx, ratioX).addScalar(dy, ratioY);
        const partUV = v0.uv.copy().addScalar(uvx, ratioX).addScalar(uvy, ratioY);
        mesh.v.push(...partV.toArray());
        mesh.n.push(...normalVector.toArray());
        mesh.uv.push(partUV.x, partUV.y);
        indices[k].push(curIndex++);
      }
    }
    // faceについては想像すればわかるようにi<dt-kのすべてについて計算される形
    // kはdtまで動いていい
    // でもk=dtだと計算されないので実質k<dtか
    // rd,ld,ru,luは一応全部用意する
    // lu --- ru
    // || --- ||
    // ld --- rd
    // ただし、i+k<dt-1の場合だけ。i+k=dt-1の場合、ruは存在しない。
    // ruが存在する場合は逆向きの三角形の面が必要。
    // 線については順方向だけ全部用意すればいい。
    // ldは1を足すだけ。ruが難しい。？kに1を足せばいいのか。
    // iとkからインデックスを出すのは難しいので...インチキする。
    // テーブルを作ってしまえばいい。
    for(let k=0; k<dt; k++){
      for(let i=0; i<dt-k; i++){
        const ld = vn + indices[k][i];
        const rd = vn + indices[k][i+1];
        const lu = vn + indices[k+1][i];
        mesh.f.push(ld, rd, lu);
        if (i+k<dt-1) {
          const ru = vn + indices[k+1][i+1];
          mesh.f.push(lu, rd, ru);
        }
        mesh.l.push(ld, rd, rd, lu, lu, ld); // ひとつだけでOK
      }
    }
  }

  // planeMesh.
  // params: size={x=100,y=100}, auv=[0,1], buv=[1,1], cuv=[0,0], duv=[1,0], detail={x=1,y=1}.
  // sizeは横と縦の幅の半分、detailは横と縦のdetail(1がデフォルト)
  // p5は最小を2としているが不自然なので単純にマスの数にしています
  // auv,buv,cuv,duvはUVを指定するオプションです。
  // 第3引数は使わないので[0,1]とか[1,1]で問題ないです。
  // デフォルトは左下、右下、左上、右上で(0,1),(1,1),(0,0),(1,0).
  // 対角線が要らない場合はdiagonalLineをfalseに指定する
  function planeMesh(params = {}){
    const {size = {}} = params;
    const {x:sx = 100, y:sy = 100} = size;
    params.a = [-sx, -sy, 0];
    params.b = [sx, -sy, 0];
    params.c = [-sx, sy, 0];
    params.d = [sx, sy, 0];
    return quadMesh(params);
  }

  // quadMesh.
  // params: a=[0,0,0], b=[100,0,0], c=[0,100,0], d=[100,100,0],
  //         auv=[0,1], buv=[1,1], cuv=[0,0], duv=[1,0], detail={x=1,y=1}.
  // a,b,c,dは引数としてVec3を生成するので{x,y,z}でも[i,j,k]でもいいです。
  // これらのuvをauv,buv,...で指定します。デフォルトはplaneと同じ。
  // c----d
  // |    |
  // a----b uvも準じる。
  // uvについては第3引数は使わないので[0,1]とか[1,1]で問題ないです。
  function quadMesh(params = {}){
    const {
      a = [0,0,0], b = [100,0,0], c = [0,100,0], d = [100,100,0],
      auv = [0,1,0], buv = [1,1,0], cuv = [0,0,0], duv = [1,0,0],
      detail = {}, diagonalLine = true
    } = params;
    const {x:dtx = 1, y:dty = 1} = detail;
    const mesh = new Geometry();
    const v0 = new Vec3(a);
    const v1 = new Vec3(b);
    const v2 = new Vec3(c);
    const v3 = new Vec3(d);
    const uv0 = new Vec3(auv);
    const uv1 = new Vec3(buv);
    const uv2 = new Vec3(cuv);
    const uv3 = new Vec3(duv);
    quadMeshPartition(
      mesh, {v:v0, uv:uv0}, {v:v1, uv:uv1}, {v:v2, uv:uv2}, {v:v3, uv:uv3}, dtx, dty, diagonalLine
    );
    return mesh;
  }

  // triangleMesh.
  // params: a=[0,0,0], b=[100,0,0], c=[0,100,0], auv=[0,1,0], buv=[1,1,0], cuv=[0,0,0], detail=1.
  // デフォルトでは3つの頂点のUVが左下、右下、左上となっているがオプションで指定できるようにはなってる。
  // 指定の仕方はVec3の引数になるように。[0,0,0]でも{x:0,y:0,z:0}でもVec3()でも自由。
  // uvについては第3引数は使わないので[0,1]とか[1,1]で問題ないです。
  function triangleMesh(params = {}){
    const {
      a = [0,0,0], b = [100,0,0], c = [0,100,0],
      auv = [0,1,0], buv = [1,1,0], cuv = [0,0,0], detail = 1
    } = params;
    const mesh = new Geometry();
    const v0 = new Vec3(a);
    const v1 = new Vec3(b);
    const v2 = new Vec3(c);
    const uv0 = new Vec3(auv);
    const uv1 = new Vec3(buv);
    const uv2 = new Vec3(cuv);
    triangleMeshPartition(
      mesh, {v:v0, uv:uv0}, {v:v1, uv:uv1}, {v:v2, uv:uv2}, detail
    );
    return mesh;
  }

  // cubeMesh.
  // params: size=100, detail=1
  // sizeは1辺の長さの半分でdetailは何分割するかです
  // UVはboxと一緒、展開図方式です。
  // 対角線はdiagonalLine:falseで消せます
  function cubeMesh(params = {}){
    const {size:s = 100, detail:dt = 1, diagonalLine = true} = params;

    return boxMesh({
      size:{x:s, y:s, z:s},
      detail:{x:dt, y:dt, z:dt},
      diagonalLine
    });
  }

  // boxMesh.
  // params: size:{x=100,y=100,z=100}, detail:{x=1,y=1,z=1}
  // x,y,zでそれぞれの軸方向の長さの半分を指定、detailでその方向のディテールを指定します。
  // UVはこんな感じ
  // ・・・x-x-・・・
  // ・・・x-x-・・・
  // ・y-y-z+z+y+y+・
  // ・y-y-z+z+y+y+・
  // ・・・x+x+・・・
  // ・・・x+x+・・・
  // ・・・z-z-・・・
  // ・・・z-z-・・・
  // 対角線が要らない場合はdiagonalLineをfalseに指定する
  function boxMesh(params = {}){
    const {size = {}, detail = {}, diagonalLine = true} = params;
    const {x:sx = 100, y:sy = 100, z:sz = 100} = size;
    const {x:dtx = 1, y:dty = 1, z:dtz = 1} = detail;
    const mesh = new Geometry();
    const vVerts = [];
    const uvVerts = [];
    const addV = (array, x, y, z) => {
      array.push(new Vec3(x, y, z));
    }
    addV(vVerts, -sx, -sy, sz);
    addV(vVerts, sx, -sy, sz);
    addV(vVerts, -sx, sy, sz);
    addV(vVerts, sx, sy, sz);
    addV(vVerts, -sx, -sy, -sz);
    addV(vVerts, sx, -sy, -sz);
    addV(vVerts, -sx, sy, -sz);
    addV(vVerts, sx, sy, -sz);
    addV(uvVerts, 3/8, 0, 0);
    addV(uvVerts, 5/8, 0, 0);
    addV(uvVerts, 3/8, 1/4, 0);
    addV(uvVerts, 5/8, 1/4, 0);
    addV(uvVerts, 3/8, 2/4, 0);
    addV(uvVerts, 5/8, 2/4, 0);
    addV(uvVerts, 3/8, 3/4, 0);
    addV(uvVerts, 5/8, 3/4, 0);
    addV(uvVerts, 3/8, 1, 0);
    addV(uvVerts, 5/8, 1, 0);
    addV(uvVerts, 1/8, 1/4, 0);
    addV(uvVerts, 7/8, 1/4, 0);
    addV(uvVerts, 1/8, 2/4, 0);
    addV(uvVerts, 7/8, 2/4, 0);
    const smp = (i0, i1, i2, k0, k1, k2, dt1, dt2) => {
      squareMeshPartition(
        mesh,
        {v:vVerts[i0], uv:uvVerts[k0]},
        {v:vVerts[i1], uv:uvVerts[k1]},
        {v:vVerts[i2], uv:uvVerts[k2]},
        dt1, dt2,
        diagonalLine
      );
    }
    smp(0,2,4,2,3,0, dty, dtz);
    smp(1,3,0,4,5,2, dty, dtx);
    smp(5,7,1,6,7,4, dty, dtz);
    smp(4,6,5,8,9,6, dty, dtx);
    smp(5,1,4,12,4,10, dtz, dtx);
    smp(3,7,2,5,13,3, dtz, dtx); // 誤字ミス
    return mesh;
  }

  // sphereMesh.
  // params: radius=100, detail={x=16,y=16}, angle={start=0,stop=2pi}, fillType="open"
  // radiusは半径です。詳しくはellipsoidの項にて。
  function sphereMesh(params = {}){
    const {radius:r = 100} = params;
    params.size = {x:r, y:r, z:r};
    return ellipsoidMesh(params);
  }

  // ellipsoidMesh.
  // params: size={x=100,y=100,z=100}, detail={x=16,y=16}, angle={start=0,stop=2pi}, fillType="open"
  // sizeはx,y,zそれぞれの方向の半径。要するに楕円球。ラグビーボール。
  // detailはxが経度のdetailでyが緯度のdetail
  // angleは経度を指定する。半球とかできるわけ。1/4球とか。スイカのイメージ。
  // fillTypeはその際に切り口を埋めるかどうか。
  // UVですが、fillが"open"の場合正方形で、横と縦は角度です。
  // fillする場合はそれが長方形となり、下に半径0.25の円が出来ます。右半分がstart側、左半分がstop側の領域で、つながっています。
  function ellipsoidMesh(params = {}){
    const {size = {}, detail = {}, angle = {}, fillType = "open"} = params;
    const {x:sx = 100, y:sy = 100, z:sz = 100} = size;
    const {x:dtx = 16, y:dty = 16} = detail;
    const {start:angleStart = 0, stop:angleStop = Math.PI*2} = angle;
    const mesh = new Geometry();

    // 北極と南極の頂点は重複させる（風呂敷のイメージ）
    for(let k=0; k<=dty; k++){
      const theta = Math.PI*k/dty;
      for(let i=0; i<=dtx; i++){
        const phi = angleStart + (angleStop - angleStart) * i/dtx;
        const x = Math.sin(theta)*Math.cos(phi);
        const y = Math.sin(theta)*Math.sin(phi);
        const z = Math.cos(theta);
        mesh.v.push(sx*x, sy*y, sz*z);
        mesh.n.push(x, y, z);
        mesh.uv.push(i/dtx, k/dty);
      }
    }
    // 線と面
    // 面は一番上と一番下は片方だけ、中間は両方用意する
    // 線は...まあ適当に。
    // lu --- ru
    // || --- ||
    // ld --- rd
    for(let k=0; k<dty; k++){
      for(let i=0; i<dtx; i++){
        const lu = k*(dtx+1) + i;
        const ld = (k+1)*(dtx+1) + i;
        const ru = lu+1;
        const rd = ld+1;
        // lu,ld,rdの三角形はk===dty-1のときは用意しない
        // lu,rd,ruの三角形はk===0のときは用意しない
        if (k < dty-1) {
          mesh.f.push(lu, ld, rd);
        }
        if (k > 0) {
          mesh.f.push(lu, rd, ru);
        }
        // 線について。縦は全部。横はk>0だけ。
        // 斜めについても頂点が重複しているので問題ないですね。0<k<dty-1だけ。
        mesh.l.push(lu, ld);
        if (k > 0) {
          mesh.l.push(lu, ru);
        }
        if (k > 0 && k < dty-1) {
          mesh.l.push(lu, rd);
        }
      }
    }

    // 側面
    // ellipseMeshを作った方がいいと思う。
    // 正円ならcircleでいいんだけどむずいね
    // ああーーわかったわ
    // 角度計算atan2でやらないとミスるんだ
    if (fillType === "fill") {
      mesh.scaleUV(1, 0.5);
      const startX = sx*Math.cos(angleStart);
      const startY = sy*Math.sin(angleStart);
      const startRadius = Math.hypot(startX, startY);
      const startEllipse = ellipseMesh({
        radius:{a:startRadius, b:sz}, detail:dty,
        angle:{start:-Math.PI/2, stop:Math.PI/2}
      });
      // x軸で回転した後z軸で回転。UVは小さくしてから中央下へ
      startEllipse.rotateX(Math.PI/2).rotateZ(Math.atan2(startY, startX));
      startEllipse.scaleUV(0.5, 0.5).translateUV(0.25, 0.5);
      mesh.composite(startEllipse);

      const stopX = sx*Math.cos(angleStop);
      const stopY = sy*Math.sin(angleStop);
      const stopRadius = Math.hypot(stopX, stopY);
      const stopEllipse = ellipseMesh({
        radius:{a:stopRadius, b:sz}, detail:dty,
        angle:{start:Math.PI/2, stop:Math.PI*3/2}
      });
      // x軸で回転した後z軸で回転、UVは小さくしてから中央下へ
      stopEllipse.rotateX(Math.PI/2).rotateZ(Math.PI + Math.atan2(stopY, stopX));
      stopEllipse.scaleUV(0.5, 0.5).translateUV(0.25, 0.5);
      mesh.composite(stopEllipse);
    }
    return mesh;
  }

  // torusMesh.
  // params: size={a=100,b=30}, detail={a=16,b=16}, angle={start:0,stop=2pi},
  //         fillType={start="open",stop="open"}, uvSwap=false, thetaoffset=0
  // sizeのa,bは長半径、短半径でz軸の周りにトーラスを作る。detailのa,bはそれに応じており、
  // aが外周の分割数、bが筒方向の分割数。angleで部分トーラスにできる。fillTypeで閉じるかどうか決められる。
  // uvはどうなってるかというとfillが共にopenのデフォルトの場合は正方形で
  // uvSwapがfalseのデフォルトの場合は長さ方向がvになる横長の形、uvSwapする場合は筒方向がvになる縦長。
  // thetaOffsetで筒方向の開始点をずらすことができる。
  // fillする場合これが縦が半分の長方形となり、下に半径0.25の円が左右に1個ずつ用意されてそれぞれ
  // start側とstop側の断面の円になる。
  function torusMesh(params = {}){
    const {size = {}, detail = {}, angle = {}, fillType = {}, uvSwap = false, thetaOffset = 0} = params;
    const {a:sa = 100, b:sb = 30} = size;
    const {a:dta = 16, b:dtb = 16} = detail;
    const {start:angleStart = 0, stop:angleStop = Math.PI*2} = angle;
    const {start:fillStart = "open", stop:fillStop = "open"} = fillType;
    const mesh = new Geometry();

    // aは長い方でbは短い方です。
    // 頂点は左から右に並んでいますね。
    // 内側を始点にしたいわね。それをデフォルトにしたい。で、時計回り。
    for(let k=0; k<=dta; k++){
      const phi = angleStart + (angleStop - angleStart) * k/dta;
      for(let i=0; i<=dtb; i++){
        const theta = thetaOffset + Math.PI*2*i/dtb;
        const px = Math.cos(phi);
        const py = Math.sin(phi);
        const nx = -Math.cos(theta)*px;
        const ny = -Math.cos(theta)*py;
        const nz = Math.sin(theta);
        const x = sa*px + sb*nx;
        const y = sa*py + sb*ny;
        const z = sb*nz;
        mesh.v.push(x, y, z);
        mesh.n.push(nx, ny, nz);
        if (!uvSwap) {
          // デフォルト（横長）
          mesh.uv.push(k/dta, i/dtb);
        } else {
          // 逆バージョン（縦長）
          mesh.uv.push(i/dtb, 1-k/dta);
        }
      }
    }

    // 先にdから計算するところが違う。
    // lu --- ru
    // || --- ||
    // ld --- rd
    for(let k=0; k<dta; k++){
      for(let i=0; i<dtb; i++){
        const ld = k*(dtb+1) + i;
        const lu = (k+1)*(dtb+1) + i;
        const rd = ld+1;
        const ru = lu+1;
        mesh.f.push(ld, rd, lu, lu, rd, ru);
        // 線はすべてのld,rd,luで用意すれば足りる。
        mesh.l.push(ld, rd, rd, lu, lu, ld);
      }
    }
    // 以下は埋める場合
    if (fillStart === "fill" || fillStop === "fill"){
      mesh.scaleUV(1, 0.5);
      if (fillStart === "fill"){
        const startCircle = circleMesh({radius:sb, detail:dtb});
        startCircle.rotateX(Math.PI/2).translate(sa, 0, 0).rotateZ(angleStart);
        startCircle.scaleUV(0.5, 0.5).translateUV(0, 0.5);
        mesh.composite(startCircle);
      }
      if (fillStop === "fill"){
        const stopCircle = circleMesh({radius:sb, detail:dtb});
        stopCircle.rotateX(Math.PI/2).rotateZ(Math.PI)
                  .translate(sa, 0, 0).rotateZ(angleStop);
        stopCircle.scaleUV(0.5, 0.5).translateUV(0.5, 0.5);
        mesh.composite(stopCircle);
      }
    }
    return mesh;
  }

  // circleMesh.
  // params: radius=50, detail=16, angle={start=0,stop=2pi}
  // radiusは半径。detailは分割数。詳しくはellipseで。
  function circleMesh(params){
    const {radius:r = 50} = params;
    params.radius = {a:r, b:r};
    return ellipseMesh(params);
  }

  // ellipseMesh.
  // params: radius={a=50,b=50}, detail=16, angle={start=0,stop=2pi}
  // radiusは横と縦の半径。xy平面に平行。angleでstartとstopを指定できる。
  // どんな形でもuvは内接円になる。
  function ellipseMesh(params){
    const {radius = {}, detail:dt = 16, angle = {}} = params;
    const {a:ra = 50, b:rb = 50} = radius;
    const {start:angleStart = 0, stop:angleStop = Math.PI*2} = angle;
    const mesh = new Geometry();
    mesh.v.push(0,0,0);
    mesh.uv.push(0.5,0.5);
    mesh.n.push(0,0,1);
    for(let i=0; i<=dt; i++){
      const currentAngle = angleStart + (angleStop - angleStart) * i/dt;
      const x = Math.cos(currentAngle);
      const y = Math.sin(currentAngle);
      mesh.v.push(ra*x, rb*y, 0);
      // uvは上下逆にする（注意）
      mesh.uv.push(0.5 + 0.5*x, 0.5 - 0.5*y);
      mesh.n.push(0,0,1);
    }
    // 1,2,3,..,dt+1.
    // 0,1,2の0,2,3の...,0,dt,dt+1でフィニッシュ
    for(let i=1; i<=dt; i++){
      mesh.f.push(0,i,i+1);
      mesh.l.push(0,i,i,i+1);
    }
    mesh.l.push(0,dt+1);
    return mesh;
  }

  // cylinderMesh.
  // params: top=100, bottom=0, radius=50, detail={x=16,y=16},
  //         fillType={upper="fill",lower="fill",side="open"}, angle={start=0,stop=2pi}
  // radiusで上下の円の半径を同時に指定する以外はtruncatedConeと完全に同じなので略
  function cylinderMesh(params){
    const {radius:r = 50} = params;
    params.radius = {upper:r, lower:r};
    return truncatedConeMesh(params);
  }

  // truncatedConeMesh.
  // params: top=100, bottom=0, radius={upper=50,lower=50}, detail={x=16,y=16},
  //         fillType={upper="fill",lower="fill",side="open"}, angle={start=0,stop=2pi}
  // いわゆる台柱。プリン型。
  // topとbottomでz軸方向の位置を指定できる。radiusは上下の円の半径。detailはxが横分割数、yが縦分割数。
  // fillTypeは上面を埋めるかどうか、下面を埋めるかどうか、angleがデフォルトでない場合に断面を埋めるかどうか。
  // UVは若干複雑。上下の円を埋めないなら全体になるが、両サイドも埋めないなら正方形で側面全体。
  // 両サイドを埋める場合、断面のUVは台形となり、これに合わせてUVの設定領域が指定される。側面は横に1/2に圧縮される。
  // さらに上下の円も埋めるならば、これら全体が縦に1/2となり上に移動し、左下と右下に小さい円が2つ。これらが上と下の円になる。
  // 側面の対角線が要らない場合はdiagonalLineをfalseに指定する
  function truncatedConeMesh(params, isCone = false){
    const {top = 100, bottom = 0, radius = {}, detail = {}, fillType = {}, angle = {}, diagonalLine = true} = params;
    const {upper:upperRadius = 50, lower:lowerRadius = 50} = radius;
    const {x:dtx = 16, y:dty = 16} = detail;
    const {upper:fillUpper = "fill", lower:fillLower = "fill", side:fillSide = "open"} = fillType;
    const {start:angleStart = 0, stop:angleStop = Math.PI*2} = angle;

    const mesh = new Geometry();

    // 側面
    // sideはdtyで横切りにする
    // 先にQuad用意しましょ
    for(let k=0; k<=dty; k++){
      for(let i=0; i<=dtx; i++){
        const angle = angleStart + (angleStop - angleStart)*i/dtx;
        const h = top * (1-k/dty) + bottom * k/dty;
        const r = upperRadius * (1-k/dty) + lowerRadius * k/dty;
        const theta = Math.atan2(lowerRadius - upperRadius, top - bottom);
        mesh.v.push(r*Math.cos(angle), r*Math.sin(angle), h);
        mesh.n.push(
          Math.cos(angle) * Math.sin(theta),
          Math.sin(angle) * Math.sin(theta),
          Math.cos(theta)
        );
        mesh.uv.push(i/dtx, k/dty); // 基本的には全体
        // つまり側面のない円柱の場合UVは正方形全体
      }
    }
    for(let k=0; k<dty; k++){
      for(let i=0; i<dtx; i++){
        const lu = k*(dtx+1) + i;
        const ld = (k+1)*(dtx+1) + i;
        const ru = lu + 1;
        const rd = ld + 1;
        mesh.f.push(lu, ld, rd, lu, rd, ru);
        mesh.l.push(lu, ld, lu, rd);
        if (k > 0) {
          mesh.l.push(lu, ru);
        }
      }
    }
    // sideがあれば追加する。この場合横に1/2拡大する。
    // coneの場合は三角形にしたい。
    // 頂点が左側は左寄せ、右側は右寄せになっている。
    // そこで通常のtruncatedConeに対しても若干側面のUVをいじることにする。
    // そのまま長方形だと差があるときに歪むので、寄せて台形にする。
    const upperUVLength = (upperRadius < lowerRadius ? upperRadius/lowerRadius : 1);
    const lowerUVLength = (upperRadius < lowerRadius ? 1 : lowerRadius / upperRadius);

    if(fillSide === "fill"){
      mesh.scaleUV(0.5, 1).translateUV(0.25, 0);

      const startSide = (!isCone ? quadMesh({
        a:[0, 0, bottom], b:[lowerRadius, 0, bottom],
        c:[0, 0, top], d:[upperRadius, 0, top],
        auv:[0,1,0], buv:[lowerUVLength,1,0],
        cuv:[0,0,0], duv:[upperUVLength,0,0], detail:{x:1, y:dty},
        diagonalLine
      }) : triangleMesh({
        a:[0, 0, bottom], b:[lowerRadius, 0, bottom], c:[0, 0, top],
        auv:[0,1,0], buv:[1,1,0], cuv:[0,0,0], detail:dty
      }));
      const stopSide = (!isCone ? quadMesh({
        a:[-lowerRadius, 0, bottom], b:[0, 0, bottom],
        c:[-upperRadius, 0, top], d:[0, 0, top],
        auv:[1-lowerUVLength,1,0], buv:[1,1,0],
        cuv:[1-upperUVLength,0,0], duv:[1,0,0], detail:{x:1, y:dty},
        diagonalLine
      }) : triangleMesh({
        a:[-lowerRadius, 0, bottom], b:[0, 0, bottom], c:[0, 0, top],
        auv:[0,1,0], buv:[1,1,0], cuv:[1,0,0], detail:dty
      }));

      startSide.rotateZ(angleStart);
      startSide.scaleUV(0.25, 1);
      mesh.composite(startSide);
      stopSide.rotateZ(Math.PI + angleStop);
      stopSide.scaleUV(0.25, 1).translateUV(0.75, 0);
      mesh.composite(stopSide);
    }
    // 上面か下面があれば追加する
    if(fillUpper === "fill" || fillLower === "fill"){
      mesh.scaleUV(1, 0.5); // 上半分に動かす
      if (fillUpper === "fill"){
        const upperCircle = circleMesh(
          {radius:upperRadius, detail:dtx, angle:{start:angleStart, stop:angleStop}}
        );
        upperCircle.translate(0, 0, top);
        upperCircle.scaleUV(0.5, 0.5).translateUV(0, 0.5);
        mesh.composite(upperCircle);
      }
      if (fillLower === "fill"){
        const lowerCircle = circleMesh(
          {radius:lowerRadius, detail:dtx, angle:{start:-angleStop, stop:-angleStart}}
        );
        lowerCircle.rotateX(Math.PI).translate(0, 0, bottom);
        lowerCircle.scaleUV(0.5, 0.5).translateUV(0.5, 0.5);
        mesh.composite(lowerCircle);
      }
    }
    return mesh;
  }

  // coneMesh.
  // params: top=100, bottom=0, radius=50,, detail={x=16,y=16},
  //         fillType={lower="fill",side="open"}, angle={start=0,stop=2pi}
  // 円錐。truncatedConeの特殊ケースとして扱う。
  // UVですが、この場合三角形のメッシュを用いないと綺麗にならないのでそうすることにした。
  function coneMesh(params){
    const {radius:r = 50, fillType = {}} = params;
    const {lower:fillLower = "fill", side:fillSide = "open"} = fillType;
    params.fillType.upper = "open";
    params.radius = {upper:0, lower:r};
    // coneの場合は側面のUVを三角形にする。でないと汚くなる。
    return truncatedConeMesh(params, isCone = true);
  }

  // getFrenetSerret.
  // funcは1パラメータの曲線で、値はx,y,zを成分にもつ。
  // 接線ベクトルの微分が常に0にならないという条件の下で各ポイントにおける
  // フレネ・セレ標構を取得する為の関数。
  // pnorm,bnorm,tangがx,y,z軸になるイメージ。
  function getFrenetSerret(func, t, delta){
    const cur = new Vec3(func(t));
    const next = new Vec3(func(t+delta));
    const prev = new Vec3(func(t-delta));
    const diffNext = next.copy().sub(cur).normalize();
    const diffPrev = cur.copy().sub(prev).normalize();
    const pnorm = diffNext.copy().sub(diffPrev).normalize();
    const tang = diffNext.copy().normalize();
    const bnorm = tang.copy().cross(pnorm);
    return {cur, pnorm, bnorm, tang};
  }

  // curveMesh.
  // params: func=半径100の円関数, detail={x=16,y=64}, radius=16, end={start=0,stop=1},
  //         fillType={start="open",stop="open"}, uvSwap=false
  // funcは接線ベクトルの微分が0にならない3次元曲線の関数で
  // それの基本0～1の部分に対して筒を作る。そのメッシュ。radiusで半径。detailのxは筒方向、yは長さ方向のdetail.
  // fillTypeで断面を埋めるかどうか決める。uvSwapしないならuvは横長になる。断面を含めたUVの詳細はトーラスと一緒。
  function curveMesh(params = {}){
    // デフォルトの円（トーラスになる）
    const circleFunc = (t) => {return {x:100*Math.cos(Math.PI*2*t), y:100*Math.sin(Math.PI*2*t), z:0}};
    const {func = circleFunc, detail = {}, radius:r = 10, end = {}, fillType = {}, uvSwap = false} = params;
    // dtxは筒の幅、dtyは曲線方向。
    const {x:dtx = 16, y:dty = 64} = detail;
    const {start:a = 0, stop:b = 1} = end;
    const {start:fillStart = "open", stop:fillStop = "open"} = fillType;

    const mesh = new Geometry();
    const startSystem = {};
    const stopSystem = {};

    for(let k=0; k<=dty; k++){
      const t = a + (b-a) * k/dty;
      const delta = (b-a)/dty;
      const fs = getFrenetSerret(func, t, delta);
      // これで基底ができる。tang, pnorm, bnorm.
      if (k===0) {
        startSystem.ax = fs.pnorm.copy();
        startSystem.ay = fs.bnorm.copy();
        startSystem.az = fs.tang.copy();
      }
      if (k===dty) {
        stopSystem.ax = fs.pnorm.copy();
        stopSystem.ay = fs.bnorm.copy();
        stopSystem.az = fs.tang.copy();
      }
      for(let i=0; i<=dtx; i++){
        const phi = Math.PI*2*i/dtx;
        const n = fs.pnorm.copy().mult(Math.cos(phi)).addScalar(fs.bnorm, Math.sin(phi));
        const p = fs.cur.copy().addScalar(n, r);
        mesh.v.push(p.x, p.y, p.z);
        mesh.n.push(n.x, n.y, n.z);
        // xが長さ方向の方が都合がいい場合もあるのでオプションで。
        if (!uvSwap) {
          mesh.uv.push(k/dty, i/dtx); // デフォルト。横長。
        }else{
          mesh.uv.push(i/dtx, 1-k/dty); // 縦長。オプションで。
        }
        // ここ以外は特に変更ないです
      }
    }
    // lu --- ru
    // || --- ||
    // ld --- rd
    for(let k=0; k<dty; k++){
      for(let i=0; i<dtx; i++){
        const ld = k*(dtx+1) + i;
        const lu = (k+1)*(dtx+1) + i;
        const rd = ld+1;
        const ru = lu+1;
        mesh.f.push(ld, rd, lu, lu, rd, ru);
        // 線はすべてのld,rd,luで用意すれば足りる。
        mesh.l.push(ld, rd, rd, lu, lu, ld);
      }
    }
    // fill.
    if (fillStart === "fill" || fillStop === "fill"){
      mesh.scaleUV(1, 0.5);
      if (fillStart === "fill") {
        const startCircle = circleMesh({
          radius:r, detail:dtx
        });
        startCircle.rotateX(Math.PI).rotateZ(Math.PI)
                   .applyMatrix(startSystem.ax, startSystem.ay, startSystem.az)
                   .translate(func(a));
        startCircle.scaleUV(0.5, 0.5).translateUV(0, 0.5);
        mesh.composite(startCircle);
      }
      if (fillStop === "fill") {
        const stopCircle = circleMesh({
          radius:r, detail:dtx
        });
        stopCircle.applyMatrix(stopSystem.ax, stopSystem.ay, stopSystem.az)
                  .translate(func(b));
        stopCircle.scaleUV(0.5, 0.5).translateUV(0.5, 0.5);
        mesh.composite(stopCircle);
      }
    }

    return mesh;
  }

  // bandMesh.
  // params: func:半径100の円関数, bandWidth=100, detail=256, angleOffset=0, angleRotation=0,
  //         end={start=0,stop=2pi}, uvSwap=false.
  // 帯です。bandWidthは幅の半分の長さ。
  // angleOffsetで初期状態の角度の変化を指定し、angleRotationで周回終了時の角度の変化を指定する。
  // たとえば4piなら2回転して戻る。detailは分割数。
  // UVは基本進行方向をvとする横長。swapで縦長にもできる。
  // デフォルトではシャンプーハットみたいになる。たとえばそこに名前を外に向かって連ねたりとか、そういうことができる。
  function bandMesh(params = {}){
    // デフォルトの円（トーラスになる）
    const circleFunc = (t) => {return {x:100*Math.cos(Math.PI*2*t), y:100*Math.sin(Math.PI*2*t), z:0}};
    const {func = circleFunc, bandWidth = 100, detail:dt = 256, angleOffset = 0, angleRotation = 0, end = {}, uvSwap = false} = params;
    const {start:a = 0, stop:b = 1} = end;
    const mesh = new Geometry();

    for(let k=0; k<=dt; k++){
      const t = a + (b-a) * k/dt;
      const delta = (b-a)/dt;
      const fs = getFrenetSerret(func, t, delta);
      // これで基底ができる。tang, pnorm, bnorm.
      // 基本的には長方形をつなげていく
      const currentAngle = angleOffset + angleRotation * k/dt;
      // pnorm方向の±bandWidth/2に頂点を置く。
      // 法線の向きはcos(angle)*bnorm-sin(angle)*pnormです。
      const bandDirection = fs.pnorm.copy().mult(Math.cos(currentAngle)).addScalar(fs.bnorm, Math.sin(currentAngle));
      const leftVertice = fs.cur.copy().addScalar(bandDirection, bandWidth/2);
      const rightVertice = fs.cur.copy().addScalar(bandDirection, -bandWidth/2);
      const bandNormal = fs.bnorm.copy().mult(Math.cos(currentAngle)).addScalar(fs.pnorm, -Math.sin(currentAngle));
      mesh.v.push(...leftVertice.toArray());
      mesh.v.push(...rightVertice.toArray());
      mesh.n.push(...bandNormal.toArray());
      mesh.n.push(...bandNormal.toArray());
      if (!uvSwap) {
        mesh.uv.push(k/dt, 0);
        mesh.uv.push(k/dt, 1);
      } else {
        mesh.uv.push(0, 1-k/dt);
        mesh.uv.push(1, 1-k/dt);
      }
    }
    // これで下から順に0,1,2,3,...
    // lu --- ru
    // || --- ||
    // ld --- rd
    for(let k=0; k<dt; k++){
      const ld = k*2;
      const lu = (k+1)*2;
      const rd = ld+1;
      const ru = lu+1;
      mesh.f.push(ld, rd, lu, lu, rd, ru);
      // 線はすべてのld,rd,luで用意すれば足りる。
      mesh.l.push(ld, rd, rd, lu, lu, ld);
    }
    return mesh;
  }

  // torusKnotMesh.
  // params: size={a=100, b=30}, detail={x=16, y=16}, radius=16, p=3, q=2, uvSwap=false
  // いわゆるトーラスノット
  // p,qで決まる。公式にはpが周回数でqがそれに伴う巻き数。なので、
  // qの方が大きい、すなわち巻き数の方が大きいとコイル状になる。
  // 逆に周回数の方が大きいとロープをまとめたみたいになる。
  // fillTypeとendとfuncが固定。なのでUVは必然的に正方形になる。
  function torusKnotMesh(params = {}){
    const {size = {}, p = 3, q = 2} = params;
    const {a = 100, b = 30} = size;
    const torusKnotFunction = ((t) => {
      const l = a + b * Math.cos(q * t);
      return {
        x:l * Math.cos(p * t),
        y:l * Math.sin(p * t),
        z:b * Math.sin(q * t)
    }});
    params.func = torusKnotFunction;
    params.end = {start:0, stop:Math.PI*2};
    params.fillType = {start:"open", stop:"open"}; // torusKnotはopen/open
    return curveMesh(params);
  }

  // icosahedronMesh.
  // params: radius=100, detail=1
  // 正二十面体。ディテールで各面が三角形分割される。UVは全部ゼロ。
  function icosahedronMesh(params = {}){
    const {radius:r = 100, detail:dt = 1} = params;
    const g = (1 + Math.sqrt(5)) / 4;
    const h = 0.5;
    const l = r/Math.sqrt(g*g+h*h);
    const a = g*l;
    const b = h*l;
    const mesh = new Geometry();

    const vVerts = [];
    const addV = (array, x, y, z) => {
      array.push(new Vec3(x, y, z));
    }
    const zero = new Vec3(0,0,0);
    addV(vVerts, 0, a, b);
    addV(vVerts, b, 0, a);
    addV(vVerts, a, b, 0);
    addV(vVerts, 0, a, -b);
    addV(vVerts, -a, b, 0);
    addV(vVerts, -b, 0, a);
    addV(vVerts, 0, -a, b);
    addV(vVerts, a, -b, 0);
    addV(vVerts, b, 0, -a);
    addV(vVerts, -b, 0, -a);
    addV(vVerts, -a, -b, 0);
    addV(vVerts, 0, -a, -b);
    const makeTriangle = (i, j, k) => {
      triangleMeshPartition(
        mesh,
        {v:vVerts[i], uv:zero},
        {v:vVerts[j], uv:zero},
        {v:vVerts[k], uv:zero},
        dt);
    }
    const faces = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5],
                   [0, 5, 1], [1, 7, 2], [2, 8, 3], [3, 9, 4],
                   [4, 10, 5], [5, 6, 1], [1, 6, 7], [2, 7, 8],
                   [3, 8, 9], [4, 9, 10], [5, 10, 6], [6, 11, 7],
                   [7, 11, 8], [8, 11, 9], [9, 11, 10], [10, 11, 6]];
    for(const face of faces){
      makeTriangle(face[0], face[1], face[2]);
    }
    return mesh;
  }

  // icoSphereMesh.
  // いわゆるico球。paramsは同じ。
  // icosahedronの小さい三角形をすべて球面上に張り付けたもの。
  // 法線は面に垂直なのできれいにモザイクになる。UVは引き続き死んでる。基本的には法線とか別の方法で彩色する。
  function icoSphereMesh(params = {}){
    const {radius:r = 100} = params;
    const icosa = icosahedronMesh(params);
    // mesh.fの3つを取り出してそれに相当するvを3つずつぶちこんで
    // 正規化しつつ法線を計算してnに以下略
    // lについてですが、もとのインデックスから新しいインデックスへのマップを
    // 作ってそれで変換すればいい。
    const mesh = new Geometry();
    const _v = icosa.v;
    const _f = icosa.f;
    const indexMap = new Array(_v.length/3); // 元のindexから新しいindexへのmap
    for(let i=0; i < _f.length/3; i++){
      const v0i = _f[3*i];
      const v1i = _f[3*i+1];
      const v2i = _f[3*i+2];
      indexMap[v0i] = 3*i;
      indexMap[v1i] = 3*i+1;
      indexMap[v2i] = 3*i+2;
      const v0 = new Vec3(_v[3*v0i], _v[3*v0i+1], _v[3*v0i+2]).normalize().mult(r);
      const v1 = new Vec3(_v[3*v1i], _v[3*v1i+1], _v[3*v1i+2]).normalize().mult(r);
      const v2 = new Vec3(_v[3*v2i], _v[3*v2i+1], _v[3*v2i+2]).normalize().mult(r);
      mesh.v.push(...v0.toArray());
      mesh.v.push(...v1.toArray());
      mesh.v.push(...v2.toArray());
      mesh.f.push(3*i, 3*i+1, 3*i+2);
      v1.sub(v0);
      v2.sub(v0);
      const normalVector = v1.cross(v2).normalize();
      mesh.n.push(...normalVector.toArray());
      mesh.n.push(...normalVector.toArray());
      mesh.n.push(...normalVector.toArray());
    }
    for(let k=0; k<icosa.l.length; k++){
      mesh.l.push(indexMap[icosa.l[k]]);
    }
    mesh.uv = icosa.uv; // uvは死んでます。
    return mesh;
  }

  // sとtを元にして曲面を作る
  // 法線は微分で出す感じ
  // ベクトル値2変数関数を引数に取るのだ
  // sが右でtが上のイメージ
  // デフォルトは平面の一部分
  // func:(s,t)=>Vec3(s,t,0);end:{x:{start:0, stop:1}, y:{start:0, stop:1}}
  function surfaceMesh(params = {}){
    const defaultPlaneFunction = (s,t) => { return new Vec3(100*s, 100*t, 0)}
    const {func = defaultPlaneFunction, end = {}, detail = {}} = params;
    const {x:dtx = 32, y:dty = 32} = detail;
    const {x = {}, y = {}} = end;
    const {start:a = 0, stop:b = 1} = x;
    const {start:c = 0, stop:d = 1} = y;

    const mesh = new Geometry();
    for(let k=0; k<=dty; k++){
      for(let i=0; i<=dtx; i++){
        const s = a + (b-a)*i/dtx;
        const t = c + (d-c)*k/dty;
        const deltaX = (b-a)/dtx;
        const deltaY = (d-c)/dty;
        const cur = new Vec3(func(s, t));
        mesh.v.push(cur.x, cur.y, cur.z);
        mesh.uv.push(i/dtx, 1-k/dty);
        const sNext = new Vec3(func(s + deltaX, t));
        const tNext = new Vec3(func(s, t + deltaY));
        const sTang = sNext.sub(cur);
        const tTang = tNext.sub(cur);
        if (sTang.mag() == 0 || tTang.mag() == 0){
          mesh.n.push(0,0,0); continue;
        }
        sTang.normalize();
        tTang.normalize();
        const normalVector = sTang.cross(tTang);
        mesh.n.push(...normalVector.toArray());
      }
    }
    // lu --- ru
    // || --- ||
    // ld --- rd
    for(let k=0; k<dty; k++){
      for(let i=0; i<dtx; i++){
        const ld = (dtx+1)*k + i;
        const rd = (dtx+1)*k + i+1;
        const lu = (dtx+1)*(k+1) + i;
        const ru = (dtx+1)*(k+1) + i+1;
        mesh.f.push(ld, rd, lu, lu, rd, ru);
        mesh.l.push(ld, rd, rd, lu, ld, lu);
        if (i === dtx-1){
          mesh.l.push(rd, ru);
        }
        if (k === dty-1){
          mesh.l.push(lu, ru);
        }
      }
    }
    return mesh;
  }

  // Geometryのクラス。
  // v,n,uv,f,lだけ用意する。
  // メッシュ関数はこれを元にプリミティブを構成して返している。
  // 単独で用いることもできる。
  // translate, rotateXなどの位置変更関数を持つ。
  // invertNormalで法線の向きをすべて逆にしたりできる。UVをいじったり。compositeはいわゆるマージ用。
  // 一部のメッシュ関数はこれを使って円や三角形のメッシュを再利用している。
  class Geometry{
    constructor(){
      this.v = [];
      this.n = [];
      this.uv = [];
      this.f = [];
      this.l = [];
    }
    translate(x, y, z){
      // xが配列かベクトルの場合はそれの成分を使う
      // 数の場合はすべて数とみなし省略は許さない
      const t = Geometry.validateParameter(x, y, z);
      for(let i=0; i<this.v.length/3; i++){
        this.v[3*i] += t.x;
        this.v[3*i+1] += t.y;
        this.v[3*i+2] += t.z;
      }
      return this;
    }
    rotateX(angle){
      // グローバルのx軸の周りに全体を回転させる(xの先っちょから見て反時計)
      for(let i=0; i<this.v.length/3; i++){
        const y = this.v[3*i+1];
        const z = this.v[3*i+2];
        this.v[3*i+1] = y*Math.cos(angle) - z*Math.sin(angle);
        this.v[3*i+2] = y*Math.sin(angle) + z*Math.cos(angle);
        const ny = this.n[3*i+1];
        const nz = this.n[3*i+2];
        this.n[3*i+1] = ny*Math.cos(angle) - nz*Math.sin(angle);
        this.n[3*i+2] = ny*Math.sin(angle) + nz*Math.cos(angle);
      }
      return this;
    }
    rotateY(angle){
      // グローバルのy軸の周りに全体を回転させる
      for(let i=0; i<this.v.length/3; i++){
        const z = this.v[3*i+2];
        const x = this.v[3*i];
        this.v[3*i+2] = z*Math.cos(angle) - x*Math.sin(angle);
        this.v[3*i] = z*Math.sin(angle) + x*Math.cos(angle);
        const nz = this.n[3*i+2];
        const nx = this.n[3*i];
        this.n[3*i+2] = nz*Math.cos(angle) - nx*Math.sin(angle);
        this.n[3*i] = nz*Math.sin(angle) + nx*Math.cos(angle);
      }
      return this;
    }
    rotateZ(angle){
      // グローバルのz軸の周りに全体を回転させる
      for(let i=0; i<this.v.length/3; i++){
        const x = this.v[3*i];
        const y = this.v[3*i+1];
        this.v[3*i] = x*Math.cos(angle) - y*Math.sin(angle);
        this.v[3*i+1] = x*Math.sin(angle) + y*Math.cos(angle);
        const nx = this.n[3*i];
        const ny = this.n[3*i+1];
        this.n[3*i] = nx*Math.cos(angle) - ny*Math.sin(angle);
        this.n[3*i+1] = nx*Math.sin(angle) + ny*Math.cos(angle);
      }
      return this;
    }
    applyMatrix(ax, ay, az){
      // x軸、y軸、z軸をベクトルax,ay,azになるように全体を変換する
      // rotateX,rotateY,rotateZはすべてこれの特殊ケースになる
      // ax,ay,azはベクトルでもいいしx,y,z成分を持っていれば何でもOK
      for(let i=0; i<this.v.length/3; i++){
        const x = this.v[3*i];
        const y = this.v[3*i+1];
        const z = this.v[3*i+2];
        this.v[3*i] = x*ax.x + y*ay.x + z*az.x;
        this.v[3*i+1] = x*ax.y + y*ay.y + z*az.y;
        this.v[3*i+2] = x*ax.z + y*ay.z + z*az.z;
        const nx = this.n[3*i];
        const ny = this.n[3*i+1];
        const nz = this.n[3*i+2];
        this.n[3*i] = nx*ax.x + ny*ay.x + nz*az.x;
        this.n[3*i+1] = nx*ax.y + ny*ay.y + nz*az.y;
        this.n[3*i+2] = nx*ax.z + ny*ay.z + nz*az.z;
      }
      return this;
    }
    rotate(angle, x, y, z){
      // バリデーションは一緒
      // グローバルのベクトル(x,y,z)の周りに全体を回転させる。
      // たとえばrotateXは(angle,1,0,0)と同値。
      const axis = Geometry.validateParameter(x, y, z);
      // おいおいね。
      const L = Math.hypot(axis.x, axis.y, axis.z);
      const a = axis.x/L;
      const b = axis.y/L;
      const c = axis.z/L;
      const s = 1 - Math.cos(angle);
      const t = Math.cos(angle);
      const u = Math.sin(angle);
      // m[0],m[1],m[2]が左、m[3],m[4],m[5]が中央、m[6],m[7],m[8]が右の列ベクトル。
      this.applyMatrix(
        {x:s*a*a + t, y:s*a*b + u*c, z:s*a*c - u*b},
        {x:s*a*b - u*c, y:s*b*b + t, z:s*b*c + u*a},
        {x:s*a*c + u*b, y:s*b*c - u*a, z:s*c*c + t}
      );
      return this;
    }
    scale(sx, sy, sz){
      // 引数が一つの場合は全部同じにしましょう
      // 法線どうしようね...
      // 各成分をs.x,s.y,s.zで割って正規化すればいいはず。
      // たとえば2,1,1の場合はx成分だけ2で割って正規化する。
      const s = Geometry.validateParameter(sx, sy, sz);
      for(let i=0; i<this.v.length/3; i++){
        this.v[3*i] *= s.x;
        this.v[3*i+1] *= s.y;
        this.v[3*i+2] *= s.z;
        const nx = this.n[3*i] / s.x;
        const ny = this.n[3*i+1] / s.y;
        const nz = this.n[3*i+2] / s.z;
        const _norm = Math.hypot(nx, ny, nz);
        this.n[3*i] = nx/_norm;
        this.n[3*i+1] = ny/_norm;
        this.n[3*i+2] = nz/_norm;
      }
      return this;
    }
    invertNormal(){
      // 法線の向きを全部逆にする処理
      // たとえば球やトーラスの内側で描画したい場合など
      for(let i=0; i<this.n.length; i++){
        this.n[i] *= -1;
      }
      return this;
    }
    translateUV(u, v){
      // UVのtranslate
      // 特にバリデーションはかけません
      for(let i=0; i<this.uv.length/2; i++){
        this.uv[2*i] += u;
        this.uv[2*i+1] += v;
      }
      return this;
    }
    scaleUV(su, sv){
      // UVのscale
      // 特にバリデーションはかけません
      for(let i=0; i<this.uv.length/2; i++){
        this.uv[2*i] *= su;
        this.uv[2*i+1] *= sv;
      }
      return this;
    }
    normalize(radius = 100){
      // 一片の長さがradius*2の立方体の中に落とす。
      // x,y,zのmaxとminを取って差を取って最大値を取って2で割ってそれがradiusに
      // なるように中心に対してあれしてあれする
      let xMin = Infinity;
      let xMax = -Infinity;
      let yMin = Infinity;
      let yMax = -Infinity;
      let zMin = Infinity;
      let zMax = -Infinity;
      for(let i=0;i<this.v.length/3; i++){
        xMin = Math.min(this.v[3*i], xMin);
        xMax = Math.max(this.v[3*i], xMax);
        yMin = Math.min(this.v[3*i+1], yMin);
        yMax = Math.max(this.v[3*i+1], yMax);
        zMin = Math.min(this.v[3*i+2], zMin);
        zMax = Math.max(this.v[3*i+2], zMax);
      }
      const xMid = (xMax + xMin) * 0.5;
      const yMid = (yMax + yMin) * 0.5;
      const zMid = (zMax + zMin) * 0.5;
      const _size = Math.max(Math.max((xMax-xMin)*0.5, (yMax-yMin)*0.5), (zMax-zMin)*0.5);
      this.translate(xMid, yMid, zMid);
      this.scale(radius/_size, radius/_size, radius/_size);
      return this;
    }
    composite(mesh){
      // 別のメッシュを結合する。UVもそのままドッキングさせる。
      // 事前に動かしておきましょう。
      const vn = this.v.length/3; // 何で3で割るのを忘れるの？？？？？
      this.v.push(...mesh.v);
      this.n.push(...mesh.n);
      this.uv.push(...mesh.uv);
      // vnだけ全体的にシフトする
      this.f.push(...mesh.f.map((x) => x + vn));
      this.l.push(...mesh.l.map((x) => x + vn));
      return this;
    }
    calcNormal(useMerge = false){
      // 法線を計算する
      // useMergeがtrueでかつmergeDataがUnionFindにより用意されているなら
      // そのデータを使ってrootの頂点のみ法線計算しその結果を引き戻す
      // とりあえず今はナイーブ方式で計算する
      // 大きさは最終的に単純な角度の和となるため、
      // 寄与が小さい場合は無視してかまわないと思う。
      // step1: Nの受け皿を用意
      const vn = this.v.length/3;
      const normals = [];
      for(let i=0; i<vn; i++) normals.push(new Vec3(0,0,0));
      const v0 = new Vec3();
      const v1 = new Vec3();
      const v2 = new Vec3();
      const v01 = new Vec3();
      const v02 = new Vec3();
      const v12 = new Vec3();
      const v012 = new Vec3();
      // step2: fの走査
      const fn = this.f.length/3;
      for(let i=0; i<fn; i++){
        const ids = this.f.slice(3*i, 3*i+3);
        v0.set(this.v.slice(3*ids[0], 3*ids[0]+3));
        v1.set(this.v.slice(3*ids[1], 3*ids[1]+3));
        v2.set(this.v.slice(3*ids[2], 3*ids[2]+3));
        v01.set(v1).sub(v0);
        v02.set(v2).sub(v0);
        v12.set(v2).sub(v1);
        v012.set(v01).cross(v02);
        const area = v012.mag();
        if (area < 0.000001) {
          continue; // 0割回避
        }
        const angle0 = Math.atan2(area, v01.dot(v02));   // 0におけるなす角
        const angle1 = Math.atan2(area, -v01.dot(v12));  // 1におけるなす角
        const angle2 = Math.atan2(area, v02.dot(v12));   // 2におけるなす角
        v012.normalize();
        normals[ids[0]].addScalar(v012, angle0);
        normals[ids[1]].addScalar(v012, angle1);
        normals[ids[2]].addScalar(v012, angle2);
      }
      // step3: 正規化
      for(let i=0; i<vn; i++){
        const v = normals[i];
        const m = v.mag();
        if (m < 0.000001) {
          v.set(0,0,0);
        } else {
          v.div(m);
        }
        this.n[3*i] = v.x;
        this.n[3*i+1] = v.y;
        this.n[3*i+2] = v.z;
      }
      return this;
    }
    static validateParameter(x, y, z, _default = 0){
      if (x === undefined) { x = _default; }
      const result = {};
      if (typeof x === 'number') {
        result.x = x;
        result.y = (y === undefined ? x : y);
        result.z = (z === undefined ? y : z);
      } else if (x instanceof Array || x instanceof Float32Array || x instanceof Uint8Array){
        result.x = x[0];
        result.y = x[1];
        result.z = x[2];
      }
      if (result.x !== undefined) return result;
      return x; // xがすでにベクトルなどの場合
    }
  }

  // 立方体
  // まあキューブマップ使いましょうね
  /*
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
    const n = getNormals(v, f);
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
  */

  // v, n, uv, fは予約されているとする。
  // 他にも使いたい場合は配列の形で付加的に用意する。
  // まずメッシュ、次いで名前、最後に追加のattr
  // たとえば{name:"aColor", size:4, data:頂点色データ}
  // こんな感じ。要するに普通にattrを追加するだけ。
  // IBOは普通にname + IBOになるので注意しましょう
  // IBOが複数ある場合に対応させるのと
  // largeを自動的に付与させるように仕様変更
  function registMesh(node, mesh, meshName, optionalData = {}){
    const attrData = [];
    // aPosition, aNormal, aTexCoordにpropertyを追加する為のオプション
    // たとえばaPositionにusage:"dynamic_copy"とoutIndex:0を追加したいなら、単純にv:{usage:~~~, outIndex:~~~}でいい。
    // TF-INSTANCEDの場合はdivisorも指定しないといけないようです...レアケースかもしれないけど。
    const {v = {}, n = {}, uv = {}} = optionalData;
    const vData = {name:"aPosition", size:3, data:mesh.v};
    for(const prop of Object.keys(v)) vData[prop] = v[prop];
    const nData = {name:"aNormal", size:3, data:mesh.n};
    for(const prop of Object.keys(n)) nData[prop] = n[prop];
    const uvData = {name:"aTexCoord", size:2, data:mesh.uv};
    for(const prop of Object.keys(uv)) uvData[prop] = uv[prop];
    attrData.push(vData, nData, uvData);
    // これだとインスタンシングやトラフィーに対応できないのでそのままぶち込めばいい
    /*
    for(const attr of otherAttrs){
      attrData.push({name:attr.name, size:attr.size, data:attr.data});
    }
    */
    const {otherAttrs = [], otherIndices = []} = optionalData;
    if (otherAttrs.length > 0) { attrData.push(...otherAttrs); }
    // そのうえでregistFigureすればいい
    node.registFigure(meshName, attrData);
    // fのIBOを設定する。無くてもいいようにする。
    if (mesh.f !== undefined) {
      node.registIBO(meshName + "IBO", {data:mesh.f, large:(mesh.f.length > 65535)});
    }
    // 追加でIBOがあればそれも登録する。
    if (otherIndices.length > 0) {
      for (const iboData of otherIndices) {
        node.registIBO(iboData.name + "IBO", {data:iboData.data, large:(iboData.length > 65535)});
      }
    }
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
      //this.prepareDefault(); // defaultShaderの構築
      this.inTransformFeedback = false; // TFしてるかどうかのフラグ
      this.blendState = {use:false, state:[]}; // use, state.

      // 一般的なboard. 要するにfoxBoardって書けば普通にこれ使えるので、もういちいち用意しなくていいんよ。
      // drawArraysは"triangle_strip"です。板ポリ全般で使えます。
      this.registFigure("foxBoard", [{size:2, name:"aPosition", data:[-1,-1,1,-1,-1,1,1,1]}]);
    }
    enableExtensions(){
      // color_buffer_floatのEXT処理。pavelさんはこれ使ってwebgl2でもfloatへの書き込みが出来るようにしてた。
      // これによりframebufferはFRAMEBUFFER_COMPLETEを獲得する：https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float
      // 書き込み可能になるInternalFormatは「gl.R16F, gl.RG16F, gl.RGBA16F, gl.R32F, gl.RG32F, gl.RGBA32F, gl.R11FG11FB10F」？
      // 最後のはなんじゃい...
      this.gl.getExtension('EXT_color_buffer_float');
    }
    //prepareDefault(){ // 廃止
      // copy.
      //const _copy = getCopyShaders();
      //this.registPainter("foxCopyPainter", _copy.v, _copy.f);



      // 4枚のquad. 必要なだけ使う。UVは表示する際に適宜いじる。indexで位置を決めるのでaPositionは不要。
      /*
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
      */
    //}
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
      // blendのenable時にフラグを立てる
      if (name === "blend") this.blendState.use = true;
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
    /*
    // どっちも廃止
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
    */
    applyBlend(data){
      if (typeof data === "string") {
        // とりあえずblendだけ用意しました
        switch(data) {
          case "blend":
            this.applyBlend(["one", "one_minus_src_alpha"]);
            break;
        }
        return this;
      } else if (Array.isArray(data)) {
        const _data = data.slice();
        switch(_data.length) {
          case 1:
            _data.push(data[0], data[0], data[0]);
            break;
          case 2:
            // srcRGB, dstRGBの場合はsrcA, dstAにそれぞれ同じものが使われる
            _data.push(data[0], data[1]);
            break;
          case 3:
            _data.push(data[2]);
            break;
        }
        if (typeof _data[0] === 'number') {
          this.blendState.state = [_data[0], _data[1], _data[2], _data[3]];
          this.gl.blendFuncSeparate(...this.blendState.state);
        } else if (typeof _data[0] === 'string'){
          this.blendState.state = [this.dict[_data[0]], this.dict[_data[1]], this.dict[_data[2]], this.dict[_data[3]]];
          this.gl.blendFuncSeparate(...this.blendState.state);
        }
      }
      return this;
    }
    disable(name){
      if(this.dict[name] === undefined){
        myAlert("disable failured: invalid name.");
        return null;
      }
      // 非有効化(cull_face, depth_test, blend)
      this.gl.disable(this.dict[name]);
      if (name === "blend") this.blendState.use = false;
      return this;
    }
    registPainter(name, vs, fs, outVaryings = []){
      // outVaryingsが[]かどうかで分岐処理する(TFに使う)
      const newPainter = new Painter(this.gl, name, vs, fs, outVaryings);
      this.painters[name] = newPainter;
      return this;
    }
    getPainter(name){
      // uniformの情報とか取得できるので、まあ必要な場合もあるかな、と。
      const _painter = this.painters[name];
      if (_painter === undefined) {
        myAlert("getPainter() failed: invalid name.");
        return null;
      }
      return _painter;
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
      const newTexture = new Texture(this.gl, info, this.dict);
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
    /*
    // これもなくしちゃおうね
    // もう不要なので
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
    */
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
      if(kind !== undefined && (typeof kind !== 'string')){
        // MRTでkindを数字にしてしまうエラーが頻発してるので。
        myAlert("setFBOtexture2D failure: 'kind' must be string. Ordinary value is 'color'.");
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
        //this.setTexture2D(uniformName, _texture_double);
        this.setTexture(uniformName, _texture_double);
        return this;
      }
      // 通常時
      // 配列の場合は...
      const _texture = (Array.isArray(fbo[kind]) ? fbo[kind][index] : fbo[kind]);
      //this.setTexture2D(uniformName, _texture);
      this.setTexture(uniformName, _texture);
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
    drawCall(callName, mode, options = {}){
      // 総合ドローコール関数
      // 元のあれこれもそのままおいとくけどね。後方互換性。なくすかも...しれないが...
      // type: arrays, elements, arraysInstanced, elementsInstanced.
      // mode: triangles, lines, points, triangle_strip, 以下略
      // options: first(基本0), count(基本計算済みだがTF-INSTANCEDでは使う場合も？), blend.
      const {first = 0, count = this.currentFigure.count, blend = "", instanceCount = 1} = options;
      // blendが""のデフォの場合、blendが非有効であれば有効化されないし、何も起きない。
      // 有効なら外部でapplyBlendで設定したblendingがそのまま使われる。要するに特別なことを何もしない。
      // blendに有効な引数が入ってる場合には有効化される。
      // 但し、blendに"disable"を指定すると、有効であっても、一時的にnon-blendで描画される（ケースが思いつかないが）
      // 有効かどうか調べておく
      const blendEnabled = this.blendState.use;
      // 一時的に特別な指定をする場合は現在の状態を記録して保存しておく。
      const curBlend = this.blendState.state.slice();
      // blendがdisableの場合は非有効にする
      if (blend === "disable"){
        this.disable("blend");
      } else if (blend !== "") {
        this.enable("blend"); // ""でも"disable"でもなければ有効にする
        // blendを適用する。disableならすべきことはない。
        this.applyBlend(blend);
      }
      switch(callName) {
        case "arrays":
          this.gl.drawArrays(this.dict[mode], first, count); break;
        case "elements":
          this.gl.drawElements(this.dict[mode], this.currentIBO.count, this.currentIBO.intType, 0); break;
        case "arraysInstanced":
          this.gl.drawArraysInstanced(this.dict[mode], first, count, instanceCount); break;
        case "elementsInstanced":
          this.gl.drawElementsInstanced(this.dict[mode], this.currentIBO.count, this.currentIBO.intType, 0, instanceCount); break;
      }
      // blendの有効状態を復元する。描画の前後で異なってはならない。
      // もともと有効なら有効にする。もともと非有効なら非有効に戻す。重複しても問題ない。
      if (blendEnabled){ this.enable("blend"); } else { this.disable("blend"); }
      // blendの状態を復元する。復元する必要があるのは""でも"disable"でもない場合だけ。
      if (blend !== "disable" && blend !== "") this.applyBlend(curBlend);
      return this;
    }
    drawArrays(mode, options = {}){
      this.drawCall("arrays", mode, options);
      return this;
    }
    drawElements(mode, options = {}){
      this.drawCall("elements", mode, options);
      return this;
    }
    drawArraysInstanced(mode, options = {}){
      this.drawCall("arraysInstanced", mode, options);
      return this;
    }
    drawElementsInstanced(mode, options = {}){
      this.drawCall("elementsInstanced", mode, options);
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
      w.div(divider); // dividerで割る
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
  // For Camera.
  // ビューとプロジェクションを担うパート。
  // まずPrototypeがあり、ビュー関連は共通なのでここに主にビューの処理を書く
  // 次いで射影の種類ごとに2種類のカメラを用意する。PerspectiveとOrthographic.
  // メソッド、使い方
  // まず雑に作りたいなら同じアスペクト比で{w:4,h:4}とか{w:640,h:480}ってやればいい
  // nearとかfarをいじりたい場合はお好みで
  // eye,center,topは配列で指定する
  // メソッド一覧...

  class CameraPrototype{
    constructor(data){
      this.cameraType = "";
      this.view = {};
      this.proj = {};
      this.view.eye = new Vec3();
      this.view.center = new Vec3();
      this.view.top = new Vec3();
      this.view.side = new Vec3();
      this.view.up = new Vec3();
      this.view.front = new Vec3();
      this.viewMat = new Mat4();
      this.projMat = new Mat4();
      this.setView(data);
      this.setProj(data);
      // stateを記録して、自由にロードしたり、補間したり、
      // 取り出して他のカメラにコピーしたり、自由自在。
      this.states = {};
      this.setState("default"); // 一番最初の状態をデフォルトで記録
    }
    setView(data){
      // eyeのデフォルトは画面のサイズの縦半分のsqrt(3)倍でいいと思う
      // centerは(0,0,0)でtopは(0,1,0)でいいと思う。配列で定義する。
      // そこからメソッドでfront,side,upを計算して...OK.
      const {w = window.innerWidth, h = window.innerHeight} = data;
      const {eye = [0, 0, h * 0.5 * Math.sqrt(3)]} = data;
      const {center = [0, 0, 0]} = data;
      const {top = [0, 1, 0]} = data;
      this.view.eye.set(eye);
      this.view.center.set(center);
      this.view.top.set(top);
      this.calcViewMat();
    }
    updateView(data){
      // eye,center,topのうち部分的に書き換えたい場合の処理
      // setViewだと全部必要になる。この辺整備されてなかったので。
      const {
        eye:newEye = this.view.eye,
        center:newCenter = this.view.center,
        top:newTop = this.view.top
      } = data;
      this.view.eye.set(newEye);
      this.view.center.set(newCenter);
      this.view.top.set(newTop);
      this.calcViewMat();
    }
    setProj(data){
      // 継承により異なる。最終的に行列を計算する。
    }
    updateProj(data){
      // projのうち部分的に書き換える場合の処理。
    }
    getView(){
      return this.view;
    }
    getProj(){
      return this.proj;
    }
    calcViewMat(){
      // eye, center, topからside, up, frontを計算するパート
      const {eye, center, top, side, up, front} = this.view;
      // front(z axis). center -> eye, のunit vector.
      front.set(eye).sub(center).normalize();
      // side(x axis). topに直交する。横方向。
      side.set(top).cross(front).normalize();
      // up(y axis). frontとsideの外積。
      up.set(front).cross(side).normalize();
      // side,up,frontからなる右手系がカメラ座標系となる
      const data = [side.x, up.x, front.x, 0,
                    side.y, up.y, front.y, 0,
                    side.z, up.z, front.z, 0,
                    0, 0, 0, 1];
      this.viewMat.set(data);
      // eyeの分だけ平行移動したら完成。
      this.viewMat.translate(-eye.x, -eye.y, -eye.z);
    }
    calcProjMat(){
      // 継承でいろいろ. 内容はモードにより異なります。
    }
    copy(){
      // 必須。viewについては共通の処理です。projは場合分けが必要です。
      // dataの内容は参考資料でしかないのでこれでいけるんですよ～～
      // statesについてはコピーしない方が自然だと思うのでコピーしません。
      // 今気づいたけどああそうか
      // これだとthis.viewにnearやfarが定義されてしまうわね
      // やばいね
      // 直します
      const data = {
        eye:this.view.eye,
        center:this.view.center,
        top:this.view.top
      };
      data.near = this.proj.near;
      data.far = this.proj.far;
      switch(this.cameraType){
        case "perspective":
          data.fov = this.proj.fov;
          data.aspect = this.proj.aspect;
          return new PerspectiveCamera(data);
        case "orthographic":
          data.cw = this.proj.cw;
          data.ch = this.proj.ch;
          return new OrthographicCamera(data);
      }
      return this;
    }
    setState(name){
      const state = {};
      state.view = this.createViewState();
      state.proj = this.createProjState();
      this.states[name] = state;
    }
    createViewState(){
      const viewState = {};
      const {eye, center, top, side, up, front} = this.view;
      viewState.eye = eye.copy();
      viewState.center = center.copy();
      viewState.top = top.copy();
      viewState.side = side.copy();
      viewState.up = up.copy();
      viewState.front = front.copy();
      viewState.mat = this.viewMat.copy();
      return viewState;
    }
    createProjState(){
      // 内容はそれぞれ
      return {};
    }
    loadState(name){
      // 記録したstateに移す。その瞬間に移す。
      this.loadViewState(name);
      this.loadProjState(name);
    }
    loadViewState(name){
      const {eye, center, top} = this.view;
      const v = this.states[name].view;
      eye.set(v.eye);
      center.set(v.center);
      top.set(v.top);
      this.calcViewMat();
    }
    loadProjState(name){
      this.calcProjMat();
    }
    lerpState(fromStateName, toStateName, amt){
      // fromとtoをamtでlerpする形。事前の射影をいじる処理を個別に用意する。
      // そこから先は共通の処理とする。
      // 射影ですが、線形補間でいいと思う。ただfovはtanの線形補間の方がいい？
      // 本家で成分の対数補間してるのでそれで。
      if (amt === 0){
        this.loadState(fromStateName);
        return;
      } else if (amt === 1){
        this.loadState(toStateName);
        return;
      }
      const from = this.states[fromStateName];
      const to = this.states[toStateName];
      this.lerpProjState(from.proj, to.proj, amt);
      this.lerpViewState(from.view, to.view, amt);
    }
    lerpProjState(fromProjState, toProjState, amt){
      // 個別の処理
    }
    lerpViewState(fromViewState, toViewState, amt){
      // 共通の処理
      const {eye:fromEye, center:fromCenter, mat:fromMat, front:fromFront, up:fromUp} = fromViewState;
      const {eye:toEye, center:toCenter, mat:toMat, front:toFront, up:toUp} = toViewState;
      const fromDist = fromEye.dist(fromCenter);
      const toDist = toEye.dist(toCenter);
      // distは常に正であることが求められているのよね
      const lerpedDist = fromDist * Math.pow(toDist / fromDist, amt);
      // この後の処理は視点と中心をどう補間したらいいかっていう話ですね
      // 最初はcenterを補間してfrontでeyeを決めてたんですけどなんか綺麗じゃないなと
      // eyeが動かない場合eyeの方がいいだろう
      // 色々考えた結果fromの線分上の点とtoの線分上の点で同じ割合の点の間の距離をざーっと見て行って
      // 最小になるところを見てそこで補間して途中の点を決めてそれとfrontベクトルからcenterとeyeを決めるといいだろう
      // ということになりました。以下はその計算になります。
      const eyeDiff = fromEye.copy().sub(toEye);
      const diffDiff = fromEye.copy().sub(toEye).sub(fromCenter).add(toCenter);
      const divider = diffDiff.magSq(); // magSqで書き直し
      let ratio = 1; // default.
      // dividerはfromのベクトルとtoのベクトルの差を表すものですから、これが大きさ小さい場合は
      // どこを中心にとっても大差ないわけ。
      if (divider > 0.000001){
          ratio = eyeDiff.dot(diffDiff) / divider;
          ratio = Math.max(0, Math.min(ratio, 1));
      }
      // これが補間された重心で、このあとでこれとratioと補間されたfrontを使ってeyeとcenterの位置を決める。
      const lerpedMedium = fromEye.copy().lerp(fromCenter, ratio).lerp(toEye.copy().lerp(toCenter, ratio), amt);
      // 3x3部分を取り出す処理
      const fromRotMat = fromMat.getMat3();
      const toRotMat = toMat.getMat3();
      // 新しいあれ。必要なのはfrontだけ。p5と違ってeyeやcenterをベクトルで保持しているので新しく作る必要がありません。
      const newFront = new Vec3();
      // deltaRotの計算ですが、問題ないです。そのまま実行できます。
      // 直交行列は転置が逆行列なのです。要するに、差を取っています。
      const deltaRot = getMult3x3(toRotMat, getTranspose3x3(fromRotMat));
      const diag = [deltaRot[0], deltaRot[4], deltaRot[8]];
      // 直交行列のトレースは直交行列の「角度」のcos値なのでそれを使ってcosを出してる
      // 具体的には1+2cos(theta)になるので1を引いて2で割ればよい
      let cosTheta = 0.5 * (diag[0] + diag[1] + diag[2] - 1.0);
      // そして直交行列ってトレースが1に近いと単位行列にガチで近くなるっていうすげぇ性質があってですね。
      // なのでこの場合ベクトルの距離も近くなるんですよ（というかほぼ同値）
      // ゆえに線形補間で間に合っちゃったりします。以下はその計算...
      if (1 - cosTheta < 0.0000001) {
        newFront.set(fromFront).lerp(toFront, amt).normalize();
        this.view.eye.set(newFront).mult(ratio * lerpedDist).add(lerpedMedium);
        this.view.center.set(newFront).mult((ratio-1) * lerpedDist).add(lerpedMedium);

        // upをtopとしてセットします。途中経過においてはこれで問題ありません。
        this.view.top.set(fromUp).lerp(toUp, amt).normalize();
        this.calcViewMat();
        return;
      }
      // 以下は一般の場合です。deltaRotは配列なのでmat3とか変な操作は必要ないです。
      let a, b, c, sinTheta;
      let invOneMinusCosTheta = 1 / (1 - cosTheta);
      const maxDiag = Math.max(diag[0], diag[1], diag[2]);
      const offDiagSum13 = deltaRot[1] + deltaRot[3];
      const offDiagSum26 = deltaRot[2] + deltaRot[6];
      const offDiagSum57 = deltaRot[5] + deltaRot[7];
      // 何をしているのかというと回転行列でdeltaRotを表したいんですよね。その成分を求めてる。
      // 補間するには「角度」を引きずり出す必要がある。それをamtで補間し、最終的に補間された回転行列とする。
      if (maxDiag === diag[0]) {
        a = Math.sqrt((diag[0] - cosTheta) * invOneMinusCosTheta); // not zero.
        invOneMinusCosTheta /= a;
        b = 0.5 * offDiagSum13 * invOneMinusCosTheta;
        c = 0.5 * offDiagSum26 * invOneMinusCosTheta;
        sinTheta = 0.5 * (deltaRot[7] - deltaRot[5]) / a;

      } else if (maxDiag === diag[1]) {
        b = Math.sqrt((diag[1] - cosTheta) * invOneMinusCosTheta); // not zero.
        invOneMinusCosTheta /= b;
        c = 0.5 * offDiagSum57 * invOneMinusCosTheta;
        a = 0.5 * offDiagSum13 * invOneMinusCosTheta;
        sinTheta = 0.5 * (deltaRot[2] - deltaRot[6]) / b;

      } else {
        c = Math.sqrt((diag[2] - cosTheta) * invOneMinusCosTheta); // not zero.
        invOneMinusCosTheta /= c;
        a = 0.5 * offDiagSum26 * invOneMinusCosTheta;
        b = 0.5 * offDiagSum57 * invOneMinusCosTheta;
        sinTheta = 0.5 * (deltaRot[3] - deltaRot[1]) / c;
      }
      // これでできあがり。
      const angle = amt * Math.atan2(sinTheta, cosTheta);
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const oneMinusCosAngle = 1 - cosAngle;
      const ab = a * b;
      const bc = b * c;
      const ca = c * a;
      // 0,1,2で1行目、3,4,5で2行目、6,7,8で3行目
      const lerpedRotMat = [
        cosAngle + oneMinusCosAngle * a * a,
        oneMinusCosAngle * ab - sinAngle * c,
        oneMinusCosAngle * ca + sinAngle * b,
        oneMinusCosAngle * ab + sinAngle * c,
        cosAngle + oneMinusCosAngle * b * b,
        oneMinusCosAngle * bc - sinAngle * a,
        oneMinusCosAngle * ca - sinAngle * b,
        oneMinusCosAngle * bc + sinAngle * a,
        cosAngle + oneMinusCosAngle * c * c
      ];
      // Vec3のmultMatを修正したので転置はもう不要です。
      newFront.set(fromFront).multMat(lerpedRotMat);
      this.view.eye.set(newFront).mult(ratio * lerpedDist).add(lerpedMedium);
      this.view.center.set(newFront).mult((ratio-1) * lerpedDist).add(lerpedMedium);
      this.view.top.set(fromUp).multMat(lerpedRotMat);
      this.calcViewMat();
      return;
    }
    getViewMat(){
      // これがないとLSに組み込めないので
      return this.viewMat;
    }
    getProjMat(){
      // 継承を使うのでこれでいいですね
      return this.projMat;
    }
    dolly(value){
      // valueが正の時遠ざかる感じで
      const {eye, center, front} = this.view;
      let distance = eye.dist(center);
      distance *= Math.pow(10, value);
      eye.set(center).addScalar(front, distance);
      this.calcViewMat();
    }
    angle(theta, upperLimit = 1.56, lowerLimit = -1.56){
      // topを変えずにeyeのcenterに向かうベクトルを上下に回す
      // topを追い越さないよう制限を掛ける
      // sideとtopで外積を作って角度と足して制限かけて計算しなおし
      const {eye, center, top, side, up, front} = this.view;
      const distance = eye.dist(center);
      // topに直交するベクトルでtop基準の0°をあらわすもの
      const vertical = side.copy().cross(top);
      // これとfrontの外積はfrontが下側のときsideと逆、上側のときsideと同じ方向
      const horizontal = vertical.copy().cross(front);
      // ゆえに-を付ける。大きさは角度のsin.
      const directionSign = -Math.sign(horizontal.dot(side));
      // 角度のcosは内積で出せる。両者からatan2で角度を出す。符号をつける。
      const curAngle = Math.atan2(horizontal.mag(), vertical.dot(front))*directionSign;
      // 符号付きの値はtopと真逆で-PI/2付近、順でPI/2付近。ここに加えて制限を付ける。
      const finalAngle = Math.max(Math.min(curAngle + theta, upperLimit), lowerLimit);
      // 角度が決まったので、verticalとtopと角度から新しいeyeの位置を計算する。
      eye.set(center).addScalar(vertical, distance * Math.cos(finalAngle)).addScalar(top, distance * Math.sin(finalAngle));
      this.calcViewMat();
      // なおtiltの場合は、似たような計算をcenterに対して実行する。
    }
    spin(phi){
      // topの周りにcenterからeyeに向かうベクトルを回す
      const {eye, center, top} = this.view;
      eye.sub(center).rotate(top, phi).add(center);
      this.calcViewMat();
    }
    rotate(phi, axis){
      // eyeからcenterに向かうベクトルとtopの双方をaxisの周りにphiだけ回転
      const {eye, center, top} = this.view;
      eye.sub(center).rotate(axis, phi).add(center);
      top.rotate(axis, phi);
      this.calcViewMat();
    }
    move(v){
      // eyeとcenterをvだけ移動する。
      const {eye, center} = this.view;
      eye.add(v);
      center.add(v);
      this.calcViewMat();
    }
    moveNDC(dx, dy){
      // centerをNDCに変換し、それにdx,dyを足す。正規化デバイス上で足す。
      // 足した結果を引き戻し、同じ深さの点にcenterを移し、viewを再計算。
      const {eye, center} = this.view;
      const centerNDC = this.getNDC(center);
      centerNDC.add(dx, dy, 0);
      const newCenter = this.getParallelPosition(center, centerNDC.x, centerNDC.y);
      const moveVector = newCenter.sub(center);
      center.add(moveVector);
      eye.add(moveVector);
      this.calcViewMat();
    }
    lookAt(v){
      // centerをベクトルvにするだけ
      this.view.center.set(v);
      this.calcViewMat();
    }
    pan(phi){
      // topの周りに視点から中心に向かうベクトルを回転させる。
      // phiが正なら対象物は右に動くように見える仕様。(p5と同じ仕様)
      // phiの符号を回転の向き（軸を矢印から見た場合の向き）と考えれば妥当です
      const {center, eye, top} = this.view;
      center.sub(eye).rotate(top, phi).add(eye);
      this.calcViewMat();
    }
    tilt(theta, upperLimit = 1.56, lowerLimit = -1.56){
      // 視点を中心方向から上下に動かす。topを超えて動かすことは想定していない。
      // thetaが正なら対象物は下に動くように見える仕様
      // p5と逆だがp5はy軸が下方向なので結局同じ仕様になっています（ややこしい！）
      const {eye, center, top, side, up, front} = this.view;
      const distance = eye.dist(center);
      // topに直交するベクトルでtop基準の0°をあらわすもの
      const vertical = side.copy().cross(top);
      // これとfrontの外積はfrontが下側のときsideと逆、上側のときsideと同じ方向
      const horizontal = vertical.copy().cross(front);
      // ゆえに-を付ける。大きさは角度のsin.
      const directionSign = -Math.sign(horizontal.dot(side));
      // 角度のcosは内積で出せる。両者からatan2で角度を出す。符号をつける。
      // eyeからcenterに向かうベクトルの振れ具合はこれのマイナスですから、
      // そういう意味でマイナスの符号をつける
      const curAngle = -Math.atan2(horizontal.mag(), vertical.dot(front))*directionSign;
      // 符号付きの値はtopと真逆で-PI/2付近、順でPI/2付近。ここに加えて制限を付ける。
      const finalAngle = Math.max(Math.min(curAngle + theta, upperLimit), lowerLimit);
      // 角度が決まったので、verticalとtopと角度から新しいcenterの位置を計算する。
      // eye側が始点なのでverticalを逆にする
      center.set(eye).addScalar(vertical, -distance*Math.cos(finalAngle)).addScalar(top, distance*Math.sin(finalAngle));
      this.calcViewMat();
    }
    roll(theta){
      // 単純に視点から中心に向かうベクトルの周りにtopを回転させる仕様
      // 横揺れを表現するのに使う
      // 正の時frontから見て正方向の回転をtopに施すので右側が下に傾く
      const {top, front} = this.view;
      top.rotate(front, theta);
      this.calcViewMat();
    }
    getViewPosition(p){
      // pはVec3です。View座標を出します。eyeを引いてviewMatをapply.
      // これapplyProjが正解ですね...
      const q = p.copy().sub(this.eye);
      this.viewMat.applyProj(q);
      return q;
    }
    getNDC(p){
      // グローバルのpに対してNDCを出す
      const q = this.getViewPosition(p);
      this.projMat.applyProj(q);
      return q;
    }
    getViewPositionFromNDC(x, y, z){
      // NDCのx,yに対してview座標がzであるようなview座標のベクトルを返す
    }
    getParallelPosition(p, x, y){
      // グローバルのpに対してNDCがx,yでpと同じview座標のz成分を持つ
      // グローバルの点を返す関数
      const pView = this.getViewPosition(p);
      const q = this.getViewPositionFromNDC(x, y, pView.z);
      // viewMatをtransposeしないで掛けてeyeを足す
      this.viewMat.apply(q, false);
      q.add(this.view.eye);
      return q;
    }
  }

  class PerspectiveCamera extends CameraPrototype{
    constructor(data = {}){
      super(data);
      this.cameraType = "perspective";
    }
    setProj(data){
      // デフォルトのaspectはw/hでfovはPI/3ですね
      // nearとfarについてはeyeとcenterから計算されるので
      // そういうのがあることを前提とします
      const {w = window.innerWidth, h = window.innerHeight} = data;
      const {fov = Math.PI / 3} = data;
      const {aspect = w/h} = data;
      const {eye, center} = this.view;
      const distance = eye.dist(center);
      const {near = distance * 0.1} = data;
      const {far = distance * 10} = data;
      this.proj.fov = fov;
      this.proj.aspect = aspect;
      this.proj.near = near;
      this.proj.far = far;
      this.calcProjMat();
    }
    updateProj(data){
      const {
        fov:newFov = this.proj.fov,
        aspect:newAspect = this.proj.aspect,
        near:newNear = this.proj.near,
        far:newFar = this.proj.far
      } = data;
      this.proj.fov = newFov;
      this.proj.aspect = newAspect;
      this.proj.near = newNear;
      this.proj.far = newFar;
      this.calcProjMat();
    }
    calcProjMat(){
      // nearとfarとfovとaspectで定義する
      // fovはPI/3がデフォルト、aspectは未定義の場合全体に対してw/hでOK
      const {fov, aspect, near, far} = this.proj;
      const factor = 1 / Math.tan(fov/2);
      const c0 = factor / aspect;
      const c5 = factor; // 符号反転！
      const c10 = (near + far) / (near - far);
      const c11 = -1;
      const c14 = 2 * near * far / (near - far);
      const data = [c0, 0, 0, 0, 0, c5, 0, 0, 0, 0, c10, c11, 0, 0, c14, 0];
      this.projMat.set(data);
    }
    createProjState(){
      const projState = {};
      projState.fov = this.proj.fov;
      projState.aspect = this.proj.aspect;
      projState.mat = this.projMat.copy();
      return projState;
    }
    loadProjState(name){
      const p = this.states[name].proj;
      this.proj.fov = p.fov;
      this.proj.aspect = p.aspect;
      this.calcProjMat();
    }
    lerpProjState(fromProjState, toProjState, amt){
      // tan(fov/2)とaspectを対数補間します
      // あとはfovを引き戻しで求めるだけ
      const {fov:fromFov, aspect:fromAspect} = fromProjState;
      const {fov:toFov, aspect:toAspect} = toProjState;
      const tanFromFov = Math.tan(fromFov/2);
      const tanToFov = Math.tan(toFov/2);
      this.proj.fov = 2*Math.atan(tanFromFov * Math.pow(tanToFov/tanFromFov, amt));
      this.proj.aspect = fromAspect * Math.pow(toAspect/fromAspect, amt);
      this.calcProjMat();
    }
    getViewPositionFromNDC(x, y, z){
      const m = this.projMat.m;
      const u = -x/m[0];
      const v = -y/m[5];
      return new Vec3(u*z, v*z, z);
    }
    zoom(value){
      // fovをいじる操作。カメラと中心の距離は変化させない。
      // tan(fov/2)に乗算したうえでatanで引き戻して2を掛ける。
      this.proj.fov = 2 * Math.atan(Math.tan(this.proj.fov/2) * Math.pow(10, value));
      this.calcProjMat();
    }
  }

  class OrthographicCamera extends CameraPrototype{
    constructor(data = {}){
      super(data);
      this.cameraType = "orthographic";
    }
    setProj(data){
      // 横cwで縦chの枠を使って中心ベースでorthoをやる。
      // 上下反転とかそういうのはやらない。
      // wとhがある場合はそれを使う。ただしcwとchが未定義の場合。
      const {w = window.innerWidth, h = window.innerHeight} = data;
      const {cw = w, ch = h} = data;
      const {eye, center} = this.view;
      const distance = eye.dist(center);
      const {near = distance * (-10)} = data;
      const {far = distance * 10} = data;
      this.proj.cw = cw;
      this.proj.ch = ch;
      this.proj.near = near;
      this.proj.far = far;
      this.calcProjMat();
    }
    updateProj(data){
      const {
        cw:newCw = this.proj.cw,
        ch:newCh = this.proj.ch,
        near:newNear = this.proj.near,
        far:newFar = this.proj.far
      } = data;
      this.proj.cw = newCw;
      this.proj.ch = newCh;
      this.proj.near = newNear;
      this.proj.far = newFar;
      this.calcProjMat();
    }
    calcProjMat(){
      // nearとfarとwidthとheightで定義する（leftとかそういうことはしないです）
      // persと違ってnearとfarは負の数が取れる（らしい）（距離の概念が無いので）
      // たとえば例のアニメ作る際に近づけても全体が入るように
      // nearを大きい負の数に取るとかするといい
      const {cw, ch, near, far} = this.proj;
      const c0 = 2 / cw;
      const c5 = 2 / ch;
      const c10 = -2 / (far - near);
      const c14 = -(far + near) / (far - near);
      const c15 = 1;
      const data = [c0, 0, 0, 0, 0, c5, 0, 0, 0, 0, c10, 0, 0, 0, c14, c15];
      this.projMat.set(data);
    }
    createProjState(){
      const projState = {};
      projState.cw = this.proj.cw;
      projState.ch = this.proj.ch;
      projState.mat = this.projMat.copy();
      return projState;
    }
    loadProjState(name){
      const p = this.states[name].proj;
      this.proj.cw = p.cw;
      this.proj.ch = p.ch;
      this.calcProjMat();
    }
    lerpProjState(fromProjState, toProjState, amt){
    // cwとchをそれぞれ対数補間するだけ
    const {cw:fromCw, ch:fromCh} = fromProjState;
    const {cw:toCw, ch:toCh} = toProjState;
    this.proj.cw = fromCw * Math.pow(toCw / fromCw, amt);
    this.proj.ch = fromCh * Math.pow(toCh / fromCh, amt);
    this.calcProjMat();
    }
    dolly(value){
      // valueが正の時遠ざかる感じで
      // orthoの場合は射影もいじる
      super.dolly(value);
      this.zoom(value);
    }
    getViewPositionFromNDC(x, y, z){
      const m = this.projMat.m;
      const u = x/m[0];
      const v = y/m[5];
      return new Vec3(u, v, z);
    }
    zoom(value){
      // 距離を変えないで射影だけいじる。
      const multiplier = Math.pow(10, value);
      this.proj.cw *= multiplier;
      this.proj.ch *= multiplier;
      this.calcProjMat();
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // CameraController & CameraManager.
  // Cameraを動かすための各種Interactionを用意する
  // これによりインタラクションで登録されているカメラが動くようになる

  // 名前でカメラを管理する
  // 持たせるプロパティは
  // 各種速度と
  // 回転のモードと
  // 制御変数（sensitivity系）と
  // あと同じ名前でタイマーを初期化する

  // CMとの連携をやめる
  // モードをカメラごとでなく共通にする
  // 定数の調整を実値ではなく係数で設定できるようにする
  class CameraController extends foxIA.Interaction{
    constructor(){
      super();
      this.cams = {};
      this.curCam = undefined;
      this.initializeDefaultConstants(); // 定数と係数の初期化
      this.manager = new CameraManager(); // スムースリセット用
      this.manager.setParam({from:"", to:"default"}); // 備え付け
      this.smoothReset = true; // スムースリセットするかどうか
      this.rotationMode = "angle";  // angle/free. 回転モード
      this.scaleMode = "dolly";  // dolly/zoom. 拡大縮小を接近で行なうかfovをいじるか
      this.controlMode = "frame";  // frame/time. フレームベースかタイムベースか
      this.timer = new Timer(); // 時間ベース
      this.pause = false;
      this.registCamera("default", new PerspectiveCamera({})); // ダミーを用意しとこ
    }
    getManager(){
      // CameraManagerの取得関数
      return this.manager;
    }
    initializeDefaultConstants(){
      this.defaultConstants = {};
      this.defaultConstants.velocityThreshold = 0.000001;
      this.defaultConstants.mouseScale = 0.0001;
      this.defaultConstants.mouseRotate = 0.001;
      this.defaultConstants.mouseMove = 0.0006;
      this.defaultConstants.touchScale = 0.00028;
      this.defaultConstants.touchRotate = 0.0015;
      this.defaultConstants.touchMove = 0.00045;
      this.defaultConstants.upperAngleLimit = 1.56;
      this.defaultConstants.lowerAngleLimit = -1.56;
      this.constantFactor = {};
      for(const name of Object.keys(this.defaultConstants)){
        this.constantFactor[name] = 1;
      }
    }
    setFactor(params = {}){
      // constantsのうちparamsで指定されたものだけを変更する
      // velocityThreshold, mouseScale, mouseRotate, mouseMove, touchScale, touchRotate, touchMove, upperAngleLimit, lowerAngleLimit
      // に掛ける係数を指定できる。（2倍とか0.5倍など）
      // mouseScaleとtouchScaleを0.5倍したい場合
      // setFactor({mouseScale:0.5, touchScale:0.5});
      // これでOK
      for(const name of Object.keys(params)){
        if (typeof params[name] !== 'number') continue;
        if (this.constantFactor[name] === undefined) continue;
        this.constantFactor[name] = params[name];
      }
    }
    getConstant(name){
      return this.defaultConstants[name] * this.constantFactor[name];
    }
    setParam(params = {}){
      // 各種モード設定
      // たとえばrotationModeをfreeにしたければsetMode({rotationMode:"free"})とすれば充分
      // managerの設定もいじれるようにする
      // たとえばデフォルトでのカメラのリセット先を"state1"にするにはsetParam({to:"state1"});と書くだけ
      const {
        smoothReset:sr = this.smoothReset, // managerを使ってリセットするか否か
        rotationMode:rm = this.rotationMode,
        scaleMode:sm = this.scaleMode,
        controlMode:cm = this.controlMode,
        from:f = this.manager.from,
        to:t = this.manager.to, // reset時のto.
        duration:d = this.manager.duration,
        easing:e = this.manager.easing,
        factor:fr = this.manager.factor
      } = params;
      this.smoothReset = sr; // bool値
      if (rm === "angle" || rm === "free") this.rotationMode = rm;
      if (sm === "dolly" || sm === "zoom") this.scaleMode = sm;
      if (cm === "frame" || cm === "time") this.controlMode = cm;
      // manager関連はまとめてsetParamで指定する
      this.manager.setParam({from:f, to:t, duration:d, easing:e, factor:fr});
    }
    prepareCameraData(name, cam){
      const data = {};
      data.name = name;
      data.cam = cam;
      data.scaleVelocity = 0;
      data.moveVelocity = new Vec3(0,0,0);
      data.rotationVelocity = new Vec3(0,0,0);
      //data.rotationType = "angle"; // またはfree.
      //data.scaleType = "dolly"; // dollyとzoomを切り替えることができる
      //data.targetResetState = "default"; // リセットの際に戻るstateの種類
      data.active = false; // マウスダウンなどの以下略
      data.button = 0; // マウスボタン用
      //data.controlType = "frame"; // frame/timeが選択できる。timeにすると時間ベース。
      this.timer.initialize(name); // タイマーの初期化
      this.cams[name] = data;
    }
    registCamera(name, cam){
      this.prepareCameraData(name, cam);
      this.curCam = this.cams[name];
      // this.managerのregist処理
      this.manager.registCamera(name, cam);
    }
    setCamera(name){
      this.curCam = this.cams[name];

      // this.managerのset処理
      this.manager.setCamera(name);
    }
    getCamera(name){
      // カメラを取得できるようにする。デフォルトカメラの取得はこれでないとできない。
      if (name === undefined) return this.curCam.cam; // 引数無しの場合
      return this.cams[name].cam;
    }
    initializeCamera(){
      // そのときのカメラの状態をリセットする感じですね
      const c = this.curCam;
      c.active = false;
      c.scaleVelocity = 0;
      c.moveVelocity.set(0,0,0);
      c.rotationVelocity.set(0,0,0);
    }
    update(){
      const c = this.curCam;
      const cam = c.cam;
      const factor = (this.controlMode === "frame" ? 1 : 60 * this.timer.getDelta(c.name));

      // managerがactiveな場合はmanagerをupdateするだけ
      if (this.manager.isActive()) {
        this.manager.update();
        return;
      }

      // scale.
      c.scaleVelocity *= 0.85;
      if (c.scaleVelocity * c.scaleVelocity < this.getConstant("velocityThreshold")){
        c.scaleVelocity = 0;
      } else {
        switch(this.scaleMode){
          case "dolly":
            cam.dolly(c.scaleVelocity * factor); break;
          case "zoom":
            cam.zoom(c.scaleVelocity * factor); break;
        }
      }

      // move.
      c.moveVelocity.mult(0.85);
      if (c.moveVelocity.magSq() < this.getConstant("velocityThreshold")){
        c.moveVelocity.set(0,0,0);
      } else {
        cam.moveNDC(-c.moveVelocity.x * factor, c.moveVelocity.y * factor);
      }

      // rotation.
      c.rotationVelocity.mult(0.85);
      if (c.rotationVelocity.magSq() < this.getConstant("velocityThreshold")){
        c.rotationVelocity.set(0,0,0);
      } else {
        switch(this.rotationMode){
          case "angle":
            cam.spin(-c.rotationVelocity.x * factor);
            const upperLimit =
                  Math.max(-1.56, Math.min(1.56, this.getConstant("upperAngleLimit")));
            const lowerLimit =
                  Math.max(-1.56, Math.min(1.56, this.getConstant("lowerAngleLimit")));
            cam.angle(c.rotationVelocity.y * factor, upperLimit, lowerLimit);
            break;
          case "free":
            const q = cam.getParallelPosition(
              cam.view.center, c.rotationVelocity.x, -c.rotationVelocity.y
            );
            q.sub(cam.view.center).normalize();
            const axis = q.cross(cam.view.front);
            const phi = c.rotationVelocity.mag();
            cam.rotate(phi * factor, axis);
            break;
        }
      }
    }
    activate(){
      if (this.manager.isActive()) {
        return;
      }
      const c = this.curCam;
      c.active = true;
    }
    inActivate(){
      const c = this.curCam;
      c.active = false;
    }
    isActive(){
      return this.active;
    }
    isPause(){
      return this.pause;
    }
    wheelAction(e){
      if (this.manager !== undefined && this.manager.isActive()) {
        return;
      }
      const c = this.curCam;
      c.scaleVelocity += e.deltaY * this.getConstant("mouseScale");
    }
    mouseDownDefaultAction(e){
      this.activate();
      this.curCam.button = e.button;
    }
    mouseUpDefaultAction(e){
      this.inActivate();
    }
    mouseMoveDefaultAction(dx, dy, x, y){
      const c = this.curCam;
      if (!c.active) return;
      if (c.button === 0) {
        c.rotationVelocity.add(
          dx*this.getConstant("mouseRotate"),
          dy*this.getConstant("mouseRotate"),
          0
        );
      }
      if (c.button === 2) {
        c.moveVelocity.add(
          dx*this.getConstant("mouseMove"),
          dy*this.getConstant("mouseMove"),
          0
        );
      }
    }
    touchStartDefaultAction(e){
      this.activate();
    }
    touchSwipeAction(dx, dy, x, y, px, py){
      const c = this.curCam;
      c.rotationVelocity.add(
        dx*this.getConstant("touchRotate"),
        dy*this.getConstant("touchRotate"),
        0
      );
    }
    touchEndDefaultAction(e){
      this.inActivate();
    }
    touchPinchInOutAction(diff, ratio, x, y, px, py){
      if (this.manager !== undefined && this.manager.isActive()) {
        return;
      }
      // Interactionサイドの実行内容を書く。
      // diffは距離の変化。正の場合大きくなる。ratioは距離の比。
      const c = this.curCam;
      c.scaleVelocity -= diff * this.getConstant("touchScale");
    }
    touchMultiSwipeAction(dx, dy, x, y, px, py){
      if (this.manager !== undefined && this.manager.isActive()) {
        return;
      }
      // Interactionサイドの実行内容を書く。
      // dx,dyは重心の変位。
      const c = this.curCam;
      c.moveVelocity.add(
        dx*this.getConstant("touchMove"),
        dy*this.getConstant("touchMove"),
        0
      );
    }
    doubleClickAction(){
      this.reset();
    }
    doubleTapAction(){
      this.reset();
    }
    reset(params = {}){
      // 常にその瞬間からリセットされる仕様。だからfromは""で。
      // 個別にこれを呼び出すこともできる。別のトリガーで。そういうこともできる。
      this.initializeCamera();
      if (this.smoothReset){
        // paramsで一時的にmanagerの挙動を変えることができる
        // ここで指定する場合はたとえ変更があってもそれ以降は指定が無ければデフォルトが使われる
        // ダブルクリックやダブルタップで発動させる場合がそう
        // 任意にそれ以外のタイミングで発動させることもできるわけ
        this.manager.activate(params);
      } else {
        // smoothResetでない場合。この場合、managerに登録されたtoのstateに直接ワープする。補間は無し。
        this.curCam.cam.loadState(this.manager.to);
      }
    }
    stop(){
      // managerも止める
      if (this.pause) return;
      this.timer.pauseAll();
      this.manager.stop();
      this.pause = true;
    }
    start(){
      // managerも止める
      if (!this.pause) return;
      this.timer.reStartAll();
      this.manager.start();
      this.pause = false;
    }
  }

  // activate()で勝手にlerpStateが始まる
  // inactivate()が時間経過で実行される
  // 毎フレームupdateを呼ぶだけで勝手にカメラをいじってくれる
  // activeかどうか取得できるのでその間カメラをいじれないようにできる
  // こんなもんかな。あとは連携ですが、まあ先にテストしましょ。

  // CCとの相互連携は廃止。ばかげてるので。
  class CameraManager{
    constructor(){
      this.cams = {};
      this.curCam = undefined;
      this.timer = new Timer();
      this.active = false;
      this.pause = false;
      this.from = "";
      this.to = "default";
      this.duration = 500; // ミリ秒指定なのでこれで
      this.factor = 1; // 1を超えて回したい場合に使う
      this.easingInstance = new Easing();
      this.easing = "easeInOutQuad"; // イージングは名前で保持する。独自のものを使いたい場合は登録する必要がある
      this.temporaryParams = {}; // activateでparamsを指定した場合に機能する
      // ダミーを用意しとこ。
      // インタラクションのたびにエラー出されるのがめんどうなので。
      // Controllerと同じ名前なのは共有した後も機能するようにするためです
      this.registCamera("default", new PerspectiveCamera({}));
    }
    prepareCameraData(name, cam){
      const data = {};
      data.name = name;
      data.cam = cam;
      this.timer.initialize(name);
      this.cams[name] = data;
    }
    registCamera(name, cam){
      this.prepareCameraData(name, cam);
      // registの際に自動的にセットされる仕組み
      this.curCam = this.cams[name];
    }
    setCamera(name){
      this.curCam = this.cams[name];
    }
    getCamera(name){
      // カメラを取得できるようにする。デフォルトカメラの取得はこれでないとできない。
      if (name === undefined) return this.curCam.cam;
      return this.cams[name].cam;
    }
    setEasing(name, func = ((x) => x)){
      // 文字だけの場合はそれをeasingFunctionに据えるだけ（ただし上書きは不可）
      if (this.easingInstance.funcs[name] !== undefined) {
        this.easing = name;
        return;
      }
      // 関数が指定されている場合はそれを新しく登録する
      // regist関数なのでパラメータ指定でcompositeMultiを使うこともできる
      this.easing.regist(name, func);
      // getEasingは不要ですね。
    }
    setParam(params = {}){
      // パラメータ増やそう
      const keys = ["from", "to", "duration", "easing", "factor"];
      // 以上のパラメータだけ上書きする
      for(const name of keys){
        if (params[name] !== undefined){
          this[name] = params[name];
        }
      }
    }
    setTemporaryParam(params = {}){
      // ParamsでなくParamなのは設定するパラメタが複数とは限らないため、です。
      // paramの入力があるものだけ上書きする
      // それ以外は設定されたものを使う
      const keys = ["from", "to", "duration", "easing", "factor"];
      for(const name of keys){
        if (params[name] !== undefined){
          this.temporaryParams[name] = params[name];
        } else {
          this.temporaryParams[name] = this[name];
        }
      }
    }
    activate(params = {}){
      // activate時にstateNameを指定できるようにすると柔軟性が増す
      // activate時にparamsで指定する場合、その時のみ使われるといった使い方になる
      // つまり一時的に違うdurationや違うeasingで発動させることが可能になるわけ
      this.setTemporaryParam(params);
      // fromStateNameが""の場合はその場でstateをセットする
      // この名前の場合、inActivateの際にfromStateNameが""に戻される
      if (this.temporaryParams.from === "") {
        this.temporaryParams.from = "_temporaryPreviousState_";
        this.curCam.cam.setState(this.temporaryParams.from);
      }
      // タイマーを発火させてdurationをターゲットに据える
      this.timer.setElapsed(this.curCam.name, this.temporaryParams.duration);
      this.active = true;
    }
    inActivate(){
      // fromはtemporaryParamsを使うので、フラグはもう要らない。
      this.active = false;
    }
    isActive(){
      return this.active;
    }
    isPause(){
      return this.pause;
    }
    update(){
      // activeでなければ何もしない
      // 経過時間からプログレスを取得しイージングを掛けて0～1の値を取得し
      // 2つのstateの名前とそれ(amt)からcamにlerpStateを実行させるだけ
      // タイマーを監視してdurationに達したようであればinActivateする
      // 更新してからcheckしないと駄目ですねこれ
      // でないとprgが1のフェイズが無視されてしまうのでだめですね
      const {name, cam} = this.curCam;
      if (!this.active) return;
      const prg = this.timer.getProgress(name);
      // temporaryParamsによって状態補間を実行する
      cam.lerpState(
        this.temporaryParams.from,
        this.temporaryParams.to,
        this.temporaryParams.factor * this.easingInstance.apply(this.temporaryParams.easing, prg)
      );
      if (this.timer.check(name)) {
        this.inActivate();
      }
    }
    stop(){
      // タイマーを止める
      if (this.pause) return; // 重ね掛け回避
      this.timer.pauseAll();
      this.pause = true;
    }
    start(){
      // タイマーを動かす
      if (!this.pause) return; // 重ね掛け回避
      this.timer.reStartAll();
      this.pause = false;
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Transform.
  // 単位行列。初期化。要するにモデル行列。
  // rotとかいろいろこっちに移すかな...あっちに持たせても仕方ないわな。

  class Transform{
    constructor(data){
      this.mat = new Mat4(data);
      this.states = {};
      this.stateStuck = [];
    }
    initialize(){
      this.mat.initialize();
      return this;
    }
    getModelMat(){
      // モデル行列を取り出す。これを...渡す。
      return this.mat;
    }
    setState(name){
      // 行列の形でステートを保持
      this.states[name] = this.mat.copy();
      return this;
    }
    loadState(name){
      // 行列を呼び出してセットする
      if (this.states[name] === undefined) return this;
      this.mat.set(this.states[name].m);
      return this;
    }
    lerpState(fromState, toState, amt){
      // under construction.
      return this;
    }
    push(){
      // 行列をstuckにpushする
      this.stateStuck.push(this.mat.copy());
    }
    pop(){
      // 直前にpushした内容を出す
      const previousState = this.stateStuck.pop();
      if (previousState === undefined) return this;
      this.mat.set(previousState.m);
      return this;
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
    create(process = []){
      // processはこういうの
      // [{t:[10,20,40]}, {rx:PI/3}, {ry:PI/4}, {rz:-PI/2}, {r:[PI/5, 1, 1, 1]}]
      // 順繰りに適用していく
      // たとえば右に動かしてその位置で回転させたい場合はまずtで次にrxやryを実行する
      // t,r,sは配列指定、rx,ry,rzはスカラー指定、rは角度が先。ssは。。。要らないんだよね...
      // s:2でs:[2,2,2]と同じになればいいんよね。そうしよ。ssは廃止！
      // transformをベクトル指定できるようにしよ。
      // 複数ラベルで書き方の柔軟性（列挙は駄目らしい）
      for(let i = 0; i < process.length; i++){
        const tfElement = process[i];
        const tfKind = Object.keys(tfElement)[0];
        const tfData = tfElement[tfKind];
        switch(tfKind){
          case "t":
          case "translate":
            if (Array.isArray(tfData)){
              this.translate(...tfData);
            } else if (typeof tfData === 'object'){
              // ベクトルなどの場合
              const {x:tx = 0, y:ty = 0, z:tz = 0} = tfData;
              this.translate(tx, ty, tz);
            }
            break;
          case "rx":
          case "rotateX":
            this.rotateX(tfData); break;
          case "ry":
          case "rotateY":
            this.rotateY(tfData); break;
          case "rz":
          case "rotateZ":
            this.rotateZ(tfData); break;
          case "r":
          case "rotate":
            if (Array.isArray(tfData)) {
              if (typeof tfData[1] === 'number') {
                this.rotate(...tfData);
              } else if (typeof tfData[1] === 'object') {
                // 第二引数がベクトルの場合
                const {x:vx = 0, y:vy = 0, z:vz = 1} = tfData[1];
                this.rotate(tfData[0], vx, vy, vz);
              }
            }
            break;
          case "s":
          case "scale":
            if (Array.isArray(tfData)){
              this.scale(...tfData);
            } else if (typeof tfData === 'number') {
              // スカラーを指定すると全部同じになる感じ
              this.scale(tfData, tfData, tfData);
            }
            break;
        }
      }
      return this;
    }
  }

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
        vec3 overlay(vec3 src, vec3 dst){
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

  // attrを用意する
  function _convertAttributesToText(attrs){
    let result = ``;
    const prefix = `in`;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      result += prefix +  ` ` + attr.type + ` ` + attr.name + `;`;
    }
    return result;
  }

  // TF用のoutVaryingsはinの後で用意する
  function _convertOutVaryingsToText(outVaryings){
    let result = ``;
    const prefix = `out`;
    for (let i = 0; i < outVaryings.length; i++) {
      const outVarying = outVaryings[i];
      result += prefix +  ` ` + outVarying.type + ` ` + outVarying.name + `;`;
    }
    return result;
  }

  // varyingsを用意する
  function _convertVaryingsToText(varyings, location){
    let result = ``;
    const prefix = (location === `vs` ? `out` : `in`);
    for (let i = 0; i < varyings.length; i++) {
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

  // node渡さないとね
  class ShaderPrototype{
    constructor(node){
      this.node = node;
      this.initialize();
    }
    initialize(options = {}){
      this.attrs = [];
      this.outVaryings = [];
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
    clearOutVaryings(){
      this.outVaryings = [];
      return this;
    }
    addOutVarying(type, name){
      this.outVaryings.push({type, name});
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
      // 追加
      this[addLocation][addTarget] += content;
      return this;
    }
    clearCode(clearTarget, clearLocation){
      // 消去
      this[clearLocation][clearTarget] = ``;
      return this;
    }
    writeCode(content, writeTarget, writeLocation){
      // 上書き
      this[writeLocation][writeTarget] = content;
      return this;
    }
    registPainter(name, options = {}){
      let _vs =
      `#version 300 es
      `;
      _vs += this.vs.precisions;
      _vs += _convertAttributesToText(this.attrs);
      _vs += _convertOutVaryingsToText(this.outVaryings);
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
      // TFの場合はoutVaryingsが必要になる。それをoptionsで指定する。
      const {outVaryings = []} = options;
      this.node.registPainter(name, _vs, _fs, outVaryings);
      return this;
    }
    draw(options = {}){
      // Shader自身に何かしら描画命令を持たせたい場合にどうぞ。
    }
  }

  class ForwardLightingShader extends ShaderPrototype{
    constructor(node){
      super(node);
    }
    initialize(options = {}){
      super.initialize();
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
      // おそらくpostProcessにfragColorの計算を持ってきているのは、あれですね。
      // mainProcessで取得したcolorに何か加工をすることが出来るようにするためですね。
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
    constructor(node){
      super(node);
    }
    initialize(options = {}){
      super.initialize();
      // TODO
    }
  }
  // こっちはディファードをライティングするためのシェーダ
  class DeferredLightingShader extends ShaderPrototype{
    constructor(node){
      super(node);
    }
    initialize(options = {}){
      super.initialize();
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
    constructor(node){
      super(node);
    }
    initialize(options = {}){
      super.initialize();
      const {uvAlign = "leftUp", depth = 0.0} = options;
      this.attrs =[{type:"vec2", name:"aPosition"}];
      this.varyings =[{type:"vec2", name:"vUv"}];
      this.fs.outputs =
        `out vec4 fragColor;`;
      // uvAlignで事前の処理
      switch(uvAlign){
        case "leftUp": // 左上(0,0)で右が(1,0)で下が(0,1)
          this.vs.preProcess = `vUv = aPosition * 0.5 + 0.5; vUv.y = 1.0 - vUv.y;`; break;
        case "leftDown": // 左下(0,0)で右が(1,0)で上が(0,1)
          this.vs.preProcess = `vUv = aPosition * 0.5 + 0.5;`; break;
        case "center_yUp": // 中央(0,0)で上が(0,1)で右が(1,0)
          this.vs.preProcess = `vUv = aPosition;`; break;
        case "center_yDown": // 中央(0,0)で下が(0,1)で右が(1,0)
          this.vs.preProcess = `vUv = aPosition; vUv.y = -vUv.y;`; break;
      }

      // 後ろに置くならdepthは1.0の方がいいし前において透明度補正掛けるなら0.0の方がいいですね
      this.vs.mainProcess =
        `gl_Position = vec4(aPosition, ` + depth + `, 1.0);`;
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

  // nodeをこっちにも渡す
  // 同じnodeである必要が...あるはず。

  // tfとCamを備え付けにしましょ。使わない場合もあるけどいちいち定義するのめんどくさいので。
  // CCとCMはオプションとする。これらは両方使う場合、CC備え付けのCMと登録用のCMは異なるものとなる。
  // これにより相互連携とかクソ面倒な問題を回避できる。
  class RenderingSystem{
    constructor(node){
      this.node = node;
      this.shaders = {};
      this.currentShader = undefined;
      this.transform = new Transform();
      this.cams = {};
      this.curCam = undefined;
      this.controller = undefined; // 連携用
      this.manager = undefined; // 連携用
      // ダミーカメラ（名前は共通でdefault）
      this.registCamera("default", new PerspectiveCamera({}));
    }
    complementCameras(target){
      // targetとthisで互いに足りないカメラを補い合う処理
      for (const name of Object.keys(target.cams)) {
        if (this.cams[name] === undefined) {
          this.registCamera(name, target.cams[name].cam);
        }
      }
      for (const name of Object.keys(this.cams)) {
        if (target.cams[name] === undefined) {
          target.registCamera(name, this.cams[name].cam);
        }
      }
      // curCamが何であるかはLSサイドに主導権があるので、
      // registのたびにsetされるとはいえ、一致するとは限らないので、一致させる処理を実行する。
      // setCameraでないとまずいね(CCの場合に備え付けのCMまでsetされない)
      target.setCamera(this.curCam.name);
    }
    setController(target){
      // CCをsetする
      this.controller = target;
      this.complementCameras(target);
    }
    setManager(target){
      // CMをsetする
      this.manager = target;
      this.complementCameras(target);
    }
    getController(){
      return this.controller;
    }
    getManager(){
      return this.manager;
    }
    update(){
      // 定義されていればupdateするだけ
      if (this.controller !== undefined) { this.controller.update(); }
      if (this.manager !== undefined) { this.manager.update(); }
      return this;
    }
    prepareCameraData(name, cam){
      const data = {};
      data.name = name;
      data.cam = cam;
      this.cams[name] = data;
    }
    registCamera(name, cam){
      this.prepareCameraData(name, cam);
      // registの際に自動的にセットされる仕組み
      this.curCam = this.cams[name];

      if (this.controller !== undefined) {
        // this.controllerのregist処理
        this.controller.registCamera(name, cam);
      }
      if (this.manager !== undefined) {
        // this.managerのregist処理
        this.manager.registCamera(name, cam);
      }
    }
    setCamera(name){
      // 連携してると全部にsetされる
      this.curCam = this.cams[name];

      if (this.controller !== undefined) {
        this.controller.setCamera(name);
      }
      if (this.manager !== undefined) {
        this.manager.setCamera(name);
      }
    }
    getCamera(name){
      if (name === undefined) return this.curCam.cam;
      return this.cams[name].cam;
    }
    registShader(name, _shaderPrototype){
      // 渡す前に作っておく
      if (this.shaders[name] !== undefined) { return this; }
      this.shaders[name] = _shaderPrototype;
      this.bindShader(name);
      return this;
    }
    setTransform(process = [], initializeTransform = true){
      // transformの設定
      if (initializeTransform) this.initializeTransform();
      this.transform.create(process);
      return this;
    }
    getTransform(){
      // transformの取得
      return this.transform;
    }
    initializeTransform(){
      // 要るかどうか不明だが、一応用意しましょ
      this.transform.initialize();
    }
    bindShader(name){
      // 意味的にはsetShaderだろうか...改変するshaderをスイッチする処理。
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
    addOutVarying(type, name){
      this.currentShader.addOutVarying(type, name);
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
    writeCode(content, writeTarget, writeLocation){
      this.currentShader.writeCode(content, writeTarget, writeLocation);
      return this;
    }
    registPainter(name, options = {}){
      this.currentShader.registPainter(name, options);
      return this;
    }
  }

  // StandardLightingSystemです。はい。
  class StandardLightingSystem extends RenderingSystem{
    constructor(node){
      super(node);
      this.registShader("forwardLight", new ForwardLightingShader(node));
      this.registShader("deferredPrepare", new DeferredPrepareShader(node));
      this.registShader("deferredLight", new DeferredLightingShader(node));
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
      this.initializeTransform();
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
    setLight(info = {}){
      const keys = Object.keys(info);
      for(const _key of keys){ this.lightingParams[_key] = info[_key]; }
      this.lightingParams.use = true;
    }
    // directionalLight.
    setDirectionalLight(info = {}){
      const keys = Object.keys(info);
      for(const _key of keys){ this.directionalLightParams[_key] = info[_key]; }
      if (this.directionalLightParams.count > 0) { this.directionalLightParams.use = true; }
    }
    // pointLight.
    setPointLight(info = {}){
      const keys = Object.keys(info);
      for(const _key of keys){ this.pointLightParams[_key] = info[_key]; }
      if (this.pointLightParams.count > 0) { this.pointLightParams.use = true; }
    }
    // spotLight.
    setSpotLight(info = {}){
      const keys = Object.keys(info);
      for(const _key of keys){ this.spotLightParams[_key] = info[_key]; }
      if (this.spotLightParams.count > 0) { this.spotLightParams.use = true; }
    }
    lightOn(){
      // 即時的に切り替える処理にする
      this.lightingParams.use = true;
      this.node.setUniform("uUseLight", this.lightingParams.use);
      return this;
    }
    lightOff(){
      this.lightingParams.use = false;
      this.node.setUniform("uUseLight", this.lightingParams.use);
      return this;
    }
    setFlag(flag){
      // フラグの切り替えめんどくさいんだよ
      this.node.setUniform("uMaterialFlag", flag);
      return this;
    }
    setLightingUniforms(){
      // forwardの場合は事前にやるんだけど
      // deferredの場合は後回し
      this.node.setUniform("uUseLight", this.lightingParams.use);
      if (!this.lightingParams.use) { return; } // noLights.

      this.node.setUniform("uAmbientColor", this.lightingParams.ambient);
      this.node.setUniform("uShininess", this.lightingParams.shininess);
      this.node.setUniform("uAttenuation", this.lightingParams.attenuation);
      this.node.setUniform("uUseSpecular", this.lightingParams.useSpecular);

      if (this.directionalLightParams.use){
        this.node.setUniform("uDirectionalLightCount", this.directionalLightParams.count);
        this.node.setUniform("uLightingDirection", this.directionalLightParams.direction);
        this.node.setUniform("uDirectionalDiffuseColor", this.directionalLightParams.diffuseColor);
        this.node.setUniform("uDirectionalSpecularColor", this.directionalLightParams.specularColor);
      }

      if(this.pointLightParams.use){
        this.node.setUniform("uPointLightCount", this.pointLightParams.count);
        this.node.setUniform("uPointLightLocation", this.pointLightParams.location);
        this.node.setUniform("uPointLightDiffuseColor", this.pointLightParams.diffuseColor);
        this.node.setUniform("uPointLightSpecularColor", this.pointLightParams.specularColor);
      }

      if (this.spotLightParams.use) {
        this.node.setUniform("uSpotLightCount", this.spotLightParams.count);
        this.node.setUniform("uSpotLightLocation", this.spotLightParams.location);
        this.node.setUniform("uSpotLightDirection", this.spotLightParams.direction);
        this.node.setUniform("uSpotLightAngle", this.spotLightParams.angle);
        this.node.setUniform("uSpotLightConc", this.spotLightParams.conc);
        this.node.setUniform("uSpotLightDiffuseColor", this.spotLightParams.diffuseColor);
        this.node.setUniform("uSpotLightSpecularColor", this.spotLightParams.specularColor);
      }
      return this;
    }
    setMatrixUniforms(){
      // transformの操作はsetTransformで実行する。
      // それとは別にMatrixUniformsを設定する。
      // そのうちドローコールもメソッドで出来るようにしてその中でこれを実行する形になるかも？
      const tf = this.transform;
      const cam = this.curCam.cam;

      // deferredの場合はuViewMatrixを使わないので送らない
      // もちろん用意することは可能でその場合はカスタマイズで何とかする
      const modelMat = tf.getModelMat();
      const viewMat = cam.getViewMat();
      const projMat = cam.getProjMat();
      const modelViewMat = new Mat4(getMult4x4(modelMat.m, viewMat.m));
      const normalMat = getInverseTranspose3x3(modelViewMat.getMat3());
      const modelNormalMat = getInverseTranspose3x3(modelMat.getMat3());
      // forwardの場合は使うけどdeferredの場合は後でやる
      // deferredの方、内部で法線計算とかしてて若干内容が古いので
      // そのうち何とかします
      if (this.renderingType === "forward") {
        this.node.setUniform("uViewMatrix", viewMat.m);
      }
      this.node.setUniform("uModelMatrix", modelMat.m)
               .setUniform("uModelViewMatrix", modelViewMat.m)
               .setUniform("uProjMatrix", projMat.m)
               .setUniform("uNormalMatrix", normalMat)
               .setUniform("uModelNormalMatrix", modelNormalMat);
      return this;
    }
    output(){
      // deferred用。そのうち準備する。
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Performance checker
  // 前でも後でもOKなフレームレート表示用関数
  // クラスで定義します
  // いい加減面倒になってきたので

  // 作るときにキャンバスのサイズを指定します
  // 必要ならレートも指定します
  // これを使う場合、blendingはone --- one_minus_src_alphaにしないといけない
  // そのうち整備するつもり
  class PerformanceChecker{
    constructor(node, w, h, targetFrameRate = 60){
      this.node = node;
      this.initialize(w, h);
      this.targetFrameRate = targetFrameRate;
      this.timer = new Timer();
      this.timer.initialize("pfc");
      this.pause = false; // タイマーの動作を止めたいときに使う
    }
    initialize(w, h){
      this.node.registTexture("__foxPerformanceChecker", {src:(function(){
        const gr = createGraphics(w, h);
        gr.textAlign(CENTER, CENTER);
        gr.drawingContext.font = 'italic 20px system-ui';
        gr.noStroke();
        return gr;
      })()});
      const sh = new PlaneShader(this.node);
      // 内容的にはカバーなので、depthを-1.0にして一番上に来るようにする。
      // ほんとは一時的にdepth_testをfalseにすべきなんだろうけど。
      sh.initialize({depth:-1.0});
      sh.addUniform("sampler2D", "uInfo", "fs");
      sh.addCode(`
        color = texture(uInfo, uv);
        color.rgb *= color.a;
      `, "preProcess", "fs");
      sh.registPainter("__foxPerformanceChecker");
    }
    setTargetFrameRate(rate){
      this.targetFrameRate = rate;
    }
    show(_blend = "blend"){
      // デフォルトで"blend". これで一時的にあれする必要なくなる...はず。
      if (this.pause) return;
      this.update();
      this.node.use("__foxPerformanceChecker", "foxBoard");
      this.node.setTexture("uInfo", "__foxPerformanceChecker");
      this.node.drawArrays("triangle_strip", {blend:_blend});
      this.node.unbind();
    }
    update(){
      const gr = this.node.getTextureSource("__foxPerformanceChecker");
      const dt = this.timer.getDelta("pfc");
      const _frameRate = (dt > 0 ? 1/dt : 0); // 一応0割り対策
      const ratio = _frameRate / this.targetFrameRate;
      gr.clear();
      gr.fill(0);
      gr.rect(0, 0, 76, 30);
      gr.fill(128);
      gr.rect(0, 0, 76*ratio, 30);
      gr.fill(255);
      gr.text(_frameRate.toFixed(3), 38, 15);
      this.node.updateTexture("__foxPerformanceChecker");
    }
    stop(){
      // 止めたいとき
      this.timer.pause("pfc");
      this.pause = true;
    }
    start(){
      // 動かしたいとき
      this.timer.reStart("pfc");
      this.pause = false;
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Export.
  const ex = {};

  // utility.
  ex.getMult3x3 = getMult3x3; // 3x3の使い道があるかもしれない的な
  ex.getMult4x4 = getMult4x4; // こっちは使い道あるかもしれない
  ex.getInverseTranspose3x3 = getInverseTranspose3x3;
  ex.getTranspose3x3 = getTranspose3x3; // これ必要ですね...
  // 色関連
  ex.hsv2rgb = hsv2rgb;
  ex.hsvArray = hsvArray;
  ex.hsl2rgb_soft = hsl2rgb_soft;
  ex.hslArray_soft = hslArray_soft;
  ex.hsl2rgb_overlay = hsl2rgb_overlay;
  ex.hslArray_overlay = hslArray_overlay;
  // そのうちやめたいnoLoop()
  ex.myAlert = myAlert; // 警告メッセージの後でnoLoop()を実行する
  ex.clamp = clamp; // clamp関数
  ex.PerformanceChecker = PerformanceChecker; // パフォーマンスチェック用。新しくしました。

  ex.meshUtil = meshUtil; // 最終的にはここにすべてまとめる。registMeshも廃止する方向で。getNormalsも不要です。

  // snipet.
  ex.snipet = snipet; // glslのコードの略記用

  // shaderPrototype.
  ex.ShaderPrototype = ShaderPrototype;
  ex.PlaneShader = PlaneShader; // 板ポリ芸用
  ex.RenderingSystem = RenderingSystem;
  ex.StandardLightingSystem = StandardLightingSystem; // 古典的なフォン/ランバートのライティングによるフォワード/ディファードのライティングテンプレート

  // class.
  ex.Timer = Timer;
  ex.Easing = Easing;
  ex.Painter = Painter;
  ex.Figure = Figure;
  ex.RenderNode = RenderNode;
  ex.Texture = Texture;
  ex.Mat4 = Mat4;
  ex.PerspectiveCamera = PerspectiveCamera;
  ex.OrthographicCamera = OrthographicCamera;
  ex.CameraController = CameraController;
  ex.CameraManager = CameraManager;
  ex.Transform = Transform;
  ex.Vec3 = Vec3;

  // data格納用のshader欲しいかも

  return ex;
})();

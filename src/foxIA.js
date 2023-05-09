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
  class Interaction{
    constructor(factory = (() => new PointerPrototype())){
      this.pointers = [];
      this.factory = factory;
      this.width = 0;
      this.height = 0;
      this.tapCount = 0; // ダブルタップ判定用
      this.firstTapped = {x:0, y:0};
    }
    initialize(canvas){
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
      // マウス
      canvas.addEventListener('mousedown', this.mouseDownAction.bind(this), {passive:false});
      canvas.addEventListener('mousemove', this.mouseMoveAction.bind(this), {passive:false});
      window.addEventListener('mouseup', this.mouseUpAction.bind(this), {passive:false});
      canvas.addEventListener('mouseenter', this.mouseEnterAction.bind(this), {passive:false});
      canvas.addEventListener('mouseleave', this.mouseLeaveAction.bind(this), {passive:false});
      window.addEventListener('wheel', this.wheelAction.bind(this), {passive:false});
      canvas.addEventListener('click', this.clickAction.bind(this), {passive:false});
      canvas.addEventListener('dblclick', this.doubleClickAction.bind(this), {passive:false});
      // タッチ（ダブルタップは無いので自前で実装）
      canvas.addEventListener('touchstart', this.touchStartAction.bind(this), {passive:false});
      canvas.addEventListener('touchmove', this.touchMoveAction.bind(this), {passive:false});
      window.addEventListener('touchend', this.touchEndAction.bind(this), {passive:false});
      // キー(keypressは非推奨とのこと）
      // いわゆる押しっぱなしの時の処理についてはフラグの切り替えのために両方必要になるわね
      window.addEventListener('keydown', this.keyDownAction.bind(this), {passive:false});
      window.addEventListener('keyup', this.keyUpAction.bind(this), {passive:false});
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
      // Interactionサイドの実行内容を書く。クリック時。
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
        this.touchSwipeAction(this.pointers[0]);
      } else if (this.pointers.length > 1) {
        // pinch in/out.
        this.touchPinchInOutAction(this.pointers[0], this.pointers[1]);
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
    touchSwipeAction(t){
      // tの変位でなんかする。基本的にはベクトルでなんかする。
      // ベクトルには大きさと方向があるので両方使うでしょう、おそらく。だから方向だけということはないと思う、
      // まあそれいうなら...
    }
    touchPinchInOutAction(t0, t1){
      // t0,t1の変位でなんかする。基本的に距離の変化でなんか処理する。
      // 引数を距離にしてもいいけど距離を使うとは限らないので。
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
      // キーが押されたとき
    }
    keyUpAction(e){
      // キーが離れた時
    }
    getPointers(){
      return this.pointers;
    }
  }

  fox.Interaction = Interaction;
  fox.PointerPrototype = PointerPrototype;

  return fox;
})();

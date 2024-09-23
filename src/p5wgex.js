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

// 20231002
// pfcをDOMに変更
// foxIAについてInteractionコンストラクタにcanvasを導入
// factoryで何かしたいならoptionsに含めてください
// 今後はconstructorで初期化するのでそこら辺変更点が多いです
// Locater大幅更新、pointersを使ってタッチの場合は末尾ベースで更新することにしました

// 20231113
// StandardLightingSystemに大幅な変更
// setLightingUniformsのoptionsとしてrenderType,deferredの場合はこれをdeferredにしてね
// renderingTypeは廃止しました（意味が無いので）
// setMatrixUniformsを射影テクスチャに対応させるために法線関連の行列をセットしないようにするとか色々
// renderTypeをotherに
// またlinesを追加しました、initializeの際にtype:"lines"でラインシェーダが生成されます
// aColorに対応してるので一応線に色を付けられます
// またRenderingSystemにcameraのhelperの生成関数を追加
// createHelper(helperName, cameraName)でOKです
// 基本的には動的更新を想定しています。いわゆるイミディエイトですが、こんなののためにRetainedを持ち出すのは
// 仰々しいので却下しました。変化させる場合は毎フレーム同じ名前で呼び出してね。所詮ヘルパーなので。

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
    mouseInitialize(e, rect){
      this.x = e.clientX - rect.left;
      this.y = e.clientY - rect.top;
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
    mouseUpAction(){
    }
    touchInitialize(t, rect){
      this.id = t.identifier;
      this.x = t.pageX - rect.left; // 要するにmouseX的なやつ
      this.y = t.pageY - rect.top; // 要するにmouseY的なやつ
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
      this.x += prevLeft - l;
      this.y += prevTop - t;
      this.prevX += prevLeft - l;
      this.prevY += prevTop - t;
    }
    touchStartAction(t){
    }
    touchUpdate(t){
      this.prevX = this.x;
      this.prevY = this.y;
      this.dx = (t.pageX - this.rect.left - this.x);
      this.dy = (t.pageY - this.rect.top - this.y);
      this.x = t.pageX - this.rect.left;
      this.y = t.pageY - this.rect.top;
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
      this.factory = (() => new PointerPrototype());
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
      const {factory = (() => new PointerPrototype())} = options;
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

      // リサイズの際にleftとtopが変更されるのでそれに伴ってleftとtopを更新する
      window.addEventListener('resize', (function(){
        const newRect = canvas.getBoundingClientRect();
        //this.updateCanvasData(newRect.left, newRect.top);
        this.updateCanvasData(newRect);
      }).bind(this));

      // options. これらは基本パソコン環境前提なので（スマホが関係ないので）、オプションとします。
      // リサイズも滅多に使わないのでオプションで。
      const {
        mouseenter = false, mouseleave = false, click = false, dblclick = false,
        keydown = false, keyup = false, resize = false
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
      // リサイズ。
      if (resize) { canvas.addEventListener('resize', this.resizeAction.bind(this), {passive:false}); }
    }
    updateCanvasData(rect){
      // 対象のキャンバスを更新
      const {width, height, left, top} = rect;
      this.rect = {width, height, left, top};
      //this.canvasLeft = left;
      //this.canvasTop = top;
      for(const p of this.pointers){ p.updateCanvasData(rect); }
    }
    mouseDownAction(e){
      this.mouseDownPointerAction(e);
      this.mouseDownDefaultAction(e);
    }
    mouseDownPointerAction(e){
      const p = this.factory();
      if (p === null) return; // factoryがnullを返す場合はpointerを生成しない
      //p.mouseInitialize(e, this.canvasLeft, this.canvasTop);
      p.mouseInitialize(e, this.rect);
      p.mouseDownAction(e);
      this.pointers.push(p);
    }
    mouseDownDefaultAction(e){
      // Interactionサイドの実行内容を書く
    }
    mouseMoveAction(e){
      this.mouseMovePointerAction(e);
      //this.mouseMoveDefaultAction(e.movementX, e.movementY, e.clientX - this.canvasLeft, e.clientY - this.canvasTop);
      this.mouseMoveDefaultAction(e.movementX, e.movementY, e.clientX - this.rect.left, e.clientY - this.rect.top);
    }
    mouseMovePointerAction(e){
      // pointerが生成されなかった場合は処理を実行しない
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
      // pointerが生成されなかった場合は処理を実行しない
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
          if (p === null) return; // factoryがnullを返す場合はpointerを生成しない
          //p.touchInitialize(currentTouches[i], this.canvasLeft, this.canvasTop);
          p.touchInitialize(currentTouches[i], this.rect);
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
      if(this.pointers.length == 0){ return; }
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
      if(this.pointers.length == 0){ return; }
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
    touchStartDefaultAction(e){
      this.execute("touchstart", arguments);
    }
    doubleTapAction(){
      this.execute("dbltap", arguments);
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
      this.actions.inActivate = () => {};
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
        this.positionUpdate(x, y, dx, dy);
      }
      if(this.active){
        this.actions.move(x, y, dx, dy);
      }
    }
    mouseUpDefaultAction(){
      // activateされていないなら各種の処理は不要
      if (!this.active) return;
      this.active = false;
      this.actions.inActivate();
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
        this.actions.inActivate();
      }
    }
  }

  // キーを押したとき(activate), キーを押しているとき(update), キーを離したとき(inActivate),
  // それぞれに対してイベントを設定する。
  // 改変でキーコードが分かるようにするわ。

  // 改善案（同時押し対応）
  // isActiveが未定義の場合nullを返しているところをfalseを返すようにする
  // さらにactivate,update,inActivateの関数登録で引数を持たせられるようにする。その内容は第一引数で、
  // thisである。どう使うかというとたとえば(e)=>{if(e.isActive){~~~}}といった感じで「これこれのキーが押されている場合～～」
  // っていう、いわゆる同時押し対応をできるようにする。その際、たとえばBを押しながらAのときに、Bを押すだけの処理が存在しないと
  // isActiveがnullを返してしまうので、先のように変更したいわけです。
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
          const result = {};
          const {
            activate = () => {}, update = () => {}, inActivate = () => {}
          } = actions;
          result.activate = activate;
          result.update = update;
          result.inActivate = inActivate;
          result.active = false;
          this.keys[code] = result;
        } else {
          // 存在する場合、actionsで指定されたものだけ上書きされる。
          for (const actionType of Object.keys(actions)) {
            agent[actionType] = actions[actionType];
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
      return agent.active;
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
      if (agent === undefined || agent.active) return;
      agent.activate(this); // this.isActiveなどの処理を可能にする。
      agent.active = true;
    }
    update(){
      for(const name of Object.keys(this.keys)){
        const agent = this.keys[name];
        if (agent.active) {
          agent.update(this); // this.isActiveなどの処理を可能にする。
        }
      }
    }
    keyUpAction(e){
      const agent = this.keys[e.code];
      if (agent === undefined || !agent.active) return;
      agent.inActivate(this); // this.isActiveなどの処理を可能にする。
      agent.active = false;
    }
  }

  fox.Interaction = Interaction;
  fox.PointerPrototype = PointerPrototype;
  fox.Inspector = Inspector;
  fox.Locater = Locater;
  fox.KeyAction = KeyAction;

  return fox;
})();

// p5wgex.
// glからRenderNodeを生成します。glです。(2022/10/02)
const p5wgex = (function(){
  // -------------------------------------- error system. ----------------------------- //
  // エラーシステム
  class ErrorSystem{
    constructor(){
      this.errors = [];
    }
    clearError(){
      this.errors = [];
    }
    setError(errorString){
      this.errors.push({content:errorString, count:1});
    }
    showErrorStats(){
      let result = "";
      for(const eachString of this.errors){
        result += eachString.content + ": " + eachString.count.toString() + "\n";
      }
      console.log(result);
    }
    checkOverlap(errorString){
      for(const eachString of this.errors){
        if (eachString.content === errorString){
          eachString.count++;
          return true;
        }
      }
      this.setError(errorString);
      return false;
    }
    throwError(errorString, properErrorString = ""){
      // 一工夫加える
      // 第二引数に出力したいエラー文字列を設定する
      // これをerrorStringと違うものにすることでチェック用の文字列と出力用の
      // 文字列で違うものが使えるようになるわけ
      // 例えばだけどerrorStringはただの数にしてproperの方で具体的な内容、
      // っていう風にすれば同じ1番ならどれが実行されても1回だけ、とかできる。
      // 新規登録の場合のみtrueを返す
      // これにより無限alert地獄を回避できる
      if (properErrorString === ""){
        properErrorString = errorString;
      }
      if (this.checkOverlap(errorString)) return false;
      window.console.error(properErrorString);
      return true;
    }
  }

  // インスタンスを用意する。
  const foxDriveErrorSystem = new ErrorSystem();

  // window.alertがうっとうしいので1回しか呼ばないように
  // noLoopで書き換えようと思います。
  // 引数を増やすかどうかは応相談
  // 新規の場合のみSystemがtrueを返すのでalertが発生する。2回目以降の場合は何も起きない。
  function myAlert(_string, properErrorString = ""){
    if (foxDriveErrorSystem.throwError(_string, properErrorString)) {
      window.alert(_string);
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // preset colors.
  const presetColors = {
    aliceblue:[0.9411764705882353, 0.9725490196078431, 1],
    antiquewhite:[0.9803921568627451, 0.9215686274509803, 0.8431372549019608],
    aqua:[0, 1, 1],
    aquamarine:[0.4980392156862745, 1, 0.8313725490196079],
    azure:[0.9411764705882353, 1, 1],
    beige:[0.9607843137254902, 0.9607843137254902, 0.8627450980392157],
    bisque:[1, 0.8941176470588236, 0.7686274509803922],
    black:[0, 0, 0],
    blanchedalmond:[1, 0.9215686274509803, 0.803921568627451],
    blue:[0, 0, 1],
    blueviolet:[0.5411764705882353, 0.16862745098039217, 0.8862745098039215],
    brown:[0.6470588235294118, 0.16470588235294117, 0.16470588235294117],
    burlywood:[0.8705882352941177, 0.7215686274509804, 0.5294117647058824],
    cadetblue:[0.37254901960784315, 0.6196078431372549, 0.6274509803921569],
    chartreuse:[0.4980392156862745, 1, 0],
    chocolate:[0.8235294117647058, 0.4117647058823529, 0.11764705882352941],
    coral:[1, 0.4980392156862745, 0.3137254901960784],
    cornflowerblue:[0.39215686274509803, 0.5843137254901961, 0.9294117647058824],
    cornsilk:[1, 0.9725490196078431, 0.8627450980392157],
    crimson:[0.8627450980392157, 0.0784313725490196, 0.23529411764705882],
    cyan:[0, 1, 1],
    darkblue:[0, 0, 0.5450980392156862],
    darkcyan:[0, 0.5450980392156862, 0.5450980392156862],
    darkgoldenrod:[0.7215686274509804, 0.5254901960784314, 0.043137254901960784],
    darkgray:[0.6627450980392157, 0.6627450980392157, 0.6627450980392157],
    darkgreen:[0, 0.39215686274509803, 0],
    darkgrey:[0.6627450980392157, 0.6627450980392157, 0.6627450980392157],
    darkkhaki:[0.7411764705882353, 0.7176470588235294, 0.4196078431372549],
    darkmagenta:[0.5450980392156862, 0, 0.5450980392156862],
    darkolivegreen:[0.3333333333333333, 0.4196078431372549, 0.1843137254901961],
    darkorange:[1, 0.5490196078431373, 0],
    darkorchid:[0.6, 0.19607843137254902, 0.8],
    darkred:[0.5450980392156862, 0, 0],
    darksalmon:[0.9137254901960784, 0.5882352941176471, 0.47843137254901963],
    darkseagreen:[0.5607843137254902, 0.7372549019607844, 0.5607843137254902],
    darkslateblue:[0.2823529411764706, 0.23921568627450981, 0.5450980392156862],
    darkslategray:[0.1843137254901961, 0.30980392156862746, 0.30980392156862746],
    darkslategrey:[0.1843137254901961, 0.30980392156862746, 0.30980392156862746],
    darkturquoise:[0, 0.807843137254902, 0.8196078431372549],
    darkviolet:[0.5803921568627451, 0, 0.8274509803921568],
    deeppink:[1, 0.0784313725490196, 0.5764705882352941],
    deepskyblue:[0, 0.7490196078431373, 1],
    dimgray:[0.4117647058823529, 0.4117647058823529, 0.4117647058823529],
    dimgrey:[0.4117647058823529, 0.4117647058823529, 0.4117647058823529],
    dodgerblue:[0.11764705882352941, 0.5647058823529412, 1],
    firebrick:[0.6980392156862745, 0.13333333333333333, 0.13333333333333333],
    floralwhite:[1, 0.9803921568627451, 0.9411764705882353],
    forestgreen:[0.13333333333333333, 0.5450980392156862, 0.13333333333333333],
    fuchsia:[1, 0, 1],
    gainsboro:[0.8627450980392157, 0.8627450980392157, 0.8627450980392157],
    ghostwhite:[0.9725490196078431, 0.9725490196078431, 1],
    gold:[1, 0.8431372549019608, 0],
    goldenrod:[0.8549019607843137, 0.6470588235294118, 0.12549019607843137],
    gray:[0.5019607843137255, 0.5019607843137255, 0.5019607843137255],
    green:[0, 0.5019607843137255, 0],
    greenyellow:[0.6784313725490196, 1, 0.1843137254901961],
    grey:[0.5019607843137255, 0.5019607843137255, 0.5019607843137255],
    honeydew:[0.9411764705882353, 1, 0.9411764705882353],
    hotpink:[1, 0.4117647058823529, 0.7058823529411765],
    indianred:[0.803921568627451, 0.3607843137254902, 0.3607843137254902],
    indigo:[0.29411764705882354, 0, 0.5098039215686274],
    ivory:[1, 1, 0.9411764705882353],
    khaki:[0.9411764705882353, 0.9019607843137255, 0.5490196078431373],
    lavender:[0.9019607843137255, 0.9019607843137255, 0.9803921568627451],
    lavenderblush:[1, 0.9411764705882353, 0.9607843137254902],
    lawngreen:[0.48627450980392156, 0.9882352941176471, 0],
    lemonchiffon:[1, 0.9803921568627451, 0.803921568627451],
    lightblue:[0.6784313725490196, 0.8470588235294118, 0.9019607843137255],
    lightcoral:[0.9411764705882353, 0.5019607843137255, 0.5019607843137255],
    lightcyan:[0.8784313725490196, 1, 1],
    lightgoldenrodyellow:[0.9803921568627451, 0.9803921568627451, 0.8235294117647058],
    lightgray:[0.8274509803921568, 0.8274509803921568, 0.8274509803921568],
    lightgreen:[0.5647058823529412, 0.9333333333333333, 0.5647058823529412],
    lightgrey:[0.8274509803921568, 0.8274509803921568, 0.8274509803921568],
    lightpink:[1, 0.7137254901960784, 0.7568627450980392],
    lightsalmon:[1, 0.6274509803921569, 0.47843137254901963],
    lightseagreen:[0.12549019607843137, 0.6980392156862745, 0.6666666666666666],
    lightskyblue:[0.5294117647058824, 0.807843137254902, 0.9803921568627451],
    lightslategray:[0.4666666666666667, 0.5333333333333333, 0.6],
    lightslategrey:[0.4666666666666667, 0.5333333333333333, 0.6],
    lightsteelblue:[0.6901960784313725, 0.7686274509803922, 0.8705882352941177],
    lightyellow:[1, 1, 0.8784313725490196],
    lime:[0, 1, 0],
    limegreen:[0.19607843137254902, 0.803921568627451, 0.19607843137254902],
    linen:[0.9803921568627451, 0.9411764705882353, 0.9019607843137255],
    magenta:[1, 0, 1],
    maroon:[0.5019607843137255, 0, 0],
    mediumaquamarine:[0.4, 0.803921568627451, 0.6666666666666666],
    mediumblue:[0, 0, 0.803921568627451],
    mediumorchid:[0.7294117647058823, 0.3333333333333333, 0.8274509803921568],
    mediumpurple:[0.5764705882352941, 0.4392156862745098, 0.8588235294117647],
    mediumseagreen:[0.23529411764705882, 0.7019607843137254, 0.44313725490196076],
    mediumslateblue:[0.4823529411764706, 0.40784313725490196, 0.9333333333333333],
    mediumspringgreen:[0, 0.9803921568627451, 0.6039215686274509],
    mediumturquoise:[0.2823529411764706, 0.8196078431372549, 0.8],
    mediumvioletred:[0.7803921568627451, 0.08235294117647059, 0.5215686274509804],
    midnightblue:[0.09803921568627451, 0.09803921568627451, 0.4392156862745098],
    mintcream:[0.9607843137254902, 1, 0.9803921568627451],
    mistyrose:[1, 0.8941176470588236, 0.8823529411764706],
    moccasin:[1, 0.8941176470588236, 0.7098039215686275],
    navajowhite:[1, 0.8705882352941177, 0.6784313725490196],
    navy:[0, 0, 0.5019607843137255],
    oldlace:[0.9921568627450981, 0.9607843137254902, 0.9019607843137255],
    olive:[0.5019607843137255, 0.5019607843137255, 0],
    olivedrab:[0.4196078431372549, 0.5568627450980392, 0.13725490196078433],
    orange:[1, 0.6470588235294118, 0],
    orangered:[1, 0.27058823529411763, 0],
    orchid:[0.8549019607843137, 0.4392156862745098, 0.8392156862745098],
    palegoldenrod:[0.9333333333333333, 0.9098039215686274, 0.6666666666666666],
    palegreen:[0.596078431372549, 0.984313725490196, 0.596078431372549],
    paleturquoise:[0.6862745098039216, 0.9333333333333333, 0.9333333333333333],
    palevioletred:[0.8588235294117647, 0.4392156862745098, 0.5764705882352941],
    papayawhip:[1, 0.9372549019607843, 0.8352941176470589],
    peachpuff:[1, 0.8549019607843137, 0.7254901960784313],
    peru:[0.803921568627451, 0.5215686274509804, 0.24705882352941178],
    pink:[1, 0.7529411764705882, 0.796078431372549],
    plum:[0.8666666666666667, 0.6274509803921569, 0.8666666666666667],
    powderblue:[0.6901960784313725, 0.8784313725490196, 0.9019607843137255],
    purple:[0.5019607843137255, 0, 0.5019607843137255],
    rebeccapurple:[0.4, 0.2, 0.6],
    red:[1, 0, 0],
    rosybrown:[0.7372549019607844, 0.5607843137254902, 0.5607843137254902],
    royalblue:[0.2549019607843137, 0.4117647058823529, 0.8823529411764706],
    saddlebrown:[0.5450980392156862, 0.27058823529411763, 0.07450980392156863],
    salmon:[0.9803921568627451, 0.5019607843137255, 0.4470588235294118],
    sandybrown:[0.9568627450980393, 0.6431372549019608, 0.3764705882352941],
    seagreen:[0.1803921568627451, 0.5450980392156862, 0.3411764705882353],
    seashell:[1, 0.9607843137254902, 0.9333333333333333],
    sienna:[0.6274509803921569, 0.3215686274509804, 0.17647058823529413],
    silver:[0.7529411764705882, 0.7529411764705882, 0.7529411764705882],
    skyblue:[0.5294117647058824, 0.807843137254902, 0.9215686274509803],
    slateblue:[0.41568627450980394, 0.35294117647058826, 0.803921568627451],
    slategray:[0.4392156862745098, 0.5019607843137255, 0.5647058823529412],
    slategrey:[0.4392156862745098, 0.5019607843137255, 0.5647058823529412],
    snow:[1, 0.9803921568627451, 0.9803921568627451],
    springgreen:[0, 1, 0.4980392156862745],
    steelblue:[0.27450980392156865, 0.5098039215686274, 0.7058823529411765],
    tan:[0.8235294117647058, 0.7058823529411765, 0.5490196078431373],
    teal:[0, 0.5019607843137255, 0.5019607843137255],
    thistle:[0.8470588235294118, 0.7490196078431373, 0.8470588235294118],
    tomato:[1, 0.38823529411764707, 0.2784313725490196],
    turquoise:[0.25098039215686274, 0.8784313725490196, 0.8156862745098039],
    violet:[0.9333333333333333, 0.5098039215686274, 0.9333333333333333],
    wheat:[0.9607843137254902, 0.8705882352941177, 0.7019607843137254],
    white:[1, 1, 1],
    whitesmoke:[0.9607843137254902, 0.9607843137254902, 0.9607843137254902],
    yellow:[1, 1, 0],
    yellowgreen:[0.6039215686274509, 0.803921568627451, 0.19607843137254902],
  }

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

  function hslArray_soft(h, s, l){
    const obj = hsl2rgb_soft(h, s, l);
    return [obj.r, obj.g, obj.b];
  }

  // overlayを使ったhsl2rgb関数
  function hsl2rgb_overlay(h, s, l){
    const hsv = hsv2rgb(h, s, 1);
    l = clamp(l, 0, 1);
    return _overlay(hsv.r, hsv.g, hsv.b, l, l, l);
  }

  function hslArray_overlay(h, s, l){
    const obj = hsl2rgb_overlay(h, s, l);
    return [obj.r, obj.g, obj.b];
  }

  // 長さ4未満の指定を4に揃える
  // たとえばrgbだけしか指定しなくてもalphaを1にしてくれる
  function _validateColorInput(col, defaultValue = 1){
    switch(col.length){
      case 0:
        return [defaultValue, defaultValue, defaultValue, defaultValue];
      case 1:
        return [col[0], col[0], col[0], defaultValue];
      case 2:
        return [col[0], col[0], col[0], col[1]];
      case 3:
        return [col[0], col[1], col[2], defaultValue];
    }
    // 4以上の場合は初めの4つでいい
    return col.slice(0, 4);
  }

  // "AA445512"とかそういうのを変換する
  // parseInt("AA",16)とかするみたい。
  function _parseHexToColor(hexString){
    const result = [];
    for(let i=0; i<8; i+=2){
      const h = hexString.slice(i, i+2);
      result.push(parseInt(hexString.slice(i, i+2), 16)/255);
    }
    return result;
  }

  // 色生成関数
  // 結果は常に長さ4の配列になる
  function coulour(...args){
    // argumentsは配列では無いので、配列にする処理が必要。
    const arg = [...arguments];
    if (typeof arg[0] === 'number') {
      // 第一引数が数の場合はそれ以降も数であるとみなす。エラー処理は特に無し。
      return clamp(_validateColorInput(arg), 0, 1);
    } else if (Array.isArray(arg[0])) {
      // 配列の場合は配列をそのまま使う。この場合2つ目以降があっても無視される。
      return coulour(...arg[0]);
    } else if (typeof arg[0] === 'string') {
      const identifier = arg[0];

      // 16進数指定を使う場合は文字列以外の情報は使用しない。
      if (identifier[0] === '#') {
        const h = arg[0].slice(1);
        switch(h.length){
          case 0: // default is white.
            return [1,1,1,1];
          case 1: // 16段階グレースケール, 不透明
            return _parseHexToColor(h[0]+h[0]+h[0]+h[0]+h[0]+h[0]+"FF");
          case 2: // 16段階グレースケール, アルファ
            return _parseHexToColor(h[0]+h[0]+h[0]+h[0]+h[0]+h[0]+h[1]+h[1]);
          case 3: // 16段階RGB, 不透明
            return _parseHexToColor(h[0]+h[0]+h[1]+h[1]+h[2]+h[2]+"FF");
          case 4: // 16段階RGB, アルファ
            return _parseHexToColor(h[0]+h[0]+h[1]+h[1]+h[2]+h[2]+h[3]+h[3]);
          case 5: // 16段階RGB, 256段階アルファ
            return _parseHexToColor(h[0]+h[0]+h[1]+h[1]+h[2]+h[2]+h[3]+h[4]);
          case 6: // 256段階RGB, 不透明
            return _parseHexToColor(h+"FF");
          case 7: // 256段階RGB, 16段階アルファ
            return _parseHexToColor(h+h[6]);
          default: // 256段階RGB, アルファ
            return _parseHexToColor(h);
        }
      }

      // 以降、頭以外の引数からなる配列を取ったものを使う
      // ただしarg[1]が配列の場合はそれを使う。たとえば("rgb255", [36, 49, 163])のような使い方。
      // それもできた方がいいでしょう。でないといちいち("rgb255", ...someArrayObject) のように書かなければならないので。
      const col = (Array.isArray(arg[1]) ? arg[1] : arg.slice(1));

      // preset指定を使う場合
      const presetColor = presetColors[identifier];
      if (presetColor !== undefined) {
        // alphaが未指定、または第2引数がinvalidの場合は不透明とする
        if (col.length === 0 || (typeof col[0] !== 'number')) {
          // この場合alphaは1とする
          return [...presetColor, 1];
        } else {
          return [...presetColor, clamp(col[0], 0, 1)];
        }
      }

      // hsvなどの色指定を使う場合
      const data = _validateColorInput(col, (identifier === "rgb255" ? 255 : 1));
      // この時点で長さ4なので問題ないね。
      switch(identifier){
        case "rgb":
          // そのまま返す
          return clamp(data, 0, 1);
        case "rgb255":
          // 255で割る
          return data.map((x) => clamp(x/255, 0, 1));
        case "hsv":
          const hsvColor = hsvArray(...data.slice(0, 3));
          hsvColor.push(data[3]);
          return hsvColor;
        case "hsl":
        case "hsl_soft":
          const hslColor_soft = hslArray_soft(...data.slice(0, 3));
          hslColor_soft.push(data[3]);
          return hslColor_soft;
        case "hsl_overlay":
          const hslColor_overlay = hslArray_overlay(...data.slice(0, 3));
          hslColor_overlay.push(data[3]);
          return hslColor_overlay;
      }
    }
    return [1,1,1,1]; // default is white.
  }

  // coulourの出力であるRGBA(0～1)をcssのrgb表記にコンバートするための関数
  // これを使わないとfillStyleにぶち込めない
  function _convertToCssColor(col) {
    let result = 'rgb(';
    result += (255*col[0]).toFixed(3).toString() + ", ";
    result += (255*col[1]).toFixed(3).toString() + ", ";
    result += (255*col[2]).toFixed(3).toString() + ", ";
    result += (255*col[3]).toFixed(3).toString() + ")";
    return result;
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

  // 初期化時のstump指定を破棄しましょ。これ使ってないし。代わりにdelayを用意しよう。
  // elapsedStump = window.performance.now() + delay;
  // これで初期化する。たとえばdelayが500の場合、500ミリ秒経過するまではgetElapsedMillis()が負の数を返したり、
  // progressが0を返したりする（clampに修正しました）. そのあとactiveになると。checkを実行してもfalseしか返さないし。
  // ちゃんと最後は終わってくれるので問題なし
  // 寿命を表現したりできるといいね。

  // ちょっとすっきりさせました
  // stepFunctionは廃止
  // completeFunctionはinitializeの時のみ登録可能にする
  // active関連の記述を全消し
  // 実行可否が問題ならそれについてはオブジェクトを紐付けて
  // 内部で分岐処理すればいい
  // timerに何でもやらせるな。
  // 保守管理しづらくなる。デメリットしかない。
  class Timer{
    constructor(){
      this.timers = {};
    }
    initialize(name, params = {}){
      const {
        delay = 0,
        duration = Infinity,
        scale = 1000,
        completeFunction = () => {}
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
    getProgress(name){
      // stumpからの経過時間(elapsed)をdurationで割ることで進捗を調べるのに使う感じ
      if (!this.validateName(name, "getProgress")) return null;
      const target = this.timers[name];
      if (target.duration > 0) {
        const prg = Math.min(1, this.getElapsedMillis(name) / target.duration);
        return prg;
      }
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
        target.completeFunction();
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
    d.depth_component = gl.DEPTH_COMPONENT;
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
    d.const_color = gl.CONSTANT_COLOR;
    d.one_minus_const_color = gl.ONE_MINUS_CONSTANT_COLOR;
    d.const_alpha = gl.CONSTANT_ALPHA;
    d.one_minus_const_alpha = gl.ONE_MINUS_CONSTANT_ALPHA;
    d.func_add = gl.FUNC_ADD;
    d.func_sub = gl.FUNC_SUBTRACT;
    d.func_reverse_sub = gl.FUNC_REVERSE_SUBTRACT;
    d.func_min = gl.MIN;
    d.func_max = gl.MAX;
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

  // 意地でも被らせない
  const foxMixBlendingDictionary = {
    blend:0,
    clip_on:1,
    clip_off:2,
    xor:3,
    erase:4,
    add:5,
    multiply:6,
    screen:7,
    hard_light:8,
    overlay:9,
    darken:10,
    lighten:11,
    dodge:12,
    burn:13,
    difference:14,
    soft_light:15,
    exclusion:16,
    hue:17,
    saturation:18,
    color_tone:19,
    luminosity:20,
    constant:30,
    texture:31
  };

  // まあ、いずれね...
  const foxFilteringDictionary = {
    gray:0
  };

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

  // VAOはやめましょ。廃止。廃止する方向で。

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
    // fboの場合wとhは「必須」なのでここははっきり言ってどうでもいいけどsrcは{}でないとまずいですねすみませんすみません
    if(info.src !== undefined){
      let td = _getTextureData(info.target, info.src);
      if (info.target === "texture_cube_map") { td = td.xp; } // どれか。どれでもOK.
      // テクスチャデータから設定されるようにする。理由：めんどくさいから！！
      if (info.w === undefined || info.h === undefined) {
        // videoElementのケースとそれ以外で分ける
        if (info.src instanceof HTMLVideoElement) {
          info.w = td.videoWidth;
          info.h = td.videoHeight;
        } else {
          info.w = td.width;
          info.h = td.height;
        }
      }
    } else {
      if (info.target === "texture_cube_map") {
        info.src = {};
      }
    }
  }

  // info.srcが用意されてないならnullを返す。一種のバリデーション。
  // これをデフォとしていろいろ作ればいい
  function _getTextureDataFromSrc(src){
    if(src === undefined){ return null; }
    if(src instanceof Uint8Array || src instanceof Float32Array){ return src; }
    if(src instanceof HTMLImageElement){ return src; }
    if(src instanceof HTMLCanvasElement){ return src; }
    if(src instanceof HTMLVideoElement){ return src; }
    // p5が使われてる場合にこれを評価します（確かFALさんが使ってた）
    if (typeof p5 === 'function') {
      if(src instanceof p5.Graphics){ return src.elt; }
      if(src instanceof p5.Image){ return src.canvas; }
    }
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
        // テクスチャの関連付け（ここでキューブしちゃう？）
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

    // info.color.attachTypeがtextureなのはデフォルトなんだけどここでデフォルトを決めてしまいましょう
    if (info.color.attachType === "texture") {
      // colorの場合、typeをfloatやhalf_floatに設定し、あとは未定義にすることが想定されるユースケースである。
      if (colorInfo.type === undefined) colorInfo.type = "ubyte";
      if (colorInfo.format === undefined) colorInfo.format = "rgba";
      if (colorInfo.internalFormat === undefined) {
        if (colorInfo.type === "float") {
          colorInfo.internalFormat = "rgba32f";
        } else if (colorInfo.type === "half_float") {
          colorInfo.internalFormat = "rgba16f";
        } else {
          colorInfo.internalFormat = "rgba"; // 規定値。ubyteの場合など、一般的な使用法のケース。
        }
      }
    }

    // info.depth.attachTypeがtextureの場合のデフォルトを設定する
    if (info.depth.attachType === "texture") {
      // depthの場合、internalFormatをdepth32fにしたりdepth16にしたり、といったユースケースが想定されるので、こうする。
      // 未定義の場合はdepth32fが採用され、然るべく設定される。
      if (depthInfo.format === undefined) depthInfo.format = "depth_component";
      if (depthInfo.internalFormat === undefined) depthInfo.internalFormat = "depth32f";
      if (depthInfo.type === undefined) {
        if (depthInfo.internalFormat === "depth16") {
          depthInfo.type = "ushort";
        } else {
          depthInfo.type = "float"; // 規定値。depth32fの場合はこれ。
        }
      }
    }

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
  // いずれクラス化したい...
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
      // もしtarget:cube_mapが指定されていれば、これはcube_mapのテクスチャとなる。
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
      // colorInfo.targetがtexture_cube_mapの場合、ここでアタッチメントする必要はない。描画時にそれぞれのターゲットに描画する
      // 流れになるので、そうする。というか、これ2dにしか対応してないからそもそも使えない。
      if (colorInfo.target === "texture_2d") {
        _connectWithFramebuffer(gl, gl.COLOR_ATTACHMENT0, info.color.attachType, colorBuffer);
      }
      // なお、cube_mapとMRTは両立しないし、その必要もない。
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
    //result.double = false;
    return result;
  }

  // テクスチャはクラスにするつもり。もう少々お待ちを...canvas要素から生成できるように作るつもり。

  // fboのダブル。TFFとは違うのよね。フレームの別の場所参照できるから。そこが異なるようです。
  // validateの重ね掛けは問題ないので、そのままぶちこめ。
  // 廃止
  // ただ枠組み自体は便利なので何らかの形で仕様を復活させられたらとは思います

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
  // Figure.
  // いろいろやることあるんかなぁ。今はこんな感じ。dict渡したけどまあ、何かに使えるでしょう...分かんないけど。
  // こっちもインスタンスで拡張できるはず...除数を指定するだけでしょ？
  class Figure{
    constructor(gl, name, attrs, dict){
      this.gl = gl;
      this.name = name;
      //this.useVAO = false;
      this.vbos = _createVBOs(gl, attrs, dict);
      // countはもう計算してしまおう（面倒）
      const attrName = Object.keys(this.vbos)[0];
      this.count = this.vbos[attrName].count / this.vbos[attrName].size; // countを持たせてしまう。
    }
    getVBOs(){
      return this.vbos;
    }
    swapAttribute(attrName0, attrName1){
      // TFF用の属性swap関数
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
  // VAO廃止
  /*
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
  */

  // TransformFeedback用のFigureは要らないかも。

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
        // cosとsinが逆でした。
        mesh.n.push(
          Math.cos(angle) * Math.cos(theta),
          Math.sin(angle) * Math.cos(theta),
          Math.sin(theta)
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
    const tang = diffNext;
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

    const lastPoint = new Vec3();
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
      // ここで先にdtx個の点を作ってしまう
      // んでlastPointに最も近い点を使えばいい
      // k===0の場合はどの点でもよい
      const surfacePoints = [];
      for(let i=0; i<=dtx; i++){
        const phi = Math.PI*2*i/dtx;
        const n = fs.pnorm.copy().mult(Math.cos(phi)).addScalar(fs.bnorm, Math.sin(phi));
        const p = fs.cur.copy().addScalar(n, r);
        surfacePoints.push({n:n, p:p, index:i, d:p.dist(lastPoint)});
      }
      // dでsortする
      const candidates = surfacePoints.slice();
      candidates.sort((p1, p2) => (p1.d > p2.d ? 1 : (p1.d < p2.d ? -1 : 0)));
      const nearestIndex = candidates[0].index;
      const nearestPoint = candidates[0].p;
      // 最後の起点にもっとも近い点を採用することでくびれを回避する
      lastPoint.set(nearestPoint);

      for(let i=0; i<=dtx; i++){
        const {n, p} = surfacePoints[(i + nearestIndex) % dtx];
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
      const bb = this.getBoundingBox();
      const xMid = (bb.xMax + bb.xMin) * 0.5;
      const yMid = (bb.yMax + bb.yMin) * 0.5;
      const zMid = (bb.zMax + bb.zMin) * 0.5;
      const _size = Math.max((bb.xMax - bb.xMin)*0.5, (bb.yMax - bb.yMin)*0.5, (bb.zMax - bb.zMin)*0.5);
      // ここプラスじゃなくてマイナスですよね...？
      this.translate(-xMid, -yMid, -zMid);
      this.scale(radius/_size, radius/_size, radius/_size);
      return this;
    }
    getBoundingBox(){
      // あった方がいいでしょう
      // ベースを0にしたりできるし
      let xMin = Infinity;
      let xMax = -Infinity;
      let yMin = Infinity;
      let yMax = -Infinity;
      let zMin = Infinity;
      let zMax = -Infinity;
      for(let i = 0; i < this.v.length/3; i++){
        xMin = Math.min(this.v[3*i], xMin);
        xMax = Math.max(this.v[3*i], xMax);
        yMin = Math.min(this.v[3*i+1], yMin);
        yMax = Math.max(this.v[3*i+1], yMax);
        zMin = Math.min(this.v[3*i+2], zMin);
        zMax = Math.max(this.v[3*i+2], zMax);
      }
      return {xMin, xMax, yMin, yMax, zMin, zMax};
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
    getVerticePositions(){
      // マージしたうえで頂点集合を返す（マンハッタン判定）
      const result = [];
      for (let i = 0; i < this.v.length / 3; i++) {
        result.push(
          new Vec3(this.v.slice(3*i, 3*i+3))
        );
      }

      // 閾値で判定しましょ。icoSphereで失敗してた(28個くらいミスってた)
      // 総当たりですがマンハッタンなので負荷は小さいはずです
      // 毎フレームやるような処理でもないし特に問題ないでしょ
      for (let k = 0; k < result.length; k++) {
        for (let i = result.length-1; i > k; i--) {
          const l = result[k];
          const r = result[i];
          if (Math.abs(l.x - r.x) + Math.abs(l.y - r.y) + Math.abs(l.z - r.z) < 0.000001) {
            result.splice(i,1);
          }
        }
      }

      return result;
    }
    getFacePositions(){
      // 面の重心を返す
      // これと上記のgetVerticePositionsを組み合わせると割とバラバラに取れる感じですね
      // icoSphereと相性が良いかと
      const result = [];
      const v0 = new Vec3();
      const v1 = new Vec3();
      const v2 = new Vec3();
      for (let i = 0; i < this.f.length / 3; i++) {
        const a = this.f[3*i];
        const b = this.f[3*i+1];
        const c = this.f[3*i+2];

        v0.set(this.v.slice(3*a, 3*a+3));
        v1.set(this.v.slice(3*b, 3*b+3));
        v2.set(this.v.slice(3*c, 3*c+3));

        result.push(Vec3.add(v0, v1).add(v2).mult(1/3));
      }
      return result;
    }
    static validateParameter(x, y, z, _default = 0){
      if (x === undefined) { x = _default; }
      const result = {};
      if (typeof x === 'number') {
        result.x = x;
        result.y = (y === undefined ? result.x : y);
        result.z = (z === undefined ? result.y : z);
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
  // Default Painters.

  // createTextureRenderer.
  // 表示位置をいじれるようにするのとか色々付け加えたいところ。
  // ただめんどうなのでplaneのtransform作ったら終わりでいいです
  function _createTextureRenderer(node){
    // デフォルトの"leftUp"とする。
    const sh = new PlaneShader(node);
    sh.initialize();
    sh.addUniform("bool", "uFlip", "vs");
    sh.addUniform("vec2", "uScale", "vs");
    sh.addUniform("float", "uRotation", "vs");
    sh.addUniform("vec2", "uTranslate", "vs");
    sh.addCode(`
      // fboの場合はuvを逆にする。
      if (uFlip) {
        vUv.y = 1.0 - vUv.y;
      }
      position *= uScale;
      position *= mat2(cos(uRotation), -sin(uRotation), sin(uRotation), cos(uRotation));
      position += uTranslate;
    `, "preProcess", "vs");
    sh.addUniform("sampler2D", "uTex", "fs");
    sh.addUniform("vec4", "uMonoColor", "fs");
    sh.addUniform("vec4", "uFromColor", "fs");
    sh.addUniform("vec4", "uToColor", "fs");
    sh.addUniform("vec4", "uGradStop", "fs");
    sh.addUniform("int", "uGradType", "fs");
    sh.addUniform("int", "uMaterialFlag", "fs");
    sh.addUniform("bool", "uSmoothGrad", "fs");
    sh.addUniform("vec4", "uTint", "fs");
    sh.addCode(snipet.createMaterialColor, "routines", "fs");
    sh.addCode(`
      color = createMaterialColor(
        uMaterialFlag, uTex, uMonoColor,
        uFromColor, uToColor, uGradType, uGradStop,
        uSmoothGrad, uv
      );
      if (uMaterialFlag == 0) {
        // テクスチャの場合は乗算済みなので、uTintのrgbにaを掛けたものを掛ける
        // やはり割ってから掛けるのは不自然でしょう
        color *= (uTint * vec4(vec3(uTint.a), 1.0));
      } else {
        // それ以外の場合は、普通にuTintを掛け、次いでrgbにaを掛ける。
        color *= uTint;
        color.rgb *= color.a;
      }
    `, "preProcess", "fs");
    sh.registPainter("__foxTextureRenderer__");
  }

  function _createMixTextureRenderer(node){
    const sh = new PlaneShader(node);
    sh.initialize();
    sh.addUniform("vec2", "uScale", "vs");
    sh.addUniform("float", "uRotation", "vs");
    sh.addUniform("vec2", "uTranslate", "vs");
    // Flipがtrueになるのはfboが絡む場合のみで、これは基本的にfalseです。
    sh.addUniform("bool", "uFlip_src", "vs");
    sh.addUniform("bool", "uFlip_dst", "vs");
    sh.addUniform("bool", "uFlip_mix", "vs");
    sh.clearVaryings();
    sh.addVarying("vec2", "vUv_src");
    sh.addVarying("vec2", "vUv_dst");
    sh.addVarying("vec2", "vUv_mix");
    // フリップしないのにフリップするとかいう謎コード
    // テクスチャの基本的な方向が上から下なので仕方ないです

    // 以下、16個の変数を...めんどくさいですが。
    sh.writeCode(`
      vec2 position = aPosition;
      vUv_src = aPosition * 0.5 + 0.5;
      vUv_dst = aPosition * 0.5 + 0.5;
      vUv_mix = aPosition * 0.5 + 0.5;
      if (!uFlip_src) vUv_src.y = 1.0 - vUv_src.y;
      if (!uFlip_dst) vUv_dst.y = 1.0 - vUv_dst.y;
      if (!uFlip_mix) vUv_mix.y = 1.0 - vUv_mix.y;
      position *= uScale;
      position *= mat2(cos(uRotation), -sin(uRotation), sin(uRotation), cos(uRotation));
      position += uTranslate;
    `, "preProcess", "vs");

    sh.addUniform("sampler2D", "uTex_src", "fs");
    sh.addUniform("vec4", "uMonoColor_src", "fs");
    sh.addUniform("vec4", "uFromColor_src", "fs");
    sh.addUniform("vec4", "uToColor_src", "fs");
    sh.addUniform("vec4", "uGradStop_src", "fs");
    sh.addUniform("int", "uGradType_src", "fs");
    sh.addUniform("int", "uMaterialFlag_src", "fs");
    sh.addUniform("bool", "uSmoothGrad_src", "fs");

    sh.addUniform("sampler2D", "uTex_dst", "fs");
    sh.addUniform("vec4", "uMonoColor_dst", "fs");
    sh.addUniform("vec4", "uFromColor_dst", "fs");
    sh.addUniform("vec4", "uToColor_dst", "fs");
    sh.addUniform("vec4", "uGradStop_dst", "fs");
    sh.addUniform("int", "uGradType_dst", "fs");
    sh.addUniform("int", "uMaterialFlag_dst", "fs");
    sh.addUniform("bool", "uSmoothGrad_dst", "fs");

    sh.addUniform("int", "uCompositeFlag", "fs");
    sh.addUniform("float", "uMixConstant", "fs");
    sh.addUniform("sampler2D", "uTex_mix", "fs");
    sh.addUniform("int", "uBlendType", "fs"); // multiply以降のブレンド方法指定

    sh.addCode(snipet.createMaterialColor, "routines", "fs");
    sh.addCode(snipet.blend.blend, "routines", "fs");
    sh.addCode(snipet.blend.clip_on, "routines", "fs");
    sh.addCode(snipet.blend.clip_off, "routines", "fs");
    sh.addCode(snipet.blend.xor, "routines", "fs");
    sh.addCode(snipet.blend.erase, "routines", "fs");
    sh.addCode(snipet.blend.add, "routines", "fs");
    sh.addCode(snipet.blend.createBlendColor, "routines", "fs");
    sh.addCode(snipet.blend.multiply, "routines", "fs");
    sh.addCode(snipet.blend.screen, "routines", "fs");
    sh.addCode(snipet.blend.hard_light, "routines", "fs");
    sh.addCode(snipet.blend.overlay, "routines", "fs");
    sh.addCode(snipet.blend.darken, "routines", "fs");
    sh.addCode(snipet.blend.lighten, "routines", "fs");
    sh.addCode(snipet.blend.dodge, "routines", "fs");
    sh.addCode(snipet.blend.burn, "routines", "fs");
    sh.addCode(snipet.blend.difference, "routines", "fs");
    sh.addCode(snipet.blend.soft_light, "routines", "fs");
    sh.addCode(snipet.blend.exclusion, "routines", "fs");
    sh.addCode(snipet.blend.blendUtils, "routines", "fs");
    sh.addCode(snipet.blend.hue, "routines", "fs");
    sh.addCode(snipet.blend.saturation, "routines", "fs");
    sh.addCode(snipet.blend.color_tone, "routines", "fs");
    sh.addCode(snipet.blend.luminosity, "routines", "fs");

    sh.addCode(`
      vec4 composite(in vec4 src, in vec4 dst, in int flag){
        if (flag == 0) { // blend. (source-over)
          return blend(src, dst);
        }
        if (flag == 1) { //
          return clip_on(src, dst);
        }
        if (flag == 2) { //
          return clip_off(src, dst);
        }
        if (flag == 3) { //
          return xor(src, dst);
        }
        if (flag == 4) { //
          return erase(src, dst);
        }
        if (flag == 5) { // add. (lighter)
          return add(src, dst);
        }
        if (flag == 6) { //
          return multiply(src, dst, uBlendType);
        }
        if (flag == 7) { //
          return screen(src, dst, uBlendType);
        }
        if (flag == 8) {
          return hard_light(src, dst, uBlendType);
        }
        if (flag == 9) {
          return overlay(src, dst, uBlendType);
        }
        if (flag == 10) {
          return darken(src, dst, uBlendType);
        }
        if (flag == 11) {
          return lighten(src, dst, uBlendType);
        }
        if (flag == 12) {
          return dodge(src, dst, uBlendType);
        }
        if (flag == 13) {
          return burn(src, dst, uBlendType);
        }
        if (flag == 14) {
          return difference(src, dst, uBlendType);
        }
        if (flag == 15) {
          return soft_light(src, dst, uBlendType);
        }
        if (flag == 16) {
          return exclusion(src, dst, uBlendType);
        }
        if (flag == 17) {
          return hue(src, dst, uBlendType);
        }
        if (flag == 18) {
          return saturation(src, dst, uBlendType);
        }
        if (flag == 19) {
          return color_tone(src, dst, uBlendType);
        }
        if (flag == 20) {
          return luminosity(src, dst, uBlendType);
        }
        if (flag == 30) { // constant.
          // 単純に定数補間
          return (1.0 - uMixConstant) * src + uMixConstant * dst;
        }
        if (flag == 31) {
          // textureのr値で補間する
          float ratio = texture(uTex_mix, vUv_mix).r;
          return (1.0 - ratio) * src + ratio * dst;
        }
        return vec4(1.0);
      }
    `, "routines", "fs");

    sh.writeCode(`
      // 得られる値はtextureの場合は乗算済み、それ以外は乗算無しになりました。
      // blendingは乗算前を前提として行うので、textureの場合はaで割り算します。
      vec4 src = createMaterialColor(
        uMaterialFlag_src, uTex_src, uMonoColor_src, uFromColor_src, uToColor_src,
        uGradType_src, uGradStop_src, uSmoothGrad_src, vUv_src
      );
      vec4 dst = createMaterialColor(
        uMaterialFlag_dst, uTex_dst, uMonoColor_dst, uFromColor_dst, uToColor_dst,
        uGradType_dst, uGradStop_dst, uSmoothGrad_dst, vUv_dst
      );
      // textureの場合、rgbをaで割る
      if (uMaterialFlag_src == 0 && src.a > 0.0) {
        src.rgb /= src.a;
      }
      if (uMaterialFlag_dst == 0 && dst.a > 0.0) {
        dst.rgb /= dst.a;
      }
      // それぞれを色として扱うために切り詰めを実行する
      src = clamp(src, vec4(0.0), vec4(1.0));
      dst = clamp(dst, vec4(0.0), vec4(1.0));
      // blend処理は乗算前のrgbaにより計算される。
      vec4 color = composite(src, dst, uCompositeFlag);
      // この処理は不要。なぜなら算出される値は乗算後のものだから。
      // 2DのglobalCompositeOperationに基づいて計算すると乗算後の値が得られる
      // ので、ここで殊更にalphaを掛ける必要がありません（二度手間になってしまう）
      // color.rgb *= color.a;
    `, "preProcess", "fs");

    sh.registPainter("__foxMixTextureRenderer__");
  }

  // 単純に最大4枚のテクスチャを表示するだけ。無い場所はvec4(0.0)となり、blend:"blend"なら背景色になる。
  function _createQuadTextureRenderer(node){
    const sh = new PlaneShader(node);
    sh.initialize();
    // テクスチャを4枚読み込んで4隅に縮小して4つ並べるだけのきわめてシンプルな
    // シェーダです。存在しない場合、そこは真っ黒になります。透明度0の。
    // 今回はuvを分割するのではなくfsサイドでyを反転させる方向で行きます
    sh.addUniform("sampler2D", "uTex0", "fs");
    sh.addUniform("sampler2D", "uTex1", "fs");
    sh.addUniform("sampler2D", "uTex2", "fs");
    sh.addUniform("sampler2D", "uTex3", "fs");
    sh.addUniform("bool", "uFlip0", "fs");
    sh.addUniform("bool", "uFlip1", "fs");
    sh.addUniform("bool", "uFlip2", "fs");
    sh.addUniform("bool", "uFlip3", "fs");
    sh.addUniform("int", "uTextureNum", "fs");
    sh.addCode(`
      vec4 getTexture(in int id, in int textureNum, in sampler2D tex, in bool flip, in vec2 p){
        if (id >= textureNum) return vec4(0.0);
        if (flip) p.y = 1.0 - p.y;
        return texture(tex, p);
      }
    `, "routines", "fs");
    sh.addCode(`
      int id = 0;
      if (uv.x < 0.5) { uv.x *= 2.0; }
      else { id += 1; uv.x = (uv.x - 0.5) * 2.0; }
      if (uv.y < 0.5) { uv.y *= 2.0; }
      else { id += 2; uv.y = (uv.y - 0.5) * 2.0; }
      if (id == 0) color = getTexture(0, uTextureNum, uTex0, uFlip0, uv);
      if (id == 1) color = getTexture(1, uTextureNum, uTex1, uFlip1, uv);
      if (id == 2) color = getTexture(2, uTextureNum, uTex2, uFlip2, uv);
      if (id == 3) color = getTexture(3, uTextureNum, uTex3, uFlip3, uv);
      // テクスチャの値をそのまま表示するだけですから、不要ですね。
      // 間に処理が挟まる場合は、一旦rgbをaで割って、最後にこれを適用する必要があります。
      //color.rgb *= color.a;
    `, "preProcess", "fs");
    sh.registPainter("__foxQuadTextureRenderer__");
  }

  // 重複処理になってしまっているのでまとめてしまおう
  // ざっくりいうとMRTの場合はfbo/color/2とか指定するんだよ
  // ってだけの話。splitが重複してるのは無視してください。
  function _setTextureUniform(node, type, name, postFix = ""){
    const data = type.split('/');
    const identifier = data[0];
    if (data[0] === 'tex') {
      node.setUniform("uFlip" + postFix, false);
      node.setTexture("uTex" + postFix, name);
    } else if (data[0] === 'fbo') {
      node.setUniform("uFlip" + postFix, true);
      if (data.length === 1) {
        node.setFBOtexture2D("uTex" + postFix, name);
      } else {
        node.setFBOtexture2D("uTex" + postFix, name, data[1], Number(data[2]));
      }
    }
  }

  // これを関数化しないと詰んでしまう
  function _setMaterialUniforms(node, materialType, target, postFix = ""){
    const identifier = materialType.split('/')[0];
    // そうだっけ。基本これにしないと上書きされてしまう。
    // これがtrueになるのはfboが絡む場合だけ
    node.setUniform("uFlip" + postFix, false);

    switch(identifier){
      case 'tex':
      case 'fbo':
        node.setUniform("uMaterialFlag" + postFix, 0);
        _setTextureUniform(
          node, materialType, target, postFix
        );
        break;
      case 'color':
        node.setUniform("uMaterialFlag" + postFix, 1);
        node.setColor("uMonoColor" + postFix, target);
        break;
      case 'grad':
        const {
          from:fromGradationColor = {},
          to:toGradationColor = {},
          type:gradationType = "linear",
          smooth:smoothGradation = false
        } = target;
        const {
          color:fromColor = "white",
          x:fromX = 0, y:fromY = 0
        } = fromGradationColor;
        const {
          color:toColor = "black",
          x:toX = 1, y:toY = 1
        } = toGradationColor;
        node.setUniform("uMaterialFlag" + postFix, 2);
        node.setColor("uFromColor" + postFix, fromColor);
        node.setColor("uToColor" + postFix, toColor);
        node.setUniform("uGradStop" + postFix, [fromX, fromY, toX, toY]);
        node.setUniform("uGradType" + postFix, (gradationType === "linear" ? 0 : 1));
        node.setUniform("uSmoothGrad" + postFix, smoothGradation);
        break;
      case 'texGrad':
        const {
          from:fromTextureGradationColor = "white",
          to:toTextureGradationColor = "black",
          type:textureGradationMaterialType = 'tex',
          name:textureGradationTarget = "",
          smooth:smoothTextureGradation
        } = target;

        node.setUniform("uMaterialFlag" + postFix, 3);
        node.setColor("uFromColor" + postFix, fromTextureGradationColor);
        node.setColor("uToColor" + postFix, toTextureGradationColor);
        // 一応MRTを考慮する。たとえば'fbo/color/1'のように宣言する。
        // MRTの簡単なサンプルも作るかぁー：作ったよ
        _setTextureUniform(
          node, textureGradationMaterialType, textureGradationTarget, postFix
        );
        node.setUniform("uSmoothGrad" + postFix, smoothTextureGradation);
        break;
    }
  }

  function _setMixtureUniform(node, mix){
    // mixStringを/でsplitしてそれぞれで分岐処理する

    // mixIdの設定がバグってた...ああああ...
    const data = mix.split('/');
    const mixId = foxMixBlendingDictionary[data[0]];
    node.setUniform("uCompositeFlag", mixId);

    // 6～20の場合はdata.length>1のケースで分ける
    if (mixId >= 6 && mixId <= 20) {
      if (data.length > 1) {
        if (data[1] === "clip_on"){ node.setUniform("uBlendType", 1); }
        else if (data[1] === "clip_off"){ node.setUniform("uBlendType", 2); }
      } else {
        node.setUniform("uBlendType", 0);
      }
    }
    if (mixId === 30) {
      // constantの場合は数字かどうか見る
      if (data.length > 1 && !isNaN(Number(data[1]))) {
        node.setUniform("uMixConstant", Number(data[1]));
      } else {
        node.setUniform("uMixConstant", 0.5);
      }
    }
    if (mixId === 31) {
      // textureの場合は1つ目でtexかfboか判断しそれ以降で以下略
      // texture/fbo/color/2/myFBOみたいにする（末尾が名前）
      const textureName = data.pop();
      // 最初はtextureなのでそこも切らないといけない。
      data.shift(0);
      // 切ったら残りを/でつないで復元する
      const textureType = data.reduce((s, t) => s + '/' + t);
      _setTextureUniform(node, textureType, textureName, "_mix");
    }
  }

  // 進んでる方向は正しいので自信を持とうね
  function _renderingTexture(node, materialType, target, options = {}){
    node.use("__foxTextureRenderer__", "foxBoard");

    _setMaterialUniforms(node, materialType, target);

    const {transform = {}} = options;
    const {sx = 1, sy = 1, r = 0, tx = 0, ty = 0} = transform;
    node.setUniforms({
      uScale:[sx, sy], uRotation:r, uTranslate:[tx, ty]
    });
    // renderTextureのみuTintを用意する。
    // これがあるとテクスチャ画像の透明度だけいじるような使い方ができる（デフォルトは[1,1,1,1]）
    // これsetColorだと色としてしか扱えないんですが、赤だけ2倍にするとか、そういうことができないので、
    // 敢えてcoulourは使わずにこの形式で行こうと思います。はい。あくまで柔軟性のためにね。
    // 大体、色がいいならex.coulour("teal")とかすればいいので、何の問題もないです。tintは色とは限らない、それでいこう。
    const {tint = [1, 1, 1, 1]} = options;
    node.setUniform("uTint", tint);

    const {depthMask = false, depthTest = false, cullFace = "disable"} = options;
    options.depthMask = depthMask;
    options.depthTest = depthTest;
    options.cullFace = cullFace;

    node.drawArrays("triangle_strip", options);
    node.unbind();
  }

  function _renderingMixTexture(node, src, dst, options = {}){
    node.use("__foxMixTextureRenderer__", "foxBoard");

    const {type:materialType_src = 'color', target:target_src = 'black'} = src;
    const {type:materialType_dst = 'color', target:target_dst = 'white'} = dst;

    _setMaterialUniforms(node, materialType_src, target_src, "_src");
    _setMaterialUniforms(node, materialType_dst, target_dst, "_dst");

    // colorも追加して。mix:"color"の場合、mixColor(デフォは黒)の値で
    // 1-mixColorとmixColor使ってsrcとdstを補間する。色指定はcoulourに従う。

    const {mix = "blend"} = options;
    // ここでmixの/指定を分解し、6～20についてはclip_onとclip_offの指定があるか
    // 見ます。constantの場合は1番にNumberをかましてNaNでなければその値とし0～1に
    // clampしてuniformに送ります。textureの場合はtexかfboか見てfboならそのあとの
    // colorとかいろいろ見ますね。ほぼ一緒。

    _setMixtureUniform(node, mix); // これでまとめましょ

    const {transform = {}} = options;
    const {sx = 1, sy = 1, r = 0, tx = 0, ty = 0} = transform;
    node.setUniforms({
      uScale:[sx, sy], uRotation:r, uTranslate:[tx, ty]
    });

    const {depthMask = false, depthTest = false, cullFace = "disable"} = options;
    options.depthMask = depthMask;
    options.depthTest = depthTest;
    options.cullFace = cullFace;

    node.drawArrays("triangle_strip", options);
    node.unbind();
  }

  // とにかくシンプルに。transformもしません。4枚表示するだけ。
  function _renderingQuadTextures(node, textures = [], options = {}){
    node.use("__foxQuadTextureRenderer__", "foxBoard");

    for (let i=0; i<textures.length; i++) {
      const tex = textures[i];
      const {type, target} = tex;
      _setTextureUniform(node, type, target, i.toString());
    }
    node.setUniform("uTextureNum", textures.length);

    const {depthMask = false, depthTest = false, cullFace = "disable"} = options;
    options.depthMask = depthMask;
    options.depthTest = depthTest;
    options.cullFace = cullFace;

    node.drawArrays("triangle_strip", options);
    node.unbind();
  }

  // ---------------------------------------------------------------------------------------------- //
  // Utility for save texture

  function _getSaveTargetInfo(target){
    const data = target.split('/');
    const targetType = data[0];
    const targetName = data.pop();
    // textureの場合
    if (targetType === "tex") {
      return {type:"tex", typeDetail:"tex", name:targetName};
    }
    if (targetType === "fbo") {
      // reduceはdata自身を変更しないのでこの書き方になる
      return {type:"fbo", typeDetail:data.reduce((s, t) => s + '/' + t), name:targetName};
    }
    // デフォルトフレームバッファを保存する場合
    return {type:null};
  }

  function _textureToCanvas(result, w, h){
    // 即席のキャンバス要素を生成してそこに落とす
    const captureCanvas = document.createElement('canvas');
    const ctx = captureCanvas.getContext('2d');
    captureCanvas.width = w;
    captureCanvas.height = h;

    const imageData = ctx.createImageData(w, h);
    imageData.data.set(result);
    ctx.putImageData(imageData, 0, 0);

    return captureCanvas;
  }

  function _downloadURI(fileName, uri){
    const link = document.createElement('a');
    link.download = fileName;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 最終的なセーブ用の関数
  function _saveCanvasImage(saveTargetCanvas, mimeType, fileName, postFix){
    const datauri = saveTargetCanvas.toDataURL(mimeType);
    _downloadURI(fileName + postFix, datauri);
    URL.revokeObjectURL(datauri);
  }

  // 指定方法
  // ベースをそのまま保存するだけなら...mimeも指定するか
  // .のうしろがmimeになるようにしよう。これで完成！
  // もちろん文字列に全部ぶち込まない方がいい場合もあるのであくまで選択肢として。
  function _getSaveOptionsFromString(s){
    const data = s.split('.');
    if (data.length === 1){
      return {fileName:data[0]};
    }
    // .のうしろはmime
    const mime = data.pop();
    // mimeとファイル名だけの場合
    if (data.length === 1){
      return {fileName:data[0], mime};
    }
    // これ以降はtexやfboのケースとなる
    const subData = data[0].split('/');
    const fileName = subData.pop();
    const target = subData.reduce((s, t) => s + '/' + t);
    return {target, fileName, mime};
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
      this.fboStuck = []; // fboのstuck.一時的にFBOをbindするのに使う。メソッド内で変える場合、そのあと戻す必要があるので。
      this.renderingPropertyStuck = []; // blend,depth,cullの状態を記録するためのstuck.
      this.enableExtensions(); // 拡張機能
      this.dict = getDict(this.gl); // 辞書を生成
      this.inTransformFeedback = false; // TFしてるかどうかのフラグ
      this.colorForClear = [0, 0, 0, 0];
      // useはデフォルトでfalse, funcはデフォルトで1,0,1,0です。単純に上書き。colorはblendColorに使うやつ。
      // equationのデフォはADD/ADDです。funcもequationも保持するのはgl定数、数です。文字列だと不便なので。
      this.blendState = {use:false, func:[1,0,1,0], color:[0,0,0,0], equation:[gl.FUNC_ADD, gl.FUNC_ADD]};
      this.depthState = {test:true, write:true}; // testは実行する、writeも実行するのがデフォルト。
      this.cullState = {use:false, mode:"back"}; // useはデフォルトでfalse. modeは"back"がデフォルト。前面のみ描画される。

      // 一般的なboard. 要するにfoxBoardって書けば普通にこれ使えるので、もういちいち用意しなくていいんよ。
      // drawArraysは"triangle_strip"です。板ポリ全般で使えます。
      this.registFigure("foxBoard", [{size:2, name:"aPosition", data:[-1,-1,1,-1,-1,1,1,1]}]);
      // デフォルトのペインターを作る
      _createTextureRenderer(this);
      _createMixTextureRenderer(this);
      _createQuadTextureRenderer(this);

    }
    enableExtensions(){
      // color_buffer_floatのEXT処理。pavelさんはこれ使ってwebgl2でもfloatへの書き込みが出来るようにしてた。
      // これによりframebufferはFRAMEBUFFER_COMPLETEを獲得する：https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float
      // 書き込み可能になるInternalFormatは「gl.R16F, gl.RG16F, gl.RGBA16F, gl.R32F, gl.RG32F, gl.RGBA32F, gl.R11FG11FB10F」？
      // 最後のはなんじゃい...
      this.gl.getExtension('EXT_color_buffer_float');
    }
    clearColor(...args){
      // clearに使う色を決めるところ
      // 従来のr,g,b,aも含め、coulour表記でもOKとする
      const newClearColor = coulour(...args);
      this.colorForClear = newClearColor; // 記録する
      this.gl.clearColor(...newClearColor); // clearColorを設定
      return this;
    }
    clear(...args){
      // 通常のクリア。対象はスクリーンバッファ、もしくはその時のフレームバッファ
      // やはり不便なので、引数がある場合はその時のみ適用される様にしましょ
      const curClearColor = this.colorForClear.slice();
      if (arguments.length > 0) {
        // 引数をclearColorに設定
        this.clearColor(...args);
      }
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      if (arguments.length > 0) {
        // 変更されたclearColorを元に戻す
        this.clearColor(curClearColor);
      }
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
      if (name === "depth_test") this.depthState.test = true;
      if (name === "cull_face") this.cullState.use = true;
      return this;
    }
    cullFace(mode){
      // back, front, front_and_backから選べる。front_and_backって全消しじゃん。要るの？
      if(this.dict[mode] === undefined){
        myAlert("cullFace failured: invalid mode name.");
        return null;
      }
      // デフォルトはBACK（上から見て反時計回り）
      this.gl.cullFace(this.dict[mode]); // default: back.
      this.cullState.mode = mode; // modeを記録する。
      return this;
    }
    blendColor(...args){
      // colorのblendに使う色指定
      const col = coulour(...args);
      this.blendState.color = col; // colorを記録する。
      this.gl.blendColor(...col);
      return this;
    }
    blendEquation(modeRGB, modeAlpha){
      // 配列も許す
      if (Array.isArray(modeRGB)) {
        return this.blendEquation(...modeRGB);
      }
      // 第二引数が無いときは第一引数と同じとする。
      if (modeAlpha === undefined) {
        modeAlpha = modeRGB;
      }
      // 数でもOKにする（gl定数）
      if (typeof modeRGB === 'number') {
        this.blendState.equation = [modeRGB, modeAlpha]; // equationを記録する。
        this.gl.blendEquationSeparate(...this.blendState.equation);
      } else if (typeof modeRGB === 'string'){
        this.blendState.equation = [this.dict[modeRGB], this.dict[modeAlpha]]; // equationを記録する。
        this.gl.blendEquationSeparate(...this.blendState.equation);
      }
      return this;
    }
    applyBlend(data){
      // blendFuncにしないのは
      // equationもまとめて設定する場合があるためですね
      if (typeof data === "string") {
        // とりあえずblendだけ用意しました. colorを実験的に追加
        // よく考えたらdefault,blend,color用意したけどこれら全部func_add前提なのよね
        // なのでここでいじりましょ。で、後で戻せばいいか。
        switch(data) {
          case "default":
            this.blendEquation("func_add");
            this.applyBlend(["one", "zero"]);
            break;
          case "blend":
            this.blendEquation("func_add");
            this.applyBlend(["one", "one_minus_src_alpha"]);
            break;
          case "color":
            this.blendEquation("func_add");
            this.applyBlend(["const_color", "one_minus_const_color"]);
            break;
          case "colorMin":
            // colorMinとcolorMaxは2DのLIGHTESTとDARKESTを真似たもの。あっちはalphaBlendとの比較をおこなっているが、
            // webglでは実現できないので単純にMINとMAXを取っている。
            this.blendEquation("func_min", "func_add");
            this.applyBlend(["one", "one", "one", "one_minus_src_alpha"]);
            break;
          case "colorMax":
            // つまり2DのLIGHTEST,DARKESTでsrc_colorとdst_colorのmin,maxを取るようにしただけの形。
            // ただしsrc_colorにはalphaが乗算されている。
            this.blendEquation("func_max", "func_add");
            this.applyBlend(["one", "one", "one", "one_minus_src_alpha"]);
            break;
          case "add":
            // 2Dの方もalphaは単純加算ですね。従いましょう。
            this.blendEquation("func_add");
            this.applyBlend(["one", "one"]);
            break;
          case "multiply":
          case "multiply_dst":
            this.blendEquation("func_add");
            // ソースの透明度が低い場合、dst_colorとのalpha補間を行なう。単純な掛け算ではない。2Dもそうなっている。
            // p5のwebglはalphaも乗算にしたいようです。こっちは2Dにならって透明度はスクリーン乗算で行きます。
            // 2DはRGBのブレンドにdstのalphaを用いているようです。ソースがalpha==0だとsrcが採用される仕様になっています。
            this.applyBlend(["one_minus_dst_alpha", "src_color", "one", "one_minus_src_alpha"]);
            break;
          case "multiply_src":
            // ソースのアルファで補間するモードも用意しましょ
            // こっちはソースのアルファが低い場合、デストカラーが採用される。多分正解は無いので、どっちも用意しましょう。
            this.blendEquation("func_add");
            this.applyBlend(["dst_color", "one_minus_src_alpha", "one", "one_minus_src_alpha"]);
            break;
          case "screen":
            // 色をスクリーン乗算、alphaもスクリーン乗算。2Dと同じ。
            // src_colorでOKです。RGBAなので。
            this.blendEquation("func_add");
            this.applyBlend(["one", "one_minus_src_color"]);
            break;
          case "sub":
            // ソースからデストを減らす処理。たとえば白を使ってINVERTを実現できる。
            this.blendEquation("func_sub", "func_add");
            this.applyBlend("one", "one", "one", "one_minus_src_alpha");
            break;
          case "reduce":
            // デストからソースを減らす（減算処理）
            // たとえば赤みを減らすとかそういう感じ（かもしれない）
            this.blendEquation("func_reverse_sub", "func_add");
            this.applyBlend("one", "one", "one", "one_minus_src_alpha");
          default:
            // 文字や数を直接入れるやり方でもいいようにしたいのです。
            // たとえば["one", "one"]の代わりに"one","one"といった表記が使えます。
            // もちろんプリセットとは被らないようにします...被るはずないけどね。
            const arg = [...arguments];
            this.applyBlend(arg);
        }
        return this;
      } else if (Array.isArray(data)) {
        const _data = data.slice();
        switch(_data.length) {
          case 1:
            // "one"や"zero"の場合くらいだろうけど、全部一緒の場合。
            _data.push(data[0], data[0], data[0]);
            break;
          case 2:
            // [srcRGB, dstRGB]の場合はsrcA, dstAにそれぞれ同じものが使われる
            _data.push(data[0], data[1]);
            break;
          case 3:
            // あんまないかな...alphaだけ同じものを使う場合。ただの穴埋め。
            _data.push(data[2]);
            break;
        }
        if (typeof _data[0] === 'number') {
          // gl定数はnumber扱いなので、gl定数でも機能するようにこうすることにする。
          this.blendState.func = [_data[0], _data[1], _data[2], _data[3]];
          this.gl.blendFuncSeparate(...this.blendState.func);
        } else if (typeof _data[0] === 'string'){
          this.blendState.func = [this.dict[_data[0]], this.dict[_data[1]], this.dict[_data[2]], this.dict[_data[3]]];
          this.gl.blendFuncSeparate(...this.blendState.func);
        }
      }
      return this;
    }
    applyBlendState(options = {}){
      // まとめて設定したい場合の処理。明示したものだけ書き換えられる。
      // たとえばuseを明示しなければuseの状態は変化しない。
      for(const name of Object.keys(options)) {
        const prop = options[name];
        switch(name){
          case "use":
            if (prop) { this.enable("blend"); } else { this.disable("blend"); } break;
          case "func":
            this.applyBlend(prop); break;
          case "color":
            this.blendColor(prop); break;
          case "equation":
            this.blendEquation(...prop); break;
        }
      }
      return this;
    }
    applyDepthState(options = {}){
      // 明示したものだけ書き換えられる
      for (const name of Object.keys(options)) {
        const prop = options[name];
        switch(name) {
          case "test":
            if (prop) { this.enable("depth_test"); } else { this.disable("depth_test"); } break;
          case "write":
            this.depthMask(prop); break;
        }
      }
      return this;
    }
    applyCullState(options = {}){
      // 明示したものだけ書き換えられる
      for (const name of Object.keys(options)) {
        const prop = options[name];
        switch(name) {
          case "test":
            if (prop) { this.enable("cull_face"); } else { this.disable("cull_face"); } break;
          case "mode":
            this.cullFace(prop); break;
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
      if (name === "depth_test") this.depthState.test = false;
      if (name === "cull_face") this.cullState.use = false;
      return this;
    }
    depthMask(flag){
      // depthへの書き込みを禁止することができる。そのためにはfalseを指定する。
      this.gl.depthMask(flag);
      this.depthState.write = flag; // flagを記録する。
      return this;
    }
    pushState(){
      // cullのmodeが文字列なのは当面はこれでいいかなと。
      const _state = {};
      _state.blend = {
        use:this.blendState.use,
        func:this.blendState.func.slice(),
        color:this.blendState.color.slice(),
        equation:this.blendState.equation.slice(),
      };
      _state.depth = {
        test:this.depthState.test,
        write:this.depthState.write
      };
      _state.cull = {
        use:this.cullState.use,
        mode:this.cullState.mode
      };
      // 一応ね...際限なく呼び出してしまうようなバグは防ぎたいところ。
      if (this.renderingPropertyStuck.length > 1000) {
        myAlert("too much pushState() call!");
        return null;
      }
      this.renderingPropertyStuck.push(_state);
      return this;
    }
    popState(){
      const _state = this.renderingPropertyStuck.pop();
      // 8つ全部実行する必要があるわね
      // 適用については関数内で実行されるのでここで当てはめなくてもいいことに気づいたよね
      this.applyBlendState(_state.blend);
      this.applyDepthState(_state.depth);
      this.applyCullState(_state.cull);
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
    /*
    registVAOFigure(name, attrs){
      // vao版。作るのはVAOFigureです。どうしようね。figuresには入れよう。で、useVAOがあるかどうかで分ける。
      // Figureの方でuseVAO=falseってやる。もしかしたら継承使った方がいいのかも。
      // locationは配列に従って通し番号で設定されるのでshaderの設計が前提となります
      const newFigure = new VAOFigure(this.gl, name, attrs, this.dict);
      this.figures[name] = newFigure;
      return this;
    }
    */
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
    /*
    // 廃止
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
    */
    registTexture(name, info = {}){
      // infoに誤ってsrcをそのままぶちこまないようにしないといけない？
      // infoが次のタイプの場合は{src:info}で置き換えることとする。
      // もっともこの定義の仕方では他のオプションを用意できないので、あくまでも簡易措置である。
      // p5を読み込まない場合を考慮して処理を分ける
      if (typeof p5 === 'function') {
         if (info instanceof p5.Graphics || info instanceof p5.Image) {
           this.registTexture(name, {src:info});
           return this;
         }
      }
      if (info instanceof Uint8Array || info instanceof Float32Array || info instanceof HTMLImageElement ||
          info instanceof HTMLCanvasElement || info instanceof HTMLVideoElement) {
        this.registTexture(name, {src:info});
        return this;
      }
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
    updateTexture(name, updateFunction = (src) => {}){
      // 第二引数に関数を付け加えて、srcをいじる関数を受け取るようにするか。
      // cubemapの場合などは、xpやynを取り出して更新すればよい。
      const src = this.textures[name].getTextureSource();
      updateFunction(src);
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
      // 属性の有効化
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
      // tfDrawCallがある場合にはoutIndexを持つattrに対して特別な処理を実行する。
      const isTF = (tfDrawCall !== undefined);
      // 設定できるthDrawCallはpoints, lines, triangles,の3種類だけのようです
      // 一応myAlertを出しておきます
      if (isTF && (tfDrawCall !== "points") && (tfDrawCall !== "lines") && (tfDrawCall !== "triangles")) {
        myAlert("There are only 3 types of draw calls for transformFeedback: points, lines and triangles.");
        return null;
      }
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
        buf = this.currentFigure.getVBOs()[bufName].buf;
      }
      // この関数はこの時点でFigureもしくはIBOがbindされていることが前提なので
      // ここは要らないかもしれないって思ったけどVAOだと必須みたいです
      if (bufName !== "ibo") {
        // iboでない場合は常にこれ要るわよ。だってそうしないとenableAttribで最後にbindされたbufferしか
        // 更新されないでしょ？？？？？？ばかか。
        // あのコードでバグが出なかったのは色しか更新してなかったからだ。
        // これを機にVAO廃止するかな...やっぱこれ要らんわ。100害あって一利なしだわ。うざい。やめよ。
        this.gl.bindBuffer(this.dict[targetName], buf);
      }
      this.gl.bufferSubData(this.dict[targetName], dstByteOffset, srcData, srcOffset); // srcDataはFloat32Arrayの何か
      // ここで戻した方がいいと思うけれどどうだろうね
      return this;
    }
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
    setUniform(name, prop){
      // 有効になってるシェーダにuniformをセット（テクスチャ以外）
      // shaderProgramは設定されたuniform変数が内部で使われていないときにエラーを返すんですが
      // どれなのか判然とせず混乱するのでここはtry～catchを使いましょう。
      // texture,framebufferTexture,colorの場合の特殊な処理をsetUniformにも用意しました（大丈夫？）
      try{
        if (typeof name === 'string') {
          const data = name.split("/");
          const identifier = data[0];
          switch(identifier){
            case "tex":
              if (data.length > 1) {
                this.setTexture(data[1], prop);
              }
              break;
            case "fbo":
              if (data.length > 2) {
                // たとえばMRTの場合"color", 0 のように指定するので。
                data[3] = Number(data[3]);
                this.setFBOtexture2D(data[1], prop, data[2], data[3]);
              } else if (data.length > 1) {
                // もうこれでいいやめんどくさい
                this.setFBOtexture2D(data[1], prop);
              }
              break;
            case "color":
              // color/で始まるようにすると、coulour表記が使える。
              if (data.length > 1) {
                this.setColor(data[1], prop);
                //this.currentPainter.setUniform(data[1], coulour(prop));
              }
              break;
            default:
              // "/"が使われていない場合。ユニフォーム名に"/"は使えない決まりなので問題ない。
              this.currentPainter.setUniform(name, prop);
          }
        } else if (typeof name === 'object') {
          // setUniformの引数がオブジェクトの場合にsetUniformsが実行されるようにする
          // とはいえsetUniformsをなくしてしまうと可読性の問題があるのでsetUniformsはとりあえず残します。
          // もう要らないけどね...
          this.setUniforms(name);
        }
      }catch(error){
        myAlert("setUniform method error!. " + name);
        myAlert(error.message);
        myAlert(error.stack);
        return null;
      }
      return this;
    }
    setUniforms(uniforms = {}){
      // まとめてuniformをセットする関数。簡易版。
      // tex,fbo,colorそれぞれについて用意するつもり。{'tex/uTex':myTexのように指定する。}
      for (const name of Object.keys(uniforms)) {
        const prop = uniforms[name]; // 値
        this.setUniform(name, prop); // setUniformに委譲
      }
      return this;
    }
    setColor(name, prop){
      // 色のユニフォームをcoulour表記で用意できるすごいやつ.
      // 色ユニフォームしか要らない場合に便利。ただしvec4限定...
      // 配列には対応できないんで工夫してください
      this.currentPainter.setUniform(name, coulour(prop));
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
    framebufferTexture2D(fboName, options = {}){
      const gl = this.gl;
      const fbo = this.fbos[fboName];
      if(!fbo){
        // fboが無い場合の警告
        myAlert("framebufferTexture2D failure: The corresponding framebuffer does not exist.");
        return null;
      }
      // attachはcolor,depth,stencil,もしくはcolor/1,/2,/3,...とする。
      // targetは2dか、xp,xn,yp,yn,zp,znの中から選ぶ感じですね。これでいいだろ。だってcube_mapじゃなきゃxpやxn無いでしょ。
      const {attach = "color", target = "2d"} = options;
      let attachment, textarget;
      // 無意味だろうけど一応MRTのことも考慮してみる。attach指定が無ければcolorです。今回は使わないわね。
      const _attach = attach.split('/');
      let attachIndex = 0;
      if (_attach.length > 1){
        attachIndex = Number(_attach[1]);
      }
      const attachType = _attach[0];
      switch(attachType){
        case "color":
          if (attachIndex === 0) {
            attachment = gl.COLOR_ATTACHMENT0;
          } else {
            attachment = gl.COLOR_ATTACHMENT0 + attachIndex;
          }
          break;
        case "depth": attachment = gl.DEPTH_ATTACHMENT; break;
        case "stencil": attachment = gl.STENCIL_ATTACHMENT; break;
      }
      if (attachment === undefined) {
        myAlert("framebufferTexture2D failure: attachment is invalid.");
        return null;
      }
      switch(target){
        case "2d": textarget = gl.TEXTURE_2D; break;
        case "xp": textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X; break;
        case "xn": textarget = gl.TEXTURE_CUBE_MAP_NEGATIVE_X; break;
        case "yp": textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_Y; break;
        case "yn": textarget = gl.TEXTURE_CUBE_MAP_NEGATIVE_Y; break;
        case "zp": textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_Z; break;
        case "zn": textarget = gl.TEXTURE_CUBE_MAP_NEGATIVE_Z; break;
      }
      if (textarget === undefined) {
        myAlert("framebufferTexture2D failure: textarget is invalid.");
        return null;
      }
      // 仕上げ。
      // これでいいと思う。つまり、bufとは通常の場合、fbo.colorである。
      const buf = (Array.isArray(fbo[attachType]) ? fbo[attachType][attachIndex] : fbo[attachType]);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, textarget, buf, 0);
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
    pushFBO(){
      // 現在のfboをstuckする
      this.fboStuck.push(this.currentFBO);
      return this;
    }
    popFBO(){
      // fboをpopしてセットする
      if (this.fboStuck.length === 0) {
        myAlert("fboStuck is empty.");
        return null;
      }
      this.bindFBO(this.fboStuck.pop());
      return this;
    }
    setFBOtexture2D(uniformName, fboName, kind = "color", index = 0){
      // CUBE_MAPも使うようになれば...と思ったが、cube_mapも2Dの一種なので、名前を変える必要ないです。

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
      // 通常時
      // 配列の場合は...おそらくcube_mapはこれでいいと思います。
      const _texture = (Array.isArray(fbo[kind]) ? fbo[kind][index] : fbo[kind]);
      this.setTexture(uniformName, _texture);
      return this;
    }
    swapFBO(fboName0, fboName1){
      // 暫定関数。doubleFBOの廃止が決まったので、移行措置。いずれこれがswapFBOになる → なりました。
      // nullであるかどうかの意味不明な判定も廃止する。コードが古いのよね。
      // swapFBOに改名しました。もう戻れない。いずれlayerSystemを作るつもり。
      // doubleFBOの仕組み自体は否定してない。通常のFBOとごっちゃにして扱うのが不満なだけ。
      if (this.fbos[fboName0] === undefined || this.fbos[fboName1] === undefined) {
        myAlert("corresponding fbo is not found.");
        return null;
      }
      const tmpFBO = this.fbos[fboName0];
      this.fbos[fboName0] = this.fbos[fboName1];
      this.fbos[fboName1] = tmpFBO;
      return this;
    }
    swapAttribute(attrName0, attrName1){
      const fig = this.currentFigure;
      fig.swapAttribute(attrName0, attrName1);
      return this;
    }
    disableUnusedAttribute(){
      // 使用しないvertexAttribute,というかレジスタを使用不可にすることで処理系依存のバグを防ぐ為の関数。
      // drawCall前に呼んで使用するPainterとFigureの情報から使用されないvertexAttributeを特定しdisableにする。
      const attrs = this.currentPainter.getAttributes();
      const vbos = this.currentFigure.getVBOs();
      for(const attrName of Object.keys(attrs)){
        // 登録されているattributeでshaderに出現し、かつcountが正の物だけenableになっているようにしたい。
        if(vbos[attrName] !== undefined){
          if(vbos[attrName].count > 0){ continue; }
        }
        // そうでないものをdisableにするわけ
    		this.gl.disableVertexAttribArray(attrs[attrName].location);
    	}
    }
    drawCall(callName, mode, options = {}){
      // 総合ドローコール関数
      // 元のあれこれもそのままおいとくけどね。後方互換性。なくすかも...しれないが...
      // type: arrays, elements, arraysInstanced, elementsInstanced.
      // mode: triangles, lines, points, triangle_strip, 以下略
      // options: first(基本0), count(基本計算済みだがTF-INSTANCEDでは使う場合も？), blend.
      // blendにcolorを追加。
      const {
        uniforms = {},
        first = 0, count = this.currentFigure.count, blend = "", color = "", equation = "",
        instanceCount = 1,
        depthTest = "", depthMask = "", cullFace = ""
      } = options;
      // uniformsに指定することで、直前にsetUniformsで必要なuniformをすべて用意できる。横着したい場合にどうぞ。
      this.setUniforms(uniforms);
      // blendが""のデフォの場合、blendが非有効であれば有効化されないし、何も起きない。
      // 有効なら外部でapplyBlendで設定したblendingがそのまま使われる。要するに特別なことを何もしない。
      // blendに有効な引数が入ってる場合には有効化される。
      // 但し、blendに"disable"を指定すると、有効であっても、一時的にnon-blendで描画される（ケースが思いつかないが）
      // 有効かどうか調べておく
      const blendEnabled = this.blendState.use;
      // 一時的に特別な指定をする場合は現在の状態を記録して保存しておく。
      const curBlendMode = this.blendState.func.slice();
      // 直前のblendColorを保存しておく
      const curBlendColor = this.blendState.color.slice();
      // 直前のblendEquationを記録しておく
      const curBlendEquation = this.blendState.equation.slice();
      // 直前のblend
      // blendがdisableの場合は非有効にする
      // applyBlendは入力がinvalidの場合何もしない(gl関数が何もしないので)。
      // たとえば blend:"enable" などとした場合、enable("blend")だけが実行されapplyBlend自体は失敗するので設定がそのまま使われる。
      // つまりblendFuncだけ設定してそれの有効/非有効だけを切り替える使い方ができるが、それが結局 blend:"hoge" とかでもできてしまうので
      // あまり意味がない...バリデーションの負荷を考えるとこの方がいいと思う。いわゆるホテルのカード差し込み的なあれ。技術の負荷とのトレードオフ。
      // 色変更する場合は事前に変更する. coulour表記が可能。
      if (color !== "") {
        this.blendColor(color);
      }
      if (equation !== "") {
        // [func_min, func_add]のように指定する
        this.blendEquation(...equation);
      }
      // blendがpresetの場合、equationをいじってるので、後で戻す必要がある。
      const usePresetBlending = [
        "default", "blend", "color"
      ].includes(blend);
      // blendがdisableなら一時的にノンブレンドで実行する。""なら直前の仕様が使われる（デフォルト）。あとはいろいろ。
      // カスタムブレンドの場合、方程式をいじるのは自前で実行するが、プリセットブレンドは方程式も設定するのでそっちも
      // いじってて、それをあとで直す必要があるのだ。
      if (blend === "disable"){
        this.disable("blend");
      } else if (blend !== "") {
        this.enable("blend"); // ""でも"disable"でもなければ有効にする
        // blendを適用する。disableならすべきことはない。
        this.applyBlend(blend);
      }
      // depthはいずれもフラグなので、単純に""でなければtrue/falseの入力をそのまま使うだけでいいし、後で戻せばいいだけ。
      const depthTestEnabled = this.depthState.test;
      const depthMaskEnabled = this.depthState.write;
      if (depthTest !== "") {
        if (depthTest) { this.enable("depth_test"); } else { this.disable("depth_test"); }
      }
      if (depthMask !== "") {
        this.depthMask(depthMask);
      }
      // カリングについて。ほぼblendと同じ。たとえば一時的に切るには"disable", 一時的に付けるには"enable"（気持ちだけ）.
      // "back"や"front"を指定した場合、一時的にオンになる処理も実行される。
      const cullFaceEnabled = this.cullState.use;
      const curCullFace = this.cullState.mode;
      if (cullFace === "disable") {
        this.disable("cull_face");
      } else if (cullFace !== "") {
        // "disable"以外が明示的に指定されていれば有効化される。
        this.enable("cull_face");
        // "back"や"front"を指定すれば、カリングの状態も変更される。invalidの場合何も起きない。
        this.cullFace(cullFace);
      }
      // ここでdisable.
      this.disableUnusedAttribute();
      // drawCall実行パート（switch分岐）
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
      // blendについて。処理の必要があるのは指定があるときだけ。
      if (blend !== "") {
        // もともと有効なら有効にする。もともと非有効なら非有効に戻す。重複しても問題ない。
        if (blendEnabled) { this.enable("blend"); } else { this.disable("blend"); }
        // blendの状態を復元する。復元する必要があるのは""でも"disable"でもない場合だけ。
        if (blend !== "disable") this.applyBlend(curBlendMode);
      }
      // blendColorの復元. blendが""であったとしても、たとえばblend:"color"のまま色だけ変えたい場合もあるでしょう。独立させるべき。
      if (color !== "") {
        this.blendColor(curBlendColor);
      }
      // blendEquationの復元. usePresetBlendingがtrueの場合もequationが変化してる可能性がある。
      if (equation !== "" || usePresetBlending) {
        this.blendEquation(...curBlendEquation);
      }
      // depthTest, depthMaskの状態を復元する。いずれも復元の必要があるのは指定された場合のみである。
      if (depthTest !== "") {
        if (depthTestEnabled) { this.enable("depth_test"); } else { this.disable("depth_test"); }
      }
      if (depthMask !== "") { this.depthMask(depthMaskEnabled); }
      // カリングを戻す処理もblendとほぼ同様。
      if (cullFace !== "") {
        if (cullFaceEnabled) { this.enable("cull_face"); } else { this.disable("cull_face"); }
        if (cullFace !== "disable") this.cullFace(curCullFace);
      }
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
    renderFoxBoard(painterName, options = {}){
      // foxBoardはRenderNodeの管轄なのでこっちでやろう。グローバル増やしたくない。
      // optionsにいろいろ、blendとか、指定を書く。
      this.use(painterName, "foxBoard");
      const {uniforms = {}} = options;
      this.setUniforms(uniforms);
      this.drawArrays("triangle_strip", options);
      this.unbind();
    }
    renderTexture(materialType, target, options = {}){
      // materialType: 'tex', 'fbo', 'color', 'grad', 'texGrad'の5種類（実質的には4種類）
      _renderingTexture(this, materialType, target, options);
      return this;
    }
    renderMixTexture(src, dst, options = {}){
      // src, dstは上記の5種類、さらにblendの仕方などを指定する。
      _renderingMixTexture(this, src, dst, options);
      return this;
    }
    renderQuadTexture(textures = [], options = {}){
      _renderingQuadTextures(this, textures, options);
      return this;
    }
    unbind(){
      // 各種bind解除
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
      //  if (this.currentFigure.useVAO) {
      //    this.gl.bindVertexArray(null);
      if (this.inTransformFeedback) {
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
    save(options = {}){
      // options詳細
      // target: どれを保存するか的な。無い場合はデフォルトフレームバッファ
      // fileName: ファイル名。無い場合は「savedImage」
      // mime: デフォルトは'png'であそこにimage/pngが入る。jpegも指定できる。
      // jpgとjpegの場合の拡張子は共にjpgだがjpegの方が圧縮率が高いようです。
      // 詳細不明
      // wとhは廃止
      // nullの場合はnode.gl.canvasを使って直接キャンバスの内容を保存する方式に変更
      // pngの場合はpngが拡張子となります
      let saveTarget;

      // たとえばoptionsのところで"fileName"ってやるとfileName:"fileName"となるように
      // するのはいいんだけどたとえばさ
      // "tex/texName/myTexture.png"
      // とかしてみるのはどう？
      // .でsplitすればmimeTypeが出る(jpegとかいろいろ)
      // さらに/でsplitすれば末尾がfileNameになり
      // 残りを/で再結合すればtargetの出来上がり
      // どう？fbo/color/2/MRT/MRT.pngみたいにする。
      // ファイル名のみでも、fileName.jpegとかでmimeも指定できるようにする。

      if (typeof options === 'string') {
        options = _getSaveOptionsFromString(options);
      }
      const {target = "", fileName = "savedImage", mime = "png"} = options;

      const targetInfo = _getSaveTargetInfo(target);
      const targetType = targetInfo.type;

      const mimeType = "image/" + mime;
      const postFix = (mime === "png" ? ".png" : ".jpg");

      // もしtargetTypeがnullの場合は、node.gl.canvasで直接セーブして終了する。
      // それ以降の処理は行わない。
      if (targetType === null) {
        _saveCanvasImage(this.gl.canvas, mimeType, fileName, postFix);
        return;
      }

      switch(targetType){
        case 'tex':
          saveTarget = this.textures[targetInfo.name]; break;
        case 'fbo': // MRT対応はまた今度
          saveTarget = this.fbos[targetInfo.name]; break;
      }

      const saveImageWidth = saveTarget.w;
      const saveImageHeight = saveTarget.h;

      // 保存用のfboを生成する。
      this.registFBO("__foxFramebufferForSave__", {w:saveImageWidth, h:saveImageHeight});
      this.pushFBO();
      this.bindFBO("__foxFramebufferForSave__");
      this.clear();
      // transformのoptionで上下を逆にしてレンダリングすれば済む話でしょ
      this.renderTexture(targetInfo.typeDetail, targetInfo.name, {
        blend:"disable", transform:{sy:-1}
      });

      // nullでないゆえ、readPixelsの対象は上記のfboである。
      const textureLength = saveImageWidth * saveImageHeight * 4;
      const textureArray = new Uint8Array(textureLength);
      this.readPixels(0, 0, saveImageWidth, saveImageHeight, "rgba", "ubyte", textureArray);

      this.popFBO();

      // 保存用のキャンバスを一時的に生成する
      const cvs = _textureToCanvas(textureArray, saveImageWidth, saveImageHeight);

      _saveCanvasImage(cvs, mimeType, fileName, postFix);

      // 即席で作ったキャンバスを破棄する
      cvs.remove();
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
      this.view.top.normalize(); // 一応正規化しておく. そうですね。ベクトル用意しないとですね...
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
  // foxIA仕様変更でInteractionが初期化時にキャンバス受け取って初期化出来るようになりました。
  // factoryはoptionsで指定しますがIAベースで使う場合は問題ありません。
  class CameraController extends foxIA.Interaction{
    constructor(canvas, options = {}){
      super(canvas, options);
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
                                   vec3 modelPosition, vec3 normal, inout vec3 diffuse, inout vec3 specular){
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
                             vec3 modelPosition, vec3 normal, inout vec3 diffuse, inout vec3 specular){
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
                            vec3 modelPosition, vec3 normal, inout vec3 diffuse, inout vec3 specular){
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
      `,
    createMaterialColor:
      `
        vec4 linearGradient(in vec4 fromColor, in vec4 toColor, in vec2 fromPos, in vec2 toPos, in bool smoothGrad, in vec2 p){
          vec2 n = normalize(toPos - fromPos);
          float l = length(toPos - fromPos);
          float ratio = clamp(dot(p - fromPos, n), 0.0, l)/l;
          if (smoothGrad) ratio = ratio * ratio * (3.0 - 2.0 * ratio);
          return (1.0 - ratio) * fromColor + ratio * toColor;
        }
        vec4 radialGradient(in vec4 fromColor, in vec4 toColor, in vec2 fromPos, in vec2 toPos, in bool smoothGrad, in vec2 p){
          float l = length(toPos - fromPos);
          float ratio = clamp(length(p - fromPos), 0.0, l)/l;
          if (smoothGrad) ratio = ratio * ratio * (3.0 - 2.0 * ratio);
          return (1.0 - ratio) * fromColor + ratio * toColor;
        }
        vec4 createMaterialColor(
          in int materialFlag, in sampler2D tex, in vec4 monoColor,
          in vec4 fromColor, in vec4 toColor, in int gradType, in vec4 gradStop,
          in bool smoothGrad, in vec2 p
        ){
          if (materialFlag == 0) {
            vec4 tex = texture(tex, p);
            // textureの場合はそのまま出力
            return tex;
          }
          if (materialFlag == 1) {
            // 色の場合はそのまま出力
            return monoColor;
          }
          if (materialFlag == 2) {
            // グラデーションの場合もそのまま出力
            if (gradType == 0) {
              return linearGradient(fromColor, toColor, gradStop.xy, gradStop.zw, smoothGrad, p);
            }
            if (gradType == 1) {
              return radialGradient(fromColor, toColor, gradStop.xy, gradStop.zw, smoothGrad, p);
            }
          }
          if (materialFlag == 3) {
            // r値のみを使うことになりました。g,b,aは不要。今後どうなるかは不明。
            // 現行のユースケースがr値のみを使うものがほとんどであるのと、
            // 上記2種類との整合性を考えた時にこちらの方が自然と判断したまでです。
            float ratio = texture(tex, p).r;
            if (smoothGrad) {
              ratio = ratio * ratio * (3.0 - 2.0 * ratio);
            }
            // 単純補間
            return (1.0 - ratio) * fromColor + ratio * toColor;
          }
          return vec4(1.0);
        }
      `,
    blend:{
      blend: // 通常ブレンド(source-over)
      `
        vec4 blend(in vec4 src, in vec4 dst){
          return vec4(
            src.a * src.rgb + (1.0 - src.a) * dst.a * dst.rgb,
            src.a + dst.a - src.a * dst.a
          );
        }
      `,
      clip_on: // クリッピング(source-atop), dstの画像も表示される
      `
        vec4 clip_on(in vec4 src, in vec4 dst){
          return vec4(
            src.a * src.rgb * dst.a + dst.a * dst.rgb * (1.0 - src.a),
            dst.a
          );
        }
      `,
      clip_off: // クリッピング(source-in), ただしdstの画像は表示されない
      `
        vec4 clip_off(in vec4 src, in vec4 dst){
          return vec4(
            src.a * src.rgb * dst.a,
            src.a * dst.a
          );
        }
      `,
      xor: // 排他描画(xor)。重なるところが消える。
      `
        vec4 xor(in vec4 src, in vec4 dst){
          return vec4(
            src.a * src.rgb * (1.0 - dst.a) + dst.a * dst.rgb * (1.0 - src.a),
            src.a + dst.a - 2.0*src.a*dst.a
          );
        }
      `,
      erase: // 消しゴム(destination-out), 半透明の場合はソフ消し
      `
        vec4 erase(in vec4 src, in vec4 dst){
          return vec4(
            dst.a * dst.rgb * (1.0 - src.a),
            dst.a * (1.0 - src.a)
          );
        }
      `,
      add: // 加算合成(lighter)
      `
        vec4 add(in vec4 src, in vec4 dst){
          return vec4(
            src.a* src.rgb + dst.a * dst.rgb,
            min(1.0, src.a + dst.a)
          );
        }
      `,
      createBlendColor:
      `
        vec4 createBlendColor(in vec3 blend_color, in vec4 src, in vec4 dst, in int type){
          vec3 src_color = dst.a * blend_color + (1.0 - dst.a) * src.rgb;
          if (type == 0) {
            // 通常のblend(source-over)
            return vec4(
              src.a * src_color + (1.0 - src.a) * dst.a * dst.rgb,
              src.a + dst.a - src.a * dst.a
            );
          }
          if (type == 1) {
            // clip_onバージョン(source-atop)
            return vec4(
              src.a * src_color * dst.a + (1.0 - src.a) * dst.a * dst.rgb,
              dst.a
            );
          }
          if (type == 2) {
            // clip_offバージョン(source-in)
            return vec4(
              src.a * src_color * dst.a,
              src.a * dst.a
            );
          }
          return vec4(1.0);
        }
      `,
      multiply: // 乗算(multiply) ここからは例の...あれに従う。
      `
        vec4 multiply(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = src.rgb * dst.rgb;
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      screen:
      `
        vec4 screen(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = src.rgb + dst.rgb - src.rgb * dst.rgb;
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      hard_light:
      `
        vec4 hard_light(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color;
          blend_color.r = (src.r < 0.5 ? 2.0 * src.r * dst.r : 2.0 * (src.r + dst.r - src.r * dst.r) - 1.0);
          blend_color.g = (src.g < 0.5 ? 2.0 * src.g * dst.g : 2.0 * (src.g + dst.g - src.g * dst.g) - 1.0);
          blend_color.b = (src.b < 0.5 ? 2.0 * src.b * dst.b : 2.0 * (src.b + dst.b - src.b * dst.b) - 1.0);
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      overlay:
      `
        vec4 overlay(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color;
          blend_color.r = (dst.r < 0.5 ? 2.0 * src.r * dst.r : 2.0 * (src.r + dst.r - src.r * dst.r) - 1.0);
          blend_color.g = (dst.g < 0.5 ? 2.0 * src.g * dst.g : 2.0 * (src.g + dst.g - src.g * dst.g) - 1.0);
          blend_color.b = (dst.b < 0.5 ? 2.0 * src.b * dst.b : 2.0 * (src.b + dst.b - src.b * dst.b) - 1.0);
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      darken:
      `
        vec4 darken(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = min(src.rgb, dst.rgb);
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      lighten:
      `
        vec4 lighten(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = max(src.rgb, dst.rgb);
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      dodge:
      `
        vec4 dodge(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color;
          blend_color.r = (src.r < 1.0 ? min(1.0, dst.r / (1.0 - src.r)) : 1.0);
          blend_color.g = (src.g < 1.0 ? min(1.0, dst.g / (1.0 - src.g)) : 1.0);
          blend_color.b = (src.b < 1.0 ? min(1.0, dst.b / (1.0 - src.b)) : 1.0);
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      burn:
      `
        vec4 burn(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color;
          blend_color.r = (src.r > 0.0 ? 1.0 - min(1.0, (1.0 - dst.r) / src.r) : 0.0);
          blend_color.g = (src.g > 0.0 ? 1.0 - min(1.0, (1.0 - dst.g) / src.g) : 0.0);
          blend_color.b = (src.b > 0.0 ? 1.0 - min(1.0, (1.0 - dst.b) / src.b) : 0.0);
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      difference:
      `
        vec4 difference(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = abs(src.rgb - dst.rgb);
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      soft_light:
      `
        vec4 soft_light(in vec4 src, in vec4 dst, in int type){
          vec3 sub_blend_color;
          sub_blend_color.r = (dst.r < 0.25 ? ((16.0 * dst.r - 12.0) * dst.r + 4.0) * dst.r : sqrt(dst.r));
          sub_blend_color.g = (dst.g < 0.25 ? ((16.0 * dst.g - 12.0) * dst.g + 4.0) * dst.g : sqrt(dst.g));
          sub_blend_color.b = (dst.b < 0.25 ? ((16.0 * dst.b - 12.0) * dst.b + 4.0) * dst.b : sqrt(dst.b));
          vec3 blend_color;
          blend_color.r = (src.r < 0.5 ? dst.r - (1.0 - 2.0 * src.r) * dst.r * (1.0 - dst.r) : dst.r + (2.0 * src.r - 1.0) * (sub_blend_color.r - dst.r));
          blend_color.g = (src.g < 0.5 ? dst.g - (1.0 - 2.0 * src.g) * dst.g * (1.0 - dst.g) : dst.g + (2.0 * src.g - 1.0) * (sub_blend_color.g - dst.g));
          blend_color.b = (src.b < 0.5 ? dst.b - (1.0 - 2.0 * src.b) * dst.b * (1.0 - dst.b) : dst.b + (2.0 * src.b - 1.0) * (sub_blend_color.b - dst.b));
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      exclusion:
      `
        vec4 exclusion(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = src.rgb + dst.rgb - 2.0 * src.rgb * dst.rgb;
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      blendUtils:
      `
        float b_max(in vec3 c) { return max(max(c.r, c.g), c.b); }
        float b_min(in vec3 c) { return min(min(c.r, c.g), c.b); }
        float b_lum(in vec3 c) { return c.r * 0.3 + c.g * 0.59 + c.b * 0.11; }
        float b_sat(in vec3 c) { return b_max(c) - b_min(c); }
        vec3 b_clipColor(in vec3 c) {
          float l = b_lum(c);
          vec2 uv = vec2(b_min(c), b_max(c));
          if (uv.x < 0.0) {
            c = vec3(l) + vec3(l) * vec3(c - l) / (l - uv.x);
          }
          if (uv.y > 1.0) {
            c = vec3(l) + vec3(1.0 - l) * vec3(c - l) / (uv.y - l);
          }
          return c;
        }
        vec3 b_setLum(in vec3 c, in float l){
          float d = l - b_lum(c);
          return b_clipColor(c + vec3(d));
        }
        vec3 b_setSat(in vec3 c, in float s) {
          float cMax = b_max(c);
          float cMin = b_min(c);
          float cMid = c.r + c.g + c.b - cMax - cMin;
          if (cMax > cMin) {
            float mid = ((cMid - cMin) / (cMax - cMin)) * s;
            if (c.r >= max(c.g, c.b)) {
              if (c.g >= c.b) { return vec3(s, mid, 0.0); }
              else { return vec3(s, 0.0, mid); }
            } else if (c.g >= max(c.b, c.r)) {
              if (c.b >= c.r) { return vec3(0.0, s, mid); }
              else { return vec3(mid, s, 0.0); }
            } else {
              if (c.r >= c.g) { return vec3(mid, 0.0, s); }
              else { return vec3(0.0, mid, s); }
            }
          }
          return vec3(0.0);
        }
      `,
      hue:
      `
        vec4 hue(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = b_setLum(b_setSat(src.rgb, b_sat(dst.rgb)), b_lum(dst.rgb));
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      saturation:
      `
        vec4 saturation(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = b_setLum(b_setSat(dst.rgb, b_sat(src.rgb)), b_lum(dst.rgb));
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      color_tone:
      `
        vec4 color_tone(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = b_setLum(src.rgb, b_lum(dst.rgb));
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
      luminosity:
      `
        vec4 luminosity(in vec4 src, in vec4 dst, in int type){
          vec3 blend_color = b_setLum(dst.rgb, b_lum(src.rgb));
          return createBlendColor(blend_color, src, dst, type);
        }
      `,
    },
    filter:{
      // filter一覧
    }
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
  }

  // filter作成用shaderPrototype
  class FilterShader extends ShaderPrototype{
    constructor(node){
      super(node);
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
        {type:"vec3", name:"vGlobalNormal"}, // グローバル法線。環境マッピングで使う。
        {type:"vec3", name:"vViewNormal"}, // ビュー法線。ライティングで使う。
        {type:"vec3", name:"vNormal"} // ローカル法線。aNormalそのまま。法線彩色で使う。球のマッピングなど。
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
        vNormal = aNormal; // aNormalですね。頂点と紐ついてる値じゃないとtransformで変わってしまう。

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
      // normalは渡す際に正規化した方がいいでしょうね
      this.fs.mainProcess =
      `
        if (uUseLight) {
          vec3 result = totalLight(position, normalize(normal), color.rgb);
          color.rgb = result;
        }
      `;
      // 先に用意する
      const {useColor = false} = options;
      const {useTexCoord = false} = options;

      // おそらくpostProcessにfragColorの計算を持ってきているのは、あれですね。
      // mainProcessで取得したcolorに何か加工をすることが出来るようにするためですね。
      // useTexCoordがtrueの場合にはcolor.rgb *= color.aを実行しないようにする
      // そのようなシェーダを併用する場合にはmainProcessにaddCodeを実行して
      // ポストプロセスの前にcolor.rgbにcolor.aを乗算する必要がある
      // それは別のテクスチャかもしれないし頂点色かもしれない、わからないので、コーダーがカスタマイズして決める。
      this.fs.postProcess = (useTexCoord ? `` : `color.rgb *= color.a; `);
      this.fs.postProcess +=
      `
        fragColor = color;
      `;

      // たとえばvsPreProcessでvec4 color = aColor;とかして
      // colorをいじって
      // vsPostProcessでvColor = color;みたいにできる。
      // texCoordでも同じことができる
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
      this.attrs = [
        {type:"vec3", name:"aPosition"},
        {type:"vec3", name:"aNormal"}
      ];
      this.varyings = [
        {type:"vec3", name:"vLocalPosition"},
        {type:"vec3", name:"vGlobalPosition"},
        {type:"vec3", name:"vViewPosition"},
        {type:"vec3", name:"vGlobalNormal"}, // グローバル法線。環境マッピングで使う。
        {type:"vec3", name:"vViewNormal"}, // ビュー法線。ライティングで使う。
        {type:"vec3", name:"vNormal"}, // ローカル法線。aNormalそのまま。法線彩色で使う。球のマッピングなど。
        {type:"vec4", name:"vNormalDeviceCoord"} // いわゆるNDC.
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
        vNormal = aNormal; // aNormalですね。頂点と紐ついてる値じゃないとtransformで変わってしまう。

        vec4 ndc = uProjMatrix * viewModelPosition;
        gl_Position = ndc;
        vNormalDeviceCoord = ndc;
      `;
      this.vs.postProcess = ``;

      // 次にfs
      this.fs.precisions =
      `
        precision highp float;
      `;
      // 名前はとりあえず固定で。変える必要が生じたら、変えます。
      // 渡すのはviewNormalです。計算に使うので。
      this.fs.outputs =
      `
        layout (location = 0) out vec4 materialColor;
        layout (location = 1) out vec4 viewPosition;
        layout (location = 2) out vec4 viewNormal;
      `;
      // uMonoColorとuMaterialFlag以外は不要かと。
      this.fs.uniforms =
      `
        uniform vec4 uMonoColor; // monoColorの場合
        uniform int uMaterialFlag; // 0:mono. 1以降はお好みで
      `;
      // 1以降はお好みで。
      // 計算に使うのはviewNormalです。他のnormalは彩色などで使われます。
      // いつものようにフラグを増やすだけ
      this.fs.preProcess =
      `
        vec3 position = vViewPosition;
        vec3 normal = vViewNormal;
        vec4 color = vec4(1.0);
        if(uMaterialFlag == 0) {
          color = uMonoColor;  // uMonoColor単色
        }
      `;
      // useColorとuseTexCoordも用意しましょ
      const {useColor = false} = options;
      const {useTexCoord = false} = options;
      // rgbにaを掛ける処理はやめときましょ
      // 個別にやればいい
      // 送る際のalpha乗算をやめる
      // つまりblend:"disable"で落とす...っていうかその、
      // データをおくるだけだからblendする必要がないわけで
      // 深度とともにデータを格納していくだけでいいと思うんよ

      // depthがこれでいいかどうかは謎だけど...
      this.fs.postProcess +=
      `
        materialColor = color;
        viewPosition = vec4(position, 1.0);
        float depth = 0.5 * (vNormalDeviceCoord.z / vNormalDeviceCoord.w) + 0.5;
        viewNormal = vec4(normal, depth);
      `;
      // useColor, useTexCoord
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
  // こっちはディファードをライティングするためのシェーダ
  class DeferredLightingShader extends ShaderPrototype{
    constructor(node){
      super(node);
    }
    initialize(options = {}){
      super.initialize();
      // 板ポリ。
      this.attrs = [
        {name:"aPosition", type:"vec2"}
      ];
      this.varyings = [
        {name:"vUv", type:"vec2"}
      ];
      this.vs.preProcess =
      `
        vUv = 0.5 * aPosition + 0.5;
      `;
      this.vs.mainProcess =
      `
        gl_Position = vec4(aPosition, 0.0, 1.0);
      `;
      // ここまで。次にfs.
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
      // uniformsはuMonoColorとuMaterialFlagだけ排除して
      // 入力としては先ほどのmaterialColor, viewPosition, viewNormalを
      // textureとして用意する
      this.fs.uniforms =
      `
        uniform mat4 uViewMatrix;

        // 各種テクスチャ
        uniform sampler2D uMaterialColor;  // ubyteの4
        uniform sampler2D uViewPosition;   // floatの4
        uniform sampler2D uViewNormal;     // floatの4

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
      `;
      // 出力は普通にfragColorですね
      this.fs.outputs =
      `
        out vec4 fragColor;
      `
      // ライティングルーチン
      this.fs.routines = snipet.lightingRoutines;
      // よくわからんけどalpha乗算はtotalLight出した後でいいと思う
      this.fs.preProcess =
      `
        vec4 color = texture(uMaterialColor, vUv);
        vec4 viewPositionTex = texture(uViewPosition, vUv);
        vec4 viewNormalTex = texture(uViewNormal, vUv);
        vec3 viewPosition = viewPositionTex.rgb;
        vec3 viewNormal = viewNormalTex.rgb;
        float depth = viewNormalTex.a;
      `;
      // このあとでdepthをいじってなんか作りたいとかあれば
      // ご自由にどうぞ
      // vPositionTex.aを取り出すことでもなんかできるかも
      this.fs.mainProcess =
      `
        if (uUseLight) {
          vec3 result = totalLight(viewPosition, normalize(viewNormal), color.rgb);
          color.rgb = result;
        }
      `;
      // 必要ならこのあとrgbにaを掛けるなりdepthでalphaを決めるなりすればよい
        this.fs.postProcess =
        `
          fragColor = color;
        `;
      return this;
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
  // depthは後方互換性の為に残しますが、多分もう使わないかも....
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
      // positionをpreProcess内部でいじれるようにする. これにより描画位置をいじれる。
      // たとえばposition*=2.0などとすれば原点中心に0.5倍に縮小して描画される。
      this.vs.preProcess += `vec2 position = aPosition;`;

      // 後ろに置くならdepthは1.0の方がいいし前において透明度補正掛けるなら0.0の方がいいですね
      this.vs.mainProcess =
        `gl_Position = vec4(position, ` + depth + `, 1.0);`;
      this.fs.precisions =
        `precision highp float;`;
      this.fs.preProcess =
        `vec4 color = vec4(1.0); vec2 uv = vUv;`;
      this.fs.mainProcess =
        `fragColor = color;`;
      return this;
    }
  }

  // lineShader. 線描画用。3Dです。カメラが必要です。
  class LineShader extends ShaderPrototype{
    constructor(node){
      super(node);
    }
    initialize(options = {}){
      super.initialize();
      this.attrs = [
        {type:"vec3", name:"aPosition"}
      ];
      this.varyings = [
        {type:"vec3", name:"vLocalPosition"},
        {type:"vec3", name:"vGlobalPosition"},
        {type:"vec3", name:"vViewPosition"}
      ];

      this.vs.uniforms =
      `
        uniform mat4 uModelMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjMatrix;
      `;

      this.vs.preProcess =
      `
        vec3 position = aPosition;
      `;
      this.vs.mainProcess =
      `
        // 位置と法線の計算
        vLocalPosition = position;
        vGlobalPosition = (uModelMatrix * vec4(position, 1.0)).xyz;
        vec4 viewModelPosition = uModelViewMatrix * vec4(position, 1.0);
        vViewPosition = viewModelPosition.xyz;

        gl_Position = uProjMatrix * viewModelPosition;
      `;

      this.fs.precisions =
      `
        precision highp float;
      `;

      this.fs.uniforms =
      `
        uniform vec4 uMonoColor; // monoColorの場合
        uniform int uMaterialFlag; // 0:mono. 1以降はお好みで
      `;

      this.fs.outputs =
      `
        out vec4 fragColor;
      `

      this.fs.preProcess =
      `
        vec3 position = vViewPosition;
        vec4 color = vec4(1.0);
        if(uMaterialFlag == 0) {
          color = uMonoColor;  // uMonoColor単色
        }
      `;

      this.fs.mainProcess =
      `
        color.rgb *= color.a;
        fragColor = color;
      `;

      const {useColor = false} = options;

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
    createHelper(helperName, cameraName){
      // カメラの名前で取得、カメラタイプで場合分け。
      // 動的な場合はイミディエイトという扱いになるわね。
      const cam = this.getCamera(cameraName);
      switch(cam.cameraType){
        case "perspective":
          this.createPersHelper(helperName, cam);
          break;
        case "orthographic":
          this.createOrthoHelper(helperName, cam);
          break;
      }
      return this;
    }
    createPersHelper(helperName, cam){
      // persのHelper. retainedという扱いも可能。その場合はsetupで1回だけ呼び出してね。
      const {eye, center, up, side} = cam.getView();
      const {fov, aspect, near} = cam.getProj();
      const distToCenter = eye.dist(center);
      const lineVertices = [];
      const halfH = distToCenter*Math.tan(fov*0.5);
      const halfW = halfH * aspect;
      const up0 = Vec3.mult(up, halfH);
      const side0 = Vec3.mult(side, halfW);
      const up1 = Vec3.mult(up, -halfH);
      const side1 = Vec3.mult(side, -halfW);
      lineVertices.push(
        ...eye.toArray(),
        ...Vec3.add(center, up0).add(side0).toArray(),
        ...Vec3.add(center, up0).add(side1).toArray(),
        ...Vec3.add(center, up1).add(side0).toArray(),
        ...Vec3.add(center, up1).add(side1).toArray()
      );

      const nearRatio = near / distToCenter;
      const nearCenter = Vec3.lerp(eye, center, nearRatio);
      up0.mult(nearRatio);
      side0.mult(nearRatio);
      up1.mult(nearRatio);
      side1.mult(nearRatio);

      lineVertices.push(
        ...Vec3.add(nearCenter, up0).add(side0).toArray(),
        ...Vec3.add(nearCenter, up0).add(side1).toArray(),
        ...Vec3.add(nearCenter, up1).add(side0).toArray(),
        ...Vec3.add(nearCenter, up1).add(side1).toArray()
      );
      this.node.registFigure(helperName, [
        {name:"aPosition", size:3, data:lineVertices}
      ]);
      this.node.registIBO(helperName + "IBO", {data:[0,1,0,2,0,3,0,4,5,6,6,8,8,7,7,5]});
      return this;
    }
    createOrthoHelper(helperName, cam){
      // orthoの（以下略）
      const {eye, center, up, side} = cam.getView();
      const {cw, ch, near} = cam.getProj();
      const distToCenter = eye.dist(center);
      const lineVertices = [];
      const halfH = ch/2;
      const halfW = cw/2;
      const up0 = Vec3.mult(up, halfH);
      const side0 = Vec3.mult(side, halfW);
      const up1 = Vec3.mult(up, -halfH);
      const side1 = Vec3.mult(side, -halfW);
      lineVertices.push(
        ...Vec3.add(eye, up0).add(side0).toArray(),
        ...Vec3.add(eye, up0).add(side1).toArray(),
        ...Vec3.add(eye, up1).add(side0).toArray(),
        ...Vec3.add(eye, up1).add(side1).toArray(),
        ...Vec3.add(center, up0).add(side0).toArray(),
        ...Vec3.add(center, up0).add(side1).toArray(),
        ...Vec3.add(center, up1).add(side0).toArray(),
        ...Vec3.add(center, up1).add(side1).toArray()
      );

      const nearRatio = near / distToCenter;
      const nearCenter = Vec3.lerp(eye, center, nearRatio);
      lineVertices.push(
        ...Vec3.add(nearCenter, up0).add(side0).toArray(),
        ...Vec3.add(nearCenter, up0).add(side1).toArray(),
        ...Vec3.add(nearCenter, up1).add(side0).toArray(),
        ...Vec3.add(nearCenter, up1).add(side1).toArray()
      );

      this.node.registFigure(helperName, [
        {name:"aPosition", size:3, data:lineVertices}
      ]);
      this.node.registIBO(helperName + "IBO", {data:[0,4,1,5,2,6,3,7,8,9,9,11,11,10,10,8]});
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
      this.registShader("lines", new LineShader(node));
      this.prepareLightingParameters();
      //this.renderingType = "forward";
    }
    initialize(options = {}){
      const {
        type = "forward", // forward/deferred
        forwardLight = {},
        deferredPrepare = {},
        deferredLight = {},
        lines = {}
      } = options;
      switch(type) {
        case "forward":
          this.shaders.forwardLight.initialize(forwardLight);
          //this.renderingType = "forward";
          this.bindShader("forwardLight");
          break;
        case "deferred":
          this.shaders.deferredPrepare.initialize(deferredPrepare);
          this.shaders.deferredLight.initialize(deferredLight);
          //this.renderingType = "deferred";
          this.bindShader("deferredPrepare");
          break;
        case "lines":
          this.shaders.lines.initialize(lines);
          //this.renderingType = "lines";
          this.bindShader("lines");
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
    setColor(prop){
      // uMonoColor限定の色セット関数。
      // uMonoColorにしか使えません。あしからず。
      this.node.setUniform("uMonoColor", coulour(prop));
      return this;
    }
    setLightingUniforms(options = {}){
      // renderTypeで処理を分ける。deferredの場合はここをrenderType:"deferred"にする。
      // これは破壊的な変更だが、変えるスケッチは多くないので問題ない。どうせdeferredはあんま使わないだろうし...
      const {renderType = "forward"} = options;

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
      // deferredの場合、こっちでuViewMatrixを設定する。
      if (renderType === "deferred") {
        const cam = this.curCam.cam;
        const viewMat = cam.getViewMat();
        this.node.setUniform("uViewMatrix", viewMat.m);
      }
      return this;
    }
    setMatrixUniforms(options = {}){
      // transformの操作はsetTransformで実行する。
      // それとは別にMatrixUniformsを設定する。
      // そのうちドローコールもメソッドで出来るようにしてその中でこれを実行する形になるかも？
      // optionsについて... useNormalは要らないと思う。renderingTypeがforwardかdeferredでない場合に実行されなければいい。
      // name: uの次に配置する6種類のuniform名のコードネーム、デフォルトは""です。つまり備え付けのshader用の。
      // renderingTypeは廃止でいいですね...使われない。optionsにおいてrenderTypeで指定すればいい。
      // linesやpointsで他の描画する場合もあるし。基本forwardでしか使われないからね。

      // tfは共通で使う。
      // renderTypeはforwardだったりdeferredだったりlinesだったりpointsだったりする。
      // uniformの名前と、登録したカメラの名前がオプション。cameraがundefined（デフォルト）の場合は現在のカメラが使われる。
      // useModel, useModelView, useProjはすべてデフォルトtrueで、falseにすれば登録されない。
      const {
        renderType = "forward", name = "", camera,
        useModel = true, useModelView = true, useProj = true,
        useView = true, useNormal = true, useModelNormal = true
      } = options;
      const tf = this.transform;
      const cam = this.getCamera(camera);

      // 共通の行列処理
      const modelMat = tf.getModelMat();
      const viewMat = cam.getViewMat();
      const projMat = cam.getProjMat();
      const modelViewMat = new Mat4(getMult4x4(modelMat.m, viewMat.m));
      if (useModel) this.node.setUniform("u" + name + "ModelMatrix", modelMat.m)
      if (useModelView) this.node.setUniform("u" + name + "ModelViewMatrix", modelViewMat.m)
      if (useProj) this.node.setUniform("u" + name + "ProjMatrix", projMat.m);
      // forwardの場合はトランスフォームとライティングが一体化してるのでここで登録する必要がある。
      if ((renderType === "forward") && useView) {
        this.node.setUniform("u" + name + "ViewMatrix", viewMat.m);
      }
      // forwardとdeferredの場合にのみ法線情報を登録する
      if ((renderType === "forward" || renderType === "deferred") && (useNormal || useModelNormal)) {
        const normalMat = getInverseTranspose3x3(modelViewMat.getMat3());
        const modelNormalMat = getInverseTranspose3x3(modelMat.getMat3());
        if (useNormal) this.node.setUniform("u" + name + "NormalMatrix", normalMat)
        if (useModelNormal) this.node.setUniform("u" + name + "ModelNormalMatrix", modelNormalMat);
      }
      return this;
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Performance checker
  // 前でも後でもOKなフレームレート表示用関数
  // クラスで定義します
  // いい加減面倒になってきたので

  // 冷静に考えてレンダリングでやるのは馬鹿げてるのでこの方式でいきます
  class PerformanceChecker{
    constructor(canvas, options = {}){
      const {targetFrameRate = 60, barColor = 'gray', textColor = 'white'} = options;
      this.targetFrameRate = targetFrameRate;
      this.barColor = barColor;
      this.textColor = textColor;
      this.visible = true;
      // キャンバス要素の作成
      this.cvs = document.createElement('canvas');
      this.cvs.width = 76;
      this.cvs.height = 30;
      this.cvs.style.position = 'absolute';
      this.cvs.style.display = 'block';
      this.cvs.id = 'performanceChecker';
      this.cvs.style['z-index'] = 1;
      // キャンバスの親要素の先頭に追加する
      canvas.parentElement.prepend(this.cvs);
      // コンテキストの取得
      this.ctx = this.cvs.getContext('2d');
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = 'italic 20px system-ui';
      // タイマーの用意
      this.timer = new Timer();
      this.timer.initialize("pfc");
    }
    isVisible(){
      return this.visible;
    }
    setColor(params = {}){
      const {
        bar, txt, css = false
      } = params;
      if (bar !== undefined) {
        if (css) { this.barColor = bar; } else {
          this.barColor = _convertToCssColor(coulour(bar));
        }
      }
      if (txt !== undefined) {
        if (css) { this.textColor = txt; } else {
          this.textColor = _convertToCssColor(coulour(txt));
        }
      }
    }
    update(){
      if (!this.visible) return;
      const dt = this.timer.getDelta("pfc");
      // 一応、0割り対策。
      const _frameRate = (dt > 0 ? 1/dt : 0);
      const ratio = _frameRate / this.targetFrameRate;
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0,0,76,30);
      this.ctx.fillStyle = this.barColor;
      this.ctx.fillRect(0,0,76*Math.min(ratio, 1),30);
      this.ctx.fillStyle = this.textColor;
      this.ctx.fillText(Math.min(_frameRate, this.targetFrameRate).toFixed(3), 38, 15);
    }
    show(){
      if (this.visible) return;
      this.cvs.style.display = 'block';
      this.visible = true;
      this.timer.reStart("pfc");
    }
    hide(){
      if (!this.visible) return;
      this.cvs.style.display = 'none';
      this.visible = false;
      this.timer.pause("pfc");
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
  ex.coulour = coulour; // 汎用色指定関数
  // そのうちやめたいnoLoop()
  ex.ErrorSystem = ErrorSystem; // エラーシステム
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

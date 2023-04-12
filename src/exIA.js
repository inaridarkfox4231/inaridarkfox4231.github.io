// exIA.
// 内容的にはpointersにマウスないしはタッチの接触状況を調べるもの
// これを使うとたとえばスマホで
// タッチしていないときに変なことが起こるのを防げるのよ。
// マウス挙動をタッチに流用するのは無理ということです。以上。

// pointerPrototypeを継承したものを用いたい場合は、
// IAをgenerateFunctionで初期化する必要があるわね。デフォルトは() => new PointerPrototype()でいいけれど。
// たとえば継承でBrushPointerを作るなら() => new BrushPointer()が必要になるわけです。
const exIA = (function(){
  const ex = {};

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
      this.button = e.button;
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
    }
    initialize(canvas){
      // イベントリスナー
      canvas.addEventListener('mousedown', this.mouseDownDefaultAction.bind(this));
      canvas.addEventListener('mousemove', this.mouseMoveDefaultAction.bind(this));
      window.addEventListener('mouseup', this.mouseUpDefaultAction.bind(this));
      canvas.addEventListener('touchstart', this.touchStartDefaultAction.bind(this));
      canvas.addEventListener('touchmove', this.touchMoveDefaultAction.bind(this), false);
      window.addEventListener('touchend', this.touchEndDefaultAction.bind(this));
    }
    mouseDownDefaultAction(e){
      const p = this.factory();
      p.mouseInitialize(e);
      p.mouseDownAction(e);
      this.pointers.push(p);
    }
    mouseMoveDefaultAction(e){
      if(this.pointers.length == 0){ return; }
      const p = this.pointers[0];
      p.mouseUpdate(e);
      p.mouseMoveAction(e);
    }
    mouseUpDefaultAction(){
      // ここで排除するpointerに何かさせる...
      const p = this.pointers[0];
      p.mouseUpAction();
      this.pointers.pop();
    }
    touchStartDefaultAction(e){
      e.preventDefault();
      const currentTouches = e.targetTouches; // touchオブジェクトの配列
      const newPointers = [];

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
    touchMoveDefaultAction(e){
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
    touchEndDefaultAction(e){
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
    getPointers(){
      return this.pointers;
    }
  }

  ex.Interaction = Interaction;
  ex.PointerPrototype = PointerPrototype;

  return ex;
})();

// exIA.
// 内容的にはpointersにマウスないしはタッチの接触状況を調べるもの
// これを使うとたとえばスマホで
// タッチしていないときに変なことが起こるのを防げるのよ。
// マウス挙動をタッチに流用するのは無理ということです。以上。
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
  }
  class Interaction{
    constructor(){
      this.pointers = [];
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
      this.pointers.push(new PointerPrototype());
      this.pointers[0].x = e.offsetX;
      this.pointers[0].y = e.offsetY;
      this.pointers[0].prevX = this.pointers[0].x;
      this.pointers[0].prevY = this.pointers[0].y;
      this.pointers[0].button = e.button;
    }
    mouseMoveDefaultAction(e){
      if(this.pointers.length == 0){ return; }
      this.pointers[0].prevX = this.pointers[0].x;
      this.pointers[0].prevY = this.pointers[0].y;
      this.pointers[0].dx = (e.offsetX - this.pointers[0].x);
      this.pointers[0].dy = (e.offsetY - this.pointers[0].y);
      this.pointers[0].x = e.offsetX;
      this.pointers[0].y = e.offsetY;
    }
    mouseUpDefaultAction(){
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
            equalFlag = true; break;
          }
        }
        if(!equalFlag){
          const newPointer = new PointerPrototype();
          newPointer.id = currentTouches[i].identifier;
          newPointer.x = currentTouches[i].pageX; // 要するにmouseX的なやつ
          newPointer.y = currentTouches[i].pageY; // 要するにmouseY的なやつ
          newPointer.prevX = newPointer.x;
          newPointer.prevY = newPointer.y;
          newPointers.push(newPointer);
        }
      }
      this.pointers.push(...newPointers);
    }
    touchMoveDefaultAction(e){
      e.preventDefault();
      const currentTouches = e.targetTouches;
      for (let i = 0; i < currentTouches.length; i++){
        for (let j = 0; j < this.pointers.length; j++){
          if (currentTouches[i].identifier === this.pointers[j].id){
            let pointer = this.pointers[j];
            pointer.moved = pointer.down;
            pointer.prevX = pointer.x;
            pointer.prevY = pointer.y;
            pointer.dx = (currentTouches[j].pageX - pointer.x);
            pointer.dy = (currentTouches[j].pageY - pointer.y);
            pointer.x = currentTouches[j].pageX;
            pointer.y = currentTouches[j].pageY;
          }
        }
      }
    }
    touchEndDefaultAction(e){
      const changedTouches = e.changedTouches;
      for (let i = 0; i < changedTouches.length; i++){
        for (let j = this.pointers.length-1; j >= 0; j--){
          if (changedTouches[i].identifier === this.pointers[j].id){
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

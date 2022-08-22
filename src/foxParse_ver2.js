/*
20220821
ObjectPool移植
addSledとnextをいったん廃止
ptnがactionを返すように仕様変更
PoolableUnitを導入してUnitを廃止
sledにセットするのは名称unitで行こうtarget変えるのめんどくさい
じゃあ帰ったらsledのとこ大幅に仕様変更します
こっちもPoolableにするimplement使えないので仕方ない
ObjectPoolのloop実行をactiveなものに限る。
そうしないといろいろまずい。recycleの際にactiveを切る
どういう条件下でrecycleを発動させるかはunitごとに決めてください。
loopはあるので。
sledの場合それがrunningであるように、
たとえばaliveだとか、outOfFieldだとか、なんかあるでしょう。
それがtrueとかfalseの場合にrecycleします、っていうのを書いて
loopでやってくださいということ。
sledのばあいそれがafterExecuteだというだけ。
今だったらcheckに当たるかな、それをね。やろうっていう。
OK
次にcountとdurationCountで書き換え...
書き換え終了。
さてと、...
addSled?

addSledにnewって書いちゃうと
sledPoolの意味が無くなる
そこなんよね
結局addSledにどう書くかで
sledPoolなのか
今まで通りいちいちnewなのかが決まってしまう
そこに問題があって。
だからどうするかというと
sledがbelongingPoolを持つ場合はsledPoolでuse
持たない場合は従来通り？
っていうのがひとつ。
それでいいのかどうかだけどね。
ていうかnewで作ってそれをどうするのか...
belongingArrayに放り込むのか
それもない場合は？？
unitに登録するのはもうやってないのよね
んぁー
なので
もういっそ
sledはpoolされていることを
前提としましょう。
それなら！問題、ない。
sledPool = new ObjectPool(() => new Sled());
んで
sledPool.initialize(2048)
とかする
んで
belongingPoolでuseってやればいいね
以上
addSledのオプションにbindを設けて
parentが設定されるようにする
これにより
たとえばあるスレッドが別のスレッドを2つ作ったとして

nextについて
nextはquitの変種で
自身のrunningをfalseにすると同時に
bindがfalseのsledをactionから生成してaddする。
これにより
自分の子スレッドはすべておじゃんで
自分も消えるが
bindされていない新しくできたsledが生き残る
（もちろん
あー
忘れてた...
sledに登録したunitが
activeでない場合に
runningを消さないといけないんだった...
ていうか
activeとは限らない？？
んー...
あとunitを取得する関数作ってないですね...
これが無いとaddSledの際に初期化できないですね
まあ自分のクローン作るっていう
ああ違うか
新しく作る場合もあるし
...

だから
こういうあれはリサイクルしますよっていう
フラグが必要で
そのフラグが立っている場合に
あれすると
んで
そのフラグの名前を統一しないといけない

aliveで。
つまりrunningもaliveにする必要があるということですね
PoolableUnitのプロパティにaliveを導入して
recycleはaliveがfalseの場合に実行されるようにし
aliveがfalseのobjectをrecycleする処理を最後に持ってくれば
それによって...
afterExecuteを衝突判定やらダメージ処理やらupdate後の枠内判定やらの
後に持ってくる
ことで
aliveがそのターンでfalseになるかどうか確定してから
runningを止めるかどうか決める的な？

場合によっては
HPが0になった→即alive=false
とは限らないケースを設けることで
たとえば
HPが0になってから攻撃を放って消える的なことも
できるし
まあいろいろね
んで
おわってから
まとめてrecycle
aliveがfalseのやつだけ
そんな感じで。
*/
/*
sledのbeforeExecute
sledのexecute
unitのupdateやdrawやdisplayやcheckや衝突判定や
それによるkillやもろもろ
それを踏まえてsledのafterExecute
unitのrecycle
sledのrecycle
*/
/*
面倒を回避するには
...
activeでなくなってから
recycleされるまでに
インターバルを...
だからぁ、

なんかシステム用意して
そこにsledと動かしたいunitやら
実行してほしいunit関連の処理やらをぶちこんで
あとはよろしく全部やってくれる的な、
そういうのあればいいね。
*/

/*
addSledについて
sledのbelongingPoolを取得しそこからsledを作り
同じunitをセットして
指定したactionを用意してこれまたセットする。
initialize
おわり
*/

/*
20220822
ObjectPoolのuseでgrowするときに
単純にindicesのおしりに付け加える形だと
古いインデックスが使われてしまうっぽいので
バグってたのを
直しました。
*/
/*
killを実装
バリエーションは勝手に作ってね(condition次第でkillするなど)
まあconditionだけ用意するか(pauseとか)
あと
setDurationCountで非整数を許さないように仕様変更
これが一番手っ取り早いので
*/

const foxParse = (function(){

  // utility.
  // Objectから最初のキーを取り出す
  function getTopKey(obj){
    let keyArray = Object.keys(obj);
    if(keyArray.length > 0){ return keyArray[0]; }
    return "";
  }
  // 配列の場合は0番～1番のうちランダム（数字限定）。
  // 配列でないならそのまま返す。
  // ってするつもりだったけどちょっといじろうかな
  // 配列で数の場合に第3引数で刻み幅を指定できるようにした
  function getValue(value){
    if(Array.isArray(value)){
      // 長さ0の場合は0を返します
      if(value.length==0){ return 0; }
      if(value.length==1){
        // 長さ1の配列でその中身が配列の場合は
        // そこからのランダム抽出
        if(Array.isArray(value[0])){
          const index = Math.floor(Math.random()*value[0].length*0.999);
          return value[0][index];
        }
        return value[0];
      }
      if(typeof(value[0])=="number"){
        // 数を含む配列で長さ2の時はrange指定
        const diff = Math.random()*(value[1]-value[0]);
        if(value.length==2){
          return value[0] + diff;
        }else{
          // 3番目の引数があれば刻み幅を指定
          if(value[2]>0){
            return value[0] + Math.floor(diff/value[2])*value[2];
          }else{
            return value[0] + diff;
          }
        }
      }else{
        // 数でない場合はランダム抽出
        const index = Math.floor(Math.random()*value.length*0.999);
        return value[index];
      }
    }
    // 配列でなければそのまま返すだけ
    return value;
  }
  // map関数(p5から移植)
  function getMap(value, start1, stop1, start2, stop2, withinBounds = false){
    let newval = (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (!withinBounds) {
      return newval;
    }
    // p5使えないのでthis.constrainとかはしない。
    // 外部でメソッド作るのに使えばいいので。
    const left = Math.min(start2, stop2);
    const right = Math.max(start2, stop2);
    if(newval < left){ return left; }
    if(newval > right){ return right; }
    return newval;
  }

  // CrossReferenceArray.
  class CrossReferenceArray extends Array{
    constructor(){
      super();
    }
    add(element){
      this.push(element);
      element.belongingArray = this; // 所属配列への参照
    }
    addMulti(elementArray){
      // 複数の場合
      elementArray.forEach((element) => { this.add(element); })
    }
    remove(element){
      let index = this.indexOf(element, 0);
      this.splice(index, 1); // elementを配列から排除する
    }
    loop(methodName, args = []){
      if(this.length === 0){ return; }
      // methodNameには"update"とか"display"が入る。まとめて行う処理。
      for(let i = 0; i < this.length; i++){
        this[i][methodName](...args);
      }
    }
    loopReverse(methodName, args = []){
      if(this.length === 0){ return; }
      // 逆から行う。排除とかこうしないとエラーになる。もうこりごり。
      for(let i = this.length - 1; i >= 0; i--){
        this[i][methodName](...args);
      }
    }
    clear(){
      this.length = 0;
    }
  }

  // オブジェクトプール
  // CrossReferenceArrayとはまた別の、objectを管理する枠組み。

  // ....
  // activeに限ろう。
  class ObjectPool{
    constructor(factory){
      this.pool = [];
      this.indices = [];
      this.factory = factory;
      this.useIndex = 0;
      this.capacity = 0;
    }
    initialize(n){
      for(let i=0; i<n;i++){
        const newPoolable = this.factory();
        newPoolable.registPool(this);
        this.pool.push(newPoolable);
        this.useIndex++;
        this.capacity++;
        this.indices.push(i);
      }
    }
    grow(m){
      const L = this.capacity;
      for(let i=0; i<m;i++){
        const newPoolable = this.factory();
        newPoolable.registPool(this);
        this.pool.push(newPoolable);
        this.capacity++;
        //this.indices.push(L+i);
        this.useIndex++;
        this.indices[this.useIndex] = L+i;
      }
    }
    use(){
      this.useIndex--;
      if(this.useIndex<0){
        this.grow(10);
      }
      const i = this.indices[this.useIndex];
      const poolable = this.pool[i];
      poolable.activate();
      //poolable.resurrect(); // activateで行うので廃止
      poolable.registPoolIndex(i);
      return poolable;
    }
    get(i){
      return this.pool[i];
    }
    recycle(_poolable){
      const i = _poolable.getPoolIndex();
      this.indices[this.useIndex] = i;
      this.useIndex++;
      _poolable.inActivate(); // inActivate.
      // recycleはループの外で実行させよう。
      // ちょっと書き換え。
    }
    getUseIndex(){
      return this.useIndex;
    }
    getCapacity(){
      return this.capacity;
    }
    isEmpty(){
      return this.useIndex === this.capacity;
    }
    loop(methodName,arg=[]){
      for(let i=0;i<this.capacity;i++){
        const _poolable = this.pool[i];
        if(!_poolable.isActive()){ continue; }
        _poolable[methodName](...arg);
      }
    }
    loopReverse(methodName,arg=[]){
      for(let i=this.capacity-1;i>=0;i--){
        const _poolable = this.pool[i];
        if(!_poolable.isActive()){ continue; }
        this.pool[i][methodName](...arg);
      }
    }
    clear(){
      // 全部戻す
      const L = this.capacity;
      this.useIndex = L;
      for(let i = 0; i < L; i++){
        this.indices[i] = i;
      }
      for(let i = 0; i < L; i++){
        this.pool[i].inActivate();
      }
    }
  }

  // こんな感じ？
  // utilityとしてCrossReferenceArrayを...
  class ParseSystem{
    constructor(){
      this.parseFunction = {}; // コマンドの略記法を実行形式にする
      this.executeFunction = {}; // 解釈されたコマンドを実行する
      this.easingFunction = {}; // イージング用の関数
      this.expandFunction = {}; // マクロ（略記の略記みたいな）
      this.registDefaultParser(); // wait,catch,loopは備え付け...
      this.registDefaultExecutor(); // set,add,wait,catch,loopです
      this.registDefaultEasing(); // linearなどいろいろ
      this.registDefaultExpansion(); // デフォルト展開関数
      this.exId = 0; // expand用の通し番号
    }
    registParser(_key, func){
      this.parseFunction[_key] = func;
    }
    registExecutor(name, func){
      this.executeFunction[name] = func;
    }
    registEasing(name, func){
      this.easingFunction[name] = func;
    }
    registExpansion(name, func){
      this.expandFunction[name] = func;
    }
    registDefaultParser(){
      // 配列の場合はイージングとかはないです
      // 固定
      // そこに関してはもうそれしかないですね
      // 弾幕でもそういうことはしてないはず
      // たとえば...まあいいや。
      // easingをパラメータごとに。

      // durationCountという名称にしてcount扱いをやめる
      // あときっかりdurationCountフレームにするため
      // 常にfalseで抜けることにする
      const commonProcess = (name, _result, _command) => {
        _result.targets = {};
        _result.easings = {};
        _result.props = {}; // rel用
        let targets = _command[name];
        for(let target of Object.keys(targets)){
          _result.targets[target] = targets[target];
          if(_command.easing === undefined){
            _result.easings[target] = "linear";
          }else if(typeof(_command.easing) === "string"){
            _result.easings[target] = _command.easing;
          }else{
            // {x:"linear",y:"easeOutQuad"}などの場合
            // 定義されてないならlinearで
            _result.easings[target] = (_command.easing[target] !== undefined ? _command.easing[target] : "linear");
          }
          if(name == "rel"){
            if(_command.prop == undefined){
              _result.props = "self";
            }else if(typeof(_command.prop) === "string"){
              _result.props[target] = _command.prop;
            }else{
              // {x:"destX",y:"destY"}のようにすることで
              // xはdestX,yはdestYを参照、のようなことができるわけ
              _result.props[target] = (_command.prop[target] !== undefined ? _command.prop[target] : "self");
            }
          }
        }
        // durationCountに名称変更
        _result.durationCount = _command.count;
      }
      // targetsの内容を同じ名前のプロパティにセットする。
      // countがある場合はeasingで変化させる。
      this.registParser("set", (data, command) => {
        let result = {};
        result.name = "set";
        if(command.count !== undefined){
          result.name = "setTransit";
        }
        commonProcess("set", result, command);
        return result;
      });
      // targetsの内容を同じ名前のプロパティに足す
      this.registParser("add", (data, command) => {
        let result = {};
        result.name = "add";
        if(command.count !== undefined){
          result.name = "addTransit";
        }
        commonProcess("add", result, command);
        return result;
      });
      // targetsに出てくるプロパティの値を、
      // propで指定された値とtargetsの値の和にする。
      // つまりpropを使ってtargetsの値を決めてしまうわけ。
      this.registParser("rel", (data, command) => {
        let result = {};
        result.name = "rel";
        if(command.count !== undefined){
          result.name = "relTransit";
        }
        commonProcess("rel", result, command);
        result.prop = command.prop;
        return result;
      });
      this.registParser("wait", (data, command) => {
        // 一定のフレーム数の間、処理を止める。
        return {name:"wait", durationCount:command.wait};
      });
      this.registParser("pause", (data, command) => {
        let _func = command.pause;
        // conditionに関数を設定し、それがtrueを返す間処理を止める。
        if(typeof(_func) !== "function"){
          _func = (unit) => true; // ずっと停止がデフォ
        }
        return {name:"pause", condition:_func};
      });
      this.registParser("catch", (data, command) => {
        return {name:"catch"};
      });
      this.registParser("loop", (data, command) => {
        return {name:"loop", count:command.loop, back:command.back};
      });
      // command.jumpとcommand.probはすでに配列化してある
      this.registParser("jump", (data, command) => {
        return {name:"jump", jump:command.jump, prob:command.prob};
      });
      // kill. 関数を引数に取り、trueを返すならばkillする。
      this.registParser("kill", (data, command) => {
        let _func = command.kill;
        if(typeof(_func) !== "function"){
          _func = (unit) => true;
        }
        return {name:"kill", condition:_func};
      });

      // addSledこうする
      // bindがあると親情報が登録されて
      // 親がkillされたらこっちもkill!
      this.registParser("addSled", (data, command) => {
        const _bind = (command.bind !== undefined ? command.bind : false);
        return {name:"addSled", action:data[command.addSled], bind:_bind}
      });

      // orbit.関数で軌道を制御。色とかにも使用可能。
      // startとstopで端っこを自由に指定（デフォ0～1）
      // targetsで変化させたいプロパティ名を指定
      // もちろん3次元でも4次元でもいくらでも。
      // relなくそう
      this.registParser("orbit", (data, command) => {
        const _easing = (command.easing === undefined ? "linear" : command.easing);
        const _start = (command.start === undefined ? 0 : command.start);
        const _stop = (command.stop === undefined ? 1 : command.stop);
        return {name:"orbit", func:command.orbit, durationCount:command.count, targets:command.targets, easing:_easing, start:_start, stop:_stop};
      });
    }
    registDefaultExecutor(){
      // set,add,relで配列指定の場合はdurationCountやeasingと
      // 両立しません。弾幕言語でもそれはやってないです。
      // 説明は略すけど、不要なので。だからgetValue.
      // 全部確定済みということ。
      // だからrelTransitもそうしようね。
      this.registExecutor("set", (unit, command, sled) => {
        const targets = command.targets;
        for(let target of Object.keys(targets)){
          unit[target] = getValue(targets[target]);
        }
        // 値を決めるだけなのでtrueで抜ける
        sled.step();
        return true;
      });

      this.registExecutor("setTransit", (unit, command, sled) => {
        const targets = command.targets;
        const c = sled.getCount();
        if(c == 0){
          // durationの取得はgetValue経由で
          // たとえば[3,5]なら3～5のどれか、[[3,5]]なら3か5,
          // という具合に指定の仕方を踏襲する。
          sled.setDurationCount(getValue(command.durationCount));
        }

        const dc = sled.getDurationCount();
        for(let target of Object.keys(targets)){
          const ease = this.easingFunction[command.easings[target]];
          unit[target] = getMap(ease((c+1)/dc), ease(c/dc), 1, unit[target], targets[target]);
        }
        // 指定したターンだけ処理するのでfalseで抜ける
        if(sled.stepCount()){ sled.step(); }
        return false;
      });

      this.registExecutor("add", (unit, command, sled) => {
        // =が+=になるだけで全部一緒
        // 値を増やすだけ。
        const targets = command.targets;
        for(let target of Object.keys(targets)){
          unit[target] += getValue(targets[target]);
        }
        sled.step();
        return true;
      });

      this.registExecutor("addTransit", (unit, command, sled) => {
        const targets = command.targets;
        const c = sled.getCount();
        if(c == 0){
          sled.setDurationCount(getValue(command.durationCount));
        }
        const dc = sled.getDurationCount();
        for(let target of Object.keys(targets)){
          const ease = this.easingFunction[command.easings[target]];
            unit[target] += (ease((c+1)/dc)-ease(c/dc)) * targets[target];
        }
        // 指定したターンだけ処理するのでfalseで抜ける
        if(sled.stepCount()){ sled.step(); }
        return false;
      });

      // rel:自身の特定のプロパティに対する変化
      // たとえばcloneで自分の値を用いるとき等に使う。
      // 例としては自分のdirectionからの差分として
      // shotの方向を定めるなど。そこら辺。
      // 自分のdirectionに影響はないので差分だけで操作できる。
      this.registExecutor("rel", (unit, command, sled) => {
        const targets = command.targets;
        for(let target of Object.keys(targets)){
          const prop = command.props[target];
          const ref = (prop !== "self" ? unit[prop] : unit[target]);
          unit[target] = ref + getValue(targets[target]);
        }
        sled.step();
        return true;
      });

      // relTransit
      // この場合targets[target]で目標との差分込みで近づけていく
      // 処理を記述できる（基本は0として使う）
      this.registExecutor("relTransit", (unit, command, sled) => {
        const targets = command.targets;
        const c = sled.getCount();
        if(c == 0){
          sled.setDurationCount(getValue(command.durationCount));
        }
        const dc = sled.getDurationCount();
        for(let target of Object.keys(targets)){
          const ease = this.easingFunction[command.easings[target]];
          const prop = command.props[target];
          const ref = (prop !== "self" ? unit[prop] : unit[target]);
          unit[target] = getMap(ease((c+1)/dc), ease(c/dc), 1, unit[target], ref + targets[target]);
        }
        // 指定したターンだけ処理するのでfalseで抜ける
        if(sled.stepCount()){ sled.step(); }
        return false;
      });

      // これもdurationCountで処理する...
      // ていうかまあいっしょだけどね...
      // ちなみにこの書き方によりたとえば
      // {wait:[[10,20,30]]}で10,20,30いずれかのカウントだけwait,
      // のようなことができる。
      // sledを停止させる処理で、unitは無関係.
      this.registExecutor("wait", (unit, command, sled) => {
        const c = sled.getCount();
        if(c == 0){
          sled.setDurationCount(getValue(command.durationCount));
        }
        if(sled.stepCount()){ sled.step(); }
        return false; // waitは常にループを抜ける
      });
      // カウントではなく関数で処理を止める。trueを返す間止める。
      this.registExecutor("pause", (unit, command, sled) => {
        // trueを返すならstepしない。
        if(!command.condition(unit)){ sled.step(); }
        return false; // waitと同様、常にループを抜ける。
      });
      this.registExecutor("catch", (unit, command, sled) => {
        sled.step();
        return true; // 何もしない
      });
      this.registExecutor("loop", (unit, command, sled) => {
        // 関数分岐させたいわね
        if(sled.loopCheck(command.count)){
          sled.step();
        }else{
          // バック処理(INFの場合常にこっち)
          sled.loopBack(command.back);
        }
        return true; // ループは抜けない
      });
      this.registExecutor("jump", (unit, command, sled) => {
        // probに従ってcommand.jumpだけindexを進めてから
        // return true;
        const jump = command.jump;
        const prob = command.prob;
        const rdm = Math.random()*0.999; // 1を避ける
        for(let i=0; i<prob.length; i++){
          if(rdm < prob[i]){
            sled.step(jump[i]);
            //sled.actionIndex += jump[i];
            //sled.commandUpdate(); // 忘れずに更新
            break;
          }
        }
        return true;
      });

      // 周回条件ですね。何度も通り過ぎる。立ち止まらない。
      // pauseで内容をいじれば立ち止まるkillも作れるけど。
      this.registExecutor("kill", (unit, command, sled) => {
        if(command.condition(unit)){ unit.kill(); sled.step(); }
        return true;
      });

      // addSled？
      this.registExecutor("addSled", (unit, command, sled) => {
        const newSled = sled.belongingPool.use();
        newSled.initialize(unit, command.action);
        if(command.bind){ newSled.setParent(sled); }
        sled.step();
        // falseで返すのは新しく作ったsledとメインsledを同期させる
        // ためです
        return false;
      });
      // orbit.というか関数。
      // 複数の値を持つ配列を返す形で、それに応じて
      // unitのpropertyを変化させる。なので位置だけで
      // なくrgbとかいろんなものを複雑に変化させる
      // ことができる...はず。
      // こっちもdurationCountで書き換えましょうね
      this.registExecutor("orbit", (unit, command, sled) => {
        const targets = command.targets;
        const c = sled.getCount();
        if(c == 0){
          sled.setDurationCount(getValue(command.durationCount));
        }
        const dc = sled.getDurationCount();
        const ease = this.easingFunction[command.easing];
        const N = command.targets.length;
        let t = ease(c/dc);
        t = command.start + t * (command.stop - command.start);
        const value = command.func(t);
        for(let i = 0; i < N; i++){
          const target = command.targets[i];
          unit[target] = value[i];
        }
        // 進める
        if(sled.stepCount()){ sled.step(); }
        return false;
      });

      // nextはいったん廃止

    }
    registDefaultEasing(){
      const funcs = {};
      const baseFuncs = {};
      // まずSineとかQuadのInバージョンを作り...
      // funcs.easeIn~~~はそのまま
      // funcs.easeOut~~~はそれを加工
      // funcs.easeInOut~~~も別の手法で加工
      // 一通りできたらそれをさらに加工してRevを作る流れ。
      funcs.linear = x => x; // これは特別。
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
      let names = ["linear"];
      for(let funcName of Object.keys(baseFuncs)){
        const f = baseFuncs[funcName];
        funcs["easeIn"+funcName] = f;
        funcs["easeOut"+funcName] = (x => 1-f(1-x));
        funcs["easeInOut"+funcName] = (x => (x < 0.5 ? 0.5*f(2*x) : 1-0.5*f(2*(1-x))));
        names.push(...["easeIn"+funcName,"easeOut"+funcName,"easeInOut"+funcName]);
      }
      // Reverse:0.5の間に1まで行って1で0に戻る
      let revs = [];
      for(let name of names){
        const f = funcs[name];
        funcs[name+"Rev"] = (x => (x < 0.5 ? f(2*x) : f(2*(1-x))));
        revs.push(name+"Rev");
      }
      names.push(...revs);
      for(let name of names){
        this.registEasing(name, funcs[name]);
      }
    }
    registDefaultExpansion(){
      // デフォルトマクロとしてchoicesを実装する
      // 内容としてはいずれかのactionを実行する感じ
      // data[アクション名]でそこまでに完成したactionを
      // 参照できる仕組み
      this.registExpansion("choices", (seed, data) => {
        // seed.choicesは配列でそれらを...
        let result = [];
        let jumpIds = [];
        const actionNames = seed.choices;
        const L = actionNames.length;
        for(let i=0; i<L; i++){
          jumpIds.push("extend" + (this.exId++));
        }
        const escapeId = "extend" + this.exId++;
        result.push({jump:jumpIds});
        for(let i=0; i<L; i++){
          result.push({catch:jumpIds[i]});
          result.push(...data[actionNames[i]]);
          result.push({jump:escapeId});
        }
        result.push({catch:escapeId});
        return result;
      });
    }
    parsePatternSeed(seed){
      // global廃止。
      //let ptn = {}; // actionを返すように仕様変更
      let data = {}; // 出来上がったactionの格納庫

      // globalをそのままコピー
      // globalやめます
      // objectごとに何とかして
      ///for(let _key of Object.keys(seed.global)){
     //   ptn[_key] = seed.global[_key];
      //}

      // 次にshortの内容により...
      // 先にactionのキー配列を取得
      const actionKeys = Object.keys(seed.action);
      // actionの各valueの展開(main, その他, その他, ...)
      // forEach廃止
      if(seed.hasOwnProperty("short")){
        for(let name of actionKeys){
          seed.action[name] = this.getExpansion(seed.short, seed.action[name], {});
        }
      }

      // parse前のcommandの配列を作る
      // parse前のcommandはpreCommandと呼ばれる
      let preData = {};
      for(let i = actionKeys.length - 1; i >= 0; i--){
        const _key = actionKeys[i];
        preData[_key] = this.expandPatternData(preData, seed.action[_key]);
        preData[_key] = this.setBackNum(preData[_key]); // backを定数にする。
        preData[_key] = this.setJumpNum(preData[_key]); // jumpを定数にする
        // ちなみにcatchは最後まで変な文字列のままです
      }

      data.action = {};
      // preCommandをparseしてcommandにする処理
      // 最終的にできあがったmainをactionとして登録する
      for(let i = actionKeys.length - 1; i >= 0; i--){
        data.action[actionKeys[i]] = this.createAction(data.action, preData[actionKeys[i]]);
      }

      // mainを返す。これをsledにセットしてinitialize.
      return data.action.main;
      //ptn.action = data.action.main;
      //return ptn;
    }
    getExpansion(shortcut, action, dict){
      let actionArray = [];
      for(let i = 0; i < action.length; i++){
        const command = action[i];
        const _type = getTopKey(command);
        if(_type === "short"){
          const commandArray = this.getExpansion(shortcut, shortcut[command.short], command);
          for(let obj of commandArray){
            // objはオブジェクトなので普通にアサイン
            let copyObj = {};
            Object.assign(copyObj, obj);
            actionArray.push(copyObj);
          }
        }else{
          // shortでない場合は普通に。ここでオブジェクトになんか書いてあるときはそこら辺の処理も行う。
          // dictが{}でないのはcommandがshortを持っててさらにそれ以外を持ってる時。これを使って、
          // 文字列で"$fire1"みたいになってるやつをいじる、つもり・・
          let result = this.interpretNestedData(command, dict);
          actionArray.push(result);
        }
      }
      return actionArray;
    }
    interpretNestedData(data, dict){
      // ここisArrayの方がいいね...
      if(Array.isArray(data)){ // 配列かどうかを見ている
        let result = [];
        for(let elem of data){
          result.push(this.interpretNestedData(elem, dict));
        }
        //data.forEach((elem) => {
        //  result.push(this.interpretNestedData(elem, dict));
        //})
        return result;
      }
      const dataType = typeof(data);
      switch(dataType){
        case "string": // 文字列のケース
          if(data[0] === '$'){
            return dict[data.substr(1)];
          }
          return data;
        case "number": // 数字のケース
          return data;
        case "boolean": // 真偽値のケース（考慮するの忘れてたごめんなさい！！）
          return data;
        case "function": // 関数のケース
          return data;
        default: // オブジェクトのケース
          let result = {};
          const keyArray = Object.keys(data);
          keyArray.forEach((key) => {
            result[key] = this.interpretNestedData(data[key], dict);
          })
          return result;
      }
    }
    expandPatternData(preData, seedArray){
      // いわゆるマクロ
      // action:"uuu" で preData.uuuを放り込むような場合にpreDataが役に立つイメージ。
      // 言葉の乱用がひどい（
      let result = [];
      for(let i = 0; i < seedArray.length; i++){
        const seed = seedArray[i];
        const name = getTopKey(seed);
        // nameが特定の予約語の場合に展開関数を使う
        if(this.expandFunction[name] !== undefined){
          result.push(...this.expandFunction[name](seed, preData));
        }else{
          result.push(seed);
        }
      }
      return result;
    }
    setJumpNum(seedArray){
      // ジャンプ関連処理
      // jump以降のcatchで同じ文字列のがあったらそこへ
      // とぶ
      // 数字で終わらなければかぶることはない
      let result = [];
      for(let i = 0; i < seedArray.length; i++){
        const seed = seedArray[i];
        if(!seed.hasOwnProperty("jump")){
          // backがなければそのまま
          result.push(seed);
          continue;
        }
        const catchCodes = seed.jump;
        let tmp = [];
        if(Array.isArray(catchCodes)){
          tmp = catchCodes;
        }else{
          // 単独の場合
          tmp = [catchCodes];
        }
        let codeArray = [];
        for(let catchCode of tmp){
          let n = 1;
          while(n < seedArray.length){
            const frontSeed = seedArray[i + n];
            if(frontSeed.hasOwnProperty("catch") && frontSeed.catch === catchCode){ break; }
            n++;
          }
          codeArray.push(n + 1);
        }
        let probArray = [];
        const N = tmp.length;
        // 長さ1の場合は1を入れる
        if(N == 1){
          probArray = [1];
        }else if(seed.prob === undefined){
          // 長さ2以上でprob未定義の場合は等確率
          for(let k=1; k<=N; k++){ probArray.push(k/N); }
        }else{
          // 長さ2以上でprob指定の場合
          let cur = 0;
          for(let k=0; k<N-1; k++){
            cur += seed.prob[k];
            probArray.push(cur);
          }
          probArray.push(1);
        }
        result.push({jump:codeArray, prob:probArray});
      }
      return result;
    }
    setBackNum(seedArray){
      // ループ処理関連
      // dataArrayの中のback持ってるオブジェクトのbackの文字列に対して
      // そこからいくつ遡ったら同じ文字列のcatchにたどり着くか調べてその値をひとつ減らして数とする。
      let result = [];
      for(let i = 0; i < seedArray.length; i++){
        const seed = seedArray[i];
        if(!seed.hasOwnProperty("back")){
          // backがなければそのまま
          result.push(seed);
          continue;
        }
        const catchCode = seed.back;
        // backが計算済みということはないので処理をカット
        let n = 1;
        while(n < seedArray.length){
          const backSeed = seedArray[i - n];
          if(backSeed.hasOwnProperty("catch") && backSeed.catch === catchCode){ break; } // catchプロパティが合致したらOK.
          n++; // これないと無限ループ。
        }
        // seedのback変えちゃうとまずいのでレプリカを作る
        let replica = {};
        Object.assign(replica, seed);
        // 1を引いてるのはcatchのすぐ次にとぶため
        // ほんとはcatchはスルーコマンドだからいいんだけどね
        replica.back = n - 1;
        result.push(replica);
      }
      return result;
    }
    createAction(data, targetAction){
      // targetActionの翻訳に出てくるactionのところの文字列はactionのプロパティネームで、
      // そこについては翻訳が終わっているのでそれをそのまま使えるイメージ。dataにはfireとbehaviorの
      // 翻訳関数が入っている。
      let actionArray = [];
      for(let i = 0; i < targetAction.length; i++){
        const command = targetAction[i];
        actionArray.push(this.interpretCommand(data, command));
      }
      return actionArray;
    }
    interpretCommand(data, command){
      const name = getTopKey(command); // 最初のキーがそのままtypeになる。
      let action;
      action = this.parseFunction[name](data, command);
      // parseTweenは廃止
      // executeに関数をセットする。これで
      // unitとParseSystemを切り離すことができる...はず。
      action.execute = this.executeFunction[action.name];
      return action;
    }
  }

  // this.actionのところをthis.sleds=[]とかする。
  // 今までactionをセットしていたところはactionをもとにsledを
  // 生成して...
  // this.sleds.push(new Sled(ptn.action));
  // ってやる感じ。sledでactionとactionIndexが用意される
  // action自体の仕様に変更はないが
  // actionIndexの主体が変わるのでそこ注意だわね
  // 内部ではunitを用いるのでそこは問題ない
  // executeでthisをunitの形でsledに渡すと
  // sledがexecuteでunitとcommandを用いて...
  // sledにthis.currentCommandの形で渡すなど。んー。いいか別に。
  // actionIndexを増やすたびにcurrentCommandを増やす形にすれば
  // まあそれがexecuteするわけで
  // ただそれを書くってなるとdefaultのそれ関連一式をきちんと
  // 書き換えてテストしないといけないわね。大変だ～～。

  // 継承するにしても
  // 今までthis.action=actionって書いてたのを
  // this.addSled(ptn.action)って書かないといけないわけ。

  // Unitの代わりとなるPoolableなUnit.
  // activeという重要なプロパティを持つ
  // これがオフになるとsledが停止するとかこれを使ってpoolで
  // 大量のオブジェクトを管理するなど。
  // しかもpoolに入れなくてもきちんと機能する（破棄する予定が
  // 無い場合とか。いくつか作ってそれらを使い回すだけなら
  // poolingしなくていいので）

  // aliveを設けて
  // aliveがfalseのものをrecycleするように仕様変更
  // ワンクッションおくことで
  // 置き換わった別の何かに反応、を、防ぐ
  class PoolableUnit{
    constructor(){
      this.poolIndex = -1;
      this.belongingPool = undefined;
      this.active = false;
      this.alive = false;
    }
    initialize(p = {}){
      /* なんかする(pはプロパティをまとめたオブジェクト) */
      // ここでactivateすることはないです
    }
    kill(){
      this.alive = false;
    }
    isAlive(){
      return this.alive;
    }
    activate(){
      this.alive = true;
      this.active = true;
    }
    inActivate(){
      this.active = false;
    }
    isActive(){
      return this.active;
    }
    registPool(pool){
      this.belongingPool = pool;
    }
    registPoolIndex(i){
      this.poolIndex=i;
    }
    getPoolIndex(){
      return this.poolIndex;
    }
    recycle(){
      // inActivateはこのメソッド内で実行する
      // いつrecycleするかはunitごとに決めてください
      if(this.alive){ return; }
      this.belongingPool.recycle(this);
    }
  }
  // こうしないと
  // activeでないobjectの走査でrecycleが無限に実行されてしまう
  // ことに気付いたので。それはまずいと。

  /*
  // Unitを廃止
  // 代わりに
  class Unit{
    constructor(){
      this.sleds = [];
    }
    initialize(ptn){
      // ptnの内容に応じて初期化
      this.addSled(ptn.action);
    }
    addSled(action){
      // sledの追加。
      // 具体的にはexecutorのデフォルトを増やして、
      // 今まで通りパターン内のactionに追加する形で、{parallel:"アクション名"}で単純に追加、でいいんじゃないかなと。
      const newSled = new Sled(action);
      this.sleds.push(newSled);
    }
    execute(){
      const L = this.sleds.length;
      for(let i=L-1; i>=0; i--){
        const currentSled = this.sleds[i];
        // ここのタイミングでcurrentSled.currentCommand.name==="next"かどうかを見る
        // 見たうえでrunningがfalseになるならばそれはnextが発動したということなので
        // そこでこの処理を終了させる。
        // isNextはrunning中でないと取得できない！
        if(currentSled.running){
          const isNext = (currentSled.currentCommand.name === "next");
          currentSled.execute(this);
          // ここ。
          // sledsが書き換えられたのならそれ以上の処理は行わない。
          if(isNext && !currentSled.running){ break; }
          continue;
        }
        this.sleds.splice(i, 1); // 終わったスレッドを排除
      }
    }
  }
  */

  // Sled改造計画
  // まずactionとunitでinitializeするように書き換え
  // さらにPoolable関連のメソッドを用意
  // 使うには最初にpreExecuteでdoneをfalseにする
  // これで
  // aliveでなくなるケースは3つ。
  // 1.処理が最後まで到達する
  // 2.parentが定義されていてparentのaliveがfalseになる
  // 3.コマンド「quit」が発動する
  // すべてexecuteにおいて起こる事象。
  // こんな感じ。で、parentのaliveはfalseになる場合executeの
  // 中でそれが行われるので、他のなんかになってしまう前に
  // それが実行されるから、んでそれがafterExecuteで実行される
  // から、問題なく、recycleされる、はず。
  // parentが他の得体のしれないsledで置き換わることで
  // 処理が終了しない問題は発生しない。それはparentが
  // recycleされた後なので。つまり次のターンのexecute.
  // その時にはもう子はrecycleされている。

  // currentIndexの代わりにcounterIndexにする。
  // そしてcurrentCommandとactionとactionIndexを追加。
  // メソッドとしてexecuteを追加
  class Sled extends Array{
    constructor(){
      super();
      // プール関連
      this.poolIndex = -1;
      this.belongingPool = undefined;
      this.active = false;
      this.alive = false;
    }
    initialize(unit, action){
      // 操作対象
      this.unit = unit;
      // 従来のプロパティ
      this.action = action;
      this.actionIndex = 0;
      this.counterIndex = 0;
      this.currentCommand = this.action[0];
      this.length = 0;
      // runningを廃止してactiveに統一する
      //this.running = true; // trueの間は処理中。falseになったら処理排除する。
      // カウント系メソッド用の自前のカウンター
      // ループ処理管理とは別に用意
      this.count = 0;
      this.durationCount = 0;
      // 通し処理の直前にfalseにすることで
      // 処理内で作られたスレッドが実行されないようにする
      this.done = true;
      // addSledでsledを作るときにbindがtrueならば
      // 親へのポインタをここに登録し
      // 親がactiveでないならこっちもactiveを切る
      this.parent = undefined;
      //this.currentIndex = 0;
      //this.running = true;→aliveで統一
      // runningとactiveは別でした（ごめんなさい）
      // runningがfalseになったらrecycleっていう流れにしよう。
    }
    kill(){
      this.alive = false;
    }
    isAlive(){
      return this.alive;
    }
    activate(){
      this.alive = true;
      this.active = true;
    }
    inActivate(){
      this.active = false;
    }
    isActive(){
      return this.active;
    }
    registPool(pool){
      this.belongingPool = pool;
    }
    registPoolIndex(i){
      this.poolIndex=i;
    }
    getPoolIndex(){
      return this.poolIndex;
    }
    recycle(){
      if(this.alive){ return; }
      this.belongingPool.recycle(this);
    }
    // まあ柔軟性考えるとね
    getCount(){
      return this.count;
    }
    getDurationCount(){
      return this.durationCount;
    }
    resetCount(){
      this.count = 0;
    }
    setDurationCount(n){
      // 非整数は許さない
      this.durationCount = Math.floor(n);
    }
    stepCount(){
      this.count++;
      // 続く場合
      if(this.count < this.durationCount){
        return false;
      }
      // 終了する場合
      this.resetCount();
      return true;
    }
    setParent(newParent){
      this.parent = newParent;
    }
    getLoopCount(){
      // そのときのloopCountを取得する。0～limit-1が返る想定。
      if(this.counterIndex === this.length){ this.push(0); }
      return this[this.counterIndex];
    }
    step(n = 1){
      // これを実行する。actionIndex++の代わりに。
      // nだけ進んだり戻したりする。デフォは1です。
      this.actionIndex += n;
      this.currentCommand = this.action[this.actionIndex];
    }
    loopCheck(limit){
      // countを増やす。limitに達しなければfalseを返す。達するならcountを進める。
      if(this.counterIndex === this.length){ this.push(0); }

      this[this.counterIndex]++;

      if(this[this.counterIndex] < limit){ return false; }
      // limitに達した場合はindexを増やす。
      this.counterIndex++;
      return true;
    }
    loopBack(back){
      // sled単位の処理になったのでunitを削除
      //console.log("prev",this.counterIndex);
      for(let i = 1; i <= back; i++){
        //const currentCommand = action[actionIndex - i];
        // あっ！！間違えた！！
        // そうなんだよ。ここ、途中のコマンドをさらっていくから
        // currentCommandとかしちゃいけないの...
        if(this.action[this.actionIndex - i].count !== undefined){
          this.counterIndex--;
          //console.log(this.counterIndex);
          this[this.counterIndex] = 0;
        }
      }
      this.step((-1)*back);
      //this.actionIndex -= back; // 最後にまとめて戻す
      // このときcurrentCommandを更新しないと
      // エラーになるので注意！！
      //this.commandUpdate();
    }
    beforeExecute(){
      // aliveでないなら処理をしない
      if(!this.alive){ return; }
      // doneをfalseにする
      this.done = false;
    }
    execute(){
      // aliveでないなら処理をしない
      // doneがtrueなら処理をしない
      if(!this.alive || this.done){ return; }
      // parentがいてaliveでないならaliveをfalseにして終了
      if(this.parent !== undefined){
        if(!this.parent.isAlive()){
          this.kill();
          return;
        }
      }
      // unitがaliveでないなら処理終了
      if(!this.unit.isAlive()){
        this.kill();
        return;
      }
      // アタッチされたunitでexecute.
      if(this.action.length > 0 && this.actionIndex < this.action.length){
        let flag = true;
        while(flag){
          flag = this.currentCommand.execute(this.unit, this.currentCommand, this); // flagがfalseを返すときに抜ける
          if(this.actionIndex === this.action.length){
            this.kill(); // 処理終了
            break;
          }
        }
      }
      this.done = true;
    }
    afterExecute(){
      // parentがいてrunningでないならrunningをfalseにする
      // 処理の順番によっては自分の親があとでrunning=falseに
      // なる場合があって、その場合のための処理。
      if(this.parent !== undefined){
        if(!this.parent.isAlive()){ this.kill(); }
      }
      // unitがaliveでないなら処理終了
      if(!this.unit.isAlive()){ this.kill(); }
      // unitのalive判定一通り
      // のあとで、sledのalive判定一通りっていう
      // 事後のrecycleはどういう順番でもいい
      // 対象が置き換わってしまうのを防ぐ
      // ほんとはunit側から通知できればいいんだけどやりたくないので
      // ...あんまきれいではないね...
      // unitにsledの集合持たせてあれこれっていうのをやりたくない...
    }
  }

  // ささっとね
  // dataには4つのデータが格納される
  // capacity:使うことになるsledの数の見積もり
  // unit:最初のsledをセットするユニット。初期化は
  // やっておいてね
  // action:最初のユニットにセットする命令
  // オブジェクト表記で作ったものをパースする
  // main:メイン実行関数
  // 基本的にはunitのupdateとかdisplayとかcheckとか
  // いろいろ。
  // これが終わってから
  // 必要ならrecycle
  // 同じもの使い回すなら必要ないけど
  // そんなところかな。うまくいくんですかね...
  class System{
    constructor(capacity = 64){
      this.sledPool = new ObjectPool(() => new Sled());
      // こっちで初期化して、
      // initializeのたびにpoolを初期化して、でいいか。
      // unitの方はこっちで用意できないので無理です。
      this.sledPool.initialize(capacity);
      this.mainFunction = () => {};
    }
    main(func = () => {}){
      this.mainFunction = func;
    }
    addSled(unit, action){
      const newSled = this.sledPool.use();
      newSled.initialize(unit, action);
    }
    clear(){
      this.sledPool.clear();
    }
    initialize(data){
      // 別々に行うこともできる
      // まとめて行う場合はこれ
      this.clear(); // すべてinActivate.
      this.addSled(data.unit, data.action);
      this.main(data.main);
    }
    execute(){
      this.sledPool.loop("beforeExecute");
      this.sledPool.loop("execute");
      this.mainFunction();
      this.sledPool.loop("afterExecute");
      this.sledPool.loop("recycle");
    }
  }

  let ex = {};
  ex.ParseSystem = ParseSystem;
  ex.PoolableUnit = PoolableUnit;
  ex.Sled = Sled;
  ex.getTopKey = getTopKey;
  ex.CrossReferenceArray = CrossReferenceArray;
  ex.ObjectPool = ObjectPool;
  ex.System = System;

  // easing.

  return ex;
})();

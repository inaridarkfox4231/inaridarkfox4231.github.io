// 20220802
// jump実装してeasingをパラメータ別にしました
// これで満足かな...もういい？
// 20220807
// ランダムで刻み幅とランダム抽出をできるようにした
// 数のランダム抽出はできないのでご愛敬。
// 数でなければ自動的にランダム抽出。
// 長さ1の配列でその成分が配列ならランダム抽出
// ってのはどう？それならたとえば2,3,8のどれかが欲しいって
// 場合には[[2,3,8]]って書けばいけるね。
// 20220807
// relもイージング作った。
// 20220808
// イージング増やしたよ
// 20220809
// イージング周りを整理。Revを追加。
// 20220810
// Unitのinitializeにthis.action=ptn.actionを記述
// 最低でもそれくらいはやってほしいのです
// expandFunctionのデフォルトとしてchoicesを実装
// これで分岐処理が簡潔に書けるようになった

// counterにactionIndexとactionを実装して
// 複数のカウンターを同時実行する形でマルチスレッド実現できないかな
// どうせ敵とか限定でしょ、できるんじゃない。
// 弾丸とかは今まで通りシングルスレッドで。
// たとえば移動しながら弾丸撃ったりできる。

// 内容的にはLoopCounterをsledと改名したうえで
// sledにloopCounterとaction,actionIndexの機能を持たせて
// Unitにsledsという形で...
// this.sleds=[];
// sled.execute()をすべてのsledに対して実行
// unit.actionIndexのところはどうなる？主体...
// おそらくthis.actionIndexってなるんじゃないかと。その場合、
// 本当にthisはsledを指すのか→指します。OK.

// だいぶ内容が書き換えられるわね...んー。別バージョンでいこう。
// foxParse_ver1で。foxParse_ver1.jsとかそんな感じ。

// あとオブジェクトプールの機構を用意してUnit系のプログラム
// 書きやすくしたいんだよなぁ...

// オブジェクトのプロパティの列挙順に依存するコードを書くべきではない（https://qiita.com/anqooqie/items/ab3fed5d269d278cdd2b）
// 書いてますね。。。。
// どうにかしないといけない。
// action:[{main:[]},{subRoutine0:[]},{subRoutine1:[]},...]
// って描くべきなのよね。というか...
// このオブジェクトにglobal:{}を追加することで
// actionをセットするときにグローバル指定できるんじゃ...？
// まあ、できるんですよね...
// で、それを使うことでcloneとかgenerateみたいなことを出来るはずですからして...
// でもそれはセットする、コピーして、んー。

// 文字列なら入れた順番でOKみたい。整数使うとそっちが優先されると。そういうことですね。
// まあそういう使い方しないから別にいいや。

// 色々変更したけど基本的には特に問題ないはずなので、
// いつものように一通りデフォルトの動作を確認しておしまいにしようね。
// あと簡単なマルチスレッドやってみようかね。

// コマンドのactionIndexを進めてupdateする箇所を
// stepの1ヶ所に集約。
// 仕様変更に強いコードは正義。

// ごめん
// easing, 複数であってもeasing:{}って書いてた
// だからrelのpropも複数であってもprop:{...}って書かないと
// 整合性取れないわね。難しい...

// マルチスレッド、手ごわい。わからん！！！！
// ごめんね...
// loopBack（ここほんとにわかりづらい処理してて）
// ここで途中のcountを持つコマンドをさらうところを
// currentCommandしか見てなかったってわけ。馬鹿じゃん。...

// ああもう！！！おわってくれない！！なぜ！
// わかった
// 常にcountを用意するようにしちゃったせいでhasOwnPropertyが
// 誤作動してた。まじか....
// 気を付けよう...

// たとえばorbitと組み合わせるとか
// orbitは位置を与える関数
// unitがxとかyを持つことを前提とする感じで。
// orbit:{func:~~,prop:[],count:~~,easing:~~}
// countがInfinityの場合は永久周回ですね。たぶん。
// ならないよ。
// なりません...
// propの長さの分だけfuncが0～1のtに対して一定の長さの
// 配列を返すわけですけどそれに対して[]の中のpropertyを
// それがunitが持っててそれに対応させることで汎用性を
// 実現するという作戦なのです。OK？
// だから色とかでも使えるってわけ。どう使うのか知らないけど。
// 0～1オンリーでは柔軟性が皆無なので、
// startとstopを定義できるようにしました。
// たとえば0～TAUをPI/4刻みで8段階とかできますね。

// さらにunitの何かに対して...
// たとえばrel:"parent"とすることで
// parent[target]を足した値にするなど。できるね。

// 親を中心として円形軌道とかそういうことができる...はず...
// 親が動いてる場合とかね...
// はぁ、やっと。

// nextも実装できたよ。
// orbitと並んでさらに汎用性が高くなった。
// あるいはそうね、jumpとconditionを組み合わせるなど。
// ただそれに関してはある程度需要が高まるのを
// 待った方がいいわね。

// addSled, orbit, next.
// これでも汎用性が保たれている...
// cloneとかは汎用性を考えるのが難しいのよね。
// だってジェネレータの場合もあるでしょうし。難しいのよね。

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
        _result.count = _command.count;
      }
      // targetsの内容を同じ名前のプロパティにセットする。
      // countがある場合はeasingで変化させる。
      this.registParser("set", (data, command) => {
        let result = {};
        result.name = "set";
        commonProcess("set", result, command);
        return result;
      });
      // targetsの内容を同じ名前のプロパティに足す
      this.registParser("add", (data, command) => {
        let result = {};
        result.name = "add";
        commonProcess("add", result, command);
        return result;
      });
      // targetsに出てくるプロパティの値を、
      // propで指定された値とtargetsの値の和にする。
      // つまりpropを使ってtargetsの値を決めてしまうわけ。
      this.registParser("rel", (data, command) => {
        let result = {};
        result.name = "rel";
        commonProcess("rel", result, command);
        result.prop = command.prop;
        return result;
      });
      this.registParser("wait", (data, command) => {
        return {name:"wait", count:command.wait};
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
      // sledの追加
      this.registParser("addSled", (data, command) => {
        return {name:"addSled", action:data[command.addSled]};
      });
      // orbit.関数で軌道を制御。色とかにも使用可能。
      // startとstopで端っこを自由に指定（デフォ0～1）
      // targetsで変化させたいプロパティ名を指定
      // もちろん3次元でも4次元でもいくらでも。
      this.registParser("orbit", (data, command) => {
        const _easing = (command.easing === undefined ? "linear" : command.easing);
        const _start = (command.start === undefined ? 0 : command.start);
        const _stop = (command.stop === undefined ? 1 : command.stop);
        return {name:"orbit", func:command.orbit, count:command.count, targets:command.targets, easing:_easing, start:_start, stop:_stop, rel:command.rel};
      });
      // next.
      // conditionがfalseである限り沈黙し続ける。
      // trueになった時にすべてのsledを消去したうえで
      // 登録されたactionから生成されたsledを
      // 単独で用意させる感じですね。
      this.registParser("next", (data, command) => {
        return {name:"next", action:data[command.next], condition:command.condition};
      });
    }
    registDefaultExecutor(){
      // set,add,relで配列指定の場合はcountやeasingと
      // 両立しません。弾幕言語でもそれはやってないです。
      // 説明は略すけど、不要なので。だからgetValue.
      this.registExecutor("set", (unit, command, sled) => {
        const targets = command.targets;
        let indexAdvanceFlag = true; // 進めるかどうか
        if(command.count == undefined){
          // countが無ければそのままsetして終わり
          for(let target of Object.keys(targets)){
            unit[target] = getValue(targets[target]);
          }
        }else{
          // countとeasingがある場合はそれを考慮して計算
          // easingはパラメタ別に違うものを指定可能
          //const cc = unit.counter.getLoopCount();
          const cc = sled.getLoopCount();
          for(let target of Object.keys(targets)){
            const ease = this.easingFunction[command.easings[target]];
            unit[target] = getMap(ease((cc + 1)/command.count), ease(cc/command.count), 1, unit[target], targets[target]);
          }
          indexAdvanceFlag = sled.loopCheck(command.count);
        }
        if(indexAdvanceFlag){ sled.step(); }
        return indexAdvanceFlag;
      });
      this.registExecutor("add", (unit, command, sled) => {
        // =が+=になるだけで全部一緒
        const targets = command.targets;
        let indexAdvanceFlag = true; // 進めるかどうか
        if(command.count == undefined){
          // countが無ければそのままaddして終わり
          for(let target of Object.keys(targets)){
            unit[target] += getValue(targets[target]);
          }
        }else{
          // countとeasingがある場合はそれを考慮して計算
          const cc = sled.getLoopCount();
          for(let target of Object.keys(targets)){
            const ease = this.easingFunction[command.easings[target]];
            unit[target] += (ease((cc + 1)/command.count) - ease(cc/command.count)) * targets[target];
          }
          indexAdvanceFlag = sled.loopCheck(command.count);
        }
        if(indexAdvanceFlag){ sled.step(); }
        return indexAdvanceFlag;
      });
      // rel:自身の特定のプロパティに対する変化
      // たとえばcloneで自分の値を用いるとき等に使う。
      // countも欲しいかもしれない
      // relのeasing作ろう。必要。
      this.registExecutor("rel", (unit, command, sled) => {
        const targets = command.targets;
        let indexAdvanceFlag = true;
        // refはcommand.propで指定されるunitのpropertyで
        // 無ければtargetがそのまま使われる
        // relは基本的に...
        if(command.count == undefined){
          for(let target of Object.keys(targets)){
            const prop = command.props[target];
        　　const ref = (prop !== "self" ? unit[prop] : unit[target]);
            unit[target] = ref + getValue(targets[target]);
          }
        }else{
          // countとeasingがある場合はそれを考慮して計算
          // ああそうかsetのメソッドを流用すればいいのか、なんで気付かなかったの...
          // この場合targets[target]は使わないですね。
          // refが目標値で、そこに近づいていく形。
          const cc = sled.getLoopCount();
          for(let target of Object.keys(targets)){
            const ease = this.easingFunction[command.easings[target]];
            const prop = command.props[target];
        　　const ref = (prop !== "self" ? unit[prop] : unit[target]);
            unit[target] = getMap(ease((cc + 1)/command.count), ease(cc/command.count), 1, unit[target], ref);
          }
          indexAdvanceFlag = sled.loopCheck(command.count);
        }
        // 進める
        if(indexAdvanceFlag){ sled.step(); }
        return indexAdvanceFlag;
      });
      this.registExecutor("wait", (unit, command, sled) => {
        if(sled.loopCheck(command.count)){
          sled.step();
        }
        return false; // waitは常にループを抜ける
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
      // sledの追加
      this.registExecutor("addSled", (unit, command, sled) => {
        unit.addSled(command.action);
        sled.step();
        return true;
      });
      // orbit.というか関数。
      // 複数の値を持つ配列を返す形で、それに応じて
      // unitのpropertyを変化させる。なので位置だけで
      // なくrgbとかいろんなものを複雑に変化させる
      // ことができる...はず。
      this.registExecutor("orbit", (unit, command, sled) => {
        let indexAdvanceFlag = true; // 進めるかどうか
        const cc = sled.getLoopCount();
        const ease = this.easingFunction[command.easing];
        const N = command.targets.length;
        let t = ease(cc/command.count);
        t = command.start + t * (command.stop - command.start);
        const value = command.func(t);
        for(let i = 0; i < N; i++){
          const target = command.targets[i];
          const offset = (command.rel === undefined ? 0 : unit[command.rel][target]);
          unit[target] = offset + value[i];
        }
        indexAdvanceFlag = sled.loopCheck(command.count);
        // 進める
        if(indexAdvanceFlag){ sled.step(); }
        return indexAdvanceFlag;
      });
      // next.
      // これ、sledsを置き換えちゃうから、一番最初に
      // 登録しないとやばいね。
      // 常に最後に評価されるようにしないとだね。
      // もしくは「nextは1つまで」という規約を
      // 設けたうえで最初に持ってくるとか。
      // バリエーションとしては複数のconditionを用意して
      // unionとかcapで評価するなど。
      this.registExecutor("next", (unit, command, sled) => {
        const flag = command.condition(unit);
        if(!flag){ return false; }
        unit.sleds = [];
        unit.addSled(command.action);
        // この時点ではまだ本来のsledにいる
        // unit.sledsを空にしたからと言ってなくなるわけでは
        // ないしloopを抜けなければ次の処理に行けない。
        sled.step();
        // 常に抜ける。
        return false;
      });
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
      // globalについてはそのまま移植でいいと思うとりあえずは
      let ptn = {};
      let data = {};

      // globalをそのままコピー
      for(let _key of Object.keys(seed.global)){
        ptn[_key] = seed.global[_key];
      }

      // 次にshortの内容により...
      // 先にactionのキー配列を取得
      const actionKeys = Object.keys(seed.action);
      // actionの各valueの展開(main, その他, その他, ...)
      if(seed.hasOwnProperty("short")){
        actionKeys.forEach((name) => {
          seed.action[name] = this.getExpansion(seed.short, seed.action[name], {});
        });
      }

      let preData = {};
      for(let i = actionKeys.length - 1; i >= 0; i--){
        const _key = actionKeys[i];
        preData[_key] = this.expandPatternData(preData, seed.action[_key]);
        preData[_key] = this.setBackNum(preData[_key]); // backを定数にする。
        preData[_key] = this.setJumpNum(preData[_key]); // jumpを定数にする
        // ちなみにcatchは最後まで変な文字列のままです
      }

      data.action = {};
      // 最終的にできあがったmainをactionとして登録する
      for(let i = actionKeys.length - 1; i >= 0; i--){
        data.action[actionKeys[i]] = this.createAction(data.action, preData[actionKeys[i]]);
      }

      ptn.action = data.action.main;
      return ptn;
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
  class Unit{
    constructor(){
      //this.action = [];
      //this.actionIndex = 0;
      //this.counter = new LoopCounter();
      this.sleds = [];
    }
    initialize(ptn){
      // ptnの内容に応じて初期化
      this.addSled(ptn.action);
      //this.action = ptn.action; // 最低限。
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

  // currentIndexの代わりにcounterIndexにする。
  // そしてcurrentCommandとactionとactionIndexを追加。
  // メソッドとしてexecuteを追加
  class Sled extends Array{
    constructor(action){
      super();
      this.initialize(action);
    }
    initialize(action){
      this.action = action;
      this.actionIndex = 0;
      this.counterIndex = 0;
      this.currentCommand = this.action[0];
      this.length = 0;
      this.running = true; // trueの間は処理中。falseになったら処理排除する。
      //this.currentIndex = 0;
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
    execute(unit){
      if(this.action.length > 0 && this.actionIndex < this.action.length){
        let continueFlag = true;
        while(continueFlag){
          //const command = this.action[this.actionIndex];
          // そうですね。sledも渡さないと...thisはあっちだと、んー...Systemを指す、まあそうか...
          // easingをシステムに持たせているのは増やせるようにするためだけど。使う分だけ
          // 用意する方が軽いし。どっちがいいのか分からないわね。
          continueFlag = this.currentCommand.execute(unit, this.currentCommand, this); // flagがfalseを返すときに抜ける
          // stepはexecute内でのみ実行される可能性があるわけ。
          // その直後にこれで処理終了ってなるならそこで終わりなのよ。
          if(this.actionIndex === this.action.length){
            this.running = false; // 処理終了
            break;
          }
        }
      }
    }
  }

  let ex = {};
  ex.ParseSystem = ParseSystem;
  ex.Unit = Unit;
  ex.Sled = Sled;
  ex.getTopKey = getTopKey;
  ex.CrossReferenceArray = CrossReferenceArray;

  // easing.

  return ex;
})();

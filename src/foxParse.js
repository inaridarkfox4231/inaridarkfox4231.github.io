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

let foxParse = (function(){

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
              _result.props[target] = (_command.props[target] !== undefined ? _command.props[target] : "self");
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
    }
    registDefaultExecutor(){
      // set,add,relで配列指定の場合はcountやeasingと
      // 両立しません。弾幕言語でもそれはやってないです。
      // 説明は略すけど、不要なので。だからgetValue.
      this.registExecutor("set", (unit, command) => {
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
          const cc = unit.counter.getLoopCount();
          for(let target of Object.keys(targets)){
            const ease = this.easingFunction[command.easings[target]];
            unit[target] = getMap(ease((cc + 1)/command.count), ease(cc/command.count), 1, unit[target], targets[target]);
          }
          indexAdvanceFlag = unit.counter.loopCheck(command.count);
        }
        if(indexAdvanceFlag){ unit.actionIndex++; }
        return indexAdvanceFlag;
      });
      this.registExecutor("add", (unit, command) => {
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
          const cc = unit.counter.getLoopCount();
          for(let target of Object.keys(targets)){
            const ease = this.easingFunction[command.easings[target]];
            unit[target] += (ease((cc + 1)/command.count) - ease(cc/command.count)) * targets[target];
          }
          indexAdvanceFlag = unit.counter.loopCheck(command.count);
        }
        if(indexAdvanceFlag){ unit.actionIndex++; }
        return indexAdvanceFlag;
      });
      // rel:自身の特定のプロパティに対する変化
      // たとえばcloneで自分の値を用いるとき等に使う。
      // countも欲しいかもしれない
      // relのeasing作ろう。必要。
      this.registExecutor("rel", (unit, command) => {
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
          const cc = unit.counter.getLoopCount();
          for(let target of Object.keys(targets)){
            const ease = this.easingFunction[command.easings[target]];
            const prop = command.props[target];
        　　const ref = (prop !== "self" ? unit[prop] : unit[target]);
            unit[target] = getMap(ease((cc + 1)/command.count), ease(cc/command.count), 1, unit[target], ref);
          }
          indexAdvanceFlag = unit.counter.loopCheck(command.count);
        }
        // 進める
        if(indexAdvanceFlag){ unit.actionIndex++; }
        return indexAdvanceFlag;
      });
      this.registExecutor("wait", (unit, command) => {
        if(unit.counter.loopCheck(command.count)){
          unit.actionIndex++;
        }
        return false; // waitは常にループを抜ける
      });
      this.registExecutor("catch", (unit, command) => {
        unit.actionIndex++;
        return true; // 何もしない
      });
      this.registExecutor("loop", (unit, command) => {
        // 関数分岐させたいわね
        if(unit.counter.loopCheck(command.count)){
          unit.actionIndex++;
        }else{
          // バック処理(INFの場合常にこっち)
          unit.counter.loopBack(unit, command.back);
        }
        return true; // ループは抜けない
      });
      this.registExecutor("jump", (unit, command) => {
        // probに従ってcommand.jumpだけindexを進めてから
        // return true;
        const jump = command.jump;
        const prob = command.prob;
        const rdm = Math.random()*0.999; // 1を避ける
        for(let i=0; i<prob.length; i++){
          if(rdm < prob[i]){
            unit.actionIndex += jump[i];
            break;
          }
        }
        return true;
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

  class Unit{
    constructor(){
      this.action = [];
      this.actionIndex = 0;
      this.counter = new LoopCounter();
    }
    initialize(ptn){
      // ptnの内容に応じて初期化
      this.action = ptn.action; // 最低限。
    }
    execute(){
      if(this.action.length > 0 && this.actionIndex < this.action.length){
        let continueFlag = true;
        while(continueFlag){
          const command = this.action[this.actionIndex];
          continueFlag = command.execute(this, command); // flagがfalseを返すときに抜ける
          if(this.actionIndex === this.action.length){ break; }
        }
      }
    }
  }

  class LoopCounter extends Array{
    constructor(){
      super();
      this.initialize();
    }
    initialize(){
      this.length = 0;
      this.currentIndex = 0;
    }
    getLoopCount(){
      // そのときのloopCountを取得する。0～limit-1が返る想定。
      if(this.currentIndex === this.length){ this.push(0); }
      return this[this.currentIndex];
    }
    loopCheck(limit){
      // countを増やす。limitに達しなければfalseを返す。達するならcountを進める。
      if(this.currentIndex === this.length){ this.push(0); }
      this[this.currentIndex]++;
      if(this[this.currentIndex] < limit){ return false; }
      // limitに達した場合はindexを増やす。
      this.currentIndex++;
      return true;
    }
    loopBack(unit, back){
      // unitのactionIndexをbackだけ戻す。その間にcountプロパティをもつcommandがあったら
      // そのたびにcurrentIndexを1減らしてそこの値を0にならす。
      let {action, actionIndex} = unit;
      for(let i = 1; i <= back; i++){
        const currentCommand = action[actionIndex - i];
        if(currentCommand.hasOwnProperty("count")){
          this.currentIndex--;
          this[this.currentIndex] = 0;
        }
      }
      unit.actionIndex -= back; // 最後にまとめて戻す
    }
  }

  let ex = {};
  ex.ParseSystem = ParseSystem;
  ex.Unit = Unit;
  ex.LoopCounter = LoopCounter;
  ex.getTopKey = getTopKey;
  ex.CrossReferenceArray = CrossReferenceArray;

  return ex;
})();

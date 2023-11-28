/*
  dataだけ差し替えてinitializeすることで別の迷路というか全域木を生成できる
  ようになりました
*/

const mazeFactory = (function(){
  const UNREACHED = 0;
  const ARRIVED = 1;

  const UNDETERMINED = 0;
  const IS_PASSABLE = 1;
  const IS_NOT_PASSABLE = 2;

  const FORWARD = 0; // 次の頂点が見つかった。次のステップは新しい頂点から。
  const AVOID = 1;   // 頂点は到達済みでした。別の頂点を探します。
  const BACK = 2;    // 次の頂点が見つからないので引き返します。
  const FINISH = 3;  // 木の作成が完了しました。

  // 配列からのランダム抽出関数
  function randomChoice(s){
    return s[Math.floor(Math.random()*s.length)];
  }

  class Component{
    constructor(){
      this.state = undefined;
      this.connected = [];
      this.index = -1;
    }
    setState(newState){ this.state = newState; }
    getState(){ return this.state; }
    setIndex(i){ this.index = i; }
    getIndex(){ return this.index; }
    regist(other){ this.connected.push(other); }
    getConnectedComponents(){ return this.connected; }
  }

  // 頂点
  class Vertice extends Component{
    constructor(){
      super();
    }
  }

  // 辺
  class Edge extends Component{
    constructor(v1, v2){
      super();
    }
    getOtherVertice(v){
      // 与えられた引数の頂点とは反対側の頂点を返す。
      if(this.connected[0].getIndex() === v.getIndex()){
        return this.connected[1];
      }
      if(this.connected[1].getIndex() === v.getIndex()){
        return this.connected[0];
      }
      return undefined;
    }
  }

  // data = {vNum:12, eNum:17, connect:[[0, 8], [1, 8, 11], [2, 11, 14], ...], x:[...], y:[...]}
  // connectはindex番目の頂点に接する辺のindexの配列が入ったもの。
  // x, yには頂点の座標が入る予定だけど今はそこまで余裕ないです。
  // dataを元にまず頂点と辺が用意されて接続情報が登録されます。
  class Graph{
    constructor(data = {}){
      this.stepNum = 0;
      this.vertices = [];
      this.edges = [];
      this.edgeStack = []; // 辺スタック
      this.finished = false;
      // 頂点の個数だけ入っててその分verticeを準備し端点として登録・・
      // dataが無い場合は何もしない。手動で初期化する。
      if (data !== undefined) {
        this.initialize(data);
      }
    }
    getFinished(){
      return this.finished;
    }
    getStepNum(){
      return this.stepNum;
    }
    prepareComponents(data){
      // イメージ的にはprivate関数かな...
      const {vNum:vn, eNum:en} = data;
      for(let i = 0; i < vn; i++){
        let newV = data.vFactory(i);
        newV.setIndex(i);
        this.vertices.push(newV);
      }

      for(let vIndex = 0; vIndex < vn; vIndex++){
        const v1 = this.vertices[vIndex];
        for(const connectedIndex of data.connect[vIndex]){
          const v2 = this.vertices[connectedIndex];
          const e = data.eFactory(v1, v2);
          v1.regist(e);
          v2.regist(e);
          e.regist(v1);
          e.regist(v2);
          this.edges.push(e);
        }
      }
    }
    initialize(data){
      this.stepNum = 0;
      this.vertices = [];
      this.edges = [];
      this.prepareComponents(data);
      // 状態の初期化と起点の設定
      for(let v of this.vertices){ v.setState(UNREACHED); }
      for(let e of this.edges){ e.setState(UNDETERMINED); }

      this.currentVertice = randomChoice(this.vertices);
      this.currentVertice.setState(ARRIVED);

      this.edgeStack = []; // 辺スタック
      this.finished = false;
    }
    step(){
      // 終了状況を返す。FINISHを返したら処理終了。
      const undeterminedEdges = this.currentVertice.connected.filter(
        (e) => { return e.getState() === UNDETERMINED; }
      )
      if(undeterminedEdges.length + this.edgeStack.length === 0){
        return FINISH;
      }
      if(undeterminedEdges.length > 0){
        // 現在の頂点から未確定の辺が伸びている場合
        let connectedEdge = randomChoice(undeterminedEdges);
        let nextVertice = connectedEdge.getOtherVertice(this.currentVertice);
        if(nextVertice.getState() === UNREACHED){
          // 辺の先の頂点が未到達の場合
          nextVertice.setState(ARRIVED);
          // 通過した辺は通れるようにフラグを立てる
          connectedEdge.setState(IS_PASSABLE);
          this.currentVertice = nextVertice;
          this.edgeStack.push(connectedEdge);
          return FORWARD;
        }else{
          // すでに到達済みの場合
          connectedEdge.setState(IS_NOT_PASSABLE);
        }
        return AVOID;
      }
      // 現在の頂点から伸びているすべての辺が確定済みの場合
      const backEdge = this.edgeStack.pop();
      const backVertice = backEdge.getOtherVertice(this.currentVertice);
      this.currentVertice = backVertice;
      return BACK;
    }
    update(){
      if(this.finished){ return; }
      const state = this.step();
      this.stepNum++;
      if(state === FINISH){ this.finished = true; }
    }
    create(){
      // 迷路生成
      while(!this.finished){ this.update(); }
    }
  }

  // 迷路とは限らない以上、迷路用のデータ作成部分は分離して記述すべき。
  // wは格子の横のサイズ、hは格子の縦のサイズ。
  // バリエーションとして円形格子とか三角形や六角形も作ってみたいけど。あと長方形格子使って迷路生成するとか。

  // スタンダードな格子状の迷路を構成する。
  // 描画要素は完全に排除しました。それはfactoryに格納してあります。
  // indexはrow-orderです。そこだけ注意。
  // 辺が頂点と頂点から生成されればいいと思う。それでいける。
  function createStandardGridMaze(options = {}){
    const {
      w = 4,
      h = 4,
      vFactory = (index) => new Vertice(),
      eFactory = (v1, v2) => new Edge(v1, v2)
    } = options;

    const data = {};
    data.vNum = w * h;
    data.eNum = w * (h - 1) + (w - 1) * h;

    data.connect = [];

    data.vFactory = vFactory;
    data.eFactory = eFactory;

    // ここでは何をしているかというと、index番の頂点につながる辺のindexを格納している
    // 辺にはindexが付いているのでそれに従ってる
    // しかし純粋な操作ではないわね
    // そこで頂点データから辺データを作るように変更しましょってことです。
    // わかりづらいだろ
    for(let index = 0; index < w * h; index++){
      const x = index % w;
      const y = Math.floor(index / w);
      let connectedData = [];
      if(y > 0){ connectedData.push(x + (y-1)*w); }
      if(y < h - 1){ connectedData.push(x + (y+1)*w); }
      if(x > 0){ connectedData.push(x-1 + y*w); }
      if(x < w - 1){ connectedData.push(x+1 + y*w); }
      data.connect.push(connectedData);
    }
    return data;
  }

  // 上と下、右と左がくっついてる
  // 2次元とは限らないのでfactoryも工夫が必要でしょう
  function createTorusGridMaze(options = {}){
    const {
      w = 4,
      h = 4,
      vFactory = (index) => new Vertice(),
      eFactory = (v1, v2) => new Edge(v1, v2)
    } = options;

    const data = {};
    data.vNum = w * h;
    data.eNum = 2*w*h;

    data.connect = [];

    data.vFactory = vFactory;
    data.eFactory = eFactory;

    for(let index = 0; index < w * h; index++){
      const x = index % w;
      const y = Math.floor(index / w);
      let connectedData = [];
      connectedData.push(x + ((y+h-1)%h)*w);
      connectedData.push(x + ((y+1)%h)*w);
      connectedData.push(((x+1)%w) + y*w);
      connectedData.push(((x+w-1)%w) + y*w);
      data.connect.push(connectedData);
    }
    return data;
  }

  // StandardGridMazeの上部構造を用意する。具体的には、辺と面。
  function createStandardGridMazeStructure(graph, params = {}){
    const {vertices, edges} = graph;
    const {w, h} = params;
    const vv = [];
    for(let y=0; y<2*h; y++){
      const vvv = [];
      for(let x=0; x<2*w; x++){
        vvv.push({x:x, y:y, exist:false});
      }
      vv.push(vvv);
    }
    const ee = []; // 辺の集合の元
    const ff = []; // 面の集合の元
    // 各verticeに対して四隅を取得して、辺のない方向に壁を作る
    // 各edgeに対して四隅を取得して、頂点のない方向に壁を作る
    for(const v of vertices){
      const p = v.getPosition();
      const ld = vv[2*p.y][2*p.x];
      const rd = vv[2*p.y][2*p.x+1];
      const lu = vv[2*p.y+1][2*p.x];
      const ru = vv[2*p.y+1][2*p.x+1];
      ld.exist = true;
      rd.exist = true;
      lu.exist = true;
      ru.exist = true;
      ff.push([lu, ld, rd], [lu, rd, ru]);
      const flags = {u:true, d:true, r:true, l:true};
      const es = v.getConnectedComponents();
      for(const e of es){
        if (e.state === IS_NOT_PASSABLE){continue;}
        const vOther = e.getOtherVertice(v);
        const q = vOther.getPosition();

        if(p.x === q.x){
          if(q.y > p.y){
            flags.u = false;
          }else{
            flags.d = false;
          }
        }
        if (p.y === q.y){
          if(q.x > p.x){
            flags.r = false;
          }else{
            flags.l = false;
          }
        }
      }

      if(flags.u){ee.push([lu, ru])}
      if(flags.r){ee.push([ru, rd])}
      if(flags.d){ee.push([rd, ld])}
      if(flags.l){ee.push([ld, lu])}
    }
    for(const e of edges){
      if (e.state === IS_NOT_PASSABLE){continue;}
      const vs = e.getConnectedComponents();
      const p = vs[0].getPosition();
      const q = vs[1].getPosition();

      let ldx, ldy, rux, ruy;
      if (p.y === q.y){
        ldx = Math.min(p.x, q.x);
        rux = ldx + 1;
        ldy = p.y;
        ruy = q.y;
      }
      if (p.x === q.x){
        ldy = Math.min(p.y, q.y);
        ruy = ldy + 1;
        ldx = p.x;
        rux = q.x;
      }

      let ld, rd, lu, ru;
      if (ldx === rux){
        ld = vv[2*ldy+1][2*ldx];
        rd = vv[2*ldy+1][2*ldx+1];
        lu = vv[2*ruy][2*ldx];
        ru = vv[2*ruy][2*ldx+1];
      }else{
        ld = vv[2*ldy][2*ldx+1];
        rd = vv[2*ldy][2*rux];
        lu = vv[2*ldy+1][2*ldx+1];
        ru = vv[2*ldy+1][2*rux];
      }

      ff.push([lu, ld, rd], [lu, rd, ru]);

      ld.exist = true;
      rd.exist = true;
      lu.exist = true;
      ru.exist = true;
      if (p.y === q.y){
        ee.push([lu, ru], [rd, ld]);
      }else{
        ee.push([ru, rd], [ld, lu]);
      }
    }
    // exist==trueをさらって順繰りにindexを付けなおす
    // vvはflat()してしまう
    const result = {v:[], e:[], f:[]};

    let eachIndex = 0;

    for(const v of vv.flat()){
      if(!v.exist)continue;
      v.index = eachIndex++;
      result.v.push(v);
    }

    for(const e of ee){
      result.e.push(e[0].index, e[1].index);
    }

    for(const f of ff){
      result.f.push(f[0].index, f[1].index, f[2].index);
    }

    return result;
  }

  // TorusGridMazeの上部構造を定義する。具体的には辺と面。
  function createTorusGridMazeStructure(graph, params = {}){
    const {vertices, edges} = graph;
    const {w, h} = params;
    const vv = [];
    for(let y=0; y<2*h+1; y++){
      const vvv = [];
      for(let x=0; x<2*w+1; x++){
        vvv.push({x:x, y:y, exist:false});
      }
      vv.push(vvv);
    }
    const ee = []; // 辺の集合の元
    const ff = []; // 面の集合の元
    // 各verticeに対して四隅を取得して、辺のない方向に壁を作る
    // 各edgeに対して四隅を取得して、頂点のない方向に壁を作る
    for(const v of vertices){
      const p = v.getPosition();
      const ld = vv[2*p.y][2*p.x];
      const rd = vv[2*p.y][2*p.x+1];
      const lu = vv[2*p.y+1][2*p.x];
      const ru = vv[2*p.y+1][2*p.x+1];
      ld.exist = true;
      rd.exist = true;
      lu.exist = true;
      ru.exist = true;
      ff.push([lu, ld, rd], [lu, rd, ru]);
      const flags = {u:true, d:true, r:true, l:true};
      const es = v.getConnectedComponents();
      for(const e of es){
        if (e.state === IS_NOT_PASSABLE){continue;}
        const vOther = e.getOtherVertice(v);
        const q = vOther.getPosition();
        if(p.x === q.x){
          if(Math.abs(p.y - q.y) === 1){
            if(q.y > p.y){
              flags.u = false;
            }else{
              flags.d = false;
            }
          }else{
            if(q.y === 0){
              flags.u = false;
            }else{
              flags.d = false;
            }
          }
        }
        if (p.y === q.y){
          if(Math.abs(p.x - q.x) === 1){
            if(q.x > p.x){
              flags.r = false;
            }else{
              flags.l = false;
            }
          }else{

            if(q.x === 0){
              flags.r = false;
            }else{
              flags.l = false;
            }
          }
        }
      }
      if(flags.u){ee.push([lu, ru])}
      if(flags.r){ee.push([ru, rd])}
      if(flags.d){ee.push([rd, ld])}
      if(flags.l){ee.push([ld, lu])}
    }
    for(const e of edges){
      if (e.state === IS_NOT_PASSABLE){continue;}
      const vs = e.getConnectedComponents();
      const p = vs[0].getPosition();
      const q = vs[1].getPosition();

      let ldx, ldy, rux, ruy;
      if(Math.abs(p.x - q.x) <= 1){
        ldx = Math.min(p.x, q.x);
        rux = ldx + (p.x===q.x ? 0 : 1);
      }else{
        ldx = Math.max(p.x, q.x);
        rux = ldx + 1;
      }
      if(Math.abs(p.y - q.y) <= 1){
        ldy = Math.min(p.y, q.y);
        ruy = ldy + (p.y===q.y ? 0 : 1);
      }else{
        ldy = Math.max(p.y, q.y);
        ruy = ldy + 1;
      }

      let ld, rd, lu, ru;
      if (ldx === rux){
        ld = vv[2*ldy+1][2*ldx];
        rd = vv[2*ldy+1][2*ldx+1];
        lu = vv[2*ruy][2*ldx];
        ru = vv[2*ruy][2*ldx+1];
      }else{
        ld = vv[2*ldy][2*ldx+1];
        rd = vv[2*ldy][2*rux];
        lu = vv[2*ldy+1][2*ldx+1];
        ru = vv[2*ldy+1][2*rux];
      }

      ff.push([lu, ld, rd], [lu, rd, ru]);

      ld.exist = true;
      rd.exist = true;
      lu.exist = true;
      ru.exist = true;
      if (p.y === q.y){
        ee.push([lu, ru], [rd, ld]);
      }else{
        ee.push([ru, rd], [ld, lu]);
      }
    }
    // exist==trueをさらって順繰りにindexを付けなおす
    // vvはflat()してしまう
    const result = {v:[], e:[], f:[]};

    let eachIndex = 0;

    for(const v of vv.flat()){
      if(!v.exist)continue;
      v.index = eachIndex++;
      result.v.push(v);
    }

    for(const e of ee){
      result.e.push(e[0].index, e[1].index);
    }

    for(const f of ff){
      result.f.push(f[0].index, f[1].index, f[2].index);
    }

    return result;
  }

  const mz = {};

  // Classes
  mz.Component = Component;
  mz.Vertice = Vertice;
  mz.Edge = Edge;
  mz.Graph = Graph;

  // Utility functions
  mz.createStandardGridMaze = createStandardGridMaze;
  mz.createTorusGridMaze = createTorusGridMaze;
  mz.createStandardGridMazeStructure = createStandardGridMazeStructure;
  mz.createTorusGridMazeStructure = createTorusGridMazeStructure;

  mz.IS_PASSABLE = 1;
  mz.IS_NOT_PASSABLE = 2;

  return mz;
})();

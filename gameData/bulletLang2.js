// レーザー廃止して今の仕様に合わせたりなどいろいろ書き直し
// レーザーバグの温床だしあんま面白くないので廃止したい

// ---------------------------------------------------------------------------------------- //
// system constants.

const EMPTY_SLOT = Object.freeze(Object.create(null)); // ダミーオブジェクト

// 衝突判定用フラグ(collisionFlag)
const OFF = 0;  // たとえばボスとかフラグをオフにしたうえで大きいパーティクル作る、とか出来る（予定）
const ENEMY_BULLET = 1;
const PLAYER_BULLET = 2;
const ENEMY = 3;
const PLAYER = 4;

const STAR_FACTOR = 2.618033988749895; // 1 + 2 * cos(36).
// cosとsinの0, 72, 144, 216, 288における値
const COS_PENTA = [1, 0.30901699437494745, -0.8090169943749473, -0.8090169943749473, 0.30901699437494745];
const SIN_PENTA = [0, 0.9510565162951535, 0.5877852522924732, -0.587785252292473, -0.9510565162951536];
const ROOT_THREE_HALF = 0.8660254037844386; // √3/2.

// 以下の定数はnwayやradialにおいて入れ子を作る際に、catch-backでループを戻るときの識別子を作るための変数で、
// 際限なく増えていく。理論上は無限まで。まあそんな増えないだろうと。
// パターンを変えるときに全部0にリセットすべき？でしょうね。何で書いてないの（（
let nwayId = 0;
let radialId = 0;
let lineId = 0;  // catchの度に増やしていく

// ここから下にbulletLanguage関連を移植する
// まあ紛らわしいしbulletLanguage内ではentityを使うようにするか・・
// エイリアスを別に用意するのがいいのかどうかについては知らない（教えて）

// ---------------------------------------------------------------------------------------- //
// createSystem.

function createSystem(w, h, unitCapacity){
  window["AREA_WIDTH"] = w;
  window["AREA_HEIGHT"] = h;
  // デフォルトムーヴ
  window["STAY_MOVE"] = new StayMove();
  window["GO_MOVE"] = new GoMove();
  let _system = new System();
  window["entity"] = _system;
  // デフォルトカラーとシェイプ
  window["SQUARE_MIDDLE"] = entity.drawShape["squareMiddle"];
  window["WEDGE_SMALL"] = entity.drawShape["wedgeSmall"];
  window["PL_BLUE"] = entity.drawColor["plblue"];
  window["BLUE"] = entity.drawColor["blue"];
  // オブジェクトプール
  window["unitPool"] = new ObjectPool(() => { return new Unit(); }, unitCapacity);
  // デフォルトクラス
  //window["IDLE_COMMAND"] = new IdleCommand();
  //window["THROUGH_COMMAND"] = new ThroughCommand();
  return _system;
}

// ---------------------------------------------------------------------------------------- //
// System.
// とりあえずplayerを持たせるだけ

// bulletとcannonはunitという名称で統一する。その上で、
// 描画関連の速さ向上のためにbulletとcannonに便宜上分ける感じ。
// bullet作るのもunit作るのも同じcreateUnitという関数で統一する。

class System{
	constructor(){
    this.unitArray = new CrossReferenceArray();
    this.particleArray = new SimpleCrossReferenceArray();
    this.backgroundColor = color(220, 220, 255); // デフォルト（薄い青）
    this.infoColor = color(0); // デフォルト（情報表示の色、黒）
    this.drawColor = {}; // 色の辞書
    this.registUnitColors();
    this.drawShape = {}; // 形を表現する関数の辞書
    this.registUnitShapes();
    this.drawGroup = {}; // 描画用に用意されたCrossReferenceArrayからなるオブジェクト
    // になるみたいな、それを外部関数でやる。
    // this.drawGroup = {}; hasOwnでたとえばblueがないなってなったらnew CrossReferenceArray()して放り込むとか。
    // で、そこにも登録し、vanishのときにそこからはじく、パターンチェンジの際にもこれらの内容を破棄する。
    // 破棄するときはunitをPoolに戻すのはやってるから単にclearでいい。unitArrayをclearしちゃうとPoolに戻らないので駄目。
    this.patternIndex = 0;
    this._qTree = new LinearQuadTreeSpace(AREA_WIDTH, AREA_HEIGHT, 3);
    this._detector = new CollisionDetector();
    this.seedArray = []; // Systemに持たせました。
    this.seedCapacity = 0;
	}
  addPatternSeed(seed){
    // なんかデフォルトを設定するとかここでできそうな。たとえばnwayのとか。radialとか。
    this.seedArray.push(seed);
    this.seedCapacity++;
  }
  createPlayer(weaponData, flag = PLAYER){
    this.player = new SelfUnit(weaponData, flag);
  }
  getPatternIndex(){
    return this.patternIndex;
  }
  setPattern(newPatternIndex){
    // パターンを作る部分をメソッド化
    if(this.seedArray[newPatternIndex] === undefined){ return; } // 存在しない時。
    let seed = this.seedArray[newPatternIndex];
    // 背景色
    if(seed.hasOwnProperty("bgColor")){
      this.backgroundColor = this.drawColor[seed.bgColor];
    }else{
      this.backgroundColor = color(220, 220, 255); // 背景色のデフォルト
    }
    // 情報表示の色
    if(seed.hasOwnProperty("infoColor")){
      this.infoColor = color(seed.infoColor.r, seed.infoColor.g, seed.infoColor.b);
    }else{
      this.infoColor = color(0); // 情報の文字色のデフォルト
    }
    this.patternIndex = newPatternIndex;
    this.initialize();
    let ptn = parsePatternSeed(seed);
    //console.log(ptn);
    createUnit(ptn);
    // プレイヤーになんかしないの？って話。
  }
  registDrawGroup(unit){
    // colorから名前を引き出す。
    let name = unit.color.name;
    //if(unit.collider.type === "laser"){ name = "laser"; } // laserは別立て描画

    if(!this.drawGroup.hasOwnProperty(name)){
      this.drawGroup[name] = new CrossReferenceArray();
    }
    this.drawGroup[name].add(unit);
  }
	initialize(){
		this.player.initialize();
    this.unitArray.loopReverse("flagOff"); // 先に衝突フラグを消す
    this.unitArray.loopReverse("vanishAction");  // unitすべて戻す
    this.drawGroup = {};
	}
  registColor(name, _color, damageFactor = 1, lifeFactor = 1){
    _color.name = name; // 色の名前を.nameで参照できるようにしておく。
    _color.damageFactor = damageFactor; // ダメージファクター
    _color.lifeFactor = lifeFactor; // ライフファクター
    this.drawColor[name] = _color;
    return this; // こういうのはメソッドチェーンで書くといい
  }
  registShape(name, _shape){
    _shape.name = name; // 名前付けようね。
    this.drawShape[name] = _shape;
    return this; // メソッドチェーン
  }
	update(){
		this.player.update();
    this.unitArray.loop("update");
    this.particleArray.loopReverse("update");
    // 処理をこっちに移植する
    this.collisionCheck();
    this.execute();
    this.eject();
	}
  collisionCheck(){
    //return;
    // やることは簡単。_qTreeをクリアして、actor放り込んで、hitTestするだけ。
    this._qTree.clear();
    this._qTree.addActor(this.player);
    for(let i = 0; i < this.unitArray.length; i++){
      const u = this.unitArray[i];
      if(!u.collider.inFrame()){ continue; } // inFrame「でない」ならば考慮しない
      if(u.vanish){ continue; } // vanish「である」ならば考慮しない
      if(u.hide){ continue; } // hide状態なら考慮しない
      this._qTree.addActor(u);
    }
    this._hitTest();
  }
  _hitTest(currentIndex = 0, objList = []){
    // 衝突判定のメインコード。これと、このあとセルごとの下位関数、更にvalidationを追加して一応Systemは完成とする。
  	const currentCell = this._qTree.data[currentIndex];

    // 現在のセルの中と、衝突オブジェクトリストとで
    // 当たり判定を取る。
    this._hitTestInCell(currentCell, objList);

    // 次に下位セルを持つか調べる。
    // 下位セルは最大4個なので、i=0から3の決め打ちで良い。
    let hasChildren = false;
    for(let i = 0; i < 4; i++) {
      const nextIndex = currentIndex * 4 + 1 + i;

      // 下位セルがあったら、
      const hasChildCell = (nextIndex < this._qTree.data.length) && (this._qTree.data[nextIndex] !== null);
      hasChildren = hasChildren || hasChildCell;
      if(hasChildCell) {
        // 衝突オブジェクトリストにpushして、
        objList.push(...currentCell);
        // 下位セルで当たり判定を取る。再帰。
        this._hitTest(nextIndex, objList);
      }
    }
    // 終わったら追加したオブジェクトをpopする。
    if(hasChildren) {
      const popNum = currentCell.length;
      for(let i = 0; i < popNum; i++) {
        objList.pop();
      }
    }
  }
  _hitTestInCell(cell, objList) {
    // セルの中。総当たり。
    const length = cell.length;
    const cellColliderCahce = new Array(length); // globalColliderのためのキャッシュ。
    if(length > 0){ cellColliderCahce[0] = cell[0].collider; }

    for(let i = 0; i < length - 1; i++){
      const obj1 = cell[i];
      const collider1  = cellColliderCahce[i]; // キャッシュから取ってくる。
      for(let j = i + 1; j < length; j++){
        const obj2 = cell[j];

        // キャッシュから取ってくる。
        // ループ初回は直接取得してキャッシュに入れる。
        let collider2;
        if(i === 0) {
          collider2 = obj2.collider;
          cellColliderCahce[j] = collider2;
        }else{
          collider2 = cellColliderCahce[j];
        }
        // Cahceへの代入までスルーしちゃうとまずいみたい
        // ここでobj1, obj2のcollisionFlagでバリデーションかけてfalseならcontinue.
        if(!this.validation(obj1.collisionFlag, obj2.collisionFlag)){ continue; }
        const hit = this._detector.detectCollision(collider1, collider2);

        if(hit) {
          // 両方ともvanishがfalseならば判定する。
          if(!obj1.vanish && !obj2.vanish){
            obj1.hit(obj2);
            obj2.hit(obj1);
          }
        }
      }
    }

    // 衝突オブジェクトリストと。
    const objLength = objList.length;
    const cellLength = cell.length;

    // これはもう最初に一通りobjListとcellをさらってplayerもenemyもいなければそのままスルー・・
    for(let i = 0; i < objLength; i++) {
      const obj = objList[i];
      const collider1 = obj.collider; // 直接取得する。
      for(let j = 0; j < cellLength; j++) {
        const cellObj = cell[j];

        // objとcellobjの性質からバリデーションかけてfalseならcontinue.
        if(!this.validation(obj.collisionFlag, cellObj.collisionFlag)){ continue; }

        const collider2 = cellColliderCahce[j]; // キャッシュから取ってくる。
        const hit = this._detector.detectCollision(collider1, collider2);

        if(hit) {
          if(!obj.vanish && !cellObj.vanish){
            obj.hit(cellObj);
            cellObj.hit(obj);
          }
        }
      }
    }
  }
  validation(flag1, flag2){
		// ENEMYとPLAYER_BULLET, ENEMY_BULLETとPLAYERのときのみtrueを返す。
		if(flag1 === ENEMY_BULLET && flag2 === PLAYER){ return true; }
		if(flag1 === PLAYER && flag2 === ENEMY_BULLET){ return true; }
		if(flag1 === ENEMY && flag2 === PLAYER_BULLET){ return true; }
		if(flag1 === PLAYER_BULLET && flag2 === ENEMY){ return true; }
		return false;
	}
  execute(){
    this.player.execute();
    this.unitArray.loop("execute");
  }
  eject(){
    this.unitArray.loopReverse("eject");
    this.particleArray.loopReverse("eject");
  }
	draw(){
    background(this.backgroundColor); // こっちで背景色設定
		this.player.draw();
    Object.keys(this.drawGroup).forEach((name) => {
      //if(name !== "laser"){ fill(this.drawColor[name]); }
      fill(this.drawColor[name]);
      this.drawGroup[name].loop("draw"); // 色別に描画(laserは別立て)
    })
    // particleの描画(noStroke()を忘れないこと)
    noFill();
    strokeWeight(2.0);
    this.particleArray.loop("draw");
    noStroke();
	}
  getCapacity(){
    return this.unitArray.length;
  }
  registUnitColors(){
    // 第3引数：damageFactor, 第4引数：lifeFactor. バランス調整が課題。
    this.registColor("black", color(0), 1, 50)
        .registColor("white", color(255), 20, 1)
        .registColor("blue", color(63, 72, 204), 1, 1)
        .registColor("dkblue", color(35, 43, 131), 1, 1)
        .registColor("skblue", color(0, 128, 255), 1, 1)
        .registColor("dkskblue", color(0, 107, 153),1, 1)
        .registColor("plskblue", color(159, 226, 255), 1, 1)
        .registColor("plblue", color(125, 133, 221), 1, 1)
        .registColor("red", color(237, 28, 36), 1, 1)
        .registColor("plred", color(247, 153, 157), 1, 1)
        .registColor("dkred", color(146, 12, 18), 3, 3)
        .registColor("yellow", color(255, 242, 0), 1, 1)
        .registColor("dkyellow", color(142, 135, 0), 1, 1)
        .registColor("dkgreen", color(17, 91, 39), 2, 3)
        .registColor("green", color(34, 177, 76), 1, 1)
        .registColor("plgreen", color(108, 227, 145), 1, 1)
        .registColor("brown", color(128, 64, 0), 1, 1)
        .registColor("plbrown", color(215, 179, 159), 1, 1)
        .registColor("dkbrown", color(103, 65, 44), 2, 3)
        .registColor("purple", color(163, 73, 164), 1, 1)
        .registColor("dkpurple", color(95, 41, 95), 1, 1)
        .registColor("plorange", color(255, 191, 149), 1, 1)
        .registColor("orange", color(255, 127, 39), 1, 1)
        .registColor("dkorange", color(180, 70, 0), 2, 2)
        .registColor("gold", color(128, 128, 0), 1, 1)
        .registColor("dkgrey", color(64), 1, 1)
        .registColor("plgrey", color(200), 1, 1)
        .registColor("grey", color(128), 1, 1)
        .registColor("ltgreen", color(181, 230, 29), 1, 1)
        .registColor("killgreen", color(116, 149, 17), 20, 5) // 濃い黄緑
        .registColor("pink", color(255, 55, 120), 1, 1)
        .registColor("bossBrown", color(65, 40, 27), 5, 30)
        .registColor("bossPink", color(255, 26, 100), 5, 50)
        .registColor("bossBlue", color(57, 86, 125), 5, 50) // ボス用（急遽）。とりあえず500にしといて。
        .registColor("bossRed", color(74, 6, 10), 5, 50); // ボス用のワインレッド（1面のボス）
  }
  registUnitShapes(){
    this.registShape("wedgeSmall", new DrawWedgeShape(6, 3))
        .registShape("wedgeMiddle", new DrawWedgeShape(12, 6))
        .registShape("wedgeLarge", new DrawWedgeShape(18, 9))
        .registShape("wedgeHuge", new DrawWedgeShape(36, 18))
        .registShape("squareSmall", new DrawSquareShape(10))
        .registShape("squareMiddle", new DrawSquareShape(20))
        .registShape("squareLarge", new DrawSquareShape(30))
        .registShape("squareHuge", new DrawSquareShape(60))
        .registShape("starSmall", new DrawStarShape(3))
        .registShape("starMiddle", new DrawStarShape(6))
        .registShape("starLarge", new DrawStarShape(9))
        .registShape("starHuge", new DrawStarShape(18))
        .registShape("diaSmall", new DrawDiaShape(8))
        .registShape("rectSmall", new DrawRectShape(6, 4))
        .registShape("rectMiddle", new DrawRectShape(12, 8))
        .registShape("rectLarge", new DrawRectShape(18, 12))
        .registShape("rectHuge", new DrawRectShape(36, 24))
        .registShape("doubleWedgeSmall", new DrawDoubleWedgeShape(10))
        .registShape("doubleWedgeMiddle", new DrawDoubleWedgeShape(20))
        .registShape("doubleWedgeLarge", new DrawDoubleWedgeShape(30))
        .registShape("doubleWedgeHuge", new DrawDoubleWedgeShape(60))
        .registShape("cherryLarge", new DrawCherryShape(30));
  }
}

// ここをpattern1本にして、shape, colorプロパティを用意して文字列データ入れておいて、
// shapeに従ってunitのshapeプロパティを設定して(クラス)、colorに従って以下略。
// shapeの方はさっそくsetを呼び出してdrawParamに必要なら入れる、これはvanishで初期化してなくす、
function createUnit(pattern){
  let newUnit = unitPool.use();
  newUnit.initialize();
  newUnit.setPattern(pattern);
  entity.unitArray.add(newUnit);
  entity.registDrawGroup(newUnit);
  // 色、形についてはsetPatternで行う感じ。
}

// やられるとき：sizeFactor = 0.7, life = 60, speed = 4, count = 20.
// ダメージ時：sizeFactor = 2.0, life = 30, speed = 4, count = 5.
// targetは発生場所。レーザーの場合はくらった相手の場所に発生させる。
// レーザーダメージ時：sizeFactor = 2.0, life = 15, speed = 4, count = 2.
function createParticle(unit, target, sizeFactor, life, speed, count){
  const size = unit.shape.size * sizeFactor;  // やられる時は0.7, ダメージ時は2.0で。
  const _color = unit.color;
  let newParticle = new Particle(target.position.x, target.position.y, size, _color, life, speed, count);
  entity.particleArray.add(newParticle);
}

// ---------------------------------------------------------------------------------------- //
// Player.
// 今は黒い四角形がくるくるしてるだけ。
// パッシブスキルを色付きの回転多角形で表現したいんだけどまだまだ先の話。
// 回転する四角形の色：ショットの色、伸縮する青い楕円：常時HP回復、みたいな。オレンジの六角形でHP表示とか面白そう。

class SelfUnit{
	constructor(weaponData, myCollisionFlag){
    this.isPlayer = true; // プレイヤーかどうか。fireコマンドの分岐に使う。
		this.position = createVector(0, 0);
    this.collisionFlag = myCollisionFlag; // 衝突フラグ（デフォルト：PLAYER）
    this.shotCollisionFlag = PLAYER_BULLET; // ショットはPLAYER_BULLET.
    this.collider = new CircleCollider();
    this.counter = new LoopCounter(); // ループカウンタ用意しました。はい。
    this.ptnArray = [];
    this.ptnIndex = 0; // 現時点でのptnのインデックス(levelを導入する場合には更にlevelを追加して[index][level]...)
    this.size = 20;
    // life関連
    this.maxLife = 50;
    this.life = this.maxLife;
    this.healCount = 0;     // ヒールカウントシステム。キー入力の際に+1され、maxに達するとHPが1増える
    this.maxHealCount = 20; // maxの値
    this.vanish = false;
    this.prepareWeapon(weaponData);
		this.initialize();
	}
  prepareWeapon(weaponData){
    for(let i = 0; i < weaponData.length; i++){
      const myPtn = parsePatternSeed(weaponData[i]);
      this.ptnArray.push(myPtn);
    }
    // shiftKeyで変更。
    // 具体的には各種decorate処理及びactionの差し替え。
    // 追加プロパティ：action, actionIndex, counter, ptnArray, ptnIndex. 廃止プロパティ：weapon, fire, wait.
  }
	initialize(){
    // action関連はsetPattern内で行う。
    this.ptnIndex = 0;
    this.setPattern(this.ptnArray[0]); // ここは実行中にもあれこれやるってことで・・
    // プレイヤーの位置はここで。パターンチェンジで位置はいじらないので。
		this.position.set(AREA_WIDTH * 0.5, AREA_HEIGHT * 0.875);
    // collider関連
    this.collider.update(this.position.x, this.position.y, 5);
    this.rotationAngle = 0;
		this.rotationSpeed = -2;
    // life関連（クラスにした方がいいのかなぁ）
    this.maxLife = 50;
    this.life = this.maxLife;
    this.healCount = 0; // ヒールカウント
    this.maxHealCount = 20; // 20回移動するたびにHPが1回復する
    this.vanish = false;
	}
	setPosition(x, y){
		this.position.set(x, y);
	}
  setPattern(ptn){
    // カウンターの初期化はここでやるべき（initializeとは別にパターンチェンジするので）
    this.counter.initialize();
    // パターンの内容を元にごにょごにょ
    // 位置はいじらないよ！
    const {speed, shotSpeed, shotDirection, shotMove, shotColor, color, shotShape, shotDelay} = ptn;
    this.speed = (speed !== undefined ? ptn.speed : 4);
    this.shotSpeed = (shotSpeed !== undefined ? ptn.shotSpeed : 8);
    this.shotDirection = (shotDirection !== undefined ? ptn.shotDirection : -90);
    // shotMoveにする。behaviorは廃止。
    this.shotMove = (shotMove !== undefined ? ptn.shotMove : GO_MOVE);
    this.shotAction = []; // action内で設定する。
    this.shotColor = (shotColor !== undefined ? ptn.shotColor : entity.drawColor["black"]);
    this.color = (color !== undefined ? ptn.color : entity.drawColor["black"]);
    this.shotShape = (shotShape !== undefined ? ptn.shotShape : entity.drawShape["wedgeSmall"]);
    this.shotDelay = (shotDelay !== undefined ? ptn.shotDelay : 0);
    this.shotDistance = 0; // これがないと発射できないよ
    // actionをセット。
    this.action = ptn.action;
    this.actionIndex = 0;
  }
  shiftPattern(){
    // 1つ進める感じで。とりあえず。level用意するならそこら辺も考慮すべきなんだろうけど・・・
    this.ptnIndex++;
    if(this.ptnIndex === this.ptnArray.length){ this.ptnIndex = 0; }
    this.setPattern(this.ptnArray[this.ptnIndex]);
  }
	update(){
    if(this.vanish){ return; }
		this.rotationAngle += this.rotationSpeed;
    const {x, y} = this.position;
	  if(keyIsDown(LEFT_ARROW)){ this.position.x -= this.speed; }
		else if(keyIsDown(RIGHT_ARROW)){ this.position.x += this.speed; }
		else if(keyIsDown(UP_ARROW)){ this.position.y -= this.speed; }
		else if(keyIsDown(DOWN_ARROW)){ this.position.y += this.speed; }
    this.inFrame();
    const {x:newX, y:newY} = this.position;
    // 位置が更新した時だけhealCountを増やす(移動による回復(ポケダン的な))
    if(x !== newX || y !== newY){
      this.healCount++;
      if(this.healCount === this.maxHealCount){
        this.lifeUpdate(1);
        this.healCount = 0;
      }
    }
    this.collider.update(this.position.x, this.position.y); // circle限定なので普通にupdate.
	}
  lifeUpdate(diff){
    this.life += diff;
    if(this.life > this.maxLife){ this.life = this.maxLife; }
    if(this.life > 0){ return; }
    // パーティクル出して。
    const newParticle = new Particle(this.position.x, this.position.y, 20, this.color);
    entity.particleArray.add(newParticle);
    this.life = 0;
    this.vanish = true;
  }
  hit(unit){
    //console.log("player hit!");
    // unitからダメージ量を計算してhitPointをupdateして0以下になるようなら消滅する（vanish必要）。
    // unitと違って単にエフェクト出して描画されなくなるだけにする。
    this.lifeUpdate(-unit.damage);
  }
  execute(){
    if(this.vanish){ return; }
    // アクションの実行（処理が終了しているときは何もしない）（vanish待ちのときも何もしない）
    if(this.action.length > 0 && this.actionIndex < this.action.length){
      let debug = 0; // デバッグモード
      let continueFlag = true;
      while(continueFlag){
        const command = this.action[this.actionIndex];
        continueFlag = execute(this, command); // flagがfalseを返すときに抜ける
        debug++; // デバッグモード
        if(debug > 10000){
          console.log("INFINITE LOOP ERROR!!");
          console.log(command, this.actionIndex);
          noLoop(); break; } // デバッグモード
        // actionの終わりに来たら勝手に抜ける。その後は永久にwaitになる（予定）
        if(this.actionIndex === this.action.length){ break; }
      }
    }
  }
	inFrame(){
    // 当たり判定を考慮して5のマージンを設ける。
		this.position.x = constrain(this.position.x, 5, AREA_WIDTH - 5);
		this.position.y = constrain(this.position.y, 5, AREA_HEIGHT - 5);
	}
	draw(){
    if(this.vanish){ return; }
		const {x, y} = this.position;
		const c = cos(this.rotationAngle) * this.size;
		const s = sin(this.rotationAngle) * this.size;
		//stroke(this.bodyColor);
    stroke(this.color);
		noFill();
		strokeWeight(2);
		quad(x + c, y + s, x - s, y + c, x - c, y - s, x + s, y - c);
    noStroke();
    fill(this.color);
    ellipse(x, y, 10, 10); // 直径10. 半径は5. ここが当たり判定。
    // ライフゲージ。
    const l = this.life * this.size * 2 / this.maxLife;
    rect(this.position.x - l / 2, this.position.y + this.size * 1.5, l, 5);
	}
}

// ---------------------------------------------------------------------------------------- //
// Unit.
// BulletとCannonの挙動をまとめる試み

class Unit{
  constructor(){
    this.isPlayer = false; // プレイヤーではない。
    this.position = createVector();
    this.previousPosition = createVector(); // 前フレームでの位置
    this.velocity = createVector();
    this.counter = new LoopCounter(); // クラス化. loopの制御はこれ以降このコンポジットに一任する。
    this.collider = new CircleCollider(); // 最初に1回だけ作って使いまわす。種類が変わるときだけいじる。基本update.
    this.initialize();
  }
  initialize(){
    // vanishの際に呼び出される感じ
    // 動きに関する固有のプロパティ
    this.position.set(0, 0);
    this.previousPosition.set(0, 0);
    this.velocity.set(0, 0);
    this.speed = 0; // 1.
    this.direction = 0; // 2.
    this.delay = 0; // 3.
    this.move = GO_MOVE; // デフォはGO. 4.
    this.action = []; // 各々の行動はcommandと呼ばれる（今までセグメントと呼んでいたもの） 5.
    this.actionIndex = 0; // 処理中のcommandのインデックス

    this.counter.initialize();

    // 親の情報（bearingや親がやられたときの発動など用途様々）
    this.parent = undefined; // 自分を生み出したunitに関する情報。ノードでなければ何かしら設定される。
    // bulletを生成する際に使うプロパティ
    this.shotSpeed = 0; // 6.
    this.shotDirection = 0; // 7.
    this.shotAim = 0; // 11.
    this.shotDelay = 0;
    this.shotDistance = 0;  // ショットの初期位置（デフォは0,つまりunitの位置）
    this.shotMove = GO_MOVE; // デフォはGO.
    this.shotAction = [];
    this.shotCollisionFlag = ENEMY_BULLET; // 基本的にはショットのフラグは敵弾丸。いじるとき、いじる。
    // 色、形. デフォルトはこんな感じ。
    this.shape = SQUARE_MIDDLE; // これ使ってdrawするからね。描画用クラス。 // 8.
    this.color = PL_BLUE; // 9.
    this.shotShape = WEDGE_SMALL;
    this.shotColor = BLUE;
    this.drawParam = {}; // 描画用付加データは毎回初期化する
    // その他の挙動を制御する固有のプロパティ
    this.vanish = false; // trueなら、消す。
    this.hide = false; // 隠したいとき // appearでも作る？disappearとか。それも面白そうね。ステルス？・・・
    // 衝突判定関連
    this.collisionFlag = ENEMY_BULLET; // default. ENEMY, PLAYER_BULLETの場合もある。 // 10.
    // colliderがcircleでなくなってる場合は新たにCircleColliderを生成して当てはめる。
    if(this.collider.type !== "circle"){ this.collider = new CircleCollider(); }
    else{ /* Check(必要なら) */ this.collider.update(0, 0, 0); }
    // bindプロパティがtrueの場合、parentがvanishしたらactionをしないでvanishして切り上げる
    this.bind = false;
  }
  setPosition(x, y){
    this.position.set(x, y);
  }
  setPreviousPosition(){
    // 前フレームでの位置を記録しておく
    const {x, y} = this.position;
    this.previousPosition.set(x, y);
  }
  setVelocity(speed, direction){
    this.velocity.set(speed * cos(direction), speed * sin(direction));
  }
  velocityUpdate(){
    this.velocity.set(this.speed * cos(this.direction), this.speed * sin(this.direction));
  }
  setPattern(ptn){
    const {x, y} = ptn;
    // この時点でもうx, yはキャンバス内のどこかだしspeedとかその辺もちゃんとした数だし(getNumber通し済み)
    this.position.set(x, y);
    const moveProperties = ["speed", "direction", "delay", "shotSpeed", "shotDirection"];
    moveProperties.forEach((propName) => {
      if(ptn[propName] !== undefined){ this[propName] = ptn[propName]; } // 確定は済んでる
    })
    this.velocityUpdate(); // 速度が決まる場合を考慮する

    this.shotAim = this.shotDirection;

    // ノンデフォルトの場合に変更します（自分と同じものを出す場合は個別に決めてね。）
    if(ptn.color !== undefined){ this.color = ptn.color; }
    if(ptn.shape !== undefined){ this.shape = ptn.shape; }
    if(ptn.move !== undefined){ this.move = ptn.move; }
    if(ptn.collisionFlag !== undefined){ this.collisionFlag = ptn.collisionFlag; } // ENEMY_BULLETでない場合は別途指示
    this.action = ptn.action; // action配列

    // shotCollisionFlagの初期設定。基本的に複製。
    if(this.collisionFlag === PLAYER_BULLET){ this.shotCollisionFlag = PLAYER_BULLET; }
    if(this.collisionFlag === ENEMY_BULLET){ this.shotCollisionFlag = ENEMY_BULLET; }

    // parentの設定(用途様々)
    if(ptn.parent !== undefined){
      this.parent = ptn.parent;
    }
    // parentの情報を使う場合があるのでparentのあとでshapeのsetを実行する
    this.shape.set(this);
    // lifeとdamage(ptn作るときに事前に計算しておいた方がいい、)
    // (でないとたとえば100個作る場合に100回同じ計算する羽目になる。shapeとcolorから出るならここでしなくていいよ。)
    if(this.collisionFlag === ENEMY_BULLET || this.collisionFlag === PLAYER_BULLET){
      this.damage = calcDamage(this.shape, this.color); // shape:基礎ダメージ、color:倍率
    }
    if(this.collisionFlag === ENEMY){
      this.maxLife = calcLife(this.shape, this.color); // shape:基礎ライフ、color:倍率
      this.life = this.maxLife;
    }
  }
  eject(){
    if(this.vanish){ this.vanishAction(); }
  }
  vanishAction(){
    // 複数ある場合っての今回出て来てるので・・うん。うしろから。
    // とにかくね、remove関連は後ろからなのよ・・でないとやっぱバグるのよね。
    for(let i = this.belongingArrayList.length - 1; i >= 0; i--){
      this.belongingArrayList[i].remove(this);
    }
    if(this.belongingArrayList.length > 0){ console.log("REMOVE ERROR!"); noLoop(); } // 排除ミス
    // ENEMYが消えたときにパーティクルを出力する。hide状態なら出力しない。
    if(this.collisionFlag === ENEMY && this.hide === false){
      createParticle(this, this, 0.7, 60, 4, 20);
    }

    unitPool.recycle(this); // 名称をunitPoolに変更
  }
  flagOff(){
    // パーティクルが出ないよう、消滅前にフラグを消すことがある。(画面外で消えるときやパターン変更時)
    this.collisionFlag = OFF;
  }
  update(){
    // vanishのときはスルー
    if(this.vanish){ return; }
    // delay処理（カウントはexecuteの方で減らす・・分離されてしまっているので。）
    if(this.delay > 0){ return; }
    // previousPositionをセット
    this.setPreviousPosition();
    // moveとframeOutCheck.
    this.move.execute(this);
    this.frameOutCheck();
    // ColliderのUpdate(typeによって分けるけどとりあえずcircleだからね・・)
    if(this.collider.type == "circle"){
      // サークル
      this.collider.update(this.position.x, this.position.y);
    }
    // レーザー廃止
  }
  frameOutCheck(){
    const {x, y} = this.position;
    if(x < -AREA_WIDTH * 0.2 || x > AREA_WIDTH * 1.2 || y < -AREA_HEIGHT * 0.2 || y > AREA_HEIGHT * 1.2){
      this.flagOff(); // これにより外側で消えたときにパーティクルが出現するのを防ぐ
      this.vanish = true;
    }
  }
  lifeUpdate(diff){
    this.life += diff;
    if(this.life > this.maxLife){ this.life = this.maxLife; }
    if(this.life > 0){ return; }
    this.life = 0;
    this.vanish = true;
  }
  hit(unit){
    const flag = this.collisionFlag;
    if(flag === ENEMY_BULLET || flag === PLAYER_BULLET){
      if(this.collider.type === "circle"){
        // サークル
        createParticle(this, this, 2.0, 30, 4, 5);
      }else{
        // レーザーはスリップなので小さくする
        createParticle(this, unit, 2.0, 15, 4, 2);
      }
      if(this.collider.type === "circle"){ this.vanish = true; } // サークルなら衝突で消える
      return;
    }else if(flag === ENEMY || flag === PLAYER){
      this.lifeUpdate(-unit.damage);
      return;
    }
  }
  execute(){
    // vanishのときはスルー
    if(this.vanish){ return; }
    // delay処理. カウントはこっちで減らす。
    if(this.delay > 0){ this.delay--; return; }
    if(this.bind){
      // bindの場合、親が死んだら死ぬ。
      if(this.parent.vanish){ this.vanish = true; return; }
    }
    // 以下の部分をexecuteとして切り離す
    // アクションの実行（処理が終了しているときは何もしない）（vanish待ちのときも何もしない）
    if(this.action.length > 0 && this.actionIndex < this.action.length){
      let debug = 0; // デバッグモード
      let continueFlag = true;
      while(continueFlag){
        const command = this.action[this.actionIndex];
        continueFlag = execute(this, command); // flagがfalseを返すときに抜ける
        debug++; // デバッグモード
        if(debug > 10000){
          console.log("INFINITE LOOP ERROR!!");
          console.log(command, this.actionIndex);
          noLoop(); break; } // デバッグモード
        // actionの終わりに来たら勝手に抜ける。その後は永久にwaitになる（予定）
        if(this.actionIndex === this.action.length){ break; }
      }
    }
  }
  draw(){
    if(this.hide || this.vanish){ return; } // hide === trueのとき描画しない
    //this.drawModule.draw(this);
    this.shape.draw(this);
    if(this.collisionFlag === ENEMY){
      // ライフゲージ（割合表示）
      const l = this.life * this.shape.size * 2 / this.maxLife;
      rect(this.position.x - l / 2, this.position.y + this.shape.size * 1.5, l, 5);
    }
  }
}

// ---------------------------------------------------------------------------------------- //
// loopCounter. ループのcommandについて。

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

// ---------------------------------------------------------------------------------------- //
// particle.

class Particle{
	constructor(x, y, size, _color, life = 60, speed = 4, count = 20){
    this.color = {r:red(_color), g:green(_color), b:blue(_color)};
		this.center = {x:x, y:y};
		this.size = size;
		// this.particleSet = []; // 使ってない・・・・！！！
		this.life = life;
		this.speed = speed;
		this.count = count + random(-5, 5);
		this.rotationAngle = 0;
		this.rotationSpeed = 4;
		this.moveSet = [];
		this.prepareMoveSet();
		this.alive = true;
	}
	prepareMoveSet(){
		for(let i = 0; i < this.count; i++){
			this.moveSet.push({x:0, y:0, speed:this.speed + random(-2, 2), direction:random(360)});
		}
	}
	update(){
		if(!this.alive){ return; }
		this.moveSet.forEach((z) => {
			z.x += z.speed * cos(z.direction);
			z.y += z.speed * sin(z.direction);
			z.speed *= 0.9;
		})
		this.rotationAngle += this.rotationSpeed;
		this.life--;
		if(this.life === 0){ this.alive = false; }
	}
	draw(){
		if(!this.alive){ return; }
		stroke(this.color.r, this.color.g, this.color.b, this.life * 4);
		const c = cos(this.rotationAngle) * this.size;
		const s = sin(this.rotationAngle) * this.size;
		this.moveSet.forEach((z) => {
			const cx = this.center.x + z.x;
			const cy = this.center.y + z.y;
      quad(cx + c, cy + s, cx - s, cy + c, cx - c, cy - s, cx + s, cy - c);
		})
	}
  eject(){
    if(!this.alive){ this.vanishAction(); }
  }
  vanishAction(){
    this.belongingArray.remove(this);
  }
}

// ---------------------------------------------------------------------------------------- //
// drawFunction. bullet, cannon用の描画関数.
// もっと形増やしたい。剣とか槍とか手裏剣とか。3つ4つの三角形や四角形がくるくるしてるのとか面白いかも。
// で、色とは別にすれば描画の負担が減るばかりかさらにバリエーションが増えて一石二鳥。
// サイズはsmall, middle, large, hugeの4種類。

// colliderはDrawShapeをセットするときに初期設定する感じ。

class DrawShape{
  constructor(){
    this.colliderType = "";
  }
  set(unit){ /* drawParamに描画用のプロパティを準備 */}
  draw(unit){ /* 形の描画関数 */ }
}

// drawWedge
// 三角形。(h, b) = (6, 3), (12, 6), (18, 9), (36, 18).
// 三角形の高さの中心に(x, y)で, 頂点と底辺に向かってh, 底辺から垂直にb.
// 当たり判定はsize=(h+b)/2半径の円。戻した。こっちのがくさびっぽいから。
class DrawWedgeShape extends DrawShape{
  constructor(h, b){
    super();
    this.colliderType = "circle";
    this.h = h; // 6
    this.b = b; // 3
    this.size = (h + b) / 2;
    this.damage = this.size / 4.5; // 基礎ダメージ。1, 2, 3, 6.
  }
  set(unit){
    // colliderInitialize.
    unit.collider.update(unit.position.x, unit.position.y, this.size);
    return;
  }
  draw(unit){
    const {x, y} = unit.position;
    const direction = unit.direction;
    const dx = cos(direction);
    const dy = sin(direction);
    triangle(x + this.h * dx,          y + this.h * dy,
             x - this.h * dx + this.b * dy, y - this.h * dy - this.b * dx,
             x - this.h * dx - this.b * dy, y - this.h * dy + this.b * dx);
  }
}

// いわゆるダイヤ型。8, 12, 16, 32.
// 当たり判定はsize半径の・・0.75倍の方がいいかな。そういうのできるんだっけ？(知らねぇよ)
class DrawDiaShape extends DrawShape{
  constructor(size){
    super();
    this.colliderType = "circle";
    this.size = size;
    this.damage = 1; // 基礎ダメージ。サイズで変えたい・・
  }
  set(unit){
    // colliderInitialize.
    unit.collider.update(unit.position.x, unit.position.y, this.size * 0.75);
  }
  draw(unit){
    const {x, y} = unit.position;
    const {direction} = unit;
    const c = cos(direction);
    const s = sin(direction);
    const r = this.size;
    quad(x + r * c, y + r * s, x + 0.5 * r * s, y - 0.5 * r * c,
         x - r * c, y - r * s, x - 0.5 * r * s, y + 0.5 * r * c);
  }
}

// 長方形（指向性のある）
// (6, 4), (12, 8), (18, 12), (36, 24).
// 当たり判定はsizeで・・
// 弾丸にしよかな・・円弧と長方形組み合わせるの。
class DrawRectShape extends DrawShape{
  constructor(h, w){
    super();
    this.colliderType = "circle";
    this.h = h;
    this.w = w;
    this.size = (h + w) / 2;
    this.damage = this.h / 4; // 基礎ダメージ。1.5, 3.0, 4.5, 9.0
  }
  set(unit){
    // colliderInitialize.
    unit.collider.update(unit.position.x, unit.position.y, this.size);
  }
  draw(unit){
    // unit.directionの方向に長い長方形
    const {x, y} = unit.position;
    const {direction} = unit;
    const c = cos(direction);
    const s = sin(direction);
    quad(x + c * this.h + s * this.w, y + s * this.h - c * this.w,
         x + c * this.h - s * this.w, y + s * this.h + c * this.w,
         x - c * this.h - s * this.w, y - s * this.h + c * this.w,
         x - c * this.h + s * this.w, y - s * this.h - c * this.w);
  }
}


// drawSquare.
// 回転する四角形。10, 20, 30, 60.
// 当たり判定はsize半径の円。
// 重なるの嫌だからちょっと変えようかな。白い線入れたい。
class DrawSquareShape extends DrawShape{
  constructor(size){
    super();
    this.colliderType = "circle";
    this.size = size;
    this.life = size / 2; // 基礎ライフ。5, 10, 15, 30
  }
  set(unit){
    // colliderInitialize.
    unit.collider.update(unit.position.x, unit.position.y, this.size);
    unit.drawParam = {rotationAngle:45, rotationSpeed:2};
  }
  draw(unit){
    const {x, y} = unit.position;
    const c = cos(unit.drawParam.rotationAngle) * this.size;
    const s = sin(unit.drawParam.rotationAngle) * this.size;
    quad(x + c, y + s, x - s, y + c, x - c, y - s, x + s, y - c);
    unit.drawParam.rotationAngle += unit.drawParam.rotationSpeed;
  }
}

// drawStar. 回転する星型。
// size:3, 6, 9, 18.
// 三角形と鋭角四角形を組み合わせてさらに加法定理も駆使したらクソ速くなった。すげー。
// 当たり判定はsize半径の円（コアの部分）だけど1.5倍の方がいいかもしれない。
class DrawStarShape extends DrawShape{
  constructor(size){
    super();
    this.colliderType = "circle";
    this.size = size;
    this.life = size * 5; // 基礎ライフ。15, 30, 45, 90.
    this.damage = size;   // 基礎ダメージ。3, 6, 9, 18.
  }
  set(unit){
    // colliderInitialize.
    unit.collider.update(unit.position.x, unit.position.y, this.size * 1.2); // ちょっと大きく
    unit.drawParam = {rotationAngle:0, rotationSpeed:2};
  }
  draw(unit){
    const {x, y} = unit.position;
    const r = this.size;
    const direction = unit.drawParam.rotationAngle;
    let u = [];
  	let v = [];
    // cos(direction)とsin(direction)だけ求めてあと定数使って加法定理で出せばもっと速くなりそう。
    // またはtriangle5つをquad1つとtriangle1つにすることもできるよね。高速化必要。
    const c = cos(direction);
    const s = sin(direction);
  	for(let i = 0; i < 5; i++){
  		u.push([x + (r * STAR_FACTOR) * (c * COS_PENTA[i] - s * SIN_PENTA[i]),
              y + (r * STAR_FACTOR) * (s * COS_PENTA[i] + c * SIN_PENTA[i])]);
  	}
    v.push(...[x - r * c, y - r * s]);
    // u1 u4 v(三角形), u0 u2 v u3(鋭角四角形).
    triangle(u[1][0], u[1][1], u[4][0], u[4][1], v[0], v[1]);
    quad(u[0][0], u[0][1], u[2][0], u[2][1], v[0], v[1], u[3][0], u[3][1]);
    unit.drawParam.rotationAngle += unit.drawParam.rotationSpeed;
  }
}

// 互いに逆向きのくさび型を組み合わせた形。
// 回転する。サイズ：10, 20, 30, 60.
class DrawDoubleWedgeShape extends DrawShape{
  constructor(size){
    super();
    this.colliderType = "circle";
    this.size = size;
    this.life = size; // 基礎ライフ：10, 20, 30, 60.
  }
  set(unit){
    // colliderInitialize.
    unit.collider.update(unit.position.x, unit.position.y, this.size); // 本来の大きさで。
    unit.drawParam = {rotationAngle:0, rotationSpeed:4};
  }
  draw(unit){
    const {x, y} = unit.position;
    const direction = unit.drawParam.rotationAngle
    const c = cos(direction) * this.size;
    const s = sin(direction) * this.size;
    quad(x + c, y + s, x - 0.5 * c + ROOT_THREE_HALF * s, y - 0.5 * s - ROOT_THREE_HALF * c,
             x,     y, x - 0.5 * c - ROOT_THREE_HALF * s, y - 0.5 * s + ROOT_THREE_HALF * c);
    quad(x - c, y - s, x + 0.5 * c + ROOT_THREE_HALF * s, y + 0.5 * s - ROOT_THREE_HALF * c,
             x,     y, x + 0.5 * c - ROOT_THREE_HALF * s, y + 0.5 * s + ROOT_THREE_HALF * c);
    unit.drawParam.rotationAngle += unit.drawParam.rotationSpeed;
  }
}

// DrawCherryShape.
// 桜っぽい感じのやつ。敵専用。1面のボス。typeはcircleでsizeは10, 20, 30, 60で
// 基礎lifeはそれぞれ8, 16, 24, 48（0.8倍）
class DrawCherryShape extends DrawShape{
  constructor(size){
    super();
    this.colliderType = "circle";
    this.size = size;
    this.life = size * 0.8;
  }
  set(unit){
    // colliderInitialize.
    unit.collider.update(unit.position.x, unit.position.y, this.size); // 本来の大きさで。
    unit.drawParam = {rotationAngle:0, rotationSpeed:4};
  }
  draw(unit){
    const {x, y} = unit.position;
    const direction = unit.drawParam.rotationAngle;
    const c = cos(direction) * this.size * 0.75;
    const s = sin(direction) * this.size * 0.75;
    for(let i = 0; i < 5; i++){
      arc(x + c * COS_PENTA[i] - s * SIN_PENTA[i], y + c * SIN_PENTA[i] + s * COS_PENTA[i],
          this.size, this.size, 45 + 72 * i + direction, 315 + 72 * i + direction);
    }
    unit.drawParam.rotationAngle += unit.drawParam.rotationSpeed;
  }
}

// 剣みたいなやつ。
// 先端とunit.positionとの距離を指定してコンストラクトする。剣先からなんか出す場合の参考にする。

// レーザー廃止
// レーザーはparent使おうかな
// size:8, 16, 24, 48.
/*
class DrawLaserShape extends DrawShape{
  constructor(size){
    super();
    this.colliderType = "laser";
    this.size = size;
    this.damage = size * 0.1; // スリップダメージ
  }
  set(unit){
    unit.collider = new LaserCollider();
    unit.collider.update(unit.position.x, unit.position.y,
                         unit.parent.position.x, unit.parent.position.y, this.size);
  }
  draw(unit){
    // 四角形でいいよね。
    // 見た目変えようかな。真ん中に行くほど白っぽい感じに。
    const r = red(unit.color);
    const g = green(unit.color);
    const b = blue(unit.color);
    const {x, y} = unit.position;
    const {x:px, y:py} = unit.parent.position;
    const direction = atan2(y - py, x - px);
    let dx = cos(direction) * this.size;
    let dy = sin(direction) * this.size;
    fill(r, g, b);
    quad(x - dy, y + dx, x + dy, y - dx, px + dy, py - dx, px - dy, py + dx);
    fill(85 + r * 2 / 3, 85 + g * 2 / 3, 85 + b * 2 / 3);
    dx *= 0.66; dy *= 0.66;
    quad(x - dy, y + dx, x + dy, y - dx, px + dy, py - dx, px - dy, py + dx);
    fill(170 + r / 3, 170 + g / 3, 170 + b / 3);
    dx *= 0.5; dy *= 0.5;
    quad(x - dy, y + dx, x + dy, y - dx, px + dy, py - dx, px - dy, py + dx);
    fill(255);
    dx *= 0.33; dy *= 0.33;
    quad(x - dy, y + dx, x + dy, y - dx, px + dy, py - dx, px - dy, py + dx);
  }
}
*/
// ダメージ計算
function calcDamage(_shape, _color){
  return _shape.damage * _color.damageFactor;
}
// ライフ計算
function calcLife(_shape, _color){
  return _shape.life * _color.lifeFactor;
}
// ---------------------------------------------------------------------------------------- //
// ここからしばらく衝突判定関連
// ---------------------------------------------------------------------------------------- //
// quadTree関連。
class LinearQuadTreeSpace {
  constructor(_width, _height, level){
    this._width = _width;
    this._height = _height;
    this.data = [null];
    this._currentLevel = 0;

    // 入力レベルまでdataを伸長する。
    while(this._currentLevel < level){
      this._expand();
    }
  }

  // dataをクリアする。
  clear() {
    this.data.fill(null);
  }

  // 要素をdataに追加する。
  // 必要なのは、要素と、レベルと、レベル内での番号。
  _addNode(node, level, index){
    // オフセットは(4^L - 1)/3で求まる。
    // それにindexを足せば線形四分木上での位置が出る。
    const offset = ((4 ** level) - 1) / 3;
    const linearIndex = offset + index;

    // もしdataの長さが足りないなら拡張する。
    while(this.data.length <= linearIndex){
      this._expandData();
    }

    // セルの初期値はnullとする。
    // しかし上の階層がnullのままだと面倒が発生する。
    // なので要素を追加する前に親やその先祖すべてを
    // 空配列で初期化する。
    let parentCellIndex = linearIndex;
    while(this.data[parentCellIndex] === null){
      this.data[parentCellIndex] = [];

      parentCellIndex = Math.floor((parentCellIndex - 1) / 4);
      if(parentCellIndex >= this.data.length){
        break;
      }
    }

    // セルに要素を追加する。
    const cell = this.data[linearIndex];
    cell.push(node);
  }

  // Actorを線形四分木に追加する。
  // Actorのコリジョンからモートン番号を計算し、
  // 適切なセルに割り当てる。
  addActor(actor){
    const collider = actor.collider;

    // モートン番号の計算。
    const leftTopMorton = this._calc2DMortonNumber(collider.left, collider.top);
    const rightBottomMorton = this._calc2DMortonNumber(collider.right, collider.bottom);

    // 左上も右下も-1（画面外）であるならば、
    // レベル0として扱う。
    // なおこの処理には気をつける必要があり、
    // 画面外に大量のオブジェクトがあるとレベル0に
    // オブジェクトが大量配置され、当たり判定に大幅な処理時間がかかる。
    // 実用の際にはここをうまく書き換えて、あまり負担のかからない
    // 処理に置き換えるといい。
    if(leftTopMorton === -1 && rightBottomMorton === -1){
      this._addNode(actor, 0, 0);
      return;
    }

    // 左上と右下が同じ番号に所属していたら、
    // それはひとつのセルに収まっているということなので、
    // 特に計算もせずそのまま現在のレベルのセルに入れる。
    if(leftTopMorton === rightBottomMorton){
      this._addNode(actor, this._currentLevel, leftTopMorton);
      return;
    }

    // 左上と右下が異なる番号（＝境界をまたいでいる）の場合、
    // 所属するレベルを計算する。
    const level = this._calcLevel(leftTopMorton, rightBottomMorton);

    // そのレベルでの所属する番号を計算する。
    // モートン番号の代表値として大きい方を採用する。
    // これは片方が-1の場合、-1でない方を採用したいため。
    const larger = Math.max(leftTopMorton, rightBottomMorton);
    const cellNumber = this._calcCell(larger, level);

    // 線形四分木に追加する。
    this._addNode(actor, level, cellNumber);
  }
  // addActorsは要らない。個別に放り込む。

  // 線形四分木の長さを伸ばす。
  _expand(){
    const nextLevel = this._currentLevel + 1;
    const length = ((4 ** (nextLevel + 1)) - 1) / 3;

    while(this.data.length < length) {
      this.data.push(null);
    }

    this._currentLevel++;
  }

  // 16bitの数値を1bit飛ばしの32bitにする。
  _separateBit32(n){
    n = (n|(n<<8)) & 0x00ff00ff;
    n = (n|(n<<4)) & 0x0f0f0f0f;
    n = (n|(n<<2)) & 0x33333333;
    return (n|(n<<1)) & 0x55555555;
  }

  // x, y座標からモートン番号を算出する。
  _calc2DMortonNumber(x, y){
    // 空間の外の場合-1を返す。
    if(x < 0 || y < 0){
      return -1;
    }

    if(x > this._width || y > this._height){
      return -1;
    }

    // 空間の中の位置を求める。
    const xCell = Math.floor(x / (this._width / (2 ** this._currentLevel)));
    const yCell = Math.floor(y / (this._height / (2 ** this._currentLevel)));

    // x位置とy位置をそれぞれ1bit飛ばしの数にし、
    // それらをあわせてひとつの数にする。
    // これがモートン番号となる。
    return (this._separateBit32(xCell) | (this._separateBit32(yCell)<<1));
  }

  // オブジェクトの所属レベルを算出する。
  // XORを取った数を2bitずつ右シフトして、
  // 0でない数が捨てられたときのシフト回数を採用する。
  _calcLevel(leftTopMorton, rightBottomMorton){
    const xorMorton = leftTopMorton ^ rightBottomMorton;
    let level = this._currentLevel - 1;
    let attachedLevel = this._currentLevel;

    for(let i = 0; level >= 0; i++){
      const flag = (xorMorton >> (i * 2)) & 0x3;
      if(flag > 0){
        attachedLevel = level;
      }

      level--;
    }

    return attachedLevel;
  }

  // 階層を求めるときにシフトした数だけ右シフトすれば
  // 空間の位置がわかる。
  _calcCell(morton, level){
    const shift = ((this._currentLevel - level) * 2);
    return morton >> shift;
  }
}

// ---------------------------------------------------------------------------------------- //
// collider関連。
// 今回は全部円なので円判定のみ。
// unitの場合は最初に作ったものをinitializeや毎フレームのアップデートで変えていく感じ（余計に作らない）
// 衝突判定のタイミングはactionの直前、behaviorの直後にする。

class Collider{
	constructor(){
		this.type = "";
    this.index = Collider.index++;
	}
}

Collider.index = 0;

// circle.
// 今のinFrameの仕様だと端っこにいるときによけられてしまう、これは大きくなるとおそらく無視できないので、
// レクトと画面との共通を取った方がよさそう。その理屈で行くとプレイヤーが端っこにいるときにダメージ受けないはずだが、
// プレイヤーは毎フレーム放り込んでたので問題が生じなかったのでした。
// たとえば今の場合、敵が体の半分しか出てない時に倒せない。
// leftとtopは0とMAX取る。これらは<AREA_WIDTHかつ<AREA_HEIGHTでないといけない。
// rightとbottomはそれぞれw-1とh-1でMIN取る。これらは>0でないといけない。
class CircleCollider extends Collider{
	constructor(x, y, r){
    super();
		this.type = "circle";
		this.x = x;
		this.y = y;
		this.r = r;
	}
	get left(){ return Math.max(0, this.x - this.r); }
	get right(){ return Math.min(AREA_WIDTH - 1, this.x + this.r); }
	get top(){ return Math.max(0, this.y - this.r); }
	get bottom(){ return Math.min(AREA_HEIGHT - 1, this.y + this.r); }
  inFrame(){
    // trueを返さなければTreeには入れない。
    const flag1 = (this.left < AREA_WIDTH && this.top < AREA_HEIGHT);
    const flag2 = (this.right > 0 && this.bottom > 0);
    return flag1 && flag2;
  }
	update(x, y, r = -1){
		this.x = x;
		this.y = y;
		if(r > 0){ this.r = r; } // rをupdateしたくないときは(x, y)と記述してくださいね！それでスルーされるので！
	}
}

// laser.
// 四角形と交わる線分って割り出すのどうやるんよ・・んー。
// 端点は常に・・横か縦でなければ。
// (x, y)はレーザーの先端のunitのpositionでpx, pyは作った時のparentのpositionになる。
// そこから画面内に収まるような2点の位置を計算してx, y, px, pyの値とする感じ・・で、wも設定。
// inFrameやめようと思ったけど、端点が作るマージンwの長方形との交わりくらいは取ってもいいでしょ。
// left:x-wと0のmax,top:y-wと0のmax,right:x+wとAREA_WIDTH-1のmin,bottom:y+wとAREA_HEIGHT-1のmin.
/*
class LaserCollider extends Collider{
  constructor(x, y, px, py, w){
    super();
    this.type = "laser";
    this.x = x;
    this.y = y;
    this.px = px;
    this.py = py;
    this.w = w; // 幅
    // laserは衝突しても消えないので、フレームごとに衝突したcolliderのindexを覚えておく必要がある。
    // 毎回衝突判定の前に空っぽにして、衝突の度にそれを放り込んで照合し既に入ってたらスルー。
    this.hitIndexList = [];
  }
  get left(){ return Math.max(0, Math.min(this.x - this.w, this.px - this.w)); }
	get right(){ return Math.min(AREA_WIDTH - 1, Math.max(this.x + this.w, this.px + this.w)); }
	get top(){ return Math.max(0, Math.min(this.y - this.w, this.py - this.w)); }
	get bottom(){ return Math.min(AREA_HEIGHT - 1, Math.max(this.y + this.w, this.py + this.w)); }
  inFrame(){
    const flag1 = (this.left < AREA_WIDTH && this.top < AREA_HEIGHT);
    const flag2 = (this.right > 0 && this.bottom > 0);
    return flag1 && flag2;
  }
  update(x, y, px, py, w = -1){
    this.x = x;
    this.y = y;
    this.px = px;
    this.py = py;
    if(w > 0){ this.w = w; }
    this.hitIndexList = []; // 当たったcolliderのindexを放り込む
  }
  registIndex(index){
    this.hitIndexList.push(index);
  }
  hasIndex(index){
    // forEach内でreturnを使っても関数を抜けることは出来ません（重要）
    // ループ処理の中で関数を終えるときは必ずfor文にしましょう！forEachやめろ！
    for(let i = 0; i < this.hitIndexList.length; i++){
      const havingIndex = this.hitIndexList[i];
      if(index === havingIndex){
        return true;
      }
    }
    return false;
  }
}
*/
class CollisionDetector {
  // 当たり判定を検出する。
  detectCollision(collider1, collider2) {
    if(collider1.type == 'circle' && collider2.type == 'circle'){
      return this.detectCircleCollision(collider1, collider2);
    }
    // レーザー廃止
		return false;
  }
  // 円形同士
  detectCircleCollision(circle1, circle2){
    const distance = Math.sqrt((circle1.x - circle2.x) ** 2 + (circle1.y - circle2.y) ** 2);
    const sumOfRadius = circle1.r + circle2.r;
    return (distance < sumOfRadius);
  }
  // レーザー廃止
}

// ---------------------------------------------------------------------------------------- //
// ObjectPool.
// どうやって使うんだっけ・・

class ObjectPool{
	constructor(objectFactory = (() => ({})), initialCapacity = 0){
		this.objPool = [];
		this.nextFreeSlot = null; // 使えるオブジェクトの存在位置を示すインデックス
		this.objectFactory = objectFactory;
		this.grow(initialCapacity);
	}
	use(){
		if(this.nextFreeSlot == null || this.nextFreeSlot == this.objPool.length){
		  this.grow(this.objPool.length || 5); // 末尾にいるときは長さを伸ばす感じ。lengthが未定義の場合はとりあえず5.
		}
		let objToUse = this.objPool[this.nextFreeSlot]; // FreeSlotのところにあるオブジェクトを取得
		this.objPool[this.nextFreeSlot++] = EMPTY_SLOT; // その場所はemptyを置いておく、そしてnextFreeSlotを一つ増やす。
		return objToUse; // オブジェクトをゲットする
	}
	recycle(obj){
		if(this.nextFreeSlot == null || this.nextFreeSlot == -1){
			this.objPool[this.objPool.length] = obj; // 図らずも新しくオブジェクトが出来ちゃった場合は末尾にそれを追加
		}else{
			// 考えづらいけど、this.nextFreeSlotが0のときこれが実行されるとobjPool[-1]にobjが入る。
			// そのあとでrecycleが発動してる間は常に末尾にオブジェクトが増え続けるからFreeSlotは-1のまま。
			// そしてuseが発動した時にその-1にあったオブジェクトが使われてそこにはEMPTY_SLOTが設定される
			this.objPool[--this.nextFreeSlot] = obj;
		}
	}
	grow(count = this.objPool.length){ // 長さをcountにしてcount個のオブジェクトを追加する
		if(count > 0 && this.nextFreeSlot == null){
			this.nextFreeSlot = 0; // 初期状態なら0にする感じ
		}
		if(count > 0){
			let curLen = this.objPool.length; // curLenはcurrent Lengthのこと
			this.objPool.length += Number(count); // countがなんか変でも数にしてくれるからこうしてるみたい？"123"とか。
			// こうするとかってにundefinedで伸ばされるらしい・・長さプロパティだけ増やされる。
			// 基本的にはlengthはpushとか末尾代入（a[length]=obj）で自動的に増えるけどこうして勝手に増やすことも出来るのね。
			for(let i = curLen; i < this.objPool.length; i++){
				// add new obj to pool.
				this.objPool[i] = this.objectFactory();
			}
			return this.objPool.length;
		}
	}
	size(){
		return this.objPool.length;
	}
}

// ---------------------------------------------------------------------------------------- //
// Simple Cross Reference Array.
// 改造する前のやつ。

class SimpleCrossReferenceArray extends Array{
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
  loop(methodName){
		if(this.length === 0){ return; }
    // methodNameには"update"とか"display"が入る。まとめて行う処理。
		for(let i = 0; i < this.length; i++){
			this[i][methodName]();
		}
  }
	loopReverse(methodName){
		if(this.length === 0){ return; }
    // 逆から行う。排除とかこうしないとエラーになる。もうこりごり。
		for(let i = this.length - 1; i >= 0; i--){
			this[i][methodName]();
		}
  }
	clear(){
		this.length = 0;
	}
}

// ---------------------------------------------------------------------------------------- //
// Cross Reference Array.

// 配列クラスを継承して、要素を追加するときに自動的に親への参照が作られるようにしたもの
// 改造して複数の配列に所属できるようにした。
class CrossReferenceArray extends Array{
	constructor(){
    super();
	}
  add(element){
    this.push(element);
    // 複数のCRArrayが存在する場合に備えての仕様変更
    if(!element.hasOwnProperty("belongingArrayList")){
      element.belongingArrayList = [];
    }
    element.belongingArrayList.push(this); // 所属配列への参照
  }
  addMulti(elementArray){
    // 複数の場合
    elementArray.forEach((element) => { this.add(element); })
  }
  remove(element){
    // 先にbelongingArrayListから排除する
    let belongingArrayIndex = element.belongingArrayList.indexOf(this, 0);
    element.belongingArrayList.splice(belongingArrayIndex, 1);
    // elementを配列から排除する
    let index = this.indexOf(element, 0);
    this.splice(index, 1);
  }
  loop(methodName){
		if(this.length === 0){ return; }
    // methodNameには"update"とか"display"が入る。まとめて行う処理。
		for(let i = 0; i < this.length; i++){
			this[i][methodName]();
		}
  }
	loopReverse(methodName){
		if(this.length === 0){ return; }
    // 逆から行う。排除とかこうしないとエラーになる。もうこりごり。
		for(let i = this.length - 1; i >= 0; i--){
			this[i][methodName]();
		}
  }
	clear(){
		this.length = 0;
	}
}

// ---------------------------------------------------------------------------------------- //
// Utility.

// 自機方向の取得
function getPlayerDirection(pos, margin = 0){
  const {x, y} = entity.player.position;
  return atan2(y - pos.y, x - pos.x) + margin * random(-1, 1);
}

// 自機方向の2乗の取得
function getPlayerDistSquare(pos){
  const {x, y} = entity.player.position;
  return pow(pos.x - x, 2) + pow(pos.y - y, 2);
}

// パースの時に関数にしちゃった方がいいかも。あとcase:3は廃止でいいかも。
function getNumber(data){
  // dataが単なる数ならそれを返す。
  // [2, 4]とかなら2から4までのどれかの実数を返す。
  // [2, 8, 0.2]とかなら2以上8未満の0.2刻みの（2, 2.2, 2.4, ...）どれかを返す。
  if(typeof(data) === "number"){ return data; }
  switch(data.length){
		case 2:
		  return random(data[0], data[1]);
		case 3:
		  const a = data[0];
			const b = data[1];
			const step = data[2];
			return a + Math.floor(random((b - a) / step)) * step;
	}
}

// Objectから最初のキーを取り出す
function getTopKey(obj){
  let keyArray = Object.keys(obj);
  if(keyArray.length > 0){ return keyArray[0]; }
  return "";
}

// 0～360の値2つに対して角度としての距離を与える
function directionDist(d1, d2){
  return min(abs(d1 - d2), 360 - abs(d1 - d2));
}

// ---------------------------------------------------------------------------------------- //
// Move. behaviorは廃止。

class StayMove{
  constructor(){}
  execute(unit){ return; }
}

class GoMove{
  constructor(){}
  execute(unit){ unit.position.add(unit.velocity); return; }
}

// 円形移動。parentを中心にbearingのディグリー角速度で回転する。動く場合でも可能。楕円軌道も可能。
class CircularMove{
  constructor(param){
    this.bearing = param.bearing;
    this.radiusDiff = (param.hasOwnProperty("radiusDiff") ? param.radiusDiff : 0);
    this.ratioXY = (param.hasOwnProperty("ratioXY") ? param.ratioXY : 1.0);
  }
  execute(unit){
    const {x, y} = unit.position;
    const {x:px, y:py} = unit.parent.previousPosition;
    const {x:cx, y:cy} = unit.parent.position;
    const dx = x - px;
    const dy = (y - py) / this.ratioXY;
    const r = Math.sqrt(dx * dx + dy * dy);
    const dir = atan2(dy, dx);
    const newX = cx + (r + this.radiusDiff) * cos(dir + this.bearing);
    const newY = cy + (r + this.radiusDiff) * sin(dir + this.bearing) * this.ratioXY;
    unit.direction = atan2(newY - y, newX - x);
    unit.setPosition(newX, newY);
  }
}

// えーと、fall.
class FallMove{
  constructor(param){
    this.gravity = param.gravity;
  }
  execute(unit){
    const {x, y} = unit.position;
    unit.velocity.y += this.gravity;
    unit.position.add(unit.velocity);
    unit.direction = atan2(unit.velocity.y, unit.velocity.x);
    return;
  }
}

// ---------------------------------------------------------------------------------------- //
// createFirePattern.

function executeFire(unit){
  // bulletにセットするパターンを作ります。
  let ptn = {};

  // formation, fitting, nway, radial, lineすべて廃止

  // 位置ずらし
  ptn.x = unit.position.x + cos(unit.shotDirection) * unit.shotDistance;
  ptn.y = unit.position.y + sin(unit.shotDirection) * unit.shotDistance;
  // speed, direction.
  ptn.speed = unit.shotSpeed;
  ptn.direction = unit.shotDirection;
  ptn.shotDirection = unit.shotAim; // ???
  ptn.shotSpeed = ptn.speed;
  // option.
  ptn.delay = unit.shotDelay;
  ptn.move = unit.shotMove;
  // action(無くても[]が入るだけ)
  ptn.action = unit.shotAction;
  // 色、形関連
  ptn.color = unit.shotColor;
  ptn.shape = unit.shotShape;
  // collisionFlag.
  ptn.collisionFlag = unit.shotCollisionFlag;
  // <<---重要--->> parentの設定。createUnitのときに設定される。
  ptn.parent = unit;

  createUnit(ptn); // 形を指定する。基本的にWedge.
}

// ---------------------------------------------------------------------------------------- //
// parse.
// やり直し。ほぼ全部書き換え。
// 簡略形式のpatternSeedってやつをいっちょまえのpatternに翻訳する処理。
// 段階を踏んで実行していく。
// step1: x, y, speed, direction, delay, shotSpeed, shotDirection, shotDelayは、
// 2, 3, [3, 6], [1, 10, 1]みたく設定
// behavior, shotBehaviorの初期設定は略系は["name1", "name2", ...]みたくしてオブジェクトに変換する、
// だから最初にやるのはfireとbehaviorを関数にする、それで、setterのところを完成させる。
// step2: short展開
// step3: action展開
// step4: commandの略系を実行形式に直す
// step5: commandの実行関数を作る（execute(unit, command)
// ↑ここ言葉の乱用でセグメント部分もactionって名前になっちゃってるけど、
// actionの部分部分はcommandって名前で統一しようね。

// ああーそうか、setでくくらないとbehaviorんとこごっちゃになってしまう・・
// だから略形式ではset:{....}, action:{....}, fire, short, behaviorってしないとまずいのね。

// 略系で書かれたパターンはパターンシードと呼ぶことにする。
function parsePatternSeed(seed){
  let ptn = {}; // 返すやつ
  let data = {}; // 補助データ(関数化したfireやbehaviorを入れる)
  // setter部分(behavior以外)
  const {x, y} = seed;
  // x, yは0.4や0.3や[0.1, 0.9]や[0.4, 0.8, 0.05]みたいなやつ。
  // ここでもう数にしてしまおうね。
  // x, yは存在しないこともある（プレイヤーのとか）ので。
  if(x !== undefined){ ptn.x = getNumber(x) * AREA_WIDTH; }
  if(y !== undefined){ ptn.y = getNumber(y) * AREA_HEIGHT; }

  // move関連
  const moveProperties = ["speed", "direction", "delay", "shotSpeed", "shotDirection"]
  moveProperties.forEach((propName) => {
    if(seed[propName] !== undefined){ ptn[propName] = getNumber(seed[propName]); }
  })
  // 色、形関連
  // ここでオブジェクトにしてしまう（色や形はこのタイミングでは登録済み）
  // seed[propName]は文字列（キー）なのでこれを元にオブジェクトを召喚する。
  if(seed.color !== undefined){ ptn.color = entity.drawColor[seed.color]; }
  if(seed.shape !== undefined){ ptn.shape = entity.drawShape[seed.shape]; }

  // fireDef廃止。

  // colliは未指定ならOFFでそうでないならENEMYでOK.
  // たとえばOFFにENEMY放らせたいならあとで指定してね。
  if(seed.collisionFlag === undefined){ ptn.collisionFlag = OFF; }else{ ptn.collisionFlag = ENEMY; }

  // ここでseed.actionのキー配列を取得
  const actionKeys = Object.keys(seed.action);

  // actionの各valueの展開(main, その他, その他, ...)
  if(seed.hasOwnProperty("short")){
    actionKeys.forEach((name) => {
      seed.action[name] = getExpansion(seed.short, seed.action[name], {});
    })
  }

  // まずnway, line, radialがあればなんとかする（増やすかも）
  // actionをキー配列の下から見ていって適宜シード列で置き換える感じ。下からでないと失敗する。
  // それが終わったら、loopとsignal(そのうちjumpやswitchも作りたい・・)に出てくるbackの文字列を
  // どのくらい戻るかの整数で置き換える。というわけでもう-1記法は使わない。
  let preData = {};
  for(let i = actionKeys.length - 1; i >= 0; i--){
    const key = actionKeys[i];
    preData[key] = expandPatternData(preData, seed.action[key]); // nwayやradialをあれする
    preData[key] = setBackNum(preData[key]); // backを定数にする。
  }

  // actionの内容を実行形式にする・・
  // 配列内のactionコマンドに出てくる文字列はすべて後者のものを参照しているので、
  // キー配列で後ろから見ていって・・
  // 得られた翻訳結果は順繰りにdata.actionに放り込んでいくイメージ。
  data.action = {}; // これがないと記法的にアウト
  for(let i = actionKeys.length - 1; i >= 0; i--){
    data.action[actionKeys[i]] = createAction(data, preData[actionKeys[i]]);
  }
  // 配列はもう出てこないのでcreateActionの内容も大幅に書き換えることになる。
  // たとえば2番目のactionの配列を実行形式にするのに3番目以降のactionの実行形式のデータが使えるとかそういう感じ。
  // 最終的にdata.action.mainが求めるactionとなる。
  ptn.action = data.action.main;
  return ptn;
}

function expandPatternData(preData, seedArray){
  // action:"uuu" で preData.uuuを放り込むような場合にpreDataが役に立つイメージ。
  let result = [];
  for(let i = 0; i < seedArray.length; i++){
    const seed = seedArray[i];
    const _type = getTopKey(seed);
    switch(_type){
      case "nway":
        const parsed1 = createNwayArray(seed, preData);
        result.push(...parsed1);
        break;
      case "radial":
        const parsed2 = createRadialArray(seed, preData);
        result.push(...parsed2);
        break;
      case "line":
        const parsed3 = createLineArray(seed, preData);
        result.push(...parsed3);
        break;
      default:
        result.push(seed);
    }
  }
  return result;
}

function createNwayArray(seed, data){
  // count, interval, action:"hoge" ← data.hoge.
  let result = [];
  const {count, interval, action} = seed.nway;
  result.push({shotDirection:["add", -(count - 1) * interval / 2]});
  result.push({catch:("nway" + nwayId)});
  if(action === undefined){
    result.push({fire:""});
  }else if(typeof(action) === "string"){
    result.push(...data[action]);
  }else{
    result.push(...action); // 文字列でない、これはそのまま放り込むケース。action:[{}, {}, ...]とかそういうイメージ。
  }
  result.push({shotDirection:["add", interval]});
  result.push({loop:count, back:("nway" + nwayId)});
  result.push({shotDirection:["add", -(count + 1) * interval / 2]}); // 戻す
  nwayId++;  // id増やしておく。
  return result;
}

function createRadialArray(seed, data){
  // count, action = "hoho" ← data.hoho.
  let result = [];
  const {count, action} = seed.radial;
  result.push({catch:("radial" + radialId)});
  if(action === undefined){
    result.push({fire:""});
  }else if(typeof(action) === "string"){
    result.push(...data[action]);
  }else{
    result.push(...action);
  }
  result.push({shotDirection:["add", 360 / count]}); // 負の数で逆回転
  result.push({loop:count, back:("radial" + radialId)});
  radialId++;
  return result;
}

function createLineArray(seed, data){
  // count, upSpeed, action = "fikk" ← data.fikk.
  let result = [];
  const {count, upSpeed, action} = seed.line;
  result.push({catch:("line" + lineId)});
  if(action === undefined){
    result.push({fire:""});
  }else if(typeof(action) === "string"){
    result.push(...data[action]);
  }else{
    result.push(...action);
  }
  result.push({shotSpeed:["add", upSpeed]});
  result.push({loop:count, back:("line" + lineId)});
  result.push({shotSpeed:["add", upSpeed * (-1) * count]}); // 戻す
  lineId++;
  return result;
}

// 垂直方向にいくつか(distanceの位置を起点として垂直にいくつか)
// function createVerticalArray(){}

// 水平方向にいくつか(distanceの位置を中心に水平でいくつか)
// function createHorizontalArray(){}

function setBackNum(seedArray){
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
    const key = seed.back;
    if(typeof(key) === "number"){
      // backが計算済みならそのまま
      result.push(seed);
      continue;
    }
    let n = 1;
    while(n < seedArray.length){
      const backSeed = seedArray[i - n];
      if(backSeed.hasOwnProperty("catch") && backSeed.catch === key){ break; } // catchプロパティが合致したらOK.
      n++; // これないと無限ループ。
    }
    // seedのback変えちゃうとまずいんでレプリカを作ります。
    let replica = {};
    Object.assign(replica, seed);
    replica.back = n - 1;
    result.push(replica);
  }
  //console.log(result);
  return result;
}

// 展開関数作り直し。
// ここは再帰を使って下位区分までstringを配列に出来るように工夫する必要がある。
// 名前空間・・seed.shortに入れておいて逐次置き換える感じ。
// seed.shortにはショートカット配列が入ってて、それを元にseed.actionの内容を展開して
// 一本の配列を再帰的に構成する流れ。要はstringが出てくるたびにshortから引っ張り出してassignでクローンして
// 放り込んでいくだけ。
// action内のmainやらなんやらすべてに対して適用。

// shortもプロパティにしますね。
// {short:"文字列", option....} たとえば{short:"eee", fire1:"gratony"}とかすると、
// プロパティで"$fire1"とかあったときに, str="$fire1"からstr[0]==='$'でチェック、さらにstr.substr(1)で
// "fire1"になる。これを使って置き換えを行う仕組みですよ。多分ね。
// 新しい引数としてdictを設ける（shortのときだけ{}でなくなる感じ）

// dictを重ねたい？わがままがすぎるな・・
function getExpansion(shortcut, action, dict){
  let actionArray = [];
  for(let i = 0; i < action.length; i++){
    const command = action[i];
    const _type = getTopKey(command);
    if(_type === "short"){
      const commandArray = getExpansion(shortcut, shortcut[command.short], command);
      commandArray.forEach((obj) => {
        // objはオブジェクトなので普通にアサイン
        let copyObj = {};
        Object.assign(copyObj, obj);
        actionArray.push(copyObj);
      })
    }else{
      // shortでない場合は普通に。ここでオブジェクトになんか書いてあるときはそこら辺の処理も行う。
      // dictが{}でないのはcommandがshortを持っててさらにそれ以外を持ってる時。これを使って、
      // 文字列で"$fire1"みたいになってるやつをいじる、つもり・・
      let result = interpretNestedData(command, dict);
      actionArray.push(result);
    }
  }
  return actionArray;
}

// 応用すれば、一定ターン移動するとかそういうのもbackupで表現できそう（waitの派生形）

// やり直し
function createAction(data, targetAction){
  // targetActionの翻訳に出てくるactionのところの文字列はactionのプロパティネームで、
  // そこについては翻訳が終わっているのでそれをそのまま使えるイメージ。dataにはfireとbehaviorの
  // 翻訳関数が入っている。
  let actionArray = [];
  for(let index = 0; index < targetAction.length; index++){
    const command = targetAction[index];
    actionArray.push(interpretCommand(data, command, index));
  }
  return actionArray;
}

// 翻訳。
// 1.セット系
// speed, shotSpeed, direction, shotDirectionについては"set"と"add"... {speed:["set", [3, 7]]}
// {fire:"radial16way7"}とかね。
// 今interpretに書いてある内容を、クラスを渡す形式に書き換える。そんで、今executeって書いてあるところはなくして、
// クラス内のexecuteを実行させるように書き換える（とりあえず過渡として一旦executeは残してそれから無くす流れ。）

// ---------------------------------------------------------------------------------------- //

// これがreturnするのがクラスになればいいのね。
// ここでreturnされるのがクラスになって、executeのところについては、
// コマンドのメソッドのexecuteに設定されてるやつがそのまま実行されるようになればいいのよね。
function interpretCommand(data, command, index){
  let result = {};
  // だからgetTopKeyをもっと活用する必要があるかもね。
  const _type = getTopKey(command); // 最初のキーがそのままtypeになる。
  result.type = _type;
  if(["speed", "direction", "shotSpeed", "shotDirection", "shotDelay", "shotDistance", "shotAim"].includes(_type)){
    result.mode = command[_type][0]; // "set" or "add" or "mirror" or etc...
    result[_type + "Change"] = command[_type][1]; // 3とか[2, 9]とか[1, 10, 1]
    // 長さが3の場合はcountを設定する。この場合、waitの変種となる。
    if(command[_type].length > 2){ result.count = command[_type][2]; }
    // set:count数でその値になる. add:count数でその値だけ足す。
    return result;
  }

  // 色、形、衝突フラグ関連
  if(["shotColor", "shotShape", "collisionFlag", "shotCollisionFlag"].includes(_type)){
    result.style = command[_type]; // 文字列
    return result;
  }

  // 例：{move:"go"} {move:"stay"} {shotMove:"circular", bearing:3}
  if(["move", "shotMove"].includes(_type)){
    switch(command[_type]){
      case "go": result.move = GO_MOVE; break;
      case "stay": result.move = STAY_MOVE; break;
      case "circular":
        result.move = new CircularMove(command); // 余計なもの入ってるけど気にしなくてOK!
        break;
    }
    return result;
  }

  if(_type === "fire"){
    // fireするだけ
    return result;
  }
  // shotAction. 発射する弾丸の挙動を指定する。
  if(_type === "shotAction"){
    result.shotAction = data.action[command.shotAction];
    return result;
  }
  // あとはwait, loop, aim, vanish, triggerなど。triggerは未準備なのでまた今度でいい。手前の3つやってね。
  // backとかjumpとかswitchも面白そう。
  // そのあとexecute作ったらデバッグに移る。
  if(_type === "wait"){
    // {wait:3}のような形。
    result.count = command.wait;
    return result;
  }
  if(_type === "loop"){
    // {loop:10, back:5}のような形。
    result.count = command.loop;
    // たとえば-1なら先頭、のように負の場合はindex+1を加える感じ。
    result.back = (command.back >= 0 ? command.back : command.back + index + 1);
    return result;
  }
  if(_type === "aim"){ result.margin = command.aim; return result; } // 狙う際のマージン
  if(_type === "vanish"){ result.flag = command.vanish; return result; } // true.
  if(_type === "hide"){
    // 隠れる. trueのとき見えなくする。falseで逆。
    //console.log(command.hide);
    result.flag = command.hide; return result;
  }
  if(_type === "bind"){
    // bindをtruefalseにする
    result.flag = command.bind; return result;
  }
  if(_type === "set"){
    // 位置をいじる。{set:{x:100, y:40}}なら強制的に(100, 40)に移動する。
    // 配列を使うとランダムも可能
    result.x = command.set.x; result.y = command.set.y;
    return result;
  }
  if(_type === "deco"){
    // shotプロパティをいじる。{deco:{speed:8, direction:90, color:"grey", shape:"wedgeMiddle"}}とかする。
    const propNames = ["speed", "direction", "color", "shape"];
    propNames.forEach((name) => {
      if(command.deco.hasOwnProperty(name)){
        result[name] = command.deco[name];
      }
    })
    return result;
  }
  if(_type === "signal"){
    // signalプロパティにはmodeが入っててそれにより指示が決まる。
    // 基本的に、modeには「それが為されたら次ね」といった内容が入る（消滅したらとか近付いたらとか）
    // "vanish": parentがvanishしてなければ離脱、vanishしたらカウントを進めて抜けない。
    // "approach": 自機のサイズx2まで近づいたら次へ、とか？
    // "reflect": 壁に接触したら方向変えるやつ。たとえば3回反射で消える、とかはこれで実装できるはず。
    //
    result.mode = command.signal;
    // 付加データがある場合はそれも・・
    if(result.mode === "vanish"){
      // たとえばvanishによって解除時に親の位置に移動するかどうかを定める。デフォはfalse.
      result.follow = (command.hasOwnProperty("follow") ? command.follow : false);
    }
    return result;
    // 自機に近付いたら次へ、みたいな場合は数を指定するかも？
  }
  if(_type === "catch"){
    return result; // {type:"catch"}だけ。
  }
}

// fireのところに変数使ってて、それを翻訳する関数。
// ネストを掘り下げないといけないので若干めんどくさくなってる。
// たぶん、behaviorにも使えるけどそのためにはaddBehaviorとかしてaddやらなんやらをやめないといけないね。

// dataが配列か、stringか、numberか、オブジェクトか。
// ごめんなさい、boolean考慮してませんでした・・Oh no. 直したよ。これでうまくいく。
// なるほど、オブジェクト扱いになってたのか・・どうりで・・・
function interpretNestedData(data, dict){
  if(typeof(data) !== "string" && data.hasOwnProperty("length")){ // 配列かどうかを見ている
    let result = [];
    data.forEach((elem) => {
      result.push(interpretNestedData(elem, dict));
    })
    return result;
  }
  const dataType = typeof(data);
  switch(dataType){
    case "string": // 文字列のケース
      if(data[0] === '$'){
        return dict[data.substr(1)];
      }else{
        return data;
      }
    case "number": // 数字のケース
      return data;
    case "boolean": // 真偽値のケース（考慮するの忘れてたごめんなさい！！）
      return data;
    default: // オブジェクトのケース
      let result = {};
      const keyArray = Object.keys(data);
      keyArray.forEach((key) => {
        result[key] = interpretNestedData(data[key], dict);
      })
      return result;
  }
}

// ---------------------------------------------------------------------------------------- //
// execute.

function execute(unit, command){
  const _type = command.type;
  if(["speed", "direction", "shotSpeed", "shotDirection", "shotDelay", "shotDistance", "shotAim"].includes(_type)){
    // speedとかshotDirectionとかいじる
    // 第2引数（3番目)がある場合。
    // まずループを抜けるかどうかはプロパティの有無で純粋に決まる。プロパティが無ければ抜けないで進む(true)。
    // 次にインデックスを増やすかどうかはプロパティが無ければ増やし、
    // ある場合はアレがtrueを返せば増やす。
    const newParameter = getNumber(command[_type + "Change"]);
    const hasCount = command.hasOwnProperty("count"); // countを持っているかどうか
    // ループを抜けるかどうか. countがある場合はwaitのように毎フレーム抜ける。
    const loopAdvanceFlag = (hasCount ? false : true);
    if(command.mode === "set"){
      if(hasCount){
        const cc = unit.counter.getLoopCount();
        // cc(currentLoopCount)から目標値との割合を計算する感じ.
        unit[_type] = map(cc + 1, cc, command.count, unit[_type], newParameter);
      }else{
        unit[_type] = newParameter; // ターンを消費しないで普通にセットする
      }
    }else if(command.mode === "add"){
      if(hasCount){
        unit[_type] += newParameter / command.count; // 単に割り算の結果を足すだけ。
      }else{
        unit[_type] += newParameter; // ターンを消費しないで普通に足す
      }
    }else if(command.mode === "aim"){
      // direction限定。意味は、わかるよね。
      unit.direction = getPlayerDirection(unit.position, newParameter);
      unit.velocityUpdate();
    }else if(command.mode === "rel"){
      // shotSpeedとshotDirectionで、unit自身のspeed, directionを使いたいときに使う。普通にaddする。
      // たとえば["rel", 40]で自分のdirection+40がshotDirectionに設定される。
      if(_type === "shotSpeed"){ unit[_type] = unit.speed + newParameter; }
      if(_type === "shotDirection"){ unit[_type] = unit.direction + newParameter; }
      if(_type === "shotAim"){ unit[_type] = unit.shotDirection + newParameter; }
    }else if(command.mode === "fromParent"){
      // shotDirection限定。親から自分に向かう方向に対していくつか足してそれを自分のshotDirectionとする。
      // つまり0なら親から自分に向かう方向ってことね。180だと逆。
      const {x:px, y:py} = unit.parent.position;
      if(_type === "shotDirection"){
        unit[_type] = atan2(unit.position.y - py, unit.position.x - px) + newParameter;
      }
    }
    if(["speed", "direction"].includes(_type)){ unit.velocityUpdate(); }
    // インデックスを増やすかどうか（countがあるならカウント進める）
    // countがある場合は処理が終了している時に限り進める感じ。
    const indexAdvanceFlag = (hasCount ? unit.counter.loopCheck(command.count) : true);
    if(indexAdvanceFlag){ unit.actionIndex++; }
    return loopAdvanceFlag; // フラグによる
  }
  // 色、形.
  // styleには文字列が入ってるのでentity経由でオブジェクトを召喚する。
  if(["shotColor", "shotShape"].includes(_type)){
    if(_type === "shotColor"){ unit.shotColor = entity.drawColor[command.style]; }
    else if(_type === "shotShape"){ unit.shotShape = entity.drawShape[command.style]; }
    unit.actionIndex++;
    return true; // ループは抜けない
  }
  // 衝突フラグ、ショットの衝突フラグ
  if(["collisionFlag", "shotCollisionFlag"].includes(_type)){
    unit[_type] = command.style;
    unit.actionIndex++;
    return true; // ループは抜けない
  }

  // たとえば{type:"move", move:GO_MOVE}みたいになってるわけ。
  if(["move", "shotMove"].includes(_type)){
    unit[_type] = command.move; // もう出来てる
    unit.actionIndex++;
    return true;
  }

  if(_type === "fire"){
    // fire忘れてた
    if(unit.isPlayer && !keyIsDown(32)){
      return false; // プレイヤーの場合はスペースキーが押されなければ離脱する。
    }
    executeFire(unit);
    unit.actionIndex++;
    return true; // 発射したら次へ！
  }
  // shotにactionをセットする場合
  // clearを廃止したい
  /*
  if(_type === "shotAction"){
    if(command.mode === "set"){
      unit.shotAction = command.shotAction;
    }else if(command.mode === "clear"){
      unit.shotAction = [];
    }
    unit.actionIndex++;
    return true;
  }
  */
  if(_type === "shotAction"){
    unit.shotAction = command.shotAction;
    unit.actionIndex++;
    return true;
  }
  if(_type === "wait"){
    // loopCounterを1増やす。countと一致した場合だけloopCounterとcurrentのインデックスを同時に増やす。
    // loopCheckは該当するカウントを1増やしてlimitに達したらtrueを返すもの。
    if(unit.counter.loopCheck(command.count)){
      unit.actionIndex++;
    }
    return false; // waitは常にループを抜ける
  }
  if(_type === "loop"){
    if(unit.counter.loopCheck(command.count)){
      unit.actionIndex++;
    }else{
      // バック処理(INFの場合常にこっち)
      unit.counter.loopBack(unit, command.back);
    }
    return true; // ループは抜けない
  }
  if(_type === "aim"){
    // marginの揺れ幅でエイムする。
    unit.shotDirection = getPlayerDirection(unit.position, command.margin);
    unit.velocityUpdate();
    unit.actionIndex++;
    return true; // ループは抜けない
  }
  if(_type === "vanish"){
    // flagを当てはめるだけ。
    unit.vanish = command.flag;
    return false; // ループを抜ける
  }
  if(_type === "hide"){
    // 関数で分けて書きたいね・・
    unit.hide = command.flag;
    unit.actionIndex++;
    return true; // ループは抜けない
  }
  if(_type === "bind"){
    unit.bind = command.flag;
    unit.actionIndex++;
    return true; // ループは抜けない
  }
  if(_type === "set"){
    unit.setPosition(getNumber(command.x), getNumber(command.y));
    unit.actionIndex++;
    return true; // ループは抜けない
  }
  if(_type === "deco"){
    // ショットいろいろ
    if(command.hasOwnProperty("speed")){ unit.shotSpeed = command.speed; }
    if(command.hasOwnProperty("direction")){ unit.shotDirection = command.direction; }
    if(command.hasOwnProperty("color")){ unit.shotColor = entity.drawColor[command.color]; }
    if(command.hasOwnProperty("shape")){ unit.shotShape = entity.drawShape[command.shape]; }
    unit.actionIndex++;
    return true;
  }
  if(_type === "signal"){
    if(command.mode === "vanish"){
      // parentのvanishを参照してfalseならそのまま抜けるがtrueなら次へ進む
      if(unit.parent.vanish){
        unit.actionIndex++;
        // follow===trueなら親の位置に移動する
        if(command.follow){ unit.setPosition(unit.parent.position.x, unit.parent.position.y); }
        return true; // ループは抜けない。すすめ。
      }else{
        return false; // なにもしない
      }
    }else if(command.mode === "approach"){
      // 自機のsize*5に近付いたら挙動を進める
      // 5とか10とかはオプションでなんとかならないかな。close, farみたいに。ひとつくらい、いいでしょ。
      const {x, y} = entity.player.position;
      const size = entity.player.size;
      if(dist(x, y, unit.position.x, unit.position.y) < size * 5){
        unit.actionIndex++;
        return true; // ループは抜けない。すすめ。
      }else{
        return false; // なにもしない
      }
    }else if(command.mode === "reflect"){
      // 壁で反射する
      const {x, y} = unit.position;
      if(x < 0 || x > AREA_WIDTH || y < 0 || y > AREA_HEIGHT){
        reflection(x, y, unit);
        unit.actionIndex++; // やべぇactionIndex増やすの忘れてたわわわ・・・
        return true; // すすめ
      }else{
        return false;
      }
    }else if(command.mode === "ground"){
      // ground:下端に達したら。roof:上端。right:右端、left:左端。
      if(unit.position.y > AREA_HEIGHT){ unit.actionIndex++; return true; }else{ return false; }
    }else if(command.mode === "frameOut"){
      // frameOut:画面外に出たら。
      const {x, y} = unit.position;
      if(y < 0 || y > AREA_HEIGHT || x < 0 || x > AREA_WIDTH){
        unit.actionIndex++; return true;
      }else{
        return false;
      }
    }
  }
  if(_type === "catch"){ unit.actionIndex++; return true; } // いわゆるスルー
}

// 反射
function reflection(x, y, unit){
  if(x < 0 || x > AREA_WIDTH){
    unit.direction = 180 - unit.direction;
    if(x < 0){ unit.setPosition(-x, y); }else{ unit.setPosition(AREA_WIDTH * 2 - x, y); }
  }else if(y < 0 || y > AREA_HEIGHT){
    unit.direction = 360 - unit.direction;
    if(y < 0){ unit.setPosition(x, -y); }else{ unit.setPosition(x, AREA_HEIGHT * 2 - y); }
  }
  unit.velocityUpdate();
}

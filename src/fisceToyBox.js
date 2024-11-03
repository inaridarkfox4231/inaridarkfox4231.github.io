// フィスケのおもちゃ箱
// 最近作った便利ツールを一元化する試み
// あっちもこっちも直すのめんどくさいんだよ！！
/*
ここに入れたいおもちゃを列挙してね。リンク先もよろしく。
まあいちいちコピペするのもめんどくさいからね。

ベジエ解釈関連（テキストデータのコンバート含む）
p5.Geometry関連
rotateByAxisとかgetNDC的なやつ
hsv2rgbとclampの移植
パスのテッセレーション関連
今はまだ取り組んでないけど球面分布のやつとか
交叉関連
今はまだ取り組んでないけどメッシュの平面分割
など、など、...
要するに1月以降取り組んでるあれこれ
もしくは12月のmatcapや鏡面反射、それにshader改変ツール、
あるいは...追加attributeなどそこら辺？かな。
*/

/*
p5依存です
理由はp5が便利だから
それだけ

p5依存性をチェックします
C:非依存
B:やや依存
A:大部分を依存
S:p5が無ければロジック自体が機能しない

Sはさすがに無かったですね
VectorGeometryを作るかな
ベクトルの方が便利な場合もあるでしょう
問題は...

すべてp5wgexに移します
いい加減foxDriveに改名したい
それかもういっそfisceToyBoxに改名するとか
まあいいや
そのうちcanvas生成機能も用意するか。idで指定したタグにキャンバスをぶち込む仕様。
*/

/*
  2024-06-26
  getIntersectionをgetIntersectionsと誤植したせいで
  通らなかった
  ごめんなさい

  createDisjointPathsは出力形式を変えるoptionがあってもいいかもしれない。
  optionを追加しました。{output:"cycle_vertices"}ってやるとサイクルの頂点列がそのまま返ります。

  TessSkyのテッセレーション計算は先にテッセレーションを完了させたうえで
  隣接する島ごとにわけてそれらをislandとみなして分割してるんですよね

  でもTessSkyにはいい思い出が無いので
  あんまやりたくないです。以上。
*/

const fisceToyBox = (function(){
  const fisce = {};

  /*
    parseCmdToText(cmd)
    textのcommandで得られるコマンド列をMQLCZ記法に書き換えるだけ
    具体的には
    {type:"M", x:0, y:0}, {type:"L", x:1, y:0}, {type:"L", x:0, y:1}, {type:"Z"}
    とかいうのを
    M 0 0 L 1 0 L 0 1 Z
    みたいなやつにする
    cmd = font.font.getPath(targetText, 0, 0, textScale).commands;
    ってやるとtargetTextのtextScaleに応じたデータが得られる
    文字列にした後の操作は別の関数による

    p5依存度：C（非依存）
    引数のcmdはfontとopentypeから出力されるのでそもそもp5が絡んでいない
    あれを取得するにはopentypeのcdnとロードしたfont情報が要る（つまりp5が絡んでいない）
  */
  function parseCmdToText(cmd){
    let result = "";
    for(let i=0; i<cmd.length-1; i++){
      const command = cmd[i];
      const {x, y, x1, y1, x2, y2} = command;
      switch(command.type){
        case "M":
          result += "M " + x.toFixed(3) + " " + y.toFixed(3) + " ";
          break;
        case "Q":
          result += "Q " + x1.toFixed(3) + " " + y1.toFixed(3) + " " + x.toFixed(3) + " " + y.toFixed(3) + " ";
          break;
        case "L":
          result += "L " + x.toFixed(3) + " " + y.toFixed(3) + " ";
          break;
        case "C":
          result += "C " + x1.toFixed(3) + " " + y1.toFixed(3) + " " + x2.toFixed(3) + " " + y2.toFixed(3) + " " + x.toFixed(3) + " " + y.toFixed(3) + " ";
          break;
        case "Z":
          result += "Z ";
          break;
      }
    }
    result += "Z";
    return result;
  }

  /*
    parseData(options={})
    options:
      data: 文字列。MLQCZ記法で書かれている。例のツールで出力したやつとかそのまま使える感じ。
      bezierDetail2: Qを解釈する際の分割数。default:8
      bezierDetail3: Cを解釈する際の分割数。default:5
      parseScale: パースの際に何倍化するのであれば必要。default:1
      lineSegmentLength: Lを解釈する際の最小単位。default:1 たとえばscale100でこれが5だと20分割くらいされる
    最終的に得られるのはp5のベクトル列のcontourの配列である。つまり配列の配列なので、
    たとえば単独の場合[somePointArray]みたいになり、[0]しないとアクセスできないので注意する。
    これは柔軟性のためである。配列だったり配列の配列だったりしたらややこしいでしょ？

    p5依存度：B（やや依存）
    createVectorをnew Vec3で書き換えればいい
    createVectorに相当するp5wgexの関数が無いね
    作る？
  */
  function parseData(options = {}){
    const {data="M 0 0", bezierDetail2 = 8, bezierDetail3 = 5, parseScale = 1, lineSegmentLength = 1} = options;
    const cmdData = data.split(" ");
    const result = [];
    let subData = [];
    for(let i=0; i<cmdData.length; i++){
      switch(cmdData[i]){
        case "M":
          if (subData.length>0) result.push(subData.slice());
          subData.length = 0;
          subData.push(createVector(Number(cmdData[i+1]), Number(cmdData[i+2])).mult(parseScale));
          i+=2; break;
        case "L":
          const p = subData[subData.length-1];
          const q = createVector(Number(cmdData[i+1]), Number(cmdData[i+2])).mult(parseScale);
          const lineLength = q.dist(p);
          for(let lengthSum=0; lengthSum<lineLength; lengthSum += lineSegmentLength){
            subData.push(p5.Vector.lerp(p, q, lengthSum/lineLength));
          }
          subData.push(q);
          i+=2; break;
        case "Q":
          const p0 = subData[subData.length-1];
          const a0 = Number(cmdData[i+1])*parseScale;
          const b0 = Number(cmdData[i+2])*parseScale;
          const c0 = Number(cmdData[i+3])*parseScale;
          const d0 = Number(cmdData[i+4])*parseScale;
          for(let k=1; k<=bezierDetail2; k++){
            const t = k/bezierDetail2;
            subData.push(createVector(
              (1-t)*(1-t)*p0.x + 2*t*(1-t)*a0 + t*t*c0,
              (1-t)*(1-t)*p0.y + 2*t*(1-t)*b0 + t*t*d0
            ));
          }
          i+=4; break;
        case "C":
          const p1 = subData[subData.length-1];
          const a1 = Number(cmdData[i+1])*parseScale;
          const b1 = Number(cmdData[i+2])*parseScale;
          const c1 = Number(cmdData[i+3])*parseScale;
          const d1 = Number(cmdData[i+4])*parseScale;
          const e1 = Number(cmdData[i+5])*parseScale;
          const f1 = Number(cmdData[i+6])*parseScale;
          for(let k=1; k<=bezierDetail3; k++){
            const t = k/bezierDetail3;
            subData.push(createVector(
              (1-t)*(1-t)*(1-t)*p1.x + 3*t*(1-t)*(1-t)*a1 + 3*t*t*(1-t)*c1 + t*t*t*e1,
              (1-t)*(1-t)*(1-t)*p1.y + 3*t*(1-t)*(1-t)*b1 + 3*t*t*(1-t)*d1 + t*t*t*f1
            ));
          }
          i+=6; break;
        case "Z":
          // 最初の点を追加するんだけど、subData[0]を直接ぶち込むと
          // 頭とおしりが同じベクトルになってしまうので、
          // copy()を取らないといけないんですね
          // Lでつなぎます。
          const p2 = subData[subData.length-1];
          const q2 = subData[0].copy();
          const lineLength2 = q2.dist(p2);
          for(let lengthSum=0; lengthSum<lineLength2; lengthSum += lineSegmentLength){
            subData.push(p5.Vector.lerp(p2, q2, lengthSum/lineLength2));
          }
          subData.push(q2);
          //result.push(subData.slice());
          break;
      }
    }
    // Mが出てこない場合はパス終了
    result.push(subData.slice());
    return result;
  }

  /*
    margePoints(points, options={})
    points: 点列。p5のベクトル列を想定。
    options:
      threshold:マージする際の閾値。default:1e-6
      closed: 閉じているかどうか。default:false
    点列に対し隣り合う点が近すぎる場合に片方を排除する
    逆走査なので後ろの方がカットされる
    closedの場合はおしりが頭に近い場合にそれが排除される

    p5依存度：B（やや依存）
    distがp5の関数...引数はベクトル列を仮定してる
    ジオメトリーの前段階としてベクトル列に相当する何かが必要かもしれないです
    まあいいか
  */
  function mergePoints(points, options = {}){
    const {threshold = 0.000001, closed = false} = options;

    for(let i = points.length-1; i >= 1; i--){
      const p = points[i];
      const q = points[i-1];
      if (p.dist(q) < threshold){
        //console.log("merge");
        points.splice(i,1);
      }
    }
    if (closed) {
      // 頭に戻る場合はそれも排除する
      if (points[0].dist(points[points.length-1]) < threshold) {
        points.pop();
      }
    }
  }

  /*
    mergePointsAll(contours, options={})
    contours: p5のベクトル列の配列
    options: mergePointsと同じ。同じ内容がすべての点列に適用される。
    なので、closedとそれ以外が混じっているなら個別に対処する必要がある。
    そこは柔軟性を持たせたいところだけどね。めんどくさいわね。optionsとしてoptionsの配列を許せばいけるか？
    ただほとんどの場合は閉路とそれ以外が混じることはほぼ無いからな。

    p5依存度：B（やや依存）
    mergePointsがBなので。
    contoursをどう扱うかという問題だけど、まあnew Vec3()で出来るベクトルの列の列、でいいんじゃないかな。
  */
  function mergePointsAll(contours, options = {}){
    for(let contour of contours) {
      mergePoints(contour, options);
    }
  }

  /*
    evenlySpacing
    points:p5のベクトル列
    options:
      minLength: 最小長さ。これより長い間隔がある場合、点を挿入する
      closed: 閉じている場合は頭も考慮する
    等間隔にする処理
    まあ、ほぼ、ね。
    広い場合は点を挿入する...まあ線形補間だが。
    んでlerpとか使ってなるたけ同じ間隔になるように塩梅する処理
    textDataって割とそこら辺雑だからな
    見た目的にそこまで変化はないけど
    まあそれなりに有用です

    p5依存度：B（やや依存）
    setもlerpもdistも移植済みなので
    Vec3配列が入力である限り特に問題なく移植できるはず
  */
  // 等間隔化にもclosed optionを導入したいな
  function evenlySpacing(points, options = {}){
    const {minLength = 1, closed = false} = options;
    // minLengthより長い長さがある場合に、点を挿入する
    let newPoints = [];
    newPoints.push(points[0]);

    for(let i=1; i<points.length; i++){
      // iとi-1の距離を調べてminより小さければそのままiを入れて終了
      // 大きければ間も含めていくつか点を入れる
      // ここも後ろから入れないとおかしなことになるので注意！！って思ったけど
      // ああそうか、バグの原因それか...このやり方なら問題ないです。
      const d = points[i].dist(points[i-1]);
      if (d < minLength) {
        newPoints.push(points[i]);
      } else {
        const m = Math.floor(d/minLength)+1;
        for(let k=1; k<=m; k++){
          newPoints.push(p5.Vector.lerp(points[i-1], points[i], k/m));
        }
      }
    }

    // 線の長さの総和を求めると同時に長さの列を取得
    let lengthArray = [];
    for(let i=0; i<newPoints.length-1; i++){
      const d = newPoints[i].dist(newPoints[i+1]);
      lengthArray.push(d);
    }

    // minLengthを超えるたびにそれを引く、を繰り返す
    // もしくは？
    // lastPointという概念を用意。最初はnewPoints[0]から始める。
    // localSumが閾値未満であれば新しい点でlastPointをおきかえる
    // 超えた場合はlastPointと新しい点を(localSum-minLength)/distanceでlerpして
    // ??違う、(minLength-(localSum-distance))/distanceか。
    // あるいはlocalSum + distance > minLengthかどうか見るとか。<とか。
    let localSum = 0;
    const result = [newPoints[0]];
    const lastPoint = createVector();
    lastPoint.set(result[0]);
    for(let i=1; i<newPoints.length; i++){
      const distance = newPoints[i].dist(lastPoint);
      if (localSum + distance < minLength) {
        lastPoint.set(newPoints[i]);
        localSum += distance;
      } else {
        // オーバーした場合はlerpで該当する点を求める
        const ratio = (minLength-localSum)/distance;
        const middlePoint = p5.Vector.lerp(lastPoint, newPoints[i], ratio);
        result.push(middlePoint);
        lastPoint.set(middlePoint);
        // localSumを初期化
        localSum = 0;
      }
    }

    // closed caseでOKでした。オプション用意するの忘れてた。バカ。

    // pointsをresultで書き換える
    points.length = 0;
    for(let i=0; i<result.length; i++){
      points.push(result[i]);
    }

    // closedの場合はおしりもチェック...？？
    if (closed) {
      const endPoint = points[points.length-1];
      const beginPoint = points[0];
      const distance = endPoint.dist(beginPoint);
      if (distance > minLength) {
        // たとえば2.1と1の場合は3分割するが1.9と1の場合は2分割する
        const m = floor(distance/minLength) + 1;
        for(let k=1; k<m; k++){
          points.push(p5.Vector.lerp(endPoint, beginPoint, k/m));
        }
      }
    }
  }

  /*
    evenlySpacingAll(contours, options = {})
    contours: p5のベクトル列の配列
    options: 同じ
    つまりすべて同じoptionが適用される
    closedとかも
    これ間違ってましたね...全部minLengthって書いてあった
    まあ
    そういうのを避けるためにライブラリ化してるわけ
    いちいち書き換えるのめんどくさいだろ

    p5依存度：B（やや依存）
    evenlySpacingが以下略
  */
  function evenlySpacingAll(contours, options = {}){
    for(const contour of contours){
      evenlySpacing(contour, options);
    }
  }

  /*
    quadBezierize(points, options={})
    points: p5のベクトル列
    options:
      detail: 分割のディテール。default:4
      closed: 閉路かどうか
    もともとの点列を制御点とし、点列ごとに中点を取り、中点を端点とするクワドベジエで置き換える。
    閉路の場合は端点も考慮される。

    p5依存度：B（やや依存）
    p5の関数で書き換えるだけ
    もういっそベクトル列やcontoursをクラスとして定義しちゃった方が
    話が早いかもしれない
    そうなるとこの手のあれこれはすべてメソッドという形になるわね
    Vec3Array, Contoursでいいのかな。んー。
  */
  function quadBezierize(points, options = {}){
    const {detail = 4, closed = false} = options;
    const subPoints = [];
    for(let i=0; i<points.length-1; i++){
      subPoints.push(p5.Vector.lerp(points[i], points[i+1], 0.5));
    }
    if (closed) {
      subPoints.push(p5.Vector.lerp(points[points.length-1], points[0], 0.5));
    }
    const result = [];
    if (!closed) {
      result.push(points[0]);
      result.push(subPoints[0]);
      for(let k=1; k<subPoints.length; k++){
        const p = subPoints[k-1];
        const q = points[k];
        const r = subPoints[k];
        for(let m=1; m<=detail; m++){
          const t = m/detail;
          result.push(createVector(
            (1-t)*(1-t)*p.x + 2*t*(1-t)*q.x + t*t*r.x,
            (1-t)*(1-t)*p.y + 2*t*(1-t)*q.y + t*t*r.y
          ));
        }
      }
      result.push(points[points.length-1]);
    } else {
      result.push(subPoints[0]);
      for(let k=1; k<=subPoints.length; k++){
        const p = subPoints[k-1];
        const q = points[k%subPoints.length];
        const r = subPoints[k%subPoints.length];
        for(let m=1; m<=detail; m++){
          const t = m/detail;
          if(m===detail&&k===subPoints.length)continue;
          result.push(createVector(
            (1-t)*(1-t)*p.x + 2*t*(1-t)*q.x + t*t*r.x,
            (1-t)*(1-t)*p.y + 2*t*(1-t)*q.y + t*t*r.y
          ));
        }
      }
    }
    points.length = 0;
    for(let i=0; i<result.length; i++) points.push(result[i]);
  }
  /*
    quadBezierizeAll(contours, options={})
    複数版。閉路かどうかは要統一...そのうち変えるかもしれないが。
    文字が丸みを帯びたりするかもしれない

    p5依存度：B（以下略）
  */
  function quadBezierizeAll(contours, options = {}){
    for(const contour of contours){
      quadBezierize(contour, options);
    }
  }

  /*
    getBoundingBoxOfContours(contours)
    contours: 閉路の列
    閉路の列に対してバウンディングボックスを計算するだけ
    textにしか使えないと不便なので。
    これならSVGデータにも使えるし他の用途にも使えるはず

    p5依存度：C（非依存）
    まあcontoursをp5非依存で書けばいいだけ
    クラスを用意すればただのメソッドになる
    Geometryにも適用できる...
    って思ったらあっちはもう関数出来てますね
    本格的にContoursをクラス化する必要性出てきた感ある
  */
  function getBoundingBoxOfContours(contours){

    let _minX = Infinity;
    let _minY = Infinity;
    let _maxX = -Infinity;
    let _maxY = -Infinity;

    for(let contour of contours){
      for(let p of contour){
        _minX = Math.min(p.x, _minX);
        _minY = Math.min(p.y, _minY);
        _maxX = Math.max(p.x, _maxX);
        _maxY = Math.max(p.y, _maxY);
      }
    }
    return {x:_minX, y:_minY, w:_maxX-_minX, h:_maxY-_minY};
  }

  /*
    alignmentContours(contours, options={})
    contours: 閉路の列
    options:
      position: 基準となる座標
      alignV: 横調整。left:position.xが左端  right:position.xが右端  center:position.xが中心（default）
      alignH: 縦調整。top:position.yが上端  bottom:position.yが下端  center:position.yが中心（default）
    SVGでこれをデフォルトにしちゃうのは色々とまずいだろうからあっちではやらない
    というか
    これを提供すればあとでいじれるだろ？だから要らないのさ。
    テキストの場合は位置調整が基本的な要素としてあるからこれが要るってだけの話。

    p5依存性：C（非依存）
    難しいことはしてないのでcontoursが非依存であれば非依存
  */
  function alignmentContours(contours, options = {}){
    const {
      position = {x:0,y:0}, alignV = "center", alignH = "center"
    } = options;

    const tb = getBoundingBoxOfContours(contours);

    const factorW = (alignV === "left" ? 0 : (alignV === "right" ? 1 : 0.5));
    const factorH = (alignH === "top" ? 0 : (alignH === "bottom" ? 1 : 0.5));
    const deltaX = tb.x+ tb.w*factorW - position.x;
    const deltaY = tb.y + tb.h*factorH - position.y;

    for(const contour of contours){
      for(const p of contour){
        p.x -= deltaX;
        p.y -= deltaY;
      }
    }
  }

  /*
    getTextContours(params={})
    テキストのcontoursを出すのがめんどくさいのでメソッド化
    params:
      font: フォント。これが無いと始まらない。必須なのでデフォルトは無いです。
      targetText: 文字列。default:"A"
      textScale: スケール。大きさの目安。 default:320
      position: 位置の目安。p5のベクトルでもよい。 default:{x:0,y:0}
      alignV: 横方向。"left","center","right"に応じてどこにxが来るかを指定する。
      alignH: 縦方向。"top","center","bottom"に応じてどこにyが来るかを指定する。
      bezierDetail2: 2次ベジエのディテールの指定。default:8
      bezierDetail3: 3次ベジエのディテールの指定。default:5
      lineSegmentlengthRatio: Lを解釈する際の長さ指定のスケールに対する比率。default:1/64
      spacingMinLengthRatio: evenlySpacingを適用する際の長さのスケールに対する比率。default:1/40
      mergeThresholdRatio: mergePointsを適用する際の長さのスケールに対する比率。default:1/100
    出力：contoursです。主にcyclesToCyclesにぶち込んで、そこからメッシュ作成などにつなげる形。
    contoursの段階でいじることも可能。いじる必要があればの話だけど。

    p5依存性：B（やや依存）
    fontですが、font.font.getPathの最初のfontがp5.Fontを想定しているんですね
    つまり非自明な依存性
    ここは「.fontがundefinedの場合はfontのまま使う」としたうえでそのfontをopentype経由で取得する
    機構を整えればp5から脱却できる（実験済み）
    あとはp5に依存するかどうかはcontoursの中身次第ですね
  */
  function getTextContours(params = {}){
    const {
      font, targetText = "A", textScale = 320, position = {x:0,y:0},
      alignV = "center", alignH = "center",
      bezierDetail2 = 8, bezierDetail3 = 5, lineSegmentLengthRatio = 1/64,
      spacingMinLengthRatio = 1/40, mergeThresholdRatio = 1/100
    } = params;

    // textやってみる？

    //const tb = font.textBounds(targetText, 0, 0, textScale);

    const cmd = font.font.getPath(targetText, 0, 0, textScale).commands;
    const cmdText = parseCmdToText(cmd);
    const textContours = parseData({
      data:cmdText,
      bezierDetail2:bezierDetail2, bezierDetail3:bezierDetail3,
      lineSegmentLength:lineSegmentLengthRatio*textScale
    });
    /*
    // ここで。
    const factorW = (alignV === "left" ? 0 : (alignV === "right" ? 1 : 0.5));
    const factorH = (alignH === "top" ? 0 : (alignH === "bottom" ? 1 : 0.5));
    const deltaX = tb.x + tb.w*factorW - position.x;
    const deltaY = tb.y + tb.h*factorH - position.y;

    for(let contour of textContours){
      for(let p of contour){
        p.x -= deltaX;
        p.y -= deltaY;
      }
    }
    */

    alignmentContours(textContours, {position, alignV, alignH});
    mergePointsAll(textContours, {closed:true});
    evenlySpacingAll(textContours, {
      minLength:spacingMinLengthRatio*textScale, closed:true
    });
    mergePointsAll(textContours, {
      threshold:mergeThresholdRatio*textScale, closed:true
    });

    return textContours;
  }

  /*
    getTextDrawingData(params={})
    params:
      font: フォント。これが無いと始まらない。必須なのでデフォルトは無いです。
      targetText: 文字列。default:"A"
      textScale: スケール。大きさの目安。 default:320
      position: 位置の目安。p5のベクトルでもよい。 default:{x:0,y:0}
      alignV: 横方向。"left","center","right"に応じてどこにxが来るかを指定する。
      alignH: 縦方向。"top","center","bottom"に応じてどこにyが来るかを指定する。
      bezierDetail2: 2次ベジエのディテールの指定。default:8
      bezierDetail3: 3次ベジエのディテールの指定。default:5
      lineSegmentlengthRatio: Lを解釈する際の長さ指定のスケールに対する比率。default:1/64
      spacingMinLengthRatio: evenlySpacingを適用する際の長さのスケールに対する比率。default:1/40
    マージを除くすべて。基本的にはalignHまでしか要しない。
    出力：
      bd:描画されるテキストのbd.
      dx,dy:描画時のずらし。これだけずらすと正確に描画できる。translateなどを使う。
      path:Path2Dオブジェクト。これをdrawingContext.fill()で描画する。
      たとえばalignV,alignHにleft,topを入れたうえで得られるdx,dyだけずらしてこのパスを描画すれば
      bdの中にそれがすっぽりおさまる。
    textFont()とtextAlign()を用いた描画では正確にアラインメントできないようです。そこで、
    パスデータから逆算して位置をずらすことで厳密な描画を実現しようというわけです。
    もっとも雑でいいならこの関数は不要ということでもあります。

    p5依存性：B（やや依存）
    fontについて同じ処理をすればそのままいける
    まあ2D用だから使うかどうか微妙だが
    そこまで神経質になるものでもない
    opentypeのfontだとアラインメントに微妙にずれが生じるからそれを補正するための物
    たとえばメッシュ構築とかだと内部でアラインメントを正確に実行しちゃうから
    これ要らんのよ
  */
  function getTextDrawingData(params = {}){
    const {
      font, targetText = "A", textScale = 320, position = {x:0,y:0},
      alignV = "center", alignH = "center",
      bezierDetail2 = 8, bezierDetail3 = 5, lineSegmentLengthRatio = 1/64,
      spacingMinLengthRatio = 1/40
    } = params;
    const cmd = font.font.getPath(targetText, 0, 0, textScale).commands;
    const cmdText = parseCmdToText(cmd);

    // 描画に使うパスを生成する
    const textPath = new Path2D(cmdText);

    const textContours = parseData({
      data:cmdText,
      bezierDetail2:bezierDetail2, bezierDetail3:bezierDetail3,
      lineSegmentLength:lineSegmentLengthRatio*textScale
    });
    const tb = getBoundingBoxOfContours(textContours);

    const factorW = (alignV === "left" ? 0 : (alignV === "right" ? 1 : 0.5));
    const factorH = (alignH === "top" ? 0 : (alignH === "bottom" ? 1 : 0.5));
    const deltaX = tb.x + tb.w*factorW - position.x;
    const deltaY = tb.y + tb.h*factorH - position.y;
    const bd = {x:tb.x - deltaX, y:tb.y - deltaY, w:tb.w, h:tb.h};
    return {bd:bd, dx:-deltaX, dy:-deltaY, path:textPath};
  }

  /*
    getSVGContours(params={})
    params:
      svgData: svgデータの文字列をここに。たとえば例のツールで作ったやつとか。
      scaleFactor: textScaleに相当するもの。原点中心に拡大する。
      bezierDetail2: 2次ベジエのディテールの指定。default:8
      bezierDetail3: 3次ベジエのディテールの指定。default:5
      lineSegmentlengthRatio: Lを解釈する際の長さ指定のスケールに対する比率。default:1/64
      spacingMinLengthRatio: evenlySpacingを適用する際の長さのスケールに対する比率。default:1/40
      mergeThresholdRatio: mergePointsを適用する際の長さのスケールに対する比率。default:1/100
    SVGのcontoursを出すのがめんどくさいのでメソッド化。
    マルチパスでも問題ない。
    ただテキストと違って場合によってはcreateDisjointPaths()が必要かもしれない。
    加えてclosed pathのみからなるという制約がある。
    まあほとんどの場合closed pathsに適用するんだけどな。

    p5依存度：B（やや依存）
    SVGパスをメッシュ化するうえでの窓口となる関数
    お魚メッシュをp5wgexに持ってくのにこれを使う
    現在はp5.Vectorからなるcontoursを返す形なので
    そこをVec3で書き直せば非依存にできる
  */
  // 閉曲線(closed)前提
  function getSVGContours(params = {}){
    const {
      svgData = "M 0 0 L 1 0 L 1 1 L 0 1 Z", scaleFactor = 200,
      bezierDetail2 = 8, bezierDetail3 = 5, lineSegmentLengthRatio = 1/64,
      spacingMinLengthRatio = 1/40, mergeThresholdRatio = 1/100
    } = params;
    const svgContours = parseData({
      data:svgData, parseScale:scaleFactor,
      bezierDetail2:bezierDetail2, bezierDetail3:bezierDetail3,
      lineSegmentLength:lineSegmentLengthRatio*scaleFactor
    });

    mergePointsAll(svgContours, {closed:true});
    evenlySpacingAll(svgContours, {
      minLength:spacingMinLengthRatio*scaleFactor, closed:true
    });
    mergePointsAll(svgContours, {
      threshold:mergeThresholdRatio*scaleFactor, closed:true
    });

    return svgContours;
  }

  /*
    getUnionFind(n, query)
    n: 最大数（2以上想定）
    query: 長さ2の配列の配列。異なる元からなる。順序は問わない。
    たとえば5で[[0,1],[1,2],[3,4]]なら[0,1,2]と[3,4]に分ける
    出力がどうなってるかについて
    {uf, count, rep, mem}
    ufは長さnの配列で、各indexには親の数字（グループ内に1つ数を選んで、それ）がptで参照できるようになってて
    lvでレベルを参照できるようになってる（グループの個数だけある通し番号）
    countはグループの個数
    repはグループの個数の長さの配列で各元はそのレベルの親のindex
    memはそのレベルに入ってるindexの集合、つまり配列の配列
    repとmemは便宜のために導入されました（もともとufとcountだけだった）

    0,1,2,...,n-1をqueryでまとめる
    いくつの塊になったのかとそのレベルを返す感じ（lvで参照できる）

    p5依存度：C（非依存）
    補助関数
  */

  function getUnionFind(n, query){
    let parent = [];
    let rank = [];
    for(let i = 0; i < n; i++){
      parent.push(i);
      rank.push(0);
    }
    function Find(a){
      if(parent[a] == a){
        return a;
      }else{
        parent[a] = Find(parent[a]);
        return parent[a];
      }
    }
    function Union(a, b){
      let aRoot = Find(a);
      let bRoot = Find(b);
      if(rank[aRoot] > rank[bRoot]){
        parent[bRoot] = aRoot;
      }else if(rank[bRoot] > rank[aRoot]){
        parent[aRoot] = bRoot;
      }else if(aRoot != bRoot){
        parent[bRoot] = aRoot;
        rank[aRoot] = rank[aRoot] + 1;
      }
    }
    for(let i = 0; i < 2; i++){
      for(let q of query){
        Union(q[0], q[1]);
      }
    }
    let uf = [];
    for(let i = 0; i < n; i++){
      uf.push({id:i, pt:parent[i]});
    }
    uf.sort((x, y) => {
      if(x.pt < y.pt){ return -1; }
      if(x.pt > y.pt){ return 1; }
      return 0;
    });
    uf[0].lv = 0;
    let count = 1;
    for(let i = 1; i < n; i++){
      if(uf[i].pt == uf[i-1].pt){
        uf[i].lv = uf[i-1].lv;
      }else{
        uf[i].lv = uf[i-1].lv + 1;
        count++;
      }
    }
    uf.sort((x, y) => {
      if(x.id < y.id){ return -1; }
      if(x.id > y.id){ return 1; }
      return 0;
    });
    // 代表系の集合もあると便利だと思う。
    const represents = new Array(count);
    const members = new Array(count);
    for(let i=0; i<members.length;i++) members[i] = [];
    for(let x of uf){
      represents[x.lv] = x.pt;
      members[x.lv].push(x.id);
    }
    // uf:ユニオンファインド配列。
    // 各indexにはptとlvへの参照が入ってる
    // countは島の数
    // repはレベルからptへの参照。これあるだけでだいぶ違うと思う。
    // memは各々の島のメンバーの配列。これもあると便利そう。下処理でやるのは
    // 大変だし。つけるかどうかオプションにするかは応相談。
    return {uf:uf, count:count, rep:represents, mem:members};
  }

  /*
    getDet2(a,b,c)
    a,b,cは2次元ベクトル
    a--->c, b--->cの外積を取る操作。
    そんだけ。

    p5依存度：B（やや依存）
    a,b,cはp5.Vectorを想定しているが
    まあVec3でも普通に機能する
  */
  function getDet2(a,b,c){
    return (c.x-a.x) * (c.y-b.y) - (c.x-b.x) * (c.y-a.y);
  }

  /*
    getIntersection(a,b,c,d,threshold=1e-9)
    a,b,c,d: ベクトル
    イメージ的にはa----bとc----dが線分で、これらの交わり具合を調べるための関数。
    割と複雑なことをしているのだ
    threshold: 一致判定の閾値。default:1e-9
    戻り値：{flag, intersections}
    flagがdisjointの場合は交点無し
    flagがoverlapの場合というのは重なるケースである
    この場合たとえばa----bの上にcやdが来る場合それを入れたりする
    c----dの上にaやbを乗せたりするわけ
    flagがsingleなのが通常の交叉の場合
    intersectionsの中にオブジェクトが入ってる
    pは座標、typeのinsert_abやcdはa--bの上かc--dの上かという話
    んでたとえばratioが0.3ならa---bの上に0.3:0.7で内分した位置にその点が置かれる
    まあそんな感じです
    overlapはもともと無視していたんですがとある事情により追加されました

    p5依存度：B（非依存）
    a,b,c,dをVec3にすればOKで、distもちゃんとあるので問題ない
  */
  function getIntersection(a,b,c,d,threshold = 1e-9){
    // a,b,c,dは2次元ベクトル
    // a-b と c-dが交わるかどうか調べる
    const abc = getDet2(a,b,c);
    const abd = getDet2(a,b,d);
    const cda = getDet2(c,d,a);
    const cdb = getDet2(c,d,b);
    if (abc<0&&abd<0) return {flag:"disjoint"};
    if (abc>0&&abd>0) return {flag:"disjoint"};
    if (cda<0&&cdb<0) return {flag:"disjoint"};
    if (cda>0&&cdb>0) return {flag:"disjoint"};

    const abr = Math.abs(abc) + Math.abs(abd);
    const cdr = Math.abs(cda) + Math.abs(cdb);

    // 4点が一直線上にあるとみなせる場合は
    // abとcdのうち距離が大きい方を取り
    // それにより4点が同一直線上にあるとみなし
    // 内積を使って大小判定を実行する

    if (abr < threshold || cdr < threshold){
      // abかcdが0とみなせる場合は処理しない
      const distAB = a.dist(b);
      const distCD = c.dist(d);
      if(distAB < threshold || distCD < threshold) return {flag:"disjoint"};
      const intersections = [];
      const abab = distAB*distAB;
      const ab_c = ((b.x-a.x)*(c.x-a.x)+(b.y-a.y)*(c.y-a.y))/abab;
      const ab_d = ((b.x-a.x)*(d.x-a.x)+(b.y-a.y)*(d.y-a.y))/abab;
      if(ab_c >= 0 && ab_c <= 1) {
        intersections.push({type:"insert_ab", p:c.copy(), ratio:ab_c});
      }
      if(ab_d >= 0 && ab_d <= 1) {
        intersections.push({type:"insert_ab", p:d.copy(), ratio:ab_d});
      }
      const cdcd = distCD*distCD;
      const cd_a = ((d.x-c.x)*(a.x-c.x)+(d.y-c.y)*(a.y-c.y))/cdcd;
      const cd_b = ((d.x-c.x)*(b.x-c.x)+(d.y-c.y)*(b.y-c.y))/cdcd;
      if(cd_a >= 0 && cd_a <= 1) {
        intersections.push({type:"insert_cd", p:a.copy(), ratio:cd_a});
      }
      if(cd_b >= 0 && cd_b <= 1) {
        intersections.push({type:"insert_cd", p:b.copy(), ratio:cd_b});
      }
      return {flag:"overlap", intersections};
    }

    // a---cp---bの比率
    // c---cp---dの比率
    const ratioA = Math.abs(cda)/cdr;
    const ratioC = Math.abs(abc)/abr;
    const intersection = p5.Vector.lerp(a, b, ratioA); // 共通にする

    // pには交差点を入れる
    return {
      flag:"single", intersections:[
        {type:"insert_ab", p:intersection, ratio:ratioA},
        {type:"insert_cd", p:intersection, ratio:ratioC}
      ]
    }
  }

  /*
    createDisjointPaths(contours, mergeThreshold=1e-9)
    contours: p5のベクトル列の配列。すべて閉路であることが前提。交叉については自由。自己交叉もOK.
    options:
      mergeThreshold: 点をまとめる際のマージの基準 default:1e-9
      output: アウトプットの形式について
        "default": デフォルト。そのまま返る。頂点に関しては接続辺などの情報もあるので、
                   その辺りで何かしたい場合は有用。
        "island_vertexIndices": {islands, vertices}が返る。islandsにはislandがインデックス配列の形で入ってる。
                                verticesはp5のベクトル列で、インデックスからこれを参照する。
        "island_vertices": {islands}が返る。配列の各元であるislandはすべてp5のベクトル列である。もちろんすべて正の向き。
                           このままテッセレーションに持っていくこともできる（earcutなどして）。いわゆるsplitに相当する。
                           （_triangulateはこのsplitが事実上実行不可能で大変な苦労を要した...昔の話。）
        "cycle_vertexIndices": {cycles, vertices}が返る。cyclesにはcycleがインデックス配列の形で入ってる。
                              verticesはp5のベクトル列で、インデックスからこれを参照する。
        "cycle_vertices": {cycles}が返る。配列の各元であるcycleはすべてp5のベクトル列である。
                         このままcyclesToCyclesにもっていってさらにearcutでメッシュを作ったりできる。
    入力はいわゆる2次元のベクトル列です。
    3次元では使えないです。まあp5の_triangulateに比べたら劣化してるかもしれないけど
    どうでもいいですね。あれ使いづらいので。
    出力：
    {islands, cycles, vertices:mergedVertices, edges:mergedEdges};
    islandsはislandの配列
    islandは互いに分かれた最小単位のサイクルで
    verticesとedgesという形で頂点列と辺列が格納されている
    cyclesは互いにdisjointなサイクルの配列
    つまりisland同士が接している場合にそれらをつなげるわけ
    そのうえで
    互いに一切接触しないサイクルの配列
    同じくverticesとedgesからなる
    verticesとedgesはデータ配列
    indexの参照先
    verticesのpにはベクトルが入っている
    edgesのindicesには両端のverticeのindexが入っている
    以上
    ですからここからcyclesToCyclesに持っていく場合
    cyclesの中身をindexからベクトルに翻訳する必要があるわけ
    後は同じ。

    そういうわけなので
    ここからcyclesToCyclesに持っていくなら
    cyclesにおいてそのindexのverticeのpを取り出す必要があるのよね

    p5依存度：B（やや依存）
    outputのバグを直しました（凡ミス）
    contoursがそもそもVec3で書けていれば
    後は問題ないかと
    出力は場合によってはcontoursだし
    場合によってはVec3Arrayですね
    contoursは今のところはVec3Arrayの配列を想定してる
    すべてclosedでなくても扱えるが基本的にはすべてclosedが想定されてるね
  */

  function createDisjointPaths(contours, options = {}){
    const {mergeThreshold = 1e-9, output = "default"} = options;

    // cpCheckArrayをcontourの数だけ用意する
    const cpCheckArrays = new Array(contours.length);
    for(let i=0; i<contours.length; i++){
      // contourごとに空っぽの配列を用意する
      cpCheckArrays[i] = new Array(contours[i].length);
      for(let k=0; k<contours[i].length; k++){
        cpCheckArrays[i][k] = [];
      }
    }

    // contourの交叉用のクエリ配列
    // const queryForCrossingContours = []; // 不要

    // contourとcontourという形でペアを作りつつ
    // それらの中で交叉判定する
    // もちろん同じcontour同士も含む
    // 違うcontour同士の場合は総当たりとなる
    // 別々に書いた方が良さそう...

    // 別にしよう
    // i===kの場合は
    // n>mのときだけサーチする...

    // 平面走査
    // バグってますね。原因不明....
    // direction考慮したら直った

    // わかんない
    // わかるのはlibtessが速いってことだけ
    // テッセレーションに特化してる分余計なことしてないから
    // 余計なことしなければ速いんだろうけど...
    // まあパス分割とかしなくても三角形に分けるの可能だからな
    // ...
    // OpenProcessingに落とすともう7秒とかかかる
    // うんざりする
    // やめよう

    // 調べたんですが
    // 平面走査のところだけ単独で調べると
    // 半分になってますね（おおよそね）
    // 何回調べてもおよそ半分
    // ここについては改善されたようです
    // たとえば得られたcrossPointsってxの小さい順に得られるので
    // それ使ってマージを楽にやれば
    // いい感じになるんじゃないかと。？？しらんけど。

    // 他のパートも軒並み遅い
    // というか「交叉検出」「マージング」「それ以降の処理」の負荷が
    // おおよそとんとんなので
    // 交叉検出だけ速くても仕方ないんですよね
    // おそらくlibtessは交叉検出から一気にテッセレーションにもっていってるんで
    // 速いんでしょう
    // やり方は不明...

    const contourEdges = [];
    let eid = 0;
    for(let i=0; i<contours.length; i++){
      const L = contours[i].length;
      for(let k=0; k<L; k++){
        const p = contours[i][k];
        const q = contours[i][(k+1)%L];
        if(p.x < q.x) {
          contourEdges.push({
            eid:eid, contourIndex:i, index:k, cl:L, points:[p,q], direction:0
          });
        } else {
          contourEdges.push({
            eid:eid, contourIndex:i, index:k, cl:L, points:[q,p], direction:1
          });
        }
        eid++;
      }
    }
    const events = [];
    for(const e of contourEdges){
      events.push({target:e, inout:0, x:e.points[0].x});
      events.push({target:e, inout:1, x:e.points[1].x});
    }
    events.sort((ev0, ev1) => {
      if(ev0.x > ev1.x) return -1;
      if(ev0.x < ev1.x) return 1;
      if(ev0.inout > ev1.inout) return -1;
      if(ev0.inout < ev1.inout) return 1;
      return 0;
    });
    const currentEdges = [];

    while(events.length > 0){
      const ev = events.pop();
      const e1 = ev.target;
      if(ev.inout === 1){
        for(let m=currentEdges.length-1; m>=0; m--){
          const e0 = currentEdges[m];
          if(e0.eid === e1.eid){
            currentEdges.splice(m,1);
            break;
          }
        }
        continue;
      }
      for(let k=0; k<currentEdges.length; k++){
        const e0 = currentEdges[k];
        if(e0.contourIndex === e1.contourIndex){
          if((e0.index - e1.index + e0.cl) % e0.cl === 1) continue;
          if((e1.index - e0.index + e0.cl) % e0.cl === 1) continue;
        }
        const ic = getIntersection(e0.points[e0.direction], e0.points[1-e0.direction], e1.points[e1.direction],e1.points[1-e1.direction]);
        // overlapの場合を追加
        if (ic.flag === "single" || ic.flag === "overlap") {
          for(const icData of ic.intersections){
            if(icData.type === "insert_ab"){
              cpCheckArrays[e0.contourIndex][e0.index].push({p:icData.p, ratio:icData.ratio});
            } else if(icData.type === "insert_cd"){
              cpCheckArrays[e1.contourIndex][e1.index].push({p:icData.p, ratio:icData.ratio});
            }
          }
        }
      }
      currentEdges.push(e1);
    }

    // まず交叉点を挿入した新しいcontourを作る
    const newContours = [];

    for(let i=0; i<contours.length; i++){
      const contour = contours[i];
      const newContour = [];
      for(let m=0; m<contour.length; m++){
        newContour.push({p:contour[m], cross:false});
        const cpa = cpCheckArrays[i][m];
        if(cpa.length>0){
          // cpaをratioの小さい順にsortしてpoints[i]のあとに放り込んでいく
          cpa.sort((u, v) => {
            if (u.ratio < v.ratio) return -1;
            if (u.ratio > v.ratio) return 1;
            return 0;
          });
          for(let k=0; k<cpa.length; k++){
            newContour.push({p:cpa[k].p, cross:true});
          }
        }
      }
      // このときneighbor属性を設定してしまう
      // indexではなく点を直接ぶちこむ
      for(let m=0; m<newContour.length; m++){
        newContour[m].neighbor = [
          newContour[(m-1+newContour.length) % newContour.length],
          newContour[(m+1) % newContour.length]
        ];
      }
      newContours.push(newContour);
    }
    // すべての点をまとめる
    const allVertices = [];
    // newContourを次々ぶちこんでひとつにし、indexを順繰りに割り振る
    for(const newContour of newContours){
      allVertices.push(...newContour);
    }
    for(let i=0; i<allVertices.length; i++){
      allVertices[i].index = i;
    }

    // newContourたちを先ほどのunion-findにしたがってまとめ、それぞれを
    // 一つの配列にする。
    // のではなくそのまま扱う
    // 別に交わってなくていい

    // 各々のcontourUnionたちごとに、crossとcrossまたはcrossとnon-crossでマージする
    // それぞれufを作り
    // mergedVerticesとmergedEdgesを作る
    // ここから先は別々にやった方がいいかも？
    //const mergedUnions = [];

    //for(const contourUnion of contourUnions){
    //  const mergedUnion = {};
      // 1.query生成
      // 2.uf生成
      // 3.mergedVerticesとmergedEdges用意
      // 4.ufにしたがって一通りぶち込む
      // 5.xMinでedgesをソートする
      // 6.verticeに接続辺のedgeのindexをぶちこむ
      // 7.ぶち込み終わったらverticeごとに辺のソートを実行しすべて反時計回りにする
      // 今回多重辺は登場しないので楽ですね
      // {vertices:mergedVertices, edges:mergedEdges}
      // mergedUnions[lv] = mergedUnion; おしまい


      const query = [];
      for(let m=0; m<allVertices.length; m++){
        const p = allVertices[m];
        for(let n=m+1; n<allVertices.length; n++){
          const q = allVertices[n];
          if (!p.cross && !q.cross) continue;
          const d = p.p.dist(q.p);
          if (d < mergeThreshold) query.push([m,n]);
        }
      }

      const unionFindResult = getUnionFind(allVertices.length, query);
      const mergedVertices = [];
      const mergedEdges = [];

      const uf = unionFindResult.uf;
      // ここでいうkがすなわちレベルになるね...lvにしよう
      for(let lv=0; lv<unionFindResult.count; lv++){
        const obj = {};
        obj.p = allVertices[unionFindResult.rep[lv]].p;
        obj.index = lv;
        //obj.neighbor = []; // 使ってない...
        obj.indices = []; // あとで放り込む
        const members = unionFindResult.mem[lv];
        // メンバーごとに設定されたneighborのレベルを放り込む
        // ほとんどの場合メンバーは単独だろう
        // crossの場合は2つ3つ重なっている可能性がある
        //console.log(m);
        for(const memberIndex of members){
          const member = allVertices[memberIndex];
          for(const nb of member.neighbor){
            // 両方でmergedEdgesに放り込むと重複してしまう
            // そこでlvの方が小さい場合だけindexをぶち込むようにする
            if (lv < uf[nb.index].lv) {
              mergedEdges.push({
                indices:[lv, uf[nb.index].lv], dirtyFlag:false, double:false
              });
            }
          }
        }
        mergedVertices.push(obj);
      }

    // 重複辺排除
    for(let i=mergedEdges.length-1; i>=0; i--){
      const e0 = mergedEdges[i];
      if(e0.double) continue;
      for(let k=i-1; k>=0; k--){
        const e1 = mergedEdges[k];
        if(e1.double) continue;
        if(e0.indices[0] === e1.indices[0] && e0.indices[1] === e1.indices[1]){
          e0.double = true;
          e1.double = true;
          break;
        }
      }
    }
    for(let i=mergedEdges.length-1; i>=0; i--){
      if(mergedEdges[i].double){
        mergedEdges.splice(i,1);
      }
    }
    // このとき辺が出ていない頂点が発生する可能性があるのでそれを排除する
    // そのときindexが変わってしまうので
    // やめよう
    // overlap属性をoffにすれば問題ない
    // 無視されるので

      // たとえばここでmergedVerticesを走査して
      // 事前にmergedEdgesにoverlap:falseとかフラグを付けておいて
      // verticeごとにindicesの配列が
      // 上見ればわかるけどこれ全部[a,b](a<b)ってなってるのね
      // めんどうだな
      // mergedEdgesの相互走査でもいいか
      // 全部[a,b]のa<bなら多重辺の場合0も1も一致するわけだから
      // 照合はe0.indices[0]===e1.indices[0] && e0.以下略
      // で済む。んで一致してたら両方消すと。
      // それを逆サーチ＆逆相互でやればいい
      // ひとつでも見つかったところでサーチを切るので
      // 4重5重でも一度に消せるのは2本まで
      // もしくは
      // 一度に2つ消す操作が煩雑なら
      // overlap属性にtrue渡すだけにして
      // 操作の際にoverlapがついてたら無視して
      // ついてない場合だけ調べればいいね
      // たとえば5重とかなってた場合2つずつ消えて1本残る
      // 終わったら再び逆サーチしてoverlap属性の辺をまとめて消す

      // 加えて、多重辺が出現するかどうかは事前にわかるので、
      // 出現しない場合このパートを省けばよい。

      // xMinでedgesをソート
      for(const e of mergedEdges){
        const p = mergedVertices[e.indices[0]];
        const q = mergedVertices[e.indices[1]];
        e.xMin = Math.min(p.p.x, q.p.x);
        e.xMinIndex = (p.p.x < q.p.x ? p.index : q.index);
      }
      mergedEdges.sort((e0,e1) => {
        if (e0.xMin < e1.xMin) return -1;
        if (e0.xMin > e1.xMin) return 1;
        return 0;
      });
      // 頂点に接続辺のindexを集める
      for(let k=0; k<mergedEdges.length; k++){
        const e = mergedEdges[k];
        e.index = k;
        const p = mergedVertices[e.indices[0]];
        const q = mergedVertices[e.indices[1]];
        p.indices.push(k);
        q.indices.push(k);
      }
      // 接続辺の配列を反時計回りにソートする
      // 行き先の頂点と差を取ってatan2して逆順に並べるだけ
      // 常に偶数長さ。
      for(let i=0; i<mergedVertices.length; i++){
        const p = mergedVertices[i];
        //const l = p.indices.length; // つかってねぇし
        p.indices.sort((i0, i1) => {
          const e0 = mergedEdges[i0];
          const e1 = mergedEdges[i1];
          const p0 = mergedVertices[e0.indices[0] + e0.indices[1] - p.index];
          const p1 = mergedVertices[e1.indices[0] + e1.indices[1] - p.index];
          const angle0 = Math.atan2(p0.p.y - p.p.y, p0.p.x - p.p.x);
          const angle1 = Math.atan2(p1.p.y - p.p.y, p1.p.x - p.p.x);
          if (angle0 > angle1) return -1;
          if (angle0 < angle1) return 1;
          return 0;
        });
      }
    //  mergedUnion.vertices = mergedVertices;
    //  mergedUnion.edges = mergedEdges;
    //  mergedUnions.push(mergedUnion);
    //}
    // OK
    // あとはmergedUnionごとにislandsを作るんですが
    // このとき最終的に単純閉曲線にすることを考えると
    // 辺に向きつけが設定されないと不便なので
    // islandは頂点の列と辺の列を両方用意した方がいいと思う
    // んで辺たちはバラバラになりますから
    // 頂点の列を見ながら
    // 向きがそのようになるようにindicesを必要に応じてsortする必要があるね
    // 0番->1番となるようにね

    //for(const mergedUnion of mergedUnions){
    //  const {vertices:mergedVertices, edges:mergedEdges} = mergedUnion;
      const islands = [];
      // 最初のindexと次のindex
      let startIndex = 0;
      let nextIndex = 0;
      let arrivedIndex;
      let islandVertices = [];
      let islandEdges = [];

      while(1){

        if(nextIndex === startIndex) {

          // 最初にislandVerticesとislandEdgesのlengthを見て
          // 正ならislandsにぶち込む
          // コピーをぶち込んで初期化
          if(islandVertices.length > 0){
            // dirtyFlagはサイクル分解用
            const island = {
              vertices:islandVertices.slice(), edges:islandEdges.slice(),
              dirtyFlag:false
            };
            islands.push(island);
            islandVertices.length = 0;
            islandEdges.length = 0;
          }

          // 次のループの準備
          // 最初にdirtyFlagがfalseであるようなedgeを取るが、
          // このedgeが採用されるとは限らないことに注意する。
          let startEdgeIndex = -1;
          for(let k=0; k<mergedEdges.length; k++){
            const e = mergedEdges[k];
            if (!e.dirtyFlag) {
              startEdgeIndex = e.index;
              break;
            }
          }
          // dirty辺が無くなったら終了
          if (startEdgeIndex < 0){
            break;
          } else {
            // ある場合は最初の...
            const startEdge = mergedEdges[startEdgeIndex];
            startIndex = startEdge.xMinIndex;
            // 時計回りでサーチ
            for(let i=mergedVertices[startIndex].indices.length-1; i>=0; i--){
              // 接続辺のindexをサーチしていく
              const index = mergedVertices[startIndex].indices[i];
              if(!mergedEdges[index].dirtyFlag){
                arrivedIndex = index;
                nextIndex = mergedEdges[index].indices[0] + mergedEdges[index].indices[1] - startIndex;
                mergedEdges[index].dirtyFlag = true;
                islandVertices.push(startIndex);
                islandEdges.push(index);
                break;
              }
            }
          }
        }

        const p = mergedVertices[nextIndex];
        // p.indicesの元をサーチしていく。
        // 最初にarrivedEdge.indexになるところを特定
        let searchStartIndex;
        for(let i=0; i<p.indices.length; i++){
          if (p.indices[i] === arrivedIndex) {
            searchStartIndex = i; break;
          }
        }
        // ここからはじめて1ずつ足していってdirtyFlagがfalseのがみつかったらそこで切る
        // なかったらサーチが終わる感じ
        // 多重辺は考慮しないので普通に1から始める
        for(let i=1; i<p.indices.length; i++){

          const targetIndex = (searchStartIndex+i)%p.indices.length;
          const e = mergedEdges[p.indices[targetIndex]];
          const ae = mergedEdges[arrivedIndex];

          if(!e.dirtyFlag){
            e.dirtyFlag = true;
            islandVertices.push(nextIndex);
            islandEdges.push(e.index);
            //islands[islands.length-1].push(nextIndex);
            nextIndex = e.indices[0] + e.indices[1] - nextIndex;
            arrivedIndex = e.index;
            break;
          }
        }
      }
   //   mergedUnion.islands = islands;
   // }
    // mergedUnionにおいてverticesとedgesとislands
    // islandsは配列でindexが入ってる
    // islandsにおいてverticesの順番通りにedgesに向きを付ける
    // indicesの0と1をverticesの番号にするだけ
  //  for(const mergedUnion of mergedUnions){
     // const {islands, vertices, edges} = mergedUnion;
      for(let k=0; k<islands.length; k++){
        const island = islands[k];
        // 島にindexが無いとのちのち不便
        island.index = k;
        //const {vertices:islandVertices, edges:islandEdges} = island;
        for(let i=0; i<island.edges.length; i++){
          const e = mergedEdges[island.edges[i]];
          e.islandId = k; // 後で使う
          const vBegin = mergedVertices[island.vertices[i]];
          const vEnd = mergedVertices[island.vertices[(i+1)%island.edges.length]];
          // 0番から1番に向かうようにする
          e.indices[0] = vBegin.index;
          e.indices[1] = vEnd.index;
          // さらに「次の辺のindex」という概念を用意する
          e.next = island.edges[(i+1)%island.edges.length];
          // これをいじることで単純閉曲線群にする処理を...やるかもしれない
        }
      }
   // }
    // ここまでで意図した挙動になっているかどうか調べた方がいいかも

    // mergedUnionsにはvertices, edges, islandsが入っている
    // edgesの各edgeにはislandIdが付与されていて互いに異なる
    // これはどのislandに属しているかの番号
    // islandsはislandの配列で各islandはverticesとedgesからなる
    // それぞれindexの配列で参照元は上記のverticesとedgesとなっている

    // optionにより、islandsの代わりに単純閉曲線を返すようにしよう
    // っていっても辺の配列にするだけだけれどね
    // そうしないとこの先のテッセレーションに向かっていけない

    /*
      まずislandにdirtyFlagをfalseで付与しておき
      mergedVerticesの各元に複数の島にまたがる場合に(islandId)
      overlapをtrueにしておく（そうでない場合はfalse）
      そして島を一つ取り
      dirtyFlagをtrueにする
      島のoverlappedVerticeからなる配列を作る（無ければ作られない）
      この中から点を取りoverlap先の島を選んで
      「接合」する。具体的には、辺のnextをいじる。
      いじったうえで選んだ島のedgeのislandIdをすべて書き換える
      つまりループの最初に選んだidで置き換える
      加えて新しい島のoverlappedVerticeを追加する
      新しい島のdiretyFlagをtrueにする
      overlappedVerticesを走査してoverlapが解消されているものを取り除く
      これをこの配列が空っぽになるまで続ける
      空っぽになったら
      dirtyFlagがfalseの島がないかどうか調べ
      無ければ終了
      終わったら辺のnextにしたがってループ分解する
    */

    // overlap属性の付与（複数の島にまたがってる）
    // 辺が出ていない頂点のoverlap属性はfalseとする
    // cycleには現れない。というかislandsにも現れていない。いわゆる孤立点。
    for(const v of mergedVertices){
      v.overlap = false;
      const neighbors = v.indices; // 偶数個
      if(neighbors.length===0)continue;
      const someIndex = mergedEdges[neighbors[0]].islandId; // どれかひとつの
      for(let i=1; i<neighbors.length; i++){
        if(someIndex !== mergedEdges[neighbors[i]].islandId){
          v.overlap = true;
          break;
        }
      }
    }
    // islandのdirtyFlagがなくなるまで続ける
    //let debug=99;
    let overlappedVertices = [];
    let curIsland;

    while(1){
      if(overlappedVertices.length === 0){
        //curIslandを設定
        let existDirtyIsland = false;
        for(const island of islands){
          if(!island.dirtyFlag){
            curIsland = island;
            existDirtyIsland = true;
            break;
          }
        }
        // dirtyIslandが無ければ終了
        if(!existDirtyIsland) break;
        // フラグを折る
        curIsland.dirtyFlag = true;
        // overlappedVerticeを補充
        for(const vIndex of curIsland.vertices){
          const v = mergedVertices[vIndex];
          if(v.overlap){
            overlappedVertices.push(v);
          }
        }
        // ここで補充がされなかった場合（選んだislandがそもそも独立島だった場合）
        // 最初に戻る
        if(overlappedVertices.length===0)continue;
      }
      // overlappedVerticesから一つ取る
      const overlappedVertice = overlappedVertices[0];
      // 接続辺のうち、1番がこの頂点のindexになっているものを
      // curIslandのものとそれ以外のものと2つ取る
      let selfEdge, otherEdge;
      for(const eIndex of overlappedVertice.indices){
        const e = mergedEdges[eIndex];
        if(e.islandId === curIsland.index){
          if (e.indices[1] === overlappedVertice.index){
            selfEdge = e;
          }
        } else {
          if(e.indices[1] === overlappedVertice.index){
            otherEdge = e;
          }
        }
        if(selfEdge !== undefined && otherEdge !== undefined) break;
      }
      // nextを適切に書き換える（接続）
      let tmp = selfEdge.next;
      selfEdge.next = otherEdge.next;
      otherEdge.next = tmp;
      // 別の島
      const otherIsland = islands[otherEdge.islandId];
      // 別の島のフラグを折る
      otherIsland.dirtyFlag = true;
      // 別の島のoverlappedVerticeで接続辺の中にcurIslandに属するものが
      // 存在しないものを新たに追加する（存在していればもう入ってるはず）
      for(const vIndex of otherIsland.vertices){
        const v = mergedVertices[vIndex];
        if(!v.overlap) continue;
        let isolate = true;
        for(const eIndex of v.indices){
          if(mergedEdges[eIndex].islandId === curIsland.index){
            isolate = false;
            break;
          }
        }
        if(isolate) overlappedVertices.push(v);
      }

      // それが終わったら、
      // 別の島のedgeたちのislandIdをすべてcurIslandのindexにする
      for(const eIndex of otherIsland.edges){
        mergedEdges[eIndex].islandId = curIsland.index;
      }

      // それも終わったら、overlappedVerticesを逆走査して、
      // overlap情報を更新し、解消されたものはフラグを折って排除する
      for(let i=overlappedVertices.length-1; i>=0; i--){
        const v = overlappedVertices[i];
        v.overlap = false;
        const neighbors = v.indices; // 偶数個
        const someIndex = mergedEdges[neighbors[0]].islandId; // どれかひとつの
        for(let i=1; i<neighbors.length; i++){
          if(someIndex !== mergedEdges[neighbors[i]].islandId){
            v.overlap = true;
            break;
          }
        }
        if(!v.overlap){
          overlappedVertices.splice(i,1);
        }
      }

      // ループの最初に戻る
    }

    // next情報に従ってサイクル分解する
    // 各々のサイクルはedgeIndexの配列とする
    const cycles = [];
    // フラグを復活させる
    for(const e of mergedEdges){ e.dirtyFlag = false; }

    while(1){
      let curEdge;
      // フラグが折れていないのを探す。無ければ終了。
      for(const e of mergedEdges){
        if(!e.dirtyFlag){
          curEdge = e;
          break;
        }
      }
      if(curEdge === undefined) break;
      //　フラグを折る
      curEdge.dirtyFlag = true;
      const initialEdgeIndex = curEdge.index;
      const cycleVertices = [curEdge.indices[0]];
      const cycleEdges = [initialEdgeIndex];
      let nextEdgeIndex = curEdge.next;
      // 最初の辺に戻るまでnextをたどり続ける
      while(nextEdgeIndex !== initialEdgeIndex){
        curEdge = mergedEdges[nextEdgeIndex];
        curEdge.dirtyFlag = true;
        cycleVertices.push(curEdge.indices[0]);
        cycleEdges.push(curEdge.index);
        nextEdgeIndex = curEdge.next;
      }
      cycles.push({
        vertices:cycleVertices, edges:cycleEdges
      });
    }

    // output functions.
    // cyclesToCyclesに渡す場合はcycle_verticesを指定しましょう

    const createOutput0 = () => {
      const resultVertices = [];
      for(let i=0;i<mergedVertices.length;i++){
        resultVertices.push(mergedVertices[i].p);
      }
      const resultIslands = [];
      for(const island of islands){
        const resultIsland = [];
        // ここミスです。ごめんなさい。
        for(let i=0;i<island.vertices.length;i++){
          resultIsland.push(island.vertices[i]);
        }
        resultIslands.push(resultIsland);
      }
      return {islands:resultIslands, vertices:resultVertices};
    }

    const createOutput1 = () => {
      const resultIslands = [];
      for(const island of islands){
        const resultIsland = [];
        for(let i=0;i<island.vertices.length;i++){
          resultIsland.push(mergedVertices[island.vertices[i]].p);
        }
        resultIslands.push(resultIsland);
      }
      return {islands:resultIslands};
    }

    const createOutput2 = () => {
      const resultVertices = [];
      for(let i=0;i<mergedVertices.length;i++){
        resultVertices.push(mergedVertices[i].p);
      }
      const resultCycles = [];
      for(const cycle of cycles){
        const resultCycle = [];
        for(let i=0;i<cycle.vertices.length;i++){
          resultCycle.push(cycle.vertices[i]);
        }
        resultCycles.push(resultCycle);
      }
      return {cycles:resultCycles, vertices:resultVertices}
    }

    const createOutput3 = () => {
      const resultCycles = [];
      for(const cycle of cycles){
        const resultCycle = [];
        for(let i=0;i<cycle.vertices.length;i++){
          resultCycle.push(mergedVertices[cycle.vertices[i]].p);
        }
        resultCycles.push(resultCycle);
      }
      return {cycles:resultCycles};
    }

    switch(output){
      case "island_vertexIndices":
        // islandの内容を頂点のインデックス列にし、
        // verticesを頂点のベクトル列にして返す。
        return createOutput0();
      case "island_vertices":
        // islandの内容を単純に頂点のベクトル列にして返す。
        return createOutput1();
      case "cycle_vertexIndices":
        // cycleの内容を頂点のインデックス列にし、
        // verticesを頂点のベクトル列にして返す。
        return createOutput2();
      case "cycle_vertices":
        // cycleの内容を単純に頂点のベクトル列にして返す。cyclesToCyclesに渡す用。
        return createOutput3();
    }
    // defaultの場合。
    return {islands, cycles, vertices:mergedVertices, edges:mergedEdges};
  }

  /*
    cyclesToCycles(cycles)
    cycles: p5のベクトル列の配列
    ただし
    すべて閉路であること
    互いに交わらないことが条件
    でないと意図しない結果になる可能性がある
    テキストデータ関連は問題ない
    createDisjointPathsで生成されるものについても問題ない
    出力：{vertices, cycles, subCycleArrays}
    verticesは頂点データ
    cyclesにはサイクルが入ってて、earcutで問題なくテッセレートできる内容。indexの配列。
    subCycleArraysはサブサイクル...つまりcyclesで扱ったサイクルがindex配列の形で入っている。
    これがないとメッシュの作成の際に困るので用意した
    奇数番目のサイクルは逆向きなのでカリングについても問題なく処理できる

    p5依存度：B（やや依存）
    contoursではないですね
    入力はcontoursだけど結論はベクトルの列とindex配列ですね
    なぜ分けるのかというと重複点の問題があるからで...まあ難しいです。
  */
  function cyclesToCycles(cycles){
    // 各々のcycleはベクトル列
    // 向きはどっちでもいい
    // すべて単純閉曲線（自己交叉無し）
    // しかも互いに交わらない（相互交叉無し）とする
    // とりあえずすべて時計回りに統一しておく（面倒なので）
    const cycleObjects = [];
    const allVertices = [];
    let lastIndex = 0;
    for(let i=0; i<cycles.length; i++){
      const cycle = cycles[i];
      const cycleLength = cycle.length;

      const clockwise = isClockwise(cycle);
      // もう時計回りでない場合は逆にしてしまう
      // indicesだけ逆順にすることも考えたけどね
      // そのうちそうするかもだけど
      // singlePathを作るのが目的なら特に問題ないかと
      if(!clockwise){ cycle.reverse(); }

      allVertices.push(...cycle);

      const indices = [];
      for(let k=0; k<cycleLength; k++){
        indices.push(lastIndex + k);
      }
      // あとでsortに使う
      const xMax = getXMax(cycle);
      // lastIndexを足す必要ないですね...足したら参照できなくなる
      // 統合処理に支障が出る
      cycleObjects.push({cycleIndex:i, indices, parents:[], children:[], xMaxIndex:xMax.index, xMaxValue:xMax.value});
      lastIndex += cycleLength; // lastIndexを更新する
    }
    // 以上です
    // parentsとchild
    // cycleAとcycleBに対しAの1点とBで判定を取り
    // insideの場合にAのparentがBでBのchildがAという関係
    // なおBの1点とAに対しては何も起こらない
    // それがdisjointでも同じ判定なので、結局片側だけではダメで、
    // 両方要る

    for(let i=0; i<cycles.length; i++){
      const cycleA = cycles[i];
      for(let k=0; k<cycles.length; k++){
        if(i===k)continue;
        const cycleB = cycles[k];
        if(insideCycle(cycleA[0], cycleB)){
          cycleObjects[i].parents.push(k);
          cycleObjects[k].children.push(i);
        }
      }
    }

    // ちょっと修正したところ

    // まずparentsの最大値を取る
    // それが4だったとする
    // 4以上のcycleObjectたちで上記の操作を実行する
    // それらのcycleObjectを省く
    // 残りのうち2以上の物で同じことをする
    // 省く
    // 最後に残り全部で同じことをする
    // mountainの寄せ集めができる
    // あとは同じ。
    // 2で割ってfloorして2倍すれば出る。4,5なら4になる。そういう感じ。2ずつ下げる。

    const mountains = [];

    let maxParentsLength = -1;
    for(const co of cycleObjects){
      maxParentsLength = Math.max(maxParentsLength, co.parents.length);
    }
    let indicator = Math.floor(maxParentsLength/2)*2; // 2ずつ下げる

    while(indicator >= 0){
      const subMountains = [];
      for(let i=cycleObjects.length-1; i>=0; i--){
        const co = cycleObjects[i];
        if(co.parents.length === indicator){
          subMountains.push([co]);
        }
      }
      for(const mountain of subMountains){
        for(const childIndex of mountain[0].children){
          const child = cycleObjects[childIndex]
          if(child.parents.length === indicator+1){
            mountain.push(child);
          }
        }
        mountain.sort((c0, c1) => {
          if(c0.parents.length > c1.parents.length) return -1;
          if(c0.parents.length < c1.parents.length) return 1;
          if(c0.xMaxValue < c1.xMaxValue) return -1;
          if(c0.xMaxValue > c1.xMaxValue) return 1;
          return 0;
        });
      }
      mountains.push(...subMountains);
      indicator -= 2;
    }
    // これでいける？

    const resultCycles = [];
    const subCycleArrays = [];

    for(const mountain of mountains){
      const initialCycle = mountain.pop();
      let resultCycle = initialCycle.indices.slice();
      // subCycleの配列. clockwiseなども考慮する。側面の構成などに使う。
      const subCycleArray = [initialCycle.indices.slice()];
      if(mountain.length === 0) {
        resultCycles.push(resultCycle);
        // 一つの場合はここで入れないといけないんだ
        subCycleArrays.push(subCycleArray);
        continue;
      }
      // 事前に一番最初の段階でのxMaxを取っておいてそれを使わないといけないんだ
      // それがずっと通用しつづける
      // なぜなら内部だから

      // これを先に採用しておき、右に線を伸ばす際のガイドとする
      const outerXMax = getXMax(cycles[initialCycle.cycleIndex]).value;

      while(mountain.length > 0){
        const target = mountain.pop();
        const L0 = target.indices.length;
        const L1 = resultCycle.length;
        // targetとresultCycleをつなげる
        // まずtargetのxMaxIndexからx最大点を取得してその点から
        // resultCycleのxMaxを半分とする対蹠点への線分を作り
        // 線分交叉で得られるresultCycleの方の線分との交点を取る
        // single/overlapで得られる交点をかき集める
        // 一番近いものを取りそれに対応する辺を用意する
        // 辺の両端との距離が1e-10未満であればそのまま採用する
        // そうでない場合は時計回りですから
        // 大きい方を取る
        // 交点、大きい方、targetの最大点で三角形を作る
        // 三角形の内部にresultCycleの点がなければ大きい方を採用する
        // あればそのうちでatan2の絶対値が最小のものを採用する
        // atan2は最大点から交点に向かうやつとその点に向かうやつで取る
        // 採用した点がresultCycleの何番目か記録しておく
        // targetのindicesを用意する
        // resultCyclesを、採用点から採用点まで時計回りに進み、
        // そこで最大点に行き、反時計回りにtargetのindicesを進み、最大点に戻る。
        // そういうサイクルとしてnewCycleを作ってそれで置き換える
        // 次のループに進む。
        const {xMaxIndex, xMaxValue} = target;

        const xMaxPoint = allVertices[target.indices[xMaxIndex]];

        const horizon = xMaxPoint.y;
        // outerXMaxは先に計算しておく
        const outerPoint = createVector(outerXMax + 100, horizon);
        // (xMaxPoint, outerPoint)で線分
        // これとresultCycleで線分交叉やって交わる辺を探す
        let crossPoints = [];
        for(let i=0; i<L1; i++){
          const p = allVertices[resultCycle[i]];
          const q = allVertices[resultCycle[(i+1)%L1]];
          const ic = getIntersection(xMaxPoint, outerPoint, p, q);
          if(ic.flag === "disjoint") continue;
          for(let eachIC of ic.intersections){
            if(eachIC.type === "insert_ab"){
              crossPoints.push({p:eachIC.p, ratio:eachIC.ratio, index:i});
            }
          }
        }
        crossPoints.sort((cp0, cp1) => {
          if(cp0.ratio < cp1.ratio) return -1;
          if(cp0.ratio > cp1.ratio) return 1;
          return 0;
        });
        const cp = crossPoints[0]; // ratio最小
        const left = allVertices[resultCycle[cp.index]];
        const right = allVertices[resultCycle[(cp.index+1)%L1]];
        let cutIndex;
        // leftに近ければleft,rightに近ければright.
        // どっちも違うならxMaxPoint, cp.p, rightで三角形を作り
        // 若干面倒な処理をする
        // rightか、または内部の点のうちxMaxPoint --> cp.pとの成す角が
        // 最小の点を取る
        if(cp.p.dist(left) < 1e-10){
          cutIndex = cp.index;
        } else if(cp.p.dist(right) < 1e-10){
          cutIndex = (cp.index+1)%resultCycle.length;
        } else {
          const candidate = [];
          for(let k=0; k<L1; k++){
            const candidatePoint = allVertices[resultCycle[k]];
            if(insideTriangle(xMaxPoint, cp.p, right, candidatePoint)){
              const angle = getAngleBetween2D(xMaxPoint, cp.p, candidatePoint);
              candidate.push({angle:Math.abs(angle), index:k});
            }
          }
          if(candidate.length === 0){
            // rightを採用
            cutIndex = (cp.index+1)%L1;
          } else {
            //angleでsortする
            candidate.sort((cd0, cd1) => {
              if(cd0.angle < cd1.angle) return -1;
              if(cd0.angle > cd1.angle) return 1;
              return 0;
            });
            // 0番を取る
            cutIndex = candidate[0].index;
          }
        }
        // cutIndexが決まったので統合に入る
        const newCycle = [resultCycle[cutIndex]];
        for(let k=1; k<=L1; k++){
          newCycle.push(resultCycle[(cutIndex+k) % L1]);
        }

        const subCycle = [];
        //newCycle.push(target.indices[xMaxIndex]);
        subCycle.push(target.indices[xMaxIndex]);
        // parentsの数が深さで、これが奇数の場合逆にし、偶数の場合順方向。
        const clockwiseAdding = (
          target.parents.length % 2 === 1 ? false : true
        );
        // 残りの点を追加
        for(let k=1; k<=L0; k++){
          if(clockwiseAdding){
            //newCycle.push(target.indices[(xMaxIndex+k) % L0]);
            subCycle.push(target.indices[(xMaxIndex+k) % L0]);
          } else {
            //newCycle.push(target.indices[(xMaxIndex-k+L0) % L0]);
            subCycle.push(target.indices[(xMaxIndex-k+L0) % L0]);
          }
        }
        newCycle.push(...subCycle);
        resultCycle = newCycle;
        subCycle.pop(); // 重複排除
        subCycleArray.push(subCycle);
      }
      // resultCyclesにresultCycleを放り込む
      resultCycles.push(resultCycle);
      subCycleArrays.push(subCycleArray);
      // 次のmountainへ進む...
    }
    // allVerticesとresultCyclesを
    // {vertices:allVertices, cycles:resultCycles}
    // として出力する
    return {
      vertices:allVertices, cycles:resultCycles, subCycleArrays:subCycleArrays
    };
    // この形式のcycleであればearcutが適用でき、テッセレーションが可能。
  }

  // subroutines for cyclesToCycles() (getIntersection()は流用)

  function getXMax(contour){
    // x座標が最大となるindexを返すだけ。入力は閉路。何でもOK.
    let xMax = -Infinity;
    let xMaxIndex = -1;
    for(let i=0; i<contour.length; i++){
      if(xMax < contour[i].x) {
        xMax = contour[i].x;
        xMaxIndex = i;
      }
    }
    return {value:xMax, index:xMaxIndex};
  }

  function getAngleBetween2D(a,b,c){
    // a-->bとa-->cのなす角。2次元専用。
    // a-->bをa-->cにする向きが正の時、正の値。
    // 3次元には使えないのであしからず。
    const cv = (b.x-a.x)*(c.y-a.y) - (b.y-a.y)*(c.x-a.x);
    const dv = (b.x-a.x)*(c.x-a.x) + (b.y-a.y)*(c.y-a.y);
    return Math.atan2(cv, dv);
  }

  function isClockwise(cycle){
    // 時計回りの時trueを返す
    // ベクトルの角度の変化を全部足すだけ
    // 前提として3点以上...だがまあ問題ないだろ
    let angleSum = 0;
    if(cycle.length < 3) return true;
    for(let i=0; i<cycle.length; i++){
      const p = cycle[i];
      const q = cycle[(i+1)%cycle.length];
      const r = cycle[(i+2)%cycle.length];
      const crossValue = (q.x-p.x)*(r.y-q.y) - (q.y-p.y)*(r.x-q.x);
      const dotValue = (q.x-p.x)*(r.x-q.x) + (q.y-p.y)*(r.y-q.y);
      angleSum += Math.atan2(crossValue, dotValue);
    }
    if(angleSum > 0) return true;
    return false;
  }


  function insideCycle(p, cycle){
    // pがcycleの内部に含まれているときtrueを返す
    // cycleはベクトル列を想定
    // cycleは単純閉曲線。向きはどっちでもOK
    // 角度を全部足してPI/2より大きければOK
    let angleSum = 0;
    for(let i=0; i<cycle.length; i++){
      const q = cycle[i];
      const r = cycle[(i+1)%cycle.length];
      const crossValue = (q.x-p.x)*(r.y-p.y) - (q.y-p.y)*(r.x-p.x);
      const dotValue = (q.x-p.x)*(r.x-p.x) + (q.y-p.y)*(r.y-p.y);
      angleSum += Math.atan2(crossValue, dotValue);
    }
    if(Math.abs(angleSum) > 6) return true;
    return false;
  }

  /*
    executeEarcut(vertices, indices=[], threshold=1e-9)
    vertices: p5のベクトル列。単純閉曲線でなければならない。
    穴が開いていてもいいが、深さが2以上だと確実にバグる。まあ当然だが。
    indices: 重複頂点を扱う場合はインデックス配列で指定することもできるわけで、
    これが[]でない場合はそれを採用する。[]の場合、verticesを順繰りに番号付けすることになる。
    まああまり使わないけどな...基本indices指定。つまりcyclesToCyclesで得られるそれ、をそのまま使うことを想定してる。
    threshold: 相等判定のしきいち。default:1e-9
    出力：{vertices, faces}
    facesにはindexが3つずつ順繰りに入ってる。3つずつ取り出してverticesから参照して三角形を復元する。
    すべて正の向きなので心配ないです。

    p5依存度：B（やや依存）
    cyclesToCyclesで得られる結果を用いることが前提だが、単純閉曲線をそのままぶち込んでも
    使えるには使えるね
    はい...そうですね。Vec3なら問題なく扱える。
  */
  function executeEarcut(vertices, indices = [], threshold = 1e-9){
    const cycle = [];
    if(indices.length === 0){
      for(let i=0; i<vertices.length; i++){
        cycle.push(i);
      }
    } else {
      cycle.push(...indices);
    }
    const result = []; // ここにぶちこんでく

    if(cycle.length < 3) return {vertices:vertices, faces:[]}; // しっぱい！

    while(cycle.length >= 3){
      if(cycle.length === 3){
        // 最後の三角形をぶちこんで終了
        result.push(...earcutTriangle(vertices, cycle));
        break;
      }
      // 4以上の場合は帰納法による
      // 下準備の過程で点を排除する場合には点の数を減らしてcontinue;
      // 角度の総和と角度の列を用意
      const angleArray = [];
      let angleSum = 0;
      let signSum = 0; // 符号の和の絶対値をpoints.lengthと比較する
      // 角度を計算する
      // 辺のなす角を記録していく。つぶれてないかどうかのチェックもここでやる。
      let crushedTriangleId = -1;
      for(let i=0; i<cycle.length; i++){
        const p = vertices[cycle[i]];
        const q = vertices[cycle[(i+1)%cycle.length]];
        const r = vertices[cycle[(i+2)%cycle.length]];
        // p->qをq->rに重ねる際の角度の変化を記録していく
        const cp = (q.x-p.x) * (r.y-q.y) - (q.y-p.y) * (r.x-q.x);
        // 三角形がつぶれてる場合は中間点を排除する
        // 直進あるいは出戻り
        if (Math.abs(cp) < threshold) {
          crushedTriangleId = (i+1)%cycle.length;
          break;
        }
        const ip = (q.x-p.x) * (r.x-q.x) + (q.y-p.y) * (r.y-q.y);
        const angle = Math.atan2(cp, ip);
        angleArray.push(angle);
        angleSum += angle;
        signSum += Math.sign(angle); // 1か-1を加えていく. 凸判定に使う。
      }
      // つぶれてる場合はidを排除してcontinue;
      if (crushedTriangleId >= 0) {
        cycle.splice(crushedTriangleId, 1);
        continue;
      }
      // 凸の場合はそのまま答えが出る。判定は符号の和で調べられる。
      // つまりこれのためで、つぶれてるようなのがあるとこれの判定ができないんよ
      // 結果が簡単に出るのでありがたい。第二引数で符号。数字そのままでOK.
      if(Math.abs(signSum) === cycle.length){
        result.push(...earcutConvexPolygon(cycle, signSum));
        // 処理を終了する
        break;
      }
      // つぶれなく、凸でもないケース。
      // 向き付け。1か-1.
      // orientationを掛けて正なら第一の条件を満たす
      const orientation = Math.sign(angleSum);
      // 確実に存在する。信じなさい。
      let cuttingEarId = -1;
      for(let i=0; i<cycle.length; i++){
        // 要するに外角か内角か調べてるのよ。重複を防ぐため配列を用意しておく。
        if(angleArray[i] * orientation < 0) continue;
        // p,q,rの三角形にそれ以外の点が入ってないか調べる。入っていればcontinue
        // なければ排除決定
        const p = vertices[cycle[i]];
        const q = vertices[cycle[(i+1)%cycle.length]];
        const r = vertices[cycle[(i+2)%cycle.length]];
        let insidePointExist = false;
        for(let k=3; k<cycle.length; k++){
          const s = vertices[cycle[(i+k)%cycle.length]];
          if(insideTriangle(p,q,r,s)){
            insidePointExist = true;
            break;
          }
        }
        if(insidePointExist) continue;
        // angleArray[i]の符号に応じてearArrayを構成
        if(angleArray[i] > 0) {
          result.push(cycle[i], cycle[(i+1)%cycle.length], cycle[(i+2)%cycle.length]);
        } else {
          result.push(cycle[i], cycle[(i+2)%cycle.length], cycle[(i+1)%cycle.length]);
        }
        cuttingEarId = (i+1)%cycle.length;
        // ひとつでもカット出来たら終了
        break;
      }
      // もちろんあるが、万が一の場合は抜けてしまおう
      if(cuttingEarId < 0){
        console.log("failure");
        break;
      }
      cycle.splice(cuttingEarId, 1);
    }

    // おわったので出力
    return {vertices:vertices, faces:result};
  }

  // subroutines for executeEarcut
  // 三角形の面積がめちゃ小さい場合にfalse、そういう閾値
  function insideTriangle(p0,p1,p2,p, threshold = 1e-9){
    // pがp0,p1,p2の三角形の内部にあるかどうか調べるだけ
    // ベクトルを使った方が分かりやすいけどね。
    const a11 = Math.pow(p1.x-p0.x,2) + Math.pow(p1.y-p0.y,2);
    const a12 = (p1.x-p0.x)*(p2.x-p0.x) + (p1.y-p0.y)*(p2.y-p0.y);
    const a22 = Math.pow(p2.x-p0.x,2) + Math.pow(p2.y-p0.y,2);
    const qDotU = (p1.x-p0.x)*(p.x-p0.x) + (p1.y-p0.y)*(p.y-p0.y);
    const qDotV = (p2.x-p0.x)*(p.x-p0.x) + (p2.y-p0.y)*(p.y-p0.y);
    const d = a11*a22-a12*a12;
    if (abs(d) < threshold) return false;
    const a = a22*qDotU - a12*qDotV;
    const b = -a12*qDotU + a11*qDotV;
    if(a>0 && b>0 && a+b<d) return true
    return false;
  }

  // 入力はverticesとindex配列（長さ3）
  // verticesから参照して点を取得
  // [a,b,c]だとして
  // 時計回りなら[a,b,c]を返す
  // 逆なら[a,c,b]を返す。雑。
  function earcutTriangle(vertices, indices, threshold = 1e-9){
    // 3点のケース
    // 順番だけ調べる
    // 小さすぎる場合は無視
    const p = vertices[indices[0]];
    const q = vertices[indices[1]];
    const r = vertices[indices[2]];
    const cp = (q.x-p.x) * (r.y-p.y) - (q.y-p.y) * (r.x-p.x);
    if(abs(cp) < threshold) return [];
    // cp>0の場合、p,q,rで時計回り
    // cp<0の場合、p,r,qで時計回り
    if(cp>0) return indices.slice();
    return [indices[0], indices[2], indices[1]]; // 逆！
  }

  // 凸ケース。いきなり終了できる。
  // 0,1,2,3,4,...だとして
  // orientationが1なら0,1,2,0,2,3,0,3,4,...
  // -1なら0,2,1,0,3,2,0,4,3,...そんな感じ
  // vertices要らんわな。indexと向き付けだけでいい。
  // 0,1,2じゃないわ！！！indices[0],[1],[2]だわ！！
  function earcutConvexPolygon(indices, orientation = 1){
    const result = [];
    for(let i=1; i<indices.length-1; i++){
      if(orientation > 0) {
        result.push(indices[0], indices[i], indices[i+1]);
      } else {
        result.push(indices[0], indices[i+1], indices[i]);
      }
    }
    return result;
  }

  // p5.Geometry関連
  // 有用なメソッドも沢山出来たんですが
  // まああんま使いたくないので
  // 独自にいろいろ用意しましょ
  // 使いづらいんだよな

  /*
    createPlaneMeshFromCycles(options={})
    options:
      result: cyclesToCyclesの結果が入る。
      planeHeight: 高さ。まあ要らんだろうが。
    cyclesToCyclesで出したサイクル群からメッシュを生成する。平面です。
    geomを出力させる形になってるのは柔軟性のため。だって色とか付けたいでしょ？
    変形もしたいでしょう。その際に不便なんだよな。

   p5依存度：A（かなり依存）
   まああのp5.Geometryが「入れ物」として便利すぎるのがいけない
   たとえば「PreGeometry」って感じでGeometryの前段階としての関数を用意するとかすれば
   また違うのかもしれない
   vとnがVec3配列になってるやつ
   さらにfacesは長さ3の配列、の、配列。
  */
  // 面だけ
  function createPlaneMeshFromCycles(options = {}){
    const {result, planeHeight = 0} = options;
    const {vertices, cycles, subCycleArrays} = result;
    const geom = new p5.Geometry();

    // 面だけ。シンプル。

    const vn = vertices.length;

    for(let i=0; i<vn; i++){
      const v = vertices[i];
      geom.vertices.push(createVector(v.x, v.y, planeHeight));
      geom.vertexNormals.push(createVector(0,0,1));
    }
    for(const cycle of cycles){
      const faces = executeEarcut(vertices, cycle).faces;
      for(let i=0; i<faces.length; i+=3){
        geom.faces.push([faces[i], faces[i+1], faces[i+2]]);
      }
    }

    return geom;
  }

  /*
    createBoardMeshFromCycles(options={})
    options:
      result: cyclesToCyclesの結果が入る。
      thick: 厚さ。要するに10なら±5ですね。そんな感じ。
      topFace: 上面を用意するかどうか default:true
      bottomFace: 下面を用意するかどうか。どっかにくっつけたい場合に。 default:true
    ボードなので上面と下面があって法線の向きも逆になってる。側面は別メッシュなので綺麗に分かれてる。
    面もすべて正の向きなのでどっかのアルゴリズムみたいにカリングの適用で崩れたりはしない。
    法線の向きを使えば側面だけ違う色にしたり出来るよ。

    p5依存度：A（かなり依存）
    まあp5.Geometryが入れ物として以下略
    作ればいいんだ...作れば...
  */
  // BoardMeshの方がいいんじゃないかと...思うけども。
  // というわけでBoardMeshに改名しました
  function createBoardMeshFromCycles(options){
    const {result, thick = 20, topFace = true, bottomFace = true} = options;
    const {vertices, cycles, subCycleArrays} = result;
    const geom = new p5.Geometry();

    // まず、verticesはすべて入れる。具体的にはthickだけ上にずらして全部入れ、
    // 下にずらして全部入れる
    // そのうえで...
    // cycleごとにearcutを実行し、結果のfacesについて、facesを構成する。
    // その際、上面として普通に用いる（まんま！）
    // 下面はvertices.lengthを加えたうえで1番と2番をswapしてそのまま用いる（まんま）

    // facesって3つずつ配列で放り込むんですね。.....

    const vn = vertices.length;

    for(let i=0; i<vn; i++){
      const v = vertices[i];
      geom.vertices.push(createVector(v.x, v.y, thick));
    }
    for(let i=0; i<vn; i++){
      const v = vertices[i];
      geom.vertices.push(createVector(v.x, v.y, -thick));
    }
    for(const cycle of cycles){
      const faces = executeEarcut(vertices, cycle).faces;
      for(let i=0; i<faces.length; i+=3){
        if(topFace){ geom.faces.push([faces[i], faces[i+1], faces[i+2]]); }
        if(bottomFace){ geom.faces.push([vn + faces[i], vn + faces[i+2], vn + faces[i+1]]); }
      }
    }

    // 終わったら、subCycleをひとつずつあたっていく
    // それぞれverticesに従って上と下の頂点を放り込みつつ...
    // 上下1つずつ放り込むと分かりやすい
    // 側面のfacesを作っていく
    // この際lastIndexを2*vertices.lengthから始めて、
    // 2*subCycle.lengthを毎回加えていく。以上。

    let lastIndex = vn*2;
    for(const subCycleArray of subCycleArrays){
      for(const subCycle of subCycleArray){
        const cn = subCycle.length;
        for(let i=0; i<cn; i++){
          const v = vertices[subCycle[i]];
          geom.vertices.push(createVector(v.x, v.y, thick));
          geom.vertices.push(createVector(v.x, v.y, -thick));
        }
        for(let i=0; i<cn; i++){
          const ru = lastIndex + 2*i;
          const rd = lastIndex + 2*i+1;
          const lu = lastIndex + 2*((i+1)%cn);
          const ld = lastIndex + 2*((i+1)%cn)+1;
          geom.faces.push([lu, ru, rd], [lu, rd, ld]);
        }
        lastIndex += cn*2;
      }
    }

    geom.computeNormals();
    return geom;
  }

  /*
    getBoundingBoxOfGeometry(geom)
    geometryのバウンディングボックスを取得する。
    minX, maxX: xの下限上限
    minY, maxY: yの下限上限
    minZ, maxZ: zの下限上限
    たとえば頂点色グラデーションを付けるのに使う。まあ色の塗り方はいくらでもあるけれど...（法線を使うとか）

    p5依存度：A（かなり依存）
    geomがp5.Geometryを想定しているのでverticesが特に問題なく採用されている。
    そうね
    自分がやるんだったら「vertices,normals,faces」かなぁ
    だって「vertexNormals」の「vertex」ってなんか、ねぇ、要らないでしょ。
    「vertexColors」は要ると思うけど。その場合もできれば長さ4の配列の配列がいいな
  */

  // カラーリングの他にも用途いろいろあるかと。
  function getBoundingBoxOfGeometry(geom){
    let minX=Infinity;
    let maxX=-Infinity;
    let minY=Infinity;
    let maxY=-Infinity;
    let minZ=Infinity;
    let maxZ=-Infinity;
    for(const v of geom.vertices){
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
      minZ = Math.min(minZ, v.z);
      maxZ = Math.max(maxZ, v.z);
    }
    return {minX, maxX, minY, maxY, minZ, maxZ};
  }

  /*
    rotateByAxis(v, axis, angle=0)
    v: p5のベクトルでなくてもよい。x,y,z成分からなるなら何でも。
    axis: 軸。単位ベクトルでなくてもいいが、ゼロはやめてね。
    angle: 回転角。
    有用なのにp5が未だに導入してくれないベクトルの回転関数
    2次元しかないんですよね
    うそでしょ？
    vを改変する形。改変したくないならcopy()と組み合わせてね。

    p5依存どうこう以前にVec3はこれを持っているので、
    要らないです。
  */
  function rotateByAxis(v, axis, angle = 0){
    const na = Math.hypot(axis.x, axis.y, axis.z);
    const a = [axis.x/na, axis.y/na, axis.z/na];
    const dp = a[0]*v.x + a[1]*v.y + a[2]*v.z;
    const w0 = [a[0]*dp, a[1]*dp, a[2]*dp];
    const c = Math.cos(angle);
    const w1 = [c*(v.x-w0[0]), c*(v.y-w0[1]), c*(v.z-w0[2])];
    const s = Math.sin(angle);
    const w2 = [s*(a[1]*v.z-a[2]*v.y), s*(a[2]*v.x-a[0]*v.z), s*(a[0]*v.y-a[1]*v.x)];
    v.set(
      w0[0] + w1[0] + w2[0],
      w0[1] + w1[1] + w2[1],
      w0[2] + w1[2] + w2[2]
    );
  }

  /*
    getCrossPointWithLineFromTwoPoints(p, q, c, n)
    p,q,c,nは2Dのベクトルを想定
    線分pqとcを通りnを法線ベクトルとする直線が交わっていることを前提として
    交点を返す関数
    ratioはp---qにおける比の値、pが点のベクトル

    p5依存度：B（やや依存）
    createVectorが問題なだけ
  */
  function getCrossPointWithLineFromTwoPoints(p, q, c, n){
    const a = Math.abs((p.x-c.x)*n.x + (p.y-c.y)*n.y);
    const b = Math.abs((q.x-c.x)*n.x + (q.y-c.y)*n.y);
    const ratio = a/(a+b);
    const crossPoint = createVector((1-ratio)*p.x + ratio*q.x, (1-ratio)*p.y + ratio*q.y);
    return {ratio:ratio, p:crossPoint}; // ratioも場合によっては必要かも？
  }

  /*
    getCrossPointWithPlaneFromTwoPoints(p, q, c, n)
    平面バージョン。仕様は同じ。

    p5依存度：B（やや依存）
    createVector以下略
  */
  function getCrossPointWithPlaneFromTwoPoints(p, q, c, n){
    const a = Math.abs((p.x-c.x)*n.x + (p.y-c.y)*n.y + (p.z-c.z)*n.z);
    const b = Math.abs((q.x-c.x)*n.x + (q.y-c.y)*n.y + (q.z-c.z)*n.z);
    const ratio = a/(a+b);
    const crossPoint = createVector((1-ratio)*p.x + ratio*q.x, (1-ratio)*p.y + ratio*q.y, (1-ratio)*p.z + ratio*q.z);
    return {ratio:ratio, p:crossPoint}; // ratioも場合によっては必要かも？
  }

  /*
    pointOnTheLine(p, c, n, threshold=1e-9)
    pがcを通りnを法線ベクトルとする直線のどっち側にあるかを返す関数
    nの側にあれば1で反対側にあれば-1を返す
    閾値に関して線上にあるとみなされれば0を返す

    p5依存度：B（やや依存）
    p,c,nがそういうのになってるだけ
  */
  function pointOnTheLine(p, c, n, threshold=1e-9){
    const verticeValue=(p.x-c.x)*n.x+(p.y-c.y)*n.y;
    if(Math.abs(verticeValue)<threshold)return 0;
    return (verticeValue>0?1:-1);
  }

  /*
    pointOnThePlane(p, c, n, threshold = 1e-9)
    平面バージョン。仕様は同じ。

    p5依存度：B
  */
  function pointOnThePlane(p, c, n, threshold = 1e-9){
    // やることは簡単で、p-cとnで内積を取って符号を見るだけ。
    const verticeValue=(p.x-c.x)*n.x+(p.y-c.y)*n.y+(p.z-c.z)*n.z;
    if(Math.abs(verticeValue)<threshold)return 0;
    return (verticeValue>0?1:-1);
  }

  /*
    separateGeometry(geom, params = {})
    geom: p5.Geometryのオブジェクト
    params:
      c: カットする平面の中心
      n: カットする平面の法線ベクトル
      createBoundaryEdge: 境界の辺を作るかどうか。edgesが無い場合は関係ない
    geomの三角形をplaneでぶった切ってn側と反対側に分ける
    戻り値は配列[geom0,geom1]でgeom0がn側、geom1が反対側。
    vertexNormals, vertexColors, uvs, edgesがgeomに存在する場合、それらは境界で補間される。
    そのうち境界面も作れるようになるかもしれないし、ならないかもしれない...（難しい）

    p5依存度：A（かなり依存）
    uvsやedgesなどp5.Geometryの構造に大きく依存してるのでかなり移植が厄介
    PreGeometryクラスをどう定義するかによる
    その場合もuvsやedegsの列の長さで判定できるので...
    結局のところ
    p5.Geometryを「入れ物」としてしか扱っていないので、
    入れ物さえ用意できれば容易に移植できるし、
    その「入れ物」に独自にメソッドを付け加えれば処理を簡明にすることもできるかもしれないですね。
  */
  function separateGeometry(geom, params = {}){
    const {vertices, faces, vertexNormals = [], vertexColors = [], uvs = [], edges = []} = geom;
    const {c = createVector(), n = createVector(1,0,0), createBoundaryEdge = true} = params;
    const vertexObjectArray = [];

    // 補間用フラグ
    // edgesのも必要かもしれないけどそれはまあいいかとりあえず
    // 法線は補間した後で正規化する。注意点はほぼ無い。
    // 色の補間は難しいことを考えても仕方ないので単純にrgb補間でいいかと
    // uvも単純にlerpするだけ。それでいいですね。
    const useVertexNormals = (vertexNormals.length > 0);
    const useVertexColors = (vertexColors.length > 0);
    const useUvs = (uvs.length > 0);
    const useEdges = (edges.length > 0);

    const dummyNormal = createVector();

    // 必要ならvertexColorsなども反映されるようにする
    for(let i=0; i<vertices.length; i++){
      const v = vertices[i];
      const vNormal = (useVertexNormals ? vertexNormals[i] : dummyNormal);
      const vCol = (useVertexColors ? [
        vertexColors[4*i],vertexColors[4*i+1],vertexColors[4*i+2],vertexColors[4*i+3]
      ] : []);
      const vUv = (useUvs ? [uvs[2*i], uvs[2*i+1]] : []);
      const vertexValue = pointOnThePlane(vertices[i], c, n);
      if(vertexValue === 0){
        vertexObjectArray.push([
          {vertexValue:0, p:v.copy(), index:i, vN:vNormal, vC:vCol, vUv:vUv},
          {vertexValue:0, p:v.copy(), index:i, vN:vNormal, vC:vCol, vUv:vUv}
        ]);
      } else {
        const obj = {vertexValue:vertexValue, p:v.copy(), index:i, vN:vNormal, vC:vCol, vUv:vUv};
        if(vertexValue !== 0){
          obj.crossPair = []; // 辺の重複のない分断をするためのフラグ
          obj.edgePair = []; // もともとある辺の分断のためのフラグ
        }
        vertexObjectArray.push([obj]);
      }
    }

    // crossPairには相方のindexの他に新しく追加した頂点のindexも入れる必要がある
    // つまり長さ2の配列
    // すでに入っている場合、その頂点のオブジェクトを取得する必要があるので...
    // 1と-1の双方に入れよう。ややこしさ回避。

    // 三角形をサーチする
    const faceArray0 = [];
    const faceArray1 = [];
    // 辺用
    const edgeArray0 = [];
    const edgeArray1 = [];
    if (useEdges) {
      // edgesを走査してもともとの辺をvertexObjectに翻訳して分類する
      for(const e of edges){
        const obj0 = vertexObjectArray[e[0]];
        const obj1 = vertexObjectArray[e[1]];
        const vv0 = obj0[0].vertexValue;
        const vv1 = obj1[0].vertexValue;
        // 0がある場合、ひとつめが0側、ふたつめが1側という設定なので、
        // 入れる際は注意する。
        if(vv0===1&&vv1===1)edgeArray0.push([obj0[0], obj1[0]]);
        if(vv0===0&&vv1===1)edgeArray0.push([obj0[0], obj1[0]]);
        if(vv0===1&&vv1===0)edgeArray0.push([obj0[0], obj1[0]]);
        if(vv0===-1&&vv1===-1)edgeArray1.push([obj0[0], obj1[0]]);
        if(vv0===0&&vv1===-1)edgeArray1.push([obj0[1], obj1[0]]);
        if(vv0===-1&&vv1===0)edgeArray1.push([obj0[0], obj1[1]]);
        if(vv0===0&&vv1===0){
          // 0 0の辺はここで入れてしまうので漏れることはないが、
          // boundaryを面にする場合はちょっと面倒かもしれない
          edgeArray0.push([obj0[0], obj1[0]]);
          edgeArray1.push([obj0[1], obj1[1]]);
        }
        // 辺の分断に使う情報を登録
        if(vv0*vv1<0){
          obj0[0].edgePair.push(obj1[0].index);
          obj1[0].edgePair.push(obj0[0].index);
        }
      }
    }

    // v0とv1が付加情報を持っている場合も考慮しようということ（color,uv,normal,etc...）
    // targetIndexが0なら1,-1の順、1なら-1,1の順。この情報は辺の分断に使う。
    const getCrossPointObject = (targetIndex, v0, v1, c, n) => {
      // crossPointの生成過程をメソッド化
      let crossPoint;
      let crossPointIsAlreadyCreated = false;
      for(const pair of v0.crossPair){
        if(pair[0] === v1.index){
          crossPoint = vertexObjectArray[pair[1]]; // 長さ2の配列
          // targetIndex===0なら0,1の順、1なら逆。
          crossPointIsAlreadyCreated = true;
        }
      }
      if(!crossPointIsAlreadyCreated){
        const cp = getCrossPointWithPlaneFromTwoPoints(v0.p, v1.p, c, n);
        const cpIndex = vertexObjectArray.length;
        // vertexNormalの補間
        const lerpedNormal = (useVertexNormals ?
          p5.Vector.lerp(v0.vN, v1.vN, cp.ratio).normalize() : dummyNormal);
        // vertexColorの補間
        const lerpedVC = (useVertexColors ? [
          (1-cp.ratio)*v0.vC[0] + cp.ratio*v1.vC[0],
          (1-cp.ratio)*v0.vC[1] + cp.ratio*v1.vC[1],
          (1-cp.ratio)*v0.vC[2] + cp.ratio*v1.vC[2],
          (1-cp.ratio)*v0.vC[3] + cp.ratio*v1.vC[3]
        ] : []);
        // uvの補間
        const lerpedUV = (useUvs ? [
          (1-cp.ratio)*v0.vUv[0] + cp.ratio*v1.vUv[0],
          (1-cp.ratio)*v0.vUv[1] + cp.ratio*v1.vUv[1]
        ] : []);
        crossPoint = [
          {p:cp.p.copy(), index:cpIndex, vN:lerpedNormal, vC:lerpedVC, vUv:lerpedUV},
          {p:cp.p.copy(), index:cpIndex, vN:lerpedNormal, vC:lerpedVC, vUv:lerpedUV}
        ];
        vertexObjectArray.push(crossPoint);
        v0.crossPair.push([v1.index, cpIndex]);
        v1.crossPair.push([v0.index, cpIndex]);
        if(useEdges){
          for(const pairIndex of v0.edgePair){
            if(pairIndex === v1.index){
              // ごめんなさい配列で書いた方がいいですね
              // edgeArrays[0,1]とか？ですね。可読性は...犠牲になるけど。
              if(targetIndex===0){
                edgeArray0.push([v0, crossPoint[targetIndex]]);
                edgeArray1.push([v1, crossPoint[1-targetIndex]]);
              }else{
                edgeArray1.push([v0, crossPoint[targetIndex]]);
                edgeArray0.push([v1, crossPoint[1-targetIndex]]);
              }
            }
          }
        }
      }
      return crossPoint;
    }

    // targetIndexは0か1です。[1,-1,0]ケースなら0, [-1,1,0]ケースなら1
    const createSingleCrossPoint = (c, n, targetIndex, v0, v1, v2) => {
      // まずv0とv1の間に点を取る。取れます。で...
      // その前にcrossPairを見て、
      // それぞれv1またはv0のindexが入ってないか調べる
      // 入ってないならvertexObjectArrayに新しくそれを作る感じ
      // 1と-1の両方に入ってるので心配ない

      // めんどうなのでサブルーチン化
      const crossPoint = getCrossPointObject(targetIndex, v0, v1, c, n);
      const v3 = crossPoint[0];
      const v4 = crossPoint[1];

      // 1,-1,0ケースは[v0,v3,v2]と[v4,v1,v2]に分ける
      // -1,1,0ケースは[v1,v2,v3]と[v4,v2,v0]に分ける
      if(targetIndex===0){
        faceArray0.push([v0,v3,v2]);
        faceArray1.push([v4,v1,v2]);
        if(useEdges && createBoundaryEdge){
          edgeArray0.push([v2,v3]);
          edgeArray1.push([v4,v2]);
        }
      } else {
        faceArray0.push([v1,v2,v3]);
        faceArray1.push([v4,v2,v0]);
        if(useEdges && createBoundaryEdge){
          edgeArray0.push([v3,v2]);
          edgeArray1.push([v2,v4]);
        }
      }
    }

    // targetIndexは0か1です。[1,-1,1]ケースなら0, [-1,1,-1]ケースなら1
    const createDoubleCrossPoints = (c, n, targetIndex, v0, v1, v2) => {
      // 2つ辺がある。場合によっては両方とも生成済みの可能性がありややこしい。

      const crossPoint0 = getCrossPointObject(targetIndex, v0, v1, c, n);
      const v3 = crossPoint0[0];
      const v4 = crossPoint0[1];
      const crossPoint1 = getCrossPointObject(1-targetIndex, v1, v2, c, n);
      const v5 = crossPoint1[0];
      const v6 = crossPoint1[1];

      // あとは面倒な場合分けをするだけ。
      if(targetIndex===0){
        // 1,-1,1ケース
        // [0,3,2],[2,3,5] | [4,1,6]
        faceArray0.push([v0,v3,v2], [v2,v3,v5]);
        faceArray1.push([v4,v1,v6]);
        if(useEdges && createBoundaryEdge){
          // どっちでもいいんだが、
          // おそらくだけど三角形の辺の向きと逆にするとのちのち楽かもしれない
          edgeArray0.push([v5,v3]);
          edgeArray1.push([v4,v6]);
        }
      } else {
        // -1,1,-1ケース
        // [1,5,3] | [4,6,2],[4,2,0]
        faceArray0.push([v1,v5,v3]);
        faceArray1.push([v4,v6,v2],[v4,v2,v0]);
        if(useEdges && createBoundaryEdge){
          // どっちでもいいんだが、
          // おそらくだけど三角形の辺の向きと逆にするとのちのち楽かもしれない
          edgeArray0.push([v3,v5]);
          edgeArray1.push([v6,v4]);
        }
      }
    }

    for(let i=0; i<faces.length; i++){
      const f = faces[i];
      const v0 = vertexObjectArray[f[0]][0];
      const v1 = vertexObjectArray[f[1]][0];
      const v2 = vertexObjectArray[f[2]][0];
      // これらの値によっては並び替えを実行する
      // 主に6つ...
      // まず0側のみのケース（1,1,1 1,1,0 1,0,0）
      // 1側のみのケース（-1,-1,-1 -1,-1,0 -1,0,0）
      // 0と1にまたがるケースは並び替えにより次の4種類に分ける
      // [1,-1,0] [-1,1,0] [1,-1,1] [-1,1,-1]
      // それぞれについて処理する
      const vv0 = v0.vertexValue;
      const vv1 = v1.vertexValue;
      const vv2 = v2.vertexValue;
      const absSum = Math.abs(vv0)+Math.abs(vv1)+Math.abs(vv2);
      const sum = vv0+vv1+vv2;
      const sumAbs = Math.abs(sum);
      if(absSum === sumAbs){
        // 同符号
        if(sum>0){
          // 1 0 0はここ
          faceArray0.push([v0,v1,v2]); continue;
        } else if(sum<0){
          // -1 0 0はここ
          faceArray1.push([v0,v1,v2]); continue;
        } else {
          // 0 0 0はここ
          faceArray0.push([v0,v1,v2]);
          faceArray1.push([v0,v1,v2]); continue;
        }
      } else {
        // 1と-1が共存するケース
        // 並び替えで1,-1,0か-1,1,0か1,-1,1か-1,1,-1のケースに帰着させる
        // absSumは2か3で、それで分ける。
        if(absSum===2){
          // 0,1,-1  0,-1,1  1,0,-1  -1,0,1  1,-1,0   -1,1,0の6通り
          if(vv0===0&&vv1===1)createSingleCrossPoint(c,n,0,v1,v2,v0);
          if(vv0===0&&vv1===-1)createSingleCrossPoint(c,n,1,v1,v2,v0);
          if(vv1===0&&vv2===1)createSingleCrossPoint(c,n,0,v2,v0,v1);
          if(vv1===0&&vv2===-1)createSingleCrossPoint(c,n,1,v2,v0,v1);
          if(vv2===0&&vv0===1)createSingleCrossPoint(c,n,0,v0,v1,v2);
          if(vv2===0&&vv0===-1)createSingleCrossPoint(c,n,1,v0,v1,v2);
        }else{
          // 1,1,-1  1,-1,1  -1,1,1  -1,-1,1  -1,1,-1  1,-1,-1の6通り
          if(vv0===1&&vv1===1)createDoubleCrossPoints(c,n,0,v1,v2,v0);
          if(vv1===1&&vv2===1)createDoubleCrossPoints(c,n,0,v2,v0,v1);
          if(vv2===1&&vv0===1)createDoubleCrossPoints(c,n,0,v0,v1,v2);
          if(vv0===-1&&vv1===-1)createDoubleCrossPoints(c,n,1,v1,v2,v0);
          if(vv1===-1&&vv2===-1)createDoubleCrossPoints(c,n,1,v2,v0,v1);
          if(vv2===-1&&vv0===-1)createDoubleCrossPoints(c,n,1,v0,v1,v2);
        }
      }
    }
    // faceArray0とfaceArray1が完成したので
    // vertexObjectArray0とvertexObjectArray1に内容を分ける
    // もちろんcrossPointも0と1で分断される。つまり配列の長さで分ける。
    // 長さ1ならvertexValueに応じて1か-1なら0か1
    // 長さ2なら0番と1番をそのまま放り込む。
    const vertexObjectArray0 = [];
    const vertexObjectArray1 = [];
    for(let i=0; i<vertexObjectArray.length; i++){
      const vo = vertexObjectArray[i];
      if(vo.length===1){
        if(vo[0].vertexValue===1){
          vo[0].index = vertexObjectArray0.length;
          vertexObjectArray0.push(vo[0]);
        }
        if(vo[0].vertexValue===-1){
          vo[0].index = vertexObjectArray1.length;
          vertexObjectArray1.push(vo[0]);
        }
      }else{
        vo[0].index = vertexObjectArray0.length;
        vertexObjectArray0.push(vo[0]);
        vo[1].index = vertexObjectArray1.length;
        vertexObjectArray1.push(vo[1]);
      }
    }

    // 入れるとともに
    // indexを書き換えて通し番号にする
    // そして
    // faceの方でindexを参照しつつresultfaces0とresultFaces1を構成
    // 一方verticesの方も
    // resultVertices0とresultVertices1をpを参照しつつ構成

    const resultGeom0 = new p5.Geometry();
    const resultGeom1 = new p5.Geometry();

    for(const v of vertexObjectArray0){
      resultGeom0.vertices.push(v.p);
      if(useVertexNormals){
        resultGeom0.vertexNormals.push(v.vN);
      }
      if(useVertexColors){
        resultGeom0.vertexColors.push(...v.vC);
      }
      if(useUvs){
        resultGeom0.uvs.push(...v.vUv);
      }
    }
    for(const v of vertexObjectArray1){
      resultGeom1.vertices.push(v.p);
      if(useVertexNormals){
        resultGeom1.vertexNormals.push(v.vN);
      }
      if(useVertexColors){
        resultGeom1.vertexColors.push(...v.vC);
      }
      if(useUvs){
        resultGeom1.uvs.push(...v.vUv);
      }
    }

    for(const face of faceArray0){
      resultGeom0.faces.push([face[0].index, face[1].index, face[2].index]);
    }
    for(const face of faceArray1){
      resultGeom1.faces.push([face[0].index, face[1].index, face[2].index]);
    }
    // 場合によってはuvやvertexColorsも分割するかもしれない

    if(useEdges){
      for(const edge of edgeArray0){
        resultGeom0.edges.push([edge[0].index, edge[1].index]);
      }
      resultGeom0._edgesToVertices();
      for(const edge of edgeArray1){
        resultGeom1.edges.push([edge[0].index, edge[1].index]);
      }
      resultGeom1._edgesToVertices();
    }

    return [resultGeom0, resultGeom1];
  }

  /*
    subDivideGeometry(geom, params = {})
    geom: ジオメトリー
    params:
      c: カットに使う平面の中心
      n: 法線
      autoNormal: 法線を補間するかどうか。しない場合、computeNormalsで計算される。default:false
    法線は自動計算だと基本的に汚くなるのでやらない方がいいです。
    平面で分割して切れ目を入れる。ポリゴンはその面との交点を含むように分割される。
    これにより、ジオメトリーを曲げる際に不自然な崩壊が起きないようにできる。
    具体的には曲げる方向に応じて沢山分割したりなどといったことに使う。

    p5依存度：A（かなり依存）
    p5.Geometryは完全にただの入れ物です。以上です。
    PreGeometryを作ればいいですね。
  */
  function subDivideGeometry(geom, params = {}){
    const {vertices, faces, vertexNormals = [], vertexColors = [], uvs = [], edges = []} = geom;
    const {c = createVector(), n = createVector(1,0,0), autoNormal = false} = params;
    const vertexObjectArray = [];

    // 補間用フラグ
    // edgesのも必要かもしれないけどそれはまあいいかとりあえず
    // 法線は補間した後で正規化する。注意点はほぼ無い。
    // 色の補間は難しいことを考えても仕方ないので単純にrgb補間でいいかと
    // uvも単純にlerpするだけ。それでいいですね。
    const useVertexNormals = (vertexNormals.length > 0);
    const useVertexColors = (vertexColors.length > 0);
    const useUvs = (uvs.length > 0);
    const useEdges = (edges.length > 0);

    const dummyNormal = createVector();

    // 必要ならvertexColorsなども反映されるようにする
    for(let i=0; i<vertices.length; i++){
      const v = vertices[i];
      const vNormal = (useVertexNormals ? vertexNormals[i] : dummyNormal);

      const vCol = (useVertexColors ? [
        vertexColors[4*i],vertexColors[4*i+1],vertexColors[4*i+2],vertexColors[4*i+3]
      ] : []);
      const vUv = (useUvs ? [uvs[2*i], uvs[2*i+1]] : []);
      const vertexValue = pointOnThePlane(vertices[i], c, n);
      if(vertexValue === 0){
        vertexObjectArray.push([
          {vertexValue:0, p:v.copy(), index:i, vN:vNormal, vC:vCol, vUv:vUv},
          {vertexValue:0, p:v.copy(), index:i, vN:vNormal, vC:vCol, vUv:vUv}
        ]);
      } else {
        const obj = {vertexValue:vertexValue, p:v.copy(), index:i, vN:vNormal, vC:vCol, vUv:vUv};
        if(vertexValue !== 0){
          obj.crossPair = []; // 辺の重複のない分断をするためのフラグ
          obj.edgePair = []; // もともとある辺の分断のためのフラグ
        }
        vertexObjectArray.push([obj]);
      }
    }

    // crossPairには相方のindexの他に新しく追加した頂点のindexも入れる必要がある
    // つまり長さ2の配列
    // すでに入っている場合、その頂点のオブジェクトを取得する必要があるので...
    // 1と-1の双方に入れよう。ややこしさ回避。

    // 三角形をサーチする
    const faceArray0 = [];
    const faceArray1 = [];
    // 辺用
    const edgeArray0 = [];
    const edgeArray1 = [];
    if (useEdges) {
      // edgesを走査してもともとの辺をvertexObjectに翻訳して分類する
      for(const e of edges){
        const obj0 = vertexObjectArray[e[0]];
        const obj1 = vertexObjectArray[e[1]];
        const vv0 = obj0[0].vertexValue;
        const vv1 = obj1[0].vertexValue;
        // 0がある場合、ひとつめが0側、ふたつめが1側という設定なので、
        // 入れる際は注意する。
        if(vv0===1&&vv1===1)edgeArray0.push([obj0[0], obj1[0]]);
        if(vv0===0&&vv1===1)edgeArray0.push([obj0[0], obj1[0]]);
        if(vv0===1&&vv1===0)edgeArray0.push([obj0[0], obj1[0]]);
        if(vv0===-1&&vv1===-1)edgeArray1.push([obj0[0], obj1[0]]);
        if(vv0===0&&vv1===-1)edgeArray1.push([obj0[1], obj1[0]]);
        if(vv0===-1&&vv1===0)edgeArray1.push([obj0[0], obj1[1]]);
        if(vv0===0&&vv1===0){
          // 0 0の辺はここで入れてしまうので漏れることはないが、
          // boundaryを面にする場合はちょっと面倒かもしれない
          edgeArray0.push([obj0[0], obj1[0]]);
          // 重複辺は片方にだけ入れる
          //edgeArray1.push([obj0[1], obj1[1]]);
        }
        // 辺の分断に使う情報を登録
        if(vv0*vv1<0){
          obj0[0].edgePair.push(obj1[0].index);
          obj1[0].edgePair.push(obj0[0].index);
        }
      }
    }

    // v0とv1が付加情報を持っている場合も考慮しようということ（color,uv,normal,etc...）
    // targetIndexが0なら1,-1の順、1なら-1,1の順。この情報は辺の分断に使う。
    const getCrossPointObject = (targetIndex, v0, v1, c, n) => {
      // crossPointの生成過程をメソッド化
      let crossPoint;
      let crossPointIsAlreadyCreated = false;
      for(const pair of v0.crossPair){
        if(pair[0] === v1.index){
          crossPoint = vertexObjectArray[pair[1]]; // 長さ2の配列
          // targetIndex===0なら0,1の順、1なら逆。
          crossPointIsAlreadyCreated = true;
        }
      }
      if(!crossPointIsAlreadyCreated){
        const cp = getCrossPointWithPlaneFromTwoPoints(v0.p, v1.p, c, n);
        const cpIndex = vertexObjectArray.length;
        // vertexNormalの補間
        const lerpedNormal = (useVertexNormals && !autoNormal ?
          p5.Vector.lerp(v0.vN, v1.vN, cp.ratio).normalize() : dummyNormal);
        // vertexColorの補間
        const lerpedVC = (useVertexColors ? [
          (1-cp.ratio)*v0.vC[0] + cp.ratio*v1.vC[0],
          (1-cp.ratio)*v0.vC[1] + cp.ratio*v1.vC[1],
          (1-cp.ratio)*v0.vC[2] + cp.ratio*v1.vC[2],
          (1-cp.ratio)*v0.vC[3] + cp.ratio*v1.vC[3]
        ] : []);
        // uvの補間
        const lerpedUV = (useUvs ? [
          (1-cp.ratio)*v0.vUv[0] + cp.ratio*v1.vUv[0],
          (1-cp.ratio)*v0.vUv[1] + cp.ratio*v1.vUv[1]
        ] : []);
        crossPoint = [
          {p:cp.p.copy(), index:cpIndex, vN:lerpedNormal, vC:lerpedVC, vUv:lerpedUV},
          {p:cp.p.copy(), index:cpIndex, vN:lerpedNormal, vC:lerpedVC, vUv:lerpedUV}
        ];
        vertexObjectArray.push(crossPoint);
        v0.crossPair.push([v1.index, cpIndex]);
        v1.crossPair.push([v0.index, cpIndex]);
        if(useEdges){
          for(const pairIndex of v0.edgePair){
            if(pairIndex === v1.index){
              // ごめんなさい配列で書いた方がいいですね
              // edgeArrays[0,1]とか？ですね。可読性は...犠牲になるけど。
              if(targetIndex===0){
                edgeArray0.push([v0, crossPoint[targetIndex]]);
                edgeArray1.push([v1, crossPoint[1-targetIndex]]);
              }else{
                edgeArray1.push([v0, crossPoint[targetIndex]]);
                edgeArray0.push([v1, crossPoint[1-targetIndex]]);
              }
            }
          }
        }
      }
      return crossPoint;
    }

    // targetIndexは0か1です。[1,-1,0]ケースなら0, [-1,1,0]ケースなら1
    const createSingleCrossPoint = (c, n, targetIndex, v0, v1, v2) => {
      // まずv0とv1の間に点を取る。取れます。で...
      // その前にcrossPairを見て、
      // それぞれv1またはv0のindexが入ってないか調べる
      // 入ってないならvertexObjectArrayに新しくそれを作る感じ
      // 1と-1の両方に入ってるので心配ない

      // めんどうなのでサブルーチン化
      const crossPoint = getCrossPointObject(targetIndex, v0, v1, c, n);
      const v3 = crossPoint[0];
      const v4 = crossPoint[1];

      // 1,-1,0ケースは[v0,v3,v2]と[v4,v1,v2]に分ける
      // -1,1,0ケースは[v1,v2,v3]と[v4,v2,v0]に分ける
      // ここの辺は重複しているので片方にだけ入れる
      if(targetIndex===0){
        faceArray0.push([v0,v3,v2]);
        faceArray1.push([v4,v1,v2]);
        if(useEdges){
          edgeArray0.push([v2,v3]);
          //edgeArray1.push([v4,v2]);
        }
      } else {
        faceArray0.push([v1,v2,v3]);
        faceArray1.push([v4,v2,v0]);
        if(useEdges){
          edgeArray0.push([v3,v2]);
          //edgeArray1.push([v2,v4]);
        }
      }
    }

    // targetIndexは0か1です。[1,-1,1]ケースなら0, [-1,1,-1]ケースなら1
    const createDoubleCrossPoints = (c, n, targetIndex, v0, v1, v2) => {
      // 2つ辺がある。場合によっては両方とも生成済みの可能性がありややこしい。

      const crossPoint0 = getCrossPointObject(targetIndex, v0, v1, c, n);
      const v3 = crossPoint0[0];
      const v4 = crossPoint0[1];
      const crossPoint1 = getCrossPointObject(1-targetIndex, v1, v2, c, n);
      const v5 = crossPoint1[0];
      const v6 = crossPoint1[1];

      // あとは面倒な場合分けをするだけ。
      if(targetIndex===0){
        // 1,-1,1ケース
        // [0,3,2],[2,3,5] | [4,1,6]
        faceArray0.push([v0,v3,v2], [v2,v3,v5]);
        faceArray1.push([v4,v1,v6]);
        if(useEdges){
          // どっちでもいいんだが、
          // おそらくだけど三角形の辺の向きと逆にするとのちのち楽かもしれない
          edgeArray0.push([v5,v3]);
          //edgeArray1.push([v4,v6]);
        }
      } else {
        // -1,1,-1ケース
        // [1,5,3] | [4,6,2],[4,2,0]
        faceArray0.push([v1,v5,v3]);
        faceArray1.push([v4,v6,v2],[v4,v2,v0]);
        if(useEdges){
          // どっちでもいいんだが、
          // おそらくだけど三角形の辺の向きと逆にするとのちのち楽かもしれない
          edgeArray0.push([v3,v5]);
          //edgeArray1.push([v6,v4]);
        }
      }
    }

    for(let i=0; i<faces.length; i++){
      const f = faces[i];
      const v0 = vertexObjectArray[f[0]][0];
      const v1 = vertexObjectArray[f[1]][0];
      const v2 = vertexObjectArray[f[2]][0];
      // これらの値によっては並び替えを実行する
      // 主に6つ...
      // まず0側のみのケース（1,1,1 1,1,0 1,0,0）
      // 1側のみのケース（-1,-1,-1 -1,-1,0 -1,0,0）
      // 0と1にまたがるケースは並び替えにより次の4種類に分ける
      // [1,-1,0] [-1,1,0] [1,-1,1] [-1,1,-1]
      // それぞれについて処理する
      const vv0 = v0.vertexValue;
      const vv1 = v1.vertexValue;
      const vv2 = v2.vertexValue;
      const absSum = Math.abs(vv0)+Math.abs(vv1)+Math.abs(vv2);
      const sum = vv0+vv1+vv2;
      const sumAbs = Math.abs(sum);
      // ここで切断面に重なる三角形の辺はもともと存在しない場合
      // この細分でも用意されないので、
      // 重複覚悟でここで追加する
      // absSum===1の場合である
      // どうせnoStroke()なら重複しても何の害もない
      if(absSum===1){
        if(vv0!==0){edgeArray0.push([v1,v2]);}
        if(vv1!==0){edgeArray0.push([v2,v0]);}
        if(vv2!==0){edgeArray0.push([v0,v1]);}
      }
      if(absSum === sumAbs){
        // 同符号
        if(sum>0){
          // 1 0 0はここ
          faceArray0.push([v0,v1,v2]); continue;
        } else if(sum<0){
          // -1 0 0はここ
          faceArray1.push([v0,v1,v2]); continue;
        } else {
          // 0 0 0はここ
          faceArray0.push([v0,v1,v2]);
          //faceArray1.push([v0,v1,v2]);
          continue;
        }
      } else {
        // 1と-1が共存するケース
        // 並び替えで1,-1,0か-1,1,0か1,-1,1か-1,1,-1のケースに帰着させる
        // absSumは2か3で、それで分ける。
        if(absSum===2){
          // 0,1,-1  0,-1,1  1,0,-1  -1,0,1  1,-1,0   -1,1,0の6通り
          if(vv0===0&&vv1===1)createSingleCrossPoint(c,n,0,v1,v2,v0);
          if(vv0===0&&vv1===-1)createSingleCrossPoint(c,n,1,v1,v2,v0);
          if(vv1===0&&vv2===1)createSingleCrossPoint(c,n,0,v2,v0,v1);
          if(vv1===0&&vv2===-1)createSingleCrossPoint(c,n,1,v2,v0,v1);
          if(vv2===0&&vv0===1)createSingleCrossPoint(c,n,0,v0,v1,v2);
          if(vv2===0&&vv0===-1)createSingleCrossPoint(c,n,1,v0,v1,v2);
        }else{
          // 1,1,-1  1,-1,1  -1,1,1  -1,-1,1  -1,1,-1  1,-1,-1の6通り
          if(vv0===1&&vv1===1)createDoubleCrossPoints(c,n,0,v1,v2,v0);
          if(vv1===1&&vv2===1)createDoubleCrossPoints(c,n,0,v2,v0,v1);
          if(vv2===1&&vv0===1)createDoubleCrossPoints(c,n,0,v0,v1,v2);
          if(vv0===-1&&vv1===-1)createDoubleCrossPoints(c,n,1,v1,v2,v0);
          if(vv1===-1&&vv2===-1)createDoubleCrossPoints(c,n,1,v2,v0,v1);
          if(vv2===-1&&vv0===-1)createDoubleCrossPoints(c,n,1,v0,v1,v2);
        }
      }
    }

    // 今回は細分が目的なので
    // vertexObjectArrayからそのまま出しちゃえばOK
    geom.vertices.length = 0;
    if(useVertexNormals && !autoNormal) geom.vertexNormals.length = 0;
    if(useVertexColors) geom.vertexColors.length = 0;
    if(useUvs) geom.uvs.length = 0;

    for(let i=0; i<vertexObjectArray.length; i++){
      const vo = vertexObjectArray[i][0];
      geom.vertices.push(vo.p);
      // ここで法線や色やらuvやら処理してしまう
      if(useVertexNormals && !autoNormal){
        geom.vertexNormals.push(vo.vN);
      }
      if(useVertexColors){
        geom.vertexColors.push(...vo.vC);
      }
      if(useUvs){
        geom.uvs.push(...vo.vUv);
      }
    }

    // autoNormalの場合は法線計算
    if(useVertexNormals && autoNormal){
      geom.computeNormals();
    }

    // あとはfacesだが、indexをそのまま使って翻訳すればOK
    // edgesも。ただし両方からぶち込む。
    geom.faces.length = 0;
    for(const face of faceArray0){
      geom.faces.push([face[0].index, face[1].index, face[2].index]);
    }
    for(const face of faceArray1){
      geom.faces.push([face[0].index, face[1].index, face[2].index]);
    }
    if(useEdges){
      geom.edges.length = 0;
      for(const edge of edgeArray0){
        geom.edges.push([edge[0].index, edge[1].index]);
      }
      for(const edge of edgeArray1){
        geom.edges.push([edge[0].index, edge[1].index]);
      }
      geom._edgesToVertices();
    }
    // 戻り値は、無いです。
  }

  // utility関連（番外）

  /*
    hsv2rgb(h,s,v)
    HSV指定の色をrgbにする。
    出力はr,g,bに0～1の数が入ったオブジェクト。
    vertexColorsに使いたいなら、透明度の1を忘れないようにしないとコケる（何度もやらかした）

    hsv2rgbか
    rgb2hsvもあるといいかもしれない。最近作った。見ての通り、p5全く関係ないです。
  */
  // HSVをRGBにしてくれる関数. ただし0～1で指定してね
  function hsv2rgb(h, s, v){

    const clampFunction = (x, _min, _max) => Math.max(_min, Math.min(_max, x));

    h = clampFunction(h, 0, 1);
    s = clampFunction(s, 0, 1);
    v = clampFunction(v, 0, 1);
    let _r = clampFunction(Math.abs(((6 * h) % 6) - 3) - 1, 0, 1);
    let _g = clampFunction(Math.abs(((6 * h + 4) % 6) - 3) - 1, 0, 1);
    let _b = clampFunction(Math.abs(((6 * h + 2) % 6) - 3) - 1, 0, 1);
    _r = _r * _r * (3 - 2 * _r);
    _g = _g * _g * (3 - 2 * _g);
    _b = _b * _b * (3 - 2 * _b);
    const result = {};
    result.r = v * (1 - s + s * _r);
    result.g = v * (1 - s + s * _g);
    result.b = v * (1 - s + s * _b);
    return result;
  }

  /*
    以上
    それほど難しくないかも？
    ていうかまだ導入してない関数があってな
    それ導入する前にいろいろやっちゃいたいんだわ
    たとえば
    傘の描画で使ってるコンポジットとか
    トーラスノットで使ってるフルネセレ関連のあれこれとかが
    未導入なので
    それも入れられるといいですね
  */

  // utility.
  fisce.getUnionFind = getUnionFind;
  fisce.getIntersection = getIntersection;
  fisce.insideTriangle = insideTriangle;
  fisce.rotateByAxis = rotateByAxis;
  fisce.hsv2rgb = hsv2rgb;

  // 点列、テキストデータ操作関連
  fisce.parseCmdToText = parseCmdToText;
  fisce.parseData = parseData;
  fisce.mergePoints = mergePoints;
  fisce.mergePointsAll = mergePointsAll;
  fisce.evenlySpacing = evenlySpacing;
  fisce.evenlySpacingAll = evenlySpacingAll;
  fisce.quadBezierize = quadBezierize;
  fisce.quadBezierizeAll = quadBezierizeAll;
  fisce.getBoundingBoxOfContours = getBoundingBoxOfContours;
  fisce.alignmentContours = alignmentContours;
  fisce.getTextContours = getTextContours;
  fisce.getTextDrawingData = getTextDrawingData;
  fisce.getSVGContours = getSVGContours;

  // tessellation.
  fisce.createDisjointPaths = createDisjointPaths;
  fisce.cyclesToCycles = cyclesToCycles;
  fisce.executeEarcut = executeEarcut;

  // geometry.
  fisce.createPlaneMeshFromCycles = createPlaneMeshFromCycles;
  fisce.createBoardMeshFromCycles = createBoardMeshFromCycles;
  fisce.getBoundingBoxOfGeometry = getBoundingBoxOfGeometry;
  fisce.separateGeometry = separateGeometry;
  fisce.subDivideGeometry = subDivideGeometry

  return fisce;
})();

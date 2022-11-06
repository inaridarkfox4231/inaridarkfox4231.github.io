// --------------------------- //
// まず、...
// うまくいくんかいな。まあ別に死ぬわけじゃないし。死にかけたし。気楽にやろ。死ぬことが無いなら何でもできる。

// まるごと移してしまえ。えいっ
// でもってalphaをtrueで上書き。えいっ（どうなっても知らないよ...）
p5.RendererGL.prototype._setAttributeDefaults = function(pInst) {
  // See issue #3850, safer to enable AA in Safari
  var applyAA = navigator.userAgent.toLowerCase().includes('safari');
  var defaults = {
    alpha: true, // ここ。いいのかなあ...
    depth: true,
    stencil: true,
    antialias: applyAA,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true // perPixelLightingはp5.jsの話だそうなのでカット
  };

  if (pInst._glAttributes === null) {
    pInst._glAttributes = defaults;
  } else {
    pInst._glAttributes = Object.assign(defaults, pInst._glAttributes);
  }
  return;
};

// その前に卍解やっとこう。ばん！かい！webgl2を有効化します。
p5.RendererGL.prototype._initContext = function() {
  try {
    this.drawingContext =
      this.canvas.getContext('webgl2', this._pInst._glAttributes) ||
      this.canvas.getContext('experimental-webgl', this._pInst._glAttributes);
    if (this.drawingContext === null) {
      throw new Error('Error creating webgl context');
    } else {
      var gl = this.drawingContext;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._viewport = this.drawingContext.getParameter(
        this.drawingContext.VIEWPORT
      );
    }
  } catch (er) {
    throw er;
  }
};

// これがp5webglのexです。
// glからRenderNodeを生成します。glです。(2022/10/02)
const p5wgex = (function(){

  // ---------------------------------------------------------------------------------------------- //
  // utility.

  // HSVをRGBにしてくれる関数. ただし0～1で指定してね
  function hsv2rgb(h, s, v){
    h = constrain(h, 0, 1);
    s = constrain(s, 0, 1);
    v = constrain(v, 0, 1);
    let _r = constrain(abs(((6 * h) % 6) - 3) - 1, 0, 1);
    let _g = constrain(abs(((6 * h + 4) % 6) - 3) - 1, 0, 1);
    let _b = constrain(abs(((6 * h + 2) % 6) - 3) - 1, 0, 1);
    _r = _r * _r * (3 - 2 * _r);
    _g = _g * _g * (3 - 2 * _g);
    _b = _b * _b * (3 - 2 * _b);
    let result = {};
    result.r = v * (1 - s + s * _r);
    result.g = v * (1 - s + s * _g);
    result.b = v * (1 - s + s * _b);
    return result;
  }

  // 直接配列の形で返したい場合はこちら
  function hsvArray(h, s, v){
    const obj = _HSV(h, s, v);
    return [obj.r, obj.g, obj.b];
  }

  // colがconfig経由の値の場合、それを正しく解釈できるようにするための関数.
  // 戻り値は0～255指定。なのでお手数ですが255で割ってください。
  function getProperColor(col){
    if(typeof(col) === "object"){
      return {r:col.r, g:col.g, b:col.b};
    }else if(typeof(col) === "string"){
      col = color(col);
      return {r:red(col), g:green(col), b:blue(col)};
    }
    return {r:255, g:255, b:255};
  }

  // ---------------------------------------------------------------------------------------------- //
  // Timer.

  // stumpの概念を有するタイマー。デフォルトスタンプを持って初期化出来る。常に最後に発火したタイミングを保持
  // しておりそこに到達するたびにそのタイミングを更新しつつtrueを返す。
  // 上位互換になるな...Timerは廃止かもしれない（え？）
  // たとえばscaleに1000/60を指定すれば...っていう感じなので。
  // 関数を設定してもいいんだけどtargetとかfuncNameとか引数とかややこしいので勝手にやってくれって感じ...
  // 従来通り使うなら普通にinitialize(name)でいいしsetで現在時刻登録されるしgetDeltaで秒数、
  // fps欲しいなら1000/60をスケールに設定、そんなところ。

  // なんとポーズ機能が無いことに気付いたので実装します。内容的にはpauseしたタイミングを記録しておいて
  // 終わったら停止していた時間の分をstumpに加えます。なお停止中に問い合わせがあった場合その時間から
  // pauseTimeを引いた分をstumpに加算して計算する...と思う。つまりどんなに時間が経過してもその分引く数も
  // 大きくなることで停止中であることを表現する...というわけ。getDeltaMillisだけ書き換えればいい(pauseで分岐処理)
  // getDeltaMillisの結果を、pauseの場合にlastPause-stumpにすれば良さそう。
  class Timer{
    constructor(){
      this.timers = {};
    }
    initialize(keyName, info = {}){
      if(info.stump === undefined){ info.stump = window.performance.now(); } // 未定義の場合は現在の時刻
      if(info.duration === undefined){ info.duration = Infinity; } // 未定義の場合は無限
      if(info.scale === undefined){ info.scale = 1000; } // 返すときに何かで割りたいときにどうぞ。未定義の場合は1000.
      // なぜならほとんどの場合秒数として使用するので（メトロノームなどの場合は具体的に指定するだろう）
      // 最後に発火したタイミングと、次の発火までの時間間隔(duration)を設定（Infinityの場合は間隔を用意しない感じで）
      this.timers[keyName] = {stump:info.stump, duration:info.duration, scale:info.scale, pause:false, lastPause:info.stump};
    }
    validateKeyName(keyName, methodName){
      if(this.timers[keyName] === undefined){
        window.alert(methodName + " failure: invalid name.");
        return null;
      }
      return true;
    }
    set(keyName, duration){
      // 意図的にstumpの値を現在の時刻にすることで、こちらで何かあってからの経過時間を計測する、
      // 従来の使い方もできるようにしよう。また、initializeされてない場合はエラーを返すようにする。
      if(!this.validateKeyName(keyName, "set")){ return; }
      this.timers[keyName].stump = window.performance.now();
      // durationを決めることでcheckで一定時間ごとの処理ができるようになるね。
      if(duration !== undefined){ this.timers[keyName].duration = duration; }
    }
    getDelta(keyName){
      // 最後に発火してからの経過時間をscaleで割った値を返す感じ。
      // こっちの方が基本的に使用されるのでこれをgetDeltaとした。
      if(!this.validateKeyName(keyName, "getDelta")){ return null; }
      const _timer = this.timers[keyName];
      return this.getDeltaMillis(keyName) / _timer.scale;
    }
    getProgress(keyName){
      // stumpからの経過時間をdurationで割ることで進捗を調べるのに使う感じ
      if(!this.validateKeyName(keyName, "getProgress")){ return null; }
      const _timer = this.timers[keyName];
      if(_timer.duration > 0){
        return Math.min(1, this.getDeltaMillis(keyName) / _timer.duration);
      }
      return 1; // durationが0の場合...つまり無限大ということ。
    }
    getDeltaMillis(keyName){
      // 最後に発火してからの経過時間を生のミリ秒表示で取得する。使い道は検討中。
      if(!this.validateKeyName(keyName, "getDeltaMillis")){ return null; }
      const _timer = this.timers[keyName];
      if(_timer.pause){
        return _timer.lastPause - _timer.stump; // 最後に停止するまでの時間
      }
      return window.performance.now() - _timer.stump; // 普通に現在までの時間
    }
    getDeltaDiscrete(keyName, interval = 1000, modulo = 1){
      // deltaをintervalで割ってfloorした結果を返す。
      // moduloが1より大きい場合はそれで%を取る。1の場合はそのまま整数を返す。
      // たとえば250であれば0,1,2,3,...と1秒に4増えるし、moduloを4にすれば0,1,2,3,0,1,2,3,...となるわけ。
      if(!this.validateKeyName(keyName, "getDeltaDiscrete")){ return null; }
      const _delta = this.getDeltaMillis(keyName);
      const n = Math.floor(_delta / interval);
      if(modulo > 1){
        return n % modulo;
      }
      return n;
    }
    check(keyName, nextDuration){
      // durationを経過時間が越えたらstumpを更新する
      // nextDurationは未定義なら同じ値を継続
      // 毎回違うでもいい、自由に決められるようにする。
      if(!this.validateKeyName(keyName, "check")){ return false; }
      const _timer = this.timers[keyName];
      const elapsedTime = this.getDeltaMillis(keyName);
      if(elapsedTime > _timer.duration){
        _timer.stump += _timer.duration;
        if(nextDuration !== undefined){
          _timer.duration = nextDuration;
        }
        return true;
      }
      return false;
    }
    pause(keyName){
      if(!this.validateKeyName(keyName, "pause")){ return; }
      const _timer = this.timers[keyName];
      if(_timer.pause){ return; } // 重ね掛け回避
      _timer.pause = true;
      _timer.lastPause = window.performance.now();
    }
    reStart(keyName){
      if(!this.validateKeyName(keyName, "reStart")){ return; }
      const _timer = this.timers[keyName];
      if(!_timer.pause){ return; } // 重ね掛け回避
      _timer.pause = false;
      _timer.stump += window.performance.now() - _timer.lastPause;
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
    return d;
  }

  // ---------------------------------------------------------------------------------------------- //
  // utility for RenderNode.

  // シェーダーを作る
  function _getShader(name, gl, source, type){
    if(type !== "vs" && type !== "fs"){
      window.alert("invalid type");
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
      window.alert("name: " + name + ", " + type + ", compile failure.");
      return null;
    }

    return _shader;
  }

  // プログラムを作る
  function _getProgram(name, gl, sourceV, sourceF){
    const vShader = _getShader(name, gl, sourceV, "vs");
    const fShader = _getShader(name, gl, sourceF, "fs");

    // プログラムの作成
    let _program = gl.createProgram();
    // シェーダーにアタッチ → リンク (transform feedbackの場合は片方だけでいい？要検証)
    gl.attachShader(_program, vShader);
    gl.attachShader(_program, fShader);
    gl.linkProgram(_program);

    // 結果のチェック
    if(!gl.getProgramParameter(_program, gl.LINK_STATUS)){
      window.alert('Could not initialize shaders');
      window.alert("name: " + name + ", program link failure.");
      return null;
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
    const uniforms = {};
    // ユニフォームを格納していく
    let samplerIndex = 0; // サンプラのインデックスはシェーダー内で0ベースで異なってればOK, を検証してみる。
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
      if(uniform.type === gl.SAMPLER_2D){
        uniform.samplerIndex = samplerIndex++; // 名前からアクセスして...setTextureで使う
      }
      // isArrayの情報...は、いいや。普通に書く。それで問題が生じないか見る。
      uniforms[name] = uniform;
    }
    uniforms.maxSamplerIndex = samplerIndex; // samplerIndexの上限を取得して格納する
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
          gl.uniform1fv(location, data.map((value) => (value ? 1 : 0))); break;
        }else{
          if(data === true){ gl.uniform1i(location, 1); }else{ gl.uniform1i(location, 0); } break;
        }
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

  // attrの構成例：{name:"aPosition", size:2, data:[-1,-1,-1,1,1,-1,1,1], usage:"static_draw"}
  // ああそうか隠蔽するからこうしないとまずいわ...修正しないと。"static"とか。
  // usage指定：static_draw, dynamic_drawなど。
  function _createVBO(gl, attr, dict){
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
    };
  }

  // vba生成関数。そのうちね...vbo保持する必要がなくなるのでstatic_draw前提なのよね。
  // だからstatic指定の場合にvba使うように誘導する方がいいかもしれない。とはいえどうせ隠蔽されるのであんま意味ないけどね...
  function _createVBA(gl, attrs, dict){
    /* please wait... */
  }

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
    // textureType. "ubyte", "half_float", "float"で指定
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
      info.magFilter = info.minFilter = "nearest";
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
    //if(info.wrap === undefined){ info.wrap = "clamp"; }
    // mipmapはデフォルトfalseで。一応後から作れるようにしといた（null引数だと作られ無さそだし、実際作れないだろ。）
    if(info.mipmap === undefined){ info.mipmap = false; }
    // srcがnullでない場合に限りwとhは未定義でもOK
    if(info.src !== undefined){
      const td = _getTextureDataFromSrc(info.src); // テクスチャデータから設定されるようにする。理由：めんどくさいから！！
      if(info.w === undefined){ info.w = td.width; }
      if(info.h === undefined){ info.h = td.height; }
    }
  }

  // info.srcが用意されてないならnullを返す。一種のバリデーション。
  function _getTextureDataFromSrc(src){
    if(src === undefined){ return null; }
    if(src instanceof Uint8Array || src instanceof Float32Array){ return src; }
    if(src instanceof HTMLImageElement){ return src; }
    if(src instanceof p5.Graphics){ return src.elt; }
    if(src instanceof p5.Image){ return src.canvas; }
    window.alert("sorry, I don't know how to.");
    return null;
  }

  // dictも要るね。
  function _createTexture(gl, info, dict){
    // _validateForTexture(info); // 単独の場合は事前に済ます
    const data = _getTextureDataFromSrc(info.src);
    // テクスチャを生成する
    let tex = gl.createTexture();
    // テクスチャをバインド
    gl.bindTexture(gl.TEXTURE_2D, tex);

    // テクスチャにメモリ領域を確保
    gl.texImage2D(gl.TEXTURE_2D, 0, dict[info.internalFormat], info.w, info.h, 0,
                  dict[info.format], dict[info.type], data);
    // mipmapの作成はどうも失敗してるみたいです。原因は調査中。とりあえず使わないで。
    if(info.mipmap){ gl.generateMipmap(gl.TEXTURE_2D); }

    // テクスチャのフィルタ設定（サンプリングの仕方を決める）
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, dict[info.magFilter]); // 拡大表示用
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, dict[info.minFilter]); // 縮小表示用
    // テクスチャのラッピング設定（範囲外のUV値に対する挙動を決める）
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, dict[info.sWrap]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, dict[info.tWrap]);
    // テクスチャのバインドを解除
    gl.bindTexture(gl.TEXTURE_2D, null);
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
        // テクスチャの関連付け
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
      _connectWithFramebuffer(gl, gl.COLOR_ATTACHMENT0, info.color.attachType, colorBuffer);
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
    result.double = false;
    return result;
  }

  // テクスチャはクラスにするつもり。もう少々お待ちを...canvas要素から生成できるように作るつもり。

  // fboのダブル。TFFとは違うのよね。フレームの別の場所参照できるから。そこが異なるようです。
  // validateの重ね掛けは問題ないので、そのままぶちこめ。
  function _createDoubleFBO(gl, info, dict){
    let fbo0 = _createFBO(gl, info, dict);
    let fbo1 = _createFBO(gl, info, dict);
    return {
      read: fbo0,
      write: fbo1,
      swap: function(){
        let tmp = this.read;
        this.read = this.write;
        this.write = tmp;
      },
      name: info.name, w: info.w, h: info.h, double: true, // texelSizeこれが持つ必要ないな。カット。wとhはbindで使うので残す。
      MRT:false,
    }
    // infoの役割終了
  }

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
  class TextureEx{
    constructor(gl, info, dict){
      this.gl = gl;
      this.dict = dict;
      this.name = info.name;
      this.src = info.src; // ソース。p5.Graphicsの場合これを使って...
      _validateForTexture(info); // _createTexture内部ではやらないことになった
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
      const {gl} = this;
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.generateMipmap();
      gl.bindTexture(gl.TEXTURE_2D,null);
    }
    setFilterParam(param = {}){
      const {gl, dict} = this;
      if(param.magFilter !== undefined){ this.filterParam.magFilter = param.magFilter; }
      if(param.minFilter !== undefined){ this.filterParam.minFilter = param.minFilter; }
      // フィルタ設定関数
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, dict[this.filterParam.magFilter]); // 拡大表示用
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, dict[this.filterParam.minFilter]); // 縮小表示用
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    setWrapParam(param = {}){
      const {gl, dict} = this;
      if(param.sWrap !== undefined){ this.wrapParam.sWrap = param.sWrap; }
      if(param.tWrap !== undefined){ this.wrapParam.tWrap = param.tWrap; }
      // ラッピング設定関数
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, dict[this.wrapParam.sWrap]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, dict[this.wrapParam.tWrap]);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    getTextureSource(){
      // Source取得関数。主にp5の2D用。
      return this.src;
    }
    updateTexture(){
      const {gl, dict} = this;
      // texSubImage2Dを使って内容を上書きする。主にp5の2D用。
      const data = _getTextureDataFromSrc(this.src);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, dict[this.formatParam.internalFormat], this.w, this.h, 0,
                    dict[this.formatParam.format], dict[this.formatParam.type], data);
      gl.bindTexture(gl.TEXTURE_2D, null);
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
    divide(a, b, c){
      const r = _getValidation(a, b, c, 1); // 割り算のデフォも1でしょう
      if(r.x === 0.0 || r.y === 0.0 || r.z === 0.0){
        window.alert("Vec3 divide: zero division error!");
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
      // GLSL内部の計算に準拠して0,1,2で左、3,4,5で中央、6,7,8で右の列。それを自身を列ベクトルとみなして
      // それに掛けているイメージですね。迷ったらvを(0,0,1)にしましょう。理屈はちゃんとあります（クォータニオン）
      this.multMat([
        s*a*a + t,   s*a*b + u*c, s*a*c - u*b,
        s*a*b - u*c, s*b*b + t,   s*b*c + u*a,
        s*a*c + u*b, s*b*c - u*a, s*c*c + t
      ]);
      return this;
      // OK??
    }
    normalize(){
      const L = this.mag();
      if(L == 0.0){
        window.alert("Vec3 normalize: zero division error!");
        return null;
      }
      this.divide(L);
      return this;
    }
    multMat(m){
      // mは3x3行列を模した長さ9の配列、成分の並びは縦。つまり0,1,2で列ベクトル1で、3,4,5で列ベクトル2で、
      // 6,7,8で列ベクトル3という、これを縦に並んだthis.x,this.y,this.zに掛け算するイメージ。です。
      if(m === undefined){
        // 一応未定義の時のために単位行列おいとくか
        m = new Array(9);
        m[0] = 1; m[1] = 0; m[2] = 0;
        m[3] = 0; m[4] = 1; m[5] = 0;
        m[6] = 0; m[7] = 0; m[8] = 1;
      }
      const {x:a, y:b, z:c} = this;
      this.x = m[0] * a + m[3] * b + m[6] * c;
      this.y = m[1] * a + m[4] * b + m[7] * c;
      this.z = m[2] * a + m[5] * b + m[8] * c;
      return this;
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
    constructor(gl, name, vs, fs){
      this.gl = gl;
      this.name = name;
      this.program = _getProgram(name, this.gl, vs, fs); // プログラムだけでいいのよね
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
    setTexture2D(name, _texture){
      const gl = this.gl;
      const uniform = this.uniforms[name];
      // activateする番号とuniform1iで登録する番号は一致しており、かつsamplerごとに異なる必要があるということ
      gl.activeTexture(gl.TEXTURE0 + uniform.samplerIndex);
      gl.bindTexture(gl.TEXTURE_2D, _texture);
      gl.uniform1i(uniform.location, uniform.samplerIndex);
    }
    unbindTexture2D(){
      // 2Dや3Dのテクスチャがbindされていたら解除(今は2D only.)
      // maxSamplerIndexでサンプラーインデックスの上限が分かる
      // そこまでのすべてのtextureUnitの中身をからっぽにする（従来の処理ではひとつしかnullにできなかった）
      for(let i=0; i<this.uniforms.maxSamplerIndex; i++){
        this.gl.activeTexture(this.gl.TEXTURE0 + i);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // defaultPainter.
  // まあ、なんかあった方がいいよね。

  function _validateForView(view, align = "left_top"){
    // viewをいじって左下ベースにする。この処理は汎用的かもしれない。
    const alignText = align.split("_");
    const xAlign = alignText[0];
    const yAlign = alignText[1];
    const {x, y, w, h} = view;
    switch(xAlign){
      case "left": view.x = x; break;
      case "right": view.x = x-w; break;
      case "center": view.x = x-w/2; break;
    }
    switch(yAlign){
      case "top": view.y = 1-y-h; break;
      case "bottom": view.y = 1-y; break;
      case "center": view.y = 1-y-h/2; break;
    }
  }

  function _validateForSrc(info = {}){
    // textureかframebufferか。
    if(info.type === undefined){
      info.type = "tex";
    }
    // flipはtextureの場合trueでframebufferの場合falseが基本
    if(info.flip === undefined){
      if(info.type === "tex"){ info.flip = true; }
      else if(info.type === "fb"){ info.flip = false; }
      else{ window.alert("validateForCopySrcInfo error: invalid type."); return; }
    }
    // align.
    if(info.align === undefined){
      info.align = "left_top";
    }
    // view.
    if(info.view === undefined){
      info.view = {x:0, y:0, w:1, h:1};
    }else if(Array.isArray(info.view)){
      // 配列でも指定できた方がいいよねぇ
      info.view = {x:info.view[0], y:info.view[1], w:info.view[2], h:info.view[3]};
    }
    // 汎用処理。左下ベースにする。
    _validateForView(info.view, info.align);

    // opacity. sourceColor計算後にaに掛ける。
    if(info.opacity === undefined){ info.opacity = 1; }
    // tintとambient.
    if(info.tint === undefined){ info.tint = [1,1,1]; }
    if(info.ambient === undefined){ info.ambient = [0,0,0]; }
    // uvShift. uvをずらしたい場合。textureはmirrorやrepeatを付けておかないとね。
    if(info.uvShift === undefined){ info.uvShift = [0,0]; }
    // gradationStart. グラデーションのスタート。デフォは(0,0,0,0,0).
    // (u,v,r,g,b)で、(u,v)が起点となる。(r,g,b)から変化していく。
    // gradationStop. グラデーションのストップ。デフォは(1,1,0,0,0).
    // (u,v,r,g,b)で、(u,v)が終点となる。(r,g,b)で終わる。smoothstepを使う。
    if(info.gradationFlag === undefined){ info.gradationFlag = 0; } // none.
    if(info.gradationStart === undefined){ info.gradationStart = [0,0,0,0,0,0]; }
    if(info.gradationStop === undefined){ info.gradationStop = [0,0,0,0,0,0]; }

    // attachとcolorはfbの場合。indexはMRTの場合。
    if(info.type === "fb"){
      // fbのcolor, depth, stencilのどれを使うか、colorであればindexはどれか、を指定。depthが見たいのよね。
      if(info.attach === undefined){ info.attach = "color"; }
      if(info.attach === "color"){
        if(info.index === undefined){ info.index = 0; } // たとえばindexだけ指定するような場合「attach:"color"」は不要。
      }
    }
  }

  function _validateForCopy(info = {}){
    if(info.dst === undefined){
      info.dst = {type:null};
    }
    if(info.dst.type === "fb" && info.dst.name === undefined){
      window.alert("validateForCopy error: invalid fbo name.");
      return;
    }
    // 外側のviewでは描画範囲のviewportを指定する...これもできた方がいいと思うので。
    if(info.view === undefined){
      info.view = [0, 0, 1, 1]; // （左上指定）
    }
    // blendは基本trueでsrc_alphaとone_minus_src_alphaで上から貼り付ける感じで使います
    // falseにする場合もある。floatの場合とか。使うか知らないけど。floatだと切らないといろいろまずい。
    if(info.blend === undefined){
      info.blend = true;
    }
    // まあ使い方によっては乗算とかね。使うのか知らんけど。
    if(info.blend === true && info.blendFunc === undefined){
      info.blendFunc = {src:"src_alpha", dst:"one_minus_src_alpha"};
    }
    // depthOffは板ポリ描画の際は常に切るようにするか～ていうかblendが機能する場合これは常に切るんよね（本来）
    // 重ねることができるのはLEQUALだから。同じ場合は上書きする。LESSだと上書きできない。p5.jsの厚意。
    if(info.depthOff === undefined){
      info.depthOff = true;
    }
    // info.srcは一つの場合でも配列化する。
    if(Array.isArray(info.src)){
      for(let srcInfo of info.src){
        // 長くなるので別立て。
        _validateForSrc(srcInfo);
      }
    }else{
      _validateForSrc(info.src); // 戻り値はないので...
      info.src = [info.src]; // まあ、infoを返してもいいんだけどね。今更統一できないので。
    }
    // 以上。swapはメインコードで。
  }

  // copy.
  function getCopyShaders(){
    // flipとviewを配列にして渡す。あとはシェーダの仕事。
    const vs =
    `#version 300 es
    in float aIndex;
    in vec2 aUv;
    uniform bool uFlips[8];
    uniform vec4 uViews[8];
    uniform float uOpacity[8];
    uniform vec3 uTint[8];
    uniform vec3 uAmbient[8];
    uniform vec2 uUvShift[8];
    uniform int uGradationFlag[8];
    uniform vec4 uGradationAnchor[8];
    uniform vec4 uStartColor[8];
    uniform vec4 uStopColor[8];
    out vec2 vUv;
    flat out int vIndex; // indexBufferで書き直したらflatでいけました。
    out float vOpacity;
    out vec3 vTint;
    out vec3 vAmbient;
    flat out int vGradationFlag;
    out vec4 vGradationAnchor;
    out vec4 vStartColor;
    out vec4 vStopColor;
    void main(){
      int index = int(aIndex / 4.0);
      //int index = int(boardIndex);
      bool flip = uFlips[index];
      vec4 view = uViews[index];
      float pointIndex = mod(aIndex, 4.0);
      vec2 p;
      // -1.0～1.0ベースで考えるんだっけね...つまり2倍して1を引く。
      p.x = view.x + (mod(pointIndex, 2.0) == 0.0 ? 0.0 : view.z);
      p.y = view.y + (floor(pointIndex / 2.0) == 0.0 ? 0.0 : view.w);
      p.x = 2.0 * p.x - 1.0;
      p.y = 2.0 * p.y - 1.0;
      if(flip){
        vUv = vec2(aUv.x, 1.0 - aUv.y);
      }else{
        vUv = aUv;
      }
      vUv -= uUvShift[index]; // uvをshiftさせる場合。マイナスするのはいわゆる「平行移動の原理」ってやつ。
      gl_Position = vec4(p, 0.0, 1.0);
      vIndex = int(index);
      vOpacity = uOpacity[index];
      vTint = uTint[index];
      vAmbient = uAmbient[index];
      vGradationFlag = uGradationFlag[index];
      vGradationAnchor = uGradationAnchor[index];
      vStartColor = uStartColor[index];
      vStopColor = uStopColor[index];
    }
    `;
    // テクスチャを配列にするのはめんどくさい処理なので直書きでOKです。
    const fs =
    `#version 300 es
    precision mediump float;
    in vec2 vUv;
    flat in int vIndex;
    in float vOpacity;
    in vec3 vTint;
    in vec3 vAmbient;
    flat in int vGradationFlag;
    in vec4 vGradationAnchor;
    in vec4 vStartColor;
    in vec4 vStopColor;
    const int LINEAR_GRADIENT = 1;
    const int RADIAL_GRADIENT = 2;
    uniform sampler2D uTex0;
    uniform sampler2D uTex1;
    uniform sampler2D uTex2;
    uniform sampler2D uTex3;
    uniform sampler2D uTex4;
    uniform sampler2D uTex5;
    uniform sampler2D uTex6;
    uniform sampler2D uTex7;
    out vec4 fragColor;
    // 線形グラデーション
    void applyLinearGradient(in vec2 p, inout vec4 result){
      vec2 start = vGradationAnchor.xy;
      vec2 stop = vGradationAnchor.zw;
      vec2 n = normalize(stop - start);
      float ratio = clamp(dot(p-start, n) / length(stop - start), 0.0, 1.0);
      vec4 gradColor = (1.0-ratio)*vStartColor + ratio*vStopColor;
      // アルファブレンディング、やっぱこっちのが正解っぽいな。テキストが汚くなる。
      result = result.a * result + (1.0 - result.a) * gradColor;
    }
    // 放射状グラデーション
    void applyRadialGradient(in vec2 p, inout vec4 result){
      vec2 start = vGradationAnchor.xy;
      vec2 stop = vGradationAnchor.zw;
      float ratio = clamp(length(p - start)/length(stop - start), 0.0, 1.0);
      vec4 gradColor = (1.0-ratio)*vStartColor + ratio*vStopColor;
      result = result.a * result + (1.0 - result.a) * gradColor;
    }
    // メイン
    void main(){
      //int i = vBoardIndex;
      vec4 result;
      if(vIndex == 0){ result = texture(uTex0, vUv); }
      if(vIndex == 1){ result = texture(uTex1, vUv); }
      if(vIndex == 2){ result = texture(uTex2, vUv); }
      if(vIndex == 3){ result = texture(uTex3, vUv); }
      if(vIndex == 4){ result = texture(uTex4, vUv); }
      if(vIndex == 5){ result = texture(uTex5, vUv); }
      if(vIndex == 6){ result = texture(uTex6, vUv); }
      if(vIndex == 7){ result = texture(uTex7, vUv); }
      result.a *= vOpacity;
      if(vGradationFlag == LINEAR_GRADIENT){ applyLinearGradient(vUv, result); }
      if(vGradationFlag == RADIAL_GRADIENT){ applyRadialGradient(vUv, result); }
      result.rgb *= vTint;
      result.rgb += vAmbient;
      if(result.a < 0.001){ discard; }
      fragColor = result;
    }
    `;
    return {v:vs, f:fs};
  }

  // infoの仕様(example)
  // swapはnodeが要るのでここで判断に入れるのはやめよう
  // {dst:{type:null/"fb", name:dstName},
  //  src:{type:"tex"/"fb", name:srcName, flip:true/false(typeによりデフォ分岐),
  //       view:[0,0,0.5,0.5], align:"left_top" ,attach:"color", index:0},
  //  blend:true/false, blendFunc:{src:"src_alpha", dst:"one_minus_src_alpha"}, depthOff:false/true}

  // 第一弾。copyPainter.（苦労したぜ...）
  // info.dstで描画先のframebufferを指定
  // そこにinfo.srcの内容を描画する
  // 描画位置をviewで指定できる（デフォルトはべったり全体）
  // srcを配列にすることで複数表示も可能
  // blendモードもいじれる
  // alignで右下とかもできる（自由）
  // MRTの場合は何番のtextureを貼り付けるかとか指示できる
  // 最大数は8です
  // 高い技術があれば50とか行けるらしいが...未知の技術...
  function copyPainter(node, info = {}){
    // バリデーション
    _validateForCopy(info);
    // blendがある場合は適用、最後に戻す。デフォtrue.
    if(info.blend){
      node.enable("blend")
          .blendFunc(info.blendFunc.src, info.blendFunc.dst); // blendFuncのsrcとdstだったね。ばか。
    }
    // depthOffがある場合はdepthを切る. デフォtrue.
    if(info.depthOff){
      node.disable("depth_test");
    }
    const {dst:_dst, src:_src} = info;

    // 終わったらその時のFBOに戻すので
    const previousFBO = node.getCurrentFBO();

    // fboのbind
    if(_dst.type === null){
      node.bindFBO(null);
    }else{
      node.bindFBO(_dst.name);
    }
    node.setViewport(...info.view);
    // painter準備
    node.use("foxCopyPainter", "foxQuads");

    // uniformの準備
    const flips = new Array(8);
    const views = new Array(4*8);
    const opacities = new Array(8); // 透明度補正
    const tints = new Array(3*8); // 乗算
    const ambients = new Array(3*8); // 加算
    const uvShifts = new Array(2*8); // uvScroll
    const gradationFlags = new Array(8); // グラデーションフラグ。0:なし、1:線形、2:放射状
    const gradAnchors = new Array(4*8); // グラデーションのアンカー
    const startColors = new Array(4*8); // 開始色
    const stopColors = new Array(4*8); // 終了色
    const count = _src.length;
    for(let i=0; i<count; i++){
      const _srcData = _src[i];
      const {x, y, w, h} = _srcData.view;
      // textureの準備
      if(_srcData.type === "tex"){
        node.setTexture2D("uTex" + i, _srcData.name);
      }
      if(_srcData.type === "fb"){
        node.setFBOtexture2D("uTex" + i, _srcData.name, _srcData.attach, _srcData.index);
      }
      flips[i] = _srcData.flip;
      views[4*i] = x; views[4*i+1] = y; views[4*i+2] = w; views[4*i+3] = h;
      opacities[i] = _srcData.opacity;
      tints[3*i] = _srcData.tint[0]; tints[3*i+1] = _srcData.tint[1]; tints[3*i+2] = _srcData.tint[2];
      ambients[3*i] = _srcData.ambient[0]; ambients[3*i+1] = _srcData.ambient[1]; ambients[3*i+2] = _srcData.ambient[2];
      uvShifts[2*i] = _srcData.uvShift[0]; uvShifts[2*i+1] = _srcData.uvShift[1];
      const gs = _srcData.gradationStart;
      const gp = _srcData.gradationStop;
      gradationFlags[i] = _srcData.gradationFlag;
      gradAnchors[4*i] = gs[0]; gradAnchors[4*i+1] = gs[1]; gradAnchors[4*i+2] = gp[0]; gradAnchors[4*i+3] = gp[1];
      startColors[4*i] = gs[2]; startColors[4*i+1] = gs[3]; startColors[4*i+2] = gs[4]; startColors[4*i+3] = gs[5];
      stopColors[4*i] = gp[2];  stopColors[4*i+1] = gp[3];  stopColors[4*i+2] = gp[4]; stopColors[4*i+3] = gp[5];
    }
    node.setUniform("uFlips", flips);
    node.setUniform("uViews", views);
    node.setUniform("uOpacity", opacities);
    node.setUniform("uTint", tints);
    node.setUniform("uAmbient", ambients);
    node.setUniform("uUvShift", uvShifts);
    node.setUniform("uGradationFlag", gradationFlags);
    node.setUniform("uGradationAnchor", gradAnchors);
    node.setUniform("uStartColor", startColors);
    node.setUniform("uStopColor", stopColors);

    node.bindIBO("foxIBOForQuads");
    node.drawElements("triangles");
    // 戻す
    if(info.depthOff){
      node.enable("depth_test");
    }
    if(info.blend){
      node.disable("blend");
    }
    // 普通に考えたら「doubleの場合は常にswap」って迷惑でしかない気が...保留。
    // 呼び出すたびにreadが空になるのおかしいでしょ。
    // 後始末
    node.unbind();

    // 元のFBOに戻す
    node.bindFBO(previousFBO);
  }

  // ---------------------------------------------------------------------------------------------- //
  // Figure.
  // いろいろやることあるんかなぁ。今はこんな感じ。dict渡したけどまあ、何かに使えるでしょう...分かんないけど。

  class Figure{
    constructor(gl, name, attrs, dict){
      this.gl = gl;
      this.name = name;
      this.validate(attrs);
      this.vbos = _createVBOs(gl, attrs, dict);
    }
    validate(attrs){
      // attrsは配列です。各成分の形：{name:"aPosition",data:[-1,-1,-1,1,1,-1,1,1]}とか。場合によってはusage:gl.DYNAMIC_DRAWなど
      // sizeも追加で。1とか2とか。これも追加でよろしく。
      for(let attr of attrs){
        if(attr.usage === undefined){ attr.usage = "static_draw"; }
        if(attr.type === undefined){ attr.type = "float"; } // ていうか色でもFLOATでいいんだ？？
      }
    }
    getVBOs(){
      return this.vbos;
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // utility for Figure.

  // getNormals
  // verticesは3つずつ頂点座標が入ってて
  // indicesは3つずつ三角形の頂点のインデックスが入ってるわけね

  // y軸が上の右手系にしました（射影行列いじった）
  // その関係でu0,u1,u2取得部分は元に戻します。以上です。

  // indicesの3*i,3*i+1,3*i+2それぞれに対して
  // たとえばk=indices[3*i]に対して
  // verticesの3*k,3*k+1,3*k+2番目の成分を取り出してベクトルを作る
  // それを3つやる
  // 次にv0,v1,v2で作る三角形のそれぞれの内角の大きさを出す
  // なお外積とarcsinで出すのでそのまま正規化されてる
  // 向きについてはv0,v1,v2の順に時計回りであることが想定されてる
  // 得られた角度を法線ベクトル（大きさ1）にかけて
  // それぞれk番目のnormalsに加える
  // 終わったらnormalsをすべて正規化
  // あとは成分ごとにばらして終了

  // あーなるほど...p5.jsのベクトル使ってるのね...
  // 確かに、これVec3で書き換えたいわね。
  // よく見るとこれ、Vec3なら一切createVector要らんな...全く必要ないわ。
  // まあ新しいベクトル一切作らなくていいことがパフォーマンスにどう影響するかって言ったら
  // 微々たるもんだろうけど。でも、しないにこしたことはないわよね。
  // んー。でもそのためには...
  // そうね。追加でverticesのベクトルをセットするVec3が3つ、要るかもだね。
  // 最後のとこはcreateVector...本家でもaddって普通に足せるらしい...そうなんだ...
  // まあそれでも実装するけど。

  // おそらく合ってるはず. いいや。普通に成分だけで。
  function getNormals(vertices, indices){
    const N = Math.floor(vertices.length / 3);
    let normals = new Array(N);
    for(let i = 0; i < N; i++){
      normals[i] = new Vec3(0);
    }
    let v0 = new Vec3(0);
    let v1 = new Vec3(0);
    let v2 = new Vec3(0);
    let u0 = new Vec3(0);
    let u1 = new Vec3(0);
    let u2 = new Vec3(0);
    let m0, m1, m2, sin0, sin1, sin2, angle0, angle1, angle2;
    for(let i = 0; i < Math.floor(indices.length / 3); i++){
      const id = [indices[3*i], indices[3*i+1], indices[3*i+2]];
      v0.set(vertices[3*id[0]], vertices[3*id[0]+1], vertices[3*id[0]+2]);
      v1.set(vertices[3*id[1]], vertices[3*id[1]+1], vertices[3*id[1]+2]);
      v2.set(vertices[3*id[2]], vertices[3*id[2]+1], vertices[3*id[2]+2]);
      u0.set(v1).sub(v0);
      u1.set(v2).sub(v0);
      u2.set(v2).sub(v1);
      m0 = u0.mag();
      m1 = u1.mag();
      m2 = u2.mag();
      v0.set(u0).cross(u1);
      v1.set(u0).cross(u2);
      v2.set(u1).cross(u2);
      sin0 = v0.mag() / (m0 * m1);
      sin1 = v1.mag() / (m0 * m2);
      sin2 = v2.mag() / (m1 * m2);
      // ここでこれらの値が1を微妙に超えてしまうことでエラーになる場合がある(asinは-1～1の外は未定義)
      // その逆に-1を下回ってもエラーになる。
      // どうしようもないので1を超えたら2から引いて-1を下回ったら-2から引くことで間に合わせよう
      // 実は|u|^2・|v|^2 = |uxv|^2 + |u・v|^2 なんだけどね
      // 内積の方でやってもそっちが1を越えたりするからね。どうしようも、ないのです。
      if(sin0 > 1){ sin0 = 2-sin0; }
      if(sin0 < -1){ sin0 = -2-sin0; }
      if(sin1 > 1){ sin1 = 2-sin1; }
      if(sin1 < -1){ sin1 = -2-sin1; }
      if(sin2 > 1){ sin2 = 2-sin2; }
      if(sin2 < -1){ sin2 = -2-sin2; }
      angle0 = Math.asin(sin0);
      angle1 = Math.asin(sin1);
      angle2 = Math.asin(sin2);
      v0.normalize();
      normals[id[0]].addScalar(v0, angle0);
      normals[id[1]].addScalar(v0, angle1);
      normals[id[2]].addScalar(v0, angle2);
    }
    let result = new Array(3*N);
    for(let i=0; i<N; i++){
      normals[i].normalize();
      result[3*i] = normals[i].x;
      result[3*i+1] = normals[i].y;
      result[3*i+2] = normals[i].z;
    }
    return result;
  }

  // ---------------------------------------------------------------------------------------------- //
  // Meshes.
  // まあ、メッシュいろいろテンプレート、あると便利だし。難しいけどね。
  // 落ち着いてから。

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
      this.enableExtensions(); // 拡張機能
      this.dict = getDict(this.gl); // 辞書を生成
      this.prepareDefault(); // defaultShaderの構築
    }
    enableExtensions(){
      // color_buffer_floatのEXT処理。pavelさんはこれ使ってwebgl2でもfloatへの書き込みが出来るようにしてた。
      // これによりframebufferはFRAMEBUFFER_COMPLETEを獲得する：https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float
      // 書き込み可能になるInternalFormatは「gl.R16F, gl.RG16F, gl.RGBA16F, gl.R32F, gl.RG32F, gl.RGBA32F, gl.R11FG11FB10F」？
      // 最後のはなんじゃい...
      this.gl.getExtension('EXT_color_buffer_float');
    }
    prepareDefault(){
      // copy.
      const _copy = getCopyShaders();
      this.registPainter("foxCopyPainter", _copy.v, _copy.f);
      // 一般的なboard. 要するにfoxBoardって書けば普通にこれ使えるので、もういちいち用意しなくていいんよ。
      this.registFigure("foxBoard", [{size:2, name:"aPosition", data:[-1,-1,1,-1,-1,1,1,1]}]);
      // 4枚のquad. 必要なだけ使う。UVは表示する際に適宜いじる。indexで位置を決めるのでaPositionは不要。
      const aIndexArray = new Array(4*8);
      const aUvArray = new Array(2*4*8);
      for(let i=0; i<4*8; i++){ aIndexArray[i] = i; }
      for(let i=0; i<8; i++){
        aUvArray[8*i] = 0; aUvArray[8*i+1] = 0; aUvArray[8*i+2] = 1; aUvArray[8*i+3] = 0;
        aUvArray[8*i+4] = 0; aUvArray[8*i+5] = 1; aUvArray[8*i+6] = 1; aUvArray[8*i+7] = 1;
      }
      this.registFigure("foxQuads", [{size:1, name:"aIndex", data:aIndexArray}, {size:2, name:"aUv", data:aUvArray}]);
      this.registIBO("foxIBOForQuads", {data:[0,1,2, 2,1,3, 4,5,6, 6,5,7, 8,9,10, 10,9,11, 12,13,14, 14,13,15,
                                        16,17,18, 18,17,19, 20,21,22, 22,21,23, 24,25,26, 26,25,27, 28,29,30, 30,29,31]});
    }
    clearColor(r, g, b, a){
      // clearに使う色を決めるところ
      this.gl.clearColor(r, g, b, a);
      return this;
    }
    clear(){
      // 通常のクリア。対象はスクリーンバッファ、もしくはその時のフレームバッファ
      // カスタムできた方がいいのかどうかはまだよくわからないが...
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
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
        window.alert("bind failure: The corresponding framebuffer does not exist.");
        return null;
      }
      return {w:fbo.w, h:fbo.h};
    }
    enable(name){
      if(this.dict[name] === undefined){
        window.alert("enable failured: invalid name.");
        return null;
      }
      // 有効化指定(cull_face, depth_test, blendなど)
      this.gl.enable(this.dict[name]);
      return this;
    }
    cullFace(mode){
      if(this.dict[mode] === undefined){
        window.alert("cullFace failured: invalid mode name.");
        return null;
      }
      // デフォルトはBACK（上から見て反時計回り）
      this.gl.cullFace(this.dict[mode]); // default: back.
      return this;
    }
    blendFunc(sFactorName, dFactorName){
      // blendFunc. ファクターを一律に決める。
      this.gl.blendFunc(this.dict[sFactorName], this.dict[dFactorName]);
      return this;
    }
    blendFuncSeparate(sRGBFactorName, dRGBFactorName, sAFactorName, dAFactorName){
      // separate.
      this.gl.blendFuncSeparate(this.dict[sRGBFactorName], this.dict[dRGBFactorName], this.dict[sAFactorName], this.dict[dAFactorName]);
      return this;
    }
    disable(name){
      if(this.dict[name] === undefined){
        window.alert("disable failured: invalid name.");
        return null;
      }
      // 非有効化(cull_face, depth_test, blend)
      this.gl.disable(this.dict[name]);
      return this;
    }
    registPainter(name, vs, fs){
      const newPainter = new Painter(this.gl, name, vs, fs);
      this.painters[name] = newPainter;
      return this;
    }
    registFigure(name, attrs){
      // attrsは配列です。
      const newFigure = new Figure(this.gl, name, attrs, this.dict);
      this.figures[name] = newFigure;
      return this;
    }
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
        window.alert("failure to create framebuffer.");
        return null;
      }
      this.fbos[name] = newFBO;
      return this;
    }
    registDoubleFBO(name, info){
      // nameはここで付ける。wとhは必ず指定してください。doubleのtrue,falseはあとで指定します。
      info.name = name;
      const newFBO = _createDoubleFBO(this.gl, info, this.dict);
      this.fbos[name] = newFBO;
      if(newFBO === undefined){
        window.alert("failure to create doubleFramebuffer.");
        return null;
      }
      return this;
    }
    registTexture(name, info = {}){
      // お待たせしました！！
      info.name = name;
      const newTexture = new TextureEx(this.gl, info, this.dict);
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
    updateTexture(name){
      // まあいいか。
      this.textures[name].updateTexture();
      return this;
    }
    usePainter(name){
      // Painter単独の有効化関数。複数のFigureをまとめてdrawする場合など。
      this.currentPainter = this.painters[name];
      this.currentPainter.use();
      return this;
    }
    drawFigure(name){
      // 異なるポリゴンを同じシェーダでレンダリングする際に重宝する。
      this.currentFigure = this.figures[name];
      // 属性の有効化
      this.enableAttributes();
      return this;
    }
    use(painterName, figureName){
      // painter, figureの順に...さすがにめんどくさい。
      this.usePainter(painterName);
      // Painterが定義されていないと属性の有効化が出来ないのでこの順番でないといけない
      this.drawFigure(figureName);
      return this;
    }
    enableAttributes(){
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
        if(vbo === undefined || attr === undefined){ continue; }
        // vboをbindする
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo.buf);
        // attributeLocationを有効にする
        this.gl.enableVertexAttribArray(attr.location);
        // attributeLocationを通知し登録する
        this.gl.vertexAttribPointer(attr.location, vbo.size, vbo.type, false, 0, 0);
      }
      return this;
    }
    bufferSubData(attrName, targetName, dstByteOffset, srcData, srcOffset = 0){
      // いわゆる動的更新。currentFigureに対し、それがもつ属性の名前と放り込む際に使う配列を渡して更新させる。
      // targetNameは array_buf: ARRAY_BUFFER で element_buf: ELEMENT_ARRAY_BUFFER ということですね。OK!
      // srcOffsetは常に0でいいですね。dstByteOffseyは何処のバイトから書き換えるか。srcDataのデータでそれを
      // 置き換える。たとえばfloat vec4で1番を置き換えるなら16を指定する。
      const vbos = this.currentFigure.getVBOs();
      const vbo = vbos[attrName];
      this.gl.bindBuffer(this.dict[targetName], vbo.buf);
      this.gl.bufferSubData(this.dict[targetName], dstByteOffset, srcData, srcOffset); // srcDataはFloat32Arrayの何か
      return this;
    }
    setTexture2D(name, _texture){
      // 有効になっているPainterがテクスチャユニフォームを持っているとして、それを使えるようにbindする。
      // 分岐処理！
      // _textureがstringの場合は登録されているのを使う。
      if(typeof(_texture) === "string"){
        this.currentPainter.setTexture2D(name, this.textures[_texture].tex);
        return this;
      }
      // そうでない場合は直接放り込む形で。
      this.currentPainter.setTexture2D(name, _texture);
      return this;
    }
    setUniform(name, data){
      // 有効になってるシェーダにuniformをセット（テクスチャ以外）
      // shaderProgramは設定されたuniform変数が内部で使われていないときにエラーを返すんですが
      // どれなのか判然とせず混乱するのでここはtry～catchを使いましょう。
      try{
        this.currentPainter.setUniform(name, data);
      }catch(error){
        window.alert("setUniform method error!. " + name);
        console.log(error.message);
        console.log(error.stack);
        return null;
      }
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
      // iboをbindする。
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
          window.alert("bind failure: The corresponding framebuffer does not exist.");
          return null;
        }
        if(fbo.double){
          // doubleの場合はwriteをbind
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.write.f);
          gl.viewport(0, 0, fbo.w, fbo.h);
          this.currentFBO = target;
          return this;
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
    setFBOtexture2D(uniformName, fboName, kind = "color", index = 0){
      // FBOを名前経由でセット。ダブルの場合はreadをセット。
      // texture限定。fbo.tやfbo.read.tの代わりに[kind]で場合によっては[index]を付ける。
      // つまり従来のcolorからtexture取得の場合は変える必要なし。
      if(fboName === undefined || (typeof fboName !== 'string')){
        // 指定の仕方に問題がある場合
        window.alert("setFBOtexture2D failure: Inappropriate name setting.");
        return null;
      }
      let fbo = this.fbos[fboName];
      if(!fbo){
        // fboが無い場合の警告
        window.alert("setFBOtexture2D failure: The corresponding framebuffer does not exist.");
        return null;
      }
      if(fbo.double){
        // doubleの場合はreadをセットする
        // 配列の場合は...
        const _texture_double = (Array.isArray(fbo.read[kind]) ? fbo.read[kind][index] : fbo.read[kind]);
        this.setTexture2D(uniformName, _texture_double);
        return this;
      }
      // 通常時
      // 配列の場合は...
      const _texture = (Array.isArray(fbo[kind]) ? fbo[kind][index] : fbo[kind]);
      this.setTexture2D(uniformName, _texture);
      return this;
    }
    swapFBO(fboName){
      // ダブル前提。ダブルの場合にswapする
      if(fboName == null){ return this; }
      let fbo = this.fbos[fboName];
      if(!fbo){
        // fboが無い場合の警告
        window.alert("The corresponding framebuffer does not exist.");
        return null;
      }
      if(fbo.read && fbo.write){ fbo.swap(); }
      return this;
    }
    drawArrays(mode, first, count){
      // modeは文字列指定でドローの仕方を指定する(7種類)。
      // 残りの引数は0とMAXでいいです。
      // firstはvertexのスタート、countはそこからの個数なので、たとえば8つあって
      // 終わりの4つだけ使う場合は(4,4)のように指定する。4,5,6,7というわけ。
      // こういうのは説明きちんとしないと混乱するわね...英語見ろよって話ではあるんだけど、
      // fool proofって大事だと思うので。誤解の原因は常に撲滅すべきだと思う。
      if(arguments.length === 1){
        first = 0;
        // countの計算は...vboで。
        const vbos = this.currentFigure.getVBOs();
        const name = Object.keys(vbos)[0];
        count = vbos[name].count / vbos[name].size;
      }
      // modeの文字列からgl定数を取得
      // 実行
      this.gl.drawArrays(this.dict[mode], first, count);
      return this;
    }
    drawElements(mode){
      // typeとsizeがそのまま使えると思う
      const ibo = this.currentIBO;
      //mode = _parseDrawMode(this.gl, mode);
      this.gl.drawElements(this.dict[mode], ibo.count, ibo.intType, 0);
      return this;
    }
    unbind(){
      // 各種bind解除
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
      this.currentIBO = undefined;
      this.currentPainter.unbindTexture2D();
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
        window.alert("getAttrInfo failure: The corresponding painter does not exist.");
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
        window.alert("drawBuffers failure: The corresponding framebuffer does not exist.");
        return null;
      }else if(!fbo.MRT){
        // MRTでない場合は適用されない
        window.alert("drawBuffers failure: The corresponding framebuffer is not for MRT.");
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
      w.divide(divider); // dividerで割る
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
  // CameraEx.
  // ビューとプロジェクションを担うパート。
  // 完全に切り離したかったんだけど射影行列が距離依存になってしまった...距離はビューの概念...
  // でもこの方がnearとfarを視点との距離に対して定義出来て便利なのでOKです。メソッド分離でいいのです。

  // 動かすのはテストが終わってからにしましょう。
  // 実装予定：zoom（倍率を指定して矩形を拡縮）,spin（視点を中心の周りに横に回転）,arise（同、縦回転。ただしtopは越えない。）,
  // pan（視点を中心の横にずらす、これも回転）,tilt（同、縦方向。ただしtopは越えない）,move（一緒にローカル軸で平行移動）
  // moveはローカル軸ベースの移動。たとえばzを増やす場合は中心とともに逆方向に遠ざかる感じ...ローカル軸は固定。
  // とはいえ中心が動くので行列は再計算されるわね。dolly:視点を中心に近づけたり離したりする。
  // parallel:グローバル軸に対して視点と中心のセットを平行移動させる。需要があるかどうかは不明。
  // lookAt: 中心だけ強制的に動かす。
  // moveはあれなんですよね。一人称で、動きを同期させたりするのに...まあ、使うんかな...
  // って思ったけど同期させるなら直接eyeとcenterいじった方が早い気がする((

  // 新カメラ。
  // infoの指定の仕方、topは常に正規化、Vec3で統一、ローカル軸の名称変更、動かすメソッド追加, etc...

  // バリデーション忘れてた。ごめん。
  function _validateForPersProj(w, h, info = {}){
    // 基本pers. nearとfarはdistanceに対する比率
    if(info.fov === undefined){ info.fov = Math.PI/3; }
    if(info.aspect === undefined){ info.aspect = w/h; }
    if(info.near === undefined){ info.near = 0.1; }
    if(info.far === undefined){ info.far = 10; }
  }

  function _validateForOrthoProj(w, h, info = {}){
    // farは一応distanceの4倍くらいで。
    if(info.left === undefined){ info.left = -w/2; }
    if(info.right === undefined){ info.right = w/2; }
    if(info.bottom === undefined){ info.bottom = -h/2; }
    if(info.top === undefined){ info.top = h/2; }
    if(info.near === undefined){ info.near = 0.01; }
    if(info.far === undefined){ info.far = 4; }
  }

  function _validateForFrustumProj(w, h, info = {}){
    const h0 = Math.tan(Math.PI/6) * 0.1; // distanceの値に対する比率
    const w0 = h0 * w/h; // そこにaspect比を掛ける
    if(info.left === undefined){ info.left = -w0; }
    if(info.right === undefined){ info.right = w0; }
    if(info.bottom === undefined){ info.bottom = -h0; }
    if(info.top === undefined){ info.top = h0; }
    if(info.near === undefined){ info.near = 0.1; }
    if(info.far === undefined){ info.far = 10; }
  }

  // ユーティリティを追加します
  // まずgetViewPosition(p): これは設定されたカメラの情報を元にglobalのpからview座標を出す
  // getNDC(p): これはglobalのpから正規化デバイスの座標を出す（ついでに-1～1の深度も出す）
  // getViewFromNDC(x, y): これはNDCのx,yからz座標が1であるようなビュー座標を出す
  // getParallelPosition(p, x, y): これはglobalのpに対してそれと同じビュー座標におけるzを持ち
  // さらにNDCがx,yであるようなグローバルポジションを返す。以上。
  class CameraEx{
    constructor(info = {}){
      this.eye = new Vec3();
      this.center = new Vec3();
      this.top = new Vec3();
      this.ciel = new Vec3(); // デフォルトのtopベクトルの方向。リセットで戻す。
      this.side = new Vec3();
      this.up = new Vec3();
      this.front = new Vec3();
      this.viewMat = new Mat4();
      this.projMat = {pers:new Mat4(), ortho: new Mat4(), frustum: new Mat4()};
      this.distance = 0; // 視点と中心との距離
      // matはそれぞれのモードに持たせて変更する場合だけ再計算されるように
      // 切り替えで計算する必要ないので
      this.projData = {mode:"pers", pers:{}, ortho:{}, frustum:{}};
      this.initialize(info);
    }
    initialize(info = {}){
      // デフォルト設定用のwとhを用意。
      let w, h;
      if(info.w === undefined){ w = window.innerWidth; }else{ w = info.w; }
      if(info.h === undefined){ h = window.innerHeight; }else{ h = info.h; }
      // ------ view part ------ //
      // まあ指定が無ければデフォルトで
      // まずeyeはz軸正方向で。（見下ろしではなくレイマのイメージで横から）
      if(info.eye === undefined){ this.eye.set(0, 0, Math.sqrt(3)*h*0.5); }else{ this.eye.set(info.eye); }
      // centerは原点で
      if(info.center === undefined){ this.center.set(0, 0, 0); }else{ this.center.set(info.center); }
      // distanceの計算
      this.calcDistance();
      // topは基本y軸正の方向。
      if(info.top === undefined){
        this.top.set(0, 1, 0);
      }else{
        this.top.set(info.top).normalize(); /* topは正規化しておく */
      }
      this.ciel.set(this.top);  // cielにtopを記録
      // ここでviewMatを構成すると同時にside,up,frontを決定する。これらはカメラのローカル軸x,y,zを与えるもの。
      // topとは概念が異なる。これらはtopに常に制約を受ける。具体的にはtopを越えることが許されない（ゆえに「top」）.
      this.calcViewMat();
      // ------ projection part ------ //
      if(info.pers === undefined){ info.pers = {}; }
      _validateForPersProj(w, h, info.pers);
      this.projData.pers = info.pers;

      if(info.ortho === undefined){ info.ortho = {}; }
      _validateForOrthoProj(w, h, info.ortho);
      this.projData.ortho = info.ortho;

      if(info.frustum === undefined){ info.frustum = {}; }
      _validateForFrustumProj(w, h, info.frustum);
      this.projData.frustum = info.frustum;

      this.calcPersMat();
      this.calcOrthoMat();
      this.calcFrustumMat();
    }
    calcDistance(){
      // メソッドに落とし込む。eyeとcenterの距離取るだけ。
      this.distance = this.eye.dist(this.center);
      // 射影行列が距離依存なので更新
      this.calcProjMat();
    }
    calcViewMat(){
      // eye,center,topが変更された場合に行列の再計算を行なうパート
      // まずfrontを作る。center → eye, の単位ベクトル
      this.front.set(this.eye).sub(this.center).normalize();
      // sideはtopとfrontの外積で作る。ゆえに常にtopに直交するのでtopが動かない限りたとえば画面の揺れなどは起こらない
      this.side.set(this.top).cross(this.front).normalize();
      // upはfrontとsideの外積で作る。画面の上方向を向くベクトルとなる。
      this.up.set(this.front).cross(this.side).normalize();
      // side,up,frontからなる右手系がカメラ座標系となる
      const data = [this.side.x, this.up.x, this.front.x, 0,
                    this.side.y, this.up.y, this.front.y, 0,
                    this.side.z, this.up.z, this.front.z, 0,
                    0, 0, 0, 1];
      this.viewMat.set(data);
      // そしてeyeの分だけ平行移動しないといけないんですね...なるほど。eyeの位置が原点に来るように。
      this.viewMat.translate(-this.eye.x, -this.eye.y, -this.eye.z);
      // おつかれさま！
    }
    calcProjMat(){
      // そのときのモードの射影行列を更新する
      switch(this.projData.mode){
        case "pers": this.calcPersMat(); break;
        case "ortho": this.calcOrthoMat(); break;
        case "frustum": this.calcFrustumMat(); break;
      }
    }
    calcPersMat(){
      // persデータを元に行列を構築する。
      // fov, aspect, near, farから行列を計算してセットする。
      // fovは視野角、aspectは横/縦の比。オーソドックスな指定方法。
      const {fov, aspect, near, far} = this.projData.pers;
      const factor = 1 / Math.tan(fov/2);
      const c0 = factor / aspect;
      const c5 = factor; // 符号反転！
      const c10 = (near + far) / (near - far); // ここは次元0なので比率そのままでOK
      const c11 = -1;
      const c14 = 2 * this.distance * near * far / (near - far); // 次元1なのでdistanceの1乗を掛ける
      const data = [c0, 0, 0, 0, 0, c5, 0, 0, 0, 0, c10, c11, 0, 0, c14, 0];
      this.projMat.pers.set(data);
    }
    calcOrthoMat(){
      // orthoデータを元に行列を構築する。
      // left,right,bottom,top,near,farを取得して...
      // xをleft~right,yをbottom~top,zを-near~-farにおいて-1～1に落とすだけなのでラクチンです。
      const {left, right, bottom, top, near, far} = this.projData.ortho;
      const c0 = 2 / (right - left);
      const c5 = 2 / (top - bottom); // 符号反転！
      const c10 = -2 / (this.distance * (far - near)); // ここは掛け算して合わせないといけない。
      const c12 = -(right + left) / (right - left);
      const c13 = -(top + bottom) / (top - bottom);
      const c14 = -(far + near) / (far - near); // ここは次元0なので無修正
      const c15 = 1;
      const data = [c0, 0, 0, 0, 0, c5, 0, 0, 0, 0, c10, 0, c12, c13, c14, c15];
      this.projMat.ortho.set(data);
    }
    calcFrustumMat(){
      // frustumデータの読み方。nearのところに無限平面を用意して、sideベクトルとupベクトルで張られるとし、
      // そこにおけるleft~right,bottom~topの領域を切り取る。その4隅にeyeから稜線を伸ばすことでfrustumを形成し
      // そこに落とす。persと違って矩形の重心がeyeからcenterへ向かう半直線と交わるとは限らないところと、
      // 通常のカメラのように切り取る範囲を設定できるところが特徴です。
      // 2022/10/11: near, far, left, right, bottom, topすべてdistanceとの比になったのでそこら辺仕様変更。
      const {left, right, bottom, top, near, far} = this.projData.frustum;
      const c0 = 2 * near / (right - left);
      const c5 = 2 * near / (top - bottom);
      const c8 = (right + left) / (right - left);
      const c9 = (top + bottom) / (top - bottom);
      const c10 = -(far + near) / (far - near);
      const c11 = -1;
      const c14 = -2 * this.distance * far * near / (far - near);
      const data = [c0, 0, 0, 0, 0, c5, 0, 0, c8, c9, c10, c11, 0, 0, c14, 0];
      this.projMat.frustum.set(data);
      // ふぅ...（理屈はちゃんと確かめてますがテストするまでわかんねぇなこれ...）GUIで試したいね。ぐりぐりして。
      // その際プリミティブがたくさん必要になるのでそういう関数も作らないと
    }
    setView(info = {}){
      // eye,center,topの指定。配列で[0,1,0]のように書けるようになりました。
      if(info.eye !== undefined){ this.eye.set(info.eye); }
      if(info.center !== undefined){ this.center.set(info.center); }
      if(info.top !== undefined){ this.top.set(info.top).normalize(); /* topは正規化しておく */ }
      this.calcDistance();
      this.calcViewMat();
    }
    setPers(info = {}){
      // fov, aspect, near, farの指定。nearとfarはview関係ないので切り離すべきなのです。
      const projData = this.projData.pers;
      if(info.fov !== undefined){ projData.fov = info.fov; }
      if(info.aspect !== undefined){ projData.aspect = info.aspect; }
      if(info.near !== undefined){ projData.near = info.near; }
      if(info.far !== undefined){ projData.far = info.far; }
      this.calcPersMat();
      this.projData.mode = "pers"; // 自動的にpersになる
    }
    setOrtho(info = {}){
      const projData = this.projData.ortho;
      if(info.left !== undefined){ projData.left = info.left; }
      if(info.right !== undefined){ projData.right = info.right; }
      if(info.bottom !== undefined){ projData.bottom = info.bottom; }
      if(info.top !== undefined){ projData.top = info.top; }
      if(info.near !== undefined){ projData.near = info.near; }
      if(info.far !== undefined){ projData.far = info.far; }
      this.calcOrthoMat();
      this.projData.mode = "ortho"; // 自動的にorthoになる
    }
    setFrustum(info = {}){
      const projData = this.projData.frustum;
      const prevNear = projData.near; // 変更前のnearの値を記憶しておく
      if(info.left !== undefined){ projData.left = info.left; }
      if(info.right !== undefined){ projData.right = info.right; }
      if(info.bottom !== undefined){ projData.bottom = info.bottom; }
      if(info.top !== undefined){ projData.top = info.top; }
      if(info.near !== undefined){ projData.near = info.near; }
      // もしnearが変更され、かつleft,right,bottom,topの変更が無い場合、
      // これらをnearの値に応じて見た目が変わらないように変化させる（具体的にはnear/prevNearを掛ける）
      if(info.near !== undefined && info.left === undefined && info.right === undefined && info.bottom === undefined && info.top === undefined){
        const ratio = info.near / prevNear;
        projData.left *= ratio;
        projData.right *= ratio;
        projData.bottom *= ratio;
        projData.top *= ratio;
      }
      // farは関係ない。
      if(info.far !== undefined){ projData.far = info.far; }
      this.calcFrustumMat();
      this.projData.mode = "frustum"; // 自動的にfrustumになる
    }
    getViewMat(){
      // ビュー行列の取得
      return this.viewMat;
    }
    getProjMat(){
      // 射影行列の取得
      return this.projMat[this.projData.mode]; // モードごと、違う物を返す。
    }
    getViewData(){
      // viewのdataであるVec3の取得
      return {eye:this.eye, center:this.center, top:this.top};
    }
    getLocalAxes(){
      // いわゆるカメラ座標系の3軸を取得(Axesが複数形だそうです)
      return {side:this.side, up:this.up, front:this.front};
    }
    getProjData(mode){
      // modeごとの射影変換に使うdataの取得。あんま使いそうにないな。fovとaspectをレイマ用に...とかで使いそう。
      // レイマでもorthoとかpointLight普通に使えるから色々試してみたいわね
      return this.projData[this.projData.mode];
    }
    zoom(delta, sensitivity = 1){
      // すべての場合に矩形のサイズを(1+delta)倍する。だからdeltaが正なら大きくなるし逆なら小さくなる。
      if(delta < -1){ return; }
      // ここでマイナスにしないと...あの、視界を大きくするにはfovを小さく絞る、ので、逆なんですね。
      const ratio = (1 - delta) * sensitivity;
      switch(this.projData.mode){
        case "pers":
          // fovから1の距離のところの矩形の縦の長さの半分を出して倍率を掛けてから引き戻す。
          const {fov} = this.projData.pers;
          const _scale = Math.tan(fov/2) * ratio;
          this.setPers({fov:Math.atan(_scale) * 2.0});
          break;
        case "ortho":
          const {left:l0, right:r0, bottom:b0, top:t0} = this.projData.ortho;
          this.setOrtho({left:l0*ratio, right:r0*ratio, bottom:b0*ratio, top:t0*ratio});
          break;
        case "frustum":
          const {left:l1, right:r1, bottom:b1, top:t1} = this.projData.frustum;
          this.setFrustum({left:l1*ratio, right:r1*ratio, bottom:b1*ratio, top:t1*ratio});
          break;
      }
    }
    spin(delta, sensitivity = 1){
      // 視点を中心の周りに反時計回りに回転させる。角度。
      // 計算がめんどくさいね...で、camの方は間違ってた、か...centerからeyeに向かうベクトルをtopの周りに回転させるのだ。
      // あれ使うか。
      // あ！！中心...まずいじゃん。
      const t = delta * sensitivity;
      // 中心を引いて、回転して、また中心を足す。今中心が(0,0,0)で固定なので...なんとかしたいね。デバッグするうえで不利。
      this.eye.sub(this.center).rotate(this.top, t).add(this.center);
      this.calcDistance();
      this.calcViewMat();
    }
    arise(delta, sensitivity = 1){
      // 視点を中心の周りに上昇させる。ただしtopベクトルを超えないようにする。角度。frontとupでeyeを再計算。
      // centerは変化しないのでそれを無視して計算し最後にcenterを足す。
      const d = this.distance;
      const t = delta * sensitivity;
      // 答えを作る
      this.eye.set(this.front).mult(d * Math.cos(t)).addScalar(this.up, d * Math.sin(t));
      // このベクトル三重積でなす角thetaに対するd*sin(theta)が出るのでそれとd*0.001を比べて...
      // sin(0.001)～0.001.
      // あ、そうか、sinだけだとどっちだかわからん。内積で符号取らないと。
      // つまり上でBANするならこれでいいけど下でBANする場合は-topでないと失敗するんだわ。
      // ここは答えのeyeで。
      const tm = _tripleMultiple(this.top, this.eye, this.side);
      if(tm < d * 0.001){
        this.side.cross(this.top); // あとで再計算するのでとりあえずsideを使わせてもらう。
        // topに直交するeye方向の単位ベクトルsideを使ってちょっとずらす感じ
        // dotSignでどっち側か調べないと駄目。
        const dotSign = (this.top.dot(this.eye) > 0 ? 1 : -1);
        this.eye.set(this.top).mult(dotSign).addScalar(this.side, 0.001).normalize().mult(d);
      }
      this.eye.add(this.center); // centerを足す。
      this.calcDistance();
      this.calcViewMat();
    }
    dolly(delta, sensitivity = 1){
      // 視点を対象物に近づける処理。zoomと違ってfov等は変化しない。正の時近づけたいのでマイナスで。
      const d = this.distance;
      const t = delta * sensitivity;
      if(d + t < 0.001){ return; }
      this.eye.addScalar(this.front, -t);
      this.calcDistance();
      this.calcViewMat(); // これでよいはず。
    }
    pan(delta, sensitivity = 1){
      // eyeからcenterに向かうベクトルを右に振る。t<0の場合は左に振る。なおcenterが動くので注意。
      // center-eyeでeyeからcenterに向かうベクトルになるがこれの正の向きの変化は時計回りなのでマイナスを付ける。
      // centerを動かす処理なので早速問題が発生している...
      const t = delta * sensitivity;
      this.center.sub(this.eye).rotate(this.top, -t).add(this.eye);
      this.calcDistance();
      this.calcViewMat();
    }
    tilt(delta, sensitivity = 1){
      // eyeからcenterに向かうベクトルを上に振る。t<0の場合は下に振る。これもtopベクトルに制限を受ける。
      // centerを答えにして色々計算して最後にeyeを足して答えとする。
      const d = this.distance;
      const t = delta * sensitivity;
      // 答えを作る. -frontとupでtに対して計算する。
      this.center.set(this.front).mult(-1 * d * Math.cos(t)).addScalar(this.up, d * Math.sin(t));
      const tm = -_tripleMultiple(this.top, this.center, this.side); // ここも逆だ...
      if(tm < d * 0.001){
        this.side.cross(this.top); // これは逆を向いてるのであとでマイナスをつける。
        const dotSign = (this.top.dot(this.center) > 0 ? 1 : -1); // ここはcenterで。
        this.center.set(this.top).mult(dotSign).addScalar(this.side, -0.001).normalize().mult(d);
      }
      this.center.add(this.eye);
      this.calcDistance();
      this.calcViewMat();
    }
    roll(delta, sensitivity = 1){
      // topベクトルをfrontの周りに回転させる。画面の横揺れ。
      // 結果だけ述べると、tが正解です。-tではない。まずfrontの周りに反時計回りに回転させるともともとのtopに対して
      // 左に傾く。これが新しいtopだとするならば、それを上として座標系を作る場合、それがてっぺんに来ることを想像すれば、
      // 全体は右に傾くと分かる。だからそのまんまでいい。
      const t = delta * sensitivity;
      this.top.rotate(this.front, t);
      this.calcViewMat();
    }
    topReset(){
      // topを初期状態に戻す
      this.top.set(this.ciel);
      this.calcViewMat();
    }
    move(a, b, c){
      const v = _getValidation(a, b, c);
      // で、この分だけ全体を移動する。eyeとcenterをそれぞれ...side, up, front方向に。
      // sideは要するに画面右方向へ平行移動、upは要するに画面上、傾いてる場合、斜めの移動になる。
      // frontはこれdollyではないよ。centerも動いてるからね。
      // ...たとえば地形がある場合、frontではなく前方向になるように補正がかかる...？
      // zだけマイナスを掛けてるのは正の時に奥に行く方が自然だから。
      this.eye.addScalar(this.side, v.x).addScalar(this.up, v.y).addScalar(this.front, -v.z);
      this.center.addScalar(this.side, v.x).addScalar(this.up, v.y).addScalar(this.front, -v.z);
      this.calcDistance();
      this.calcViewMat();
    }
    lookAt(a, b, c){
      const v = _getValidation(a, b, c);
      // (a,b,c)にcenterを強制移動。topは動かさない。以上。デバッグ...？
      // centerのtop方向にeyeがきちゃうのまずいよねって話。ただ、まあ、いいか...
      this.center.set(v);
      this.calcDistance();
      this.calcViewMat();
    }
    getViewPosition(p){
      // pはVec3です。View座標を出します。eyeを引いてviewMatをapplyするだけ！
      p.sub(this.eye);
      return this.viewMat.apply(p);
    }
    getNDC(p){
      // pはVec3です。NDC出します。
      const q = this.getViewPosition(p);
      return this.getProjMat().applyProj(q);
    }
    getViewPositionFromNDC(x, y, z = 1, centerBased = false){
      // NDCからView座標を算出する。z値はこっちで決める。デフォの場合、結果はz値が1の時のものとなる。
      // って思ったけどよく考えたらOrthoの場合は錐体じゃないからこの方法だと簡単に外に出てしまうね
      // OrthoってViewにおける座標、x,yだけなんよ。zによらないのです。だからzを掛けちゃいけないのよ。
      // centerBasedはこれがtrueの場合zの代わりにz*this.distanceを使う、という意味。
      // つまりcenterのところの平面におけるViewの位置が出るということ。3Dお絵描きに応用できそう。
      const m = this.getProjMat().m;
      // projのモードで場合分け。疎行列なので計算はとても簡単なのです。
      let u, v;
      switch(this.projData.mode){
        case "pers":
          u = -x/m[0]; v = -y/m[5]; break;
        case "ortho":
          u = (x-m[12])/m[0]; v = (y-m[13])/m[5]; break;
        case "frustum":
          u = (-m[8]-x)/m[0]; v = (-m[9]-y)/m[5]; break;
      }
      const result = new Vec3(u, v, 1);
      if(centerBased){ z *= this.distance; } // centerBasedならzの代わりにz*this.distanceを使う。
      if(this.projData.mode === "ortho"){
        result.z = z;   // orthoの場合はz成分をzにするだけ
      }else{
        result.mult(z); // pers, frustumの場合はzが比例定数になる
      }
      return result;
    }
    getGlobalPositionFromNDC(x, y, z = 1, cenetrBased = false){
      // NDCが(x,y)でViewにおける深さがzであるようなGlobalの点の位置を取得する。3Dお絵描きに応用できそう。
      const p = this.getViewPositionFromNDC(x, y, z, centerBased);
      // viewの3x3部分の逆行列（＝転置）を掛けてeyeを足すだけ。ラクチン。
      this.viewMat.apply(p, false);
      p.add(this.eye);
      return p;
    }
    getParallelPosition(p, x, y){
      // グローバルのpに対し正規化デバイス座標が(x,y)であるようなグローバルの点qを返す。これは一意のはずである。
      // はじめにpのviewを出して。
      const pView = this.getViewPosition(p);
      // それのzを持つView空間の点を求めて
      const q = this.getViewPositionFromNDC(x, y, pView.z);
      // 引き戻す。それにはviewMatをtransposeを適用せずに掛けてeyeを足せばいい...はず。
      this.viewMat.apply(q, false);
      q.add(this.eye);
      return q;
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // TransformEx.
  // 単位行列。初期化。要するにモデル行列。
  // rotとかいろいろこっちに移すかな...あっちに持たせても仕方ないわな。

  class TransformEx{
    constructor(data){
      this.mat = new Mat4(data);
    }
    initialize(){
      this.mat.initialize();
      return this;
    }
    getModelMat(){
      // モデル行列を取り出す。これを...渡す。
      return this.mat;
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
  }

  // getNormalMatrix.
  // モデルビューは既に4x4の配列として計算済み。それに対し左上の3x3から逆転置を作って返す。
  // この中で掛け算するのはいろいろと二度手間になりそうだったので却下。
  // normalMatrixはVSで計算することになったので廃止で。いろいろ変えないとね...
  /*
  function getNormalMat(modelView){
    const result = new Array(9).fill(0);
    result[0] = modelView[0]; result[1] = modelView[1]; result[2] = modelView[2];
    result[3] = modelView[4]; result[4] = modelView[5]; result[5] = modelView[6];
    result[6] = modelView[8]; result[7] = modelView[9]; result[8] = modelView[10];
    return getInverseTranspose3x3(result);
  }
  */

  // 順番としては
  // TransformExとCameraExを用意 → モデルとビューでモデルビュー作って法線も作って
  // プロジェも作ってモデルビューとプロジェと法線を送り込んで計算。
  // 現時点でTransformExの便利な書き方がないので困ったね～...（後回し）

  // ゆくゆくはVec4とかQuarternionやりたいけど必要が生じて明確な利用方法の目途が立ってからでないと駄目ね。
  // 別に派手なことをしたいとかね、そういう話ではないので。基礎固め。地味な話です。
  // てか、ああそうか、Vec4作ってVec3から(x,y,z,1)作るメソッドを...そうすれば自由に...
  // となるとゆくゆくはside,up,frontはVec4というかQuarternionとして扱うことになる？それでもいいけどね。

  const ex = {};

  // utility.
  ex.getNormals = getNormals;
  ex.getMult3x3 = getMult3x3; // 3x3の使い道があるかもしれない的な
  ex.getMult4x4 = getMult4x4; // こっちは使い道あるかもしれない
  ex.hsv2rgb = hsv2rgb;
  ex.hsvArray = hsvArray;

  // class.
  ex.Timer = Timer;
  ex.Painter = Painter;
  ex.Figure = Figure;
  ex.RenderNode = RenderNode;
  ex.TextureEx = TextureEx;
  ex.Mat4 = Mat4;
  ex.CameraEx = CameraEx;
  ex.TransformEx = TransformEx;
  ex.Vec3 = Vec3;

  // defaultShader.
  // axisHelper（座標軸を長さ指定して可視化）
  // cameraHelper（種類に応じてfrustumを可視化）
  // customRectHelper（自由に直方体を指定して辺描画で位置を可視化）
  // data格納用のシェーダ欲しいですね...欲しい...めんどくさい...
  ex.copyPainter = copyPainter;

  return ex;
})();

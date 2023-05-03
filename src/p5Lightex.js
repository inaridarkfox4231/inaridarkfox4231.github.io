// まとめちゃおう
// 書き換えではなくライブラリの形にします

// 内容
// カスタムシェーダ1
// ambientModeが使えるシェーダ
// 外から決める
// カスタムシェーダ2
// imageを使いやすくするためのもの
// grを渡すだけであら不思議！
// この2つをまとめてしまおう。

// カスタムシェーダを適用する際のsetUniformあれこれは要らないです
// 中で用意するので
// んで
// モードを指定してチェンジ...

// p5前提なのでp5のあとで使ってね
// 名付けてp5Lightex.

// 使い方
// p5Lightex.AmbientModeSystem
// p5Lightex.EasyImage
// ...

const p5Lightex = (function(){

	const vsAmbient = `
	precision highp float;
	precision highp int;

	attribute vec3 aPosition;
	attribute vec3 aNormal;
	attribute vec2 aTexCoord;
	attribute vec4 aVertexColor;

	uniform vec3 uAmbientColor[5];

	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	uniform mat3 uNormalMatrix;
	uniform int uAmbientLightCount;

	uniform bool uUseVertexColor;
	uniform vec4 uMaterialColor;

	varying vec3 vNormal;
	varying vec2 vTexCoord;
	varying vec3 vViewPosition;
	varying vec3 vAmbientColor;
	varying vec4 vColor;

	void main(void) {

		vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);

		// Pass varyings to fragment shader
		vViewPosition = viewModelPosition.xyz;
		gl_Position = uProjectionMatrix * viewModelPosition;

		vNormal = uNormalMatrix * aNormal;
		vTexCoord = aTexCoord;

		// TODO: this should be a uniform
		vAmbientColor = vec3(0.0);
		for (int i = 0; i < 5; i++) {
			if (i < uAmbientLightCount) {
				vAmbientColor += uAmbientColor[i];
			}
		}

		vColor = (uUseVertexColor ? aVertexColor : uMaterialColor);
	}
	`;

	const fsAmbient = `
	precision highp float;
	precision highp int;

	uniform mat4 uViewMatrix;

	uniform bool uUseLighting;

	uniform int uAmbientLightCount;
	uniform vec3 uAmbientColor[5];
	uniform int uAmbientMode;

	uniform int uDirectionalLightCount;
	uniform vec3 uLightingDirection[5];
	uniform vec3 uDirectionalDiffuseColors[5];
	uniform vec3 uDirectionalSpecularColors[5];

	uniform int uPointLightCount;
	uniform vec3 uPointLightLocation[5];
	uniform vec3 uPointLightDiffuseColors[5];
	uniform vec3 uPointLightSpecularColors[5];

	uniform int uSpotLightCount;
	uniform float uSpotLightAngle[5];
	uniform float uSpotLightConc[5];
	uniform vec3 uSpotLightDiffuseColors[5];
	uniform vec3 uSpotLightSpecularColors[5];
	uniform vec3 uSpotLightLocation[5];
	uniform vec3 uSpotLightDirection[5];

	uniform bool uSpecular;
	uniform float uShininess;

	uniform float uConstantAttenuation;
	uniform float uLinearAttenuation;
	uniform float uQuadraticAttenuation;

	const float specularFactor = 2.0;
	const float diffuseFactor = 0.73;

	struct LightResult {
		float specular;
		float diffuse;
	};

	float _phongSpecular(
		vec3 lightDirection,
		vec3 viewDirection,
		vec3 surfaceNormal,
		float shininess) {

		vec3 R = reflect(lightDirection, surfaceNormal);
		return pow(max(0.0, dot(R, viewDirection)), shininess);
	}

	float _lambertDiffuse(vec3 lightDirection, vec3 surfaceNormal) {
		return max(0.0, dot(-lightDirection, surfaceNormal));
	}

	LightResult _light(vec3 viewDirection, vec3 normal, vec3 lightVector) {

		vec3 lightDir = normalize(lightVector);

		//compute our diffuse & specular terms
		LightResult lr;
		if (uSpecular)
			lr.specular = _phongSpecular(lightDir, viewDirection, normal, uShininess);
		lr.diffuse = _lambertDiffuse(lightDir, normal);
		return lr;
	}

	void totalLight(
		vec3 modelPosition,
		vec3 normal,
		out vec3 totalDiffuse,
		out vec3 totalSpecular
	) {

		totalSpecular = vec3(0.0);

		if (!uUseLighting) {
			totalDiffuse = vec3(1.0);
			return;
		}

		totalDiffuse = vec3(0.0);

		vec3 viewDirection = normalize(-modelPosition);

		for (int j = 0; j < 5; j++) {
			if (j < uDirectionalLightCount) {
				vec3 lightVector = (uViewMatrix * vec4(uLightingDirection[j], 0.0)).xyz;
				vec3 lightColor = uDirectionalDiffuseColors[j];
				vec3 specularColor = uDirectionalSpecularColors[j];
				LightResult result = _light(viewDirection, normal, lightVector);
				totalDiffuse += result.diffuse * lightColor;
				totalSpecular += result.specular * lightColor * specularColor;
			}

			if (j < uPointLightCount) {
				vec3 lightPosition = (uViewMatrix * vec4(uPointLightLocation[j], 1.0)).xyz;
				vec3 lightVector = modelPosition - lightPosition;

				//calculate attenuation
				float lightDistance = length(lightVector);
				float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);
				vec3 lightColor = lightFalloff * uPointLightDiffuseColors[j];
				vec3 specularColor = lightFalloff * uPointLightSpecularColors[j];

				LightResult result = _light(viewDirection, normal, lightVector);
				totalDiffuse += result.diffuse * lightColor;
				totalSpecular += result.specular * lightColor * specularColor;
			}

			if(j < uSpotLightCount) {
				vec3 lightPosition = (uViewMatrix * vec4(uSpotLightLocation[j], 1.0)).xyz;
				vec3 lightVector = modelPosition - lightPosition;

				float lightDistance = length(lightVector);
				float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);

				vec3 lightDirection = (uViewMatrix * vec4(uSpotLightDirection[j], 0.0)).xyz;
				float spotDot = dot(normalize(lightVector), normalize(lightDirection));
				float spotFalloff;
				if(spotDot < uSpotLightAngle[j]) {
					spotFalloff = 0.0;
				}
				else {
					spotFalloff = pow(spotDot, uSpotLightConc[j]);
				}
				lightFalloff *= spotFalloff;

				vec3 lightColor = uSpotLightDiffuseColors[j];
				vec3 specularColor = uSpotLightSpecularColors[j];

				LightResult result = _light(viewDirection, normal, lightVector);

				totalDiffuse += result.diffuse * lightColor * lightFalloff;
				totalSpecular += result.specular * lightColor * specularColor * lightFalloff;
			}
		}

		totalDiffuse *= diffuseFactor;
		totalSpecular *= specularFactor;
	}

	uniform vec4 uSpecularMatColor;
	uniform vec4 uAmbientMatColor;
	uniform vec4 uEmissiveMatColor;

	uniform vec4 uTint;
	uniform sampler2D uSampler;
	uniform bool isTexture;

	varying vec3 vNormal;
	varying vec2 vTexCoord;
	varying vec3 vViewPosition;
	varying vec3 vAmbientColor;
	varying vec4 vColor;

	// overlay. 引数を逆にするとhardLight.
	vec3 overlay(in vec3 src, in vec3 dst){
		vec3 result;
		if(dst.r < 0.5){ result.r = 2.0*src.r*dst.r; }else{ result.r = 2.0*(src.r+dst.r-src.r*dst.r)-1.0; }
		if(dst.g < 0.5){ result.g = 2.0*src.g*dst.g; }else{ result.g = 2.0*(src.g+dst.g-src.g*dst.g)-1.0; }
		if(dst.b < 0.5){ result.b = 2.0*src.b*dst.b; }else{ result.b = 2.0*(src.b+dst.b-src.b*dst.b)-1.0; }
	return result;
	}

	// softLight.
	vec3 softLight(in vec3 src, in vec3 dst){
		vec3 result;
		if(src.r < 0.5){ result.r = 2.0*src.r*dst.r + dst.r*dst.r*(1.0-2.0*src.r); }
		else{ result.r = 2.0*dst.r*(1.0-src.r) + sqrt(dst.r)*(2.0*src.r-1.0); }
		if(src.g < 0.5){ result.g = 2.0*src.g*dst.g + dst.g*dst.g*(1.0-2.0*src.g); }
		else{ result.g = 2.0*dst.g*(1.0-src.g) + sqrt(dst.g)*(2.0*src.g-1.0); }
		if(src.b < 0.5){ result.b = 2.0*src.b*dst.b + dst.b*dst.b*(1.0-2.0*src.b); }
		else{ result.b = 2.0*dst.b*(1.0-src.b) + sqrt(dst.b)*(2.0*src.b-1.0); }
		return result;
	}

	void main(void) {

		vec3 diffuse;
		vec3 specular;
		totalLight(vViewPosition, normalize(vNormal), diffuse, specular);

		// 昔のスタイルにしないと上からimage()を貼り付ける際にバグる
		// これバグですね多分
		// わからない
		// easyImageが原因ならバグじゃないからね。知らん。
		vec4 baseColor = isTexture ? texture2D(uSampler, vTexCoord) * (uTint / vec4(255, 255, 255, 255)) : vColor;

		diffuse *= baseColor.rgb;

		// ここの選択肢を増やす。
		vec3 ambient = vAmbientColor * uAmbientMatColor.rgb;
		diffuse += specular * uSpecularMatColor.rgb;

		// diffuseがdstでambientがsrcに相当する
		if (uAmbientMode == 0) { diffuse += ambient; } // ADD.
		if (uAmbientMode == 1) { diffuse = diffuse + ambient - diffuse * ambient; } // SCREEN.
		if (uAmbientMode == 2) { diffuse *= ambient; } // MULTIPLY.
		if (uAmbientMode == 3) { diffuse = overlay(ambient, diffuse); } // OVERLAY.
		if (uAmbientMode == 4) { diffuse = softLight(ambient, diffuse); } // SOFT_LIGHT.
		if (uAmbientMode == 5) { diffuse = overlay(diffuse, ambient); } // HARD_LIGHT.

		diffuse += uEmissiveMatColor.rgb;

		gl_FragColor = vec4(diffuse, 1.0) * baseColor.a;
	}
	`;

	const vsImage = `
	attribute vec3 aPosition;
	varying vec2 vUv;
	void main(){
	  vUv = aPosition.xy + 0.5;
		vUv.y = 1.0 - vUv.y;
		gl_Position = vec4(aPosition * 2.0, 1.0);
	}
	`;

	const fsImage = `
	precision mediump float;
	varying vec2 vUv;
	uniform sampler2D uImg;
	void main(){
	  vec4 col = texture2D(uImg, vUv);
		gl_FragColor = col * vec4(vec3(col.a), 1.0);
	}
	`;

	class AmbientModeSystem{
		constructor(){
			this.mode = "add";
			this.shader = createShader(vsAmbient, fsAmbient);
		}
		on(){
			shader(this.shader);
			return this;
		}
		setMode(mode){
			const _index = ["add", "screen", "multiply", "overlay", "softLight", "hardLight"].indexOf(mode);
			if (_index < 0) {
				console.warn("wrong specify.");
				noLoop();
				return this;
			}
			this.mode = mode;
			this.shader.setUniform("uAmbientMode", _index); // 0,1,2,3,4,5.
			return this;
		}
		off(){
			resetShader();
			return this;
		}
	}

	class EasyImage{
		constructor(gl){
			this.gl = gl;
			this.shader = createShader(vsImage, fsImage);
		}
		on(){
			shader(this.shader);
			return this;
		}
		setImage(gr){
			this.shader.setUniform("uImg", gr);
			return this;
		}
		image(){
			push();
			noLights(); // 必須。これが無いと採用してもらえない。
			camera(0, 0, 0.5*height*sqrt(3), 0, 0, 0, 0, 1, 0);
	    const depthTestIsEnable = this.gl.getParameter(this.gl.DEPTH_TEST);
      const cullFaceIsEnable = this.gl.getParameter(this.gl.CULL_FACE);
      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.disable(this.gl.CULL_FACE);
			plane(0);
      if (depthTestIsEnable) { this.gl.enable(this.gl.DEPTH_TEST); }
      if (cullFaceIsEnable) { this.gl.enable(this.gl.CULL_FACE); }
			pop();
			return this;
		}
		off(){
			resetShader();
			return this;
		}
	}

	const ex = {};
	ex.AmbientModeSystem = AmbientModeSystem;
	ex.EasyImage = EasyImage;

	return ex;
})();

// ambientModeを利用できるようにするためのパッチ
// とはいえこれやっちゃうと改変が難しくなるけどまあいいよ別に。
// 応急処置というか。ちょっとした冗談だから。

var lightingShader = 'precision highp float;\nprecision highp int;\n\nuniform mat4 uViewMatrix;\n\nuniform bool uUseLighting;\n\nuniform int uAmbientLightCount;\nuniform vec3 uAmbientColor[5];\n\nuniform int uDirectionalLightCount;\nuniform vec3 uLightingDirection[5];\nuniform vec3 uDirectionalDiffuseColors[5];\nuniform vec3 uDirectionalSpecularColors[5];\n\nuniform int uPointLightCount;\nuniform vec3 uPointLightLocation[5];\nuniform vec3 uPointLightDiffuseColors[5];\t\nuniform vec3 uPointLightSpecularColors[5];\n\nuniform int uSpotLightCount;\nuniform float uSpotLightAngle[5];\nuniform float uSpotLightConc[5];\nuniform vec3 uSpotLightDiffuseColors[5];\nuniform vec3 uSpotLightSpecularColors[5];\nuniform vec3 uSpotLightLocation[5];\nuniform vec3 uSpotLightDirection[5];\n\nuniform bool uSpecular;\nuniform float uShininess;\n\nuniform float uConstantAttenuation;\nuniform float uLinearAttenuation;\nuniform float uQuadraticAttenuation;\n\nconst float specularFactor = 2.0;\nconst float diffuseFactor = 0.73;\n\nstruct LightResult {\n  float specular;\n  float diffuse;\n};\n\nfloat _phongSpecular(\n  vec3 lightDirection,\n  vec3 viewDirection,\n  vec3 surfaceNormal,\n  float shininess) {\n\n  vec3 R = reflect(lightDirection, surfaceNormal);\n  return pow(max(0.0, dot(R, viewDirection)), shininess);\n}\n\nfloat _lambertDiffuse(vec3 lightDirection, vec3 surfaceNormal) {\n  return max(0.0, dot(-lightDirection, surfaceNormal));\n}\n\nLightResult _light(vec3 viewDirection, vec3 normal, vec3 lightVector) {\n\n  vec3 lightDir = normalize(lightVector);\n\n  //compute our diffuse & specular terms\n  LightResult lr;\n  if (uSpecular)\n    lr.specular = _phongSpecular(lightDir, viewDirection, normal, uShininess);\n  lr.diffuse = _lambertDiffuse(lightDir, normal);\n  return lr;\n}\n\nvoid totalLight(\n  vec3 modelPosition,\n  vec3 normal,\n  out vec3 totalDiffuse,\n  out vec3 totalSpecular\n) {\n\n  totalSpecular = vec3(0.0);\n\n  if (!uUseLighting) {\n    totalDiffuse = vec3(1.0);\n    return;\n  }\n\n  totalDiffuse = vec3(0.0);\n\n  vec3 viewDirection = normalize(-modelPosition);\n\n  for (int j = 0; j < 5; j++) {\n    if (j < uDirectionalLightCount) {\n      vec3 lightVector = (uViewMatrix * vec4(uLightingDirection[j], 0.0)).xyz;\n      vec3 lightColor = uDirectionalDiffuseColors[j];\n      vec3 specularColor = uDirectionalSpecularColors[j];\n      LightResult result = _light(viewDirection, normal, lightVector);\n      totalDiffuse += result.diffuse * lightColor;\n      totalSpecular += result.specular * lightColor * specularColor;\n    }\n\n    if (j < uPointLightCount) {\n      vec3 lightPosition = (uViewMatrix * vec4(uPointLightLocation[j], 1.0)).xyz;\n      vec3 lightVector = modelPosition - lightPosition;\n    \n      //calculate attenuation\n      float lightDistance = length(lightVector);\n      float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);\n      vec3 lightColor = lightFalloff * uPointLightDiffuseColors[j];\n      vec3 specularColor = lightFalloff * uPointLightSpecularColors[j];\n\n      LightResult result = _light(viewDirection, normal, lightVector);\n      totalDiffuse += result.diffuse * lightColor;\n      totalSpecular += result.specular * lightColor * specularColor;\n    }\n\n    if(j < uSpotLightCount) {\n      vec3 lightPosition = (uViewMatrix * vec4(uSpotLightLocation[j], 1.0)).xyz;\n      vec3 lightVector = modelPosition - lightPosition;\n    \n      float lightDistance = length(lightVector);\n      float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);\n\n      vec3 lightDirection = (uViewMatrix * vec4(uSpotLightDirection[j], 0.0)).xyz;\n      float spotDot = dot(normalize(lightVector), normalize(lightDirection));\n      float spotFalloff;\n      if(spotDot < uSpotLightAngle[j]) {\n        spotFalloff = 0.0;\n      }\n      else {\n        spotFalloff = pow(spotDot, uSpotLightConc[j]);\n      }\n      lightFalloff *= spotFalloff;\n\n      vec3 lightColor = uSpotLightDiffuseColors[j];\n      vec3 specularColor = uSpotLightSpecularColors[j];\n     \n      LightResult result = _light(viewDirection, normal, lightVector);\n      \n      totalDiffuse += result.diffuse * lightColor * lightFalloff;\n      totalSpecular += result.specular * lightColor * specularColor * lightFalloff;\n    }\n  }\n\n  totalDiffuse *= diffuseFactor;\n  totalSpecular *= specularFactor;\n}\n';

var defaultShaders = {
  lightVert: lightingShader + '// include lighting.glgl\n\nattribute vec3 aPosition;\nattribute vec3 aNormal;\nattribute vec2 aTexCoord;\nattribute vec4 aVertexColor;\n\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\nuniform mat3 uNormalMatrix;\n\nuniform bool uUseVertexColor;\nuniform vec4 uMaterialColor;\n\nvarying highp vec2 vVertTexCoord;\nvarying vec3 vDiffuseColor;\nvarying vec3 vSpecularColor;\nvarying vec4 vColor;\n\nvoid main(void) {\n\n  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);\n  gl_Position = uProjectionMatrix * viewModelPosition;\n\n  vec3 vertexNormal = normalize(uNormalMatrix * aNormal);\n  vVertTexCoord = aTexCoord;\n\n  totalLight(viewModelPosition.xyz, vertexNormal, vDiffuseColor, vSpecularColor);\n\n  for (int i = 0; i < 8; i++) {\n    if (i < uAmbientLightCount) {\n      vDiffuseColor += uAmbientColor[i];\n    }\n  }\n  \n  vColor = (uUseVertexColor ? aVertexColor : uMaterialColor);\n}\n',
  lightTextureFrag: 'precision highp float;\n\nuniform vec4 uTint;\nuniform sampler2D uSampler;\nuniform bool isTexture;\nuniform bool uEmissive;\n\nvarying highp vec2 vVertTexCoord;\nvarying vec3 vDiffuseColor;\nvarying vec3 vSpecularColor;\nvarying vec4 vColor;\n\nvoid main(void) {\n  if(uEmissive && !isTexture) {\n    gl_FragColor = vColor;\n  }\n  else {\n    vec4 baseColor = isTexture ? texture2D(uSampler, vVertTexCoord) * (uTint / vec4(255, 255, 255, 255)) : vColor;\n    gl_FragColor = vec4(gl_FragColor.rgb * vDiffuseColor + vSpecularColor, 1.) * baseColor.a;\n  }\n}\n',
  phongVert: 'precision highp float;\nprecision highp int;\n\nattribute vec3 aPosition;\nattribute vec3 aNormal;\nattribute vec2 aTexCoord;\nattribute vec4 aVertexColor;\n\nuniform vec3 uAmbientColor[5];\n\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\nuniform mat3 uNormalMatrix;\nuniform int uAmbientLightCount;\n\nuniform bool uUseVertexColor;\nuniform vec4 uMaterialColor;\n\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\nvarying vec3 vViewPosition;\nvarying vec3 vAmbientColor;\nvarying vec4 vColor;\n\nvoid main(void) {\n\n  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);\n\n  // Pass varyings to fragment shader\n  vViewPosition = viewModelPosition.xyz;\n  gl_Position = uProjectionMatrix * viewModelPosition;  \n\n  vNormal = uNormalMatrix * aNormal;\n  vTexCoord = aTexCoord;\n\n  // TODO: this should be a uniform\n  vAmbientColor = vec3(0.0);\n  for (int i = 0; i < 5; i++) {\n    if (i < uAmbientLightCount) {\n      vAmbientColor += uAmbientColor[i];\n    }\n  }\n  \n  vColor = (uUseVertexColor ? aVertexColor : uMaterialColor);\n}\n',
  phongFrag: lightingShader + '// include lighting.glsl\nprecision highp float;\nprecision highp int;\n\nuniform vec4 uSpecularMatColor;\nuniform vec4 uAmbientMatColor;\nuniform vec4 uEmissiveMatColor;\n\nuniform vec4 uTint;\nuniform sampler2D uSampler;\nuniform bool isTexture;\n\nvarying vec3 vNormal;\nvarying vec2 vTexCoord;\nvarying vec3 vViewPosition;\nvarying vec3 vAmbientColor;\nvarying vec4 vColor;\n\nvoid main(void) {\n\n  vec3 diffuse;\n  vec3 specular;\n  totalLight(vViewPosition, normalize(vNormal), diffuse, specular);\n\n  // Calculating final color as result of all lights (plus emissive term).\n\n  vec4 baseColor = isTexture ? texture2D(uSampler, vTexCoord) * (uTint / vec4(255, 255, 255, 255)) : vColor;\n  gl_FragColor = vec4(diffuse * baseColor.rgb + \n                    vAmbientColor * uAmbientMatColor.rgb + \n                    specular * uSpecularMatColor.rgb + \n                    uEmissiveMatColor.rgb, 1.) * baseColor.a;\n}\n',
};

defaultShaders.phongFrag =
`
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

  // Calculating final color as result of all lights (plus emissive term).

  vec4 baseColor = isTexture
    // Textures come in with premultiplied alpha. To apply tint and still have
    // premultiplied alpha output, we need to multiply the RGB channels by the
    // tint RGB, and all channels by the tint alpha.
    ? texture2D(uSampler, vTexCoord) * vec4(uTint.rgb/255., 1.) * (uTint.a/255.)
    // Colors come in with unmultiplied alpha, so we need to multiply the RGB
    // channels by alpha to convert it to premultiplied alpha.
    : vec4(vColor.rgb * vColor.a, vColor.a);

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

  gl_FragColor = vec4(diffuse, baseColor.a);
}
`;

p5.RendererGL.prototype._getLightShader = function () {
  if (!this._defaultLightShader) {
    if (this._pInst._glAttributes.perPixelLighting) {
      this._defaultLightShader = new p5.Shader(this, defaultShaders.phongVert, defaultShaders.phongFrag);
    } else {
      this._defaultLightShader = new p5.Shader(this, defaultShaders.lightVert, defaultShaders.lightTextureFrag);
    }
  }
  return this._defaultLightShader;
};

p5.prototype.ambientMode = function (mode) {
  this._assert3d('ambientMode');
  if (this._renderer.ambientMode === undefined) {
    this._renderer.ambientMode = 0;
  }
  if (mode === ADD){ this._renderer.ambientMode = 0; }
  else if (mode === SCREEN){ this._renderer.ambientMode = 1; }
  else if (mode === MULTIPLY){ this._renderer.ambientMode = 2; }
  else if (mode === OVERLAY){ this._renderer.ambientMode = 3; }
  else if (mode === SOFT_LIGHT){ this._renderer.ambientMode = 4; }
	else if (mode === HARD_LIGHT){ this._renderer.ambientMode = 5; }
  else {
    console.warn('There are only 6 blendModes that can be used to apply ambientColor: ADD, SCREEN, MULTIPLY, OVERLAY, SOFT_LIGHT, HARD_LIGHT.');
  }
  return this;
};

p5.RendererGL.prototype._setFillUniforms = function (fillShader) {

  if (this.ambientMode === undefined) {
    this.ambientMode = 0; // ADD default.
  }

  fillShader.bindShader(); // TODO: optimize
  fillShader.setUniform('uUseVertexColor', this._useVertexColor);
  fillShader.setUniform('uMaterialColor', this.curFillColor);
  fillShader.setUniform('isTexture', !!this._tex);
  if (this._tex) {
    fillShader.setUniform('uSampler', this._tex);
  }
  fillShader.setUniform('uTint', this._tint);
  fillShader.setUniform('uAmbientMatColor', this.curAmbientColor);
  fillShader.setUniform('uSpecularMatColor', this.curSpecularColor);
  fillShader.setUniform('uEmissiveMatColor', this.curEmissiveColor);
  fillShader.setUniform('uSpecular', this._useSpecularMaterial);
  fillShader.setUniform('uEmissive', this._useEmissiveMaterial);
  fillShader.setUniform('uShininess', this._useShininess);
  fillShader.setUniform('uUseLighting', this._enableLighting);
  var pointLightCount = this.pointLightDiffuseColors.length / 3;
  fillShader.setUniform('uPointLightCount', pointLightCount);
  fillShader.setUniform('uPointLightLocation', this.pointLightPositions);
  fillShader.setUniform('uPointLightDiffuseColors', this.pointLightDiffuseColors);
  fillShader.setUniform('uPointLightSpecularColors', this.pointLightSpecularColors);
  var directionalLightCount = this.directionalLightDiffuseColors.length / 3;
  fillShader.setUniform('uDirectionalLightCount', directionalLightCount);
  fillShader.setUniform('uLightingDirection', this.directionalLightDirections);
  fillShader.setUniform('uDirectionalDiffuseColors', this.directionalLightDiffuseColors);
  fillShader.setUniform('uDirectionalSpecularColors', this.directionalLightSpecularColors); // TODO: sum these here...

  var ambientLightCount = this.ambientLightColors.length / 3;
  fillShader.setUniform('uAmbientLightCount', ambientLightCount);
  fillShader.setUniform('uAmbientColor', this.ambientLightColors);
  // この一行を追加する
  fillShader.setUniform('uAmbientMode', this.ambientMode);

  var spotLightCount = this.spotLightDiffuseColors.length / 3;
  fillShader.setUniform('uSpotLightCount', spotLightCount);
  fillShader.setUniform('uSpotLightAngle', this.spotLightAngle);
  fillShader.setUniform('uSpotLightConc', this.spotLightConc);
  fillShader.setUniform('uSpotLightDiffuseColors', this.spotLightDiffuseColors);
  fillShader.setUniform('uSpotLightSpecularColors', this.spotLightSpecularColors);
  fillShader.setUniform('uSpotLightLocation', this.spotLightPositions);
  fillShader.setUniform('uSpotLightDirection', this.spotLightDirections);
  fillShader.setUniform('uConstantAttenuation', this.constantAttenuation);
  fillShader.setUniform('uLinearAttenuation', this.linearAttenuation);
  fillShader.setUniform('uQuadraticAttenuation', this.quadraticAttenuation);
  fillShader.bindTextures();
};

import{ProcessApproach as r}from"../../../foundation/definitions/ProcessApproach.js";import{getTextureAndSamplerNames as o}from"../../../foundation/helpers/ShaderHelper.js";import{StandardShaderPart as l}from"../StandardShaderPart.js";var i=class extends l{constructor(a){super();this.__functionName=a;this.__variableName="";this.__sRGB=!0}setVariableName(a){this.__variableName=a}setSrgbFlag(a){this.__sRGB=a}getVertexShaderDefinitions(a){if(a.engineState.currentProcessApproach===r.WebGPU){let{textureName:e,samplerName:t}=o(this.__variableName);return`
fn ${this.__functionName}(uv: vec2f, scale: vec2f, offset: vec2f, rotation: f32, lod: f32, rgba: ptr<function, vec4<f32>>, rgb: ptr<function, vec3<f32>>, r: ptr<function, f32>, g: ptr<function, f32>, b: ptr<function, f32>, a: ptr<function, f32>, uvOut: ptr<function, vec2f>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${e}TexUv = uvTransform(scale, offset, rotation, uv);
  var lodFloat = lod;
  if (lodFloat < 0.0) {
    lodFloat = 0.0;
  }
  var rgbaValue = textureSampleLevel(${e}, ${t}, ${e}TexUv, lodFloat);
  ${this.__sRGB?"rgbaValue = vec4f(srgbToLinear(rgbaValue.rgb), rgbaValue.a);":""}
  *rgba = rgbaValue;
  *rgb = rgbaValue.rgb;
  *r = rgbaValue.r;
  *g = rgbaValue.g;
  *b = rgbaValue.b;
  *a = rgbaValue.a;
  *uvOut = ${e}TexUv;
}
`}return`
void ${this.__functionName}(vec2 uv, vec2 scale, vec2 offset, float rotation, float lod, out vec4 rgba, out vec3 rgb, out float r, out float g, out float b, out float a, out vec2 uvOut) {
  ${this.getMaterialSIDForWebGL()}
  vec2 ${this.__variableName}TexUv = uvTransform(scale, offset, rotation, uv);
  float lodFloat = lod;
  vec4 rgbaValue;
  if (lodFloat < 0.0) {
    rgbaValue = texture(u_${this.__variableName}, ${this.__variableName}TexUv);
  } else {
    rgbaValue = textureLod(u_${this.__variableName}, ${this.__variableName}TexUv, lodFloat);
  }
  ${this.__sRGB?"rgbaValue.rgb = srgbToLinear(rgbaValue.rgb);":""}
  rgba = rgbaValue;
  rgb = rgbaValue.rgb;
  r = rgbaValue.r;
  g = rgbaValue.g;
  b = rgbaValue.b;
  a = rgbaValue.a;
  uvOut = ${this.__variableName}TexUv;
}
`}getPixelShaderDefinitions(a){if(a.engineState.currentProcessApproach===r.WebGPU){let{textureName:e,samplerName:t}=o(this.__variableName);return`
fn ${this.__functionName}(uv: vec2f, scale: vec2f, offset: vec2f, rotation: f32, lod: f32, rgba: ptr<function, vec4<f32>>, rgb: ptr<function, vec3<f32>>, r: ptr<function, f32>, g: ptr<function, f32>, b: ptr<function, f32>, a: ptr<function, f32>, uvOut: ptr<function, vec2f>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${e}TexUv = uvTransform(scale, offset, rotation, uv);
  var lodFloat = lod;
  var rgbaValue: vec4<f32>;
  #ifdef RN_RAYMARCHING_SHADING
    // The raymarching shading section runs in non-uniform control flow, where implicit
    // derivatives (textureSample) are not allowed in WGSL.
    rgbaValue = textureSampleLevel(${e}, ${t}, ${e}TexUv, max(lodFloat, 0.0));
  #else
    if (lodFloat < 0.0) {
      rgbaValue = textureSample(${e}, ${t}, ${e}TexUv);
    } else {
      rgbaValue = textureSampleLevel(${e}, ${t}, ${e}TexUv, lodFloat);
    }
  #endif
  ${this.__sRGB?"rgbaValue = vec4f(srgbToLinear(rgbaValue.rgb), rgbaValue.a);":""}
  *rgba = rgbaValue;
  *rgb = rgbaValue.rgb;
  *r = rgbaValue.r;
  *g = rgbaValue.g;
  *b = rgbaValue.b;
  *a = rgbaValue.a;
  *uvOut = ${e}TexUv;
}
`}return`
void ${this.__functionName}(vec2 uv, vec2 scale, vec2 offset, float rotation, float lod, out vec4 rgba, out vec3 rgb, out float r, out float g, out float b, out float a, out vec2 uvOut) {
  ${this.getMaterialSIDForWebGL()}
  vec2 ${this.__variableName}TexUv = uvTransform(scale, offset, rotation, uv);
  float lodFloat = lod;
  vec4 rgbaValue;
  if (lodFloat < 0.0) {
    rgbaValue = texture(u_${this.__variableName}, ${this.__variableName}TexUv);
  } else {
    rgbaValue = textureLod(u_${this.__variableName}, ${this.__variableName}TexUv, lodFloat);
  }
  ${this.__sRGB?"rgbaValue.rgb = srgbToLinear(rgbaValue.rgb);":""}
  rgba = rgbaValue;
  rgb = rgbaValue.rgb;
  r = rgbaValue.r;
  g = rgbaValue.g;
  b = rgbaValue.b;
  a = rgbaValue.a;
  uvOut = ${this.__variableName}TexUv;
}
`}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{i as Texture2DShader};

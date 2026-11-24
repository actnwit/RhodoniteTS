import{ProcessApproach as r}from"../../../foundation/definitions/ProcessApproach.js";import{getTextureAndSamplerNames as o}from"../../../foundation/helpers/ShaderHelper.js";import{StandardShaderPart as l}from"../StandardShaderPart.js";var u=class extends l{constructor(t){super();this.$A=t;this.qA="";this.uV=!0}setVariableName(t){this.qA=t}setSrgbFlag(t){this.uV=t}getVertexShaderDefinitions(t){if(t.engineState.currentProcessApproach===r.WebGPU){let{textureName:e,samplerName:a}=o(this.qA);return`
fn ${this.$A}(uv: vec2f, scale: vec2f, offset: vec2f, rotation: f32, lod: f32, rgba: ptr<function, vec4<f32>>, rgb: ptr<function, vec3<f32>>, r: ptr<function, f32>, g: ptr<function, f32>, b: ptr<function, f32>, a: ptr<function, f32>, uvOut: ptr<function, vec2f>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${e}TexUv = uvTransform(scale, offset, rotation, uv);
  var lodFloat = lod;
  if (lodFloat < 0.0) {
    lodFloat = 0.0;
  }
  var rgbaValue = textureSampleLevel(${e}, ${a}, ${e}TexUv, lodFloat);
  ${this.uV?"rgbaValue = vec4f(srgbToLinear(rgbaValue.rgb), rgbaValue.a);":""}
  *rgba = rgbaValue;
  *rgb = rgbaValue.rgb;
  *r = rgbaValue.r;
  *g = rgbaValue.g;
  *b = rgbaValue.b;
  *a = rgbaValue.a;
  *uvOut = ${e}TexUv;
}
`}return`
void ${this.$A}(vec2 uv, vec2 scale, vec2 offset, float rotation, float lod, out vec4 rgba, out vec3 rgb, out float r, out float g, out float b, out float a, out vec2 uvOut) {
  ${this.getMaterialSIDForWebGL()}
  vec2 ${this.qA}TexUv = uvTransform(scale, offset, rotation, uv);
  float lodFloat = lod;
  vec4 rgbaValue;
  if (lodFloat < 0.0) {
    rgbaValue = texture(u_${this.qA}, ${this.qA}TexUv);
  } else {
    rgbaValue = textureLod(u_${this.qA}, ${this.qA}TexUv, lodFloat);
  }
  ${this.uV?"rgbaValue.rgb = srgbToLinear(rgbaValue.rgb);":""}
  rgba = rgbaValue;
  rgb = rgbaValue.rgb;
  r = rgbaValue.r;
  g = rgbaValue.g;
  b = rgbaValue.b;
  a = rgbaValue.a;
  uvOut = ${this.qA}TexUv;
}
`}getPixelShaderDefinitions(t){if(t.engineState.currentProcessApproach===r.WebGPU){let{textureName:e,samplerName:a}=o(this.qA);return`
fn ${this.$A}(uv: vec2f, scale: vec2f, offset: vec2f, rotation: f32, lod: f32, rgba: ptr<function, vec4<f32>>, rgb: ptr<function, vec3<f32>>, r: ptr<function, f32>, g: ptr<function, f32>, b: ptr<function, f32>, a: ptr<function, f32>, uvOut: ptr<function, vec2f>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${e}TexUv = uvTransform(scale, offset, rotation, uv);
  var lodFloat = lod;
  var rgbaValue: vec4<f32>;
  #ifdef RN_RAYMARCHING_SHADING
    // The raymarching shading section runs in non-uniform control flow, where implicit
    // derivatives (textureSample) are not allowed in WGSL.
    rgbaValue = textureSampleLevel(${e}, ${a}, ${e}TexUv, max(lodFloat, 0.0));
  #else
    if (lodFloat < 0.0) {
      rgbaValue = textureSample(${e}, ${a}, ${e}TexUv);
    } else {
      rgbaValue = textureSampleLevel(${e}, ${a}, ${e}TexUv, lodFloat);
    }
  #endif
  ${this.uV?"rgbaValue = vec4f(srgbToLinear(rgbaValue.rgb), rgbaValue.a);":""}
  *rgba = rgbaValue;
  *rgb = rgbaValue.rgb;
  *r = rgbaValue.r;
  *g = rgbaValue.g;
  *b = rgbaValue.b;
  *a = rgbaValue.a;
  *uvOut = ${e}TexUv;
}
`}return`
void ${this.$A}(vec2 uv, vec2 scale, vec2 offset, float rotation, float lod, out vec4 rgba, out vec3 rgb, out float r, out float g, out float b, out float a, out vec2 uvOut) {
  ${this.getMaterialSIDForWebGL()}
  vec2 ${this.qA}TexUv = uvTransform(scale, offset, rotation, uv);
  float lodFloat = lod;
  vec4 rgbaValue;
  if (lodFloat < 0.0) {
    rgbaValue = texture(u_${this.qA}, ${this.qA}TexUv);
  } else {
    rgbaValue = textureLod(u_${this.qA}, ${this.qA}TexUv, lodFloat);
  }
  ${this.uV?"rgbaValue.rgb = srgbToLinear(rgbaValue.rgb);":""}
  rgba = rgbaValue;
  rgb = rgbaValue.rgb;
  r = rgbaValue.r;
  g = rgbaValue.g;
  b = rgbaValue.b;
  a = rgbaValue.a;
  uvOut = ${this.qA}TexUv;
}
`}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{u as Texture2DShader};

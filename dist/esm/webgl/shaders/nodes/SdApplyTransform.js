import{ProcessApproach as n}from"../../../foundation/definitions/ProcessApproach.js";import{RaymarchingShaderPart as i}from"../RaymarchingShaderPart.js";var t=class extends i{constructor(e,r){super(),this.__shaderFunctionName=e,this.__scaleGlobalName=r}get scaleGlobalName(){return this.__scaleGlobalName}getVertexShaderDefinitions(e){return""}get vertexShaderBody(){return""}getPixelShaderDefinitions(e){return e.engineState.currentProcessApproach===n.WebGPU?`
var<private> ${this.__scaleGlobalName}: f32 = 1.0;
fn ${this.__shaderFunctionName}(position: vec3f, translation: vec3f, xyzEulerAngles: vec3f, scale: vec3f, outTransformedPosition: ptr<function, vec3f>) {
  ${this.__scaleGlobalName} = clamp(min(abs(scale.x), min(abs(scale.y), abs(scale.z))), 0.0001, 1.0);
  let transform = createTransformMatrix(translation, xyzEulerAngles, scale);
  let inv = inverseTransform(transform);
  *outTransformedPosition = (inv * vec4f(position, 1.0)).xyz;
}
`:`
float ${this.__scaleGlobalName} = 1.0;
void ${this.__shaderFunctionName}(in vec3 position, in vec3 translation, in vec3 xyzEulerAngles, in vec3 scale, out vec3 outTransformedPosition) {
  ${this.__scaleGlobalName} = clamp(min(abs(scale.x), min(abs(scale.y), abs(scale.z))), 0.0001, 1.0);
  mat4 transform = createTransformMatrix(translation, xyzEulerAngles, scale);
  mat4 inv = inverseTransform(transform);
  outTransformedPosition = (inv * vec4(position, 1.0)).xyz;
}
`}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{t as SdApplyTransformShader};

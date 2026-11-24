import{ProcessApproach as i}from"../../../foundation/definitions/ProcessApproach.js";import{RaymarchingShaderPart as n}from"../RaymarchingShaderPart.js";var e=class extends n{constructor(t,r){super(),this.gS=t,this.t0=r}get scaleGlobalName(){return this.t0}getVertexShaderDefinitions(t){return""}get vertexShaderBody(){return""}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===i.WebGPU?`
var<private> ${this.t0}: f32 = 1.0;
fn ${this.gS}(position: vec3f, translation: vec3f, xyzEulerAngles: vec3f, scale: vec3f, outTransformedPosition: ptr<function, vec3f>) {
  ${this.t0} = clamp(min(abs(scale.x), min(abs(scale.y), abs(scale.z))), 0.0001, 1.0);
  let transform = createTransformMatrix(translation, xyzEulerAngles, scale);
  let inv = inverseTransform(transform);
  *outTransformedPosition = (inv * vec4f(position, 1.0)).xyz;
}
`:`
float ${this.t0} = 1.0;
void ${this.gS}(in vec3 position, in vec3 translation, in vec3 xyzEulerAngles, in vec3 scale, out vec3 outTransformedPosition) {
  ${this.t0} = clamp(min(abs(scale.x), min(abs(scale.y), abs(scale.z))), 0.0001, 1.0);
  mat4 transform = createTransformMatrix(translation, xyzEulerAngles, scale);
  mat4 inv = inverseTransform(transform);
  outTransformedPosition = (inv * vec4(position, 1.0)).xyz;
}
`}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{e as SdApplyTransformShader};

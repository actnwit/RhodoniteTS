import{ProcessApproach as e}from"../../../foundation/definitions/ProcessApproach.js";import{RaymarchingShaderPart as i}from"../RaymarchingShaderPart.js";var r=class extends i{constructor(t){super();this.qA="";this.gS="";this.gS=t}setVariableName(t){this.qA=t}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU,""}get vertexShaderBody(){return""}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU?`
fn ${this.gS}(position: vec3f, outTransformedPosition: ptr<function, vec3f>) {
  let transform = get_${this.qA}(uniformDrawParameters.materialSid, 0u);
  let inv = inverseMat4(transform);
  let tp = (inv * vec4f(position, 1.0)).xyz;
  *outTransformedPosition = tp;
}
      `:`
void ${this.gS}(in vec3 position, out vec3 outTransformedPosition) {
  ${this.getMaterialSIDForWebGL()}
  mat4 transform = get_${this.qA}(materialSID, 0u);
  mat4 inv = inverse(transform);
  vec3 tp = (inv * vec4(position, 1.0)).xyz;
  outTransformedPosition = tp;
}
      `}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{r as SdApplyWorldMatrixShader};

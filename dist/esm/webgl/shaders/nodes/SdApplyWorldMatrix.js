import{ProcessApproach as e}from"../../../foundation/definitions/ProcessApproach.js";import{RaymarchingShaderPart as i}from"../RaymarchingShaderPart.js";var r=class extends i{constructor(t){super();this.__variableName="";this.__shaderFunctionName="";this.__shaderFunctionName=t}setVariableName(t){this.__variableName=t}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU,""}get vertexShaderBody(){return""}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU?`
fn ${this.__shaderFunctionName}(position: vec3f, outTransformedPosition: ptr<function, vec3f>) {
  let transform = get_${this.__variableName}(uniformDrawParameters.materialSid, 0u);
  let inv = inverseMat4(transform);
  let tp = (inv * vec4f(position, 1.0)).xyz;
  *outTransformedPosition = tp;
}
      `:`
void ${this.__shaderFunctionName}(in vec3 position, out vec3 outTransformedPosition) {
  ${this.getMaterialSIDForWebGL()}
  mat4 transform = get_${this.__variableName}(materialSID, 0u);
  mat4 inv = inverse(transform);
  vec3 tp = (inv * vec4(position, 1.0)).xyz;
  outTransformedPosition = tp;
}
      `}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{r as SdApplyWorldMatrixShader};

import{ProcessApproach as r}from"../../../foundation/definitions/ProcessApproach.js";import{RaymarchingShaderPart as i}from"../RaymarchingShaderPart.js";var t=class extends i{constructor(e){super();this.__variableName="";this.__shaderFunctionName="";this.__shaderFunctionName=e}setVariableName(e){this.__variableName=e}getVertexShaderDefinitions(e){return""}get vertexShaderBody(){return""}getPixelShaderDefinitions(e){return e.engineState.currentProcessApproach===r.WebGPU?`
fn ${this.__shaderFunctionName}(outValue: ptr<function, f32>) {
  *outValue = get_${this.__variableName}(uniformDrawParameters.materialSid, 0u);
}
      `:`
void ${this.__shaderFunctionName}(out float outValue) {
  ${this.getMaterialSIDForWebGL()}
  outValue = get_${this.__variableName}(materialSID, 0u);
}
      `}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{t as RaymarchObjectIdUniformShader};

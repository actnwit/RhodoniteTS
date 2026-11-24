import{ProcessApproach as r}from"../../../foundation/definitions/ProcessApproach.js";import{RaymarchingShaderPart as i}from"../RaymarchingShaderPart.js";var e=class extends i{constructor(t){super();this.qA="";this.gS="";this.gS=t}setVariableName(t){this.qA=t}getVertexShaderDefinitions(t){return""}get vertexShaderBody(){return""}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===r.WebGPU?`
fn ${this.gS}(outValue: ptr<function, f32>) {
  *outValue = get_${this.qA}(uniformDrawParameters.materialSid, 0u);
}
      `:`
void ${this.gS}(out float outValue) {
  ${this.getMaterialSIDForWebGL()}
  outValue = get_${this.qA}(materialSID, 0u);
}
      `}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{e as RaymarchObjectIdUniformShader};

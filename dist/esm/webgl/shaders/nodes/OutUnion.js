import{ProcessApproach as n}from"../../../foundation/definitions/ProcessApproach.js";import{RaymarchingShaderPart as r}from"../RaymarchingShaderPart.js";var a=class extends r{constructor(t,e=[],i=[]){super(),this.__shaderFunctionName=t,this.__distanceCorrectionUniformNames=[...e],this.__distanceScaleGlobalNames=[...i]}getVertexShaderDefinitions(t){return""}get vertexShaderBody(){return""}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===n.WebGPU?`
fn ${this.__shaderFunctionName}(value: f32, objectId: f32) {
  var distanceScale = 1.0;
${this.__distanceCorrectionUniformNames.map(e=>`  distanceScale = min(distanceScale, rnRaymarchDistanceScale(get_${e}(uniformDrawParameters.materialSid, 0u)));
`).join("")}${this.__distanceScaleGlobalNames.map(e=>`  distanceScale = min(distanceScale, ${e});
`).join("")}  distanceScale = clamp(distanceScale, 0.0001, 1.0);
  let scaledValue = value * distanceScale;
  if (scaledValue < g_distance) {
    g_distance = scaledValue;
    g_hitObjectId = objectId;
  }
}
`:`
void ${this.__shaderFunctionName}(in float value, in float objectId) {
  ${this.getMaterialSIDForWebGL()}
  float distanceScale = 1.0;
${this.__distanceCorrectionUniformNames.map(e=>`  distanceScale = min(distanceScale, rnRaymarchDistanceScale(get_${e}(materialSID, 0u)));
`).join("")}${this.__distanceScaleGlobalNames.map(e=>`  distanceScale = min(distanceScale, ${e});
`).join("")}  distanceScale = clamp(distanceScale, 0.0001, 1.0);
  float scaledValue = value * distanceScale;
  if (scaledValue < g_distance) {
    g_distance = scaledValue;
    g_hitObjectId = objectId;
  }
}
`}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{a as OutUnionShader};

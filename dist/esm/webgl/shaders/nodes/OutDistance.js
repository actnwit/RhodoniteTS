import{ProcessApproach as i}from"../../../foundation/definitions/ProcessApproach.js";import{ShaderNode as s}from"../../../foundation/definitions/ShaderNode.js";import{RaymarchingShaderPart as c}from"../RaymarchingShaderPart.js";var a=class a extends c{static getInstance(){return this.e$||(this.e$=new a),this.e$}constructor(t="outDistance",e=[],r=[]){super(),this.gS=t,this.DS=[...e],this.jS=[...r]}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===i.WebGPU,""}get vertexShaderBody(){return""}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===i.WebGPU?`
fn ${this.gS}(value: f32, objectId: f32) {
  var distanceScale = 1.0;
${this.DS.map(e=>`  distanceScale = min(distanceScale, rnRaymarchDistanceScale(get_${e}(uniformDrawParameters.materialSid, 0u)));
`).join("")}${this.jS.map(e=>`  distanceScale = min(distanceScale, ${e});
`).join("")}  distanceScale = clamp(distanceScale, 0.0001, 1.0);
  let scaledValue = value * distanceScale;
  if (scaledValue < g_distance) {
    g_distance = scaledValue;
    g_hitObjectId = objectId;
  }
}
`:`
void ${this.gS}(in float value, in float objectId) {
  ${this.getMaterialSIDForWebGL()}
  float distanceScale = 1.0;
${this.DS.map(e=>`  distanceScale = min(distanceScale, rnRaymarchDistanceScale(get_${e}(materialSID, 0u)));
`).join("")}${this.jS.map(e=>`  distanceScale = min(distanceScale, ${e});
`).join("")}  distanceScale = clamp(distanceScale, 0.0001, 1.0);
  float scaledValue = value * distanceScale;
  if (scaledValue < g_distance) {
    g_distance = scaledValue;
    g_hitObjectId = objectId;
  }
}
`}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};a.materialElement=s.PBRShading;var n=a;export{n as OutDistanceShader};

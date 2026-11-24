import{ProcessApproach as e}from"../../../foundation/definitions/ProcessApproach.js";import{StandardShaderPart as o}from"../StandardShaderPart.js";var i=class extends o{constructor(t,r,p){super();this.__functionName=t;this.__compositionType=r;this.__componentType=p;this.__variableName="";this.__valueStr=""}setVariableName(t){this.__variableName=t}setDefaultValue(t){this.__valueStr=t.toString()}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU?`
// #param ${this.__variableName}: ${this.__compositionType.toWGSLType(this.__componentType)}; // initialValue=${this.__valueStr}
fn ${this.__functionName}(outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
  *outValue = get_${this.__variableName}(uniformDrawParameters.materialSid, 0u);
}
`:`
uniform ${this.__compositionType.getGlslStr(this.__componentType)} u_${this.__variableName}; // initialValue=${this.__valueStr}
void ${this.__functionName}(out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
  ${this.getMaterialSIDForWebGL()}

  outValue = get_${this.__variableName}(materialSID, 0u);
}
`}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU?`
// #param ${this.__variableName}: ${this.__compositionType.toWGSLType(this.__componentType)}; // initialValue=${this.__valueStr}
fn ${this.__functionName}(outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
  *outValue = get_${this.__variableName}(uniformDrawParameters.materialSid, 0u);
}
`:`
uniform ${this.__compositionType.getGlslStr(this.__componentType)} u_${this.__variableName}; // initialValue=${this.__valueStr}
void ${this.__functionName}(out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
  ${this.getMaterialSIDForWebGL()}

outValue = get_${this.__variableName}(materialSID, 0u);
    }
    `}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{i as UniformDataShader};

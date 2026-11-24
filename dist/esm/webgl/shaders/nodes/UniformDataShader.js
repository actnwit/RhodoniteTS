import{ProcessApproach as e}from"../../../foundation/definitions/ProcessApproach.js";import{StandardShaderPart as r}from"../StandardShaderPart.js";var i=class extends r{constructor(t,s,a){super();this.$A=t;this.o_=s;this.s_=a;this.qA="";this.t$=""}setVariableName(t){this.qA=t}setDefaultValue(t){this.t$=t.toString()}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU?`
// #param ${this.qA}: ${this.o_.toWGSLType(this.s_)}; // initialValue=${this.t$}
fn ${this.$A}(outValue: ptr<function, ${this.o_.toWGSLType(this.s_)}>) {
  *outValue = get_${this.qA}(uniformDrawParameters.materialSid, 0u);
}
`:`
uniform ${this.o_.getGlslStr(this.s_)} u_${this.qA}; // initialValue=${this.t$}
void ${this.$A}(out ${this.o_.getGlslStr(this.s_)} outValue) {
  ${this.getMaterialSIDForWebGL()}

  outValue = get_${this.qA}(materialSID, 0u);
}
`}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU?`
// #param ${this.qA}: ${this.o_.toWGSLType(this.s_)}; // initialValue=${this.t$}
fn ${this.$A}(outValue: ptr<function, ${this.o_.toWGSLType(this.s_)}>) {
  *outValue = get_${this.qA}(uniformDrawParameters.materialSid, 0u);
}
`:`
uniform ${this.o_.getGlslStr(this.s_)} u_${this.qA}; // initialValue=${this.t$}
void ${this.$A}(out ${this.o_.getGlslStr(this.s_)} outValue) {
  ${this.getMaterialSIDForWebGL()}

outValue = get_${this.qA}(materialSID, 0u);
    }
    `}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{i as UniformDataShader};

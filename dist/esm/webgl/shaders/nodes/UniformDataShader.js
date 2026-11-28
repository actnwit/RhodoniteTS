import{ProcessApproach as e}from"../../../foundation/definitions/ProcessApproach.js";import{StandardShaderPart as r}from"../StandardShaderPart.js";var i=class extends r{constructor(t,s,a){super();this.$A=t;this.p_=s;this.c_=a;this.qA="";this.t$=""}setVariableName(t){this.qA=t}setDefaultValue(t){this.t$=t.toString()}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU?`
// #param ${this.qA}: ${this.p_.toWGSLType(this.c_)}; // initialValue=${this.t$}
fn ${this.$A}(outValue: ptr<function, ${this.p_.toWGSLType(this.c_)}>) {
  *outValue = get_${this.qA}(uniformDrawParameters.materialSid, 0u);
}
`:`
uniform ${this.p_.getGlslStr(this.c_)} u_${this.qA}; // initialValue=${this.t$}
void ${this.$A}(out ${this.p_.getGlslStr(this.c_)} outValue) {
  ${this.getMaterialSIDForWebGL()}

  outValue = get_${this.qA}(materialSID, 0u);
}
`}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===e.WebGPU?`
// #param ${this.qA}: ${this.p_.toWGSLType(this.c_)}; // initialValue=${this.t$}
fn ${this.$A}(outValue: ptr<function, ${this.p_.toWGSLType(this.c_)}>) {
  *outValue = get_${this.qA}(uniformDrawParameters.materialSid, 0u);
}
`:`
uniform ${this.p_.getGlslStr(this.c_)} u_${this.qA}; // initialValue=${this.t$}
void ${this.$A}(out ${this.p_.getGlslStr(this.c_)} outValue) {
  ${this.getMaterialSIDForWebGL()}

outValue = get_${this.qA}(materialSID, 0u);
    }
    `}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{i as UniformDataShader};

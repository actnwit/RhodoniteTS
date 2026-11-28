import{ComponentType as r}from"../../../foundation/definitions/ComponentType.js";import{ProcessApproach as i}from"../../../foundation/definitions/ProcessApproach.js";import{StandardShaderPart as n}from"../StandardShaderPart.js";var o=class extends n{constructor(t,e,p){super();this.$A=t;this.p_=e;this.c_=p;this.oV=""}setConstantValue(t){let e="";this.c_.isFloatingPoint()?e=t.glslStrAsFloat:this.c_.isInteger()?e=t.glslStrAsInt:this.c_.isUnsignedInteger()?e=t.glslStrAsUint:this.c_===r.Bool&&(e=t.x?"true":"false"),this.oV=e}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===i.WebGPU?`
      fn ${this.$A}(
        outValue: ptr<function, ${this.p_.toWGSLType(this.c_)}>) {
        *outValue = ${this.oV};
      }
      `:`
      void ${this.$A}(
        out ${this.p_.getGlslStr(this.c_)} outValue) {
        outValue = ${this.oV};
      }
      `}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===i.WebGPU?`
      fn ${this.$A}(
        outValue: ptr<function, ${this.p_.toWGSLType(this.c_)}>) {
        *outValue = ${this.oV};
      }
      `:`
      void ${this.$A}(
        out ${this.p_.getGlslStr(this.c_)} outValue) {
        outValue = ${this.oV};
      }
      `}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{o as ConstantVariableShader};

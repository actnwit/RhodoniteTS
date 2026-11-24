import{ComponentType as r}from"../../../foundation/definitions/ComponentType.js";import{ProcessApproach as i}from"../../../foundation/definitions/ProcessApproach.js";import{StandardShaderPart as n}from"../StandardShaderPart.js";var o=class extends n{constructor(t,e,p){super();this.$A=t;this.o_=e;this.s_=p;this.oV=""}setConstantValue(t){let e="";this.s_.isFloatingPoint()?e=t.glslStrAsFloat:this.s_.isInteger()?e=t.glslStrAsInt:this.s_.isUnsignedInteger()?e=t.glslStrAsUint:this.s_===r.Bool&&(e=t.x?"true":"false"),this.oV=e}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===i.WebGPU?`
      fn ${this.$A}(
        outValue: ptr<function, ${this.o_.toWGSLType(this.s_)}>) {
        *outValue = ${this.oV};
      }
      `:`
      void ${this.$A}(
        out ${this.o_.getGlslStr(this.s_)} outValue) {
        outValue = ${this.oV};
      }
      `}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===i.WebGPU?`
      fn ${this.$A}(
        outValue: ptr<function, ${this.o_.toWGSLType(this.s_)}>) {
        *outValue = ${this.oV};
      }
      `:`
      void ${this.$A}(
        out ${this.o_.getGlslStr(this.s_)} outValue) {
        outValue = ${this.oV};
      }
      `}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{o as ConstantVariableShader};

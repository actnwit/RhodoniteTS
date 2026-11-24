import{ComponentType as i}from"../../../foundation/definitions/ComponentType.js";import{ProcessApproach as o}from"../../../foundation/definitions/ProcessApproach.js";import{StandardShaderPart as r}from"../StandardShaderPart.js";var n=class extends r{constructor(t,e,u){super();this.__functionName=t;this.__compositionType=e;this.__componentType=u;this.__constantValueStr=""}setConstantValue(t){let e="";this.__componentType.isFloatingPoint()?e=t.glslStrAsFloat:this.__componentType.isInteger()?e=t.glslStrAsInt:this.__componentType.isUnsignedInteger()?e=t.glslStrAsUint:this.__componentType===i.Bool&&(e=t.x?"true":"false"),this.__constantValueStr=e}getVertexShaderDefinitions(t){return t.engineState.currentProcessApproach===o.WebGPU?`
      fn ${this.__functionName}(
        outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
        *outValue = ${this.__constantValueStr};
      }
      `:`
      void ${this.__functionName}(
        out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
        outValue = ${this.__constantValueStr};
      }
      `}getPixelShaderDefinitions(t){return t.engineState.currentProcessApproach===o.WebGPU?`
      fn ${this.__functionName}(
        outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
        *outValue = ${this.__constantValueStr};
      }
      `:`
      void ${this.__functionName}(
        out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
        outValue = ${this.__constantValueStr};
      }
      `}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{n as ConstantVariableShader};

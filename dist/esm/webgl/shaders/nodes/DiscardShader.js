import{ProcessApproach as e}from"../../../foundation/definitions/ProcessApproach.js";import{ShaderNode as r}from"../../../foundation/definitions/ShaderNode.js";import{StandardShaderPart as o}from"../StandardShaderPart.js";var t=class t extends o{constructor(){super()}static getInstance(){return this.__instance||(this.__instance=new t),this.__instance}getVertexShaderDefinitions(i){return i.engineState.currentProcessApproach===e.WebGPU?`
      fn conditionalDiscard(condition: bool) {
        // discard is not available in vertex shader
      }
      `:`
      void conditionalDiscard(in bool condition) {
        // discard is not available in vertex shader
      }
      `}get vertexShaderBody(){return""}getPixelShaderDefinitions(i){return i.engineState.currentProcessApproach===e.WebGPU?`
      fn conditionalDiscard(condition: bool) {
        if (condition) {
          discard;
        }
      }
      `:`
      void conditionalDiscard(in bool condition) {
        if (condition) {
          discard;
        }
      }
      `}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};t.materialElement=r.PBRShading;var n=t;export{n as DiscardShader};

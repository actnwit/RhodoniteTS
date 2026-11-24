import{ProcessApproach as e}from"../../../foundation/definitions/ProcessApproach.js";import{ShaderNode as n}from"../../../foundation/definitions/ShaderNode.js";import{StandardShaderPart as o}from"../StandardShaderPart.js";var t=class t extends o{constructor(){super()}static getInstance(){return this.rc||(this.rc=new t),this.rc}getVertexShaderDefinitions(i){return i.engineState.currentProcessApproach===e.WebGPU?`
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
      `}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};t.materialElement=n.PBRShading;var r=t;export{r as DiscardShader};

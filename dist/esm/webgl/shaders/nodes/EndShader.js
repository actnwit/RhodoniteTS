import{ProcessApproach as i}from"../../../foundation/definitions/ProcessApproach.js";import{ShaderNode as r}from"../../../foundation/definitions/ShaderNode.js";import{StandardShaderPart as n}from"../StandardShaderPart.js";var t=class t extends n{constructor(){super()}static getInstance(){return this.rc||(this.rc=new t),this.rc}getVertexShaderDefinitions(e){return e.engineState.currentProcessApproach===i.WebGPU?`
      fn outPosition(inPosition: vec4<f32>) {
        output.position = inPosition;
      }
      `:`
      void outPosition(in vec4 inPosition) {
        gl_Position = inPosition;
      }
      `}get vertexShaderBody(){return`

    `}getPixelShaderDefinitions(e){return e.engineState.currentProcessApproach===i.WebGPU?`
      fn outColor(inColor: vec4<f32>) {
        rt0 = inColor;
      }
      `:`
      void outColor(in vec4 inColor) {
        rt0 = inColor;
      }
      `}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};t.materialElement=r.PBRShading;var o=t;export{o as EndShader};

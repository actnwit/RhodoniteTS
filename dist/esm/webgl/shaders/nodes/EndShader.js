import{ProcessApproach as i}from"../../../foundation/definitions/ProcessApproach.js";import{ShaderNode as n}from"../../../foundation/definitions/ShaderNode.js";import{StandardShaderPart as r}from"../StandardShaderPart.js";var t=class t extends r{constructor(){super()}static getInstance(){return this.__instance||(this.__instance=new t),this.__instance}getVertexShaderDefinitions(e){return e.engineState.currentProcessApproach===i.WebGPU?`
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
      `}getPixelShaderBody(){return""}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};t.materialElement=n.PBRShading;var o=t;export{o as EndShader};

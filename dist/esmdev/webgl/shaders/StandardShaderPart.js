// src/webgl/shaders/StandardShaderPart.ts
import { ComponentType } from "../../foundation/definitions/ComponentType.js";
import { ProcessApproach } from "../../foundation/definitions/ProcessApproach.js";
import { AbstractShaderNode } from "../../foundation/materials/core/AbstractShaderNode.js";
import vertexInputWGSL_ from "../../webgpu/shaderity_shaders/common/vertexInput.wgsl.js";
import morphVariablesGLSL from "../shaderity_shaders/common/morphVariables.glsl.js";
import { CommonShaderPart } from "./CommonShaderPart.js";
var vertexInputWGSL = typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__ ? vertexInputWGSL_ : void 0;
var StandardShaderPart = class extends CommonShaderPart {
  /**
   * Generates the main function beginning code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @returns The shader code string for the main function beginning
   */
  getMainBegin(engine, isVertexStage) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        let str2 = `
var<private> output : VertexOutput;
@vertex
fn main(
${vertexInputWGSL.code}
) -> VertexOutput {
  output.instanceIds = instanceIds;
  /* shaderity: @{mainPrerequisites} */
`;
        return str2;
      }
      let str = `
var<private> rt0: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
@fragment
fn main(
  input: VertexOutput,
) -> @location(0) vec4<f32> {
  /* shaderity: @{mainPrerequisites} */
`;
      return str;
    }
    if (isVertexStage) {
      return `
void main() {
  v_instanceIds = a_instanceIds;
  /* shaderity: @{mainPrerequisites} */
`;
    }
    return `
void main() {
  /* shaderity: @{mainPrerequisites} */
  `;
  }
  /**
   * Generates the main function ending code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param engine - The engine instance
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @returns The shader code string for the main function ending
   */
  getMainEnd(engine, isVertexStage) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        return `
  return output;
}
`;
      }
      return `
  return rt0;
}
`;
    }
    return `
}
`;
  }
  getMaterialSIDForWebGL() {
    return `
  uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID
`;
  }
  /**
   * Generates vertex shader prerequisites including definitions, vertex inputs, and uniform declarations.
   * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
   * @returns The complete vertex shader prerequisites code string
   */
  getVertexPrerequisites(engine, shaderNodes) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const varyingVariables = this.__makeVaryingVariablesWGSL(shaderNodes);
      let vertexShaderPrerequisites2 = "";
      vertexShaderPrerequisites2 += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  ${varyingVariables}
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */
/* shaderity: @{shadowDefinition} */
/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */

`;
      return vertexShaderPrerequisites2;
    }
    let vertexShaderPrerequisites = "";
    vertexShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
#if defined(RN_IS_WEBGL2_MODE) && defined(RN_USE_INSTANCE_SID_TEXTURE)
#define a_instanceIds get_instanceIds()
#else
in uvec4 a_instanceIds;
#endif
#if defined(RN_IS_WEBGL2_MODE) && defined(RN_USE_MATERIAL_SID_ATTRIBUTE)
in uint a_materialSid;
flat out uint v_materialSid;
#endif
/* shaderity: @{prerequisites} */

${morphVariablesGLSL.code}

in vec4 a_position;
#ifdef RN_USE_COLOR_0
  in vec4 a_color;
#else
  const vec4 a_color = vec4(1.0, 1.0, 1.0, 1.0);
#endif
in vec3 a_normal;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in uvec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
in vec4 a_tangent;
flat out uvec4 v_instanceIds;
`;
    vertexShaderPrerequisites += "/* shaderity: @{getters} */";
    vertexShaderPrerequisites += "/* shaderity: @{matricesGetters} */";
    vertexShaderPrerequisites += "/* shaderity: @{opticalDefinition} */";
    vertexShaderPrerequisites += "/* shaderity: @{shadowDefinition} */";
    vertexShaderPrerequisites += "/* shaderity: @{pbrDefinition} */";
    vertexShaderPrerequisites += "/* shaderity: @{iblDefinition} */";
    return vertexShaderPrerequisites;
  }
  /**
   * Creates varying variables declaration string for WebGPU shaders.
   * Analyzes shader node connections to determine which variables need to be passed from vertex to fragment stage.
   *
   * @param shaderNodes - Array of shader nodes to analyze for varying variables
   * @returns WGSL varying variables declaration string
   * @private
   */
  __makeVaryingVariablesWGSL(shaderNodes) {
    const varyings = [];
    const definedVaryings = /* @__PURE__ */ new Set();
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      for (let j = 0; j < shaderNode.inputConnections.length; j++) {
        const inputConnection = shaderNode.inputConnections[j];
        if (inputConnection == null) {
          continue;
        }
        const input = shaderNode.getInputs()[j];
        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        if (inputNode.getShaderStage() === "Vertex" && shaderNode.getShaderStage() === "Fragment") {
          const type = input.compositionType.toWGSLType(input.componentType);
          const name = `${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
          if (definedVaryings.has(name)) {
            continue;
          }
          definedVaryings.add(name);
          const needsFlat = input.componentType.isInteger() || input.componentType.isUnsignedInteger() || input.componentType === ComponentType.Bool;
          varyings.push({
            type,
            name,
            needsFlat
          });
        }
      }
    }
    varyings.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      return 1;
    });
    let varyingVariables = "";
    for (let i = 0; i < varyings.length; i++) {
      const flatAttr = varyings[i].needsFlat ? " @interpolate(flat)" : "";
      varyingVariables += `@location(${i})${flatAttr} ${varyings[i].name}: ${varyings[i].type},
`;
    }
    varyingVariables += `@location(${varyings.length}) @interpolate(flat) instanceIds: vec4<u32>,`;
    return varyingVariables;
  }
  /**
   * Generates fragment/pixel shader prerequisites including definitions and varying variable declarations.
   * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
   * @returns The complete fragment shader prerequisites code string
   */
  getPixelPrerequisites(engine, shaderNodes) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const varyingVariables = this.__makeVaryingVariablesWGSL(shaderNodes);
      let pixelShaderPrerequisites2 = "";
      pixelShaderPrerequisites2 += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  ${varyingVariables}
  @builtin(front_facing) isFront: bool,
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */
/* shaderity: @{shadowDefinition} */
/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */
`;
      return pixelShaderPrerequisites2;
    }
    let pixelShaderPrerequisites = "";
    pixelShaderPrerequisites += `
      #version 300 es
      precision highp float;
      precision highp int;
/* shaderity: @{definitions} */
      #define RN_IS_NODE_SHADER
  /* shaderity: @{prerequisites} */
      flat in uvec4 v_instanceIds;
`;
    pixelShaderPrerequisites += "/* shaderity: @{getters} */";
    pixelShaderPrerequisites += "/* shaderity: @{matricesGetters} */";
    pixelShaderPrerequisites += "/* shaderity: @{opticalDefinition} */";
    pixelShaderPrerequisites += "/* shaderity: @{shadowDefinition} */";
    pixelShaderPrerequisites += "/* shaderity: @{pbrDefinition} */";
    pixelShaderPrerequisites += "/* shaderity: @{iblDefinition} */";
    pixelShaderPrerequisites += "layout(location = 0) out vec4 rt0;";
    return pixelShaderPrerequisites;
  }
  /**
   * Generates variable assignment statement with proper type declaration.
   * Creates appropriate syntax for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param engine - The engine instance
   * @param varName - The name of the variable to declare
   * @param inputSocket - The socket containing type and default value information
   * @returns The variable assignment statement string
   */
  getAssignmentStatement(engine, varName, inputSocket) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket.compositionType.toWGSLType(inputSocket.componentType);
      const wgslInitialValue = inputSocket.compositionType.getWgslInitialValue(inputSocket.componentType);
      let rowStr2;
      if (wgslInitialValue === "unknown") {
        rowStr2 = `var ${varName}: ${wgslTypeStr};
`;
      } else {
        rowStr2 = `var ${varName}: ${wgslTypeStr} = ${wgslInitialValue};
`;
      }
      return rowStr2;
    }
    let glslTypeStr = inputSocket.compositionType.getGlslStr(inputSocket.componentType);
    if (glslTypeStr.startsWith("struct ")) {
      glslTypeStr = glslTypeStr.replace("struct ", "");
    }
    const glslInitialValue = inputSocket.compositionType.getGlslInitialValue(inputSocket.componentType);
    let rowStr;
    if (glslInitialValue === "unknown") {
      rowStr = `${glslTypeStr} ${varName};
`;
    } else {
      rowStr = `${glslTypeStr} ${varName} = ${glslInitialValue};
`;
    }
    return rowStr;
  }
  /**
   * Generates varying variable assignment statement for fragment/pixel shaders.
   * Creates code to read varying variables passed from vertex shader with proper type declaration.
   *
   * @param engine - The engine instance
   * @param varName - The name of the variable to declare
   * @param inputSocket - The socket containing type information
   * @param inputNode - The shader node that provides the varying variable
   * @returns The varying variable assignment statement string for fragment shader
   */
  getAssignmentVaryingStatementInPixelShader(engine, varName, inputSocket, inputNode, outputNameOfPrev) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket.compositionType.toWGSLType(inputSocket.componentType);
      const rowStr2 = `var ${varName}: ${wgslTypeStr} = input.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${outputNameOfPrev};
`;
      return rowStr2;
    }
    const glslTypeStr = inputSocket.compositionType.getGlslStr(inputSocket.componentType);
    const rowStr = `${glslTypeStr} ${varName} = v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${outputNameOfPrev};
`;
    return rowStr;
  }
  /**
   * Generates varying variable assignment statement for vertex shaders.
   * Creates code to write varying variables that will be passed to fragment shader.
   *
   * @param engine - The engine instance
   * @param inputNode - The shader node that provides the varying variable
   * @param varNames - Array of variable names to assign
   * @param j - Index of the current variable in the varNames array
   * @returns The varying variable assignment statement string for vertex shader
   */
  getAssignmentVaryingStatementInVertexShader(engine, inputNode, varNames, j) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `output.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid} = ${varNames[j]};
`;
    }
    return `v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid} = ${varNames[j]};
`;
  }
  /**
   * Gets the attribute names used by this shader part.
   * Subclasses should override this to define which vertex attributes are used.
   *
   * @returns Object containing attribute name mappings
   */
  get attributeNames() {
    return [];
  }
  /**
   * Gets the vertex attribute semantics used by this shader part.
   * Subclasses should override this to define the semantic meaning of each attribute.
   *
   * @returns Array of vertex attribute enums defining the semantics
   */
  get attributeSemantics() {
    return [];
  }
  /**
   * Gets the composition types for each vertex attribute used by this shader part.
   * Subclasses should override this to define the data composition (scalar, vec2, vec3, etc.).
   *
   * @returns Array of composition type enums defining the data structure
   */
  get attributeCompositions() {
    return [];
  }
  /**
   * Gets the vertex shader definitions code.
   * Subclasses should override this to provide shader-specific definitions.
   *
   * @returns Vertex shader definitions code string
   */
  getVertexShaderDefinitions(_engine) {
    return "";
  }
  /**
   * Gets the pixel/fragment shader definitions code.
   * Subclasses should override this to provide shader-specific definitions.
   *
   * @returns Fragment shader definitions code string
   */
  getPixelShaderDefinitions(_engine) {
    return "";
  }
};
export {
  StandardShaderPart
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3NoYWRlcnMvU3RhbmRhcmRTaGFkZXJQYXJ0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDb21wb25lbnRUeXBlLCB0eXBlIENvbXBvbmVudFR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB0eXBlIHsgQ29tcG9zaXRpb25UeXBlRW51bSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB0eXBlIHsgVmVydGV4QXR0cmlidXRlRW51bSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IEFic3RyYWN0U2hhZGVyTm9kZSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvQWJzdHJhY3RTaGFkZXJOb2RlJztcbmltcG9ydCB0eXBlIHsgU29ja2V0LCBTb2NrZXREZWZhdWx0VmFsdWUgfSBmcm9tICcuLi8uLi9mb3VuZGF0aW9uL21hdGVyaWFscy9jb3JlL1NvY2tldCc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdmVydGV4SW5wdXRXR1NMXyBmcm9tICcuLi8uLi93ZWJncHUvc2hhZGVyaXR5X3NoYWRlcnMvY29tbW9uL3ZlcnRleElucHV0Lndnc2wnO1xuaW1wb3J0IG1vcnBoVmFyaWFibGVzR0xTTCBmcm9tICcuLi9zaGFkZXJpdHlfc2hhZGVycy9jb21tb24vbW9ycGhWYXJpYWJsZXMuZ2xzbCc7XG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZU5hbWVzIH0gZnJvbSAnLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ29tbW9uU2hhZGVyUGFydCB9IGZyb20gJy4vQ29tbW9uU2hhZGVyUGFydCc7XG5cbi8vIFNoYWRlcnMgb2YgYSBiYWNrZW5kIGV4Y2x1ZGVkIGF0IGJ1aWxkIHRpbWUgKHNlZSBzcmMvYmFja2VuZEZsYWdzLmQudHMpIGFyZSBkcm9wcGVkIGJ5IHRoZSBidW5kbGVyLlxuY29uc3QgdmVydGV4SW5wdXRXR1NMID0gdHlwZW9mIF9fUk5fV0VCR1BVX18gPT09ICd1bmRlZmluZWQnIHx8IF9fUk5fV0VCR1BVX18gPyB2ZXJ0ZXhJbnB1dFdHU0xfIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIEJhc2UgY2xhc3MgdGhhdCBwcm92aWRlcyBjb21tb24gc2hhZGVyIGZ1bmN0aW9uYWxpdHkgZm9yIGJvdGggV2ViR0wgYW5kIFdlYkdQVSByZW5kZXJpbmcgYXBwcm9hY2hlcy5cbiAqIFRoaXMgY2xhc3MgaGFuZGxlcyBzaGFkZXIgY29kZSBnZW5lcmF0aW9uLCB2ZXJ0ZXgvZnJhZ21lbnQgc2hhZGVyIHByZXJlcXVpc2l0ZXMsIGFuZCBjcm9zcy1wbGF0Zm9ybSBjb21wYXRpYmlsaXR5XG4gKiBiZXR3ZWVuIFdlYkdMIGFuZCBXZWJHUFUgc2hhZGVyIGxhbmd1YWdlcyAoR0xTTCBhbmQgV0dTTCkuXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGFuZGFyZFNoYWRlclBhcnQgZXh0ZW5kcyBDb21tb25TaGFkZXJQYXJ0IHtcbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB0aGUgbWFpbiBmdW5jdGlvbiBiZWdpbm5pbmcgY29kZSBmb3IgdmVydGV4IG9yIGZyYWdtZW50IHNoYWRlcnMuXG4gICAqIEhhbmRsZXMgZGlmZmVyZW5jZXMgYmV0d2VlbiBXZWJHTCAoR0xTTCkgYW5kIFdlYkdQVSAoV0dTTCkgc2hhZGVyIGxhbmd1YWdlcy5cbiAgICpcbiAgICogQHBhcmFtIGlzVmVydGV4U3RhZ2UgLSBUcnVlIGlmIGdlbmVyYXRpbmcgY29kZSBmb3IgdmVydGV4IHNoYWRlciwgZmFsc2UgZm9yIGZyYWdtZW50IHNoYWRlclxuICAgKiBAcmV0dXJucyBUaGUgc2hhZGVyIGNvZGUgc3RyaW5nIGZvciB0aGUgbWFpbiBmdW5jdGlvbiBiZWdpbm5pbmdcbiAgICovXG4gIGdldE1haW5CZWdpbihlbmdpbmU6IEVuZ2luZSwgaXNWZXJ0ZXhTdGFnZTogYm9vbGVhbikge1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgaWYgKGlzVmVydGV4U3RhZ2UpIHtcbiAgICAgICAgbGV0IHN0ciA9IGBcbnZhcjxwcml2YXRlPiBvdXRwdXQgOiBWZXJ0ZXhPdXRwdXQ7XG5AdmVydGV4XG5mbiBtYWluKFxuJHt2ZXJ0ZXhJbnB1dFdHU0wuY29kZX1cbikgLT4gVmVydGV4T3V0cHV0IHtcbiAgb3V0cHV0Lmluc3RhbmNlSWRzID0gaW5zdGFuY2VJZHM7XG4gIC8qIHNoYWRlcml0eTogQHttYWluUHJlcmVxdWlzaXRlc30gKi9cbmA7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgICB9XG4gICAgICBsZXQgc3RyID0gYFxudmFyPHByaXZhdGU+IHJ0MDogdmVjNDxmMzI+ID0gdmVjNDxmMzI+KDAuMCwgMC4wLCAwLjAsIDEuMCk7XG5AZnJhZ21lbnRcbmZuIG1haW4oXG4gIGlucHV0OiBWZXJ0ZXhPdXRwdXQsXG4pIC0+IEBsb2NhdGlvbigwKSB2ZWM0PGYzMj4ge1xuICAvKiBzaGFkZXJpdHk6IEB7bWFpblByZXJlcXVpc2l0ZXN9ICovXG5gO1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG5cbiAgICBpZiAoaXNWZXJ0ZXhTdGFnZSkge1xuICAgICAgcmV0dXJuIGBcbnZvaWQgbWFpbigpIHtcbiAgdl9pbnN0YW5jZUlkcyA9IGFfaW5zdGFuY2VJZHM7XG4gIC8qIHNoYWRlcml0eTogQHttYWluUHJlcmVxdWlzaXRlc30gKi9cbmA7XG4gICAgfVxuICAgIHJldHVybiBgXG52b2lkIG1haW4oKSB7XG4gIC8qIHNoYWRlcml0eTogQHttYWluUHJlcmVxdWlzaXRlc30gKi9cbiAgYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdGhlIG1haW4gZnVuY3Rpb24gZW5kaW5nIGNvZGUgZm9yIHZlcnRleCBvciBmcmFnbWVudCBzaGFkZXJzLlxuICAgKiBIYW5kbGVzIGRpZmZlcmVuY2VzIGJldHdlZW4gV2ViR0wgKEdMU0wpIGFuZCBXZWJHUFUgKFdHU0wpIHNoYWRlciBsYW5ndWFnZXMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBpc1ZlcnRleFN0YWdlIC0gVHJ1ZSBpZiBnZW5lcmF0aW5nIGNvZGUgZm9yIHZlcnRleCBzaGFkZXIsIGZhbHNlIGZvciBmcmFnbWVudCBzaGFkZXJcbiAgICogQHJldHVybnMgVGhlIHNoYWRlciBjb2RlIHN0cmluZyBmb3IgdGhlIG1haW4gZnVuY3Rpb24gZW5kaW5nXG4gICAqL1xuICBnZXRNYWluRW5kKGVuZ2luZTogRW5naW5lLCBpc1ZlcnRleFN0YWdlOiBib29sZWFuKSB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBpZiAoaXNWZXJ0ZXhTdGFnZSkge1xuICAgICAgICByZXR1cm4gYFxuICByZXR1cm4gb3V0cHV0O1xufVxuYDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBgXG4gIHJldHVybiBydDA7XG59XG5gO1xuICAgIH1cbiAgICByZXR1cm4gYFxufVxuYDtcbiAgfVxuXG4gIGdldE1hdGVyaWFsU0lERm9yV2ViR0woKSB7XG4gICAgcmV0dXJuIGBcbiAgdWludCBtYXRlcmlhbFNJRCA9IHVpbnQodV9jdXJyZW50Q29tcG9uZW50U0lEc1swXSk7IC8vIGluZGV4IDAgZGF0YSBpcyB0aGUgbWF0ZXJpYWxTSURcbmA7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHZlcnRleCBzaGFkZXIgcHJlcmVxdWlzaXRlcyBpbmNsdWRpbmcgZGVmaW5pdGlvbnMsIHZlcnRleCBpbnB1dHMsIGFuZCB1bmlmb3JtIGRlY2xhcmF0aW9ucy5cbiAgICogQ3JlYXRlcyBhcHByb3ByaWF0ZSBjb2RlIGZvciBib3RoIFdlYkdMIChHTFNMKSBhbmQgV2ViR1BVIChXR1NMKSBiYXNlZCBvbiB0aGUgY3VycmVudCBwcm9jZXNzIGFwcHJvYWNoLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gc2hhZGVyTm9kZXMgLSBBcnJheSBvZiBzaGFkZXIgbm9kZXMgdXNlZCB0byBnZW5lcmF0ZSB2YXJ5aW5nIHZhcmlhYmxlcyBmb3IgV2ViR1BVXG4gICAqIEByZXR1cm5zIFRoZSBjb21wbGV0ZSB2ZXJ0ZXggc2hhZGVyIHByZXJlcXVpc2l0ZXMgY29kZSBzdHJpbmdcbiAgICovXG4gIGdldFZlcnRleFByZXJlcXVpc2l0ZXMoZW5naW5lOiBFbmdpbmUsIHNoYWRlck5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSkge1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgY29uc3QgdmFyeWluZ1ZhcmlhYmxlcyA9IHRoaXMuX19tYWtlVmFyeWluZ1ZhcmlhYmxlc1dHU0woc2hhZGVyTm9kZXMpO1xuICAgICAgbGV0IHZlcnRleFNoYWRlclByZXJlcXVpc2l0ZXMgPSAnJztcbiAgICAgIHZlcnRleFNoYWRlclByZXJlcXVpc2l0ZXMgKz0gYFxuLyogc2hhZGVyaXR5OiBAe2RlZmluaXRpb25zfSAqL1xuI2RlZmluZSBSTl9JU19OT0RFX1NIQURFUlxuXG5zdHJ1Y3QgVmVydGV4T3V0cHV0IHtcbiAgQGJ1aWx0aW4ocG9zaXRpb24pIHBvc2l0aW9uIDogdmVjNDxmMzI+LFxuICAke3ZhcnlpbmdWYXJpYWJsZXN9XG59XG5cbi8qIHNoYWRlcml0eTogQHtwcmVyZXF1aXNpdGVzfSAqL1xuLyogc2hhZGVyaXR5OiBAe2dldHRlcnN9ICovXG4vKiBzaGFkZXJpdHk6IEB7bWF0cmljZXNHZXR0ZXJzfSAqL1xuXG4vKiBzaGFkZXJpdHk6IEB7b3B0aWNhbERlZmluaXRpb259ICovXG4vKiBzaGFkZXJpdHk6IEB7c2hhZG93RGVmaW5pdGlvbn0gKi9cbi8qIHNoYWRlcml0eTogQHtwYnJEZWZpbml0aW9ufSAqL1xuLyogc2hhZGVyaXR5OiBAe2libERlZmluaXRpb259ICovXG5cbmA7XG4gICAgICByZXR1cm4gdmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcztcbiAgICB9XG4gICAgLy8gV2ViR0xcbiAgICBsZXQgdmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcyA9ICcnO1xuICAgIHZlcnRleFNoYWRlclByZXJlcXVpc2l0ZXMgKz0gYFxuI3ZlcnNpb24gMzAwIGVzXG5wcmVjaXNpb24gaGlnaHAgZmxvYXQ7XG5wcmVjaXNpb24gaGlnaHAgaW50O1xuLyogc2hhZGVyaXR5OiBAe2RlZmluaXRpb25zfSAqL1xuI2RlZmluZSBSTl9JU19OT0RFX1NIQURFUlxuI2lmIGRlZmluZWQoUk5fSVNfV0VCR0wyX01PREUpICYmIGRlZmluZWQoUk5fVVNFX0lOU1RBTkNFX1NJRF9URVhUVVJFKVxuI2RlZmluZSBhX2luc3RhbmNlSWRzIGdldF9pbnN0YW5jZUlkcygpXG4jZWxzZVxuaW4gdXZlYzQgYV9pbnN0YW5jZUlkcztcbiNlbmRpZlxuI2lmIGRlZmluZWQoUk5fSVNfV0VCR0wyX01PREUpICYmIGRlZmluZWQoUk5fVVNFX01BVEVSSUFMX1NJRF9BVFRSSUJVVEUpXG5pbiB1aW50IGFfbWF0ZXJpYWxTaWQ7XG5mbGF0IG91dCB1aW50IHZfbWF0ZXJpYWxTaWQ7XG4jZW5kaWZcbi8qIHNoYWRlcml0eTogQHtwcmVyZXF1aXNpdGVzfSAqL1xuXG4ke21vcnBoVmFyaWFibGVzR0xTTC5jb2RlfVxuXG5pbiB2ZWM0IGFfcG9zaXRpb247XG4jaWZkZWYgUk5fVVNFX0NPTE9SXzBcbiAgaW4gdmVjNCBhX2NvbG9yO1xuI2Vsc2VcbiAgY29uc3QgdmVjNCBhX2NvbG9yID0gdmVjNCgxLjAsIDEuMCwgMS4wLCAxLjApO1xuI2VuZGlmXG5pbiB2ZWMzIGFfbm9ybWFsO1xuaW4gdmVjMiBhX3RleGNvb3JkXzA7XG5pbiB2ZWMyIGFfdGV4Y29vcmRfMTtcbmluIHZlYzIgYV90ZXhjb29yZF8yO1xuaW4gdXZlYzQgYV9qb2ludDtcbmluIHZlYzQgYV93ZWlnaHQ7XG5pbiB2ZWM0IGFfYmFyeUNlbnRyaWNDb29yZDtcbmluIHZlYzQgYV90YW5nZW50O1xuZmxhdCBvdXQgdXZlYzQgdl9pbnN0YW5jZUlkcztcbmA7XG4gICAgdmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcyArPSAnLyogc2hhZGVyaXR5OiBAe2dldHRlcnN9ICovJztcbiAgICB2ZXJ0ZXhTaGFkZXJQcmVyZXF1aXNpdGVzICs9ICcvKiBzaGFkZXJpdHk6IEB7bWF0cmljZXNHZXR0ZXJzfSAqLyc7XG4gICAgdmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcyArPSAnLyogc2hhZGVyaXR5OiBAe29wdGljYWxEZWZpbml0aW9ufSAqLyc7XG4gICAgdmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcyArPSAnLyogc2hhZGVyaXR5OiBAe3NoYWRvd0RlZmluaXRpb259ICovJztcbiAgICB2ZXJ0ZXhTaGFkZXJQcmVyZXF1aXNpdGVzICs9ICcvKiBzaGFkZXJpdHk6IEB7cGJyRGVmaW5pdGlvbn0gKi8nO1xuICAgIHZlcnRleFNoYWRlclByZXJlcXVpc2l0ZXMgKz0gJy8qIHNoYWRlcml0eTogQHtpYmxEZWZpbml0aW9ufSAqLyc7XG4gICAgcmV0dXJuIHZlcnRleFNoYWRlclByZXJlcXVpc2l0ZXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB2YXJ5aW5nIHZhcmlhYmxlcyBkZWNsYXJhdGlvbiBzdHJpbmcgZm9yIFdlYkdQVSBzaGFkZXJzLlxuICAgKiBBbmFseXplcyBzaGFkZXIgbm9kZSBjb25uZWN0aW9ucyB0byBkZXRlcm1pbmUgd2hpY2ggdmFyaWFibGVzIG5lZWQgdG8gYmUgcGFzc2VkIGZyb20gdmVydGV4IHRvIGZyYWdtZW50IHN0YWdlLlxuICAgKlxuICAgKiBAcGFyYW0gc2hhZGVyTm9kZXMgLSBBcnJheSBvZiBzaGFkZXIgbm9kZXMgdG8gYW5hbHl6ZSBmb3IgdmFyeWluZyB2YXJpYWJsZXNcbiAgICogQHJldHVybnMgV0dTTCB2YXJ5aW5nIHZhcmlhYmxlcyBkZWNsYXJhdGlvbiBzdHJpbmdcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19tYWtlVmFyeWluZ1ZhcmlhYmxlc1dHU0woc2hhZGVyTm9kZXM6IEFic3RyYWN0U2hhZGVyTm9kZVtdKSB7XG4gICAgY29uc3QgdmFyeWluZ3M6IHtcbiAgICAgIHR5cGU6IHN0cmluZztcbiAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgIG5lZWRzRmxhdDogYm9vbGVhbjtcbiAgICB9W10gPSBbXTtcbiAgICBjb25zdCBkZWZpbmVkVmFyeWluZ3M6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2hhZGVyTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNoYWRlck5vZGUgPSBzaGFkZXJOb2Rlc1tpXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2hhZGVyTm9kZS5pbnB1dENvbm5lY3Rpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGlucHV0Q29ubmVjdGlvbiA9IHNoYWRlck5vZGUuaW5wdXRDb25uZWN0aW9uc1tqXTtcbiAgICAgICAgaWYgKGlucHV0Q29ubmVjdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5wdXQgPSBzaGFkZXJOb2RlLmdldElucHV0cygpW2pdO1xuICAgICAgICBjb25zdCBpbnB1dE5vZGUgPSBBYnN0cmFjdFNoYWRlck5vZGUuZ2V0U2hhZGVyTm9kZUJ5VWlkKGlucHV0Q29ubmVjdGlvbi5zaGFkZXJOb2RlVWlkKTtcbiAgICAgICAgaWYgKGlucHV0Tm9kZS5nZXRTaGFkZXJTdGFnZSgpID09PSAnVmVydGV4JyAmJiBzaGFkZXJOb2RlLmdldFNoYWRlclN0YWdlKCkgPT09ICdGcmFnbWVudCcpIHtcbiAgICAgICAgICBjb25zdCB0eXBlID0gaW5wdXQuY29tcG9zaXRpb25UeXBlLnRvV0dTTFR5cGUoaW5wdXQuY29tcG9uZW50VHlwZSk7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGAke2lucHV0Tm9kZS5zaGFkZXJGdW5jdGlvbk5hbWV9XyR7aW5wdXROb2RlLnNoYWRlck5vZGVVaWR9XyR7aW5wdXRDb25uZWN0aW9uLm91dHB1dE5hbWVPZlByZXZ9YDtcbiAgICAgICAgICBpZiAoZGVmaW5lZFZhcnlpbmdzLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlZmluZWRWYXJ5aW5ncy5hZGQobmFtZSk7XG4gICAgICAgICAgLy8gSW50ZWdlciBhbmQgYm9vbGVhbiB0eXBlcyByZXF1aXJlIGZsYXQgaW50ZXJwb2xhdGlvbiBpbiBXR1NMXG4gICAgICAgICAgY29uc3QgbmVlZHNGbGF0ID1cbiAgICAgICAgICAgIGlucHV0LmNvbXBvbmVudFR5cGUuaXNJbnRlZ2VyKCkgfHxcbiAgICAgICAgICAgIGlucHV0LmNvbXBvbmVudFR5cGUuaXNVbnNpZ25lZEludGVnZXIoKSB8fFxuICAgICAgICAgICAgaW5wdXQuY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5Cb29sO1xuICAgICAgICAgIHZhcnlpbmdzLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBuZWVkc0ZsYXQ6IG5lZWRzRmxhdCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhcnlpbmdzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGlmIChhLm5hbWUgPCBiLm5hbWUpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDE7XG4gICAgfSk7XG5cbiAgICBsZXQgdmFyeWluZ1ZhcmlhYmxlcyA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFyeWluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGZsYXRBdHRyID0gdmFyeWluZ3NbaV0ubmVlZHNGbGF0ID8gJyBAaW50ZXJwb2xhdGUoZmxhdCknIDogJyc7XG4gICAgICB2YXJ5aW5nVmFyaWFibGVzICs9IGBAbG9jYXRpb24oJHtpfSkke2ZsYXRBdHRyfSAke3ZhcnlpbmdzW2ldLm5hbWV9OiAke3ZhcnlpbmdzW2ldLnR5cGV9LFxcbmA7XG4gICAgfVxuICAgIHZhcnlpbmdWYXJpYWJsZXMgKz0gYEBsb2NhdGlvbigke3ZhcnlpbmdzLmxlbmd0aH0pIEBpbnRlcnBvbGF0ZShmbGF0KSBpbnN0YW5jZUlkczogdmVjNDx1MzI+LGA7XG5cbiAgICByZXR1cm4gdmFyeWluZ1ZhcmlhYmxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgZnJhZ21lbnQvcGl4ZWwgc2hhZGVyIHByZXJlcXVpc2l0ZXMgaW5jbHVkaW5nIGRlZmluaXRpb25zIGFuZCB2YXJ5aW5nIHZhcmlhYmxlIGRlY2xhcmF0aW9ucy5cbiAgICogQ3JlYXRlcyBhcHByb3ByaWF0ZSBjb2RlIGZvciBib3RoIFdlYkdMIChHTFNMKSBhbmQgV2ViR1BVIChXR1NMKSBiYXNlZCBvbiB0aGUgY3VycmVudCBwcm9jZXNzIGFwcHJvYWNoLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gc2hhZGVyTm9kZXMgLSBBcnJheSBvZiBzaGFkZXIgbm9kZXMgdXNlZCB0byBnZW5lcmF0ZSB2YXJ5aW5nIHZhcmlhYmxlcyBmb3IgV2ViR1BVXG4gICAqIEByZXR1cm5zIFRoZSBjb21wbGV0ZSBmcmFnbWVudCBzaGFkZXIgcHJlcmVxdWlzaXRlcyBjb2RlIHN0cmluZ1xuICAgKi9cbiAgZ2V0UGl4ZWxQcmVyZXF1aXNpdGVzKGVuZ2luZTogRW5naW5lLCBzaGFkZXJOb2RlczogQWJzdHJhY3RTaGFkZXJOb2RlW10pIHtcbiAgICBpZiAoZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIGNvbnN0IHZhcnlpbmdWYXJpYWJsZXMgPSB0aGlzLl9fbWFrZVZhcnlpbmdWYXJpYWJsZXNXR1NMKHNoYWRlck5vZGVzKTtcblxuICAgICAgbGV0IHBpeGVsU2hhZGVyUHJlcmVxdWlzaXRlcyA9ICcnO1xuICAgICAgcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzICs9IGBcbi8qIHNoYWRlcml0eTogQHtkZWZpbml0aW9uc30gKi9cbiNkZWZpbmUgUk5fSVNfTk9ERV9TSEFERVJcblxuc3RydWN0IFZlcnRleE91dHB1dCB7XG4gIEBidWlsdGluKHBvc2l0aW9uKSBwb3NpdGlvbiA6IHZlYzQ8ZjMyPixcbiAgJHt2YXJ5aW5nVmFyaWFibGVzfVxuICBAYnVpbHRpbihmcm9udF9mYWNpbmcpIGlzRnJvbnQ6IGJvb2wsXG59XG5cbi8qIHNoYWRlcml0eTogQHtwcmVyZXF1aXNpdGVzfSAqL1xuLyogc2hhZGVyaXR5OiBAe2dldHRlcnN9ICovXG4vKiBzaGFkZXJpdHk6IEB7bWF0cmljZXNHZXR0ZXJzfSAqL1xuXG4vKiBzaGFkZXJpdHk6IEB7b3B0aWNhbERlZmluaXRpb259ICovXG4vKiBzaGFkZXJpdHk6IEB7c2hhZG93RGVmaW5pdGlvbn0gKi9cbi8qIHNoYWRlcml0eTogQHtwYnJEZWZpbml0aW9ufSAqL1xuLyogc2hhZGVyaXR5OiBAe2libERlZmluaXRpb259ICovXG5gO1xuICAgICAgcmV0dXJuIHBpeGVsU2hhZGVyUHJlcmVxdWlzaXRlcztcbiAgICB9XG4gICAgbGV0IHBpeGVsU2hhZGVyUHJlcmVxdWlzaXRlcyA9ICcnO1xuICAgIHBpeGVsU2hhZGVyUHJlcmVxdWlzaXRlcyArPSBgXG4gICAgICAjdmVyc2lvbiAzMDAgZXNcbiAgICAgIHByZWNpc2lvbiBoaWdocCBmbG9hdDtcbiAgICAgIHByZWNpc2lvbiBoaWdocCBpbnQ7XG4vKiBzaGFkZXJpdHk6IEB7ZGVmaW5pdGlvbnN9ICovXG4gICAgICAjZGVmaW5lIFJOX0lTX05PREVfU0hBREVSXG4gIC8qIHNoYWRlcml0eTogQHtwcmVyZXF1aXNpdGVzfSAqL1xuICAgICAgZmxhdCBpbiB1dmVjNCB2X2luc3RhbmNlSWRzO1xuYDtcbiAgICBwaXhlbFNoYWRlclByZXJlcXVpc2l0ZXMgKz0gJy8qIHNoYWRlcml0eTogQHtnZXR0ZXJzfSAqLyc7XG4gICAgcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzICs9ICcvKiBzaGFkZXJpdHk6IEB7bWF0cmljZXNHZXR0ZXJzfSAqLyc7XG4gICAgcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzICs9ICcvKiBzaGFkZXJpdHk6IEB7b3B0aWNhbERlZmluaXRpb259ICovJztcbiAgICBwaXhlbFNoYWRlclByZXJlcXVpc2l0ZXMgKz0gJy8qIHNoYWRlcml0eTogQHtzaGFkb3dEZWZpbml0aW9ufSAqLyc7XG4gICAgcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzICs9ICcvKiBzaGFkZXJpdHk6IEB7cGJyRGVmaW5pdGlvbn0gKi8nO1xuICAgIHBpeGVsU2hhZGVyUHJlcmVxdWlzaXRlcyArPSAnLyogc2hhZGVyaXR5OiBAe2libERlZmluaXRpb259ICovJztcbiAgICBwaXhlbFNoYWRlclByZXJlcXVpc2l0ZXMgKz0gJ2xheW91dChsb2NhdGlvbiA9IDApIG91dCB2ZWM0IHJ0MDsnO1xuICAgIHJldHVybiBwaXhlbFNoYWRlclByZXJlcXVpc2l0ZXM7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHZhcmlhYmxlIGFzc2lnbm1lbnQgc3RhdGVtZW50IHdpdGggcHJvcGVyIHR5cGUgZGVjbGFyYXRpb24uXG4gICAqIENyZWF0ZXMgYXBwcm9wcmlhdGUgc3ludGF4IGZvciBib3RoIFdlYkdMIChHTFNMKSBhbmQgV2ViR1BVIChXR1NMKSBiYXNlZCBvbiB0aGUgY3VycmVudCBwcm9jZXNzIGFwcHJvYWNoLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gdmFyTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZSB0byBkZWNsYXJlXG4gICAqIEBwYXJhbSBpbnB1dFNvY2tldCAtIFRoZSBzb2NrZXQgY29udGFpbmluZyB0eXBlIGFuZCBkZWZhdWx0IHZhbHVlIGluZm9ybWF0aW9uXG4gICAqIEByZXR1cm5zIFRoZSB2YXJpYWJsZSBhc3NpZ25tZW50IHN0YXRlbWVudCBzdHJpbmdcbiAgICovXG4gIGdldEFzc2lnbm1lbnRTdGF0ZW1lbnQoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgdmFyTmFtZTogc3RyaW5nLFxuICAgIGlucHV0U29ja2V0OiBTb2NrZXQ8c3RyaW5nLCBDb21wb3NpdGlvblR5cGVFbnVtLCBDb21wb25lbnRUeXBlRW51bSwgU29ja2V0RGVmYXVsdFZhbHVlPlxuICApIHtcbiAgICBpZiAoZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIGNvbnN0IHdnc2xUeXBlU3RyID0gaW5wdXRTb2NrZXQhLmNvbXBvc2l0aW9uVHlwZS50b1dHU0xUeXBlKGlucHV0U29ja2V0IS5jb21wb25lbnRUeXBlKTtcbiAgICAgIGNvbnN0IHdnc2xJbml0aWFsVmFsdWUgPSBpbnB1dFNvY2tldCEuY29tcG9zaXRpb25UeXBlLmdldFdnc2xJbml0aWFsVmFsdWUoaW5wdXRTb2NrZXQhLmNvbXBvbmVudFR5cGUpO1xuICAgICAgLy8gRm9yIHN0cnVjdCB0eXBlcyAod2hlcmUgZ2V0V2dzbEluaXRpYWxWYWx1ZSByZXR1cm5zICd1bmtub3duJyksIGRlY2xhcmUgd2l0aG91dCBpbml0aWFsaXphdGlvblxuICAgICAgbGV0IHJvd1N0cjogc3RyaW5nO1xuICAgICAgaWYgKHdnc2xJbml0aWFsVmFsdWUgPT09ICd1bmtub3duJykge1xuICAgICAgICByb3dTdHIgPSBgdmFyICR7dmFyTmFtZX06ICR7d2dzbFR5cGVTdHJ9O1xcbmA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb3dTdHIgPSBgdmFyICR7dmFyTmFtZX06ICR7d2dzbFR5cGVTdHJ9ID0gJHt3Z3NsSW5pdGlhbFZhbHVlfTtcXG5gO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJvd1N0cjtcbiAgICB9XG4gICAgbGV0IGdsc2xUeXBlU3RyID0gaW5wdXRTb2NrZXQhLmNvbXBvc2l0aW9uVHlwZS5nZXRHbHNsU3RyKGlucHV0U29ja2V0IS5jb21wb25lbnRUeXBlKTtcbiAgICAvLyBGb3Igc3RydWN0IHR5cGVzLCByZW1vdmUgdGhlICdzdHJ1Y3QgJyBwcmVmaXggZm9yIEdMU0wgdmFyaWFibGUgZGVjbGFyYXRpb25zXG4gICAgaWYgKGdsc2xUeXBlU3RyLnN0YXJ0c1dpdGgoJ3N0cnVjdCAnKSkge1xuICAgICAgZ2xzbFR5cGVTdHIgPSBnbHNsVHlwZVN0ci5yZXBsYWNlKCdzdHJ1Y3QgJywgJycpO1xuICAgIH1cbiAgICBjb25zdCBnbHNsSW5pdGlhbFZhbHVlID0gaW5wdXRTb2NrZXQhLmNvbXBvc2l0aW9uVHlwZS5nZXRHbHNsSW5pdGlhbFZhbHVlKGlucHV0U29ja2V0IS5jb21wb25lbnRUeXBlKTtcbiAgICAvLyBGb3Igc3RydWN0IHR5cGVzICh3aGVyZSBnZXRHbHNsSW5pdGlhbFZhbHVlIHJldHVybnMgJ3Vua25vd24nKSwgZGVjbGFyZSB3aXRob3V0IGluaXRpYWxpemF0aW9uXG4gICAgbGV0IHJvd1N0cjogc3RyaW5nO1xuICAgIGlmIChnbHNsSW5pdGlhbFZhbHVlID09PSAndW5rbm93bicpIHtcbiAgICAgIHJvd1N0ciA9IGAke2dsc2xUeXBlU3RyfSAke3Zhck5hbWV9O1xcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvd1N0ciA9IGAke2dsc2xUeXBlU3RyfSAke3Zhck5hbWV9ID0gJHtnbHNsSW5pdGlhbFZhbHVlfTtcXG5gO1xuICAgIH1cbiAgICByZXR1cm4gcm93U3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB2YXJ5aW5nIHZhcmlhYmxlIGFzc2lnbm1lbnQgc3RhdGVtZW50IGZvciBmcmFnbWVudC9waXhlbCBzaGFkZXJzLlxuICAgKiBDcmVhdGVzIGNvZGUgdG8gcmVhZCB2YXJ5aW5nIHZhcmlhYmxlcyBwYXNzZWQgZnJvbSB2ZXJ0ZXggc2hhZGVyIHdpdGggcHJvcGVyIHR5cGUgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSB2YXJOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHZhcmlhYmxlIHRvIGRlY2xhcmVcbiAgICogQHBhcmFtIGlucHV0U29ja2V0IC0gVGhlIHNvY2tldCBjb250YWluaW5nIHR5cGUgaW5mb3JtYXRpb25cbiAgICogQHBhcmFtIGlucHV0Tm9kZSAtIFRoZSBzaGFkZXIgbm9kZSB0aGF0IHByb3ZpZGVzIHRoZSB2YXJ5aW5nIHZhcmlhYmxlXG4gICAqIEByZXR1cm5zIFRoZSB2YXJ5aW5nIHZhcmlhYmxlIGFzc2lnbm1lbnQgc3RhdGVtZW50IHN0cmluZyBmb3IgZnJhZ21lbnQgc2hhZGVyXG4gICAqL1xuICBnZXRBc3NpZ25tZW50VmFyeWluZ1N0YXRlbWVudEluUGl4ZWxTaGFkZXIoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgdmFyTmFtZTogc3RyaW5nLFxuICAgIGlucHV0U29ja2V0OiBTb2NrZXQ8c3RyaW5nLCBDb21wb3NpdGlvblR5cGVFbnVtLCBDb21wb25lbnRUeXBlRW51bSwgU29ja2V0RGVmYXVsdFZhbHVlPixcbiAgICBpbnB1dE5vZGU6IEFic3RyYWN0U2hhZGVyTm9kZSxcbiAgICBvdXRwdXROYW1lT2ZQcmV2OiBzdHJpbmdcbiAgKSB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBjb25zdCB3Z3NsVHlwZVN0ciA9IGlucHV0U29ja2V0IS5jb21wb3NpdGlvblR5cGUudG9XR1NMVHlwZShpbnB1dFNvY2tldCEuY29tcG9uZW50VHlwZSk7XG4gICAgICBjb25zdCByb3dTdHIgPSBgdmFyICR7dmFyTmFtZX06ICR7d2dzbFR5cGVTdHJ9ID0gaW5wdXQuJHtpbnB1dE5vZGUuc2hhZGVyRnVuY3Rpb25OYW1lfV8ke2lucHV0Tm9kZS5zaGFkZXJOb2RlVWlkfV8ke291dHB1dE5hbWVPZlByZXZ9O1xcbmA7XG4gICAgICByZXR1cm4gcm93U3RyO1xuICAgIH1cbiAgICBjb25zdCBnbHNsVHlwZVN0ciA9IGlucHV0U29ja2V0IS5jb21wb3NpdGlvblR5cGUuZ2V0R2xzbFN0cihpbnB1dFNvY2tldCEuY29tcG9uZW50VHlwZSk7XG4gICAgY29uc3Qgcm93U3RyID0gYCR7Z2xzbFR5cGVTdHJ9ICR7dmFyTmFtZX0gPSB2XyR7aW5wdXROb2RlLnNoYWRlckZ1bmN0aW9uTmFtZX1fJHtpbnB1dE5vZGUuc2hhZGVyTm9kZVVpZH1fJHtvdXRwdXROYW1lT2ZQcmV2fTtcXG5gO1xuICAgIHJldHVybiByb3dTdHI7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHZhcnlpbmcgdmFyaWFibGUgYXNzaWdubWVudCBzdGF0ZW1lbnQgZm9yIHZlcnRleCBzaGFkZXJzLlxuICAgKiBDcmVhdGVzIGNvZGUgdG8gd3JpdGUgdmFyeWluZyB2YXJpYWJsZXMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byBmcmFnbWVudCBzaGFkZXIuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBpbnB1dE5vZGUgLSBUaGUgc2hhZGVyIG5vZGUgdGhhdCBwcm92aWRlcyB0aGUgdmFyeWluZyB2YXJpYWJsZVxuICAgKiBAcGFyYW0gdmFyTmFtZXMgLSBBcnJheSBvZiB2YXJpYWJsZSBuYW1lcyB0byBhc3NpZ25cbiAgICogQHBhcmFtIGogLSBJbmRleCBvZiB0aGUgY3VycmVudCB2YXJpYWJsZSBpbiB0aGUgdmFyTmFtZXMgYXJyYXlcbiAgICogQHJldHVybnMgVGhlIHZhcnlpbmcgdmFyaWFibGUgYXNzaWdubWVudCBzdGF0ZW1lbnQgc3RyaW5nIGZvciB2ZXJ0ZXggc2hhZGVyXG4gICAqL1xuICBnZXRBc3NpZ25tZW50VmFyeWluZ1N0YXRlbWVudEluVmVydGV4U2hhZGVyKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGlucHV0Tm9kZTogQWJzdHJhY3RTaGFkZXJOb2RlLFxuICAgIHZhck5hbWVzOiBzdHJpbmdbXSxcbiAgICBqOiBudW1iZXJcbiAgKSB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gYG91dHB1dC4ke2lucHV0Tm9kZS5zaGFkZXJGdW5jdGlvbk5hbWV9XyR7aW5wdXROb2RlLnNoYWRlck5vZGVVaWR9ID0gJHt2YXJOYW1lc1tqXX07XFxuYDtcbiAgICB9XG4gICAgcmV0dXJuIGB2XyR7aW5wdXROb2RlLnNoYWRlckZ1bmN0aW9uTmFtZX1fJHtpbnB1dE5vZGUuc2hhZGVyTm9kZVVpZH0gPSAke3Zhck5hbWVzW2pdfTtcXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGF0dHJpYnV0ZSBuYW1lcyB1c2VkIGJ5IHRoaXMgc2hhZGVyIHBhcnQuXG4gICAqIFN1YmNsYXNzZXMgc2hvdWxkIG92ZXJyaWRlIHRoaXMgdG8gZGVmaW5lIHdoaWNoIHZlcnRleCBhdHRyaWJ1dGVzIGFyZSB1c2VkLlxuICAgKlxuICAgKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyBhdHRyaWJ1dGUgbmFtZSBtYXBwaW5nc1xuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZU5hbWVzKCk6IEF0dHJpYnV0ZU5hbWVzIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVydGV4IGF0dHJpYnV0ZSBzZW1hbnRpY3MgdXNlZCBieSB0aGlzIHNoYWRlciBwYXJ0LlxuICAgKiBTdWJjbGFzc2VzIHNob3VsZCBvdmVycmlkZSB0aGlzIHRvIGRlZmluZSB0aGUgc2VtYW50aWMgbWVhbmluZyBvZiBlYWNoIGF0dHJpYnV0ZS5cbiAgICpcbiAgICogQHJldHVybnMgQXJyYXkgb2YgdmVydGV4IGF0dHJpYnV0ZSBlbnVtcyBkZWZpbmluZyB0aGUgc2VtYW50aWNzXG4gICAqL1xuICBnZXQgYXR0cmlidXRlU2VtYW50aWNzKCk6IEFycmF5PFZlcnRleEF0dHJpYnV0ZUVudW0+IHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9zaXRpb24gdHlwZXMgZm9yIGVhY2ggdmVydGV4IGF0dHJpYnV0ZSB1c2VkIGJ5IHRoaXMgc2hhZGVyIHBhcnQuXG4gICAqIFN1YmNsYXNzZXMgc2hvdWxkIG92ZXJyaWRlIHRoaXMgdG8gZGVmaW5lIHRoZSBkYXRhIGNvbXBvc2l0aW9uIChzY2FsYXIsIHZlYzIsIHZlYzMsIGV0Yy4pLlxuICAgKlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBjb21wb3NpdGlvbiB0eXBlIGVudW1zIGRlZmluaW5nIHRoZSBkYXRhIHN0cnVjdHVyZVxuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZUNvbXBvc2l0aW9ucygpOiBBcnJheTxDb21wb3NpdGlvblR5cGVFbnVtPiB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnRleCBzaGFkZXIgZGVmaW5pdGlvbnMgY29kZS5cbiAgICogU3ViY2xhc3NlcyBzaG91bGQgb3ZlcnJpZGUgdGhpcyB0byBwcm92aWRlIHNoYWRlci1zcGVjaWZpYyBkZWZpbml0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgVmVydGV4IHNoYWRlciBkZWZpbml0aW9ucyBjb2RlIHN0cmluZ1xuICAgKi9cbiAgZ2V0VmVydGV4U2hhZGVyRGVmaW5pdGlvbnMoX2VuZ2luZTogRW5naW5lKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwvZnJhZ21lbnQgc2hhZGVyIGRlZmluaXRpb25zIGNvZGUuXG4gICAqIFN1YmNsYXNzZXMgc2hvdWxkIG92ZXJyaWRlIHRoaXMgdG8gcHJvdmlkZSBzaGFkZXItc3BlY2lmaWMgZGVmaW5pdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIEZyYWdtZW50IHNoYWRlciBkZWZpbml0aW9ucyBjb2RlIHN0cmluZ1xuICAgKi9cbiAgZ2V0UGl4ZWxTaGFkZXJEZWZpbml0aW9ucyhfZW5naW5lOiBFbmdpbmUpOiBzdHJpbmcge1xuICAgIHJldHVybiAnJztcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMscUJBQTZDO0FBRXRELFNBQVMsdUJBQXVCO0FBRWhDLFNBQVMsMEJBQTBCO0FBR25DLE9BQU8sc0JBQXNCO0FBQzdCLE9BQU8sd0JBQXdCO0FBRS9CLFNBQVMsd0JBQXdCO0FBR2pDLElBQU0sa0JBQWtCLE9BQU8sa0JBQWtCLGVBQWUsZ0JBQWdCLG1CQUFtQjtBQU81RixJQUFNLHFCQUFOLGNBQWlDLGlCQUFpQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRdkQsYUFBYSxRQUFnQixlQUF3QjtBQUNuRCxRQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsVUFBSSxlQUFlO0FBQ2pCLFlBQUlBLE9BQU07QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUloQixnQkFBZ0IsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBS2QsZUFBT0E7QUFBQSxNQUNUO0FBQ0EsVUFBSSxNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFRVixh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

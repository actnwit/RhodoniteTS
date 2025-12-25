import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import type { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';
import vertexInputWGSL from '../../webgpu/shaderity_shaders/common/vertexInput.wgsl';
import { CommonShaderPart } from './CommonShaderPart';

/**
 * RaymarchingShaderPart is a class that provides common shader functionality for both WebGL and WebGPU rendering approaches.
 * This class handles shader code generation, vertex/fragment shader prerequisites, and cross-platform compatibility
 * between WebGL and WebGPU shader languages (GLSL and WGSL).
 */
export class RaymarchingShaderPart extends CommonShaderPart {
  /**
   * Generates the main function beginning code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @returns The shader code string for the main function beginning
   */
  getMainBegin(engine: Engine, isVertexStage: boolean) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        let str = `
var<private> output : VertexOutput;
@vertex
fn main(
${vertexInputWGSL.code}
) -> VertexOutput {
  output.instanceIds = instanceIds;
  /* shaderity: @{mainPrerequisites} */
`;
        return str;
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
  getMainEnd(engine: Engine, isVertexStage: boolean) {
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

  /**
   * Generates vertex shader prerequisites for Raymarching shader.
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes used to generate varying variables for Raymarching shader
   * @returns The complete vertex shader prerequisites code string for Raymarching shader
   */
  getVertexPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let vertexShaderPrerequisites = '';
      vertexShaderPrerequisites += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

`;
      return vertexShaderPrerequisites;
    }
    // WebGL
    let vertexShaderPrerequisites = '';
    vertexShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
/* shaderity: @{prerequisites} */

in vec4 a_position;
#ifdef RN_USE_COLOR_0
  in vec4 a_color;
#else
  const vec4 a_color = vec4(1.0, 1.0, 1.0, 1.0);
#endif
in vec3 a_normal;
in uvec4 a_instanceIds;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in uvec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
in vec4 a_tangent;
flat out uvec4 v_instanceIds;
`;
    vertexShaderPrerequisites += `
`;
    vertexShaderPrerequisites += '/* shaderity: @{getters} */';
    vertexShaderPrerequisites += '/* shaderity: @{matricesGetters} */';
    return vertexShaderPrerequisites;
  }

  /**
   * Generates fragment/pixel shader prerequisites including definitions and varying variable declarations.
   * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
   * @returns The complete fragment shader prerequisites code string
   */
  getPixelPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let pixelShaderPrerequisites = '';
      pixelShaderPrerequisites += `
  /* shaderity: @{definitions} */
  #define RN_IS_NODE_SHADER

  struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @builtin(front_facing) isFront: bool,
  }

  /* shaderity: @{prerequisites} */
  /* shaderity: @{getters} */
  /* shaderity: @{matricesGetters} */
  `;
      return pixelShaderPrerequisites;
    }
    let pixelShaderPrerequisites = '';
    pixelShaderPrerequisites += `
        #version 300 es
        precision highp float;
        precision highp int;
  /* shaderity: @{definitions} */
        #define RN_IS_NODE_SHADER
    /* shaderity: @{prerequisites} */
        flat in uvec4 v_instanceIds;
  `;
    pixelShaderPrerequisites += '/* shaderity: @{getters} */';
    pixelShaderPrerequisites += '/* shaderity: @{matricesGetters} */';
    pixelShaderPrerequisites += 'layout(location = 0) out vec4 rt0;';
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
  getAssignmentStatement(
    engine: Engine,
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>
  ) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket!.compositionType.toWGSLType(inputSocket!.componentType);
      const wgslInitialValue = inputSocket!.compositionType.getWgslInitialValue(inputSocket!.componentType);
      // For struct types (where getWgslInitialValue returns 'unknown'), declare without initialization
      let rowStr: string;
      if (wgslInitialValue === 'unknown') {
        rowStr = `var ${varName}: ${wgslTypeStr};\n`;
      } else {
        rowStr = `var ${varName}: ${wgslTypeStr} = ${wgslInitialValue};\n`;
      }
      return rowStr;
    }
    let glslTypeStr = inputSocket!.compositionType.getGlslStr(inputSocket!.componentType);
    // For struct types, remove the 'struct ' prefix for GLSL variable declarations
    if (glslTypeStr.startsWith('struct ')) {
      glslTypeStr = glslTypeStr.replace('struct ', '');
    }
    const glslInitialValue = inputSocket!.compositionType.getGlslInitialValue(inputSocket!.componentType);
    // For struct types (where getGlslInitialValue returns 'unknown'), declare without initialization
    let rowStr: string;
    if (glslInitialValue === 'unknown') {
      rowStr = `${glslTypeStr} ${varName};\n`;
    } else {
      rowStr = `${glslTypeStr} ${varName} = ${glslInitialValue};\n`;
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
  getAssignmentVaryingStatementInPixelShader(
    engine: Engine,
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>,
    inputNode: AbstractShaderNode,
    outputNameOfPrev: string
  ) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket!.compositionType.toWGSLType(inputSocket!.componentType);
      const rowStr = `var ${varName}: ${wgslTypeStr} = input.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${outputNameOfPrev};\n`;
      return rowStr;
    }
    const glslTypeStr = inputSocket!.compositionType.getGlslStr(inputSocket!.componentType);
    const rowStr = `${glslTypeStr} ${varName} = v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${outputNameOfPrev};\n`;
    return rowStr;
  }
}

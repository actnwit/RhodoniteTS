import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import { VertexAttribute, type VertexAttributeEnum } from '../../foundation/definitions/VertexAttribute';
import { WebGLResourceRepository } from '../WebGLResourceRepository';
import { SystemState } from '../../foundation/system/SystemState';
import vertexInputWGSL from '../../webgpu/shaderity_shaders/common/vertexInput.wgsl';
import type { AttributeNames } from '../types/CommonTypes';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import morphVariablesGLSL from '../shaderity_shaders/common/morphVariables.glsl';

/**
 * Abstract base class that provides common shader functionality for both WebGL and WebGPU rendering approaches.
 * This class handles shader code generation, vertex/fragment shader prerequisites, and cross-platform compatibility
 * between WebGL and WebGPU shader languages (GLSL and WGSL).
 */
export abstract class CommonShaderPart {
  static __instance: CommonShaderPart;
  __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  constructor() {}

  /**
   * Generates the main function beginning code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @returns The shader code string for the main function beginning
   */
  static getMainBegin(isVertexStage: boolean) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        let str = `
var<private> output : VertexOutput;
@vertex
fn main(
${vertexInputWGSL.code}
) -> VertexOutput {
`;
        return str;
      } else {
        let str = `
var<private> rt0: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
@fragment
fn main(
  input: VertexOutput,
  @builtin(front_facing) isFront: bool,
) -> @location(0) vec4<f32> {
`;
        return str;
      }
    } else {
      return `
void main() {
`;
    }
  }

  /**
   * Generates the main function ending code for vertex or fragment shaders.
   * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
   *
   * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
   * @returns The shader code string for the main function ending
   */
  static getMainEnd(isVertexStage: boolean) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        return `
  return output;
}
`;
      } else {
        return `
  return rt0;
}
`;
      }
    } else {
      return `
}
    `;
    }
  }

  /**
   * Generates vertex shader prerequisites including definitions, vertex inputs, and uniform declarations.
   * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
   * @returns The complete vertex shader prerequisites code string
   */
  static getVertexPrerequisites(shaderNodes: AbstractShaderNode[]) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      const varyingVariables = CommonShaderPart.__makeVaryingVariablesWGSL(shaderNodes);
      let vertexShaderPrerequisites = '';
      vertexShaderPrerequisites += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  ${varyingVariables}
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
`;
      return vertexShaderPrerequisites;
    } else {
      // WebGL
      let vertexShaderPrerequisites = '';
      vertexShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER
/* shaderity: @{prerequisites} */

${morphVariablesGLSL.code}

in vec4 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in vec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
`;
      vertexShaderPrerequisites += `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`;
      vertexShaderPrerequisites += '/* shaderity: @{getters} */';
      vertexShaderPrerequisites += '/* shaderity: @{matricesGetters} */';

      return vertexShaderPrerequisites;
    }
  }

  /**
   * Creates varying variables declaration string for WebGPU shaders.
   * Analyzes shader node connections to determine which variables need to be passed from vertex to fragment stage.
   *
   * @param shaderNodes - Array of shader nodes to analyze for varying variables
   * @returns WGSL varying variables declaration string
   * @private
   */
  private static __makeVaryingVariablesWGSL(shaderNodes: AbstractShaderNode[]) {
    const varyings: {
      type: string;
      name: string;
    }[] = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      for (let j = 0; j < shaderNode.inputConnections.length; j++) {
        const inputConnection = shaderNode.inputConnections[j];
        if (inputConnection == null) {
          continue;
        }
        const input = shaderNode.getInputs()[j];
        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        if (inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Fragment') {
          const type = input.compositionType.toWGSLType(input.componentType);
          varyings.push({
            type: type,
            name: `${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}`,
          });
        }
      }
    }

    varyings.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else {
        return 1;
      }
    });

    let varyingVariables = '';
    for (let i = 0; i < varyings.length; i++) {
      varyingVariables += `@location(${i}) ${varyings[i].name}: ${varyings[i].type},\n`;
    }

    return varyingVariables;
  }

  /**
   * Generates fragment/pixel shader prerequisites including definitions and varying variable declarations.
   * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
   * @returns The complete fragment shader prerequisites code string
   */
  static getPixelPrerequisites(shaderNodes: AbstractShaderNode[]) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      const varyingVariables = CommonShaderPart.__makeVaryingVariablesWGSL(shaderNodes);

      let pixelShaderPrerequisites = '';
      pixelShaderPrerequisites += `
/* shaderity: @{definitions} */
#define RN_IS_NODE_SHADER

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  ${varyingVariables}
}

/* shaderity: @{prerequisites} */
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
`;
      return pixelShaderPrerequisites;
    } else {
      let pixelShaderPrerequisites = '';
      pixelShaderPrerequisites += `
      #version 300 es
      precision highp float;
      precision highp int;
      /* shaderity: @{definitions} */
      #define RN_IS_NODE_SHADER
      /* shaderity: @{prerequisites} */
      `;
      pixelShaderPrerequisites += '/* shaderity: @{getters} */';
      pixelShaderPrerequisites += 'layout(location = 0) out vec4 rt0;';
      return pixelShaderPrerequisites;
    }
  }

  /**
   * Generates the main prerequisites section placeholder for shader code.
   * This is used by the shaderity system to inject additional prerequisites.
   *
   * @returns The main prerequisites placeholder string
   */
  static getMainPrerequisites() {
    return `/* shaderity: @{mainPrerequisites} */`;
  }

  /**
   * Generates variable assignment statement with proper type declaration.
   * Creates appropriate syntax for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
   *
   * @param varName - The name of the variable to declare
   * @param inputSocket - The socket containing type and default value information
   * @returns The variable assignment statement string
   */
  static getAssignmentStatement(
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>
  ) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket!.compositionType.toWGSLType(inputSocket!.componentType);
      const wgslInitialValue = inputSocket!.compositionType.getWgslInitialValue(inputSocket!.componentType);
      const rowStr = `var ${varName}: ${wgslTypeStr} = ${wgslInitialValue};\n`;
      return rowStr;
    } else {
      const glslTypeStr = inputSocket!.compositionType.getGlslStr(inputSocket!.componentType);
      const glslInitialValue = inputSocket!.compositionType.getGlslInitialValue(inputSocket!.componentType);
      const rowStr = `${glslTypeStr} ${varName} = ${glslInitialValue};\n`;
      return rowStr;
    }
  }

  /**
   * Generates varying variable assignment statement for fragment/pixel shaders.
   * Creates code to read varying variables passed from vertex shader with proper type declaration.
   *
   * @param varName - The name of the variable to declare
   * @param inputSocket - The socket containing type information
   * @param inputNode - The shader node that provides the varying variable
   * @returns The varying variable assignment statement string for fragment shader
   */
  static getAssignmentVaryingStatementInPixelShader(
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>,
    inputNode: AbstractShaderNode
  ) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket!.compositionType.toWGSLType(inputSocket!.componentType);
      const rowStr = `var ${varName}: ${wgslTypeStr} = input.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid};\n`;
      return rowStr;
    } else {
      const glslTypeStr = inputSocket!.compositionType.getGlslStr(inputSocket!.componentType);
      const rowStr = `${glslTypeStr} ${varName} = v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid};\n`;
      return rowStr;
    }
  }

  /**
   * Generates varying variable assignment statement for vertex shaders.
   * Creates code to write varying variables that will be passed to fragment shader.
   *
   * @param inputNode - The shader node that provides the varying variable
   * @param varNames - Array of variable names to assign
   * @param j - Index of the current variable in the varNames array
   * @returns The varying variable assignment statement string for vertex shader
   */
  static getAssignmentVaryingStatementInVertexShader(inputNode: AbstractShaderNode, varNames: string[], j: number) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `output.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid} = ${varNames[j]};\n`;
    } else {
      return `v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid} = ${varNames[j]};\n`;
    }
  }

  /**
   * Gets the attribute names used by this shader part.
   * Must be implemented by concrete subclasses to define which vertex attributes are used.
   *
   * @returns Object containing attribute name mappings
   */
  abstract get attributeNames(): AttributeNames;

  /**
   * Gets the vertex attribute semantics used by this shader part.
   * Must be implemented by concrete subclasses to define the semantic meaning of each attribute.
   *
   * @returns Array of vertex attribute enums defining the semantics
   */
  abstract get attributeSemantics(): Array<VertexAttributeEnum>;

  /**
   * Gets the composition types for each vertex attribute used by this shader part.
   * Must be implemented by concrete subclasses to define the data composition (scalar, vec2, vec3, etc.).
   *
   * @returns Array of composition type enums defining the data structure
   */
  abstract get attributeCompositions(): Array<CompositionTypeEnum>;

  /**
   * Gets the vertex shader definitions code.
   * Must be implemented by concrete subclasses to provide shader-specific definitions.
   *
   * @returns Vertex shader definitions code string
   */
  abstract get vertexShaderDefinitions(): string;

  /**
   * Gets the pixel/fragment shader definitions code.
   * Must be implemented by concrete subclasses to provide shader-specific definitions.
   *
   * @returns Fragment shader definitions code string
   */
  abstract get pixelShaderDefinitions(): string;
}

import { ComponentType, type ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import { VertexAttribute, type VertexAttributeEnum } from '../../foundation/definitions/VertexAttribute';
import { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';
import { EngineState } from '../../foundation/system/EngineState';
import vertexInputWGSL from '../../webgpu/shaderity_shaders/common/vertexInput.wgsl';
import morphVariablesGLSL from '../shaderity_shaders/common/morphVariables.glsl';
import type { AttributeNames } from '../types/CommonTypes';
import { WebGLResourceRepository } from '../WebGLResourceRepository';
import { CommonShaderPart } from './CommonShaderPart';

/**
 * Base class that provides common shader functionality for both WebGL and WebGPU rendering approaches.
 * This class handles shader code generation, vertex/fragment shader prerequisites, and cross-platform compatibility
 * between WebGL and WebGPU shader languages (GLSL and WGSL).
 */
export class StandardShaderPart extends CommonShaderPart {
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

  getMaterialSIDForWebGL() {
    return `
  #ifdef RN_IS_DATATEXTURE_MODE
    uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID
#else
    uint materialSID = 0u;
#endif
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
  getVertexPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const varyingVariables = this.__makeVaryingVariablesWGSL(shaderNodes);
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

/* shaderity: @{opticalDefinition} */
/* shaderity: @{shadowDefinition} */
/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */

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

${morphVariablesGLSL.code}

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
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`;
    vertexShaderPrerequisites += '/* shaderity: @{getters} */';
    vertexShaderPrerequisites += '/* shaderity: @{matricesGetters} */';
    vertexShaderPrerequisites += '/* shaderity: @{opticalDefinition} */';
    vertexShaderPrerequisites += '/* shaderity: @{shadowDefinition} */';
    vertexShaderPrerequisites += '/* shaderity: @{pbrDefinition} */';
    vertexShaderPrerequisites += '/* shaderity: @{iblDefinition} */';
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
  private __makeVaryingVariablesWGSL(shaderNodes: AbstractShaderNode[]) {
    const varyings: {
      type: string;
      name: string;
      needsFlat: boolean;
    }[] = [];
    const definedVaryings: Set<string> = new Set();
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
          const name = `${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
          if (definedVaryings.has(name)) {
            continue;
          }
          definedVaryings.add(name);
          // Integer and boolean types require flat interpolation in WGSL
          const needsFlat =
            input.componentType.isInteger() ||
            input.componentType.isUnsignedInteger() ||
            input.componentType === ComponentType.Bool;
          varyings.push({
            type: type,
            name: name,
            needsFlat: needsFlat,
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

    let varyingVariables = '';
    for (let i = 0; i < varyings.length; i++) {
      const flatAttr = varyings[i].needsFlat ? ' @interpolate(flat)' : '';
      varyingVariables += `@location(${i})${flatAttr} ${varyings[i].name}: ${varyings[i].type},\n`;
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
  getPixelPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const varyingVariables = this.__makeVaryingVariablesWGSL(shaderNodes);

      let pixelShaderPrerequisites = '';
      pixelShaderPrerequisites += `
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
    pixelShaderPrerequisites += '/* shaderity: @{opticalDefinition} */';
    pixelShaderPrerequisites += '/* shaderity: @{shadowDefinition} */';
    pixelShaderPrerequisites += '/* shaderity: @{pbrDefinition} */';
    pixelShaderPrerequisites += '/* shaderity: @{iblDefinition} */';
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
  getAssignmentVaryingStatementInVertexShader(
    engine: Engine,
    inputNode: AbstractShaderNode,
    varNames: string[],
    j: number
  ) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `output.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid} = ${varNames[j]};\n`;
    }
    return `v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid} = ${varNames[j]};\n`;
  }

  /**
   * Gets the attribute names used by this shader part.
   * Subclasses should override this to define which vertex attributes are used.
   *
   * @returns Object containing attribute name mappings
   */
  get attributeNames(): AttributeNames {
    return [];
  }

  /**
   * Gets the vertex attribute semantics used by this shader part.
   * Subclasses should override this to define the semantic meaning of each attribute.
   *
   * @returns Array of vertex attribute enums defining the semantics
   */
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  /**
   * Gets the composition types for each vertex attribute used by this shader part.
   * Subclasses should override this to define the data composition (scalar, vec2, vec3, etc.).
   *
   * @returns Array of composition type enums defining the data structure
   */
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }

  /**
   * Gets the vertex shader definitions code.
   * Subclasses should override this to provide shader-specific definitions.
   *
   * @returns Vertex shader definitions code string
   */
  getVertexShaderDefinitions(_engine: Engine): string {
    return '';
  }

  /**
   * Gets the pixel/fragment shader definitions code.
   * Subclasses should override this to provide shader-specific definitions.
   *
   * @returns Fragment shader definitions code string
   */
  getPixelShaderDefinitions(_engine: Engine): string {
    return '';
  }
}

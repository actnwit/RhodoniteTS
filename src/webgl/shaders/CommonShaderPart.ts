import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import { VertexAttribute, VertexAttributeEnum } from '../../foundation/definitions/VertexAttribute';
import { WebGLResourceRepository } from '../WebGLResourceRepository';
import { SystemState } from '../../foundation/system/SystemState';
import prerequisitesShaderityObjectGLSL from '../../webgl/shaderity_shaders/common/prerequisites.glsl';
import vertexOutputWGSL from '../..//webgpu/shaderity_shaders/common/vertexOutput.wgsl';
import vertexInputWGSL from '../../webgpu/shaderity_shaders/common/vertexInput.wgsl';
import prerequisitesShaderityObjectWGSL from '../../webgpu/shaderity_shaders/common/prerequisites.wgsl';
import { AttributeNames } from '../types/CommonTypes';
import { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import mainPrerequisitesShaderityObjectGLSL from '../../webgl/shaderity_shaders/common/mainPrerequisites.glsl';
import mainPrerequisitesShaderityObjectWGSL from '../../webgpu/shaderity_shaders/common/mainPrerequisites.wgsl';
import { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { Socket } from '../../foundation/materials/core/Socket';
import { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';

export abstract class CommonShaderPart {
  static __instance: CommonShaderPart;
  __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  constructor() {}

  static getMainBegin(isVertexStage: boolean) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (isVertexStage) {
        let str = `
var<private> output : VertexOutput;
@vertex
fn main(
${vertexInputWGSL.code}
) -> VertexOutput {
#ifdef RN_USE_INSTANCE
a_instanceIds = instance_ids;
#endif

#ifdef RN_USE_POSITION
a_position = vec3<f32>(position);
#endif

#ifdef RN_USE_NORMAL
a_normal = normal;
#endif

#ifdef RN_USE_TEXCOORD_0
a_texcoord_0 = texcoord_0;
#endif

#ifdef RN_USE_COLOR_0
a_color_0 = vec4<f32>(color_0);
#endif
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

  static getVertexPrerequisites() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      let vertexShaderPrerequisites = '';
      vertexShaderPrerequisites += `
/* shaderity: @{definitions} */

#ifdef RN_USE_INSTANCE
var<private> a_instanceIds: vec4<f32>;
#endif

#ifdef RN_USE_POSITION_FLOAT
var<private> a_position: vec3<f32>;
#endif
#ifdef RN_USE_POSITION_INT
var<private> a_position: vec3<i32>;
#endif
#ifdef RN_USE_POSITION_UINT
var<private> a_position: vec3<u32>;
#endif

#ifdef RN_USE_NORMAL
var<private> a_normal: vec3<f32>;
#endif

#ifdef RN_USE_TEXCOORD_0
var<private> a_texcoord_0: vec2<f32>;
#endif

#ifdef RN_USE_COLOR_0_FLOAT
var<private> a_color_0: vec4<f32>,
#endif
#ifdef RN_USE_COLOR_0_INT
var<private> a_color_0: vec4<i32>,
#endif
#ifdef RN_USE_COLOR_0_UINT
var<private> a_color_0: vec4<u32>,
#endif


${vertexOutputWGSL.code}
${prerequisitesShaderityObjectWGSL.code}
/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
`;
      return vertexShaderPrerequisites;
    } else {
      let vertexShaderPrerequisites = '';
      const in_ = 'in';
      vertexShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
${prerequisitesShaderityObjectGLSL.code}

${in_} vec4 a_instanceInfo;\n`;
      vertexShaderPrerequisites += `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`;
      vertexShaderPrerequisites += '/* shaderity: @{matricesGetters} */';
      vertexShaderPrerequisites += '/* shaderity: @{getters} */';

      return vertexShaderPrerequisites;
    }
  }

  static getPixelPrerequisites() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      let pixelShaderPrerequisites = '';
      pixelShaderPrerequisites += `
/* shaderity: @{definitions} */
${vertexOutputWGSL.code}
${prerequisitesShaderityObjectWGSL.code}
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
      ${prerequisitesShaderityObjectGLSL.code}
      `;
      pixelShaderPrerequisites += '/* shaderity: @{getters} */';
      pixelShaderPrerequisites += 'layout(location = 0) out vec4 rt0;';
      return pixelShaderPrerequisites;
    }
  }

  static getMainPrerequisites() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return mainPrerequisitesShaderityObjectWGSL.code;
    } else {
      return mainPrerequisitesShaderityObjectGLSL.code;
    }
  }

  static getAssignmentStatement(
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum>
  ) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket!.compositionType.toWGSLType(inputSocket!.componentType);
      const wgslInitialValue = inputSocket!.compositionType.getWgslInitialValue(
        inputSocket!.componentType
      );
      const rowStr = `var ${varName}: ${wgslTypeStr} = ${wgslInitialValue};\n`;
      return rowStr;
    } else {
      const glslTypeStr = inputSocket!.compositionType.getGlslStr(inputSocket!.componentType);
      const glslInitialValue = inputSocket!.compositionType.getGlslInitialValue(
        inputSocket!.componentType
      );
      const rowStr = `${glslTypeStr} ${varName} = ${glslInitialValue};\n`;
      return rowStr;
    }
  }

  static getAssignmentVaryingStatement(
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum>,
    inputNode: AbstractShaderNode
  ) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      const wgslTypeStr = inputSocket!.compositionType.toWGSLType(inputSocket!.componentType);
      const rowStr = `var ${varName}: ${wgslTypeStr} = v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid};\n`;
      return rowStr;
    } else {
      const glslTypeStr = inputSocket!.compositionType.getGlslStr(inputSocket!.componentType);
      const rowStr = `${glslTypeStr} ${varName} = v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid};\n`;
      return rowStr;
    }
  }

  abstract get attributeNames(): AttributeNames;
  abstract get attributeSemantics(): Array<VertexAttributeEnum>;
  abstract get attributeCompositions(): Array<CompositionTypeEnum>;
  abstract get vertexShaderDefinitions(): string;
  abstract get pixelShaderDefinitions(): string;
}

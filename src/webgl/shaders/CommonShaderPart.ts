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

export abstract class CommonShaderPart {
  static __instance: CommonShaderPart;
  __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  constructor() {}

  static getMainBegin(isVertexStage: boolean) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      let str = '';
      const stage = isVertexStage
        ? '@vertex'
        : `var<private> rt0: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
@fragment`;
      str += stage;
      str += `
rn main(
${vertexInputWGSL.code}
) -> VertexOutput {
`;
      return str;
    } else {
      return `
void main() {
`;
    }
  }

  static getMainEnd(isVertexStage: boolean) {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU && !isVertexStage) {
      return `
  return rt0;
}
    `;
    } else {
      return `
}
    `;
    }
  }

  static getVertexPrerequisites() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      let vertexShaderPrerequisites = '';
      vertexShaderPrerequisites += `/* shaderity: @{definitions} */
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
      pixelShaderPrerequisites += `/* shaderity: @{definitions} */
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

  abstract get attributeNames(): AttributeNames;
  abstract get attributeSemantics(): Array<VertexAttributeEnum>;
  abstract get attributeCompositions(): Array<CompositionTypeEnum>;
  abstract get vertexShaderDefinitions(): string;
  abstract get pixelShaderDefinitions(): string;
}

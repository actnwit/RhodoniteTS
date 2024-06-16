import { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import { ShaderSemanticsClass } from '../../foundation/definitions/ShaderSemantics';
import { VertexAttribute, VertexAttributeEnum } from '../../foundation/definitions/VertexAttribute';
import { WebGLResourceRepository } from '../WebGLResourceRepository';
import { SystemState } from '../../foundation/system/SystemState';
import { AttributeNames } from '../types/CommonTypes';
import prerequisitesShaderityObjectGLSL from '../../../webgl/shaderity_shaders/common/prerequisites.glsl';

export abstract class CommonShaderPart {
  static __instance: CommonShaderPart;
  __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  constructor() {}

  get glsl_fragColor() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper != null && repo.currentWebGLContextWrapper!.isWebGL2) {
      return '';
    } else {
      return 'gl_FragColor = rt0;\n';
    }
  }

  static get glslMainBegin() {
    return `
void main() {
`;
  }

  static get glslMainEnd() {
    return `
}
    `;
  }

  static getVertexPrerequisites() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return '';
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
      return '';
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

  abstract get attributeNames(): AttributeNames;
  abstract get attributeSemantics(): Array<VertexAttributeEnum>;
  abstract get attributeCompositions(): Array<CompositionTypeEnum>;
  abstract get vertexShaderDefinitions(): string;
  abstract get pixelShaderDefinitions(): string;
}

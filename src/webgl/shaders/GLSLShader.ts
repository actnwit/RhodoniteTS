import {CompositionTypeEnum} from '../../foundation/definitions/CompositionType';
import {ProcessApproach} from '../../foundation/definitions/ProcessApproach';
import {ShaderAttributeOrSemanticsOrString} from '../../foundation/materials/core/AbstractMaterialContent';
import {ShaderSemanticsClass} from '../../foundation/definitions/ShaderSemantics';
import {
  VertexAttribute,
  VertexAttributeEnum,
} from '../../foundation/definitions/VertexAttribute';
import { WebGLResourceRepository } from '../WebGLResourceRepository';
import {WellKnownComponentTIDs} from '../../foundation/components/WellKnownComponentTIDs';
import SystemState from '../../foundation/system/SystemState';
import { MemoryManager } from '../../foundation/core/MemoryManager';
import { AttributeNames } from '../types/CommonTypes';

export abstract class GLSLShader {
  static __instance: GLSLShader;
  __webglResourceRepository?: WebGLResourceRepository =
    WebGLResourceRepository.getInstance();
  constructor() {}

  get glsl_fragColor() {
    const repo = this.__webglResourceRepository!;
    if (
      repo.currentWebGLContextWrapper != null &&
      repo.currentWebGLContextWrapper!.isWebGL2
    ) {
      return '';
    } else {
      return 'gl_FragColor = rt0;\n';
    }
  }
  get glsl_textureCube() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'texture';
    } else {
      return 'textureCube';
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

  getGlslVertexShaderProperies(str = '') {
    return str;
  }

  get prerequisites() {
    const webGLResourceRepository = WebGLResourceRepository.getInstance();
    const dataUboDefinition =
      webGLResourceRepository.getGlslDataUBODefinitionString();
    const dataUBOVec4SizeStr =
      webGLResourceRepository.getGlslDataUBOVec4SizeString();
    return `uniform float u_materialSID;
`;
  }

  get mainPrerequisites() {
    const processApproach = SystemState.currentProcessApproach;
    if (ProcessApproach.isFastestApproach(processApproach)) {
      return `
`;
    } else {
      return `
      `;
    }
  }

  static getStringFromShaderAnyDataType(
    data: ShaderAttributeOrSemanticsOrString
  ): string {
    if (data instanceof ShaderSemanticsClass) {
      return 'u_' + data.str;
    } else if (VertexAttribute.isInstanceOfVertexAttributeClass(data)) {
      return data.shaderStr;
    } else {
      return data as string;
    }
  }
  abstract get attributeNames(): AttributeNames;
  abstract get attributeSemantics(): Array<VertexAttributeEnum>;
  abstract get attributeCompositions(): Array<CompositionTypeEnum>;
}

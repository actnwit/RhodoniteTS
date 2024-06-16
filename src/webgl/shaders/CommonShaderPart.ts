import { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../foundation/definitions/ProcessApproach';
import { ShaderSemanticsClass } from '../../foundation/definitions/ShaderSemantics';
import { VertexAttribute, VertexAttributeEnum } from '../../foundation/definitions/VertexAttribute';
import { WebGLResourceRepository } from '../WebGLResourceRepository';
import { SystemState } from '../../foundation/system/SystemState';
import { AttributeNames } from '../types/CommonTypes';
import { ShaderAttributeOrSemanticsOrString } from '../../foundation/materials/core/AbstractShaderNode';

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

  abstract get attributeNames(): AttributeNames;
  abstract get attributeSemantics(): Array<VertexAttributeEnum>;
  abstract get attributeCompositions(): Array<CompositionTypeEnum>;
  abstract get vertexShaderDefinitions(): string;
  abstract get pixelShaderDefinitions(): string;
}

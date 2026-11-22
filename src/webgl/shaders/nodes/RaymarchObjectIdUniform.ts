import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';

/**
 * Outputs a per-component uniform (the raymarching object id) in the SDF graph.
 * The variable name is the shader semantic added per component, so each merged
 * component reads its own id.
 */
export class RaymarchObjectIdUniformShader extends RaymarchingShaderPart {
  private __variableName = '';
  private __shaderFunctionName = '';

  constructor(shaderFunctionName: string) {
    super();
    this.__shaderFunctionName = shaderFunctionName;
  }

  setVariableName(name: any) {
    this.__variableName = name;
  }

  getVertexShaderDefinitions(_engine: Engine) {
    return '';
  }

  get vertexShaderBody() {
    return '';
  }

  getPixelShaderDefinitions(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
fn ${this.__shaderFunctionName}(outValue: ptr<function, f32>) {
  *outValue = get_${this.__variableName}(uniformDrawParameters.materialSid, 0u);
}
      `;
    }
    return `
void ${this.__shaderFunctionName}(out float outValue) {
  ${this.getMaterialSIDForWebGL()}
  outValue = get_${this.__variableName}(materialSID, 0u);
}
      `;
  }

  getPixelShaderBody() {
    return '';
  }

  get attributeNames(): AttributeNames {
    return [];
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}

import { Count } from '../../types/CommonTypes';
import { ComponentTypeEnum } from './ComponentType';
import { CompositionType, CompositionTypeEnum } from './CompositionType';
import { ShaderSemanticsEnum } from './ShaderSemantics';
import { ShaderTypeEnum } from './ShaderType';
import { ShaderVariableUpdateIntervalEnum } from './ShaderVariableUpdateInterval';

export type ShaderSemanticsInfo = {
  semantic: ShaderSemanticsEnum;
  prefix?: string;
  arrayLength?: Count; // the array length of the array type shader variable
  compositionType: CompositionTypeEnum;
  componentType: ComponentTypeEnum;
  isCustomSetting: boolean;
  initialValue?: any; // initial value
  updateInterval?: ShaderVariableUpdateIntervalEnum;
  stage: ShaderTypeEnum;
  soloDatum?: boolean; // is the shader variable's value unique (one resource) in the material
  needUniformInDataTextureMode?: boolean;
  min: number;
  max: number;
  valueStep?: number;
  xName?: string;
  yName?: string;
  zName?: string;
  wName?: string;
};

export function calcAlignedByteLength(semanticInfo: ShaderSemanticsInfo) {
  const compositionNumber = semanticInfo.compositionType.getNumberOfComponents();
  const componentSizeInByte = semanticInfo.componentType.getSizeInBytes();
  const semanticInfoByte = compositionNumber * componentSizeInByte;
  let alignedByteLength = semanticInfoByte;
  if (alignedByteLength % 16 !== 0) {
    alignedByteLength = semanticInfoByte + 16 - (semanticInfoByte % 16);
  }
  if (CompositionType.isArray(semanticInfo.compositionType)) {
    const maxArrayLength = semanticInfo.arrayLength;
    if (maxArrayLength != null) {
      alignedByteLength *= maxArrayLength;
    } else {
      console.error('semanticInfo has invalid maxIndex!');
      alignedByteLength *= 100;
    }
  }
  return alignedByteLength;
}

/**
 * @internal
 */
export function _getPropertyIndex(semanticInfo: ShaderSemanticsInfo) {
  const propertyIndex = semanticInfo.semantic.index;
  return propertyIndex;
}

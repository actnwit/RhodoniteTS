import type { Count } from '../../types/CommonTypes';
import { Logger } from '../misc/Logger';
import type { ComponentTypeEnum } from './ComponentType';
import { CompositionType, type CompositionTypeEnum } from './CompositionType';
import { ShaderSemanticsEnum, type ShaderSemanticsName } from './ShaderSemantics';
import type { ShaderTypeEnum } from './ShaderType';

export type ShaderSemanticsInfo = {
  semantic: ShaderSemanticsName;
  compositionType: CompositionTypeEnum;
  componentType: ComponentTypeEnum;
  stage: ShaderTypeEnum;
  min: number;
  max: number;
  initialValue?: any; // initial value
  isInternalSetting?: boolean;
  arrayLength?: Count; // the array length of the array type shader variable
  soloDatum?: boolean; // is the shader variable's value unique (one resource) in the material
  needUniformInDataTextureMode?: boolean;
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
      Logger.default.error('semanticInfo has invalid maxIndex!');
      alignedByteLength *= 100;
    }
  }
  return alignedByteLength;
}

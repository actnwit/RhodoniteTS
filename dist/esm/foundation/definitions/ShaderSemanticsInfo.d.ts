import { Count } from '../../types/CommonTypes';
import { ComponentTypeEnum } from './ComponentType';
import { CompositionTypeEnum } from './CompositionType';
import { ShaderSemanticsEnum } from './ShaderSemantics';
import { ShaderTypeEnum } from './ShaderType';
export type ShaderSemanticsInfo = {
    semantic: ShaderSemanticsEnum;
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    stage: ShaderTypeEnum;
    min: number;
    max: number;
    initialValue?: any;
    isInternalSetting?: boolean;
    arrayLength?: Count;
    soloDatum?: boolean;
    needUniformInDataTextureMode?: boolean;
    valueStep?: number;
    xName?: string;
    yName?: string;
    zName?: string;
    wName?: string;
};
export declare function calcAlignedByteLength(semanticInfo: ShaderSemanticsInfo): number;
/**
 * @internal
 */
export declare function _getPropertyIndex(semanticInfo: ShaderSemanticsInfo): number;

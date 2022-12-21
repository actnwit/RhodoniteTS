import { Count } from '../../types/CommonTypes';
import { ComponentTypeEnum } from './ComponentType';
import { CompositionTypeEnum } from './CompositionType';
import { ShaderSemanticsEnum } from './ShaderSemantics';
import { ShaderTypeEnum } from './ShaderType';
import { ShaderVariableUpdateIntervalEnum } from './ShaderVariableUpdateInterval';
export declare type ShaderSemanticsInfo = {
    semantic: ShaderSemanticsEnum;
    prefix?: string;
    arrayLength?: Count;
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    min: number;
    max: number;
    valueStep?: number;
    isCustomSetting: boolean;
    initialValue?: any;
    updateInterval?: ShaderVariableUpdateIntervalEnum;
    stage: ShaderTypeEnum;
    xName?: string;
    yName?: string;
    zName?: string;
    wName?: string;
    soloDatum?: boolean;
    isComponentData?: boolean;
    noControlUi?: boolean;
    needUniformInDataTextureMode?: boolean;
    none_u_prefix?: boolean;
};
export declare function calcAlignedByteLength(semanticInfo: ShaderSemanticsInfo): number;
/**
 * @internal
 */
export declare function _getPropertyIndex(semanticInfo: ShaderSemanticsInfo): number;

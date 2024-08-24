import { getShaderPropertyFunc, ShaderSemanticsName } from '../definitions/ShaderSemantics';
import { Count, Index, CGAPIResourceHandle, IndexOf16Bytes } from '../../types/CommonTypes';
import { Accessor } from '../memory/Accessor';
import { ProcessApproachEnum } from '../../foundation/definitions/ProcessApproach';
import { ShaderSemanticsInfo } from '../definitions/ShaderSemanticsInfo';
type GlobalPropertyStruct = {
    shaderSemanticsInfo: ShaderSemanticsInfo;
    values: any[];
    maxCount: Count;
    accessor: Accessor;
};
/**
 * The class which manages global data.
 */
export declare class GlobalDataRepository {
    private static __instance;
    private __fields;
    private constructor();
    /**
     * Initialize the GlobalDataRepository
     * @param approach - ProcessApproachEnum for initialization
     */
    initialize(approach: ProcessApproachEnum): void;
    static getInstance(): GlobalDataRepository;
    private __registerProperty;
    takeOne(shaderSemantic: ShaderSemanticsName): any;
    setValue(shaderSemantic: ShaderSemanticsName, countIndex: Index, value: any): void;
    getValue(shaderSemantic: ShaderSemanticsName, countIndex: Index): any;
    getGlobalPropertyStruct(propertyName: ShaderSemanticsName): GlobalPropertyStruct | undefined;
    getGlobalProperties(): GlobalPropertyStruct[];
    _setUniformLocationsForUniformModeOnly(shaderProgramUid: CGAPIResourceHandle): void;
    _setUniformLocationsForDataTextureModeOnly(shaderProgramUid: CGAPIResourceHandle): void;
    setUniformValues(shaderProgram: WebGLProgram): void;
    getLocationOffsetOfProperty(propertyName: ShaderSemanticsName): IndexOf16Bytes;
    getCurrentDataNumberOfTheProperty(propertyName: ShaderSemanticsName): number;
    _addPropertiesStr(vertexPropertiesStr: string, pixelPropertiesStr: string, propertySetter: getShaderPropertyFunc, isWebGL2: boolean): string[];
}
export {};

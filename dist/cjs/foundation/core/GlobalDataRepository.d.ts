import { ShaderSemanticsEnum, getShaderPropertyFunc } from '../definitions/ShaderSemantics';
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
    takeOne(shaderSemantic: ShaderSemanticsEnum): any;
    setValue(shaderSemantic: ShaderSemanticsEnum, countIndex: Index, value: any): void;
    getValue(shaderSemantic: ShaderSemanticsEnum, countIndex: Index): any;
    getGlobalPropertyStruct(propertyIndex: Index): GlobalPropertyStruct | undefined;
    getGlobalProperties(): GlobalPropertyStruct[];
    _setUniformLocationsForUniformModeOnly(shaderProgramUid: CGAPIResourceHandle): void;
    _setUniformLocationsForDataTextureModeOnly(shaderProgramUid: CGAPIResourceHandle): void;
    setUniformValues(shaderProgram: WebGLProgram): void;
    getLocationOffsetOfProperty(propertyIndex: Index): IndexOf16Bytes;
    getCurrentDataNumberOfTheProperty(propertyIndex: Index): number;
    _addPropertiesStr(vertexPropertiesStr: string, pixelPropertiesStr: string, propertySetter: getShaderPropertyFunc, isWebGL2: boolean): string[];
}
export {};

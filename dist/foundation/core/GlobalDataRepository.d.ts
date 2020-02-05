import { ShaderSemanticsInfo, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import { Count, Index, CGAPIResourceHandle } from "../../types/CommonTypes";
import { getShaderPropertyFunc } from "../materials/core/Material";
import Accessor from "../memory/Accessor";
declare type GlobalPropertyStruct = {
    shaderSemanticsInfo: ShaderSemanticsInfo;
    values: any[];
    maxCount: Count;
    accessor: Accessor;
};
/**
 * The class which manages global data.
 */
export default class GlobalDataRepository {
    private static __instance;
    private __fields;
    private constructor();
    initialize(): void;
    static getInstance(): GlobalDataRepository;
    registerProperty(semanticInfo: ShaderSemanticsInfo, maxCount: Count): void;
    takeOne(shaderSemantic: ShaderSemanticsEnum, arrayIndex?: Index): any;
    setValue(shaderSemantic: ShaderSemanticsEnum, countIndex: Index, value: any, arrayIndex?: Index): void;
    getValue(shaderSemantic: ShaderSemanticsEnum, countIndex: Index, arrayIndex?: Index): any;
    getGlobalPropertyStruct(propertyIndex: Index): GlobalPropertyStruct | undefined;
    setUniformLocations(shaderProgramUid: CGAPIResourceHandle): void;
    setUniformValues(shaderProgram: WebGLProgram): void;
    getLocationOffsetOfProperty(propertyIndex: Index): number | undefined;
    getCurrentDataNumberOfTheProperty(propertyIndex: Index): number;
    addPropertiesStr(vertexPropertiesStr: string, pixelPropertiesStr: string, propertySetter: getShaderPropertyFunc): string[];
}
export {};

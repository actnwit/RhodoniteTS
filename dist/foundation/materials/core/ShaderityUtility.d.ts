import { ShaderityObject } from "shaderity";
import { CompositionTypeEnum } from "../../definitions/CompositionType";
import { VertexAttributeEnum } from "../../definitions/VertexAttribute";
import { ShaderSemanticsInfo, ShaderSemanticsStr } from "../../definitions/ShaderSemantics";
export default class ShaderityUtility {
    static __instance: ShaderityUtility;
    private __shaderity;
    private __webglResourceRepository?;
    private constructor();
    static getInstance(): ShaderityUtility;
    getVertexShaderBody(shaderityObject: ShaderityObject, args: any): string;
    getPixelShaderBody(shaderityObject: ShaderityObject, args: any): string;
    getReflection(shaderityObject: ShaderityObject): {
        names: string[];
        semantics: VertexAttributeEnum[];
        compositions: CompositionTypeEnum[];
    };
    copyShaderityObject(obj: ShaderityObject): ShaderityObject;
    getShaderDataRefection(shaderityObject: ShaderityObject, existingShaderInfoMap?: Map<ShaderSemanticsStr, ShaderSemanticsInfo>): {
        shaderSemanticsInfoArray: ShaderSemanticsInfo[];
        shaderityObject: ShaderityObject;
    };
}

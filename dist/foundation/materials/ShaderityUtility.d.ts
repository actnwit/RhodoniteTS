import { ShaderityObject } from "shaderity";
import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
import { VertexAttributeEnum } from "../definitions/VertexAttribute";
export default class ShaderityUntility {
    static __instance: ShaderityUntility;
    private __shaderity;
    private __webglResourceRepository?;
    private constructor();
    static getInstance(): ShaderityUntility;
    getVertexShaderBody(shaderityObject: ShaderityObject, args: any): string;
    getPixelShaderBody(shaderityObject: ShaderityObject, args: any): string;
    getReflection(shaderityObject: ShaderityObject): {
        names: string[];
        semantics: VertexAttributeEnum[];
        compositions: CompositionTypeEnum[];
    };
}

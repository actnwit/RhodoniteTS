import { VertexAttributeEnum } from "../../../foundation/definitions/VertexAttribute";
import GLSLShader from "../GLSLShader";
import { CompositionTypeEnum } from "../../../foundation/definitions/CompositionType";
import { ComponentTypeEnum } from "../../../foundation/definitions/ComponentType";
export declare type AttributeNames = Array<string>;
export default class ConstantVariableShader extends GLSLShader {
    private __functionName;
    private __compositionType;
    private __componentType;
    private __constantValueStr;
    constructor(__functionName: string, __compositionType: CompositionTypeEnum, __componentType: ComponentTypeEnum);
    setConstantValue(value: any): void;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

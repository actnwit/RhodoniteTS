import { CommonShaderPart } from '../CommonShaderPart';
import { AttributeNames } from '../../types/CommonTypes';
import { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
export declare class EndShader extends CommonShaderPart {
    static __instance: EndShader;
    static readonly materialElement: import("../../..").EnumIO;
    private constructor();
    static getInstance(): EndShader;
    get vertexShaderDefinitions(): "\n      fn outPosition(inPosition: vec4<f32>) {\n        output.position = inPosition;\n      }\n      " | "\n      void outPosition(in vec4 inPosition) {\n        gl_Position = inPosition;\n      }\n      ";
    get vertexShaderBody(): string;
    get pixelShaderDefinitions(): "\n      fn outColor(inColor: vec4<f32>) {\n        rt0 = inColor;\n      }\n      " | "\n      void outColor(in vec4 inColor) {\n        rt0 = inColor;\n      }\n      ";
    getPixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

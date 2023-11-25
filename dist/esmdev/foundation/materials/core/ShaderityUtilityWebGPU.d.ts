import { ShaderityObject } from 'shaderity';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
export declare type FillArgsObject = {
    [key: string]: string;
};
export declare type VertexAttributesLayout = {
    names: string[];
    semantics: VertexAttributeEnum[];
    compositions: CompositionTypeEnum[];
    components: ComponentTypeEnum[];
};
export declare class ShaderityUtilityWebGPU {
    static fillTemplate(shaderityObject: ShaderityObject, args: FillArgsObject): ShaderityObject;
    static getShaderDataReflection(shaderityObject: ShaderityObject, existingShaderInfoMap?: Map<ShaderSemanticsName, ShaderSemanticsInfo>): {
        shaderSemanticsInfoArray: ShaderSemanticsInfo[];
        shaderityObject: ShaderityObject;
    };
    private static __createShaderSemanticInfoForTexture;
    private static __createShaderSemanticsInfo;
    private static __setRhodoniteOriginalParametersTo;
    private static __getInitialValueFromTextForTexture;
    private static __getInitialValueFromText;
    private static __getDefaultInitialValue;
    private static __copyShaderityObject;
}

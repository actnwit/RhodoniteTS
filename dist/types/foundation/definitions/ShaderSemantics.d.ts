import { EnumClass, EnumIO } from "../misc/EnumIO";
import { CompositionTypeEnum, ComponentTypeEnum } from "../main";
import { ShaderVariableUpdateIntervalEnum } from "./ShaderVariableUpdateInterval";
export interface ShaderSemanticsEnum extends EnumIO {
    singularStr: string;
    pluralStr: string;
}
export declare class ShaderSemanticsClass extends EnumClass implements ShaderSemanticsEnum {
    readonly pluralStr: string;
    constructor({ index, singularStr, pluralStr }: {
        index: number;
        singularStr: string;
        pluralStr: string;
    });
    readonly singularStr: string;
}
declare function fromString(str: string): ShaderSemanticsEnum;
export declare type ShaderSemanticsInfo = {
    semantic?: ShaderSemanticsEnum;
    isPlural?: boolean;
    prefix?: string;
    semanticStr?: string;
    index?: Count;
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    isSystem: boolean;
    initialValue?: any;
    updateFunc?: Function;
    updateInteval?: ShaderVariableUpdateIntervalEnum;
};
export declare const ShaderSemantics: Readonly<{
    WorldMatrix: ShaderSemanticsEnum;
    ViewMatrix: ShaderSemanticsEnum;
    ProjectionMatrix: ShaderSemanticsEnum;
    NormalMatrix: ShaderSemanticsEnum;
    BoneMatrix: ShaderSemanticsEnum;
    BaseColorFactor: ShaderSemanticsEnum;
    BaseColorTexture: ShaderSemanticsEnum;
    NormalTexture: ShaderSemanticsEnum;
    MetallicRoughnessTexture: ShaderSemanticsEnum;
    OcclusionTexture: ShaderSemanticsEnum;
    EmissiveTexture: ShaderSemanticsEnum;
    LightNumber: ShaderSemanticsEnum;
    LightPosition: ShaderSemanticsEnum;
    LightDirection: ShaderSemanticsEnum;
    LightIntensity: ShaderSemanticsEnum;
    MetallicRoughnessFactor: ShaderSemanticsEnum;
    BrdfLutTexture: ShaderSemanticsEnum;
    DiffuseEnvTexture: ShaderSemanticsEnum;
    SpecularEnvTexture: ShaderSemanticsEnum;
    IBLParameter: ShaderSemanticsEnum;
    ViewPosition: ShaderSemanticsEnum;
    Wireframe: ShaderSemanticsEnum;
    DiffuseColorFactor: ShaderSemanticsEnum;
    DiffuseColorTexture: ShaderSemanticsEnum;
    SpecularColorFactor: ShaderSemanticsEnum;
    SpecularColorTexture: ShaderSemanticsEnum;
    Shininess: ShaderSemanticsEnum;
    ShadingModel: ShaderSemanticsEnum;
    SkinningMode: ShaderSemanticsEnum;
    GeneralTexture: ShaderSemanticsEnum;
    VertexAttributesExistenceArray: ShaderSemanticsEnum;
    BoneCompressedChank: ShaderSemanticsEnum;
    BoneCompressedInfo: ShaderSemanticsEnum;
    fromString: typeof fromString;
    PointSize: ShaderSemanticsEnum;
    ColorEnvTexture: ShaderSemanticsEnum;
    PointDistanceAttenuation: ShaderSemanticsEnum;
    HDRIFormat: ShaderSemanticsEnum;
    ScreenInfo: ShaderSemanticsEnum;
    DepthTexture: ShaderSemanticsEnum;
    LightViewProjectionMatrix: ShaderSemanticsEnum;
    Anisotropy: ShaderSemanticsEnum;
    ClearCoatParameter: ShaderSemanticsEnum;
    SheenParameter: ShaderSemanticsEnum;
    SpecularGlossinessFactor: ShaderSemanticsEnum;
    SpecularGlossinessTexture: ShaderSemanticsEnum;
}>;
export {};

import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { Count } from '../../../types/CommonTypes';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { Vrm0xMaterialProperty } from '../../../types';
import { Sampler } from '../../textures/Sampler';
export declare class MToonMaterialContent extends AbstractMaterialContent {
    static readonly _Cutoff: ShaderSemanticsClass;
    static readonly _Color: ShaderSemanticsClass;
    static readonly _ShadeColor: ShaderSemanticsClass;
    static readonly _MainTex: ShaderSemanticsClass;
    static readonly _ShadeTexture: ShaderSemanticsClass;
    static readonly _BumpScale: ShaderSemanticsClass;
    static readonly _BumpMap: ShaderSemanticsClass;
    static readonly _ReceiveShadowRate: ShaderSemanticsClass;
    static readonly _ReceiveShadowTexture: ShaderSemanticsClass;
    static readonly _ShadingGradeRate: ShaderSemanticsClass;
    static readonly _ShadingGradeTexture: ShaderSemanticsClass;
    static readonly _ShadeShift: ShaderSemanticsClass;
    static readonly _ShadeToony: ShaderSemanticsClass;
    static readonly _LightColorAttenuation: ShaderSemanticsClass;
    static readonly _AmbientColor: ShaderSemanticsClass;
    static readonly _RimTexture: ShaderSemanticsClass;
    static readonly _RimColor: ShaderSemanticsClass;
    static readonly _RimLightingMix: ShaderSemanticsClass;
    static readonly _RimFresnelPower: ShaderSemanticsClass;
    static readonly _RimLift: ShaderSemanticsClass;
    static readonly _SphereAdd: ShaderSemanticsClass;
    static readonly _EmissionColor: ShaderSemanticsClass;
    static readonly _EmissionMap: ShaderSemanticsClass;
    static readonly _OutlineWidthTexture: ShaderSemanticsClass;
    static readonly _OutlineWidth: ShaderSemanticsClass;
    static readonly _OutlineScaledMaxDistance: ShaderSemanticsClass;
    static readonly _OutlineColor: ShaderSemanticsClass;
    static readonly _OutlineLightingMix: ShaderSemanticsClass;
    static readonly Aspect: ShaderSemanticsClass;
    static readonly CameraUp: ShaderSemanticsClass;
    static usableBlendEquationModeAlpha?: number;
    private __OutlineWidthModeIsScreen;
    private __floatProperties;
    private __vectorProperties;
    private __textureProperties;
    constructor(isOutline: boolean, materialProperties: Vrm0xMaterialProperty | undefined, textures: any, samplers: Sampler[], isMorphing: boolean, isSkinning: boolean, isLighting: boolean, useTangentAttribute: boolean, debugMode: Count | undefined, makeOutputSrgb: boolean);
    private __setTextures;
    setMaterialParameters(material: Material, isOutline: boolean): void;
    private static __initializeUsableBlendEquationModeAlpha;
    _setCustomSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
    static unityBlendEnumCorrespondence(enumNumber: number): number;
}

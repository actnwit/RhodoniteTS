import { type Vrm0xMaterialProperty } from '../../../types';
import type { Count } from '../../../types/CommonTypes';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { Engine } from '../../system/Engine';
import { Sampler } from '../../textures/Sampler';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
/**
 * Material content implementation for MToon 0.x shader.
 * This class handles the creation and configuration of MToon materials,
 * which are commonly used for toon-style rendering in VRM models.
 */
export declare class MToon0xMaterialContent extends AbstractMaterialContent {
    private __diffuseIblCubeMapSampler;
    private __specularIblCubeMapSampler;
    static readonly _Cutoff: ShaderSemanticsClass;
    static readonly _Color: ShaderSemanticsClass;
    static readonly _ShadeColor: ShaderSemanticsClass;
    static readonly _litColorTexture: ShaderSemanticsClass;
    static readonly _shadeColorTexture: ShaderSemanticsClass;
    static readonly _BumpScale: ShaderSemanticsClass;
    static readonly _normalTexture: ShaderSemanticsClass;
    static readonly _ReceiveShadowRate: ShaderSemanticsClass;
    static readonly _receiveShadowTexture: ShaderSemanticsClass;
    static readonly _ShadingGradeRate: ShaderSemanticsClass;
    static readonly _shadingGradeTexture: ShaderSemanticsClass;
    static readonly _ShadeShift: ShaderSemanticsClass;
    static readonly _ShadeToony: ShaderSemanticsClass;
    static readonly _LightColorAttenuation: ShaderSemanticsClass;
    static readonly _AmbientColor: ShaderSemanticsClass;
    static readonly _IndirectLightIntensity: ShaderSemanticsClass;
    static readonly _rimTexture: ShaderSemanticsClass;
    static readonly _RimColor: ShaderSemanticsClass;
    static readonly _RimLightingMix: ShaderSemanticsClass;
    static readonly _RimFresnelPower: ShaderSemanticsClass;
    static readonly _RimLift: ShaderSemanticsClass;
    static readonly _matCapTexture: ShaderSemanticsClass;
    static readonly _EmissionColor: ShaderSemanticsClass;
    static readonly _emissionTexture: ShaderSemanticsClass;
    static readonly _OutlineWidthTexture: ShaderSemanticsClass;
    static readonly _OutlineWidth: ShaderSemanticsClass;
    static readonly _OutlineScaledMaxDistance: ShaderSemanticsClass;
    static readonly _OutlineColor: ShaderSemanticsClass;
    static readonly _OutlineLightingMix: ShaderSemanticsClass;
    static readonly Aspect: ShaderSemanticsClass;
    static readonly CameraUp: ShaderSemanticsClass;
    private __OutlineWidthModeIsScreen;
    private __floatProperties;
    private __vectorProperties;
    private __textureProperties;
    /**
     * Creates a new MToon 0.x material content instance.
     *
     * @param engine - The engine instance
     * @param isOutline - Whether this material is for outline rendering
     * @param materialProperties - VRM material properties from the glTF file
     * @param textures - Array of textures used by the material
     * @param samplers - Array of samplers for texture sampling configuration
     * @param isMorphing - Whether morphing (blend shapes) is enabled
     * @param isSkinning - Whether skeletal animation is enabled
     * @param isLighting - Whether lighting calculations are enabled
     * @param useTangentAttribute - Whether to use tangent attributes for normal mapping
     * @param debugMode - Debug visualization mode (optional)
     * @param makeOutputSrgb - Whether to convert output to sRGB color space
     * @param materialName - Name identifier for the material
     * @param definitions - Additional shader preprocessor definitions
     */
    constructor(engine: Engine, isOutline: boolean, materialProperties: Vrm0xMaterialProperty | undefined, textures: any, samplers: Sampler[], isMorphing: boolean, isSkinning: boolean, isLighting: boolean, useTangentAttribute: boolean, debugMode: Count | undefined, makeOutputSrgb: boolean, materialName: string, definitions: string[]);
    /**
     * Sets up dummy textures and their associated shader semantics information.
     * This method configures default texture bindings for various MToon texture slots
     * and adds corresponding shader semantics entries.
     *
     * @param textures - Array of available textures
     * @param samplers - Array of texture samplers
     * @param shaderSemanticsInfoArray - Array to populate with shader semantics information
     * @param isOutline - Whether outline textures should be included
     * @private
     */
    private __setDummyTextures;
    /**
     * Configures material parameters based on MToon properties.
     * This method sets up blending modes, culling, and other rendering states
     * based on the material's MToon properties.
     *
     * @param material - The material instance to configure
     * @param isOutline - Whether this is an outline material
     */
    setMaterialParameters(engine: Engine, material: Material, isOutline: boolean): void;
    /**
     * Gets the usable blend equation mode for alpha blending.
     * This method determines the appropriate blend equation mode based on
     * the current rendering API and available extensions.
     *
     * @param engine - The engine instance
     * @returns The blend equation mode for alpha channel
     * @private
     */
    private static __getUsableBlendEquationModeAlpha;
    /**
     * Sets internal shader parameters for WebGPU rendering.
     * This method configures camera-related and IBL (Image-Based Lighting) parameters
     * that are managed internally by the material system.
     *
     * @param params - Object containing material and rendering arguments
     * @param params.material - The material instance to configure
     * @param params.args - WebGPU rendering arguments
     */
    _setInternalSettingParametersToGpuWebGpu({ engine, material, args, }: {
        engine: Engine;
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    /**
     * Sets shader-specific internal parameters for WebGL rendering.
     * This method is called once per shader program and sets up
     * IBL environment textures and other program-level uniforms.
     *
     * @param params - Object containing rendering parameters
     * @param params.shaderProgram - The WebGL shader program
     * @param params.args - WebGL rendering arguments
     */
    _setInternalSettingParametersToGpuWebGLPerShaderProgram({ engine, material, shaderProgram, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets material-specific internal parameters for WebGL rendering.
     * This method is called per material and configures matrices, lighting,
     * morphing, skinning, and other per-material uniforms.
     *
     * @param params - Object containing rendering parameters
     * @param params.engine - The engine instance
     * @param params.material - The material instance
     * @param params.shaderProgram - The WebGL shader program
     * @param params.firstTime - Whether this is the first time setup
     * @param params.args - WebGL rendering arguments
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, firstTime, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Converts Unity blend mode enum values to corresponding WebGL blend constants.
     * This method maps Unity's blend mode enumeration to the appropriate
     * WebGL blend function constants for proper alpha blending.
     *
     * @param enumNumber - Unity blend mode enum value
     * @returns Corresponding WebGL blend constant
     */
    static unityBlendEnumCorrespondence(enumNumber: number): number;
    /**
     * Sets up HDRI (High Dynamic Range Imaging) parameters for IBL.
     * This method extracts and prepares HDRI-related parameters from the
     * rendering arguments for use in image-based lighting calculations.
     *
     * @param args - WebGL or WebGPU rendering arguments
     * @returns Object containing HDRI parameters
     * @private
     */
    private static __setupHdriParameters;
}

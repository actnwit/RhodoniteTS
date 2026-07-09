import type { Count } from '../../../types/CommonTypes';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsClass, type ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
/**
 * Material content class for decoding shadow maps using the classic shadow mapping technique.
 * This class handles the rendering of shadow maps with proper depth comparison and shadow factor calculations.
 * It supports morphing, skinning, lighting, and debugging modes for comprehensive shadow rendering functionality.
 */
export declare class ShadowMapDecodeClassicMaterialContent extends AbstractMaterialContent {
    /** Shader semantic for controlling the color factor applied to shadowed areas */
    static ShadowColorFactor: ShaderSemanticsEnum;
    /** Shader semantic for controlling the alpha value in shadowed regions */
    static ShadowAlpha: ShaderSemanticsEnum;
    /** Shader semantic for controlling the alpha value in non-shadowed regions */
    static NonShadowAlpha: ShaderSemanticsEnum;
    /** Shader semantic for defining the allowable depth error tolerance in shadow calculations */
    static AllowableDepthError: ShaderSemanticsEnum;
    /** Shader semantic for the near clipping plane distance of the inner camera */
    static zNearInner: ShaderSemanticsClass;
    /** Shader semantic for the far clipping plane distance of the inner camera */
    static zFarInner: ShaderSemanticsClass;
    /** Shader semantic for the debug color factor used in debugging mode */
    static DebugColorFactor: ShaderSemanticsEnum;
    /** Shader semantic for the depth texture containing encoded depth information */
    static DepthTexture: ShaderSemanticsEnum;
    /** Shader semantic indicating whether the light source is a point light */
    static IsPointLight: ShaderSemanticsClass;
    /** Cached value of the last used near clipping plane distance for optimization */
    private static __lastZNear;
    /** Cached value of the last used far clipping plane distance for optimization */
    private static __lastZFar;
    /** The render pass that contains the encoded depth information for shadow mapping */
    private __encodedDepthRenderPass;
    /**
     * Creates a new instance of ShadowMapDecodeClassicMaterialContent.
     * This constructor initializes the shadow mapping material with comprehensive configuration options
     * for various rendering features and sets up the necessary shader semantics for shadow decoding.
     *
     * @param engine - The engine instance
     * @param materialName - The unique name identifier for this material
     * @param options - Configuration object containing rendering feature flags and settings
     * @param options.isMorphing - Enables morphing/blend shape animation support
     * @param options.isSkinning - Enables skeletal animation support
     * @param options.isLighting - Enables lighting calculations (when false, shows original colors except in shadows)
     * @param options.isDebugging - Enables debug visualization showing areas outside depth map coverage
     * @param options.colorAttachmentsNumber - Index of the color attachment containing encoded depth data
     * @param encodedDepthRenderPass - The render pass containing depth information from DepthEncodeMaterialContent
     */
    constructor(engine: Engine, materialName: string, { isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber, }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        isDebugging: boolean;
        colorAttachmentsNumber: Count;
    }, encodedDepthRenderPass: RenderPass);
    /**
     * Sets internal shader parameters specific to this material on a per-material basis.
     * This method handles the configuration of shadow mapping parameters, camera settings,
     * and various rendering components such as skinning, lighting, and morphing.
     * It optimizes performance by caching frequently used values and only updating them when necessary.
     *
     * @param params - Configuration object containing all necessary rendering parameters
     * @param params.material - The material instance being configured
     * @param params.shaderProgram - The WebGL shader program to configure
     * @param params.firstTime - Whether this is the first time setting parameters for this material
     * @param params.args - WebGL-specific rendering arguments containing render state and components
     *
     * @internal This method is called internally during the rendering pipeline
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
}

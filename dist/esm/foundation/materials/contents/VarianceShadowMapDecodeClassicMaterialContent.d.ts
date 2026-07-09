import type { Count } from '../../../types/CommonTypes';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ShaderSemanticsClass, type ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
export declare class VarianceShadowMapDecodeClassicMaterialContent extends AbstractMaterialContent {
    static IsPointLight: ShaderSemanticsClass;
    static DepthTexture: ShaderSemanticsClass;
    static SquareDepthTexture: ShaderSemanticsClass;
    static DepthAdjustment: ShaderSemanticsClass;
    static TextureDepthAdjustment: ShaderSemanticsClass;
    static MinimumVariance: ShaderSemanticsClass;
    static LightBleedingParameter: ShaderSemanticsClass;
    static ShadowColor: ShaderSemanticsClass;
    static AllowableDepthError: ShaderSemanticsClass;
    static zNearInner: ShaderSemanticsClass;
    static zFarInner: ShaderSemanticsClass;
    static DebugColorFactor: ShaderSemanticsEnum;
    private static __lastZNear;
    private static __lastZFar;
    private __depthCameraComponent?;
    /**
     * Creates a new instance of VarianceShadowMapDecodeClassicMaterialContent for variance shadow mapping.
     * This material content handles the decoding and rendering of variance shadow maps, which provide
     * soft shadows with reduced aliasing compared to traditional shadow mapping techniques.
     *
     * @param engine - The engine instance
     * @param materialName - The name identifier for this material
     * @param options - Configuration options for the material
     * @param options.isMorphing - Whether to enable morphing/blend shape support
     * @param options.isSkinning - Whether to enable skeletal animation support
     * @param options.isLighting - Whether to apply lighting calculations. When false, renders original material color except in shadow areas
     * @param options.isDebugging - Whether to enable debug visualization showing areas outside depth map in debug color
     * @param options.colorAttachmentsNumberDepth - Index of the color attachment containing depth information from DepthEncodeMaterialContent
     * @param options.colorAttachmentsNumberSquareDepth - Index of the color attachment containing squared depth information
     * @param options.depthCameraComponent - Optional camera component used for depth rendering. If not provided, uses the current render pass camera
     * @param encodedDepthRenderPasses - Array of exactly 2 render passes containing the encoded depth information (depth and squared depth)
     * @throws Will log an error if encodedDepthRenderPasses length is not exactly 2
     * @throws Will log a warning if depthCameraComponent is not provided
     */
    constructor(engine: Engine, materialName: string, { isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumberDepth, colorAttachmentsNumberSquareDepth, depthCameraComponent, }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        isDebugging: boolean;
        colorAttachmentsNumberDepth: Count;
        colorAttachmentsNumberSquareDepth: Count;
        depthCameraComponent?: CameraComponent;
    }, encodedDepthRenderPasses: RenderPass[]);
    /**
     * Sets internal rendering parameters for the material on a per-material basis.
     * This method configures shader uniforms and parameters specific to variance shadow mapping,
     * including camera matrices, depth information, and various rendering features like skinning and morphing.
     *
     * @param params - The rendering parameters object
     * @param params.material - The material instance being rendered
     * @param params.shaderProgram - The WebGL shader program to configure
     * @param params.args - WebGL-specific rendering arguments containing entity, camera, and rendering context
     *
     * @remarks
     * This method handles:
     * - Setting world, view, and projection matrices
     * - Configuring depth camera parameters (zNear, zFar, view-projection matrix)
     * - Setting up skeletal animation if present
     * - Configuring lighting information
     * - Setting up morph target data if morphing is enabled
     *
     * The method optimizes performance by caching zNear and zFar values to avoid unnecessary uniform updates.
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets the depth camera component used for shadow map generation.
     * This camera defines the light's perspective for shadow mapping calculations.
     *
     * @param depthCameraComponent - The camera component representing the light's view for shadow mapping
     *
     * @remarks
     * The depth camera component should be positioned and oriented to match the light source
     * that will cast shadows. Its view-projection matrix will be used to transform vertices
     * into light space for shadow map lookup operations.
     */
    set depthCameraComponent(depthCameraComponent: CameraComponent);
}

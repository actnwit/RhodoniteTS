import type { Vrm1_Material } from '../../../types/VRMC_materials_mtoon';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
/**
 * Material content implementation for MToon 1.0 specification.
 * MToon is a toon shading material specification designed primarily for VRM avatars.
 * This class handles shader compilation, parameter setup, and rendering for MToon materials.
 */
export declare class MToon1MaterialContent extends AbstractMaterialContent {
    private __diffuseIblCubeMapSampler;
    private __specularIblCubeMapSampler;
    /**
     * Constructs a new MToon1MaterialContent instance with specified rendering features.
     *
     * @param engine - The engine instance
     * @param materialName - The name identifier for this material
     * @param isMorphing - Whether this material supports vertex morphing/blend shapes
     * @param isSkinning - Whether this material supports skeletal animation
     * @param isLighting - Whether this material uses lighting calculations
     * @param isOutline - Whether this material is used for outline rendering
     * @param definitions - Additional shader preprocessor definitions
     */
    constructor(engine: Engine, materialName: string, isMorphing: boolean, isSkinning: boolean, isLighting: boolean, isOutline: boolean, definitions: string[]);
    /**
     * Configures material parameters based on MToon material properties and rendering mode.
     * Sets up culling behavior, alpha testing, and other material-specific settings.
     *
     * @param material - The material instance to configure
     * @param isOutline - Whether this material is being used for outline rendering
     * @param materialJson - The MToon material specification from VRM
     */
    setMaterialParameters(material: Material, isOutline: boolean, materialJson: Vrm1_Material): void;
    /**
     * Sets internal parameters for WebGPU rendering pipeline.
     * Configures IBL (Image-Based Lighting) parameters, HDRI format settings,
     * and cube map contributions for physically-based lighting.
     *
     * @param params - Object containing material and rendering arguments
     * @param params.material - The material instance to update
     * @param params.args - WebGPU rendering arguments with entity and environment data
     */
    _setInternalSettingParametersToGpuWebGpu({ material, args }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    /**
     * Sets per-shader-program parameters for WebGL rendering.
     * Configures texture bindings for IBL environment maps, setting up diffuse
     * and specular cube maps with appropriate samplers.
     *
     * @param params - Object containing shader program and rendering context
     * @param params.shaderProgram - The compiled WebGL shader program
     * @param params.args - WebGL rendering arguments with cube map textures
     */
    _setInternalSettingParametersToGpuWebGLPerShaderProgram({ engine, material, shaderProgram, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets per-material parameters for WebGL rendering.
     * Configures transformation matrices, camera parameters, lighting information,
     * skeletal animation data, IBL parameters, and morphing data.
     *
     * @param params - Object containing material, shader program and rendering context
     * @param params.engine - The engine instance
     * @param params.material - The material instance being rendered
     * @param params.shaderProgram - The compiled WebGL shader program
     * @param params.firstTime - Whether this is the first time setting parameters for this material
     * @param params.args - WebGL rendering arguments with entity and environment data
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, firstTime, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets up HDRI (High Dynamic Range Imaging) parameters for both WebGL and WebGPU rendering.
     * Extracts mipmap levels, cube map contributions, and format information from the rendering context.
     *
     * @param args - Rendering arguments containing cube map textures and mesh renderer data
     * @returns Object containing processed HDRI parameters
     * @returns returns.mipmapLevelNumber - Number of mipmap levels in the specular cube map
     * @returns returns.meshRenderComponent - The mesh renderer component with cube map settings
     * @returns returns.diffuseHdriType - HDRI format index for diffuse cube map
     * @returns returns.specularHdriType - HDRI format index for specular cube map
     */
    private static __setupHdriParameters;
}

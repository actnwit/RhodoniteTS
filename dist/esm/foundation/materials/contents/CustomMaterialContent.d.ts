import type { ShaderityObject } from 'shaderity';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
/**
 * Custom material content class that extends AbstractMaterialContent to provide
 * custom shader handling and rendering capabilities with support for IBL (Image-Based Lighting),
 * morphing, skinning, and various shader semantics.
 */
export declare class CustomMaterialContent extends AbstractMaterialContent {
    private __diffuseIblCubeMapSampler;
    private __specularIblCubeMapSampler;
    /**
     * Creates a new CustomMaterialContent instance with custom shaders and configuration.
     *
     * @param params - Configuration object for the custom material
     * @param params.name - The name identifier for this material content
     * @param params.isMorphing - Whether this material supports vertex morphing/blending
     * @param params.isSkinning - Whether this material supports skeletal animation skinning
     * @param params.isLighting - Whether this material uses lighting calculations
     * @param params.vertexShader - Optional vertex shader object for WebGL rendering
     * @param params.pixelShader - Optional pixel/fragment shader object for WebGL rendering
     * @param params.additionalShaderSemanticInfo - Array of additional shader semantic information
     * @param params.vertexShaderWebGpu - Optional vertex shader object for WebGPU rendering
     * @param params.pixelShaderWebGpu - Optional pixel/fragment shader object for WebGPU rendering
     * @param params.definitions - Optional array of preprocessor definitions for shaders
     */
    constructor(engine: Engine, { name, isMorphing, isSkinning, isLighting, vertexShader, pixelShader, additionalShaderSemanticInfo, vertexShaderWebGpu, pixelShaderWebGpu, definitions, }: {
        name: string;
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        vertexShader?: ShaderityObject;
        pixelShader?: ShaderityObject;
        additionalShaderSemanticInfo: ShaderSemanticsInfo[];
        vertexShaderWebGpu?: ShaderityObject;
        pixelShaderWebGpu?: ShaderityObject;
        definitions?: string[];
    });
    /**
     * Sets internal material parameters for WebGPU rendering, including IBL parameters
     * and HDRI format information.
     *
     * @param params - Parameters object
     * @param params.material - The material instance to configure
     * @param params.args - WebGPU rendering arguments containing entity and rendering context
     */
    _setInternalSettingParametersToGpuWebGpu({ material, args }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    /**
     * Sets internal material parameters for WebGL rendering on a per-material basis.
     * Configures world/view/projection matrices, lighting, skinning, and IBL parameters.
     *
     * @param params - Parameters object
     * @param params.material - The material instance to configure
     * @param params.shaderProgram - The WebGL shader program to use
     * @param params.firstTime - Whether this is the first time setting up this material
     * @param params.args - WebGL rendering arguments containing matrices, entities, and rendering context
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, firstTime, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets internal parameters for WebGL rendering on a per-shader-program basis.
     * Primarily handles IBL environment texture setup including diffuse, specular, and sheen cube maps.
     *
     * @param params - Parameters object
     * @param params.material - The material instance to configure
     * @param params.shaderProgram - The WebGL shader program to use
     * @param params.firstTime - Whether this is the first time setting up this shader program
     * @param params.args - WebGL rendering arguments containing cube map textures and rendering context
     */
    _setInternalSettingParametersToGpuWebGLPerShaderProgram({ engine, material, shaderProgram, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets internal parameters for WebGL rendering on a per-primitive basis.
     * Handles morph target/blend shape information for vertex animation.
     *
     * @param params - Parameters object
     * @param params.shaderProgram - The WebGL shader program to use
     * @param params.args - WebGL rendering arguments containing entity, mesh, and primitive data
     */
    _setInternalSettingParametersToGpuWebGLPerPrimitive({ shaderProgram, args, }: {
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
    /**
     * Sets up HDRI (High Dynamic Range Imaging) parameters for IBL rendering.
     * Extracts mipmap levels, mesh render component, and HDRI format information
     * from the rendering arguments.
     *
     * @param args - Rendering arguments for either WebGL or WebGPU
     * @returns Object containing mipmap level number, mesh render component, and HDRI format indices
     * @private
     */
    private static __setupHdriParameters;
}

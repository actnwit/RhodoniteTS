import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { Engine } from '../../system/Engine';
import { AbstractTexture } from '../../textures/AbstractTexture';
import type { Sampler } from '../../textures/Sampler';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
/**
 * Material content implementation for MatCap (Material Capture) rendering.
 * MatCap is a technique that captures material appearance from a sphere under specific lighting conditions
 * and applies it to 3D objects for realistic material representation.
 */
export declare class MatCapMaterialContent extends AbstractMaterialContent {
    static MatCapTexture: ShaderSemanticsClass;
    /**
     * Creates a new MatCap material content instance.
     *
     * @param engine - The engine instance
     * @param materialName - The name identifier for this material
     * @param isSkinning - Whether this material supports skeletal animation/skinning
     * @param uri - Optional URI to load the MatCap texture from
     * @param texture - Optional pre-existing texture to use as the MatCap texture
     * @param sampler - Optional sampler settings for texture sampling behavior
     */
    constructor(engine: Engine, materialName: string, isSkinning: boolean, uri?: string, texture?: AbstractTexture, sampler?: Sampler);
    /**
     * Sets internal GPU parameters specific to MatCap material rendering for WebGL.
     * This method configures uniforms and matrices required for proper MatCap material rendering,
     * including world transformations, camera settings, and skeletal animation support.
     *
     * @param params - Configuration object containing rendering parameters
     * @param params.engine - The engine instance
     * @param params.shaderProgram - The WebGL shader program to configure
     * @param params.args - WebGL rendering arguments containing matrices, camera, and entity data
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, shaderProgram, args, }: {
        engine: Engine;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
}

import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
/**
 * Material content for furnace test rendering.
 * This material is used for testing PBR (Physically Based Rendering) materials
 * with controlled lighting conditions similar to a furnace test environment.
 */
export declare class FurnaceTestMaterialContent extends AbstractMaterialContent {
    static mode: ShaderSemanticsClass;
    static debugView: ShaderSemanticsClass;
    static g_type: ShaderSemanticsClass;
    static disable_fresnel: ShaderSemanticsClass;
    static f0: ShaderSemanticsClass;
    /**
     * Creates a new FurnaceTestMaterialContent instance.
     *
     * @param engine - The engine instance
     * @param materialName - The name identifier for this material
     */
    constructor(engine: Engine, materialName: string);
    /**
     * Sets internal rendering parameters to GPU for WebGL per material.
     * This method configures shader uniforms including matrices, camera information,
     * and lighting data required for furnace test rendering.
     *
     * @param params - The rendering parameters object
     * @param params.engine - The engine instance
     * @param params.material - The material instance being rendered
     * @param params.shaderProgram - The WebGL shader program to configure
     * @param params.firstTime - Whether this is the first time setting up this shader program
     * @param params.args - WebGL rendering arguments containing matrices, camera, and lighting data
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, firstTime, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

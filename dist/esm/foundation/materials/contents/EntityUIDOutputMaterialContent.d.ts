import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
/**
 * Material content class for rendering entity UID output.
 * This material is used to output unique identifiers for entities,
 * typically for picking or selection purposes.
 */
export declare class EntityUIDOutputMaterialContent extends AbstractMaterialContent {
    /**
     * Creates a new EntityUIDOutputMaterialContent instance.
     *
     * @param engine - The engine instance
     * @param materialName - The name of the material
     */
    constructor(engine: Engine, materialName: string);
    /**
     * Sets internal parameters to GPU for WebGL rendering per material.
     * This method configures uniform variables and matrices required for entity UID output rendering.
     *
     * @param params - The rendering parameters
     * @param params.material - The material instance
     * @param params.shaderProgram - The WebGL shader program
     * @param params.args - WebGL rendering arguments containing matrices, camera, and entity information
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
}

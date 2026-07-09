import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';
/**
 * Material content for depth encoding functionality.
 * This class handles encoding depth information into textures for shadow mapping and depth-based effects.
 */
export declare class DepthEncodeMaterialContent extends AbstractMaterialContent {
    /** Shader semantic for the inner z-near clipping plane value */
    static zNearInner: ShaderSemanticsClass;
    /** Shader semantic for the inner z-far clipping plane value */
    static zFarInner: ShaderSemanticsClass;
    /** Shader semantic to indicate if the light source is a point light */
    static isPointLight: ShaderSemanticsClass;
    /** Shader semantic for the depth power factor used in depth encoding */
    static depthPow: ShaderSemanticsClass;
    /** Cached value of the last z-near plane to avoid unnecessary uniform updates */
    private __lastZNear;
    /** Cached value of the last z-far plane to avoid unnecessary uniform updates */
    private __lastZFar;
    /**
     * Creates a new DepthEncodeMaterialContent instance.
     *
     * @param engine - The engine instance
     * @param materialName - The name identifier for this material
     * @param depthPow - The power factor for depth encoding (1.0-2.0 range)
     * @param options - Configuration options for the material
     * @param options.isSkinning - Whether skeletal animation skinning is enabled
     */
    constructor(engine: Engine, materialName: string, depthPow: number, { isSkinning }: {
        isSkinning: boolean;
    });
    /**
     * Sets internal shader parameters specific to depth encoding for WebGL rendering.
     * This method configures camera-related parameters and handles uniform updates
     * for the depth encoding shader.
     *
     * @param params - Parameters for setting internal WebGL settings
     * @param params.material - The material instance being configured
     * @param params.shaderProgram - The WebGL shader program to configure
     * @param params.firstTime - Whether this is the first time setting parameters
     * @param params.args - WebGL rendering arguments containing camera and entity data
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, material, shaderProgram, firstTime, args, }: {
        engine: Engine;
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

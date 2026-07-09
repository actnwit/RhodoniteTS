import type { Count } from '../../../types/CommonTypes';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import { AbstractTexture } from '../../textures/AbstractTexture';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
/**
 * Material content for color grading using Look-Up Tables (LUTs).
 * This material applies color correction and grading effects to rendered images
 * using a pre-computed lookup table texture.
 */
export declare class ColorGradingUsingLUTsMaterialContent extends AbstractMaterialContent {
    /**
     * Shader semantic for the lookup table texture.
     * This defines the binding point for the LUT texture in the shader.
     */
    static lookupTableTexture: ShaderSemanticsClass;
    /**
     * Creates a new ColorGradingUsingLUTsMaterialContent instance.
     *
     * @param materialName - The name identifier for this material
     * @param targetRenderPass - The render pass to read the source texture from
     * @param colorAttachmentsNumber - The index of the color attachment to use as source
     * @param uri - Optional URL to load the LUT texture from
     * @param texture - Optional pre-existing texture to use as LUT
     *
     * @remarks
     * Either `uri` or `texture` should be provided to specify the lookup table.
     * If neither is provided, a dummy black texture will be used and a warning logged.
     */
    constructor(engine: Engine, materialName: string, targetRenderPass: RenderPass, colorAttachmentsNumber: Count, uri?: string, texture?: AbstractTexture);
    /**
     * Sets internal GPU parameters for WebGL rendering per material.
     * This method configures world matrices, view information, and projection matrices
     * required for the color grading shader to render correctly.
     *
     * @param params - The rendering parameters object
     * @param params.material - The material instance being rendered
     * @param params.shaderProgram - The WebGL shader program to configure
     * @param params.firstTime - Whether this is the first time setting up this material
     * @param params.args - WebGL rendering arguments containing matrices and render state
     *
     * @internal
     * This method is called internally during the rendering pipeline.
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial({ engine, shaderProgram, args, }: {
        engine: Engine;
        shaderProgram: WebGLProgram;
        args: RenderingArgWebGL;
    }): void;
}

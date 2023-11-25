import { ShaderSemanticsEnum, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderPass } from '../../renderer/RenderPass';
import { Count } from '../../../types/CommonTypes';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
export declare class ShadowMapDecodeClassicMaterialContent extends AbstractMaterialContent {
    static ShadowColorFactor: ShaderSemanticsEnum;
    static ShadowAlpha: ShaderSemanticsEnum;
    static NonShadowAlpha: ShaderSemanticsEnum;
    static AllowableDepthError: ShaderSemanticsEnum;
    static zNearInner: ShaderSemanticsClass;
    static zFarInner: ShaderSemanticsClass;
    static DebugColorFactor: ShaderSemanticsEnum;
    static DepthTexture: ShaderSemanticsEnum;
    static IsPointLight: ShaderSemanticsClass;
    private static __lastZNear;
    private static __lastZFar;
    private __encodedDepthRenderPass;
    /**
     * The constructor of the ShadowMapDecodeClassicMaterialContent
     * @param isMorphing True if the morphing is to be applied
     * @param isSkinning True if the skeleton is to be applied
     * @param isLighting True if the lighting is to be applied. When isLighting is false, the Shader draws the original color of the material, except for the shadow area.
     * @param isDebugging True if the shader displays the DebugColorFactor color in areas outside of the depth map.
     * @param colorAttachmentsNumber The index of colorAttachment in a framebuffer. The colorAttachment must have depth information drawn by the DepthEncodeMaterialContent.
     * @param encodedDepthRenderPass The render pass where the depth information from the DepthEncodeMaterialContent is drawn to the frame buffer
     */
    constructor({ isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber, }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        isDebugging: boolean;
        colorAttachmentsNumber: Count;
    }, encodedDepthRenderPass: RenderPass);
    _setCustomSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
}

import { ShaderSemanticsEnum, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Material } from '../core/Material';
import { RenderPass } from '../../renderer/RenderPass';
import { Count } from '../../../types/CommonTypes';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
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
     * The constructor of the VarianceShadowMapDecodeClassicMaterialContent
     * @param isMorphing True if the morphing is to be applied
     * @param isSkinning True if the skeleton is to be applied
     * @param isLighting True if the lighting is to be applied. When isLighting is false, the Shader draws the original color of the material, except for the shadow area.
     * @param isDebugging True if the shader displays the DebugColorFactor color in areas outside of the depth map.
     *
     *
     *
     *
     * @param colorAttachmentsNumber The index of colorAttachment in a framebuffer. The colorAttachment must have depth information drawn by the DepthEncodeMaterialContent.
     * @param encodedDepthRenderPass The render pass where the depth information from the DepthEncodeMaterialContent is drawn to the frame buffer
     */
    constructor({ isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumberDepth, colorAttachmentsNumberSquareDepth, depthCameraComponent, }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        isDebugging: boolean;
        colorAttachmentsNumberDepth: Count;
        colorAttachmentsNumberSquareDepth: Count;
        depthCameraComponent?: CameraComponent;
    }, encodedDepthRenderPasses: RenderPass[]);
    setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
    set depthCameraComponent(depthCameraComponent: CameraComponent);
}

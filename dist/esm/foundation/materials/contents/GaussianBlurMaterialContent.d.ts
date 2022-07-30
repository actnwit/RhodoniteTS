import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
export declare class GaussianBlurMaterialContent extends AbstractMaterialContent {
    static GaussianKernelSize: ShaderSemanticsClass;
    static GaussianRatio: ShaderSemanticsClass;
    static IsHorizontal: ShaderSemanticsClass;
    private frameBufferWidth;
    /**
     * GaussianBlurNode applies a Gaussian blur to a input texture. The blur is
     * applied only in the vertical or horizontal direction. The direction can
     * be changed by setting IsHorizontal in material.setParameter.
     * To use this node, you need to set GaussianKernelSize and GaussianRatio
     * to the appropriate values using the material.setParameter method and to
     * set BaseColorTexture to the target texture using the
     * material.setTextureParameter method. The GaussianKernelSize must be
     * between 1 and 30. The GaussianRatio can be computed using the
     * MathUtil.computeGaussianDistributionRatioWhoseSumIsOne method.
     */
    constructor();
    setCustomSettingParametersToGpu({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArg;
    }): void;
}

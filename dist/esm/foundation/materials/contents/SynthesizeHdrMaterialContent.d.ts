import { AbstractTexture } from '../../textures/AbstractTexture';
import { ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
export declare class SynthesizeHdrMaterialContent extends AbstractMaterialContent {
    static SynthesizeCoefficient: ShaderSemanticsClass;
    static TargetRegionTexture: ShaderSemanticsClass;
    static SynthesizeTexture0: ShaderSemanticsClass;
    static SynthesizeTexture1: ShaderSemanticsClass;
    static SynthesizeTexture2: ShaderSemanticsClass;
    static SynthesizeTexture3: ShaderSemanticsClass;
    static SynthesizeTexture4: ShaderSemanticsClass;
    static SynthesizeTexture5: ShaderSemanticsClass;
    private existTargetRegion;
    private textureNumber;
    /**
     * This material node uses for the glare effect and so on.
     *
     * If the targetRegionTexture is not specified, the shader synthesizes all the
     * synthesizeTextures with all the pixels weighted by the synthesizeCoefficient.
     *
     * If the targetRegionTexture is specified, the shader synthesizes all the
     * synthesizeTextures with weights only for the non-white pixels of
     * targetRegionTexture (where the color is not (1.0, 1.0, 1.0, 1.0)). On the other
     * hand, in the white area, the output value is the product of the value of each
     * pixel in synthesizeTextures[0] and synthesizeCoefficient[0].
     *
     * @synthesizeTextures Textures to be synthesized. The shader supports up to six texture syntheses.
     * @targetRegionTexture Texture to specify the area where the texture will be synthesized
     */
    constructor(synthesizeTextures: AbstractTexture[], targetRegionTexture?: AbstractTexture);
    _setInternalSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    get existTargetRegionTexture(): boolean;
    get synthesizeTextureNumber(): number;
}

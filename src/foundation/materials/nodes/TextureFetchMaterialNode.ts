import {ShaderSemanticsClass} from '../../definitions/ShaderSemantics';
import {AbstractMaterialContent} from '../core/AbstractMaterialContent';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import {TextureFetchShader} from '../../../webgl/shaders/nodes/TextureFetchShader';
import {ShaderType} from '../../definitions/ShaderType';
import {ShaderSemanticsInfo} from '../../definitions/ShaderSemanticsInfo';

export class TextureFetchMaterialNode extends AbstractMaterialContent {
  generalTextureMaterialNodeUID?: ShaderSemanticsClass;

  constructor() {
    super(new TextureFetchShader(), 'textureFetch');

    this.generalTextureMaterialNodeUID = new ShaderSemanticsClass({
      str: `generalTexture_${this.materialNodeUid}`,
    });

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: this.generalTextureMaterialNodeUID,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        soloDatum: false,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    // Input
    this.__vertexInputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'texcoord',
    });

    // Output
    this.__vertexOutputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outColor',
    });
  }
}

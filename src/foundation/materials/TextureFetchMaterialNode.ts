import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import WireframeShader from "../../webgl/shaders/WireframeShader";
import Vector3 from "../math/Vector3";
import TextureFetchShader from "../../webgl/shaders/TextureFetchShader";
import { ShaderType } from "../definitions/ShaderType";

export default class TextureFetchMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(new TextureFetchShader(), 'textureFetch');
    (this.shader as TextureFetchShader).materialNodeUid = this.materialNodeUid;

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.GeneralTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isPlural: false,
        isSystem: false,
        semanticStr: `generalTexture_${this.materialNodeUid}`
      },
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    // Input
    this.__vertexInputs.push(
    {
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'texcoord',
      isImmediateValue: false
    });

    // Output
    this.__vertexOutputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outColor',
      isImmediateValue: false
    });
  }
}

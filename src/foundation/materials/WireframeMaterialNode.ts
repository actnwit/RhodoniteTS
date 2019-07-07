import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import WireframeShader from "../../webgl/shaders/WireframeShader";
import Vector3 from "../math/Vector3";
import { ShaderType } from "../definitions/ShaderType";

export default class WireframeMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(WireframeShader.getInstance(), 'wireframe');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {semantic: ShaderSemantics.Wireframe, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, min:0, max:10, isPlural: false, isSystem: false, initialValue: new Vector3(0, 0, 1)},
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    // Input
    this.__vertexInputs.push(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'existingFragColor',
      isImmediateValue: false
    });

    this.__vertexInputs.push(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'wireframeColor',
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

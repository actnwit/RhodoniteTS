import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import ClassicShadingShader from "../../webgl/shaders/ClassicShadingShader";
import { ShadingModel } from "../definitions/ShadingModel";
import { ShaderType } from "../definitions/ShaderType";

export default class ClassicShadingMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(ClassicShadingShader.getInstance(), 'classicShading');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.Shininess,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_VALUE,
       
        isSystem: false,
        initialValue: 5
      },
      {
        semantic: ShaderSemantics.ShadingModel,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 3,
       
        isSystem: false,
        initialValue: ShadingModel.Constant.index
      }
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    // Input
    this.__vertexInputs.push(
    {
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'diffuseColor',
      isImmediateValue: false
    });

    this.__vertexInputs.push(
    {
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'position_inWorld',
      isImmediateValue: false
    });
    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        name: 'normal_inWorld',
        isImmediateValue: false
      });

    // Output
    this.__vertexOutputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'outColor',
      isImmediateValue: false
    });
  }
}

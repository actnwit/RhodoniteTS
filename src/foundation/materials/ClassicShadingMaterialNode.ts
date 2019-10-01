import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import ClassicShadingShader from "../../webgl/shaders/ClassicShadingShader";
import { ShaderType } from "../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import { ShaderSemanticsInfo, ShaderSemantics } from "../definitions/ShaderSemantics";
import { ShadingModel } from "../definitions/ShadingModel";
import Scalar from "../math/Scalar";

export default class ClassicShadingMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(ClassicShadingShader.getInstance(), 'classicShading');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.ShadingModel, componentType: ComponentType.Int, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(ShadingModel.Constant.index), min: 0, max: 3,
      },
      {
        semantic: ShaderSemantics.Shininess, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(5), min: 0, max: Number.MAX_VALUE,
      },
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

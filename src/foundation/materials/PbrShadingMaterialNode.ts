import RnObject from "../core/Object";
import { ShaderSemanticsInfo, ShaderSemantics } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import MutableColorRgb from "../math/MutableColorRgb";
import Vector2 from "../math/Vector2";

export default class PbrShadingMaterialNode extends AbstractMaterialNode {

  constructor() {
    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {semantic: ShaderSemantics.WorldMatrix, isPlural: false, isSystem: true},
      {semantic: ShaderSemantics.ViewMatrix, isPlural: false, isSystem: true},
      {semantic: ShaderSemantics.ProjectionMatrix, isPlural: false, isSystem: true},
      {semantic: ShaderSemantics.NormalMatrix, isPlural: false, isSystem: true},
      {semantic: ShaderSemantics.BoneMatrix, isPlural: true, isSystem: true},
      {semantic: ShaderSemantics.LightNumber, isPlural: false, isSystem: true},
      {semantic: ShaderSemantics.ViewPosition, isPlural: false, isSystem: true},
      {semantic: ShaderSemantics.BaseColorFactor, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new MutableColorRgb(1, 1, 1)},
      {semantic: ShaderSemantics.OcclusionTexture, isPlural: false, prefix: 'material.', isSystem: false},
      {semantic: ShaderSemantics.EmissiveTexture, isPlural: false, prefix: 'material.', isSystem: false},
      {semantic: ShaderSemantics.BaseColorTexture, isPlural: false, prefix: 'material.', isSystem: false},
      {semantic: ShaderSemantics.NormalTexture, isPlural: false, prefix: 'material.', isSystem: false},
      {semantic: ShaderSemantics.MetallicRoughnessFactor, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(1, 1)},
      {semantic: ShaderSemantics.MetallicRoughnessTexture, isPlural: false, prefix: 'material.', isSystem: false},
      {semantic: ShaderSemantics.BrdfLutTexture, isPlural: false, isSystem: false},
      {semantic: ShaderSemantics.DiffuseEnvTexture, isPlural: false, isSystem: false},
      {semantic: ShaderSemantics.SpecularEnvTexture, isPlural: false, isSystem: false},
      {semantic: ShaderSemantics.IBLParameter, isPlural: false, isSystem: false},
      {semantic: ShaderSemantics.Wireframe, isPlural: false, isSystem: false},
    ];
    super(shaderSemanticsInfoArray);
  }
}

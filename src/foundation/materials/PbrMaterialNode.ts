import RnObject from "../core/Object";
import { ShaderSemanticsInfo, ShaderSemantics } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";

export default class PbrMaterialNode extends AbstractMaterialNode {

  constructor() {
    const shaderSemanticsInfoArray = [
      {semantic: ShaderSemantics.WorldMatrix, isPlural: false},
      {semantic: ShaderSemantics.BaseColorFactor, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.ViewMatrix, isPlural: false},
      {semantic: ShaderSemantics.ProjectionMatrix, isPlural: false},
      {semantic: ShaderSemantics.NormalMatrix, isPlural: false},
      {semantic: ShaderSemantics.OcclusionTexture, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.EmissiveTexture, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.BaseColorTexture, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.NormalTexture, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.BoneMatrix, isPlural: true},
      {semantic: ShaderSemantics.LightNumber, isPlural: false},
      {semantic: ShaderSemantics.MetallicRoughnessFactor, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.MetallicRoughnessTexture, isPlural: false, prefix: 'material.'},
      {semantic: ShaderSemantics.BrdfLutTexture, isPlural: false},
      {semantic: ShaderSemantics.DiffuseEnvTexture, isPlural: false},
      {semantic: ShaderSemantics.SpecularEnvTexture, isPlural: false},
      {semantic: ShaderSemantics.IBLParameter, isPlural: false},
      {semantic: ShaderSemantics.ViewPosition, isPlural: false},
      {semantic: ShaderSemantics.Wireframe, isPlural: false},
    ];
    super(shaderSemanticsInfoArray);
  }
}

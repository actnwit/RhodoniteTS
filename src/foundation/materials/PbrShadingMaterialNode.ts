import RnObject from "../core/Object";
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import MutableColorRgb from "../math/MutableColorRgb";
import Vector2 from "../math/Vector2";
import { ComponentType } from "../definitions/ComponentType";

export default class PbrShadingMaterialNode extends AbstractMaterialNode {

  constructor() {
    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      // {semantic: ShaderSemantics.WorldMatrix, isPlural: false, isSystem: true},
      // {semantic: ShaderSemantics.ViewMatrix, isPlural: false, isSystem: true},
      // {semantic: ShaderSemantics.ProjectionMatrix, isPlural: false, isSystem: true},
      // {semantic: ShaderSemantics.NormalMatrix, isPlural: false, isSystem: true},
      // {semantic: ShaderSemantics.BoneMatrix, isPlural: true, isSystem: true},
      // {semantic: ShaderSemantics.LightNumber, isPlural: false, isSystem: true},
      // {semantic: ShaderSemantics.ViewPosition, isPlural: false, isSystem: true},
      {semantic: ShaderSemantics.BaseColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new MutableColorRgb(1, 1, 1)},
      {semantic: ShaderSemantics.BaseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: 1},
      {semantic: ShaderSemantics.MetallicRoughnessFactor, compositionType: CompositionType.Vec2, componentType: ComponentType.Float, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(1, 1)},
      {semantic: ShaderSemantics.MetallicRoughnessTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: 2},
      {semantic: ShaderSemantics.NormalTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: 3},
      {semantic: ShaderSemantics.OcclusionTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: 4},
      {semantic: ShaderSemantics.EmissiveTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: 5},
      {semantic: ShaderSemantics.BrdfLutTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, isSystem: false, initialValue: 6},
      {semantic: ShaderSemantics.DiffuseEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int, isPlural: false, isSystem: false, initialValue: 7},
      {semantic: ShaderSemantics.SpecularEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int, isPlural: false, isSystem: false, initialValue: 8},
      {semantic: ShaderSemantics.IBLParameter, compositionType: CompositionType.Vec3, componentType: ComponentType.Float, isPlural: false, isSystem: false},
      {semantic: ShaderSemantics.Wireframe, compositionType: CompositionType.Vec3, componentType: ComponentType.Float, isPlural: false, isSystem: false},
    ];
    super(shaderSemanticsInfoArray);
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
    // if () {
      
    // }
  }
}

import RnObject from "../core/Object";
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import MutableColorRgb from "../math/MutableColorRgb";
import Vector2 from "../math/Vector2";
import { ComponentType } from "../definitions/ComponentType";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import ModuleManager from "../system/ModuleManager";
import { PixelFormat } from "../definitions/PixelFormat";
import { TextureParameter } from "../definitions/TextureParameter";
import Vector4 from "../math/Vector4";
import Vector3 from "../math/Vector3";
import ClassicShader from "../../webgl/ClassicShader";

export default class ClassicShadingMaterialNode extends AbstractMaterialNode {
  private static __dummyWhiteTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackCubeTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  static readonly shader: ClassicShader = ClassicShader.getInstance();

  constructor() {
    ClassicShadingMaterialNode.initDefaultTextures();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {semantic: ShaderSemantics.DiffuseColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector4(1, 1, 1, 1)},
      {semantic: ShaderSemantics.DiffuseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(0, ClassicShadingMaterialNode.__dummyWhiteTextureUid)},
      {semantic: ShaderSemantics.SpecularColorFactor, compositionType: CompositionType.Vec2, componentType: ComponentType.Float, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(1, 1)},
      {semantic: ShaderSemantics.SpecularColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(1, ClassicShadingMaterialNode.__dummyWhiteTextureUid)},
      {semantic: ShaderSemantics.NormalTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(2, ClassicShadingMaterialNode.__dummyWhiteTextureUid)},
      {semantic: ShaderSemantics.OcclusionTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(3, ClassicShadingMaterialNode.__dummyWhiteTextureUid)},
      {semantic: ShaderSemantics.EmissiveTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(4, ClassicShadingMaterialNode.__dummyBlackTextureUid)},
      {semantic: ShaderSemantics.Shininess, compositionType: CompositionType.Scalar, componentType: ComponentType.Float, isPlural: false, prefix: 'material.', isSystem: false, initialValue: 1},
      {semantic: ShaderSemantics.Wireframe, compositionType: CompositionType.Vec3, componentType: ComponentType.Float, isPlural: false, isSystem: false, initialValue: new Vector3(0, 0, 1)},
    ];
    super(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
    if (ClassicShadingMaterialNode.__dummyWhiteTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    ClassicShadingMaterialNode.__dummyWhiteTextureUid = webglResourceRepository.createDummyTexture();
    ClassicShadingMaterialNode.__dummyBlackTextureUid = webglResourceRepository.createDummyTexture("rgba(0, 0, 0, 1)");
    ClassicShadingMaterialNode.__dummyBlackCubeTextureUid = webglResourceRepository.createDummyCubeTexture();
  }
}

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

export default class PbrShadingMaterialNode extends AbstractMaterialNode {
  static __dummyWhiteTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  static __dummyBlackTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  static __dummyBlackCubeTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor() {
    PbrShadingMaterialNode.initDefaultTextures();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {semantic: ShaderSemantics.BaseColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector4(1, 1, 1, 1)},
      {semantic: ShaderSemantics.BaseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(1, PbrShadingMaterialNode.__dummyWhiteTextureUid)},
      {semantic: ShaderSemantics.MetallicRoughnessFactor, compositionType: CompositionType.Vec2, componentType: ComponentType.Float, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(1, 1)},
      {semantic: ShaderSemantics.MetallicRoughnessTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(2, PbrShadingMaterialNode.__dummyWhiteTextureUid)},
      {semantic: ShaderSemantics.NormalTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(3, PbrShadingMaterialNode.__dummyWhiteTextureUid)},
      {semantic: ShaderSemantics.OcclusionTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(4, PbrShadingMaterialNode.__dummyWhiteTextureUid)},
      {semantic: ShaderSemantics.EmissiveTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(5, PbrShadingMaterialNode.__dummyBlackTextureUid)},
      {semantic: ShaderSemantics.BrdfLutTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, isSystem: false, initialValue: new Vector2(6, PbrShadingMaterialNode.__pbrCookTorranceBrdfLutDataUrlUid)},
      // {semantic: ShaderSemantics.DiffuseEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int, isPlural: false, isSystem: false, initialValue: new Vector2(7, PbrShadingMaterialNode.dummyBlackCubeTextureUid)},
      // {semantic: ShaderSemantics.SpecularEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int, isPlural: false, isSystem: false, initialValue: new Vector2(8, PbrShadingMaterialNode.dummyBlackCubeTextureUid)},
      // {semantic: ShaderSemantics.IBLParameter, compositionType: CompositionType.Vec3, componentType: ComponentType.Float, isPlural: false, isSystem: false},
      {semantic: ShaderSemantics.Wireframe, compositionType: CompositionType.Vec3, componentType: ComponentType.Float, isPlural: false, isSystem: false},
    ];
    super(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
    if (PbrShadingMaterialNode.__dummyWhiteTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    PbrShadingMaterialNode.__dummyWhiteTextureUid = webglResourceRepository.createDummyTexture();
    PbrShadingMaterialNode.__dummyBlackTextureUid = webglResourceRepository.createDummyTexture("rgba(0, 0, 0, 1)");
    PbrShadingMaterialNode.__dummyBlackCubeTextureUid = webglResourceRepository.createDummyCubeTexture();

    const pbrCookTorranceBrdfLutDataUrl = ModuleManager.getInstance().getModule('pbr').pbrCookTorranceBrdfLutDataUrl;
    this.__pbrCookTorranceBrdfLutDataUrlUid = await webglResourceRepository.createTextureFromDataUri(pbrCookTorranceBrdfLutDataUrl,
      {
        level: 0, internalFormat: PixelFormat.RGBA,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false
        }
      );
  }
  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}

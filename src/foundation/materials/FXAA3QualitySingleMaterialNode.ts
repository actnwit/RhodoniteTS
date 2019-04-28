import RnObject from "../core/RnObject";
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsEnum
} from "../definitions/ShaderSemantics";
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
import ClassicShader from "../../webgl/shaders/ClassicShader";
import { ShadingModel } from "../definitions/ShadingModel";
import AbstractTexture from "../textures/AbstractTexture";
import FXAA3QualityShader from "../../webgl/shaders/FXAA3Quality";

export default class FXAA3QualitySingleMaterialNode extends AbstractMaterialNode {
  private static __dummyWhiteTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackCubeTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor() {
    super(FXAA3QualityShader.getInstance(), "FXAA3QualityShading");
    FXAA3QualitySingleMaterialNode.initDefaultTextures();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.BaseColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        isPlural: false,
        isSystem: false,
        initialValue: [
          0,
          FXAA3QualitySingleMaterialNode.__dummyWhiteTextureUid
        ]
      },
      {
        semantic: ShaderSemantics.ScreenInfo,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Float,
        isPlural: false,
        isSystem: false,
        initialValue: new Vector2(0, 0)
      },
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
    if (FXAA3QualitySingleMaterialNode.__dummyWhiteTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    FXAA3QualitySingleMaterialNode.__dummyWhiteTextureUid = webglResourceRepository.createDummyTexture();
  }
}

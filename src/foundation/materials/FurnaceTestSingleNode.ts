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
import FurnaceTestShader from "../../webgl/shaders/FurnaceTest";

export default class FurnaceTestSingleMaterialNode extends AbstractMaterialNode {
  private static __dummyWhiteTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackCubeTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor() {
    super(FurnaceTestShader.getInstance(), "FurnaceTestShading");
    FurnaceTestSingleMaterialNode.initDefaultTextures();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
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
    if (FurnaceTestSingleMaterialNode.__dummyWhiteTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    FurnaceTestSingleMaterialNode.__dummyWhiteTextureUid = webglResourceRepository.createDummyTexture();
  }
}

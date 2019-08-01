import RnObject from "../core/RnObject";
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsEnum
} from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import Vector2 from "../math/Vector2";
import { ComponentType } from "../definitions/ComponentType";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import Vector4 from "../math/Vector4";
import Vector3 from "../math/Vector3";
import { ShadingModel } from "../definitions/ShadingModel";
import ShadowMapping32bitClassicShader from "../../webgl/shaders/ShadowMapping32bitClassicShader";
import RenderPass from "../renderer/RenderPass";
import Matrix44 from "../math/Matrix44";
import { ShaderType } from "../definitions/ShaderType";
import { CGAPIResourceHandle } from "../../types/CommonTypes";

export default class ShadowMapUsingEncodedDepthSingleMaterialNode extends AbstractMaterialNode {

  constructor(renderPass: RenderPass) {
    super(ShadowMapping32bitClassicShader.getInstance(), "envConstantShading");
    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
       
        prefix: "material.",
        isSystem: false,
        initialValue: new Vector4(1, 1, 1, 1)
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
       
        isSystem: false,
        initialValue: [
          0,
          AbstractMaterialNode.__dummyWhiteTexture
        ]
      },
      {
        semantic: ShaderSemantics.SpecularColorFactor,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
       
        prefix: "material.",
        isSystem: false,
        initialValue: new Vector2(1, 1)
      },
      {
        semantic: ShaderSemantics.SpecularColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
       
        isSystem: false,
        initialValue: [
          1,
          AbstractMaterialNode.__dummyWhiteTexture
        ]
      },
      {
        semantic: ShaderSemantics.NormalTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
       
        isSystem: false,
        initialValue: [
          2,
          AbstractMaterialNode.__dummyBlueTexture
        ]
      },
      {
        semantic: ShaderSemantics.OcclusionTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
       
        isSystem: false,
        initialValue: [
          3,
          AbstractMaterialNode.__dummyWhiteTexture
        ]
      },
      {
        semantic: ShaderSemantics.EmissiveTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
       
        isSystem: false,
        initialValue: [
          4,
          AbstractMaterialNode.__dummyBlackTexture
        ]
      },
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
        semantic: ShaderSemantics.Wireframe,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 10,
       
        isSystem: false,
        initialValue: new Vector3(0, 0, 1)
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
      },
      {
        semantic: ShaderSemantics.PointSize,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 100,
       
        isSystem: false,
        initialValue: 30.0
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
       
        isSystem: false,
        initialValue: new Vector3(0.0, 0.1, 0.01)
      }];

    const cameraComponent = renderPass.cameraComponent;
    if (cameraComponent) {
      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.LightViewProjectionMatrix,
          compositionType: CompositionType.Mat4,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
         
          isSystem: true,
          initialValue: new Matrix44(null)
        }
      );
    }


    const framebuffer = renderPass.getFramebuffer();
    if (framebuffer) {
      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.DepthTexture,
          compositionType: CompositionType.Texture2D,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
         
          isSystem: true,
          initialValue: [
            5,
            framebuffer.colorAttachments[0]]
        }
      );
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
  }
}

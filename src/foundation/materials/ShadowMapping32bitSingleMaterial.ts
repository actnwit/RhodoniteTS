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

export default class ShadowMapping32bitSingleMaterial extends AbstractMaterialNode {
  private static __dummyWhiteTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlueTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackCubeTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor(renderPass: RenderPass) {
    super(ShadowMapping32bitClassicShader.getInstance(), "envConstantShading");
    ShadowMapping32bitSingleMaterial.initDefaultTextures();
    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        isPlural: false,
        prefix: "material.",
        isSystem: false,
        initialValue: new Vector4(1, 1, 1, 1)
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        isPlural: false,
        isSystem: false,
        initialValue: [
          0,
          ShadowMapping32bitSingleMaterial.__dummyWhiteTextureUid
        ]
      },
      {
        semantic: ShaderSemantics.SpecularColorFactor,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Float,
        isPlural: false,
        prefix: "material.",
        isSystem: false,
        initialValue: new Vector2(1, 1)
      },
      {
        semantic: ShaderSemantics.SpecularColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        isPlural: false,
        isSystem: false,
        initialValue: [
          1,
          ShadowMapping32bitSingleMaterial.__dummyWhiteTextureUid
        ]
      },
      {
        semantic: ShaderSemantics.NormalTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        isPlural: false,
        isSystem: false,
        initialValue: [
          2,
          ShadowMapping32bitSingleMaterial.__dummyBlueTextureUid
        ]
      },
      {
        semantic: ShaderSemantics.OcclusionTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        isPlural: false,
        isSystem: false,
        initialValue: [
          3,
          ShadowMapping32bitSingleMaterial.__dummyWhiteTextureUid
        ]
      },
      {
        semantic: ShaderSemantics.EmissiveTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        isPlural: false,
        isSystem: false,
        initialValue: [
          4,
          ShadowMapping32bitSingleMaterial.__dummyBlackTextureUid
        ]
      },
      {
        semantic: ShaderSemantics.Shininess,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        isPlural: false,
        isSystem: false,
        initialValue: 5
      },
      {
        semantic: ShaderSemantics.Wireframe,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        isPlural: false,
        isSystem: false,
        initialValue: new Vector3(0, 0, 1)
      },
      {
        semantic: ShaderSemantics.ShadingModel,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        isPlural: false,
        isSystem: false,
        initialValue: ShadingModel.Constant.index
      },
      {
        semantic: ShaderSemantics.PointSize,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        isPlural: false,
        isSystem: false,
        initialValue: 30.0
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        isPlural: false,
        isSystem: false,
        initialValue: new Vector3(0.0, 0.1, 0.01)
      }];

    const cameraComponent = renderPass.cameraComponent;
    if (cameraComponent) {
      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.LightViewMatrix,
          compositionType: CompositionType.Mat4,
          componentType: ComponentType.Float,
          isPlural: false,
          isSystem: true,
          initialValue: cameraComponent.viewMatrix
        },
        {
          semantic: ShaderSemantics.LightProjectionMatrix,
          compositionType: CompositionType.Mat4,
          componentType: ComponentType.Float,
          isPlural: false,
          isSystem: true,
          initialValue: cameraComponent.projectionMatrix
        },
        {
          semantic: ShaderSemantics.LightPositionForShadowMapping,
          compositionType: CompositionType.Vec3,
          componentType: ComponentType.Float,
          isPlural: false,
          isSystem: true,
          initialValue: cameraComponent.worldPosition.clone()
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
          isPlural: false,
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

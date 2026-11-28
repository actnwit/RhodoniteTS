// src/foundation/materials/contents/VarianceShadowMapDecodeClassicMaterialContent.ts
import VarianceShadowMapDecodeClassicShaderFragment_ from "../../../webgl/shaderity_shaders/VarianceShadowMapDecodeClassicShader/VarianceShadowMapDecodeClassicShader.frag.js";
import VarianceShadowMapDecodeClassicShaderVertex_ from "../../../webgl/shaderity_shaders/VarianceShadowMapDecodeClassicShader/VarianceShadowMapDecodeClassicShader.vert.js";
import { CameraComponent } from "../../components/Camera/CameraComponent.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ShaderSemantics, ShaderSemanticsClass } from "../../definitions/ShaderSemantics.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { ShadingModel } from "../../definitions/ShadingModel.js";
import { MutableMatrix44 } from "../../math/MutableMatrix44.js";
import { Scalar } from "../../math/Scalar.js";
import { Vector3 } from "../../math/Vector3.js";
import { Vector4 } from "../../math/Vector4.js";
import { Logger } from "../../misc/Logger.js";
import { AbstractMaterialContent } from "../core/AbstractMaterialContent.js";
var VarianceShadowMapDecodeClassicShaderFragment = typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__ ? VarianceShadowMapDecodeClassicShaderFragment_ : void 0;
var VarianceShadowMapDecodeClassicShaderVertex = typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__ ? VarianceShadowMapDecodeClassicShaderVertex_ : void 0;
var VarianceShadowMapDecodeClassicMaterialContent = class extends AbstractMaterialContent {
  /**
   * Creates a new instance of VarianceShadowMapDecodeClassicMaterialContent for variance shadow mapping.
   * This material content handles the decoding and rendering of variance shadow maps, which provide
   * soft shadows with reduced aliasing compared to traditional shadow mapping techniques.
   *
   * @param engine - The engine instance
   * @param materialName - The name identifier for this material
   * @param options - Configuration options for the material
   * @param options.isMorphing - Whether to enable morphing/blend shape support
   * @param options.isSkinning - Whether to enable skeletal animation support
   * @param options.isLighting - Whether to apply lighting calculations. When false, renders original material color except in shadow areas
   * @param options.isDebugging - Whether to enable debug visualization showing areas outside depth map in debug color
   * @param options.colorAttachmentsNumberDepth - Index of the color attachment containing depth information from DepthEncodeMaterialContent
   * @param options.colorAttachmentsNumberSquareDepth - Index of the color attachment containing squared depth information
   * @param options.depthCameraComponent - Optional camera component used for depth rendering. If not provided, uses the current render pass camera
   * @param encodedDepthRenderPasses - Array of exactly 2 render passes containing the encoded depth information (depth and squared depth)
   * @throws Will log an error if encodedDepthRenderPasses length is not exactly 2
   * @throws Will log a warning if depthCameraComponent is not provided
   */
  constructor(engine, materialName, {
    isMorphing,
    isSkinning,
    isLighting,
    isDebugging,
    colorAttachmentsNumberDepth,
    colorAttachmentsNumberSquareDepth,
    depthCameraComponent
  }, encodedDepthRenderPasses) {
    super(
      materialName,
      { isMorphing, isSkinning, isLighting },
      VarianceShadowMapDecodeClassicShaderVertex,
      VarianceShadowMapDecodeClassicShaderFragment,
      engine
    );
    if (encodedDepthRenderPasses.length !== 2) {
      Logger.default.error("invalid length of renderPasses");
    }
    if (depthCameraComponent == null) {
      Logger.default.warn("need to set depth camera component");
    } else {
      this.tr = depthCameraComponent;
    }
    for (const encodedDepthRenderPass of encodedDepthRenderPasses) {
      const viewport = encodedDepthRenderPass.getViewport();
      viewport.setComponents(1, 1, viewport.z - 1, viewport.w - 1);
      encodedDepthRenderPass.setViewport(viewport);
    }
    let depthTexture;
    const depthFramebuffer = encodedDepthRenderPasses[0].getFramebuffer();
    if (depthFramebuffer) {
      depthTexture = depthFramebuffer.colorAttachments[colorAttachmentsNumberDepth];
    } else {
      Logger.default.warn("renderPass of depth does not have framebuffer");
      depthTexture = engine.dummyTextures.dummyBlackTexture;
    }
    let squareDepthTexture;
    const squareDepthFramebuffer = encodedDepthRenderPasses[1].getFramebuffer();
    if (squareDepthFramebuffer) {
      squareDepthTexture = squareDepthFramebuffer.colorAttachments[colorAttachmentsNumberSquareDepth];
    } else {
      Logger.default.warn("renderPass of square depth does not have framebuffer");
      squareDepthTexture = engine.dummyTextures.dummyBlackTexture;
    }
    const shaderSemanticsInfoArray = [
      {
        semantic: "lightViewProjectionMatrix",
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        isInternalSetting: true,
        initialValue: MutableMatrix44.zero(),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE
      },
      {
        semantic: "shadingModel",
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(ShadingModel.Constant.index),
        min: 0,
        max: 3
      },
      {
        semantic: "shininess",
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(5),
        min: 0,
        max: Number.MAX_VALUE
      },
      {
        semantic: "allowableDepthError",
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(1e-4),
        min: 0,
        max: 1
      },
      {
        semantic: "shadowColor",
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Vector4.fromCopyArray([0.5, 0.5, 0.5, 1]),
        min: 0,
        max: 1
      },
      {
        semantic: "diffuseColorFactor",
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
        min: 0,
        max: 2
      },
      {
        semantic: "zNearInner",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: true,
        initialValue: Scalar.fromCopyNumber(0.1),
        min: 1e-4,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "zFarInner",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: true,
        initialValue: Scalar.fromCopyNumber(1e4),
        min: 1e-4,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "isPointLight",
        componentType: ComponentType.Bool,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(1),
        min: 0,
        max: 1
      },
      {
        semantic: "wireframe",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray([0, 0, 1]),
        min: 0,
        max: 10
      },
      {
        semantic: "depthAdjustment",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1
      },
      {
        semantic: "lightBleedingParameter",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1
      },
      {
        semantic: "minimumVariance",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(1e-7),
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "textureDepthAdjustment",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1
      },
      {
        semantic: "normalTexture",
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: [1, engine.dummyTextures.dummyBlueTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "diffuseColorTexture",
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: [2, engine.dummyTextures.dummyWhiteTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "depthTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [3, depthTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "squareDepthTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [4, squareDepthTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      }
    ];
    shaderSemanticsInfoArray.push(
      {
        semantic: "pointSize",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader,
        soloDatum: true,
        initialValue: Scalar.fromCopyNumber(30),
        min: 0,
        max: 100
      },
      {
        semantic: "pointDistanceAttenuation",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0, 0.1, 0.01]),
        min: 0,
        max: 1
      }
    );
    if (isDebugging) {
      shaderSemanticsInfoArray.push({
        semantic: "debugColorFactor",
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Vector4.fromCopyArray([1, 0, 0, 1]),
        min: 0,
        max: 2
      });
    }
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }
  /**
   * Sets internal rendering parameters for the material on a per-material basis.
   * This method configures shader uniforms and parameters specific to variance shadow mapping,
   * including camera matrices, depth information, and various rendering features like skinning and morphing.
   *
   * @param params - The rendering parameters object
   * @param params.material - The material instance being rendered
   * @param params.shaderProgram - The WebGL shader program to configure
   * @param params.args - WebGL-specific rendering arguments containing entity, camera, and rendering context
   *
   * @remarks
   * This method handles:
   * - Setting world, view, and projection matrices
   * - Configuring depth camera parameters (zNear, zFar, view-projection matrix)
   * - Setting up skeletal animation if present
   * - Configuring lighting information
   * - Setting up morph target data if morphing is enabled
   *
   * The method optimizes performance by caching zNear and zFar values to avoid unnecessary uniform updates.
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial({
    engine,
    material,
    shaderProgram,
    args
  }) {
    var _a;
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(engine)
      );
    }
    const encodedDepthCameraComponent = (_a = this.tr) != null ? _a : args.renderPass.cameraComponent;
    material.setParameter("zNearInner", encodedDepthCameraComponent.zNearInner);
    material.setParameter("zFarInner", encodedDepthCameraComponent.zFarInner);
    material.setParameter("lightViewProjectionMatrix", encodedDepthCameraComponent.viewProjectionMatrix);
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
    const __webglResourceRepository = engine.webglResourceRepository;
    __webglResourceRepository.setUniformValue(
      shaderProgram,
      ShaderSemantics.LightViewProjectionMatrix.str,
      true,
      encodedDepthCameraComponent.viewProjectionMatrix
    );
  }
  /**
   * Sets the depth camera component used for shadow map generation.
   * This camera defines the light's perspective for shadow mapping calculations.
   *
   * @param depthCameraComponent - The camera component representing the light's view for shadow mapping
   *
   * @remarks
   * The depth camera component should be positioned and oriented to match the light source
   * that will cast shadows. Its view-projection matrix will be used to transform vertices
   * into light space for shadow map lookup operations.
   */
  set depthCameraComponent(depthCameraComponent) {
    this.tr = depthCameraComponent;
  }
};
VarianceShadowMapDecodeClassicMaterialContent.IsPointLight = new ShaderSemanticsClass({ str: "isPointLight" });
VarianceShadowMapDecodeClassicMaterialContent.DepthTexture = new ShaderSemanticsClass({ str: "depthTexture" });
VarianceShadowMapDecodeClassicMaterialContent.SquareDepthTexture = new ShaderSemanticsClass({
  str: "squareDepthTexture"
});
VarianceShadowMapDecodeClassicMaterialContent.DepthAdjustment = new ShaderSemanticsClass({ str: "depthAdjustment" });
VarianceShadowMapDecodeClassicMaterialContent.TextureDepthAdjustment = new ShaderSemanticsClass({
  str: "textureDepthAdjustment"
});
VarianceShadowMapDecodeClassicMaterialContent.MinimumVariance = new ShaderSemanticsClass({ str: "minimumVariance" });
VarianceShadowMapDecodeClassicMaterialContent.LightBleedingParameter = new ShaderSemanticsClass({
  str: "lightBleedingParameter"
});
VarianceShadowMapDecodeClassicMaterialContent.ShadowColor = new ShaderSemanticsClass({ str: "shadowColor" });
VarianceShadowMapDecodeClassicMaterialContent.AllowableDepthError = new ShaderSemanticsClass({
  str: "allowableDepthError"
});
VarianceShadowMapDecodeClassicMaterialContent.zNearInner = new ShaderSemanticsClass({ str: "zNearInner" });
VarianceShadowMapDecodeClassicMaterialContent.zFarInner = new ShaderSemanticsClass({ str: "zFarInner" });
VarianceShadowMapDecodeClassicMaterialContent.DebugColorFactor = new ShaderSemanticsClass({
  str: "debugColorFactor"
});
VarianceShadowMapDecodeClassicMaterialContent.jr = 0;
VarianceShadowMapDecodeClassicMaterialContent.kr = 0;
export {
  VarianceShadowMapDecodeClassicMaterialContent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvbnRlbnRzL1ZhcmlhbmNlU2hhZG93TWFwRGVjb2RlQ2xhc3NpY01hdGVyaWFsQ29udGVudC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb3VudCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCBWYXJpYW5jZVNoYWRvd01hcERlY29kZUNsYXNzaWNTaGFkZXJGcmFnbWVudF8gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvVmFyaWFuY2VTaGFkb3dNYXBEZWNvZGVDbGFzc2ljU2hhZGVyL1ZhcmlhbmNlU2hhZG93TWFwRGVjb2RlQ2xhc3NpY1NoYWRlci5mcmFnJztcbmltcG9ydCBWYXJpYW5jZVNoYWRvd01hcERlY29kZUNsYXNzaWNTaGFkZXJWZXJ0ZXhfIGZyb20gJy4uLy4uLy4uL3dlYmdsL3NoYWRlcml0eV9zaGFkZXJzL1ZhcmlhbmNlU2hhZG93TWFwRGVjb2RlQ2xhc3NpY1NoYWRlci9WYXJpYW5jZVNoYWRvd01hcERlY29kZUNsYXNzaWNTaGFkZXIudmVydCc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlcmluZ0FyZ1dlYkdMIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBTaGFkZXJTZW1hbnRpY3MsIFNoYWRlclNlbWFudGljc0NsYXNzLCB0eXBlIFNoYWRlclNlbWFudGljc0VudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3MnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzSW5mbyc7XG5pbXBvcnQgeyBTaGFkZXJUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyVHlwZSc7XG5pbXBvcnQgeyBTaGFkaW5nTW9kZWwgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9TaGFkaW5nTW9kZWwnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjQnO1xuaW1wb3J0IHsgU2NhbGFyIH0gZnJvbSAnLi4vLi4vbWF0aC9TY2FsYXInO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uLy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uLy4uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgSVJlbmRlcmFibGUgfSBmcm9tICcuLi8uLi90ZXh0dXJlcy9JUmVuZGVyYWJsZSc7XG5pbXBvcnQgdHlwZSB7IFRleHR1cmUgfSBmcm9tICcuLi8uLi90ZXh0dXJlcy9UZXh0dXJlJztcbmltcG9ydCB7IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50IH0gZnJvbSAnLi4vY29yZS9BYnN0cmFjdE1hdGVyaWFsQ29udGVudCc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vY29yZS9NYXRlcmlhbCc7XG5cbi8vIFNoYWRlcnMgb2YgYSBiYWNrZW5kIGV4Y2x1ZGVkIGF0IGJ1aWxkIHRpbWUgKHNlZSBzcmMvYmFja2VuZEZsYWdzLmQudHMpIGFyZSBkcm9wcGVkIGJ5IHRoZSBidW5kbGVyLlxuY29uc3QgVmFyaWFuY2VTaGFkb3dNYXBEZWNvZGVDbGFzc2ljU2hhZGVyRnJhZ21lbnQgPVxuICB0eXBlb2YgX19STl9XRUJHTF9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdMX18gPyBWYXJpYW5jZVNoYWRvd01hcERlY29kZUNsYXNzaWNTaGFkZXJGcmFnbWVudF8gOiB1bmRlZmluZWQ7XG5jb25zdCBWYXJpYW5jZVNoYWRvd01hcERlY29kZUNsYXNzaWNTaGFkZXJWZXJ0ZXggPVxuICB0eXBlb2YgX19STl9XRUJHTF9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdMX18gPyBWYXJpYW5jZVNoYWRvd01hcERlY29kZUNsYXNzaWNTaGFkZXJWZXJ0ZXhfIDogdW5kZWZpbmVkO1xuXG5leHBvcnQgY2xhc3MgVmFyaWFuY2VTaGFkb3dNYXBEZWNvZGVDbGFzc2ljTWF0ZXJpYWxDb250ZW50IGV4dGVuZHMgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQge1xuICBzdGF0aWMgSXNQb2ludExpZ2h0ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnaXNQb2ludExpZ2h0JyB9KTtcbiAgc3RhdGljIERlcHRoVGV4dHVyZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ2RlcHRoVGV4dHVyZScgfSk7XG4gIHN0YXRpYyBTcXVhcmVEZXB0aFRleHR1cmUgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ3NxdWFyZURlcHRoVGV4dHVyZScsXG4gIH0pO1xuICBzdGF0aWMgRGVwdGhBZGp1c3RtZW50ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnZGVwdGhBZGp1c3RtZW50JyB9KTtcbiAgc3RhdGljIFRleHR1cmVEZXB0aEFkanVzdG1lbnQgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ3RleHR1cmVEZXB0aEFkanVzdG1lbnQnLFxuICB9KTtcbiAgc3RhdGljIE1pbmltdW1WYXJpYW5jZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ21pbmltdW1WYXJpYW5jZScgfSk7XG4gIHN0YXRpYyBMaWdodEJsZWVkaW5nUGFyYW1ldGVyID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgICBzdHI6ICdsaWdodEJsZWVkaW5nUGFyYW1ldGVyJyxcbiAgfSk7XG4gIHN0YXRpYyBTaGFkb3dDb2xvciA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ3NoYWRvd0NvbG9yJyB9KTtcbiAgc3RhdGljIEFsbG93YWJsZURlcHRoRXJyb3IgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ2FsbG93YWJsZURlcHRoRXJyb3InLFxuICB9KTtcbiAgc3RhdGljIHpOZWFySW5uZXIgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICd6TmVhcklubmVyJyB9KTtcbiAgc3RhdGljIHpGYXJJbm5lciA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ3pGYXJJbm5lcicgfSk7XG4gIHN0YXRpYyBEZWJ1Z0NvbG9yRmFjdG9yOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgICBzdHI6ICdkZWJ1Z0NvbG9yRmFjdG9yJyxcbiAgfSk7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19sYXN0Wk5lYXIgPSAwLjA7XG4gIHByaXZhdGUgc3RhdGljIF9fbGFzdFpGYXIgPSAwLjA7XG5cbiAgcHJpdmF0ZSBfX2RlcHRoQ2FtZXJhQ29tcG9uZW50PzogQ2FtZXJhQ29tcG9uZW50O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFZhcmlhbmNlU2hhZG93TWFwRGVjb2RlQ2xhc3NpY01hdGVyaWFsQ29udGVudCBmb3IgdmFyaWFuY2Ugc2hhZG93IG1hcHBpbmcuXG4gICAqIFRoaXMgbWF0ZXJpYWwgY29udGVudCBoYW5kbGVzIHRoZSBkZWNvZGluZyBhbmQgcmVuZGVyaW5nIG9mIHZhcmlhbmNlIHNoYWRvdyBtYXBzLCB3aGljaCBwcm92aWRlXG4gICAqIHNvZnQgc2hhZG93cyB3aXRoIHJlZHVjZWQgYWxpYXNpbmcgY29tcGFyZWQgdG8gdHJhZGl0aW9uYWwgc2hhZG93IG1hcHBpbmcgdGVjaG5pcXVlcy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIG1hdGVyaWFsTmFtZSAtIFRoZSBuYW1lIGlkZW50aWZpZXIgZm9yIHRoaXMgbWF0ZXJpYWxcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBtYXRlcmlhbFxuICAgKiBAcGFyYW0gb3B0aW9ucy5pc01vcnBoaW5nIC0gV2hldGhlciB0byBlbmFibGUgbW9ycGhpbmcvYmxlbmQgc2hhcGUgc3VwcG9ydFxuICAgKiBAcGFyYW0gb3B0aW9ucy5pc1NraW5uaW5nIC0gV2hldGhlciB0byBlbmFibGUgc2tlbGV0YWwgYW5pbWF0aW9uIHN1cHBvcnRcbiAgICogQHBhcmFtIG9wdGlvbnMuaXNMaWdodGluZyAtIFdoZXRoZXIgdG8gYXBwbHkgbGlnaHRpbmcgY2FsY3VsYXRpb25zLiBXaGVuIGZhbHNlLCByZW5kZXJzIG9yaWdpbmFsIG1hdGVyaWFsIGNvbG9yIGV4Y2VwdCBpbiBzaGFkb3cgYXJlYXNcbiAgICogQHBhcmFtIG9wdGlvbnMuaXNEZWJ1Z2dpbmcgLSBXaGV0aGVyIHRvIGVuYWJsZSBkZWJ1ZyB2aXN1YWxpemF0aW9uIHNob3dpbmcgYXJlYXMgb3V0c2lkZSBkZXB0aCBtYXAgaW4gZGVidWcgY29sb3JcbiAgICogQHBhcmFtIG9wdGlvbnMuY29sb3JBdHRhY2htZW50c051bWJlckRlcHRoIC0gSW5kZXggb2YgdGhlIGNvbG9yIGF0dGFjaG1lbnQgY29udGFpbmluZyBkZXB0aCBpbmZvcm1hdGlvbiBmcm9tIERlcHRoRW5jb2RlTWF0ZXJpYWxDb250ZW50XG4gICAqIEBwYXJhbSBvcHRpb25zLmNvbG9yQXR0YWNobWVudHNOdW1iZXJTcXVhcmVEZXB0aCAtIEluZGV4IG9mIHRoZSBjb2xvciBhdHRhY2htZW50IGNvbnRhaW5pbmcgc3F1YXJlZCBkZXB0aCBpbmZvcm1hdGlvblxuICAgKiBAcGFyYW0gb3B0aW9ucy5kZXB0aENhbWVyYUNvbXBvbmVudCAtIE9wdGlvbmFsIGNhbWVyYSBjb21wb25lbnQgdXNlZCBmb3IgZGVwdGggcmVuZGVyaW5nLiBJZiBub3QgcHJvdmlkZWQsIHVzZXMgdGhlIGN1cnJlbnQgcmVuZGVyIHBhc3MgY2FtZXJhXG4gICAqIEBwYXJhbSBlbmNvZGVkRGVwdGhSZW5kZXJQYXNzZXMgLSBBcnJheSBvZiBleGFjdGx5IDIgcmVuZGVyIHBhc3NlcyBjb250YWluaW5nIHRoZSBlbmNvZGVkIGRlcHRoIGluZm9ybWF0aW9uIChkZXB0aCBhbmQgc3F1YXJlZCBkZXB0aClcbiAgICogQHRocm93cyBXaWxsIGxvZyBhbiBlcnJvciBpZiBlbmNvZGVkRGVwdGhSZW5kZXJQYXNzZXMgbGVuZ3RoIGlzIG5vdCBleGFjdGx5IDJcbiAgICogQHRocm93cyBXaWxsIGxvZyBhIHdhcm5pbmcgaWYgZGVwdGhDYW1lcmFDb21wb25lbnQgaXMgbm90IHByb3ZpZGVkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtYXRlcmlhbE5hbWU6IHN0cmluZyxcbiAgICB7XG4gICAgICBpc01vcnBoaW5nLFxuICAgICAgaXNTa2lubmluZyxcbiAgICAgIGlzTGlnaHRpbmcsXG4gICAgICBpc0RlYnVnZ2luZyxcbiAgICAgIGNvbG9yQXR0YWNobWVudHNOdW1iZXJEZXB0aCxcbiAgICAgIGNvbG9yQXR0YWNobWVudHNOdW1iZXJTcXVhcmVEZXB0aCxcbiAgICAgIGRlcHRoQ2FtZXJhQ29tcG9uZW50LFxuICAgIH06IHtcbiAgICAgIGlzTW9ycGhpbmc6IGJvb2xlYW47XG4gICAgICBpc1NraW5uaW5nOiBib29sZWFuO1xuICAgICAgaXNMaWdodGluZzogYm9vbGVhbjtcbiAgICAgIGlzRGVidWdnaW5nOiBib29sZWFuO1xuICAgICAgY29sb3JBdHRhY2htZW50c051bWJlckRlcHRoOiBDb3VudDtcbiAgICAgIGNvbG9yQXR0YWNobWVudHNOdW1iZXJTcXVhcmVEZXB0aDogQ291bnQ7XG4gICAgICBkZXB0aENhbWVyYUNvbXBvbmVudD86IENhbWVyYUNvbXBvbmVudDtcbiAgICB9LFxuICAgIGVuY29kZWREZXB0aFJlbmRlclBhc3NlczogUmVuZGVyUGFzc1tdXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgbWF0ZXJpYWxOYW1lLFxuICAgICAgeyBpc01vcnBoaW5nLCBpc1NraW5uaW5nLCBpc0xpZ2h0aW5nIH0sXG4gICAgICBWYXJpYW5jZVNoYWRvd01hcERlY29kZUNsYXNzaWNTaGFkZXJWZXJ0ZXgsXG4gICAgICBWYXJpYW5jZVNoYWRvd01hcERlY29kZUNsYXNzaWNTaGFkZXJGcmFnbWVudCxcbiAgICAgIGVuZ2luZVxuICAgICk7XG5cbiAgICBpZiAoZW5jb2RlZERlcHRoUmVuZGVyUGFzc2VzLmxlbmd0aCAhPT0gMikge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ2ludmFsaWQgbGVuZ3RoIG9mIHJlbmRlclBhc3NlcycpO1xuICAgIH1cblxuICAgIGlmIChkZXB0aENhbWVyYUNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCduZWVkIHRvIHNldCBkZXB0aCBjYW1lcmEgY29tcG9uZW50Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19kZXB0aENhbWVyYUNvbXBvbmVudCA9IGRlcHRoQ2FtZXJhQ29tcG9uZW50O1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZW5jb2RlZERlcHRoUmVuZGVyUGFzcyBvZiBlbmNvZGVkRGVwdGhSZW5kZXJQYXNzZXMpIHtcbiAgICAgIGNvbnN0IHZpZXdwb3J0ID0gZW5jb2RlZERlcHRoUmVuZGVyUGFzcy5nZXRWaWV3cG9ydCgpIGFzIE11dGFibGVWZWN0b3I0O1xuICAgICAgdmlld3BvcnQuc2V0Q29tcG9uZW50cygxLCAxLCB2aWV3cG9ydC56IC0gMSwgdmlld3BvcnQudyAtIDEpO1xuICAgICAgZW5jb2RlZERlcHRoUmVuZGVyUGFzcy5zZXRWaWV3cG9ydCh2aWV3cG9ydCk7XG4gICAgfVxuXG4gICAgbGV0IGRlcHRoVGV4dHVyZTogSVJlbmRlcmFibGUgfCBUZXh0dXJlO1xuICAgIGNvbnN0IGRlcHRoRnJhbWVidWZmZXIgPSBlbmNvZGVkRGVwdGhSZW5kZXJQYXNzZXNbMF0uZ2V0RnJhbWVidWZmZXIoKTtcbiAgICBpZiAoZGVwdGhGcmFtZWJ1ZmZlcikge1xuICAgICAgZGVwdGhUZXh0dXJlID0gZGVwdGhGcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzW2NvbG9yQXR0YWNobWVudHNOdW1iZXJEZXB0aF07XG4gICAgfSBlbHNlIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ3JlbmRlclBhc3Mgb2YgZGVwdGggZG9lcyBub3QgaGF2ZSBmcmFtZWJ1ZmZlcicpO1xuICAgICAgZGVwdGhUZXh0dXJlID0gZW5naW5lLmR1bW15VGV4dHVyZXMuZHVtbXlCbGFja1RleHR1cmU7XG4gICAgfVxuXG4gICAgbGV0IHNxdWFyZURlcHRoVGV4dHVyZTogSVJlbmRlcmFibGUgfCBUZXh0dXJlO1xuICAgIGNvbnN0IHNxdWFyZURlcHRoRnJhbWVidWZmZXIgPSBlbmNvZGVkRGVwdGhSZW5kZXJQYXNzZXNbMV0uZ2V0RnJhbWVidWZmZXIoKTtcbiAgICBpZiAoc3F1YXJlRGVwdGhGcmFtZWJ1ZmZlcikge1xuICAgICAgc3F1YXJlRGVwdGhUZXh0dXJlID0gc3F1YXJlRGVwdGhGcmFtZWJ1ZmZlci5jb2xvckF0dGFjaG1lbnRzW2NvbG9yQXR0YWNobWVudHNOdW1iZXJTcXVhcmVEZXB0aF07XG4gICAgfSBlbHNlIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ3JlbmRlclBhc3Mgb2Ygc3F1YXJlIGRlcHRoIGRvZXMgbm90IGhhdmUgZnJhbWVidWZmZXInKTtcbiAgICAgIHNxdWFyZURlcHRoVGV4dHVyZSA9IGVuZ2luZS5kdW1teVRleHR1cmVzLmR1bW15QmxhY2tUZXh0dXJlO1xuICAgIH1cblxuICAgIGNvbnN0IHNoYWRlclNlbWFudGljc0luZm9BcnJheTogU2hhZGVyU2VtYW50aWNzSW5mb1tdID0gW1xuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ2xpZ2h0Vmlld1Byb2plY3Rpb25NYXRyaXgnLFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5NYXQ0LFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICAgIGlzSW50ZXJuYWxTZXR0aW5nOiB0cnVlLFxuICAgICAgICBpbml0aWFsVmFsdWU6IE11dGFibGVNYXRyaXg0NC56ZXJvKCksXG4gICAgICAgIG1pbjogLU51bWJlci5NQVhfVkFMVUUsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnc2hhZGluZ01vZGVsJyxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkludCxcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKFNoYWRpbmdNb2RlbC5Db25zdGFudC5pbmRleCksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAzLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdzaGluaW5lc3MnLFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcig1KSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ2FsbG93YWJsZURlcHRoRXJyb3InLFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcigwLjAwMDEpLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnc2hhZG93Q29sb3InLFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBWZWN0b3I0LmZyb21Db3B5QXJyYXkoWzAuNSwgMC41LCAwLjUsIDFdKSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ2RpZmZ1c2VDb2xvckZhY3RvcicsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFZlY3RvcjQuZnJvbUNvcHlBcnJheShbMSwgMSwgMSwgMV0pLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnek5lYXJJbm5lcicsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGlzSW50ZXJuYWxTZXR0aW5nOiB0cnVlLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcigwLjEpLFxuICAgICAgICBtaW46IDAuMDAwMSxcbiAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnekZhcklubmVyJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaXNJbnRlcm5hbFNldHRpbmc6IHRydWUsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDEwMDAwLjApLFxuICAgICAgICBtaW46IDAuMDAwMSxcbiAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnaXNQb2ludExpZ2h0JyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5Cb29sLFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcigxKSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3dpcmVmcmFtZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMCwgMV0pLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMTAsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ2RlcHRoQWRqdXN0bWVudCcsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDAuMCksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdsaWdodEJsZWVkaW5nUGFyYW1ldGVyJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIoMC4wKSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ21pbmltdW1WYXJpYW5jZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDAuMDAwMDAwMSksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAndGV4dHVyZURlcHRoQWRqdXN0bWVudCcsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDAuMCksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdub3JtYWxUZXh0dXJlJyxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJELFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkludCxcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogWzEsIGVuZ2luZS5kdW1teVRleHR1cmVzLmR1bW15Qmx1ZVRleHR1cmVdLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ2RpZmZ1c2VDb2xvclRleHR1cmUnLFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuSW50LFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBbMiwgZW5naW5lLmR1bW15VGV4dHVyZXMuZHVtbXlXaGl0ZVRleHR1cmVdLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ2RlcHRoVGV4dHVyZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuSW50LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFszLCBkZXB0aFRleHR1cmVdLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3NxdWFyZURlcHRoVGV4dHVyZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuSW50LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFs0LCBzcXVhcmVEZXB0aFRleHR1cmVdLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgICB9LFxuICAgIF07XG5cbiAgICAvLyBwb2ludCBjbG91ZFxuICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheS5wdXNoKFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3BvaW50U2l6ZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyLFxuICAgICAgICBzb2xvRGF0dW06IHRydWUsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDMwLjApLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMTAwLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdwb2ludERpc3RhbmNlQXR0ZW51YXRpb24nLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICAgIHNvbG9EYXR1bTogdHJ1ZSxcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAuMCwgMC4xLCAwLjAxXSksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAoaXNEZWJ1Z2dpbmcpIHtcbiAgICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheS5wdXNoKHtcbiAgICAgICAgc2VtYW50aWM6ICdkZWJ1Z0NvbG9yRmFjdG9yJyxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjNCxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yNC5mcm9tQ29weUFycmF5KFsxLCAwLCAwLCAxXSksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAyLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkoc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGludGVybmFsIHJlbmRlcmluZyBwYXJhbWV0ZXJzIGZvciB0aGUgbWF0ZXJpYWwgb24gYSBwZXItbWF0ZXJpYWwgYmFzaXMuXG4gICAqIFRoaXMgbWV0aG9kIGNvbmZpZ3VyZXMgc2hhZGVyIHVuaWZvcm1zIGFuZCBwYXJhbWV0ZXJzIHNwZWNpZmljIHRvIHZhcmlhbmNlIHNoYWRvdyBtYXBwaW5nLFxuICAgKiBpbmNsdWRpbmcgY2FtZXJhIG1hdHJpY2VzLCBkZXB0aCBpbmZvcm1hdGlvbiwgYW5kIHZhcmlvdXMgcmVuZGVyaW5nIGZlYXR1cmVzIGxpa2Ugc2tpbm5pbmcgYW5kIG1vcnBoaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gVGhlIHJlbmRlcmluZyBwYXJhbWV0ZXJzIG9iamVjdFxuICAgKiBAcGFyYW0gcGFyYW1zLm1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIGluc3RhbmNlIGJlaW5nIHJlbmRlcmVkXG4gICAqIEBwYXJhbSBwYXJhbXMuc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbSB0byBjb25maWd1cmVcbiAgICogQHBhcmFtIHBhcmFtcy5hcmdzIC0gV2ViR0wtc3BlY2lmaWMgcmVuZGVyaW5nIGFyZ3VtZW50cyBjb250YWluaW5nIGVudGl0eSwgY2FtZXJhLCBhbmQgcmVuZGVyaW5nIGNvbnRleHRcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgaGFuZGxlczpcbiAgICogLSBTZXR0aW5nIHdvcmxkLCB2aWV3LCBhbmQgcHJvamVjdGlvbiBtYXRyaWNlc1xuICAgKiAtIENvbmZpZ3VyaW5nIGRlcHRoIGNhbWVyYSBwYXJhbWV0ZXJzICh6TmVhciwgekZhciwgdmlldy1wcm9qZWN0aW9uIG1hdHJpeClcbiAgICogLSBTZXR0aW5nIHVwIHNrZWxldGFsIGFuaW1hdGlvbiBpZiBwcmVzZW50XG4gICAqIC0gQ29uZmlndXJpbmcgbGlnaHRpbmcgaW5mb3JtYXRpb25cbiAgICogLSBTZXR0aW5nIHVwIG1vcnBoIHRhcmdldCBkYXRhIGlmIG1vcnBoaW5nIGlzIGVuYWJsZWRcbiAgICpcbiAgICogVGhlIG1ldGhvZCBvcHRpbWl6ZXMgcGVyZm9ybWFuY2UgYnkgY2FjaGluZyB6TmVhciBhbmQgekZhciB2YWx1ZXMgdG8gYXZvaWQgdW5uZWNlc3NhcnkgdW5pZm9ybSB1cGRhdGVzLlxuICAgKi9cbiAgX3NldEludGVybmFsU2V0dGluZ1BhcmFtZXRlcnNUb0dwdVdlYkdMUGVyTWF0ZXJpYWwoe1xuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbCxcbiAgICBzaGFkZXJQcm9ncmFtLFxuICAgIGFyZ3MsXG4gIH06IHtcbiAgICBlbmdpbmU6IEVuZ2luZTtcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWw7XG4gICAgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtO1xuICAgIGFyZ3M6IFJlbmRlcmluZ0FyZ1dlYkdMO1xuICB9KSB7XG4gICAgbGV0IGNhbWVyYUNvbXBvbmVudCA9IGFyZ3MucmVuZGVyUGFzcy5jYW1lcmFDb21wb25lbnQ7XG4gICAgaWYgKGNhbWVyYUNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICBjYW1lcmFDb21wb25lbnQgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQoZW5naW5lKVxuICAgICAgKSBhcyBDYW1lcmFDb21wb25lbnQ7XG4gICAgfVxuXG4gICAgY29uc3QgZW5jb2RlZERlcHRoQ2FtZXJhQ29tcG9uZW50ID1cbiAgICAgIHRoaXMuX19kZXB0aENhbWVyYUNvbXBvbmVudCA/PyAoYXJncy5yZW5kZXJQYXNzLmNhbWVyYUNvbXBvbmVudCBhcyBDYW1lcmFDb21wb25lbnQpO1xuXG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd6TmVhcklubmVyJywgZW5jb2RlZERlcHRoQ2FtZXJhQ29tcG9uZW50LnpOZWFySW5uZXIpO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignekZhcklubmVyJywgZW5jb2RlZERlcHRoQ2FtZXJhQ29tcG9uZW50LnpGYXJJbm5lcik7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdsaWdodFZpZXdQcm9qZWN0aW9uTWF0cml4JywgZW5jb2RlZERlcHRoQ2FtZXJhQ29tcG9uZW50LnZpZXdQcm9qZWN0aW9uTWF0cml4KTtcblxuICAgIC8vIE1vcnBoXG4gICAgY29uc3QgYmxlbmRTaGFwZUNvbXBvbmVudCA9IGFyZ3MuZW50aXR5LnRyeVRvR2V0QmxlbmRTaGFwZSgpO1xuICAgIHRoaXMuc2V0TW9ycGhJbmZvKHNoYWRlclByb2dyYW0sIGFyZ3MuZW50aXR5LmdldE1lc2goKSwgYXJncy5wcmltaXRpdmUsIGJsZW5kU2hhcGVDb21wb25lbnQpO1xuXG4gICAgY29uc3QgX193ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IGVuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBfX3dlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnNldFVuaWZvcm1WYWx1ZShcbiAgICAgIHNoYWRlclByb2dyYW0sXG4gICAgICBTaGFkZXJTZW1hbnRpY3MuTGlnaHRWaWV3UHJvamVjdGlvbk1hdHJpeC5zdHIsXG4gICAgICB0cnVlLFxuICAgICAgZW5jb2RlZERlcHRoQ2FtZXJhQ29tcG9uZW50LnZpZXdQcm9qZWN0aW9uTWF0cml4XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkZXB0aCBjYW1lcmEgY29tcG9uZW50IHVzZWQgZm9yIHNoYWRvdyBtYXAgZ2VuZXJhdGlvbi5cbiAgICogVGhpcyBjYW1lcmEgZGVmaW5lcyB0aGUgbGlnaHQncyBwZXJzcGVjdGl2ZSBmb3Igc2hhZG93IG1hcHBpbmcgY2FsY3VsYXRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gZGVwdGhDYW1lcmFDb21wb25lbnQgLSBUaGUgY2FtZXJhIGNvbXBvbmVudCByZXByZXNlbnRpbmcgdGhlIGxpZ2h0J3MgdmlldyBmb3Igc2hhZG93IG1hcHBpbmdcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhlIGRlcHRoIGNhbWVyYSBjb21wb25lbnQgc2hvdWxkIGJlIHBvc2l0aW9uZWQgYW5kIG9yaWVudGVkIHRvIG1hdGNoIHRoZSBsaWdodCBzb3VyY2VcbiAgICogdGhhdCB3aWxsIGNhc3Qgc2hhZG93cy4gSXRzIHZpZXctcHJvamVjdGlvbiBtYXRyaXggd2lsbCBiZSB1c2VkIHRvIHRyYW5zZm9ybSB2ZXJ0aWNlc1xuICAgKiBpbnRvIGxpZ2h0IHNwYWNlIGZvciBzaGFkb3cgbWFwIGxvb2t1cCBvcGVyYXRpb25zLlxuICAgKi9cbiAgc2V0IGRlcHRoQ2FtZXJhQ29tcG9uZW50KGRlcHRoQ2FtZXJhQ29tcG9uZW50OiBDYW1lcmFDb21wb25lbnQpIHtcbiAgICB0aGlzLl9fZGVwdGhDYW1lcmFDb21wb25lbnQgPSBkZXB0aENhbWVyYUNvbXBvbmVudDtcbiAgfVxufVxuIl0sCiAg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LE1BQU07QUFDM0Isd0JBQWtCLE9BQU8sb0JBQW9CO0FBQUEsUUFDM0M7QUFBQSxRQUNBLGdCQUFnQixXQUFXLE1BQU07QUFBQSxNQUNuQztBQUFBLElBQ0Y7QUFFQSxVQUFNLCtCQUNKLFVBQUtBLE9BQUwsWUFBZ0MsS0FBSyxXQUFXO0FBRWxELGFBQVMsYUFBYSxjQUFjLDRCQUE0QixVQUFVO0FBQzFFLGFBQVMsYUFBYSxhQUFhLDRCQUE0QixTQUFTO0FBQ3hFLGFBQVMsYUFBYSw2QkFBNkIsNEJBQTRCLG9CQUFvQjtBQUduRyxVQUFNLHNCQUFzQixLQUFLLE9BQU8sbUJBQW1CO0FBQzNELFNBQUssYUFBYSxlQUFlLEtBQUssT0FBTyxRQUFRLEdBQUcsS0FBSyxXQUFXLG1CQUFtQjtBQUUzRixVQUFNLDRCQUE0QixPQUFPO0FBQ3pDLDhCQUEwQjtBQUFBLE1BQ3hCO0FBQUEsTUFDQSxnQkFBZ0IsMEJBQTBCO0FBQUEsTUFDMUM7QUFBQSxNQUNBLDRCQUE0QjtBQUFBLElBQzlCO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFBLElBQUkscUJBQXFCLHNCQUF1QztBQUM5RCxTQUFLQSxLQUF5QjtBQUFBLEVBQ2hDO0FBQ0Y7QUF4WWEsOENBQ0osZUFBZSxJQUFJLHFCQUFxQixFQUFFLEtBQUssZUFBZSxDQUFDO0FBRDNELDhDQUVKLGVBQWUsSUFBSSxxQkFBcUIsRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUYzRCw4Q0FHSixxQkFBcUIsSUFBSSxxQkFBcUI7QUFBQSxFQUNuRCxLQUFLO0FBQ1AsQ0FBQztBQUxVLDhDQU1KLGtCQUFrQixJQUFJLHFCQUFxQixFQUFFLEtBQUssa0JBQWtCLENBQUM7QUFOakUsOENBT0oseUJBQXlCLElBQUkscUJBQXFCO0FBQUEsRUFDdkQsS0FBSztBQUNQLENBQUM7QUFUVSw4Q0FVSixrQkFBa0IsSUFBSSxxQkFBcUIsRUFBRSxLQUFLLGtCQUFrQixDQUFDO0FBVmpFLDhDQVdKLHlCQUF5QixJQUFJLHFCQUFxQjtBQUFBLEVBQ3ZELEtBQUs7QUFDUCxDQUFDO0FBYlUsOENBY0osY0FBYyxJQUFJLHFCQUFxQixFQUFFLEtBQUssY0FBYyxDQUFDO0FBZHpELDhDQWVKLHNCQUFzQixJQUFJLHFCQUFxQjtBQUFBLEVBQ3BELEtBQUs7QUFDUCxDQUFDO0FBakJVLDhDQWtCSixhQUFhLElBQUkscUJBQXFCLEVBQUUsS0FBSyxhQUFhLENBQUM7QUFsQnZELDhDQW1CSixZQUFZLElBQUkscUJBQXFCLEVBQUUsS0FBSyxZQUFZLENBQUM7QUFuQnJELDhDQW9CSixtQkFBd0MsSUFBSSxxQkFBcUI7QUFBQSxFQUN0RSxLQUFLO0FBQ1AsQ0FBQztBQXRCVSw4Q0F3QklDLEtBQWM7QUF4QmxCLDhDQXlCSUMsS0FBYTsiLAogICJuYW1lcyI6IFsiX19kZXB0aENhbWVyYUNvbXBvbmVudCIsICJfX2xhc3RaTmVhciIsICJfX2xhc3RaRmFyIl0KfQo=

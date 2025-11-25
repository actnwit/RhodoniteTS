import type { Count } from '../../../types/CommonTypes';
import VarianceShadowMapDecodeClassicShaderFragment from '../../../webgl/shaderity_shaders/VarianceShadowMapDecodeClassicShader/VarianceShadowMapDecodeClassicShader.frag';
import VarianceShadowMapDecodeClassicShaderVertex from '../../../webgl/shaderity_shaders/VarianceShadowMapDecodeClassicShader/VarianceShadowMapDecodeClassicShader.vert';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { Config } from '../../core/Config';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ShaderSemantics, ShaderSemanticsClass, type ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { ShadingModel } from '../../definitions/ShadingModel';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import type { MutableVector4 } from '../../math/MutableVector4';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { VectorN } from '../../math/VectorN';
import { Logger } from '../../misc/Logger';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import type { RenderPass } from '../../renderer/RenderPass';
import type { IRenderable } from '../../textures/IRenderable';
import type { Texture } from '../../textures/Texture';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { dummyBlackTexture, dummyBlueTexture, dummyWhiteTexture } from '../core/DummyTextures';
import type { Material } from '../core/Material';

export class VarianceShadowMapDecodeClassicMaterialContent extends AbstractMaterialContent {
  static IsPointLight = new ShaderSemanticsClass({ str: 'isPointLight' });
  static DepthTexture = new ShaderSemanticsClass({ str: 'depthTexture' });
  static SquareDepthTexture = new ShaderSemanticsClass({
    str: 'squareDepthTexture',
  });
  static DepthAdjustment = new ShaderSemanticsClass({ str: 'depthAdjustment' });
  static TextureDepthAdjustment = new ShaderSemanticsClass({
    str: 'textureDepthAdjustment',
  });
  static MinimumVariance = new ShaderSemanticsClass({ str: 'minimumVariance' });
  static LightBleedingParameter = new ShaderSemanticsClass({
    str: 'lightBleedingParameter',
  });
  static ShadowColor = new ShaderSemanticsClass({ str: 'shadowColor' });
  static AllowableDepthError = new ShaderSemanticsClass({
    str: 'allowableDepthError',
  });
  static zNearInner = new ShaderSemanticsClass({ str: 'zNearInner' });
  static zFarInner = new ShaderSemanticsClass({ str: 'zFarInner' });
  static DebugColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'debugColorFactor',
  });

  private static __lastZNear = 0.0;
  private static __lastZFar = 0.0;

  private __depthCameraComponent?: CameraComponent;

  /**
   * Creates a new instance of VarianceShadowMapDecodeClassicMaterialContent for variance shadow mapping.
   * This material content handles the decoding and rendering of variance shadow maps, which provide
   * soft shadows with reduced aliasing compared to traditional shadow mapping techniques.
   *
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
  constructor(
    materialName: string,
    {
      isMorphing,
      isSkinning,
      isLighting,
      isDebugging,
      colorAttachmentsNumberDepth,
      colorAttachmentsNumberSquareDepth,
      depthCameraComponent,
    }: {
      isMorphing: boolean;
      isSkinning: boolean;
      isLighting: boolean;
      isDebugging: boolean;
      colorAttachmentsNumberDepth: Count;
      colorAttachmentsNumberSquareDepth: Count;
      depthCameraComponent?: CameraComponent;
    },
    encodedDepthRenderPasses: RenderPass[]
  ) {
    super(
      materialName,
      { isMorphing, isSkinning, isLighting },
      VarianceShadowMapDecodeClassicShaderVertex,
      VarianceShadowMapDecodeClassicShaderFragment
    );

    if (encodedDepthRenderPasses.length !== 2) {
      Logger.error('invalid length of renderPasses');
    }

    if (depthCameraComponent == null) {
      Logger.warn('need to set depth camera component');
    } else {
      this.__depthCameraComponent = depthCameraComponent;
    }

    for (const encodedDepthRenderPass of encodedDepthRenderPasses) {
      const viewport = encodedDepthRenderPass.getViewport() as MutableVector4;
      viewport.setComponents(1, 1, viewport.z - 1, viewport.w - 1);
      encodedDepthRenderPass.setViewport(viewport);
    }

    let depthTexture: IRenderable | Texture;
    const depthFramebuffer = encodedDepthRenderPasses[0].getFramebuffer();
    if (depthFramebuffer) {
      depthTexture = depthFramebuffer.colorAttachments[colorAttachmentsNumberDepth];
    } else {
      Logger.warn('renderPass of depth does not have framebuffer');
      depthTexture = dummyBlackTexture;
    }

    let squareDepthTexture: IRenderable | Texture;
    const squareDepthFramebuffer = encodedDepthRenderPasses[1].getFramebuffer();
    if (squareDepthFramebuffer) {
      squareDepthTexture = squareDepthFramebuffer.colorAttachments[colorAttachmentsNumberSquareDepth];
    } else {
      Logger.warn('renderPass of square depth does not have framebuffer');
      squareDepthTexture = dummyBlackTexture;
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: 'lightViewProjectionMatrix',
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        isInternalSetting: true,
        initialValue: MutableMatrix44.zero(),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
      },
      {
        semantic: 'shadingModel',
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(ShadingModel.Constant.index),
        min: 0,
        max: 3,
      },
      {
        semantic: 'shininess',
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(5),
        min: 0,
        max: Number.MAX_VALUE,
      },
      {
        semantic: 'allowableDepthError',
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0.0001),
        min: 0,
        max: 1,
      },
      {
        semantic: 'shadowColor',
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Vector4.fromCopyArray([0.5, 0.5, 0.5, 1]),
        min: 0,
        max: 1,
      },
      {
        semantic: 'diffuseColorFactor',
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
        min: 0,
        max: 2,
      },
      {
        semantic: 'zNearInner',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: true,
        initialValue: Scalar.fromCopyNumber(0.1),
        min: 0.0001,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'zFarInner',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: true,
        initialValue: Scalar.fromCopyNumber(10000.0),
        min: 0.0001,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'isPointLight',
        componentType: ComponentType.Bool,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(1),
        min: 0,
        max: 1,
      },
      {
        semantic: 'wireframe',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray([0, 0, 1]),
        min: 0,
        max: 10,
      },
      {
        semantic: 'depthAdjustment',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0.0),
        min: 0,
        max: 1,
      },
      {
        semantic: 'lightBleedingParameter',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0.0),
        min: 0,
        max: 1,
      },
      {
        semantic: 'minimumVariance',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0.0000001),
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'textureDepthAdjustment',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0.0),
        min: 0,
        max: 1,
      },
      {
        semantic: 'normalTexture',
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: [0, dummyBlueTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'diffuseColorTexture',
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: [1, dummyWhiteTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'depthTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [2, depthTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'squareDepthTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [3, squareDepthTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

    // point cloud
    shaderSemanticsInfoArray.push(
      {
        semantic: 'pointSize',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader,
        soloDatum: true,
        initialValue: Scalar.fromCopyNumber(30.0),
        min: 0,
        max: 100,
      },
      {
        semantic: 'pointDistanceAttenuation',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
        min: 0,
        max: 1,
      }
    );

    if (isDebugging) {
      shaderSemanticsInfoArray.push({
        semantic: 'debugColorFactor',
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        initialValue: Vector4.fromCopyArray([1, 0, 0, 1]),
        min: 0,
        max: 2,
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
    material,
    shaderProgram,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    args: RenderingArgWebGL;
  }) {
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as CameraComponent;
    }

    const encodedDepthCameraComponent =
      this.__depthCameraComponent ?? (args.renderPass.cameraComponent as CameraComponent);

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

      if (VarianceShadowMapDecodeClassicMaterialContent.__lastZNear !== encodedDepthCameraComponent.zNearInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zNearInner, encodedDepthCameraComponent.zNearInner);
        VarianceShadowMapDecodeClassicMaterialContent.__lastZNear = encodedDepthCameraComponent.zNearInner;
      }

      if (VarianceShadowMapDecodeClassicMaterialContent.__lastZFar !== encodedDepthCameraComponent.zFarInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zFarInner, encodedDepthCameraComponent.zFarInner);
        VarianceShadowMapDecodeClassicMaterialContent.__lastZFar = encodedDepthCameraComponent.zFarInner;
      }
      const __webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      __webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.LightViewProjectionMatrix.str,
        true,
        encodedDepthCameraComponent.viewProjectionMatrix
      );
    } else {
      material.setParameter('zNearInner', encodedDepthCameraComponent.zNearInner);
      material.setParameter('zFarInner', encodedDepthCameraComponent.zFarInner);
      material.setParameter('lightViewProjectionMatrix', encodedDepthCameraComponent.viewProjectionMatrix);
    }

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);

    // Lights
    this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);

    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);

    const __webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
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
  set depthCameraComponent(depthCameraComponent: CameraComponent) {
    this.__depthCameraComponent = depthCameraComponent;
  }
}

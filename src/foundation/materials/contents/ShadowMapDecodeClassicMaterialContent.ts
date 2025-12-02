import type { Count } from '../../../types/CommonTypes';
import ShadowMapDecodeSingleShaderFragment from '../../../webgl/shaderity_shaders/ShadowMapDecodeClassicSingleShader/ShadowMapDecodeClassicSingleShader.frag';
import ShadowMapDecodeSingleShaderVertex from '../../../webgl/shaderity_shaders/ShadowMapDecodeClassicSingleShader/ShadowMapDecodeClassicSingleShader.vert';
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
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';

/**
 * Material content class for decoding shadow maps using the classic shadow mapping technique.
 * This class handles the rendering of shadow maps with proper depth comparison and shadow factor calculations.
 * It supports morphing, skinning, lighting, and debugging modes for comprehensive shadow rendering functionality.
 */
export class ShadowMapDecodeClassicMaterialContent extends AbstractMaterialContent {
  /** Shader semantic for controlling the color factor applied to shadowed areas */
  static ShadowColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'shadowColorFactor',
  });

  /** Shader semantic for controlling the alpha value in shadowed regions */
  static ShadowAlpha: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'shadowAlpha',
  });

  /** Shader semantic for controlling the alpha value in non-shadowed regions */
  static NonShadowAlpha: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'nonShadowAlpha',
  });

  /** Shader semantic for defining the allowable depth error tolerance in shadow calculations */
  static AllowableDepthError: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'allowableDepthError',
  });

  /** Shader semantic for the near clipping plane distance of the inner camera */
  static zNearInner = new ShaderSemanticsClass({ str: 'zNearInner' });

  /** Shader semantic for the far clipping plane distance of the inner camera */
  static zFarInner = new ShaderSemanticsClass({ str: 'zFarInner' });

  /** Shader semantic for the debug color factor used in debugging mode */
  static DebugColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'debugColorFactor',
  });

  /** Shader semantic for the depth texture containing encoded depth information */
  static DepthTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'depthTexture',
  });

  /** Shader semantic indicating whether the light source is a point light */
  static IsPointLight = new ShaderSemanticsClass({ str: 'isPointLight' });

  /** Cached value of the last used near clipping plane distance for optimization */
  private static __lastZNear = 0.0;

  /** Cached value of the last used far clipping plane distance for optimization */
  private static __lastZFar = 0.0;

  /** The render pass that contains the encoded depth information for shadow mapping */
  private __encodedDepthRenderPass: RenderPass;

  /**
   * Creates a new instance of ShadowMapDecodeClassicMaterialContent.
   * This constructor initializes the shadow mapping material with comprehensive configuration options
   * for various rendering features and sets up the necessary shader semantics for shadow decoding.
   *
   * @param engine - The engine instance
   * @param materialName - The unique name identifier for this material
   * @param options - Configuration object containing rendering feature flags and settings
   * @param options.isMorphing - Enables morphing/blend shape animation support
   * @param options.isSkinning - Enables skeletal animation support
   * @param options.isLighting - Enables lighting calculations (when false, shows original colors except in shadows)
   * @param options.isDebugging - Enables debug visualization showing areas outside depth map coverage
   * @param options.colorAttachmentsNumber - Index of the color attachment containing encoded depth data
   * @param encodedDepthRenderPass - The render pass containing depth information from DepthEncodeMaterialContent
   */
  constructor(
    engine: Engine,
    materialName: string,
    {
      isMorphing,
      isSkinning,
      isLighting,
      isDebugging,
      colorAttachmentsNumber,
    }: {
      isMorphing: boolean;
      isSkinning: boolean;
      isLighting: boolean;
      isDebugging: boolean;
      colorAttachmentsNumber: Count;
    },
    encodedDepthRenderPass: RenderPass
  ) {
    super(
      materialName,
      { isMorphing, isSkinning, isLighting },
      ShadowMapDecodeSingleShaderVertex,
      ShadowMapDecodeSingleShaderFragment
    );

    this.__encodedDepthRenderPass = encodedDepthRenderPass;

    const encodedDepthFramebuffer = encodedDepthRenderPass.getFramebuffer();
    if (encodedDepthFramebuffer == null) {
      Logger.error('encodedDepthRenderPass does not have framebuffer');
      return;
    }
    const encodedDepthTexture = encodedDepthFramebuffer.colorAttachments[colorAttachmentsNumber];

    const viewport = encodedDepthRenderPass.getViewport() as MutableVector4;
    viewport.setComponents(1, 1, viewport.z - 1, viewport.w - 1);
    encodedDepthRenderPass.setViewport(viewport);

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: 'lightViewProjectionMatrix',
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
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
        semantic: 'shadowColorFactor',
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
        semantic: 'normalTexture',
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: [0, engine.dummyTextures.dummyBlueTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'depthTexture',
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: [0, encodedDepthTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'diffuseColorTexture',
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        initialValue: [1, engine.dummyTextures.dummyWhiteTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
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
    ];

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
   * Sets internal shader parameters specific to this material on a per-material basis.
   * This method handles the configuration of shadow mapping parameters, camera settings,
   * and various rendering components such as skinning, lighting, and morphing.
   * It optimizes performance by caching frequently used values and only updating them when necessary.
   *
   * @param params - Configuration object containing all necessary rendering parameters
   * @param params.material - The material instance being configured
   * @param params.shaderProgram - The WebGL shader program to configure
   * @param params.firstTime - Whether this is the first time setting parameters for this material
   * @param params.args - WebGL-specific rendering arguments containing render state and components
   *
   * @internal This method is called internally during the rendering pipeline
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial({
    engine,
    material,
    shaderProgram,
    args,
  }: {
    engine: Engine;
    material: Material;
    shaderProgram: WebGLProgram;
    args: RenderingArgWebGL;
  }) {
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(engine)
      ) as CameraComponent;
    }

    const encodedDepthCameraComponent = this.__encodedDepthRenderPass.cameraComponent as CameraComponent;

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

      if (ShadowMapDecodeClassicMaterialContent.__lastZNear !== encodedDepthCameraComponent.zNearInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zNearInner, encodedDepthCameraComponent.zNearInner);
        ShadowMapDecodeClassicMaterialContent.__lastZNear = encodedDepthCameraComponent.zNearInner;
      }

      if (ShadowMapDecodeClassicMaterialContent.__lastZFar !== encodedDepthCameraComponent.zFarInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zFarInner, encodedDepthCameraComponent.zFarInner);
        ShadowMapDecodeClassicMaterialContent.__lastZFar = encodedDepthCameraComponent.zFarInner;
      }
      const __webglResourceRepository = engine.webglResourceRepository;
      __webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.LightViewProjectionMatrix.str,
        true,
        this.__encodedDepthRenderPass.cameraComponent!.viewProjectionMatrix
      );
    } else {
      material.setParameter('zNearInner', encodedDepthCameraComponent.zNearInner);
      material.setParameter('zFarInner', encodedDepthCameraComponent.zFarInner);
      material.setParameter(
        'lightViewProjectionMatrix',
        this.__encodedDepthRenderPass.cameraComponent!.viewProjectionMatrix
      );
    }

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);

    // Lights
    this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);

    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
  }
}

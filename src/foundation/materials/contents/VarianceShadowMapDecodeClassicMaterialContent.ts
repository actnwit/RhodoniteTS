import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsEnum,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import { Vector4 } from '../../math/Vector4';
import { Vector3 } from '../../math/Vector3';
import {ShadingModel} from '../../definitions/ShadingModel';
import {ShaderType} from '../../definitions/ShaderType';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { VectorN } from '../../math/VectorN';
import { Scalar } from '../../math/Scalar';
import {Config} from '../../core/Config';
import { Material } from '../core/Material';
import { SkeletalComponent } from '../../components/Skeletal/SkeletalComponent';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { RenderPass } from '../../renderer/RenderPass';
import {Count} from '../../../types/CommonTypes';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MeshComponent } from '../../components/Mesh/MeshComponent';
import { BlendShapeComponent } from '../../components/BlendShape/BlendShapeComponent';
import { MutableVector4 } from '../../math/MutableVector4';
import VarianceShadowMapDecodeClassicShaderVertex from '../../../webgl/shaderity_shaders/VarianceShadowMapDecodeClassicShader/VarianceShadowMapDecodeClassicShader.vert';
import VarianceShadowMapDecodeClassicShaderFragment from '../../../webgl/shaderity_shaders/VarianceShadowMapDecodeClassicShader/VarianceShadowMapDecodeClassicShader.frag';
import {RenderingArg} from '../../../webgl/types/CommonTypes';
import {Is} from '../../misc/Is';

export class VarianceShadowMapDecodeClassicMaterialContent extends AbstractMaterialContent {
  static IsPointLight = new ShaderSemanticsClass({str: 'isPointLight'});
  static DepthTexture = new ShaderSemanticsClass({str: 'depthTexture'});
  static SquareDepthTexture = new ShaderSemanticsClass({
    str: 'squareDepthTexture',
  });
  static DepthAdjustment = new ShaderSemanticsClass({str: 'depthAdjustment'});
  static TextureDepthAdjustment = new ShaderSemanticsClass({
    str: 'textureDepthAdjustment',
  });
  static MinimumVariance = new ShaderSemanticsClass({str: 'minimumVariance'});
  static LightBleedingParameter = new ShaderSemanticsClass({
    str: 'lightBleedingParameter',
  });
  static ShadowColor = new ShaderSemanticsClass({str: 'shadowColor'});
  static AllowableDepthError = new ShaderSemanticsClass({
    str: 'allowableDepthError',
  });
  static zNearInner = new ShaderSemanticsClass({str: 'zNearInner'});
  static zFarInner = new ShaderSemanticsClass({str: 'zFarInner'});
  static DebugColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'debugColorFactor',
  });

  private static __lastZNear = 0.0;
  private static __lastZFar = 0.0;

  private __depthCameraComponent?: CameraComponent;

  /**
   * The constructor of the VarianceShadowMapDecodeClassicMaterialContent
   * @param isMorphing True if the morphing is to be applied
   * @param isSkinning True if the skeleton is to be applied
   * @param isLighting True if the lighting is to be applied. When isLighting is false, the Shader draws the original color of the material, except for the shadow area.
   * @param isDebugging True if the shader displays the DebugColorFactor color in areas outside of the depth map.
   *
   *
   *
   *
   * @param colorAttachmentsNumber The index of colorAttachment in a framebuffer. The colorAttachment must have depth information drawn by the DepthEncodeMaterialContent.
   * @param encodedDepthRenderPass The render pass where the depth information from the DepthEncodeMaterialContent is drawn to the frame buffer
   */
  constructor(
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
      null,
      'varianceShadowMapDecodeShading' +
        (isMorphing ? '+morphing' : '') +
        (isSkinning ? '+skinning' : '') +
        (isLighting ? '' : '-lighting') +
        (isDebugging ? '' : '+debugging'),
      {isMorphing, isSkinning, isLighting},
      VarianceShadowMapDecodeClassicShaderVertex,
      VarianceShadowMapDecodeClassicShaderFragment
    );

    if (encodedDepthRenderPasses.length !== 2) {
      console.error('invalid length of renderPasses');
    }

    if (depthCameraComponent == null) {
      console.warn('need to set depth camera component');
    } else {
      this.__depthCameraComponent = depthCameraComponent;
    }

    for (const encodedDepthRenderPass of encodedDepthRenderPasses) {
      const viewport = encodedDepthRenderPass.getViewport() as MutableVector4;
      viewport.setComponents(1, 1, viewport.z - 1, viewport.w - 1);
      encodedDepthRenderPass.setViewport(viewport);
    }

    let depthTexture;
    const depthFramebuffer = encodedDepthRenderPasses[0].getFramebuffer();
    if (depthFramebuffer) {
      depthTexture =
        depthFramebuffer.colorAttachments[colorAttachmentsNumberDepth];
    } else {
      console.warn('renderPass of depth does not have framebuffer');
      depthTexture = AbstractMaterialContent.__dummyBlackTexture;
    }

    let squareDepthTexture;
    const squareDepthFramebuffer = encodedDepthRenderPasses[1].getFramebuffer();
    if (squareDepthFramebuffer) {
      squareDepthTexture =
        squareDepthFramebuffer.colorAttachments[
          colorAttachmentsNumberSquareDepth
        ];
    } else {
      console.warn('renderPass of square depth does not have framebuffer');
      squareDepthTexture = AbstractMaterialContent.__dummyBlackTexture;
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.LightViewProjectionMatrix,
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: MutableMatrix44.zero(),
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
      },
      {
        semantic: ShaderSemantics.ShadingModel,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(ShadingModel.Constant.index),
        min: 0,
        max: 3,
      },
      {
        semantic: ShaderSemantics.Shininess,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(5),
        min: 0,
        max: Number.MAX_VALUE,
      },
      {
        semantic:
          VarianceShadowMapDecodeClassicMaterialContent.AllowableDepthError,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0.0001),
        min: 0,
        max: 1,
      },
      {
        semantic: VarianceShadowMapDecodeClassicMaterialContent.ShadowColor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Vector4.fromCopyArray([0.5, 0.5, 0.5, 1]),
        min: 0,
        max: 1,
      },
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
        min: 0,
        max: 2,
      },
      {
        semantic: VarianceShadowMapDecodeClassicMaterialContent.zNearInner,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0.1),
        min: 0.0001,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: VarianceShadowMapDecodeClassicMaterialContent.zFarInner,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(10000.0),
        min: 0.0001,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: VarianceShadowMapDecodeClassicMaterialContent.IsPointLight,
        componentType: ComponentType.Bool,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(1),
        min: 0,
        max: 1,
      },
      {
        semantic: ShaderSemantics.Wireframe,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Vector3.fromCopyArray([0, 0, 1]),
        min: 0,
        max: 10,
      },
      {
        semantic:
          VarianceShadowMapDecodeClassicMaterialContent.DepthAdjustment,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0.0),
        min: 0,
        max: 1,
      },
      {
        semantic:
          VarianceShadowMapDecodeClassicMaterialContent.LightBleedingParameter,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0.0),
        min: 0,
        max: 1,
      },
      {
        semantic:
          VarianceShadowMapDecodeClassicMaterialContent.MinimumVariance,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0.0000001),
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic:
          VarianceShadowMapDecodeClassicMaterialContent.TextureDepthAdjustment,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0.0),
        min: 0,
        max: 1,
      },
      {
        semantic: ShaderSemantics.NormalTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, AbstractMaterialContent.__dummyBlueTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [1, AbstractMaterialContent.__dummyWhiteTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: VarianceShadowMapDecodeClassicMaterialContent.DepthTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [2, depthTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic:
          VarianceShadowMapDecodeClassicMaterialContent.SquareDepthTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [3, squareDepthTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

    // point cloud
    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Scalar.fromCopyNumber(30.0),
        min: 0,
        max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
        min: 0,
        max: 1,
      }
    );

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';

      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.MorphTargetNumber,
          componentType: ComponentType.Int,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          isCustomSetting: true,
          soloDatum: true,
          initialValue: Scalar.fromCopyNumber(0),
          min: 0,
          max: Config.maxVertexMorphNumberInShader,
          needUniformInFastest: true,
        },
        {
          semantic: ShaderSemantics.DataTextureMorphOffsetPosition,
          componentType: ComponentType.Int,
          compositionType: CompositionType.ScalarArray,
          maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isCustomSetting: true,
          soloDatum: true,
          initialValue: new VectorN(
            new Int32Array(Config.maxVertexMorphNumberInShader)
          ),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInFastest: true,
        },
        {
          semantic: ShaderSemantics.MorphWeights,
          componentType: ComponentType.Float,
          compositionType: CompositionType.ScalarArray,
          maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isCustomSetting: true,
          soloDatum: true,
          initialValue: new VectorN(
            new Float32Array(Config.maxVertexMorphNumberInShader)
          ),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInFastest: true,
        }
      );
    }

    if (isDebugging) {
      this.__definitions += '#define RN_IS_DEBUGGING\n';
      shaderSemanticsInfoArray.push({
        semantic:
          VarianceShadowMapDecodeClassicMaterialContent.DebugColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Vector4.fromCopyArray([1, 0, 0, 1]),
        min: 0,
        max: 2,
      });
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setCustomSettingParametersToGpu({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArg;
  }) {
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.main
      ) as CameraComponent;
    }

    const encodedDepthCameraComponent =
      this.__depthCameraComponent ??
      (args.renderPass.cameraComponent as CameraComponent);

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(
        shaderProgram,
        cameraComponent,
        args.isVr,
        args.displayIdx
      );
      this.setProjection(
        shaderProgram,
        cameraComponent,
        args.isVr,
        args.displayIdx
      );

      if (
        VarianceShadowMapDecodeClassicMaterialContent.__lastZNear !==
        encodedDepthCameraComponent.zNearInner
      ) {
        (shaderProgram as any)._gl.uniform1f(
          (shaderProgram as any).zNearInner,
          encodedDepthCameraComponent.zNearInner
        );
        VarianceShadowMapDecodeClassicMaterialContent.__lastZNear =
          encodedDepthCameraComponent.zNearInner;
      }

      if (
        VarianceShadowMapDecodeClassicMaterialContent.__lastZFar !==
        encodedDepthCameraComponent.zFarInner
      ) {
        (shaderProgram as any)._gl.uniform1f(
          (shaderProgram as any).zFarInner,
          encodedDepthCameraComponent.zFarInner
        );
        VarianceShadowMapDecodeClassicMaterialContent.__lastZFar =
          encodedDepthCameraComponent.zFarInner;
      }
      const __webglResourceRepository =
        CGAPIResourceRepository.getWebGLResourceRepository();
      __webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.LightViewProjectionMatrix.str,
        true,
        encodedDepthCameraComponent.viewProjectionMatrix
      );
    } else {
      material.setParameter(
        VarianceShadowMapDecodeClassicMaterialContent.zNearInner,
        encodedDepthCameraComponent.zNearInner
      );
      material.setParameter(
        VarianceShadowMapDecodeClassicMaterialContent.zFarInner,
        encodedDepthCameraComponent.zFarInner
      );
      material.setParameter(
        ShaderSemantics.LightViewProjectionMatrix,
        encodedDepthCameraComponent.viewProjectionMatrix
      );
    }

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);

    // Lights
    this.setLightsInfo(
      shaderProgram,
      args.lightComponents,
      material,
      args.setUniform
    );

    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(
      shaderProgram,
      args.entity.getMesh(),
      args.primitive,
      blendShapeComponent
    );

    const __webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    __webglResourceRepository.setUniformValue(
      shaderProgram,
      ShaderSemantics.LightViewProjectionMatrix.str,
      true,
      encodedDepthCameraComponent.viewProjectionMatrix
    );
  }

  set depthCameraComponent(depthCameraComponent: CameraComponent) {
    this.__depthCameraComponent = depthCameraComponent;
  }
}

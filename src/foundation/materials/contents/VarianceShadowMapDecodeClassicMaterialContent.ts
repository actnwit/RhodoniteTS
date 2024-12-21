import {
  ShaderSemantics,
  ShaderSemanticsEnum,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { Vector4 } from '../../math/Vector4';
import { Vector3 } from '../../math/Vector3';
import { ShadingModel } from '../../definitions/ShadingModel';
import { ShaderType } from '../../definitions/ShaderType';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { VectorN } from '../../math/VectorN';
import { Scalar } from '../../math/Scalar';
import { Config } from '../../core/Config';
import { Material } from '../core/Material';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { RenderPass } from '../../renderer/RenderPass';
import { Count } from '../../../types/CommonTypes';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableVector4 } from '../../math/MutableVector4';
import VarianceShadowMapDecodeClassicShaderVertex from '../../../webgl/shaderity_shaders/VarianceShadowMapDecodeClassicShader/VarianceShadowMapDecodeClassicShader.vert';
import VarianceShadowMapDecodeClassicShaderFragment from '../../../webgl/shaderity_shaders/VarianceShadowMapDecodeClassicShader/VarianceShadowMapDecodeClassicShader.frag';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { dummyBlackTexture, dummyBlueTexture, dummyWhiteTexture } from '../core/DummyTextures';
import { Logger } from '../../misc/Logger';

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
      null,
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

    let depthTexture;
    const depthFramebuffer = encodedDepthRenderPasses[0].getFramebuffer();
    if (depthFramebuffer) {
      depthTexture = depthFramebuffer.colorAttachments[colorAttachmentsNumberDepth];
    } else {
      Logger.warn('renderPass of depth does not have framebuffer');
      depthTexture = dummyBlackTexture;
    }

    let squareDepthTexture;
    const squareDepthFramebuffer = encodedDepthRenderPasses[1].getFramebuffer();
    if (squareDepthFramebuffer) {
      squareDepthTexture =
        squareDepthFramebuffer.colorAttachments[colorAttachmentsNumberSquareDepth];
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

    if (isMorphing) {
      shaderSemanticsInfoArray.push(
        {
          semantic: 'morphTargetNumber',
          componentType: ComponentType.Int,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          soloDatum: true,
          initialValue: Scalar.fromCopyNumber(0),
          min: 0,
          max: Config.maxVertexMorphNumberInShader,
          needUniformInDataTextureMode: true,
        },
        {
          semantic: 'dataTextureMorphOffsetPosition',
          componentType: ComponentType.Int,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          soloDatum: true,
          initialValue: new VectorN(new Int32Array(Config.maxVertexMorphNumberInShader)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        },
        {
          semantic: 'morphWeights',
          componentType: ComponentType.Float,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          soloDatum: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        }
      );
    }

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

  _setInternalSettingParametersToGpuWebGL({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.current
      ) as CameraComponent;
    }

    const encodedDepthCameraComponent =
      this.__depthCameraComponent ?? (args.renderPass.cameraComponent as CameraComponent);

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

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
      material.setParameter(
        'lightViewProjectionMatrix',
        encodedDepthCameraComponent.viewProjectionMatrix
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

    const __webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
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

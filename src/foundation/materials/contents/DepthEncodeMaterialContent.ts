import DepthEncodeSingleShaderFragment from '../../../webgl/shaderity_shaders/DepthEncodeSingleShader/DepthEncodeSingleShader.frag';
import DepthEncodeSingleShaderVertex from '../../../webgl/shaderity_shaders/DepthEncodeSingleShader/DepthEncodeSingleShader.vert';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';

/**
 * Material content for depth encoding functionality.
 * This class handles encoding depth information into textures for shadow mapping and depth-based effects.
 */
export class DepthEncodeMaterialContent extends AbstractMaterialContent {
  /** Shader semantic for the inner z-near clipping plane value */
  static zNearInner = new ShaderSemanticsClass({ str: 'zNearInner' });

  /** Shader semantic for the inner z-far clipping plane value */
  static zFarInner = new ShaderSemanticsClass({ str: 'zFarInner' });

  /** Shader semantic to indicate if the light source is a point light */
  static isPointLight = new ShaderSemanticsClass({ str: 'isPointLight' });

  /** Shader semantic for the depth power factor used in depth encoding */
  static depthPow = new ShaderSemanticsClass({ str: 'depthPow' });

  /** Cached value of the last z-near plane to avoid unnecessary uniform updates */
  private __lastZNear = 0.0;

  /** Cached value of the last z-far plane to avoid unnecessary uniform updates */
  private __lastZFar = 0.0;

  /**
   * Creates a new DepthEncodeMaterialContent instance.
   *
   * @param materialName - The name identifier for this material
   * @param depthPow - The power factor for depth encoding (1.0-2.0 range)
   * @param options - Configuration options for the material
   * @param options.isSkinning - Whether skeletal animation skinning is enabled
   */
  constructor(materialName: string, depthPow: number, { isSkinning }: { isSkinning: boolean }) {
    super(
      materialName,
      { isMorphing: false, isSkinning, isLighting: false },
      DepthEncodeSingleShaderVertex,
      DepthEncodeSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
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
        semantic: 'depthPow',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(depthPow),
        min: 1,
        max: 2,
      },
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
      },
    ];

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  /**
   * Sets internal shader parameters specific to depth encoding for WebGL rendering.
   * This method configures camera-related parameters and handles uniform updates
   * for the depth encoding shader.
   *
   * @param params - Parameters for setting internal WebGL settings
   * @param params.material - The material instance being configured
   * @param params.shaderProgram - The WebGL shader program to configure
   * @param params.firstTime - Whether this is the first time setting parameters
   * @param params.args - WebGL rendering arguments containing camera and entity data
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial({
    engine,
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    engine: Engine;
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    let cameraComponent = args.renderPass.cameraComponent as CameraComponent;
    if (cameraComponent == null) {
      cameraComponent = engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(engine)
      ) as CameraComponent;
    }

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

      if (firstTime || this.__lastZNear !== cameraComponent.zNearInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zNearInner, cameraComponent.zNearInner);
        this.__lastZNear = cameraComponent.zNearInner;
      }

      if (this.__lastZFar !== cameraComponent.zFarInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zFarInner, cameraComponent.zFarInner);
        this.__lastZFar = cameraComponent.zFarInner;
      }
    } else {
      material.setParameter('zNearInner', cameraComponent.zNearInner);
      material.setParameter('zFarInner', cameraComponent.zFarInner);
    }

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
  }
}

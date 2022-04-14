import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import {ComponentType} from '../../definitions/ComponentType';
import {CompositionType} from '../../definitions/CompositionType';
import { Material } from '../core/Material';
import { Scalar } from '../../math/Scalar';
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import {ShaderType} from '../../definitions/ShaderType';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import { SkeletalComponent } from '../../components/Skeletal/SkeletalComponent';
import { Vector3 } from '../../math/Vector3';
import DepthEncodeSingleShaderVertex from '../../../webgl/shaderity_shaders/DepthEncodeSingleShader/DepthEncodeSingleShader.vert';
import DepthEncodeSingleShaderFragment from '../../../webgl/shaderity_shaders/DepthEncodeSingleShader/DepthEncodeSingleShader.frag';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { Is } from '../../misc/Is';

export class DepthEncodeMaterialContent extends AbstractMaterialContent {
  static zNearInner = new ShaderSemanticsClass({str: 'zNearInner'});
  static zFarInner = new ShaderSemanticsClass({str: 'zFarInner'});
  static isPointLight = new ShaderSemanticsClass({str: 'isPointLight'});
  static depthPow = new ShaderSemanticsClass({str: 'depthPow'});

  private __lastZNear = 0.0;
  private __lastZFar = 0.0;

  constructor(depthPow: number, {isSkinning}: {isSkinning: boolean}) {
    super(
      null,
      'depthEncodeShading' + (isSkinning ? '+skinning' : ''),
      {isMorphing: false, isSkinning, isLighting: false},
      DepthEncodeSingleShaderVertex,
      DepthEncodeSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: DepthEncodeMaterialContent.zNearInner,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(0.1),
        min: 0.0001,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: DepthEncodeMaterialContent.zFarInner,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(10000.0),
        min: 0.0001,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: DepthEncodeMaterialContent.isPointLight,
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
        semantic: DepthEncodeMaterialContent.depthPow,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(depthPow),
        min: 1,
        max: 2,
      },
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
      },
    ];

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING';
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
    let cameraComponent = args.renderPass.cameraComponent as CameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.current
      ) as CameraComponent;
    }

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

      if (firstTime || this.__lastZNear !== cameraComponent.zNearInner) {
        (shaderProgram as any)._gl.uniform1f(
          (shaderProgram as any).zNearInner,
          cameraComponent.zNearInner
        );
        this.__lastZNear = cameraComponent.zNearInner;
      }

      if (this.__lastZFar !== cameraComponent.zFarInner) {
        (shaderProgram as any)._gl.uniform1f(
          (shaderProgram as any).zFarInner,
          cameraComponent.zFarInner
        );
        this.__lastZFar = cameraComponent.zFarInner;
      }
    } else {
      material.setParameter(
        DepthEncodeMaterialContent.zNearInner,
        cameraComponent.zNearInner
      );
      material.setParameter(
        DepthEncodeMaterialContent.zFarInner,
        cameraComponent.zFarInner
      );
    }

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
  }
}

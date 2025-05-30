import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Material } from '../core/Material';
import { Scalar } from '../../math/Scalar';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { ShaderType } from '../../definitions/ShaderType';
import { Vector3 } from '../../math/Vector3';
import DepthEncodeSingleShaderVertex from '../../../webgl/shaderity_shaders/DepthEncodeSingleShader/DepthEncodeSingleShader.vert';
import DepthEncodeSingleShaderFragment from '../../../webgl/shaderity_shaders/DepthEncodeSingleShader/DepthEncodeSingleShader.frag';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';

export class DepthEncodeMaterialContent extends AbstractMaterialContent {
  static zNearInner = new ShaderSemanticsClass({ str: 'zNearInner' });
  static zFarInner = new ShaderSemanticsClass({ str: 'zFarInner' });
  static isPointLight = new ShaderSemanticsClass({ str: 'isPointLight' });
  static depthPow = new ShaderSemanticsClass({ str: 'depthPow' });

  private __lastZNear = 0.0;
  private __lastZFar = 0.0;

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

  _setInternalSettingParametersToGpuWebGLPerMaterial({
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
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

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
      material.setParameter('zNearInner', cameraComponent.zNearInner);
      material.setParameter('zFarInner', cameraComponent.zFarInner);
    }

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
  }
}

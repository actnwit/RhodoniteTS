import AbstractMaterialNode from '../core/AbstractMaterialNode';
import CameraComponent from '../../components/Camera/CameraComponent';
import ComponentRepository from '../../core/ComponentRepository';
import {ComponentType} from '../../definitions/ComponentType';
import {CompositionType} from '../../definitions/CompositionType';
import Material from '../core/Material';
import Scalar from '../../math/Scalar';
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
} from '../../definitions/ShaderSemantics';
import {ShaderType} from '../../definitions/ShaderType';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import {ShadingModel} from '../../definitions/ShadingModel';
import Vector3 from '../../math/Vector3';
import Vector4 from '../../math/Vector4';

import ClassicSingleShaderVertex from '../../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.vert';
import ClassicSingleShaderFragment from '../../../webgl/shaderity_shaders/ClassicSingleShader/ClassicSingleShader.frag';
import {AlphaModeEnum} from '../../definitions/AlphaMode';
import { RenderingArg } from '../../../webgl/types/CommomTypes';
import { Is } from '../../misc/Is';

export default class ClassicShadingSingleMaterialNode extends AbstractMaterialNode {
  constructor({
    isSkinning,
    isLighting,
    alphaMode,
  }: {
    isSkinning: boolean;
    isLighting: boolean;
    alphaMode: AlphaModeEnum;
  }) {
    super(
      null,
      'classicShading' +
        (isSkinning ? '+skinning' : '') +
        (isLighting ? '' : '-lighting') +
        ' alpha_' +
        alphaMode.str.toLowerCase(),
      {isMorphing: false, isLighting: isLighting, isSkinning: isSkinning},
      ClassicSingleShaderVertex,
      ClassicSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.ShadingModel,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(ShadingModel.Constant.index),
        min: 0,
        max: 3,
      },
      {
        semantic: ShaderSemantics.Shininess,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(5),
        min: 0,
        max: Number.MAX_VALUE,
      },
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
        min: 0,
        max: 2,
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, AbstractMaterialNode.__dummyWhiteTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.NormalTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [1, AbstractMaterialNode.__dummyBlueTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader,
        isSystem: false,
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
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
        min: 0,
        max: 1,
      }
    );

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    this.__definitions += '#define RN_IS_ALPHAMODE_' + alphaMode.str + '\n';
    shaderSemanticsInfoArray.push({
      semantic: ShaderSemantics.AlphaCutoff,
      componentType: ComponentType.Float,
      compositionType: CompositionType.Scalar,
      stage: ShaderType.PixelShader,
      min: 0,
      max: 1.0,
      isSystem: false,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
      initialValue: Scalar.fromCopyNumber(0.01),
    });

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({
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
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    if (firstTime || args.isVr) {
      let cameraComponent = args.renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = ComponentRepository.getInstance().getComponent(
          CameraComponent,
          CameraComponent.main
        ) as CameraComponent;
      }
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
    }

    if (firstTime) {
      // Lights
      this.setLightsInfo(
        shaderProgram,
        args.lightComponents,
        material,
        args.setUniform
      );
      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
    }
  }
}

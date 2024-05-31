import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { ShaderType } from '../../definitions/ShaderType';
import { Vector2 } from '../../math/Vector2';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { Material } from '../core/Material';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import FurnaceTestShaderVertex from '../../../webgl/shaderity_shaders/FurnaceTestShader/FurnaceTestShader.vert';
import FurnaceTestShaderFragment from '../../../webgl/shaderity_shaders/FurnaceTestShader/FurnaceTestShader.frag';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { dummyWhiteTexture } from '../core/DummyTextures';

export class FurnaceTestMaterialContent extends AbstractMaterialContent {
  static mode = new ShaderSemanticsClass({ str: 'mode' });
  static debugView = new ShaderSemanticsClass({ str: 'debugView' });
  static g_type = new ShaderSemanticsClass({ str: 'g_type' });
  static disable_fresnel = new ShaderSemanticsClass({ str: 'disable_fresnel' });
  static f0 = new ShaderSemanticsClass({ str: 'f0' });

  constructor() {
    super(null, 'FurnaceTestShading', {}, FurnaceTestShaderVertex, FurnaceTestShaderFragment);

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: FurnaceTestMaterialContent.debugView,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1,
      },
      {
        semantic: FurnaceTestMaterialContent.disable_fresnel,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1,
      },
      {
        semantic: FurnaceTestMaterialContent.f0,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(1),
        min: 0,
        max: 1,
      },
      {
        semantic: FurnaceTestMaterialContent.g_type,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 3,
      },
      {
        semantic: FurnaceTestMaterialContent.mode,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1,
      },
      {
        semantic: ShaderSemantics.ScreenInfo,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec2,
        stage: ShaderType.PixelShader,
        initialValue: Vector2.fromCopyArray2([0, 0]),
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.MetallicRoughnessFactor,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec2,
        stage: ShaderType.PixelShader,
        initialValue: Vector2.fromCopyArray2([1, 1]),
        min: 0,
        max: 2,
      },
      {
        semantic: ShaderSemantics.MetallicRoughnessTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [1, dummyWhiteTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];
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
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);

      if (firstTime) {
        /// Matrices
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getComponent(
            CameraComponent,
            CameraComponent.current
          ) as CameraComponent;
        }
        this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
        this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

        // Lights
        this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
      }
    }
  }
}

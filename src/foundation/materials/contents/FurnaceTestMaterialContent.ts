import FurnaceTestShaderFragment from '../../../webgl/shaderity_shaders/FurnaceTestShader/FurnaceTestShader.frag';
import FurnaceTestShaderVertex from '../../../webgl/shaderity_shaders/FurnaceTestShader/FurnaceTestShader.vert';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import type { Engine } from '../../system/Engine';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';

/**
 * Material content for furnace test rendering.
 * This material is used for testing PBR (Physically Based Rendering) materials
 * with controlled lighting conditions similar to a furnace test environment.
 */
export class FurnaceTestMaterialContent extends AbstractMaterialContent {
  static mode = new ShaderSemanticsClass({ str: 'mode' });
  static debugView = new ShaderSemanticsClass({ str: 'debugView' });
  static g_type = new ShaderSemanticsClass({ str: 'g_type' });
  static disable_fresnel = new ShaderSemanticsClass({ str: 'disable_fresnel' });
  static f0 = new ShaderSemanticsClass({ str: 'f0' });

  /**
   * Creates a new FurnaceTestMaterialContent instance.
   *
   * @param engine - The engine instance
   * @param materialName - The name identifier for this material
   */
  constructor(engine: Engine, materialName: string) {
    super(materialName, {}, FurnaceTestShaderVertex, FurnaceTestShaderFragment, engine);

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: 'debugView',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1,
      },
      {
        semantic: 'disable_fresnel',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1,
      },
      {
        semantic: 'f0',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(1),
        min: 0,
        max: 1,
      },
      {
        semantic: 'g_type',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 3,
      },
      {
        semantic: 'mode',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(0),
        min: 0,
        max: 1,
      },
      {
        semantic: 'screenInfo',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec2,
        stage: ShaderType.PixelShader,
        initialValue: Vector2.fromCopyArray2([0, 0]),
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'metallicRoughnessFactor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec2,
        stage: ShaderType.PixelShader,
        initialValue: Vector2.fromCopyArray2([1, 1]),
        min: 0,
        max: 2,
      },
      {
        semantic: 'metallicRoughnessTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [1, engine.dummyTextures.dummyWhiteTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  /**
   * Sets internal rendering parameters to GPU for WebGL per material.
   * This method configures shader uniforms including matrices, camera information,
   * and lighting data required for furnace test rendering.
   *
   * @param params - The rendering parameters object
   * @param params.engine - The engine instance
   * @param params.material - The material instance being rendered
   * @param params.shaderProgram - The WebGL shader program to configure
   * @param params.firstTime - Whether this is the first time setting up this shader program
   * @param params.args - WebGL rendering arguments containing matrices, camera, and lighting data
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
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);

      if (firstTime) {
        /// Matrices
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = engine.componentRepository.getComponent(
            CameraComponent,
            CameraComponent.getCurrent(engine)
          ) as CameraComponent;
        }
        this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
        this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

        // Lights
        this.setLightsInfo(engine.config, shaderProgram, args.lightComponents, material, args.setUniform);
      }
    }
  }
}

import DetectHighLuminanceAndCorrectShaderFragment from '../../../webgl/shaderity_shaders/DetectHighLuminanceAndCorrectShader/DetectHighLuminanceAndCorrectShader.frag';
import DetectHighLuminanceAndCorrectShaderVertex from '../../../webgl/shaderity_shaders/DetectHighLuminanceAndCorrectShader/DetectHighLuminanceAndCorrectShader.vert';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import DetectHighLuminanceAndCorrectShaderFragmentWebGpu from '../../../webgpu/shaderity_shaders/DetectHighLuminanceAndCorrectShader/DetectHighLuminanceAndCorrectShader.frag';
import DetectHighLuminanceAndCorrectShaderVertexWebGpu from '../../../webgpu/shaderity_shaders/DetectHighLuminanceAndCorrectShader/DetectHighLuminanceAndCorrectShader.vert';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { TextureParameter } from '../../definitions';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { ShaderSemantics, ShaderSemanticsClass, type ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { Scalar } from '../../math/Scalar';
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { Sampler } from '../../textures/Sampler';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';

/**
 * A material content class that detects high luminance areas in textures and applies correction.
 * This is typically used for bloom effects or tone mapping where bright areas need to be identified.
 */
export class DetectHighLuminanceMaterialContent extends AbstractMaterialContent {
  /**
   * Shader semantic for the luminance criterion threshold value.
   * This determines the minimum luminance value to be considered as "high luminance".
   */
  static LuminanceCriterion: ShaderSemanticsEnum = new ShaderSemanticsClass({
    str: 'luminanceCriterion',
  });
  // static LuminanceReduce: ShaderSemanticsEnum = new ShaderSemanticsClass({
  //   str: 'luminanceReduce',
  // });

  /**
   * Creates a new DetectHighLuminanceMaterialContent instance.
   *
   * @param engine - The engine instance
   * @param materialName - The name identifier for this material
   * @param textureToDetectHighLuminance - The source texture to analyze for high luminance areas
   */
  constructor(engine: Engine, materialName: string, textureToDetectHighLuminance: AbstractTexture) {
    super(materialName, {}, undefined, undefined, engine);

    const sampler = new Sampler(engine, {
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
    });
    sampler.create();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: 'luminanceCriterion',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(2),
        min: 0,
        max: Number.MAX_VALUE,
      },
      // {
      //   semantic: DetectHighLuminanceMaterialContent.LuminanceReduce,
      //   componentType: ComponentType.Float,
      //   compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader,
      //   initialValue: Scalar.fromCopyNumber(0.25),
      //   min: 0,
      //   max: 1,
      // },
      {
        semantic: 'baseColorTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [1, textureToDetectHighLuminance, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this.setVertexShaderityObject(DetectHighLuminanceAndCorrectShaderVertexWebGpu);
      this.setPixelShaderityObject(DetectHighLuminanceAndCorrectShaderFragmentWebGpu);
    } else {
      this.setVertexShaderityObject(DetectHighLuminanceAndCorrectShaderVertex);
      this.setPixelShaderityObject(DetectHighLuminanceAndCorrectShaderFragment);
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  /**
   * Sets internal GPU parameters for WebGL rendering on a per-material basis.
   * This method configures matrices and camera-related uniforms for the shader.
   *
   * @param params - The parameters object containing material, shader program, and rendering arguments
   * @param params.material - The material instance being rendered
   * @param params.shaderProgram - The WebGL shader program to configure
   * @param params.firstTime - Whether this is the first time setting up this material
   * @param params.args - WebGL rendering arguments including world matrix, render pass, and camera info
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial({
    engine,
    shaderProgram,
    args,
  }: {
    engine: Engine;
    shaderProgram: WebGLProgram;
    args: RenderingArgWebGL;
  }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      /// Matrices
      let cameraComponent = args.renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = engine.componentRepository.getComponent(
          CameraComponent,
          CameraComponent.getCurrent(engine)
        ) as CameraComponent;
      }
      if (cameraComponent) {
        this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
        this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      }
    }
  }
}

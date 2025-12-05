import type { Count } from '../../../types/CommonTypes';
import SynthesizeHDRTextureShaderFragment from '../../../webgl/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.frag';
import SynthesizeHDRTextureShaderVertex from '../../../webgl/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.vert';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import SynthesizeHDRTextureShaderFragmentWebGpu from '../../../webgpu/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.frag';
import SynthesizeHDRTextureShaderVertexWebGpu from '../../../webgpu/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.vert';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { TextureParameter } from '../../definitions/TextureParameter';
import { VectorN } from '../../math/VectorN';
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { Sampler } from '../../textures/Sampler';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';

/**
 * Material content for synthesizing HDR textures with optional target region masking.
 * This material is commonly used for glare effects and other post-processing operations.
 */
export class SynthesizeHdrMaterialContent extends AbstractMaterialContent {
  static SynthesizeCoefficient = new ShaderSemanticsClass({
    str: 'synthesizeCoefficient',
  });
  static TargetRegionTexture = new ShaderSemanticsClass({
    str: 'targetRegionTexture',
  });
  static SynthesizeTexture0 = new ShaderSemanticsClass({
    str: 'synthesizeTexture0',
  });
  static SynthesizeTexture1 = new ShaderSemanticsClass({
    str: 'synthesizeTexture1',
  });
  static SynthesizeTexture2 = new ShaderSemanticsClass({
    str: 'synthesizeTexture2',
  });
  static SynthesizeTexture3 = new ShaderSemanticsClass({
    str: 'synthesizeTexture3',
  });
  static SynthesizeTexture4 = new ShaderSemanticsClass({
    str: 'synthesizeTexture4',
  });
  static SynthesizeTexture5 = new ShaderSemanticsClass({
    str: 'synthesizeTexture5',
  });

  private textureNumber: Count;

  /**
   * Creates a new SynthesizeHdrMaterialContent instance for HDR texture synthesis.
   *
   * This material node supports texture synthesis operations commonly used for glare effects
   * and other post-processing operations. It can synthesize up to 6 textures simultaneously.
   *
   * **Synthesis Behavior:**
   * - **Without targetRegionTexture**: Synthesizes all input textures across all pixels,
   *   weighted by the corresponding synthesizeCoefficient values.
   * - **With targetRegionTexture**: Applies weighted synthesis only to non-white pixels
   *   (where color != (1.0, 1.0, 1.0, 1.0)). White areas receive the product of
   *   synthesizeTextures[0] and synthesizeCoefficient[0].
   *
   * @param materialName - Unique identifier for this material instance
   * @param synthesizeTextures - Array of textures to be synthesized (supports up to 6 textures)
   *
   * @example
   * ```typescript
   * const synthesizeTextures = [texture1, texture2, texture3];
   * const material = new SynthesizeHdrMaterialContent('GlareMaterial', synthesizeTextures);
   * ```
   */
  constructor(engine: Engine, materialName: string, synthesizeTextures: AbstractTexture[]) {
    super(materialName, {}, undefined, undefined, engine);

    this.textureNumber = synthesizeTextures.length;

    const sampler = new Sampler(engine, {
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
    });
    sampler.create();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: 'synthesizeCoefficient',
        componentType: ComponentType.Float,
        compositionType: CompositionType.ScalarArray,
        arrayLength: 6,
        stage: ShaderType.PixelShader,
        initialValue: new VectorN(new Float32Array(6)),
        min: 0,
        max: 1,
        needUniformInDataTextureMode: true,
      },
      {
        semantic: 'synthesizeTexture0',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [0, synthesizeTextures[0] ?? engine.dummyTextures.dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture1',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [1, synthesizeTextures[1] ?? engine.dummyTextures.dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture2',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [2, synthesizeTextures[2] ?? engine.dummyTextures.dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture3',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [3, synthesizeTextures[3] ?? engine.dummyTextures.dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture4',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [4, synthesizeTextures[4] ?? engine.dummyTextures.dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture5',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [5, synthesizeTextures[5] ?? engine.dummyTextures.dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this.setVertexShaderityObject(SynthesizeHDRTextureShaderVertexWebGpu);
      this.setPixelShaderityObject(SynthesizeHDRTextureShaderFragmentWebGpu);
    } else {
      this.setVertexShaderityObject(SynthesizeHDRTextureShaderVertex);
      this.setPixelShaderityObject(SynthesizeHDRTextureShaderFragment);
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  /**
   * Sets internal WebGL-specific parameters for the material during rendering.
   *
   * This method is called during the WebGL rendering pipeline to configure
   * shader uniforms and state specific to this material. It handles matrix
   * transformations and synthesis coefficient updates.
   *
   * @param params - Configuration object containing material and rendering context
   * @param params.material - The material instance being rendered
   * @param params.shaderProgram - WebGL shader program to configure
   * @param params.firstTime - Whether this is the first time setting parameters
   * @param params.args - WebGL rendering arguments and context
   *
   * @internal This method is part of the internal rendering pipeline
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
    (shaderProgram as any)._gl.uniform1fv(
      (shaderProgram as any).synthesizeCoefficient,
      material.getParameter('synthesizeCoefficient')._v
    );
  }

  /**
   * Gets the number of textures configured for synthesis.
   *
   * @returns The count of textures that will be processed during synthesis
   *
   * @example
   * ```typescript
   * const material = new SynthesizeHdrMaterialContent('test', [tex1, tex2]);
   * console.log(material.synthesizeTextureNumber); // 2
   * ```
   */
  get synthesizeTextureNumber() {
    return this.textureNumber;
  }
}

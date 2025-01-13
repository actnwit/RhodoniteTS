import { AbstractTexture } from '../../textures/AbstractTexture';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Count } from '../../../types/CommonTypes';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { ShaderType } from '../../definitions/ShaderType';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import { VectorN } from '../../math/VectorN';
import SynthesizeHDRTextureShaderVertex from '../../../webgl/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.vert';
import SynthesizeHDRTextureShaderFragment from '../../../webgl/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.frag';
import SynthesizeHDRTextureShaderVertexWebGpu from '../../../webgpu/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.vert';
import SynthesizeHDRTextureShaderFragmentWebGpu from '../../../webgpu/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.frag';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { dummyBlackTexture, dummyZeroTexture } from '../core/DummyTextures';
import { Sampler } from '../../textures/Sampler';
import { TextureParameter } from '../../definitions/TextureParameter';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

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
   * This material node uses for the glare effect and so on.
   *
   * If the targetRegionTexture is not specified, the shader synthesizes all the
   * synthesizeTextures with all the pixels weighted by the synthesizeCoefficient.
   *
   * If the targetRegionTexture is specified, the shader synthesizes all the
   * synthesizeTextures with weights only for the non-white pixels of
   * targetRegionTexture (where the color is not (1.0, 1.0, 1.0, 1.0)). On the other
   * hand, in the white area, the output value is the product of the value of each
   * pixel in synthesizeTextures[0] and synthesizeCoefficient[0].
   *
   * @synthesizeTextures Textures to be synthesized. The shader supports up to six texture syntheses.
   * @targetRegionTexture Texture to specify the area where the texture will be synthesized
   */
  constructor(materialName: string, synthesizeTextures: AbstractTexture[]) {
    super(materialName, {});

    this.textureNumber = synthesizeTextures.length;

    const sampler = new Sampler({
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
        initialValue: [0, synthesizeTextures[0] ?? dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture1',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [1, synthesizeTextures[1] ?? dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture2',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [2, synthesizeTextures[2] ?? dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture3',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [3, synthesizeTextures[3] ?? dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture4',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [4, synthesizeTextures[4] ?? dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'synthesizeTexture5',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [5, synthesizeTextures[5] ?? dummyZeroTexture, sampler],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this.__vertexShaderityObject = SynthesizeHDRTextureShaderVertexWebGpu;
      this.__pixelShaderityObject = SynthesizeHDRTextureShaderFragmentWebGpu;
    } else {
      this.__vertexShaderityObject = SynthesizeHDRTextureShaderVertex;
      this.__pixelShaderityObject = SynthesizeHDRTextureShaderFragment;
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
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);

      /// Matrices
      let cameraComponent = args.renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = ComponentRepository.getComponent(
          CameraComponent,
          CameraComponent.current
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

  get synthesizeTextureNumber() {
    return this.textureNumber;
  }
}

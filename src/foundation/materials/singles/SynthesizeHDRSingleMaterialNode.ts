import AbstractTexture from '../../textures/AbstractTexture';
import LightComponent from '../../components/Camera/CameraComponent';
import ComponentRepository from '../../core/ComponentRepository';
import {ComponentType} from '../../definitions/ComponentType';
import {CompositionType} from '../../definitions/CompositionType';
import {Count} from '../../../types/CommonTypes';
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import {ShaderType} from '../../definitions/ShaderType';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import AbstractMaterialNode from '../core/AbstractMaterialNode';
import Material from '../core/Material';
import VectorN from '../../math/VectorN';
import Scalar from '../../math/Scalar';
import SynthesizeHDRTextureShaderVertex from '../../../webgl/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.vert';
import SynthesizeHDRTextureShaderFragment from '../../../webgl/shaderity_shaders/SynthesizeHDRTextureShader/SynthesizeHDRTextureShader.frag';
import { RenderingArg } from '../../../webgl/types/CommomTypes';

export default class SynthesizeHDRMaterialNode extends AbstractMaterialNode {
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

  private existTargetRegion: boolean;
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
  constructor(
    synthesizeTextures: AbstractTexture[],
    targetRegionTexture: AbstractTexture = AbstractMaterialNode.dummyBlackTexture
  ) {
    super(
      null,
      'synthesizeHDRTextureShading',
      {},
      SynthesizeHDRTextureShaderVertex,
      SynthesizeHDRTextureShaderFragment
    );

    this.existTargetRegion = targetRegionTexture != null ? true : false;
    this.textureNumber = synthesizeTextures.length;

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.FramebufferWidth,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: Scalar.fromCopyNumber(synthesizeTextures[0].width),
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: SynthesizeHDRMaterialNode.SynthesizeCoefficient,
        componentType: ComponentType.Float,
        compositionType: CompositionType.ScalarArray,
        maxIndex: 6,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        soloDatum: false,
        initialValue: new VectorN(new Float32Array(6)),
        min: 0,
        max: 1,
        needUniformInFastest: true,
      },
      {
        semantic: SynthesizeHDRMaterialNode.SynthesizeTexture0,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [
          0,
          synthesizeTextures[0] ?? AbstractMaterialNode.dummyBlackTexture,
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: SynthesizeHDRMaterialNode.SynthesizeTexture1,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [
          1,
          synthesizeTextures[1] ?? AbstractMaterialNode.dummyBlackTexture,
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: SynthesizeHDRMaterialNode.SynthesizeTexture2,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [
          2,
          synthesizeTextures[2] ?? AbstractMaterialNode.dummyBlackTexture,
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: SynthesizeHDRMaterialNode.SynthesizeTexture3,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [
          3,
          synthesizeTextures[3] ?? AbstractMaterialNode.dummyBlackTexture,
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: SynthesizeHDRMaterialNode.SynthesizeTexture4,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [
          4,
          synthesizeTextures[4] ?? AbstractMaterialNode.dummyBlackTexture,
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: SynthesizeHDRMaterialNode.SynthesizeTexture5,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [
          5,
          synthesizeTextures[5] ?? AbstractMaterialNode.dummyBlackTexture,
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: SynthesizeHDRMaterialNode.TargetRegionTexture,
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [6, targetRegionTexture],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
    ];

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
    } else {
      (shaderProgram as any)._gl.uniform1fv(
        (shaderProgram as any).synthesizeCoefficient,
        material.getParameter(SynthesizeHDRMaterialNode.SynthesizeCoefficient)
          ._v
      );
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(
        LightComponent,
        LightComponent.main
      ) as LightComponent;
    }
    if (cameraComponent) {
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
  }

  get existTargetRegionTexture() {
    return this.existTargetRegion;
  }

  get synthesizeTextureNumber() {
    return this.textureNumber;
  }
}

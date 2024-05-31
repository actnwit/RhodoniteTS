import { AbstractTexture } from '../../textures/AbstractTexture';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { ShaderSemanticsClass, ShaderSemantics } from '../../definitions/ShaderSemantics';
import { ShaderType } from '../../definitions/ShaderType';
import { Texture } from '../../textures/Texture';
import { Vector3 } from '../../math/Vector3';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { Material } from '../core/Material';
import MatCapShaderVertex from '../../../webgl/shaderity_shaders/MatCapShader/MatCapShader.vert';
import MatCapShaderFragment from '../../../webgl/shaderity_shaders/MatCapShader/MatCapShader.frag';
import { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { Sampler } from '../../textures/Sampler';
import { dummyBlackTexture } from '../core/DummyTextures';

export class MatCapMaterialContent extends AbstractMaterialContent {
  static MatCapTexture = new ShaderSemanticsClass({ str: 'matCapTexture' });

  constructor(isSkinning: boolean, uri?: string, texture?: AbstractTexture, sampler?: Sampler) {
    super(
      null,
      'MatCapShading' + (isSkinning ? '+skinning' : ''),
      { isSkinning: isSkinning },
      MatCapShaderVertex,
      MatCapShaderFragment
    );

    let matCapTexture;
    if (typeof uri === 'string') {
      matCapTexture = new Texture();
      (async function (uri: string) {
        matCapTexture.generateTextureFromUri(uri, {
          type: ComponentType.UnsignedByte,
        });
        await matCapTexture.loadFromUrlLazy();
      })(uri);
    } else if (texture instanceof AbstractTexture) {
      matCapTexture = texture;
    } else {
      console.warn('no matcap texture');
      matCapTexture = dummyBlackTexture;
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    shaderSemanticsInfoArray.push({
      semantic: ShaderSemantics.Wireframe,
      componentType: ComponentType.Float,
      compositionType: CompositionType.Vec3,
      stage: ShaderType.PixelShader,
      initialValue: Vector3.fromCopyArray([0, 0, 1]),
      min: 0,
      max: 10,
    });

    // point cloud
    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader,
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
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
        min: 0,
        max: 1,
      }
    );

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    shaderSemanticsInfoArray.push({
      semantic: MatCapMaterialContent.MatCapTexture,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [0, matCapTexture, sampler],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    });

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
    }

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

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
  }
}

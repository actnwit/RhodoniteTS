import MatCapShaderFragment from '../../../webgl/shaderity_shaders/MatCapShader/MatCapShader.frag';
import MatCapShaderVertex from '../../../webgl/shaderity_shaders/MatCapShader/MatCapShader.vert';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Logger } from '../../misc/Logger';
import type { Engine } from '../../system/Engine';
import { AbstractTexture } from '../../textures/AbstractTexture';
import type { Sampler } from '../../textures/Sampler';
import { Texture } from '../../textures/Texture';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';

/**
 * Material content implementation for MatCap (Material Capture) rendering.
 * MatCap is a technique that captures material appearance from a sphere under specific lighting conditions
 * and applies it to 3D objects for realistic material representation.
 */
export class MatCapMaterialContent extends AbstractMaterialContent {
  static MatCapTexture = new ShaderSemanticsClass({ str: 'matCapTexture' });

  /**
   * Creates a new MatCap material content instance.
   *
   * @param engine - The engine instance
   * @param materialName - The name identifier for this material
   * @param isSkinning - Whether this material supports skeletal animation/skinning
   * @param uri - Optional URI to load the MatCap texture from
   * @param texture - Optional pre-existing texture to use as the MatCap texture
   * @param sampler - Optional sampler settings for texture sampling behavior
   */
  constructor(
    engine: Engine,
    materialName: string,
    isSkinning: boolean,
    uri?: string,
    texture?: AbstractTexture,
    sampler?: Sampler
  ) {
    super(materialName, { isSkinning: isSkinning }, MatCapShaderVertex, MatCapShaderFragment, engine);

    let matCapTexture: any;
    if (typeof uri === 'string') {
      matCapTexture = new Texture(engine);
      (async (uri: string) => {
        await matCapTexture.generateTextureFromUrl(uri, {
          type: ComponentType.UnsignedByte,
        });
      })(uri);
    } else if (texture instanceof AbstractTexture) {
      matCapTexture = texture;
    } else {
      Logger.default.warn('no matcap texture');
      matCapTexture = engine.dummyTextures.dummyBlackTexture;
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    shaderSemanticsInfoArray.push({
      semantic: 'wireframe',
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
      }
    );

    shaderSemanticsInfoArray.push({
      semantic: 'matCapTexture',
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: ShaderType.PixelShader,
      initialValue: [1, matCapTexture, sampler],
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    });

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  /**
   * Sets internal GPU parameters specific to MatCap material rendering for WebGL.
   * This method configures uniforms and matrices required for proper MatCap material rendering,
   * including world transformations, camera settings, and skeletal animation support.
   *
   * @param params - Configuration object containing rendering parameters
   * @param params.engine - The engine instance
   * @param params.shaderProgram - The WebGL shader program to configure
   * @param params.args - WebGL rendering arguments containing matrices, camera, and entity data
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
      this.setNormalMatrix(shaderProgram, args.normalMatrix);

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

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(engine.config, shaderProgram, args.setUniform, skeletalComponent);
    }
  }
}

import { AbstractMaterialContent } from '../core/AbstractMaterialContent';

import type { Vrm1_Material } from '../../../types/VRMC_materials_mtoon';
import mToon1SingleShaderFragment from '../../../webgl/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.frag.glsl';
import mToon1SingleShaderVertex from '../../../webgl/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.vert.glsl';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import mToon1SingleShaderFragmentWebGpu from '../../../webgpu/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.frag.wgsl';
import mToon1SingleShaderVertexWebGpu from '../../../webgpu/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.vert.wgsl';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { Config } from '../../core/Config';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { HdriFormat } from '../../definitions/HdriFormat';
import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { TextureParameter } from '../../definitions/TextureParameter';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector4 } from '../../math/MutableVector4';
import { VectorN } from '../../math/VectorN';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { Sampler } from '../../textures/Sampler';
import { dummyBlackCubeTexture } from '../core/DummyTextures';
import type { Material } from '../core/Material';

/**
 * Material content implementation for MToon 1.0 specification.
 * MToon is a toon shading material specification designed primarily for VRM avatars.
 * This class handles shader compilation, parameter setup, and rendering for MToon materials.
 */
export class MToon1MaterialContent extends AbstractMaterialContent {
  /** Static sampler for diffuse IBL cube map with linear filtering and edge clamping */
  private static __diffuseIblCubeMapSampler = new Sampler({
    minFilter: TextureParameter.Linear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
    wrapR: TextureParameter.ClampToEdge,
  });

  /** Static sampler for specular IBL cube map with mipmap support and edge clamping */
  private static __specularIblCubeMapSampler = new Sampler({
    minFilter: TextureParameter.LinearMipmapLinear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
    wrapR: TextureParameter.ClampToEdge,
  });

  /**
   * Constructs a new MToon1MaterialContent instance with specified rendering features.
   *
   * @param materialName - The name identifier for this material
   * @param isMorphing - Whether this material supports vertex morphing/blend shapes
   * @param isSkinning - Whether this material supports skeletal animation
   * @param isLighting - Whether this material uses lighting calculations
   * @param isOutline - Whether this material is used for outline rendering
   * @param definitions - Additional shader preprocessor definitions
   */
  constructor(
    materialName: string,
    isMorphing: boolean,
    isSkinning: boolean,
    isLighting: boolean,
    isOutline: boolean,
    definitions: string[]
  ) {
    super(materialName, {
      isMorphing: isMorphing,
      isSkinning: isSkinning,
      isLighting: isLighting,
    });

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = this.doShaderReflection(
      mToon1SingleShaderVertex,
      mToon1SingleShaderFragment,
      mToon1SingleShaderVertexWebGpu,
      mToon1SingleShaderFragmentWebGpu,
      definitions
    );

    if (!MToon1MaterialContent.__diffuseIblCubeMapSampler.created) {
      MToon1MaterialContent.__diffuseIblCubeMapSampler.create();
    }

    if (!MToon1MaterialContent.__specularIblCubeMapSampler.created) {
      MToon1MaterialContent.__specularIblCubeMapSampler.create();
    }

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';

      shaderSemanticsInfoArray.push(
        {
          semantic: 'dataTextureMorphOffsetPosition',
          componentType: ComponentType.Int,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxMorphTargetNumber,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          initialValue: new VectorN(new Int32Array(Config.maxMorphTargetNumber)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        },
        {
          semantic: 'morphWeights',
          componentType: ComponentType.Float,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxMorphTargetNumber,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          initialValue: new VectorN(new Float32Array(Config.maxMorphTargetNumber)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        }
      );
    }

    if (isOutline) {
      this.__definitions += '#define RN_MTOON_IS_OUTLINE\n';
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  /**
   * Configures material parameters based on MToon material properties and rendering mode.
   * Sets up culling behavior, alpha testing, and other material-specific settings.
   *
   * @param material - The material instance to configure
   * @param isOutline - Whether this material is being used for outline rendering
   * @param materialJson - The MToon material specification from VRM
   */
  setMaterialParameters(material: Material, isOutline: boolean, materialJson: Vrm1_Material) {
    if (isOutline) {
      material.cullFace = true;
      material.cullFaceBack = false;
    } else {
      if (materialJson.doubleSided) {
        material.cullFace = false;
      } else {
        material.cullFace = true;
        material.cullFaceBack = true;
      }
    }

    if (materialJson.alphaMode === 'MASK') {
      this.__definitions += '#define RN_ALPHATEST_ON\n';
    }
  }

  /**
   * Sets internal parameters for WebGPU rendering pipeline.
   * Configures IBL (Image-Based Lighting) parameters, HDRI format settings,
   * and cube map contributions for physically-based lighting.
   *
   * @param params - Object containing material and rendering arguments
   * @param params.material - The material instance to update
   * @param params.args - WebGPU rendering arguments with entity and environment data
   */
  _setInternalSettingParametersToGpuWebGpu({
    material,
    args,
  }: {
    material: Material;
    args: RenderingArgWebGpu;
  }) {
    const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
      MToon1MaterialContent.__setupHdriParameters(args);
    const tmp_vector4 = AbstractMaterialContent.__tmp_vector4;
    tmp_vector4.x = mipmapLevelNumber;
    tmp_vector4.y = meshRenderComponent!.diffuseCubeMapContribution;
    tmp_vector4.z = meshRenderComponent!.specularCubeMapContribution;
    tmp_vector4.w = meshRenderComponent!.rotationOfCubeMap;
    material.setParameter('iblParameter', tmp_vector4);
    const tmp_vector2 = AbstractMaterialContent.__tmp_vector2;
    tmp_vector2.x = diffuseHdriType;
    tmp_vector2.y = specularHdriType;
    material.setParameter('hdriFormat', tmp_vector2);

    const meshRendererComponent = args.entity.tryToGetMeshRenderer();
    if (
      meshRendererComponent != null &&
      meshRendererComponent.diffuseCubeMap != null &&
      meshRendererComponent.specularCubeMap != null
    ) {
      const iblParameterVec4 = MutableVector4.zero();
      const hdriFormatVec2 = MutableVector2.zero();

      iblParameterVec4.x = meshRendererComponent.specularCubeMap.mipmapLevelNumber;
      iblParameterVec4.y = meshRendererComponent.diffuseCubeMapContribution;
      iblParameterVec4.z = meshRendererComponent.specularCubeMapContribution;
      iblParameterVec4.w = meshRendererComponent.rotationOfCubeMap;
      material.setParameter('iblParameter', iblParameterVec4);

      hdriFormatVec2.x = meshRendererComponent.diffuseCubeMap.hdriFormat.index;
      hdriFormatVec2.y = meshRendererComponent.specularCubeMap.hdriFormat.index;
      material.setParameter('hdriFormat', hdriFormatVec2);
    }
  }

  /**
   * Sets per-shader-program parameters for WebGL rendering.
   * Configures texture bindings for IBL environment maps, setting up diffuse
   * and specular cube maps with appropriate samplers.
   *
   * @param params - Object containing shader program and rendering context
   * @param params.material - The material instance being rendered
   * @param params.shaderProgram - The compiled WebGL shader program
   * @param params.firstTime - Whether this is the first time setting parameters for this program
   * @param params.args - WebGL rendering arguments with cube map textures
   */
  _setInternalSettingParametersToGpuWebGLPerShaderProgram({
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
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    // IBL Env map
    if (args.diffuseCube?.isTextureReady) {
      webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, [
        5,
        args.diffuseCube,
        MToon1MaterialContent.__diffuseIblCubeMapSampler,
      ]);
    } else {
      webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, [
        5,
        dummyBlackCubeTexture,
      ]);
    }
    // if (args.specularCube && args.specularCube.isTextureReady) {
    //   webglResourceRepository.setUniform1iForTexture(
    //     shaderProgram,
    //     ShaderSemantics.SpecularEnvTexture.str,
    //     [6, args.specularCube, MToon1MaterialContent.__specularIblCubeMapSampler]
    //   );
    // } else {
    //   webglResourceRepository.setUniform1iForTexture(
    //     shaderProgram,
    //     ShaderSemantics.SpecularEnvTexture.str,
    //     [6, dummyBlackCubeTexture]
    //   );
    // }
  }

  /**
   * Sets per-material parameters for WebGL rendering.
   * Configures transformation matrices, camera parameters, lighting information,
   * skeletal animation data, IBL parameters, and morphing data.
   *
   * @param params - Object containing material, shader program and rendering context
   * @param params.material - The material instance being rendered
   * @param params.shaderProgram - The compiled WebGL shader program
   * @param params.firstTime - Whether this is the first time setting parameters for this material
   * @param params.args - WebGL rendering arguments with entity and environment data
   */
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
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setIsBillboard(shaderProgram, args.isBillboard);
      if (firstTime || args.isVr) {
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getComponent(
            CameraComponent,
            CameraComponent.current
          ) as CameraComponent;
        }
        this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
        this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      }

      if (firstTime) {
        // Lights
        this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
      }

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
    }

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    // IBL Parameters
    if (args.setUniform) {
      if (firstTime) {
        const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
          MToon1MaterialContent.__setupHdriParameters(args);
        webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.IBLParameter.str, firstTime, {
          x: mipmapLevelNumber,
          y: meshRenderComponent!.diffuseCubeMapContribution,
          z: meshRenderComponent!.specularCubeMapContribution,
          w: meshRenderComponent!.rotationOfCubeMap,
        });
        webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.HDRIFormat.str, firstTime, {
          x: diffuseHdriType,
          y: specularHdriType,
        });
      }
    } else {
      const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
        MToon1MaterialContent.__setupHdriParameters(args);
      const tmp_vector4 = AbstractMaterialContent.__tmp_vector4;
      tmp_vector4.x = mipmapLevelNumber;
      tmp_vector4.y = meshRenderComponent!.diffuseCubeMapContribution;
      tmp_vector4.z = meshRenderComponent!.specularCubeMapContribution;
      tmp_vector4.w = meshRenderComponent!.rotationOfCubeMap;
      material.setParameter('iblParameter', tmp_vector4);
      const tmp_vector2 = AbstractMaterialContent.__tmp_vector2;
      tmp_vector2.x = diffuseHdriType;
      tmp_vector2.y = specularHdriType;
      material.setParameter('hdriFormat', tmp_vector2);
    }

    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
  }

  /**
   * Sets up HDRI (High Dynamic Range Imaging) parameters for both WebGL and WebGPU rendering.
   * Extracts mipmap levels, cube map contributions, and format information from the rendering context.
   *
   * @param args - Rendering arguments containing cube map textures and mesh renderer data
   * @returns Object containing processed HDRI parameters
   * @returns returns.mipmapLevelNumber - Number of mipmap levels in the specular cube map
   * @returns returns.meshRenderComponent - The mesh renderer component with cube map settings
   * @returns returns.diffuseHdriType - HDRI format index for diffuse cube map
   * @returns returns.specularHdriType - HDRI format index for specular cube map
   */
  private static __setupHdriParameters(args: RenderingArgWebGL | RenderingArgWebGpu) {
    let mipmapLevelNumber = 1;
    if (args.specularCube) {
      mipmapLevelNumber = args.specularCube.mipmapLevelNumber;
    }
    const meshRenderComponent = args.entity.getMeshRenderer();
    let diffuseHdriType = HdriFormat.LDR_SRGB.index;
    let specularHdriType = HdriFormat.LDR_SRGB.index;
    if (meshRenderComponent.diffuseCubeMap) {
      diffuseHdriType = meshRenderComponent.diffuseCubeMap!.hdriFormat.index;
    }
    if (meshRenderComponent.specularCubeMap) {
      specularHdriType = meshRenderComponent.specularCubeMap!.hdriFormat.index;
    }
    return {
      mipmapLevelNumber,
      meshRenderComponent,
      diffuseHdriType,
      specularHdriType,
    };
  }
}

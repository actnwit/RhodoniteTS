import type { ShaderityObject } from 'shaderity';
import { ComponentSID, MaterialSID } from '../../../types/CommonTypes';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import { HdriFormat } from '../../definitions/HdriFormat';
import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { TextureParameter } from '../../definitions/TextureParameter';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector4 } from '../../math/MutableVector4';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import type { Engine } from '../../system/Engine';
import { Sampler } from '../../textures/Sampler';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { dummyBlackCubeTexture } from '../core/DummyTextures';
import type { Material } from '../core/Material';

/**
 * Custom material content class that extends AbstractMaterialContent to provide
 * custom shader handling and rendering capabilities with support for IBL (Image-Based Lighting),
 * morphing, skinning, and various shader semantics.
 */
export class CustomMaterialContent extends AbstractMaterialContent {
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __diffuseIblCubeMapSampler = new Sampler({
    minFilter: TextureParameter.Linear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
    wrapR: TextureParameter.ClampToEdge,
  });
  private static __specularIblCubeMapSampler = new Sampler({
    minFilter: TextureParameter.LinearMipmapLinear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
    wrapR: TextureParameter.ClampToEdge,
  });

  /**
   * Creates a new CustomMaterialContent instance with custom shaders and configuration.
   *
   * @param params - Configuration object for the custom material
   * @param params.name - The name identifier for this material content
   * @param params.isMorphing - Whether this material supports vertex morphing/blending
   * @param params.isSkinning - Whether this material supports skeletal animation skinning
   * @param params.isLighting - Whether this material uses lighting calculations
   * @param params.vertexShader - Optional vertex shader object for WebGL rendering
   * @param params.pixelShader - Optional pixel/fragment shader object for WebGL rendering
   * @param params.additionalShaderSemanticInfo - Array of additional shader semantic information
   * @param params.vertexShaderWebGpu - Optional vertex shader object for WebGPU rendering
   * @param params.pixelShaderWebGpu - Optional pixel/fragment shader object for WebGPU rendering
   * @param params.definitions - Optional array of preprocessor definitions for shaders
   */
  constructor({
    name,
    isMorphing,
    isSkinning,
    isLighting,
    vertexShader,
    pixelShader,
    additionalShaderSemanticInfo,
    vertexShaderWebGpu,
    pixelShaderWebGpu,
    definitions = [],
  }: {
    name: string;
    isMorphing: boolean;
    isSkinning: boolean;
    isLighting: boolean;
    vertexShader?: ShaderityObject;
    pixelShader?: ShaderityObject;
    additionalShaderSemanticInfo: ShaderSemanticsInfo[];
    vertexShaderWebGpu?: ShaderityObject;
    pixelShaderWebGpu?: ShaderityObject;
    definitions?: string[];
  }) {
    super(name, { isMorphing, isSkinning, isLighting });

    // Shader Reflection
    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = this.doShaderReflection(
      vertexShader!,
      pixelShader!,
      vertexShaderWebGpu!,
      pixelShaderWebGpu!,
      definitions
    );

    if (!CustomMaterialContent.__diffuseIblCubeMapSampler.created) {
      CustomMaterialContent.__diffuseIblCubeMapSampler.create();
    }

    if (!CustomMaterialContent.__specularIblCubeMapSampler.created) {
      CustomMaterialContent.__specularIblCubeMapSampler.create();
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray.concat(additionalShaderSemanticInfo));
  }

  /**
   * Sets internal material parameters for WebGPU rendering, including IBL parameters
   * and HDRI format information.
   *
   * @param params - Parameters object
   * @param params.material - The material instance to configure
   * @param params.args - WebGPU rendering arguments containing entity and rendering context
   */
  _setInternalSettingParametersToGpuWebGpu({
    material,
    args,
  }: {
    material: Material;
    args: RenderingArgWebGpu;
  }) {
    const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
      CustomMaterialContent.__setupHdriParameters(args);
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
   * Sets internal material parameters for WebGL rendering on a per-material basis.
   * Configures world/view/projection matrices, lighting, skinning, and IBL parameters.
   *
   * @param params - Parameters object
   * @param params.material - The material instance to configure
   * @param params.shaderProgram - The WebGL shader program to use
   * @param params.firstTime - Whether this is the first time setting up this material
   * @param params.args - WebGL rendering arguments containing matrices, entities, and rendering context
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
      this.setIsBillboard(shaderProgram, args.isBillboard);
      this.setIsVisible(shaderProgram, args.isVisible);
      if (firstTime || args.isVr) {
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = engine.componentRepository.getComponent(
            CameraComponent,
            CameraComponent.current
          ) as CameraComponent;
        }
        this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
        this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      }

      // if (firstTime) {
      // Lights
      this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
      // }

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
    }

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    // IBL Parameters
    if (args.setUniform) {
      if (firstTime) {
        const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
          CustomMaterialContent.__setupHdriParameters(args);
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
        CustomMaterialContent.__setupHdriParameters(args);
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
  }

  /**
   * Sets internal parameters for WebGL rendering on a per-shader-program basis.
   * Primarily handles IBL environment texture setup including diffuse, specular, and sheen cube maps.
   *
   * @param params - Parameters object
   * @param params.material - The material instance to configure
   * @param params.shaderProgram - The WebGL shader program to use
   * @param params.firstTime - Whether this is the first time setting up this shader program
   * @param params.args - WebGL rendering arguments containing cube map textures and rendering context
   */
  _setInternalSettingParametersToGpuWebGLPerShaderProgram({
    material,
    shaderProgram,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    args: RenderingArgWebGL;
  }) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    // IBL Env map
    // const diffuseEnv = material.getTextureParameter(ShaderSemantics.DiffuseEnvTexture.str);
    // if (diffuseEnv != null) {
    const diffuseEnvSlot = 5; //diffuseEnv[0];
    if (args.diffuseCube?.isTextureReady) {
      webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, [
        diffuseEnvSlot,
        args.diffuseCube,
        CustomMaterialContent.__diffuseIblCubeMapSampler,
      ]);
    } else {
      webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, [
        diffuseEnvSlot,
        dummyBlackCubeTexture,
      ]);
    }
    // }
    // const specularEnv = material.getTextureParameter(ShaderSemantics.SpecularEnvTexture.str);
    // if (specularEnv != null) {
    const specularEnvSlot = 6; //specularEnv[0];
    if (args.specularCube?.isTextureReady) {
      webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, [
        specularEnvSlot,
        args.specularCube,
        CustomMaterialContent.__specularIblCubeMapSampler,
      ]);
    } else {
      webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, [
        specularEnvSlot,
        dummyBlackCubeTexture,
      ]);
    }
    // }
    const sheenEnv = material.getTextureParameter(ShaderSemantics.SheenEnvTexture.str);
    if (sheenEnv != null) {
      const sheenEnvSlot = sheenEnv[0];
      if (args.sheenCube?.isTextureReady) {
        webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.SheenEnvTexture.str, [
          sheenEnvSlot,
          args.sheenCube,
          CustomMaterialContent.__specularIblCubeMapSampler,
        ]);
      } else if (args.specularCube?.isTextureReady) {
        webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.SheenEnvTexture.str, [
          sheenEnvSlot,
          args.specularCube,
          CustomMaterialContent.__specularIblCubeMapSampler,
        ]);
      } else {
        webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.SheenEnvTexture.str, [
          sheenEnvSlot,
          dummyBlackCubeTexture,
        ]);
      }
    }
  }

  /**
   * Sets internal parameters for WebGL rendering on a per-primitive basis.
   * Handles morph target/blend shape information for vertex animation.
   *
   * @param params - Parameters object
   * @param params.shaderProgram - The WebGL shader program to use
   * @param params.args - WebGL rendering arguments containing entity, mesh, and primitive data
   */
  _setInternalSettingParametersToGpuWebGLPerPrimitive({
    shaderProgram,
    args,
  }: {
    shaderProgram: WebGLProgram;
    args: RenderingArgWebGL;
  }) {
    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
  }

  /**
   * Sets up HDRI (High Dynamic Range Imaging) parameters for IBL rendering.
   * Extracts mipmap levels, mesh render component, and HDRI format information
   * from the rendering arguments.
   *
   * @param args - Rendering arguments for either WebGL or WebGPU
   * @returns Object containing mipmap level number, mesh render component, and HDRI format indices
   * @private
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

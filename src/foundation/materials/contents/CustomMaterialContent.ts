import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Material } from '../core/Material';
import { HdriFormat } from '../../definitions/HdriFormat';
import { ShaderityObject } from 'shaderity';
import { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import { dummyBlackCubeTexture } from '../core/DummyTextures';
import { MutableVector4 } from '../../math/MutableVector4';
import { MutableVector2 } from '../../math/MutableVector2';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { Sampler } from '../../textures/Sampler';
import { TextureParameter } from '../../definitions/TextureParameter';

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
  }) {
    super(name, { isMorphing, isSkinning, isLighting });

    // Shader Reflection
    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = this.doShaderReflection(
      vertexShader!,
      pixelShader!,
      vertexShaderWebGpu!,
      pixelShaderWebGpu!
    );

    if (!CustomMaterialContent.__diffuseIblCubeMapSampler.created) {
      CustomMaterialContent.__diffuseIblCubeMapSampler.create();
    }

    if (!CustomMaterialContent.__specularIblCubeMapSampler.created) {
      CustomMaterialContent.__specularIblCubeMapSampler.create();
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray.concat(additionalShaderSemanticInfo));
  }

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

      // if (firstTime) {
      // Lights
      this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
      // }

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
    }

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    // IBL Env map
    const diffuseEnv = material.getTextureParameter(ShaderSemantics.DiffuseEnvTexture.str);
    if (diffuseEnv != null) {
      const diffuseEnvSlot = diffuseEnv[0];
      if (args.diffuseCube && args.diffuseCube.isTextureReady) {
        webglResourceRepository.setUniform1iForTexture(
          shaderProgram,
          ShaderSemantics.DiffuseEnvTexture.str,
          [diffuseEnvSlot, args.diffuseCube, CustomMaterialContent.__diffuseIblCubeMapSampler]
        );
      } else {
        webglResourceRepository.setUniform1iForTexture(
          shaderProgram,
          ShaderSemantics.DiffuseEnvTexture.str,
          [diffuseEnvSlot, dummyBlackCubeTexture]
        );
      }
    }
    const specularEnv = material.getTextureParameter(ShaderSemantics.SpecularEnvTexture.str);
    if (specularEnv != null) {
      const specularEnvSlot = specularEnv[0];
      if (args.specularCube && args.specularCube.isTextureReady) {
        webglResourceRepository.setUniform1iForTexture(
            shaderProgram,
          ShaderSemantics.SpecularEnvTexture.str,
          [specularEnvSlot, args.specularCube, CustomMaterialContent.__specularIblCubeMapSampler]
        );
      } else {
        webglResourceRepository.setUniform1iForTexture(
          shaderProgram,
          ShaderSemantics.SpecularEnvTexture.str,
          [specularEnvSlot, dummyBlackCubeTexture]
        );
      }
    }
    const sheenEnv = material.getTextureParameter(ShaderSemantics.SheenEnvTexture.str);
    if (sheenEnv != null) {
      const sheenEnvSlot = sheenEnv[0];
      if (args.specularCube && args.specularCube.isTextureReady) {
        webglResourceRepository.setUniform1iForTexture(
          shaderProgram,
          ShaderSemantics.SheenEnvTexture.str,
          [sheenEnvSlot, args.specularCube, CustomMaterialContent.__specularIblCubeMapSampler]
        );
      } else {
        webglResourceRepository.setUniform1iForTexture(
          shaderProgram,
          ShaderSemantics.SheenEnvTexture.str,
          [sheenEnvSlot, dummyBlackCubeTexture]
        );
      }
    }
    // IBL Parameters
    if (args.setUniform) {
      if (firstTime) {
        const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
          CustomMaterialContent.__setupHdriParameters(args);
        webglResourceRepository.setUniformValue(
          shaderProgram,
          ShaderSemantics.IBLParameter.str,
          firstTime,
          {
            x: mipmapLevelNumber,
            y: meshRenderComponent!.diffuseCubeMapContribution,
            z: meshRenderComponent!.specularCubeMapContribution,
            w: meshRenderComponent!.rotationOfCubeMap,
          }
        );
        webglResourceRepository.setUniformValue(
          shaderProgram,
          ShaderSemantics.HDRIFormat.str,
          firstTime,
          { x: diffuseHdriType, y: specularHdriType }
        );
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

  _setInternalSettingParametersToGpuWebGLPerPrimitive({
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
    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
  }

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

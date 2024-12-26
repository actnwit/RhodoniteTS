import { AbstractMaterialContent } from '../core/AbstractMaterialContent';

import mToon1SingleShaderVertex from '../../../webgl/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.vert.glsl';
import mToon1SingleShaderFragment from '../../../webgl/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.frag.glsl';
import mToon1SingleShaderVertexWebGpu from '../../../webgpu/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.vert.wgsl';
import mToon1SingleShaderFragmentWebGpu from '../../../webgpu/shaderity_shaders/MToon1SingleShader/MToon1SingleShader.frag.wgsl';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { Material } from '../core/Material';
import { ComponentRepository } from '../../core/ComponentRepository';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Config } from '../../core/Config';
import { ShaderType } from '../../definitions/ShaderType';
import { VectorN } from '../../math/VectorN';
import { Vrm1_Material } from '../../../types/VRM1';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import { Sampler } from '../../textures/Sampler';
import { TextureParameter } from '../../definitions/TextureParameter';
import { dummyBlackCubeTexture } from '../core/DummyTextures';
import { HdriFormat } from '../../definitions/HdriFormat';

export class MToon1MaterialContent extends AbstractMaterialContent {
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

  constructor(
    materialName: string,
    isMorphing: boolean,
    isSkinning: boolean,
    isLighting: boolean,
    isOutline: boolean
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
      mToon1SingleShaderFragmentWebGpu
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
          arrayLength: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          initialValue: new VectorN(new Int32Array(Config.maxVertexMorphNumberInShader)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        },
        {
          semantic: 'morphWeights',
          componentType: ComponentType.Float,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)),
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

  setMaterialParameters(material: Material, isOutline: boolean, materialJson: Vrm1_Material) {
    if (isOutline) {
      material.cullFace = true;
      material.cullFrontFaceCCW = false;
    } else {
      if (materialJson.doubleSided) {
        material.cullFace = false;
      } else {
        material.cullFace = true;
        material.cullFrontFaceCCW = true;
      }
    }

    if (materialJson.alphaMode === 'MASK') {
      this.__definitions += '#define RN_ALPHATEST_ON\n';
    }
  }

  _setInternalSettingParametersToGpuWebGpu({
    material,
    args,
  }: {
    material: Material;
    args: RenderingArgWebGpu;
  }) {}

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

      if (firstTime) {
        // Lights
        this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
      }

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
    }

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    // IBL Env map
    if (args.diffuseCube && args.diffuseCube.isTextureReady) {
      webglResourceRepository.setUniform1iForTexture(
        shaderProgram,
        ShaderSemantics.DiffuseEnvTexture.str,
        [5, args.diffuseCube, MToon1MaterialContent.__diffuseIblCubeMapSampler]
      );
    } else {
      webglResourceRepository.setUniform1iForTexture(
        shaderProgram,
        ShaderSemantics.DiffuseEnvTexture.str,
        [5, dummyBlackCubeTexture]
      );
    }
    if (args.specularCube && args.specularCube.isTextureReady) {
      webglResourceRepository.setUniform1iForTexture(
        shaderProgram,
        ShaderSemantics.SpecularEnvTexture.str,
        [6, args.specularCube, MToon1MaterialContent.__specularIblCubeMapSampler]
      );
    } else {
      webglResourceRepository.setUniform1iForTexture(
        shaderProgram,
        ShaderSemantics.SpecularEnvTexture.str,
        [6, dummyBlackCubeTexture]
      );
    }

    // IBL Parameters
    if (args.setUniform) {
      if (firstTime) {
        const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
          MToon1MaterialContent.__setupHdriParameters(args);
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

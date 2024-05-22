import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { ShaderType } from '../../definitions/ShaderType';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Material } from '../core/Material';
import { HdriFormat } from '../../definitions/HdriFormat';
import { ShaderityObject } from 'shaderity';
import { ShaderityUtilityWebGL } from '../core/ShaderityUtilityWebGL';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { Vector2 } from '../../math/Vector2';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import { dummyBlackCubeTexture } from '../core/DummyTextures';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { ShaderityUtilityWebGPU } from '../core/ShaderityUtilityWebGPU';

export class CustomMaterialContent extends AbstractMaterialContent {
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  constructor({
    name,
    isMorphing,
    isSkinning,
    isLighting,
    isClearCoat,
    isTransmission,
    isVolume,
    isSheen,
    isSpecular,
    isIridescence,
    isAnisotropy,
    isShadow,
    useTangentAttribute,
    useNormalTexture,
    vertexShader,
    pixelShader,
    noUseCameraTransform,
    additionalShaderSemanticInfo,
    vertexShaderWebGpu,
    pixelShaderWebGpu,
  }: {
    name: string;
    isMorphing: boolean;
    isSkinning: boolean;
    isLighting: boolean;
    isClearCoat?: boolean;
    isTransmission?: boolean;
    isVolume?: boolean;
    isSheen?: boolean;
    isSpecular?: boolean;
    isIridescence?: boolean;
    isAnisotropy?: boolean;
    isShadow?: boolean;
    useTangentAttribute: boolean;
    useNormalTexture: boolean;
    vertexShader: ShaderityObject;
    pixelShader: ShaderityObject;
    noUseCameraTransform: boolean;
    additionalShaderSemanticInfo: ShaderSemanticsInfo[];
    vertexShaderWebGpu?: ShaderityObject;
    pixelShaderWebGpu?: ShaderityObject;
  }) {
    super(
      null,
      name +
        (isMorphing ? '+morphing' : '') +
        (isSkinning ? '+skinning' : '') +
        (isLighting ? '' : '-lighting') +
        (isClearCoat ? '+clearcoat' : '') +
        (isTransmission ? '+transmission' : '') +
        (isVolume ? '+volume' : '') +
        (isSpecular ? '+specular' : '') +
        (isSheen ? '+sheen' : '') +
        (isIridescence ? '+iridescence' : '') +
        (isAnisotropy ? '+anisotropy' : '') +
        (useTangentAttribute ? '+tangentAttribute' : ''),
      { isMorphing, isSkinning, isLighting }
    );

    // Shader Reflection
    let vertexShaderData: {
      shaderSemanticsInfoArray: ShaderSemanticsInfo[];
      shaderityObject: ShaderityObject;
    };
    let pixelShaderData: {
      shaderSemanticsInfoArray: ShaderSemanticsInfo[];
      shaderityObject: ShaderityObject;
    };
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      vertexShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(
        vertexShaderWebGpu!,
        AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
      );
      pixelShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(
        pixelShaderWebGpu!,
        AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
      );

      this.__vertexShaderityObject = vertexShaderData.shaderityObject;
      this.__pixelShaderityObject = pixelShaderData.shaderityObject;
    } else {
      vertexShaderData = ShaderityUtilityWebGL.getShaderDataReflection(
        vertexShader,
        AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
      );
      pixelShaderData = ShaderityUtilityWebGL.getShaderDataReflection(
        pixelShader,
        AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
      );

      this.__vertexShaderityObject = vertexShaderData.shaderityObject;
      this.__pixelShaderityObject = pixelShaderData.shaderityObject;
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    for (const vertexShaderSemanticsInfo of vertexShaderData.shaderSemanticsInfoArray) {
      vertexShaderSemanticsInfo.stage = ShaderType.VertexShader;
      shaderSemanticsInfoArray.push(vertexShaderSemanticsInfo);
    }
    for (const pixelShaderSemanticsInfo of pixelShaderData.shaderSemanticsInfoArray) {
      const foundShaderSemanticsInfo = shaderSemanticsInfoArray.find(
        (vertexInfo: ShaderSemanticsInfo) => {
          if (vertexInfo.semantic.str === pixelShaderSemanticsInfo.semantic.str) {
            return true;
          } else {
            return false;
          }
        }
      );
      if (foundShaderSemanticsInfo) {
        foundShaderSemanticsInfo.stage = ShaderType.VertexAndPixelShader;
      } else {
        pixelShaderSemanticsInfo.stage = ShaderType.PixelShader;
        shaderSemanticsInfoArray.push(pixelShaderSemanticsInfo);
      }
    }

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    // if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    // }

    // if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';
    // }

    if (isClearCoat) {
      this.__definitions += '#define RN_USE_CLEARCOAT\n';
    }

    if (isTransmission) {
      this.__definitions += '#define RN_USE_TRANSMISSION\n';
    }
    if (isVolume) {
      this.__definitions += '#define RN_USE_VOLUME\n';
    }
    if (isSheen) {
      this.__definitions += '#define RN_USE_SHEEN\n';
    }
    if (isSpecular) {
      this.__definitions += '#define RN_USE_SPECULAR\n';
    }
    if (isIridescence) {
      this.__definitions += '#define RN_USE_IRIDESCENCE\n';
    }
    if (isAnisotropy) {
      this.__definitions += '#define RN_USE_ANISOTROPY\n';
    }
    if (isShadow) {
      this.__definitions += '#define RN_USE_SHADOW_MAPPING\n';
    }
    // if (useTangentAttribute) {
    //   this.__definitions += '#define RN_USE_TANGENT_ATTRIBUTE\n';
    // }
    if (useNormalTexture) {
      this.__definitions += '#define RN_USE_NORMAL_TEXTURE\n';
    }

    if (noUseCameraTransform) {
      this.__definitions += '#define RN_NO_CAMERA_TRANSFORM\n';
    }

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
    } else {
      this.setShaderSemanticsInfoArray(
        shaderSemanticsInfoArray.concat(additionalShaderSemanticInfo)
      );
    }
  }

  _setCustomSettingParametersToGpuWebGL({
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

    // IBL Env map
    if (args.diffuseCube && args.diffuseCube.isTextureReady) {
      this.__webglResourceRepository.setUniform1iForTexture(
        shaderProgram,
        ShaderSemantics.DiffuseEnvTexture.str,
        [5, args.diffuseCube]
      );
    } else {
      this.__webglResourceRepository.setUniform1iForTexture(
        shaderProgram,
        ShaderSemantics.DiffuseEnvTexture.str,
        [5, dummyBlackCubeTexture]
      );
    }
    if (args.specularCube && args.specularCube.isTextureReady) {
      this.__webglResourceRepository.setUniform1iForTexture(
        shaderProgram,
        ShaderSemantics.SpecularEnvTexture.str,
        [6, args.specularCube]
      );
    } else {
      this.__webglResourceRepository.setUniform1iForTexture(
        shaderProgram,
        ShaderSemantics.SpecularEnvTexture.str,
        [6, dummyBlackCubeTexture]
      );
    }

    // IBL Parameters
    if (args.setUniform) {
      if (firstTime) {
        const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
          CustomMaterialContent.__setupHdriParameters(args);
        this.__webglResourceRepository.setUniformValue(
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
        this.__webglResourceRepository.setUniformValue(
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
      material.setParameter(ShaderSemantics.IBLParameter, tmp_vector4);
      const tmp_vector2 = AbstractMaterialContent.__tmp_vector2;
      tmp_vector2.x = diffuseHdriType;
      tmp_vector2.y = specularHdriType;
      material.setParameter(ShaderSemantics.HDRIFormat, tmp_vector2);
    }

    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);

    if ((shaderProgram as any).backBufferTextureSize != null) {
      const width = args.glw.canvas.width;
      const height = args.glw.canvas.height;
      const backBufferTextureSize = CustomMaterialContent.__globalDataRepository.getValue(
        ShaderSemantics.BackBufferTextureSize,
        0
      ) as Vector2;
      backBufferTextureSize._v[0] = width;
      backBufferTextureSize._v[1] = height;
      (shaderProgram as any)._gl.uniform2fv(
        (shaderProgram as any).backBufferTextureSize,
        backBufferTextureSize._v
      );
    }

    if ((shaderProgram as any).vrState != null) {
      const vrState = CustomMaterialContent.__globalDataRepository.getValue(
        ShaderSemantics.VrState,
        0
      ) as Vector2;
      vrState._v[0] = args.isVr ? 1 : 0;
      vrState._v[1] = args.displayIdx;
      (shaderProgram as any)._gl.uniform2iv((shaderProgram as any).vrState, vrState._v);
    }
  }

  private static __setupHdriParameters(args: RenderingArg) {
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

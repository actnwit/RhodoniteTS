import {
  ShaderSemanticsInfo,
  ShaderSemantics,
} from '../../definitions/ShaderSemantics';
import {AbstractMaterialContent} from '../core/AbstractMaterialContent';
import {ShaderType} from '../../definitions/ShaderType';
import {ComponentRepository} from '../../core/ComponentRepository';
import {CameraComponent} from '../../components/Camera/CameraComponent';
import {Material} from '../core/Material';
import {HdriFormat} from '../../definitions/HdriFormat';
import {ShaderityObject} from 'shaderity';
import {AlphaModeEnum} from '../../definitions/AlphaMode';
import {ShaderityUtility} from '../core/ShaderityUtility';
import {RenderingArg} from '../../../webgl/types/CommonTypes';

export class CustomMaterialContent extends AbstractMaterialContent {
  constructor({
    name,
    isMorphing,
    isSkinning,
    isLighting,
    alphaMode,
    vertexShader,
    pixelShader,
  }: {
    name: string;
    isMorphing: boolean;
    isSkinning: boolean;
    isLighting: boolean;
    alphaMode: AlphaModeEnum;
    vertexShader: ShaderityObject;
    pixelShader: ShaderityObject;
  }) {
    super(
      null,
      name +
        (isMorphing ? '+morphing' : '') +
        (isSkinning ? '+skinning' : '') +
        (isLighting ? '' : '-lighting') +
        ' alpha_' +
        alphaMode.str.toLowerCase(),
      {isMorphing, isSkinning, isLighting}
    );

    // Shader Reflection
    const vertexShaderData = ShaderityUtility.getShaderDataReflection(
      vertexShader,
      AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
    );
    const pixelShaderData = ShaderityUtility.getShaderDataReflection(
      pixelShader,
      AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
    );
    this.__vertexShaderityObject = vertexShaderData.shaderityObject;
    this.__pixelShaderityObject = pixelShaderData.shaderityObject;

    const shaderSemanticsInfoArray: any = [];

    for (const vertexShaderSemanticsInfo of vertexShaderData.shaderSemanticsInfoArray) {
      vertexShaderSemanticsInfo.stage = ShaderType.VertexShader;
      shaderSemanticsInfoArray.push(vertexShaderSemanticsInfo);
    }
    for (const pixelShaderSemanticsInfo of pixelShaderData.shaderSemanticsInfoArray) {
      const foundShaderSemanticsInfo = shaderSemanticsInfoArray.find(
        (vertexInfo: ShaderSemanticsInfo) => {
          if (
            vertexInfo.semantic.str === pixelShaderSemanticsInfo.semantic.str
          ) {
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

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';
    }

    this.__definitions += '#define RN_IS_ALPHAMODE_' + alphaMode.str + '\n';

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setCustomSettingParametersToGpu({
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

      if (firstTime || args.isVr) {
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getComponent(
            CameraComponent,
            CameraComponent.current
          ) as CameraComponent;
        }
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

      if (firstTime) {
        // Lights
        this.setLightsInfo(
          shaderProgram,
          args.lightComponents,
          material,
          args.setUniform
        );
      }

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
    }

    // IBL Env map
    if (args.diffuseCube && args.diffuseCube.isTextureReady) {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.DiffuseEnvTexture.str,
        firstTime,
        [5, args.diffuseCube]
      );
    } else {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.DiffuseEnvTexture.str,
        firstTime,
        [5, AbstractMaterialContent.__dummyBlackCubeTexture]
      );
    }
    if (args.specularCube && args.specularCube.isTextureReady) {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.SpecularEnvTexture.str,
        firstTime,
        [6, args.specularCube]
      );
    } else {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.SpecularEnvTexture.str,
        firstTime,
        [6, AbstractMaterialContent.__dummyBlackCubeTexture]
      );
    }

    // IBL Parameters
    if (args.setUniform) {
      if (firstTime) {
        const {
          mipmapLevelNumber,
          meshRenderComponent,
          diffuseHdriType,
          specularHdriType,
        } = this.setupHdriParameters(args);
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
          {x: diffuseHdriType, y: specularHdriType}
        );
      }
    } else {
      const {
        mipmapLevelNumber,
        meshRenderComponent,
        diffuseHdriType,
        specularHdriType,
      } = this.setupHdriParameters(args);
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
    this.setMorphInfo(
      shaderProgram,
      args.entity.getMesh(),
      args.primitive,
      blendShapeComponent
    );
  }

  private setupHdriParameters(args: RenderingArg) {
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

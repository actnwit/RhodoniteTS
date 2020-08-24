import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import CGAPIResourceRepository from "../../renderer/CGAPIResourceRepository";
import { ShaderType } from "../../definitions/ShaderType";
import { CGAPIResourceHandle } from "../../../commontypes/CommonTypes";
import ComponentRepository from "../../core/ComponentRepository";
import CameraComponent from "../../components/CameraComponent";
import Material from "../core/Material";
import { HdriFormat } from "../../definitions/HdriFormat";
import MeshComponent from "../../components/MeshComponent";
import BlendShapeComponent from "../../components/BlendShapeComponent";
import { ShaderityObject } from "shaderity";
import ShaderityUtility from "../core/ShaderityUtility";
import { AlphaModeEnum, AlphaMode } from "../../definitions/AlphaMode";

export default class CustomSingleMaterialNode extends AbstractMaterialNode {
  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static readonly IsOutputHDR = new ShaderSemanticsClass({ str: 'isOutputHDR' })
  static baseColorTextureTransform = new ShaderSemanticsClass({ str: 'baseColorTextureTransform' });
  static baseColorTextureRotation = new ShaderSemanticsClass({ str: 'baseColorTextureRotation' });
  static normalTextureTransform = new ShaderSemanticsClass({ str: 'normalTextureTransform' });
  static normalTextureRotation = new ShaderSemanticsClass({ str: 'normalTextureRotation' });
  static metallicRoughnessTextureTransform = new ShaderSemanticsClass({ str: 'metallicRoughnessTextureTransform' });
  static metallicRoughnessTextureRotation = new ShaderSemanticsClass({ str: 'metallicRoughnessTextureRotation' });
  private static __shaderityUtility: ShaderityUtility = ShaderityUtility.getInstance();

  constructor({ name, isMorphing, isSkinning, isLighting, alphaMode, vertexShader, pixelShader }:
    { name: string, isMorphing: boolean, isSkinning: boolean, isLighting: boolean, alphaMode: AlphaModeEnum, vertexShader: ShaderityObject, pixelShader: ShaderityObject }) {
    super(null, name
      + (isMorphing ? '+morphing' : '')
      + (isSkinning ? '+skinning' : '')
      + (isLighting ? '' : '-lighting')
      + ' alpha_' + alphaMode.str.toLowerCase(),
      { isMorphing, isSkinning, isLighting }
    );

    const vertexShaderData = CustomSingleMaterialNode.__shaderityUtility.getShaderDataRefection(vertexShader, AbstractMaterialNode.__semanticsMap.get(this.shaderFunctionName));
    const pixelShaderData = CustomSingleMaterialNode.__shaderityUtility.getShaderDataRefection(pixelShader, AbstractMaterialNode.__semanticsMap.get(this.shaderFunctionName));
    this.__vertexShaderityObject = vertexShaderData.shaderityObject;
    this.__pixelShaderityObject = pixelShaderData.shaderityObject;

    const shaderSemanticsInfoArray: any = [];

    for (let vertexShaderSemanticsInfo of vertexShaderData.shaderSemanticsInfoArray) {
      vertexShaderSemanticsInfo.stage = ShaderType.VertexShader;
      shaderSemanticsInfoArray.push(vertexShaderSemanticsInfo);
    }
    for (let pixelShaderSemanticsInfo of pixelShaderData.shaderSemanticsInfoArray) {
      const foundShaderSemanticsInfo = shaderSemanticsInfoArray.find((vertexInfo: ShaderSemanticsInfo) => {
        if (vertexInfo.semantic.str === pixelShaderSemanticsInfo.semantic.str) {
          return true;
        } else {
          return false;
        }
      });
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

    this.__definitions += '#define RN_ALPHAMODE_' + alphaMode.str + '\n';

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);

      if (firstTime) {
        /// Matrices
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
        }
        this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
        this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

        // Lights
        this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
      }

      /// Skinning
      const skeletalComponent = args.entity.getSkeletal();
      this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);

    }

    // Env map
    if (args.diffuseCube && args.diffuseCube.isTextureReady) {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, firstTime, [5, args.diffuseCube]);
    } else {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, firstTime, [5, AbstractMaterialNode.__dummyBlackCubeTexture]);
    }
    if (args.specularCube && args.specularCube.isTextureReady) {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, firstTime, [6, args.specularCube]);
    } else {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, firstTime, [6, AbstractMaterialNode.__dummyBlackCubeTexture]);
    }


    if (args.setUniform) {
      if (firstTime) {
        const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } = this.setupHdriParameters(args);
        this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.IBLParameter.str, firstTime,
          {
            x: mipmapLevelNumber, y: meshRenderComponent!.diffuseCubeMapContribution,
            z: meshRenderComponent!.specularCubeMapContribution, w: meshRenderComponent!.rotationOfCubeMap
          },
        );
        this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.HDRIFormat.str, firstTime, { x: diffuseHdriType, y: specularHdriType })
      }
    } else {
      const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } = this.setupHdriParameters(args);
      const tmp_vector4 = AbstractMaterialNode.__tmp_vector4;
      tmp_vector4.x = mipmapLevelNumber;
      tmp_vector4.y = meshRenderComponent!.diffuseCubeMapContribution;
      tmp_vector4.z = meshRenderComponent!.specularCubeMapContribution;
      tmp_vector4.w = meshRenderComponent!.rotationOfCubeMap;
      material.setParameter(ShaderSemantics.IBLParameter, tmp_vector4);
      const tmp_vector2 = AbstractMaterialNode.__tmp_vector2;
      tmp_vector2.x = diffuseHdriType;
      tmp_vector2.y = specularHdriType;
      material.setParameter(ShaderSemantics.HDRIFormat, tmp_vector2);
    }

    // Morph
    this.setMorphInfo(shaderProgram, args.entity.getComponent(MeshComponent), args.entity.getComponent(BlendShapeComponent), args.primitive);
  }

  private setupHdriParameters(args: any) {
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
    return { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType };
  }
}

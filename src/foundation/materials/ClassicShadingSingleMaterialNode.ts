import RnObject from "../core/RnObject";
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsEnum
} from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import MutableColorRgb from "../math/MutableColorRgb";
import Vector2 from "../math/Vector2";
import { ComponentType } from "../definitions/ComponentType";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import ModuleManager from "../system/ModuleManager";
import { PixelFormat } from "../definitions/PixelFormat";
import { TextureParameter } from "../definitions/TextureParameter";
import Vector4 from "../math/Vector4";
import Vector3 from "../math/Vector3";
import ClassicShader from "../../webgl/shaders/ClassicShader";
import { ShadingModel } from "../definitions/ShadingModel";
import AbstractTexture from "../textures/AbstractTexture";
import { ShaderType } from "../definitions/ShaderType";
import Scalar from "../math/Scalar";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import Config from "../core/Config";
import ComponentRepository from "../core/ComponentRepository";
import CameraComponent from "../components/CameraComponent";
import { CGAPIResourceHandle } from "../../types/CommonTypes";
import Material from "./Material";
import SkeletalComponent from "../components/SkeletalComponent";
import MeshRendererComponent from "../components/MeshRendererComponent";
import { HdriFormat } from "../definitions/HdriFormat";

export default class ClassicShadingSingleMaterialNode extends AbstractMaterialNode {
  private __webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

  constructor({isSkinning, isLighting}: {isSkinning: boolean, isLighting: boolean}) {
    super(ClassicShader.getInstance(), "classicShading"
      + isSkinning ? '_+skinning' : ''
      + isLighting ? '' : '-lighting'
    );
    ClassicShadingSingleMaterialNode.initDefaultTextures();

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    let shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isPlural: false,
        prefix: "material.",
        isSystem: false,
        initialValue: new Vector4(1, 1, 1, 1)
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isPlural: false,
        isSystem: false,
        initialValue: [
          0,
          AbstractMaterialNode.__dummyWhiteTexture
        ]
      },
      {
        semantic: ShaderSemantics.NormalTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isPlural: false,
        isSystem: false,
        initialValue: [
          2,
          AbstractMaterialNode.__dummyBlueTexture
        ]
      },
      {
        semantic: ShaderSemantics.Shininess,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_VALUE,
        isPlural: false,
        isSystem: false,
        initialValue: new Scalar(5)
      },
      {
        semantic: ShaderSemantics.ShadingModel,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 3,
        isPlural: false,
        isSystem: false,
        initialValue: new Scalar(ShadingModel.Constant.index)
      },
      {
        semantic: ShaderSemantics.LightNumber,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isPlural: false,
        isSystem: true,
        updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: new Scalar(0),
        soloDatum: true
      },
      {
        semantic: ShaderSemantics.ViewPosition,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexAndPixelShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        isPlural: false,
        isSystem: true,
        updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: new Vector3(0,0.0),
        soloDatum: true
      },
    ];

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';

      const lights: ShaderSemanticsInfo[] = [];
      for (let i = 0; i < Config.maxLightNumberInShader; i++) {
        (function(idx){
        lights.push(
          {
            semantic: ShaderSemantics.LightPosition,
            compositionType: CompositionType.Vec4,
            componentType: ComponentType.Float,
            stage: ShaderType.PixelShader,
            min: -Number.MAX_VALUE,
            max: Number.MAX_VALUE,
            isPlural: false,
            prefix: `lights[${idx}].`,
            index: idx,
            maxIndex: 4,
            isSystem: true,
            updateInteval: ShaderVariableUpdateInterval.EveryTime,
            initialValue: new Vector4(0, 0, 0, 1),
            soloDatum: true
          });
        lights.push(
          {
          semantic: ShaderSemantics.LightDirection,
          compositionType: CompositionType.Vec4,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: -1,
          max: 1,
          isPlural: false,
          prefix: `lights[${idx}].`,
          index: idx,
          maxIndex: 4,
          isSystem: true,
          initialValue: new Vector4(0, 1, 0, 1),
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          soloDatum: true
        });
        lights.push(
          {
            semantic: ShaderSemantics.LightIntensity,
            compositionType: CompositionType.Vec4,
            componentType: ComponentType.Float,
            stage: ShaderType.PixelShader,
            min: 0,
            max: 10,
            isPlural: false,
            prefix: `lights[${idx}].`,
            index: idx,
            maxIndex: 4,
            isSystem: true,
            initialValue: new Vector4(1, 1, 1, 1),
            updateInteval: ShaderVariableUpdateInterval.EveryTime,
            soloDatum: true
          });
        })(i);
      }
      shaderSemanticsInfoArray = shaderSemanticsInfoArray.concat(lights);
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';

      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
        // stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: true, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime });
      shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneCompressedChank, compositionType: CompositionType.Vec4Array, maxIndex: 250, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: true, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime });
      shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneCompressedInfo, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime });
      shaderSemanticsInfoArray.push({semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
        stage: ShaderType.VertexShader, min: 0, max: 1, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime });
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
  }

  setParametersForGPU({material, shaderProgram, firstTime, args}: {material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any}) {

    if (args.setUniform) {
      AbstractMaterialNode.setWorldMatrix(shaderProgram, args.worldMatrix);
      AbstractMaterialNode.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }
    if (cameraComponent) {
      AbstractMaterialNode.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      AbstractMaterialNode.setProjection(shaderProgram, cameraComponent, material, args.setUniform);
    }

    /// Skinning
    const skeletalComponent = args.entity.getComponent(SkeletalComponent) as SkeletalComponent;
    AbstractMaterialNode.setSkinning(shaderProgram, skeletalComponent);


    let updated: boolean;
    // Env map
    updated = this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, firstTime, [5, -1]);
    if (updated) {
      if (args.diffuseCube && args.diffuseCube.isTextureReady) {
        const texture = this.__webglResourceRepository.getWebGLResource(args.diffuseCube.cgApiResourceUid!) as WebGLTexture;
        args.glw.bindTextureCube(5, texture);
      } else {
        const texture = this.__webglResourceRepository.getWebGLResource(AbstractMaterialNode.__dummyBlackCubeTexture.cgApiResourceUid) as WebGLTexture;
        args.glw.bindTextureCube(5, texture);
      }
    }
    updated = this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, firstTime, [6, -1]);
    if (updated) {
      if (args.specularCube && args.specularCube.isTextureReady) {
        const texture = this.__webglResourceRepository.getWebGLResource(args.specularCube.cgApiResourceUid!) as WebGLTexture;
        args.glw.bindTextureCube(6, texture);
      } else {
        const texture = this.__webglResourceRepository.getWebGLResource(AbstractMaterialNode.__dummyBlackCubeTexture.cgApiResourceUid) as WebGLTexture;
        args.glw.bindTextureCube(6, texture);
      }
    }

    let mipmapLevelNumber = 1;
    if (args.specularCube) {
      mipmapLevelNumber = args.specularCube.mipmapLevelNumber;
    }
    const meshRenderComponent = args.entity.getComponent(MeshRendererComponent) as MeshRendererComponent;
    let diffuseHdriType = HdriFormat.LDR_SRGB.index;
    let specularHdriType = HdriFormat.LDR_SRGB.index;
    if (meshRenderComponent.diffuseCubeMap) {
      diffuseHdriType = meshRenderComponent.diffuseCubeMap!.hdriFormat.index;
    }
    if (meshRenderComponent.specularCubeMap) {
      specularHdriType = meshRenderComponent.specularCubeMap!.hdriFormat.index;
    }
    if (args.setUniform) {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.IBLParameter.str, firstTime,
        { x: mipmapLevelNumber, y: meshRenderComponent!.diffuseCubeMapContribution,
          z: meshRenderComponent!.specularCubeMapContribution, w: meshRenderComponent!.rotationOfCubeMap },
        );
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.HDRIFormat.str, firstTime, { x: diffuseHdriType, y: specularHdriType })
    } else {
      const tmp_vector4 = AbstractMaterialNode.__tmp_vector4;
      tmp_vector4.x = mipmapLevelNumber;
      tmp_vector4.y = meshRenderComponent!.diffuseCubeMapContribution;
      tmp_vector4.z = meshRenderComponent!.specularCubeMapContribution;
      tmp_vector4.w = meshRenderComponent!.rotationOfCubeMap;
      material.setParameter(ShaderSemantics.IBLParameter, tmp_vector4);
      const tmp_vector2 = AbstractMaterialNode.__tmp_vector2;
      tmp_vector2.x = diffuseHdriType;
      tmp_vector2.y = specularHdriType;
      material.setParameter(ShaderSemantics.IBLParameter, tmp_vector2);
    }

    // BRDF LUT
    // updated = this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.BrdfLutTexture.str, firstTime, [5, -1]);
    // if (updated) {
    //   if (this.__pbrCookTorranceBrdfLutDataUrlUid != null) {
    //     const texture = this.__webglResourceRepository.getWebGLResource(this.__pbrCookTorranceBrdfLutDataUrlUid!) as WebGLTexture;
    //     glw.bindTexture2D(5, texture);
    //   } else {
    //     const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyWhiteTexture!) as WebGLTexture;
    //     glw.bindTexture2D(5, texture);
    //   }
    // }

    // Lights
    AbstractMaterialNode.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);

  }
}

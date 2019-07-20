import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import Vector2 from "../math/Vector2";
import { ComponentType } from "../definitions/ComponentType";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import ModuleManager from "../system/ModuleManager";
import { PixelFormat } from "../definitions/PixelFormat";
import { TextureParameter } from "../definitions/TextureParameter";
import Vector4 from "../math/Vector4";
import Vector3 from "../math/Vector3";
import AbstractTexture from "../textures/AbstractTexture";
import PBRShader from "../../webgl/shaders/PBRShader";
import { ShaderType } from "../definitions/ShaderType";
import { CGAPIResourceHandle } from "../../types/CommonTypes";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import ComponentRepository from "../core/ComponentRepository";
import CameraComponent from "../components/CameraComponent";
import Material from "./Material";
import MeshRendererComponent from "../components/MeshRendererComponent";
import { HdriFormat } from "../definitions/HdriFormat";
import Scalar from "../math/Scalar";
import Config from "../core/Config";

export default class PbrShadingMaterialNode extends AbstractMaterialNode {
  private static __dummyWhiteTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlueTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackCubeTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor() {
    super(PBRShader.getInstance(), 'pbrShading');
    PbrShadingMaterialNode.initDefaultTextures();

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    let shaderSemanticsInfoArray: ShaderSemanticsInfo[] =
      [
        {semantic: ShaderSemantics.BaseColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 2, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector4(1, 1, 1, 1)},
        {semantic: ShaderSemantics.BaseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: false, initialValue: [0, PbrShadingMaterialNode.__dummyWhiteTextureUid]},
        {semantic: ShaderSemantics.MetallicRoughnessFactor, compositionType: CompositionType.Vec2, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 2, isPlural: false, prefix: 'material.', isSystem: false, initialValue: new Vector2(1, 1)},
        {semantic: ShaderSemantics.MetallicRoughnessTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: false, initialValue: [1, PbrShadingMaterialNode.__dummyWhiteTextureUid]},
        {semantic: ShaderSemantics.NormalTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: false, initialValue: [2, PbrShadingMaterialNode.__dummyBlueTextureUid]},
        {semantic: ShaderSemantics.OcclusionTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: false, initialValue: [3, PbrShadingMaterialNode.__dummyWhiteTextureUid]},
        {semantic: ShaderSemantics.EmissiveTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: false, initialValue: [4, PbrShadingMaterialNode.__dummyBlackTextureUid]},
        {semantic: ShaderSemantics.Wireframe, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 10, isPlural: false, isSystem: false, initialValue: new Vector3(0, 0, 1)},
        { semanticStr: 'isOutputHDR', compositionType: CompositionType.Scalar, componentType: ComponentType.Bool,
          stage: ShaderType.PixelShader, min: 0, max: 1, isPlural: false, isSystem: false, initialValue: new Scalar(0) },
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
          soloDatum: true,
          updateFunc: ({shaderProgram, firstTime, args}: {shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
            let cameraComponent = args.renderPass.cameraComponent;
            if (cameraComponent == null) {
              cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
            }
            if (cameraComponent) {
              const cameraPosition = cameraComponent.worldPosition;
              webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.ViewPosition.str, firstTime, cameraPosition);
            }
          }
        },
        {
          semantic: ShaderSemantics.IBLParameter,
          compositionType: CompositionType.Vec4,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          isPlural: false,
          isSystem: true,
          initialValue: new Vector4(1, 1, 1, 1),
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          updateFunc: ({material, shaderProgram, firstTime, args}: {material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
            let mipmapLevelNumber = 1;
            if (args.specularCube) {
              mipmapLevelNumber = args.specularCube.mipmapLevelNumber;
            }
            const meshRenderComponent = args.entity.getComponent(MeshRendererComponent) as MeshRendererComponent;

            if (args.setUniformValue) {
              webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.IBLParameter.str, firstTime,
                { x: mipmapLevelNumber, y: meshRenderComponent!.diffuseCubeMapContribution,
                  z: meshRenderComponent!.specularCubeMapContribution, w: meshRenderComponent!.rotationOfCubeMap },
                );
            } else {
              material.setParameter(ShaderSemantics.IBLParameter,
                new Vector4(mipmapLevelNumber, meshRenderComponent!.diffuseCubeMapContribution,
                meshRenderComponent!.specularCubeMapContribution, meshRenderComponent!.rotationOfCubeMap));
            }
          }
        },
        {
          semantic: ShaderSemantics.HDRIFormat,
          compositionType: CompositionType.Vec2,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader,
          min: 0,
          max: 5,
          isPlural: false,
          isSystem: true,
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          initialValue: new Vector2(0, 0),
          updateFunc: ({material, shaderProgram, firstTime, args}: {material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
            // console.log(args);
            let diffuseHdriType = HdriFormat.LDR_SRGB.index;
            let specularHdriType = HdriFormat.LDR_SRGB.index;
            const meshRenderComponent = args.entity.getComponent(MeshRendererComponent) as MeshRendererComponent;
            if (meshRenderComponent.diffuseCubeMap) {
              diffuseHdriType = meshRenderComponent.diffuseCubeMap!.hdriFormat.index;
            }
            if (meshRenderComponent.specularCubeMap) {
              specularHdriType = meshRenderComponent.specularCubeMap!.hdriFormat.index;
            }
            if (args.setUniform) {
              webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.HDRIFormat.str, firstTime, { x: diffuseHdriType, y: specularHdriType });
            } else {
              material.setParameter(ShaderSemantics.HDRIFormat, new Vector2(diffuseHdriType, specularHdriType));
            }
          }
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
          soloDatum: true,
          updateFunc: ({shaderProgram, firstTime, args}: {shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
            webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightNumber.str, firstTime, args!.lightComponents!.length);
          }
        },
        {
          semantic: ShaderSemantics.DiffuseEnvTexture,
          compositionType: CompositionType.TextureCube,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0,
          max: Number.MAX_SAFE_INTEGER,
          isPlural: false,
          isSystem: true,
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          initialValue: [5, PbrShadingMaterialNode.__dummyWhiteTextureUid],
          updateFunc: ({shaderProgram, firstTime, args}: {shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
            let updated: boolean;
            // Env map
            updated = webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, firstTime, [5, -1]);
            if (updated) {
              const diffuseCube = args.diffuseCube;
              if (diffuseCube && diffuseCube.isTextureReady) {
                const texture = webglResourceRepository.getWebGLResource(diffuseCube.cgApiResourceUid!) as WebGLTexture;
                args.glw.bindTextureCube(5, texture);
              } else {
                const texture = webglResourceRepository.getWebGLResource(PbrShadingMaterialNode.__dummyBlackCubeTextureUid!) as WebGLTexture;
                args.glw.bindTextureCube(5, texture);
              }
            }
          }
        },
        {
          semantic: ShaderSemantics.SpecularEnvTexture,
          compositionType: CompositionType.TextureCube,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          isPlural: false,
          isSystem: true,
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          initialValue: [6, PbrShadingMaterialNode.__dummyWhiteTextureUid],
          updateFunc: ({shaderProgram, firstTime, args}: {shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
            const updated = webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, firstTime, [6, -1]);
            if (updated) {
              const specularCube = args.specularCube;
              if (specularCube && specularCube.isTextureReady) {
                const texture = webglResourceRepository.getWebGLResource(specularCube.cgApiResourceUid!) as WebGLTexture;
                args.glw.bindTextureCube(6, texture);
              } else {
                const texture = webglResourceRepository.getWebGLResource(PbrShadingMaterialNode.__dummyBlackCubeTextureUid!) as WebGLTexture;
                args.glw.bindTextureCube(6, texture);
              }
            }
          }
        },
      ];

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
          soloDatum: true,
          updateFunc:
            ({shaderProgram, firstTime, args}: {shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
            // console.log(idx);
            const lightComponent = args.lightComponents![idx];
            if (lightComponent == null) {
              return;
            }
            const sceneGraphComponent = lightComponent.entity.getSceneGraph();
            const worldLightPosition = sceneGraphComponent.worldPosition;
            webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightPosition.str, firstTime, { x: worldLightPosition.x, y: worldLightPosition.y, z: worldLightPosition.z, w: lightComponent.type.index }, idx);
          },
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
        soloDatum: true,
        updateFunc: ({shaderProgram, firstTime, args}: {shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
          const lightComponent = args.lightComponents![idx];
          if (lightComponent == null) {
            return;
          }
        const worldLightDirection = lightComponent.direction;
          webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightDirection.str, firstTime, { x: worldLightDirection.x, y: worldLightDirection.y, z: worldLightDirection.z, w: 0 }, idx);
        }
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
          soloDatum: true,
          updateFunc: ({shaderProgram, firstTime, args}: {shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
            const lightComponent = args.lightComponents![idx];
            if (lightComponent == null) {
              return;
            }
            const worldLightIntensity = lightComponent.intensity;
            webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightIntensity.str, firstTime, { x: worldLightIntensity.x, y: worldLightIntensity.y, z: worldLightIntensity.z, w: 0 }, idx);
          }
        });
      })(i);
    }

    shaderSemanticsInfoArray = shaderSemanticsInfoArray.concat(lights);
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
    if (PbrShadingMaterialNode.__dummyWhiteTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return;
    }
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    PbrShadingMaterialNode.__dummyWhiteTextureUid = webglResourceRepository.createDummyTexture();
    PbrShadingMaterialNode.__dummyBlueTextureUid = webglResourceRepository.createDummyTexture("rgba(127.5, 127.5, 255, 1)");
    PbrShadingMaterialNode.__dummyBlackTextureUid = webglResourceRepository.createDummyTexture("rgba(0, 0, 0, 1)");
    PbrShadingMaterialNode.__dummyBlackCubeTextureUid = webglResourceRepository.createDummyCubeTexture();

    // const pbrCookTorranceBrdfLutDataUrl = ModuleManager.getInstance().getModule('pbr').pbrCookTorranceBrdfLutDataUrl;
    // this.__pbrCookTorranceBrdfLutDataUrlUid = await webglResourceRepository.createTextureFromDataUri(pbrCookTorranceBrdfLutDataUrl,
    //   {
    //     level: 0, internalFormat: PixelFormat.RGBA,
    //       border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
    //       wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false
    //     }
    //   );
  }
  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}

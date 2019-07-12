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

export default class ClassicShadingSingleMaterialNode extends AbstractMaterialNode {
  private static __dummyWhiteTextureUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlueTextureUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackTextureUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __dummyBlackCubeTextureUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor() {
    super(ClassicShader.getInstance(), "classicShading");
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
          ClassicShadingSingleMaterialNode.__dummyWhiteTextureUid
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
          ClassicShadingSingleMaterialNode.__dummyBlueTextureUid
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
        soloDatum: true,
        updateFunc: ({shaderProgram, firstTime, args}: {shaderProgram: WebGLProgram, firstTime: boolean, args?: any})=>{
          // console.log(args);
          webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightNumber.str, firstTime, args!.lightComponents!.length);
        }
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
          }
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
    if (
      ClassicShadingSingleMaterialNode.__dummyWhiteTextureUid !==
      CGAPIResourceRepository.InvalidCGAPIResourceUid
    ) {
      return;
    }

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    ClassicShadingSingleMaterialNode.__dummyWhiteTextureUid = webglResourceRepository.createDummyTexture();
    ClassicShadingSingleMaterialNode.__dummyBlueTextureUid = webglResourceRepository.createDummyTexture("rgba(127.5, 127.5, 255, 1)");
    ClassicShadingSingleMaterialNode.__dummyBlackTextureUid = webglResourceRepository.createDummyTexture(
      "rgba(0, 0, 0, 1)"
    );
    ClassicShadingSingleMaterialNode.__dummyBlackCubeTextureUid = webglResourceRepository.createDummyCubeTexture();
  }
}

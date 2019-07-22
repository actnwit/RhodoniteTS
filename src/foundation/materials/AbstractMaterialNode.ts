import RnObject from "../core/RnObject";
import { ShaderSemanticsInfo, ShaderSemanticsEnum, ShaderSemantics } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import { CompositionTypeEnum, ComponentTypeEnum, VertexAttributeEnum } from "../main";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import GLSLShader from "../../webgl/shaders/GLSLShader";
import MutableRowMajarMatrix44 from "../math/MutableRowMajarMatrix44";
import RowMajarMatrix44 from "../math/RowMajarMatrix44";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import Matrix44 from "../math/Matrix44";
import { CGAPIResourceHandle } from "../../types/CommonTypes";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import Texture from "../textures/Texture";
import CubeTexture from "../textures/CubeTexture";
import LightComponent from "../components/LightComponent";
import Config from "../core/Config";
import CameraComponent from "../components/CameraComponent";
import SkeletalComponent from "../components/SkeletalComponent";

export type ShaderAttributeOrSemanticsOrString = string | VertexAttributeEnum | ShaderSemanticsEnum;

export type ShaderSocket = {
  compositionType: CompositionTypeEnum,
  componentType: ComponentTypeEnum,
  name: ShaderAttributeOrSemanticsOrString,
  isImmediateValue: boolean,
  immediateValue?: string
}

type MaterialNodeUID = number;
type InputConnectionType = {materialNodeUid: number, outputNameOfPrev: string, inputNameOfThis: string};

export default abstract class AbstractMaterialNode extends RnObject {
  protected __semantics: ShaderSemanticsInfo[] = [];
  private __shaderNode: ShaderNodeEnum[] = [];
  protected __vertexInputs: ShaderSocket[] = [];
  protected __pixelInputs: ShaderSocket[] = [];
  protected __vertexOutputs: ShaderSocket[] = [];
  protected __pixelOutputs: ShaderSocket[] = [];
  private static readonly __invalidMaterialNodeUid = -1;
  private static __invalidMaterialNodeCount = -1;
  private __materialNodeUid: MaterialNodeUID;
  protected __vertexInputConnections: InputConnectionType[] = [];
  protected __pixelInputConnections: InputConnectionType[] = [];
  static materialNodes: AbstractMaterialNode[] = [];
  public readonly shader: GLSLShader;
  public readonly shaderFunctionName: string;
  public isSingleOperation = false;

  protected static __webglResourceRepository?: WebGLResourceRepository;
  private static __transposedMatrix44 = new MutableRowMajarMatrix44([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  protected static __dummyWhiteTexture = new Texture();
  protected static __dummyBlueTexture = new Texture();
  protected static __dummyBlackTexture = new Texture();
  protected static __dummyBlackCubeTexture = new CubeTexture();


  constructor(shader: GLSLShader, shaderFunctionName: string) {
    super();
    this.shader = shader;
    this.shaderFunctionName = shaderFunctionName;
    this.__materialNodeUid = ++AbstractMaterialNode.__invalidMaterialNodeCount;
    AbstractMaterialNode.materialNodes[AbstractMaterialNode.__invalidMaterialNodeCount] = this;

  }

  static getMaterialNode(materialNodeUid: MaterialNodeUID) {
    return AbstractMaterialNode.materialNodes[materialNodeUid];
  }

  get materialNodeUid() {
    return this.__materialNodeUid;
  }

  get _semanticsInfoArray() {
    return this.__semantics;
  }

  setShaderSemanticsInfoArray(shaderSemanticsInfoArray: ShaderSemanticsInfo[]) {
    this.__semantics = shaderSemanticsInfoArray;
  }

  addVertexInputConnection(materialNode: AbstractMaterialNode, outputNameOfPrev: string, inputNameOfThis: string) {
    this.__vertexInputConnections.push({materialNodeUid: materialNode.materialNodeUid, outputNameOfPrev: outputNameOfPrev, inputNameOfThis: inputNameOfThis});
  }

  addPixelInputConnection(materialNode: AbstractMaterialNode, outputNameOfPrev: string, inputNameOfThis: string) {
    this.__pixelInputConnections.push({materialNodeUid: materialNode.materialNodeUid, outputNameOfPrev: outputNameOfPrev, inputNameOfThis: inputNameOfThis});
  }

  get vertexInputConnections(): InputConnectionType[] {
    return this.__vertexInputConnections;
  }

  get pixelInputConnections(): InputConnectionType[] {
    return this.__pixelInputConnections;
  }

  getVertexInput(name:string): ShaderSocket|undefined {
    for (let input of this.__vertexInputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getVertexOutput(name:string): ShaderSocket|undefined {
    for (let output of this.__vertexOutputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  getPixelInput(name:string): ShaderSocket|undefined {
    for (let input of this.__pixelInputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getPixelOutput(name:string): ShaderSocket|undefined {
    for (let output of this.__pixelOutputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  public static initDefaultTextures() {
    if (this.__dummyWhiteTexture.isTextureReady) {
      return;
    }
    AbstractMaterialNode.__webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    this.__dummyWhiteTexture.generate1x1TextureFrom();
    this.__dummyBlueTexture.generate1x1TextureFrom("rgba(127.5, 127.5, 255, 1)");
    this.__dummyBlackTexture.generate1x1TextureFrom("rgba(0, 0, 0, 1)");
    this.__dummyBlackCubeTexture.load1x1Texture("rgba(0, 0, 0, 1)");
  }

  static setWorldMatrix(shaderProgram: WebGLProgram, worldMatrix: RowMajarMatrix44) {
    RowMajarMatrix44.transposeTo(worldMatrix, this.__transposedMatrix44);
    this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.WorldMatrix.str, true, this.__transposedMatrix44);
  }

  static setNormalMatrix(shaderProgram: WebGLProgram, normalMatrix: Matrix44) {
    this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.NormalMatrix.str, true, normalMatrix);
  }

  static setViewInfo(shaderProgram: WebGLProgram, cameraComponent: CameraComponent) {
    this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.ViewMatrix.str, true, cameraComponent.viewMatrix);

    const cameraPosition = cameraComponent.worldPosition;
    this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.ViewPosition.str, true, cameraPosition);
  }

  static setProjection(shaderProgram: WebGLProgram, cameraComponent: CameraComponent) {
    this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.ProjectionMatrix.str, true, cameraComponent.projectionMatrix);
  }

  static setSkinning(shaderProgram: WebGLProgram, skeletalComponent: SkeletalComponent) {
    if (skeletalComponent) {
      const jointMatrices = skeletalComponent.jointMatrices;
      const jointCompressedChanks = skeletalComponent.jointCompressedChanks;
      if (jointMatrices != null) {
        this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.BoneMatrix.str, true, jointMatrices );
      }
      if (jointCompressedChanks != null) {
        this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.BoneCompressedChank.str, true, jointCompressedChanks);
        this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.BoneCompressedInfo.str, true, skeletalComponent.jointCompressedInfo);
      }
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.SkinningMode.str, true, true);
    } else {
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.SkinningMode.str, true, false);
    }
  }

  static setLightsInfo(shaderProgram: WebGLProgram, lightComponents: LightComponent[]) {
    this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.LightNumber.str, true, lightComponents!.length);
    for (let i = 0; i < lightComponents!.length; i++) {
      if (i >= Config.maxLightNumberInShader) {
        break;
      }
      const lightComponent = lightComponents![i];
      const sceneGraphComponent = lightComponent.entity.getSceneGraph();
      const worldLightPosition = sceneGraphComponent.worldPosition;
      const worldLightDirection = lightComponent.direction;
      const worldLightIntensity = lightComponent.intensity;
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.LightPosition.str, true, { x: worldLightPosition.x, y: worldLightPosition.y, z: worldLightPosition.z, w: lightComponent.type.index }, i);
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.LightDirection.str, true, { x: worldLightDirection.x, y: worldLightDirection.y, z: worldLightDirection.z, w: 0 }, i);
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.LightIntensity.str, true, { x: worldLightIntensity.x, y: worldLightIntensity.y, z: worldLightIntensity.z, w: 0 }, i);
    }
  }
}

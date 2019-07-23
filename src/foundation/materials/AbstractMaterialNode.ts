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
import Material from "./Material";
import MutableVector2 from "../math/MutableVector2";
import MutableVector4 from "../math/MutableVector4";

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
  protected __definitions = '';

  protected static __webglResourceRepository?: WebGLResourceRepository;
  private static __transposedMatrix44 = new MutableRowMajarMatrix44([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  protected static __dummyWhiteTexture = new Texture();
  protected static __dummyBlueTexture = new Texture();
  protected static __dummyBlackTexture = new Texture();
  protected static __dummyBlackCubeTexture = new CubeTexture();

  protected static __tmp_vector4 = MutableVector4.zero();
  protected static __tmp_vector2 = MutableVector2.zero();


  constructor(shader: GLSLShader, shaderFunctionName: string) {
    super();
    this.shader = shader;
    this.shaderFunctionName = shaderFunctionName;
    this.__materialNodeUid = ++AbstractMaterialNode.__invalidMaterialNodeCount;
    AbstractMaterialNode.materialNodes[AbstractMaterialNode.__invalidMaterialNodeCount] = this;

  }

  get definitions() {
    return this.__definitions;
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
    const infoArray: ShaderSemanticsInfo[] = [];
    for (let info of shaderSemanticsInfoArray) {
      if (info.compositionType === CompositionType.Vec4Array || info.compositionType === CompositionType.Vec3Array ||  info.compositionType == CompositionType.Vec2Array) {
        for (let i = 0; i<info.maxIndex!; i++) {
          const anotherInfo = Object.assign({}, info);
          anotherInfo.index = i;
          anotherInfo.maxIndex = info.maxIndex;
          infoArray.push(anotherInfo);
        }
      } else {
        infoArray.push(info);
      }
      infoArray.push()
    }
    this.__semantics = infoArray;
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

  static setViewInfo(shaderProgram: WebGLProgram, cameraComponent: CameraComponent, material: Material, setUniform: boolean) {
    const cameraPosition = cameraComponent.worldPosition;
    if (setUniform) {
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.ViewMatrix.str, true, cameraComponent.viewMatrix);
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.ViewPosition.str, true, cameraPosition);
    } else {
      material.setParameter(ShaderSemantics.ViewMatrix, cameraComponent.viewMatrix);
      material.setParameter(ShaderSemantics.ViewPosition, cameraPosition);
    }
  }

  static setProjection(shaderProgram: WebGLProgram, cameraComponent: CameraComponent, material: Material, setUniform: boolean) {
    if (setUniform) {
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.ProjectionMatrix.str, true, cameraComponent.projectionMatrix);
    } else {
      material.setParameter(ShaderSemantics.ProjectionMatrix, cameraComponent.projectionMatrix);
    }
  }

  static setSkinning(shaderProgram: WebGLProgram, skeletalComponent: SkeletalComponent, setUniform: boolean) {
    if (skeletalComponent) {
      if (setUniform) {
        const jointMatrices = skeletalComponent.jointMatrices;
        const jointCompressedChanks = skeletalComponent.jointCompressedChanks;
        if (jointMatrices != null) {
          this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.BoneMatrix.str, true, jointMatrices );
        }
        if (jointCompressedChanks != null) {
          const chanks = jointCompressedChanks;
          const length = chanks!.length / 4;
            for (let i=0; i<length; i++) {
              AbstractMaterialNode.__tmp_vector4.x = chanks[i*4+0];
              AbstractMaterialNode.__tmp_vector4.y = chanks[i*4+1];
              AbstractMaterialNode.__tmp_vector4.z = chanks[i*4+2];
              AbstractMaterialNode.__tmp_vector4.w = chanks[i*4+3];
              this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.BoneCompressedChank.str, true, AbstractMaterialNode.__tmp_vector4, i);
            }

          // this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.BoneCompressedChank.str, true, jointCompressedChanks);
          this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.BoneCompressedInfo.str, true, skeletalComponent.jointCompressedInfo);
        }
        this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.SkinningMode.str, true, true);
      }
    } else {
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.SkinningMode.str, true, false);
    }
  }

  static setLightsInfo(shaderProgram: WebGLProgram, lightComponents: LightComponent[], material: Material, setUniform: boolean) {
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

      if (setUniform) {
        this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.LightPosition.str, true, { x: worldLightPosition.x, y: worldLightPosition.y, z: worldLightPosition.z, w: lightComponent.type.index }, i);
        this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.LightDirection.str, true, { x: worldLightDirection.x, y: worldLightDirection.y, z: worldLightDirection.z, w: 0 }, i);
        this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.LightIntensity.str, true, { x: worldLightIntensity.x, y: worldLightIntensity.y, z: worldLightIntensity.z, w: 0 }, i);
      } else {
        const __tmp_vector4 = AbstractMaterialNode.__tmp_vector4;
        __tmp_vector4.x = worldLightPosition.x;
        __tmp_vector4.y = worldLightPosition.y;
        __tmp_vector4.z = worldLightPosition.z;
        __tmp_vector4.w = lightComponent.type.index;
        material.setParameter(ShaderSemantics.LightPosition, __tmp_vector4, i);

        __tmp_vector4.x = worldLightDirection.x;
        __tmp_vector4.y = worldLightDirection.y;
        __tmp_vector4.z = worldLightDirection.z;
        __tmp_vector4.w = 0;
        material.setParameter(ShaderSemantics.LightDirection, __tmp_vector4, i);

        __tmp_vector4.x = worldLightIntensity.x;
        __tmp_vector4.y = worldLightIntensity.y;
        __tmp_vector4.z = worldLightIntensity.z;
        __tmp_vector4.w = 0;
        material.setParameter(ShaderSemantics.LightIntensity, __tmp_vector4, i);
      }
    }
  }

  setParametersForGPU({material, shaderProgram, firstTime, args}: {material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any}) {

  }
}

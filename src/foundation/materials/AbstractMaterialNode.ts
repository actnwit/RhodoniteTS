import RnObject from "../core/RnObject";
import { ShaderSemanticsInfo, ShaderSemanticsEnum, ShaderSemantics } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import { CompositionTypeEnum, ComponentTypeEnum, VertexAttributeEnum } from "../main";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import GLSLShader from "../../webgl/shaders/GLSLShader";
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
import Vector3 from "../math/Vector3";
import MutableMatrix44 from "../math/MutableMatrix44";
import MeshComponent from "../components/MeshComponent";
import Primitive, { Attributes } from "../geometry/Primitive";
import Accessor from "../memory/Accessor";
import { VertexAttribute } from "../definitions/VertexAttribute";
import BlendShapeComponent from "../components/BlendShapeComponent";

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

  protected __webglResourceRepository: WebGLResourceRepository;
  protected static __gl?: WebGLRenderingContext;
  private static __transposedMatrix44 = new MutableMatrix44([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  protected static __dummyWhiteTexture = new Texture();
  protected static __dummyBlueTexture = new Texture();
  protected static __dummyBlackTexture = new Texture();
  protected static __dummyBlackCubeTexture = new CubeTexture();

  protected static __tmp_vector4 = MutableVector4.zero();
  protected static __tmp_vector2 = MutableVector2.zero();
  private __isMorphing: boolean;
  private __isSkinning: boolean;
  private __isLighing: boolean;


  constructor(shader: GLSLShader, shaderFunctionName: string, enables = {isMorphing: false, isSkinning: false, isLighting: false}) {
    super();
    this.shader = shader;
    this.shaderFunctionName = shaderFunctionName;
    this.__materialNodeUid = ++AbstractMaterialNode.__invalidMaterialNodeCount;
    AbstractMaterialNode.materialNodes[AbstractMaterialNode.__invalidMaterialNodeCount] = this;

    this.__isMorphing = enables.isMorphing;
    this.__isSkinning = enables.isSkinning;
    this.__isLighing = enables.isLighting;

    this.__webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
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
        if (info.setEach === true) {
          for (let i = 0; i<info.maxIndex!; i++) {
            const anotherInfo = Object.assign({}, info);
            anotherInfo.index = i;
            anotherInfo.maxIndex = info.maxIndex;
            infoArray.push(anotherInfo);
          }
        } else {
          infoArray.push(info);
        }
      } else {
        infoArray.push(info);
      }
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

    this.__dummyWhiteTexture.generate1x1TextureFrom();
    this.__dummyBlueTexture.generate1x1TextureFrom("rgba(127.5, 127.5, 255, 1)");
    this.__dummyBlackTexture.generate1x1TextureFrom("rgba(0, 0, 0, 1)");
    this.__dummyBlackCubeTexture.load1x1Texture("rgba(0, 0, 0, 1)");
  }

  protected setWorldMatrix(shaderProgram: WebGLProgram, worldMatrix: Matrix44) {
    (shaderProgram as any)._gl.uniformMatrix4fv((shaderProgram as any).worldMatrix, false, worldMatrix.v);
  }

  protected setNormalMatrix(shaderProgram: WebGLProgram, normalMatrix: Matrix44) {
    (shaderProgram as any)._gl.uniformMatrix3fv((shaderProgram as any).normalMatrix, false, normalMatrix.v);
  }

  protected setViewInfo(shaderProgram: WebGLProgram, cameraComponent: CameraComponent, material: Material, setUniform: boolean) {
    if (cameraComponent) {
      const cameraPosition = cameraComponent.worldPosition;
      if (setUniform) {
        (shaderProgram as any)._gl.uniformMatrix4fv((shaderProgram as any).viewMatrix, false, cameraComponent.viewMatrix.v);
        (shaderProgram as any)._gl.uniform3fv((shaderProgram as any).viewPosition, cameraPosition.v);
      } else {
        material.setParameter(ShaderSemantics.ViewMatrix, cameraComponent.viewMatrix);
        material.setParameter(ShaderSemantics.ViewPosition, cameraPosition);
      }
    } else {
      const mat = MutableMatrix44.identity();
      const pos = new Vector3(0,0,10);
      if (setUniform) {
        (shaderProgram as any)._gl.uniformMatrix4fv((shaderProgram as any).viewMatrix, false, mat.v);
        (shaderProgram as any)._gl.uniform3fv((shaderProgram as any).viewPosition, pos.v);
      } else {
        material.setParameter(ShaderSemantics.ViewMatrix, mat);
        material.setParameter(ShaderSemantics.ViewPosition, pos);
      }
    }
  }

  protected setProjection(shaderProgram: WebGLProgram, cameraComponent: CameraComponent, material: Material, setUniform: boolean) {
    if (cameraComponent) {
      if (setUniform) {
        (shaderProgram as any)._gl.uniformMatrix4fv((shaderProgram as any).projectionMatrix, false, cameraComponent.projectionMatrix.v);
      } else {
        material.setParameter(ShaderSemantics.ProjectionMatrix, cameraComponent.projectionMatrix);
      }
    } else {
      this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.ProjectionMatrix.str, true, MutableMatrix44.identity());
    }
  }

  protected setSkinning(shaderProgram: WebGLProgram, skeletalComponent: SkeletalComponent, setUniform: boolean) {
    if (!this.__isSkinning) {
      return;
    }
    if (skeletalComponent) {
      if (setUniform) {
        const jointQuaternionArray = skeletalComponent.jointQuaternionArray;
        const jointTranslateScaleArray = skeletalComponent.jointTranslateScaleArray;
        (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneQuaternion, jointQuaternionArray);
        (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneTranslateScale, jointTranslateScaleArray);

        this.__webglResourceRepository!.setUniformValue(shaderProgram, ShaderSemantics.SkinningMode.str, true, skeletalComponent.componentSID);
      }
    } else {
      if (setUniform) {
        (shaderProgram as any)._gl.uniform1i((shaderProgram as any).skinningMode, -1);
      }
    }
  }

  protected setLightsInfo(shaderProgram: WebGLProgram, lightComponents: LightComponent[], material: Material, setUniform: boolean) {
    if (!this.__isLighing) {
      return;
    }
    if (setUniform) {
      (shaderProgram as any)._gl.uniform1i((shaderProgram as any).lightNumber, lightComponents!.length);
    } else {
      material.setParameter(ShaderSemantics.LightNumber, lightComponents!.length);
    }
    /*
    for (let i = 0; i < lightComponents!.length; i++) {
      if (i >= Config.maxLightNumberInShader) {
        break;
      }
      if ((shaderProgram as any).lightPosition == null) {
        break;
      }
      const lightComponent = lightComponents![i];
      const sceneGraphComponent = lightComponent.entity.getSceneGraph();
      const worldLightPosition = sceneGraphComponent.worldPosition;
      const worldLightDirection = lightComponent.direction;
      const worldLightIntensity = lightComponent.intensity;

      if (setUniform) {
        (shaderProgram as any)._gl.uniform4f((shaderProgram as any).lightPosition[i], worldLightPosition.x, worldLightPosition.y, worldLightPosition.z, lightComponent.type.index);
        (shaderProgram as any)._gl.uniform4f((shaderProgram as any).lightDirection[i], worldLightDirection.x, worldLightDirection.y, worldLightDirection.z, 0);
        (shaderProgram as any)._gl.uniform4f((shaderProgram as any).lightIntensity[i], worldLightIntensity.x, worldLightIntensity.y, worldLightIntensity.z, 0);
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
    */
  }

  setMorphInfo(shaderProgram: WebGLProgram, meshComponent: MeshComponent, blendShapeComponent: BlendShapeComponent, primitive: Primitive) {
    if (!this.__isMorphing) {
      return;
    }
    if (primitive.targets.length === 0) {
      (shaderProgram as any)._gl.uniform1i((shaderProgram as any).morphTargetNumber, 0);
      return;
    }
    (shaderProgram as any)._gl.uniform1i((shaderProgram as any).morphTargetNumber, meshComponent.mesh!.weights.length);
    const array: number[] = primitive.targets.map((target: Attributes)=>{
      const accessor = target.get(VertexAttribute.Position) as Accessor;
      return accessor.byteOffsetInBuffer / 4 / 4;
    });
    (shaderProgram as any)._gl.uniform1fv((shaderProgram as any).dataTextureMorphOffsetPosition, array);
    let weights;
    if (blendShapeComponent && blendShapeComponent.weights.length > 0) {
      weights = blendShapeComponent.weights;
    } else if (meshComponent.mesh!.weights.length > 0) {
      weights = meshComponent.mesh!.weights;
    } else {
      weights = new Float32Array(primitive.targets.length);
      (shaderProgram as any)._gl.uniform1i((shaderProgram as any).morphTargetNumber, 0);
    }
    (shaderProgram as any)._gl.uniform1fv((shaderProgram as any).morphWeights, weights);

  }
  setParametersForGPU({material, shaderProgram, firstTime, args}: {material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any}) {

  }
}

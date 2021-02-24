import RnObject from '../../core/RnObject';
import {
  ShaderSemanticsInfo,
  ShaderSemanticsEnum,
  ShaderSemantics,
  ShaderSemanticsStr,
} from '../../definitions/ShaderSemantics';
import {CompositionTypeEnum} from '../../definitions/CompositionType';
import {ComponentTypeEnum} from '../../definitions/ComponentType';
import GLSLShader from '../../../webgl/shaders/GLSLShader';
import CGAPIResourceRepository from '../../renderer/CGAPIResourceRepository';
import Matrix44 from '../../math/Matrix44';
import WebGLResourceRepository from '../../../webgl/WebGLResourceRepository';
import Texture from '../../textures/Texture';
import CubeTexture from '../../textures/CubeTexture';
import LightComponent from '../../components/LightComponent';
import Config from '../../core/Config';
import CameraComponent from '../../components/CameraComponent';
import SkeletalComponent from '../../components/SkeletalComponent';
import Material from './Material';
import MutableVector2 from '../../math/MutableVector2';
import MutableVector4 from '../../math/MutableVector4';
import Vector3 from '../../math/Vector3';
import MutableMatrix44 from '../../math/MutableMatrix44';
import MeshComponent from '../../components/MeshComponent';
import Primitive, {Attributes} from '../../geometry/Primitive';
import Accessor from '../../memory/Accessor';
import {
  VertexAttribute,
  VertexAttributeEnum,
} from '../../definitions/VertexAttribute';
import BlendShapeComponent from '../../components/BlendShapeComponent';
import MemoryManager from '../../core/MemoryManager';
import {BufferUse} from '../../definitions/BufferUse';
import {ProcessApproach} from '../../definitions/ProcessApproach';
import {ShaderityObject} from 'shaderity';
import {BoneDataType} from '../../definitions/BoneDataType';
import SystemState from '../../system/SystemState';
import {ShaderTypeEnum, ShaderType} from '../../definitions/ShaderType';

export type ShaderAttributeOrSemanticsOrString =
  | string
  | VertexAttributeEnum
  | ShaderSemanticsEnum;

export type ShaderSocket = {
  compositionType: CompositionTypeEnum;
  componentType: ComponentTypeEnum;
  name: ShaderAttributeOrSemanticsOrString;
  isClosed?: boolean;
};

type MaterialNodeTypeName = string;
type MaterialNodeUID = number;
type InputConnectionType = {
  materialNodeUid: number;
  outputNameOfPrev: string;
  inputNameOfThis: string;
};

export default abstract class AbstractMaterialNode extends RnObject {
  protected __semantics: ShaderSemanticsInfo[] = [];
  protected static __semanticsMap: Map<
    MaterialNodeTypeName,
    Map<ShaderSemanticsStr, ShaderSemanticsInfo>
  > = new Map();
  protected __vertexInputs: ShaderSocket[] = [];
  protected __pixelInputs: ShaderSocket[] = [];
  protected __vertexOutputs: ShaderSocket[] = [];
  protected __pixelOutputs: ShaderSocket[] = [];
  protected __defaultInputValues: Map<string, any> = new Map();
  private static readonly __invalidMaterialNodeUid = -1;
  private static __invalidMaterialNodeCount = -1;
  protected __materialNodeUid: MaterialNodeUID;
  protected __vertexInputConnections: InputConnectionType[] = [];
  protected __pixelInputConnections: InputConnectionType[] = [];
  static materialNodes: AbstractMaterialNode[] = [];
  protected __shader: GLSLShader | null;
  protected __shaderFunctionName: string;
  public isSingleOperation = false;
  protected __definitions = '';

  protected __webglResourceRepository: WebGLResourceRepository;
  protected static __gl?: WebGLRenderingContext;
  private static __transposedMatrix44 = new MutableMatrix44([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]);
  protected static __dummyWhiteTexture = new Texture();
  protected static __dummyBlueTexture = new Texture();
  protected static __dummyBlackTexture = new Texture();
  protected static __dummyBlackCubeTexture = new CubeTexture();

  protected static __tmp_vector4 = MutableVector4.zero();
  protected static __tmp_vector2 = MutableVector2.zero();
  private __isMorphing: boolean;
  private __isSkinning: boolean;
  private __isLighting: boolean;
  private static __lightPositions = new Float32Array(0);
  private static __lightDirections = new Float32Array(0);
  private static __lightIntensities = new Float32Array(0);

  protected __vertexShaderityObject?: ShaderityObject;
  protected __pixelShaderityObject?: ShaderityObject;

  public shaderType: ShaderTypeEnum = ShaderType.VertexAndPixelShader;

  constructor(
    shader: GLSLShader | null,
    shaderFunctionName: string,
    {isMorphing = false, isSkinning = false, isLighting = false} = {},
    vertexShaderityObject?: ShaderityObject,
    pixelShaderityObject?: ShaderityObject
  ) {
    super();
    this.__shader = shader;
    this.__shaderFunctionName = shaderFunctionName;
    this.__materialNodeUid = ++AbstractMaterialNode.__invalidMaterialNodeCount;
    AbstractMaterialNode.materialNodes[
      AbstractMaterialNode.__invalidMaterialNodeCount
    ] = this;

    this.__isMorphing = isMorphing;
    this.__isSkinning = isSkinning;
    this.__isLighting = isLighting;

    AbstractMaterialNode.__dummyBlackTexture.tryToSetUniqueName(
      'dummyBlackTexture',
      true
    );
    AbstractMaterialNode.__dummyWhiteTexture.tryToSetUniqueName(
      'dummyWhiteTexture',
      true
    );
    AbstractMaterialNode.__dummyBlueTexture.tryToSetUniqueName(
      'dummyBlueTexture',
      true
    );
    AbstractMaterialNode.__dummyBlackCubeTexture.tryToSetUniqueName(
      'dummyBlackCubeTexture',
      true
    );

    this.__vertexShaderityObject = vertexShaderityObject;
    this.__pixelShaderityObject = pixelShaderityObject;

    this.__webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.__definitions += `#define RN_MATERIAL_NODE_NAME ${shaderFunctionName}\n`;
  }

  get shaderFunctionName() {
    return this.__shaderFunctionName;
  }

  get shader() {
    return this.__shader;
  }

  get vertexShaderityObject() {
    return this.__vertexShaderityObject;
  }

  get pixelShaderityObject() {
    return this.__pixelShaderityObject;
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

  get isSkinning() {
    return this.__isSkinning;
  }
  get isMorphing() {
    return this.__isMorphing;
  }
  get isLighting() {
    return this.__isLighting;
  }

  setShaderSemanticsInfoArray(shaderSemanticsInfoArray: ShaderSemanticsInfo[]) {
    const infoArray: ShaderSemanticsInfo[] = [];
    for (const info of shaderSemanticsInfoArray) {
      infoArray.push(info);
    }
    this.__semantics = infoArray;

    if (!AbstractMaterialNode.__semanticsMap.has(this.shaderFunctionName)) {
      AbstractMaterialNode.__semanticsMap.set(
        this.shaderFunctionName,
        new Map()
      );
    }
    const map = AbstractMaterialNode.__semanticsMap.get(
      this.shaderFunctionName
    )!;
    for (const semantic of this.__semantics) {
      map.set(semantic.semantic.str, semantic);
    }
  }

  getShaderSemanticInfoFromName(name: string) {
    const map = AbstractMaterialNode.__semanticsMap.get(
      this.shaderFunctionName
    )!;
    return map.get(name);
  }

  addVertexInputConnection(
    inputMaterialNode: AbstractMaterialNode,
    outputNameOfPrev: string,
    inputNameOfThis: string
  ) {
    this.__vertexInputConnections.push({
      materialNodeUid: inputMaterialNode.materialNodeUid,
      outputNameOfPrev: outputNameOfPrev,
      inputNameOfThis: inputNameOfThis,
    });
  }

  addPixelInputConnection(
    inputMaterialNode: AbstractMaterialNode,
    outputNameOfPrev: string,
    inputNameOfThis: string
  ) {
    this.__pixelInputConnections.push({
      materialNodeUid: inputMaterialNode.materialNodeUid,
      outputNameOfPrev: outputNameOfPrev,
      inputNameOfThis: inputNameOfThis,
    });
  }

  get vertexInputConnections(): InputConnectionType[] {
    return this.__vertexInputConnections;
  }

  get pixelInputConnections(): InputConnectionType[] {
    return this.__pixelInputConnections;
  }

  getVertexInput(name: string): ShaderSocket | undefined {
    for (const input of this.__vertexInputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getVertexInputs() {
    return this.__vertexInputs;
  }

  getVertexOutput(name: string): ShaderSocket | undefined {
    for (const output of this.__vertexOutputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  getVertexOutputs() {
    return this.__vertexOutputs;
  }

  getPixelInput(name: string): ShaderSocket | undefined {
    for (const input of this.__pixelInputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getPixelInputs() {
    return this.__pixelInputs;
  }

  getPixelOutput(name: string): ShaderSocket | undefined {
    for (const output of this.__pixelOutputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  getPixelOutputs() {
    return this.__pixelOutputs;
  }

  public static initDefaultTextures() {
    if (this.__dummyWhiteTexture.isTextureReady) {
      return;
    }

    this.__dummyWhiteTexture.generate1x1TextureFrom();
    this.__dummyBlueTexture.generate1x1TextureFrom(
      'rgba(127.5, 127.5, 255, 1)'
    );
    this.__dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
    this.__dummyBlackCubeTexture.load1x1Texture('rgba(0, 0, 0, 1)');
  }

  static get dummyWhiteTexture() {
    return this.__dummyWhiteTexture;
  }
  static get dummyBlackTexture() {
    return this.__dummyBlackTexture;
  }
  static get dummyBlueTexture() {
    return this.__dummyBlueTexture;
  }
  static get dummyBlackCubeTexture() {
    return this.__dummyWhiteTexture;
  }

  protected setWorldMatrix(shaderProgram: WebGLProgram, worldMatrix: Matrix44) {
    (shaderProgram as any)._gl.uniformMatrix4fv(
      (shaderProgram as any).worldMatrix,
      false,
      worldMatrix.v
    );
  }

  protected setNormalMatrix(
    shaderProgram: WebGLProgram,
    normalMatrix: Matrix44
  ) {
    (shaderProgram as any)._gl.uniformMatrix3fv(
      (shaderProgram as any).normalMatrix,
      false,
      normalMatrix.v
    );
  }

  protected setViewInfo(
    shaderProgram: WebGLProgram,
    cameraComponent: CameraComponent,
    material: Material,
    setUniform: boolean
  ) {
    if (cameraComponent) {
      const cameraPosition = cameraComponent.worldPosition;
      if (setUniform) {
        (shaderProgram as any)._gl.uniformMatrix4fv(
          (shaderProgram as any).viewMatrix,
          false,
          cameraComponent.viewMatrix.v
        );
        (shaderProgram as any)._gl.uniform3fv(
          (shaderProgram as any).viewPosition,
          cameraPosition.v
        );
      } else {
        // material.setParameter(ShaderSemantics.ViewMatrix, cameraComponent.viewMatrix);
        // material.setParameter(ShaderSemantics.ViewPosition, cameraPosition);
      }
    } else {
      const mat = MutableMatrix44.identity();
      const pos = new Vector3(0, 0, 10);
      if (setUniform) {
        (shaderProgram as any)._gl.uniformMatrix4fv(
          (shaderProgram as any).viewMatrix,
          false,
          mat.v
        );
        (shaderProgram as any)._gl.uniform3fv(
          (shaderProgram as any).viewPosition,
          pos.v
        );
      } else {
        // material.setParameter(ShaderSemantics.ViewMatrix, mat);
        // material.setParameter(ShaderSemantics.ViewPosition, pos);
      }
    }
  }

  protected setProjection(
    shaderProgram: WebGLProgram,
    cameraComponent: CameraComponent,
    material: Material,
    setUniform: boolean
  ) {
    if (cameraComponent) {
      if (setUniform) {
        (shaderProgram as any)._gl.uniformMatrix4fv(
          (shaderProgram as any).projectionMatrix,
          false,
          cameraComponent.projectionMatrix.v
        );
      } else {
        // material.setParameter(ShaderSemantics.ProjectionMatrix, cameraComponent.projectionMatrix);
      }
    } else {
      if (setUniform) {
        this.__webglResourceRepository!.setUniformValue(
          shaderProgram,
          ShaderSemantics.ProjectionMatrix.str,
          true,
          MutableMatrix44.identity()
        );
      }
    }
  }

  protected setSkinning(
    shaderProgram: WebGLProgram,
    skeletalComponent: SkeletalComponent,
    setUniform: boolean
  ) {
    if (!this.__isSkinning) {
      return;
    }
    if (skeletalComponent) {
      if (setUniform) {
        if (Config.boneDataType === BoneDataType.Mat4x4) {
          const jointMatricesArray = skeletalComponent.jointMatricesArray;
          (shaderProgram as any)._gl.uniformMatrix4fv(
            (shaderProgram as any).boneMatrix,
            false,
            jointMatricesArray
          );
        } else if (Config.boneDataType === BoneDataType.Vec4x2) {
          const jointTranslatePackedQuat =
            skeletalComponent.jointTranslatePackedQuat;
          const jointScalePackedQuat = skeletalComponent.jointScalePackedQuat;
          (shaderProgram as any)._gl.uniform4fv(
            (shaderProgram as any).boneTranslatePackedQuat,
            jointTranslatePackedQuat
          );
          (shaderProgram as any)._gl.uniform4fv(
            (shaderProgram as any).boneScalePackedQuat,
            jointScalePackedQuat
          );
        } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
          const jointQuaternionArray = skeletalComponent.jointQuaternionArray;
          const jointTranslateScaleArray =
            skeletalComponent.jointTranslateScaleArray;
          (shaderProgram as any)._gl.uniform4fv(
            (shaderProgram as any).boneQuaternion,
            jointQuaternionArray
          );
          (shaderProgram as any)._gl.uniform4fv(
            (shaderProgram as any).boneTranslateScale,
            jointTranslateScaleArray
          );
        } else if (Config.boneDataType === BoneDataType.Vec4x1) {
          const jointCompressedChunk = skeletalComponent.jointCompressedChunk;
          const jointCompressedInfo = skeletalComponent.jointCompressedInfo;
          (shaderProgram as any)._gl.uniform4fv(
            (shaderProgram as any).boneCompressedChunk,
            jointCompressedChunk
          );
          (shaderProgram as any)._gl.uniform4fv(
            (shaderProgram as any).boneCompressedInfo,
            jointCompressedInfo.v
          );
        }

        (shaderProgram as any)._gl.uniform1i(
          (shaderProgram as any).skinningMode,
          skeletalComponent.componentSID
        );
      }
    } else {
      if (setUniform) {
        (shaderProgram as any)._gl.uniform1i(
          (shaderProgram as any).skinningMode,
          -1
        );
      }
    }
  }

  protected setLightsInfo(
    shaderProgram: WebGLProgram,
    lightComponents: LightComponent[],
    material: Material,
    setUniform: boolean
  ) {
    if (!this.__isLighting) {
      return;
    }
    if (setUniform) {
      (shaderProgram as any)._gl.uniform1i(
        (shaderProgram as any).lightNumber,
        lightComponents!.length
      );

      const length = Math.min(
        lightComponents!.length,
        Config.maxLightNumberInShader
      );
      if (AbstractMaterialNode.__lightPositions.length !== 4 * length) {
        AbstractMaterialNode.__lightPositions = new Float32Array(4 * length);
        AbstractMaterialNode.__lightDirections = new Float32Array(4 * length);
        AbstractMaterialNode.__lightIntensities = new Float32Array(4 * length);
      }
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

        AbstractMaterialNode.__lightPositions[i * 4 + 0] = worldLightPosition.x;
        AbstractMaterialNode.__lightPositions[i * 4 + 1] = worldLightPosition.y;
        AbstractMaterialNode.__lightPositions[i * 4 + 2] = worldLightPosition.z;
        AbstractMaterialNode.__lightPositions[i * 4 + 3] =
          lightComponent.type.index;

        AbstractMaterialNode.__lightDirections[i * 4 + 0] =
          worldLightDirection.x;
        AbstractMaterialNode.__lightDirections[i * 4 + 1] =
          worldLightDirection.y;
        AbstractMaterialNode.__lightDirections[i * 4 + 2] =
          worldLightDirection.z;
        AbstractMaterialNode.__lightDirections[i * 4 + 3] = 0;

        AbstractMaterialNode.__lightIntensities[i * 4 + 0] =
          worldLightIntensity.x;
        AbstractMaterialNode.__lightIntensities[i * 4 + 1] =
          worldLightIntensity.y;
        AbstractMaterialNode.__lightIntensities[i * 4 + 2] =
          worldLightIntensity.z;
        AbstractMaterialNode.__lightIntensities[i * 4 + 3] = 0;
      }
      if (length > 0) {
        (shaderProgram as any)._gl.uniform4fv(
          (shaderProgram as any).lightPosition,
          AbstractMaterialNode.__lightPositions
        );
        (shaderProgram as any)._gl.uniform4fv(
          (shaderProgram as any).lightDirection,
          AbstractMaterialNode.__lightDirections
        );
        (shaderProgram as any)._gl.uniform4fv(
          (shaderProgram as any).lightIntensity,
          AbstractMaterialNode.__lightIntensities
        );
      }
    }
  }

  setMorphInfo(
    shaderProgram: WebGLProgram,
    meshComponent: MeshComponent,
    blendShapeComponent: BlendShapeComponent,
    primitive: Primitive
  ) {
    if (!this.__isMorphing) {
      return;
    }
    if (primitive.targets.length === 0) {
      (shaderProgram as any)._gl.uniform1i(
        (shaderProgram as any).morphTargetNumber,
        0
      );
      return;
    }

    const memoryManager = MemoryManager.getInstance();
    (shaderProgram as any)._gl.uniform1i(
      (shaderProgram as any).morphTargetNumber,
      primitive.targets.length
    );
    const array: number[] = primitive.targets.map((target: Attributes) => {
      const accessor = target.get(VertexAttribute.Position) as Accessor;
      let offset = 0;
      let offset2 = 0;

      if (
        ProcessApproach.isFastestApproach(SystemState.currentProcessApproach)
      ) {
        offset = Config.totalSizeOfGPUShaderDataStorageExceptMorphData;
        offset2 = memoryManager.createOrGetBuffer(BufferUse.GPUInstanceData)
          .takenSizeInByte;
      }
      return (offset + accessor.byteOffsetInBuffer) / 4 / 4;
    });
    (shaderProgram as any)._gl.uniform1iv(
      (shaderProgram as any).dataTextureMorphOffsetPosition,
      array
    );
    let weights;
    if (meshComponent.mesh!.weights.length > 0) {
      weights = meshComponent.mesh!.weights;
    } else if (blendShapeComponent.weights.length > 0) {
      weights = blendShapeComponent.weights;
    } else {
      weights = new Float32Array(primitive.targets.length);
    }
    (shaderProgram as any)._gl.uniform1fv(
      (shaderProgram as any).morphWeights,
      weights
    );
  }

  setParametersForGPU({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args?: any;
  }) {}

  setDefaultInputValue(inputName: string, value: any) {
    this.__defaultInputValues.set(inputName, value);
  }
}

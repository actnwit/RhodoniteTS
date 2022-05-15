import {RnObject} from '../../core/RnObject';
import {
  ShaderSemanticsEnum,
  ShaderSemanticsName,
} from '../../definitions/ShaderSemantics';
import {CompositionTypeEnum} from '../../definitions/CompositionType';
import {ComponentTypeEnum} from '../../definitions/ComponentType';
import {GLSLShader} from '../../../webgl/shaders/GLSLShader';
import {CGAPIResourceRepository} from '../../renderer/CGAPIResourceRepository';
import {Matrix44} from '../../math/Matrix44';
import {WebGLResourceRepository} from '../../../webgl/WebGLResourceRepository';
import {Texture} from '../../textures/Texture';
import {CubeTexture} from '../../textures/CubeTexture';
import {Config} from '../../core/Config';
import {SkeletalComponent} from '../../components/Skeletal/SkeletalComponent';
import {Material} from './Material';
import {MutableVector2} from '../../math/MutableVector2';
import {MutableVector4} from '../../math/MutableVector4';
import {Vector3} from '../../math/Vector3';
import {MutableMatrix44} from '../../math/MutableMatrix44';
import {MeshComponent} from '../../components/Mesh/MeshComponent';
import {Primitive, Attributes} from '../../geometry/Primitive';
import {Accessor} from '../../memory/Accessor';
import {
  VertexAttribute,
  VertexAttributeEnum,
} from '../../definitions/VertexAttribute';
import {BlendShapeComponent} from '../../components/BlendShape/BlendShapeComponent';
import {ProcessApproach} from '../../definitions/ProcessApproach';
import {ShaderityObject} from 'shaderity';
import {BoneDataType} from '../../definitions/BoneDataType';
import SystemState from '../../system/SystemState';
import {ShaderTypeEnum, ShaderType} from '../../definitions/ShaderType';
import {IVector3} from '../../math/IVector';
import {ModuleManager} from '../../system/ModuleManager';
import {RnXR} from '../../../xr/main';
import {LightComponent} from '../../components/Light/LightComponent';
import {IMatrix33} from '../../math/IMatrix';
import {RenderingArg} from '../../../webgl/types/CommonTypes';
import {ComponentRepository} from '../../core/ComponentRepository';
import {CameraComponent} from '../../components/Camera/CameraComponent';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';

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

export abstract class AbstractMaterialContent extends RnObject {
  protected __semantics: ShaderSemanticsInfo[] = [];
  protected static __semanticsMap: Map<
    MaterialNodeTypeName,
    Map<ShaderSemanticsName, ShaderSemanticsInfo>
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
  static materialNodes: AbstractMaterialContent[] = [];
  protected __shaderFunctionName: string;
  public isSingleOperation = false;
  protected __definitions = '';

  protected __webglResourceRepository: WebGLResourceRepository;
  protected static __gl?: WebGLRenderingContext;
  protected static __dummyWhiteTexture = new Texture();
  protected static __dummyBlueTexture = new Texture();
  protected static __dummyBlackTexture = new Texture();
  protected static __dummyPbrKelemenSzirmayKalosBrdfLutTexture = new Texture();
  protected static __dummySRGBGrayTexture = new Texture();
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
    this.__shaderFunctionName = shaderFunctionName;
    this.__materialNodeUid = ++AbstractMaterialContent.__invalidMaterialNodeCount;
    AbstractMaterialContent.materialNodes[
      AbstractMaterialContent.__invalidMaterialNodeCount
    ] = this;

    this.__isMorphing = isMorphing;
    this.__isSkinning = isSkinning;
    this.__isLighting = isLighting;

    AbstractMaterialContent.__dummyBlackTexture.tryToSetUniqueName(
      'dummyBlackTexture',
      true
    );
    AbstractMaterialContent.__dummyWhiteTexture.tryToSetUniqueName(
      'dummyWhiteTexture',
      true
    );
    AbstractMaterialContent.__dummyBlueTexture.tryToSetUniqueName(
      'dummyBlueTexture',
      true
    );
    AbstractMaterialContent.__dummyBlackCubeTexture.tryToSetUniqueName(
      'dummyBlackCubeTexture',
      true
    );
    AbstractMaterialContent.__dummySRGBGrayTexture.tryToSetUniqueName(
      'dummySRGBGrayTexture',
      true
    );
    AbstractMaterialContent.__dummyPbrKelemenSzirmayKalosBrdfLutTexture.tryToSetUniqueName(
      'dummyPbrKelemenSzirmayKalosBrdfLutTexture',
      true
    );

    this.__vertexShaderityObject = vertexShaderityObject;
    this.__pixelShaderityObject = pixelShaderityObject;

    this.__webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    this.__definitions += `#define RN_MATERIAL_NODE_NAME ${shaderFunctionName}\n`;
  }

  get shaderFunctionName() {
    return this.__shaderFunctionName;
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
    return AbstractMaterialContent.materialNodes[materialNodeUid];
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

    if (!AbstractMaterialContent.__semanticsMap.has(this.shaderFunctionName)) {
      AbstractMaterialContent.__semanticsMap.set(
        this.shaderFunctionName,
        new Map()
      );
    }
    const map = AbstractMaterialContent.__semanticsMap.get(
      this.shaderFunctionName
    )!;
    for (const semantic of this.__semantics) {
      map.set(semantic.semantic.str, semantic);
    }
  }

  getShaderSemanticInfoFromName(name: string) {
    const map = AbstractMaterialContent.__semanticsMap.get(
      this.shaderFunctionName
    )!;
    return map.get(name);
  }

  addVertexInputConnection(
    inputMaterialNode: AbstractMaterialContent,
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
    inputMaterialNode: AbstractMaterialContent,
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
    this.__dummySRGBGrayTexture.generate1x1TextureFrom(
      'rgba(186, 186, 186, 1)'
    );

    const moduleName = 'pbr';
    const moduleManager = ModuleManager.getInstance();
    const pbrModule = moduleManager.getModule(moduleName)! as any;
    this.__dummyPbrKelemenSzirmayKalosBrdfLutTexture.generateTextureFromUri(
      pbrModule.pbrKelemenSzirmayKalosBrdfLutDataUrl
    );
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
  static get dummyPbrKelemenSzirmayKalosBrdfLutTexture() {
    return this.__dummyPbrKelemenSzirmayKalosBrdfLutTexture;
  }

  protected setupBasicInfo(
    args: RenderingArg,
    shaderProgram: WebGLProgram,
    firstTime: boolean,
    material: Material,
    CameraComponentClass: typeof CameraComponent
  ) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      if (firstTime || args.isVr) {
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getComponent(
            CameraComponentClass,
            CameraComponentClass.current
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
        /// Skinning
        const skeletalComponent = args.entity.tryToGetSkeletal();
        this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
      }
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

  protected setWorldMatrix(shaderProgram: WebGLProgram, worldMatrix: Matrix44) {
    (shaderProgram as any)._gl.uniformMatrix4fv(
      (shaderProgram as any).worldMatrix,
      false,
      worldMatrix._v
    );
  }

  protected setNormalMatrix(
    shaderProgram: WebGLProgram,
    normalMatrix: IMatrix33
  ) {
    (shaderProgram as any)._gl.uniformMatrix3fv(
      (shaderProgram as any).normalMatrix,
      false,
      normalMatrix._v
    );
  }

  protected setViewInfo(
    shaderProgram: WebGLProgram,
    cameraComponent: CameraComponent,
    isVr: boolean,
    displayIdx: number
  ) {
    let viewMatrix: Matrix44;
    let cameraPosition: IVector3;
    if (isVr) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      if (webxrSystem.isWebXRMode) {
        viewMatrix = webxrSystem._getViewMatrixAt(displayIdx);
        cameraPosition = webxrSystem._getCameraWorldPositionAt(displayIdx);
      }
    } else if (cameraComponent) {
      cameraPosition = cameraComponent.worldPosition;
      viewMatrix = cameraComponent.viewMatrix;
    } else {
      viewMatrix = MutableMatrix44.identity();
      cameraPosition = Vector3.fromCopyArray([0, 0, 10]);
    }

    (shaderProgram as any)._gl.uniformMatrix4fv(
      (shaderProgram as any).viewMatrix,
      false,
      viewMatrix!._v
    );
    (shaderProgram as any)._gl.uniform3fv(
      (shaderProgram as any).viewPosition,
      cameraPosition!._v
    );
  }

  protected setProjection(
    shaderProgram: WebGLProgram,
    cameraComponent: CameraComponent,
    isVr: boolean,
    displayIdx: number
  ) {
    let projectionMatrix: Matrix44;
    if (isVr) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      if (webxrSystem.isWebXRMode) {
        projectionMatrix = webxrSystem._getProjectMatrixAt(displayIdx);
      }
    } else if (cameraComponent) {
      projectionMatrix = cameraComponent.projectionMatrix;
    } else {
      projectionMatrix = MutableMatrix44.identity();
    }
    (shaderProgram as any)._gl.uniformMatrix4fv(
      (shaderProgram as any).projectionMatrix,
      false,
      projectionMatrix!._v
    );
  }

  protected setSkinning(
    shaderProgram: WebGLProgram,
    setUniform: boolean,
    skeletalComponent?: SkeletalComponent
  ) {
    if (!this.__isSkinning) {
      return;
    }
    if (skeletalComponent) {
      if (setUniform) {
        if (Config.boneDataType === BoneDataType.Mat44x1) {
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
            jointCompressedInfo._v
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
      if (AbstractMaterialContent.__lightPositions.length !== 4 * length) {
        AbstractMaterialContent.__lightPositions = new Float32Array(4 * length);
        AbstractMaterialContent.__lightDirections = new Float32Array(4 * length);
        AbstractMaterialContent.__lightIntensities = new Float32Array(4 * length);
      }
      for (let i = 0; i < lightComponents!.length; i++) {
        if (i >= Config.maxLightNumberInShader) {
          break;
        }
        if ((shaderProgram as any).lightPosition == null) {
          break;
        }

        const lightComponent = lightComponents![i];
        const sceneGraphComponent = lightComponent.entity.getSceneGraph()!;
        const worldLightPosition = sceneGraphComponent.worldPosition;
        const worldLightDirection = lightComponent.direction;
        const worldLightIntensity = lightComponent.intensity;

        AbstractMaterialContent.__lightPositions[i * 4 + 0] = worldLightPosition.x;
        AbstractMaterialContent.__lightPositions[i * 4 + 1] = worldLightPosition.y;
        AbstractMaterialContent.__lightPositions[i * 4 + 2] = worldLightPosition.z;
        AbstractMaterialContent.__lightPositions[i * 4 + 3] =
          lightComponent.type.index;

        AbstractMaterialContent.__lightDirections[i * 4 + 0] =
          worldLightDirection.x;
        AbstractMaterialContent.__lightDirections[i * 4 + 1] =
          worldLightDirection.y;
        AbstractMaterialContent.__lightDirections[i * 4 + 2] =
          worldLightDirection.z;
        AbstractMaterialContent.__lightDirections[i * 4 + 3] = 0;

        AbstractMaterialContent.__lightIntensities[i * 4 + 0] =
          worldLightIntensity.x;
        AbstractMaterialContent.__lightIntensities[i * 4 + 1] =
          worldLightIntensity.y;
        AbstractMaterialContent.__lightIntensities[i * 4 + 2] =
          worldLightIntensity.z;
        AbstractMaterialContent.__lightIntensities[i * 4 + 3] = 0;
      }
      if (length > 0) {
        (shaderProgram as any)._gl.uniform4fv(
          (shaderProgram as any).lightPosition,
          AbstractMaterialContent.__lightPositions
        );
        (shaderProgram as any)._gl.uniform4fv(
          (shaderProgram as any).lightDirection,
          AbstractMaterialContent.__lightDirections
        );
        (shaderProgram as any)._gl.uniform4fv(
          (shaderProgram as any).lightIntensity,
          AbstractMaterialContent.__lightIntensities
        );
      }
    }
  }

  setMorphInfo(
    shaderProgram: WebGLProgram,
    meshComponent: MeshComponent,
    primitive: Primitive,
    blendShapeComponent?: BlendShapeComponent
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

    (shaderProgram as any)._gl.uniform1i(
      (shaderProgram as any).morphTargetNumber,
      primitive.targets.length
    );
    const dataTextureMorphOffsetPositionOfTargets: number[] =
      primitive.targets.map((target: Attributes) => {
        const accessor = target.get(VertexAttribute.Position.XYZ) as Accessor;
        let offset = 0;

        if (
          ProcessApproach.isFastestApproach(SystemState.currentProcessApproach)
        ) {
          offset = Config.totalSizeOfGPUShaderDataStorageExceptMorphData;
        }
        return (offset + accessor.byteOffsetInBuffer) / 4 / 4;
      });
    (shaderProgram as any)._gl.uniform1iv(
      (shaderProgram as any).dataTextureMorphOffsetPosition,
      dataTextureMorphOffsetPositionOfTargets
    );
    let weights;
    if (meshComponent.mesh!.weights.length > 0) {
      weights = meshComponent.mesh!.weights;
    } else if (blendShapeComponent!.weights.length > 0) {
      weights = blendShapeComponent!.weights;
    } else {
      weights = new Float32Array(primitive.targets.length);
    }
    (shaderProgram as any)._gl.uniform1fv(
      (shaderProgram as any).morphWeights,
      weights
    );
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
  }) {}

  setDefaultInputValue(inputName: string, value: any) {
    this.__defaultInputValues.set(inputName, value);
  }
}

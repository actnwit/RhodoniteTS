import { RnObject } from '../../core/RnObject';
import { ShaderSemanticsEnum, ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { GLSLShader } from '../../../webgl/shaders/GLSLShader';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { Matrix44 } from '../../math/Matrix44';
import { WebGLResourceRepository } from '../../../webgl/WebGLResourceRepository';
import { Config } from '../../core/Config';
import { SkeletalComponent } from '../../components/Skeletal/SkeletalComponent';
import { Material } from './Material';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector4 } from '../../math/MutableVector4';
import { Vector3 } from '../../math/Vector3';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MeshComponent } from '../../components/Mesh/MeshComponent';
import { Primitive, Attributes } from '../../geometry/Primitive';
import { Accessor } from '../../memory/Accessor';
import { VertexAttribute, VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { BlendShapeComponent } from '../../components/BlendShape/BlendShapeComponent';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { ShaderityObject } from 'shaderity';
import { BoneDataType } from '../../definitions/BoneDataType';
import { SystemState } from '../../system/SystemState';
import { ShaderTypeEnum, ShaderType } from '../../definitions/ShaderType';
import { IVector3 } from '../../math/IVector';
import { ModuleManager } from '../../system/ModuleManager';
import { RnXR } from '../../../xr/main';
import { LightComponent } from '../../components/Light/LightComponent';
import { IMatrix33 } from '../../math/IMatrix';
import { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderityUtilityWebGPU } from './ShaderityUtilityWebGPU';
import { ShaderityUtilityWebGL } from './ShaderityUtilityWebGL';

export type ShaderAttributeOrSemanticsOrString = string | VertexAttributeEnum | ShaderSemanticsEnum;

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

  protected static __gl?: WebGLRenderingContext;
  protected __definitions = '';
  protected static __tmp_vector4 = MutableVector4.zero();
  protected static __tmp_vector2 = MutableVector2.zero();
  private __isMorphing: boolean;
  private __isSkinning: boolean;
  private __isLighting: boolean;
  private static __lightPositions = new Float32Array(0);
  private static __lightDirections = new Float32Array(0);
  private static __lightIntensities = new Float32Array(0);
  private static __lightProperties = new Float32Array(0);

  protected __vertexShaderityObject?: ShaderityObject;
  protected __pixelShaderityObject?: ShaderityObject;
  public shaderType: ShaderTypeEnum = ShaderType.VertexAndPixelShader;

  constructor(
    shader: GLSLShader | null,
    shaderFunctionName: string,
    { isMorphing = false, isSkinning = false, isLighting = false } = {},
    vertexShaderityObject?: ShaderityObject,
    pixelShaderityObject?: ShaderityObject
  ) {
    super();
    this.__shaderFunctionName = shaderFunctionName;
    this.__materialNodeUid = ++AbstractMaterialContent.__invalidMaterialNodeCount;
    AbstractMaterialContent.materialNodes[AbstractMaterialContent.__invalidMaterialNodeCount] =
      this;

    this.__isMorphing = isMorphing;
    this.__isSkinning = isSkinning;
    this.__isLighting = isLighting;

    this.__vertexShaderityObject = vertexShaderityObject;
    this.__pixelShaderityObject = pixelShaderityObject;

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

  getDefinitions(material: Material) {
    let definitions = this.__definitions.concat();

    definitions += '#define RN_IS_ALPHAMODE_' + material.alphaMode.str + '\n';

    return definitions;
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
      AbstractMaterialContent.__semanticsMap.set(this.shaderFunctionName, new Map());
    }
    const map = AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)!;
    for (const semantic of this.__semantics) {
      map.set(semantic.semantic.str, semantic);
    }
  }

  getShaderSemanticInfoFromName(name: string) {
    const map = AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)!;
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

  protected setupBasicInfo(
    args: RenderingArgWebGL,
    shaderProgram: WebGLProgram,
    firstTime: boolean,
    material: Material,
    CameraComponentClass: typeof CameraComponent
  ) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setIsBillboard(shaderProgram, args.isBillboard);
      if (firstTime || args.isVr) {
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getComponent(
            CameraComponentClass,
            CameraComponentClass.current
          ) as CameraComponent;
        }
        this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
        this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      }
      if (firstTime) {
        // Lights
        this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
        /// Skinning
        const skeletalComponent = args.entity.tryToGetSkeletal();
        this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
      }
    }

    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
  }

  protected setWorldMatrix(shaderProgram: WebGLProgram, worldMatrix: Matrix44) {
    (shaderProgram as any)._gl.uniformMatrix4fv(
      (shaderProgram as any).worldMatrix,
      false,
      worldMatrix._v
    );
  }

  protected setNormalMatrix(shaderProgram: WebGLProgram, normalMatrix: IMatrix33) {
    (shaderProgram as any)._gl.uniformMatrix3fv(
      (shaderProgram as any).normalMatrix,
      false,
      normalMatrix._v
    );
  }

  protected setIsBillboard(shaderProgram: WebGLProgram, isBillboard: boolean) {
    (shaderProgram as any)._gl.uniform1i((shaderProgram as any).isBillboard, isBillboard ? 1 : 0);
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
    (shaderProgram as any)._gl.uniform3fv((shaderProgram as any).viewPosition, cameraPosition!._v);
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
        if (Config.boneDataType === BoneDataType.Mat43x1) {
          const jointMatricesArray = skeletalComponent.jointMatricesArray;
          (shaderProgram as any)._gl.uniformMatrix4x3fv(
            (shaderProgram as any).boneMatrix,
            false,
            jointMatricesArray
          );
        } else if (Config.boneDataType === BoneDataType.Vec4x2) {
          const jointTranslatePackedQuat = skeletalComponent.jointTranslatePackedQuat;
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
          const jointTranslateScaleArray = skeletalComponent.jointTranslateScaleArray;
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
        (shaderProgram as any)._gl.uniform1i((shaderProgram as any).skinningMode, -1);
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
      const lightComponentsEnabled = lightComponents.filter(
        (lightComponent) => lightComponent.enable
      );

      (shaderProgram as any)._gl.uniform1i(
        (shaderProgram as any).lightNumber,
        lightComponentsEnabled!.length
      );

      const length = Math.min(lightComponentsEnabled!.length, Config.maxLightNumberInShader);
      if (AbstractMaterialContent.__lightPositions.length !== 3 * length) {
        AbstractMaterialContent.__lightPositions = new Float32Array(3 * length);
        AbstractMaterialContent.__lightDirections = new Float32Array(3 * length);
        AbstractMaterialContent.__lightIntensities = new Float32Array(3 * length);
        AbstractMaterialContent.__lightProperties = new Float32Array(4 * length);
      }
      for (let i = 0; i < lightComponentsEnabled!.length; i++) {
        if (i >= Config.maxLightNumberInShader) {
          break;
        }
        if ((shaderProgram as any).lightPosition == null) {
          break;
        }

        const lightComponent = lightComponentsEnabled![i];
        const sceneGraphComponent = lightComponent.entity.getSceneGraph()!;
        const worldLightPosition = sceneGraphComponent.worldPosition;
        const worldLightDirection = lightComponent.direction;
        const worldLightIntensity = lightComponent.intensity;

        AbstractMaterialContent.__lightPositions[i * 3 + 0] = worldLightPosition.x;
        AbstractMaterialContent.__lightPositions[i * 3 + 1] = worldLightPosition.y;
        AbstractMaterialContent.__lightPositions[i * 3 + 2] = worldLightPosition.z;

        const lightAngleScale =
          1.0 /
          Math.max(
            0.001,
            Math.cos(lightComponent.innerConeAngle) - Math.cos(lightComponent.outerConeAngle)
          );
        const lightAngleOffset = -Math.cos(lightComponent.outerConeAngle) * lightAngleScale;

        AbstractMaterialContent.__lightDirections[i * 3 + 0] = worldLightDirection.x;
        AbstractMaterialContent.__lightDirections[i * 3 + 1] = worldLightDirection.y;
        AbstractMaterialContent.__lightDirections[i * 3 + 2] = worldLightDirection.z;

        AbstractMaterialContent.__lightIntensities[i * 3 + 0] = worldLightIntensity.x;
        AbstractMaterialContent.__lightIntensities[i * 3 + 1] = worldLightIntensity.y;
        AbstractMaterialContent.__lightIntensities[i * 3 + 2] = worldLightIntensity.z;

        AbstractMaterialContent.__lightProperties[i * 4 + 0] = // LightType
          lightComponent.enable ? lightComponent.type.index : -1;
        AbstractMaterialContent.__lightProperties[i * 4 + 1] = lightComponent.range; // Light Range
        AbstractMaterialContent.__lightProperties[i * 4 + 2] = lightAngleScale;
        AbstractMaterialContent.__lightProperties[i * 4 + 3] = lightAngleOffset;
      }
      if (length > 0) {
        (shaderProgram as any)._gl.uniform3fv(
          (shaderProgram as any).lightPosition,
          AbstractMaterialContent.__lightPositions
        );
        (shaderProgram as any)._gl.uniform3fv(
          (shaderProgram as any).lightDirection,
          AbstractMaterialContent.__lightDirections
        );
        (shaderProgram as any)._gl.uniform3fv(
          (shaderProgram as any).lightIntensity,
          AbstractMaterialContent.__lightIntensities
        );
        (shaderProgram as any)._gl.uniform4fv(
          (shaderProgram as any).lightProperty,
          AbstractMaterialContent.__lightProperties
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
      (shaderProgram as any)._gl.uniform1i((shaderProgram as any).morphTargetNumber, 0);
      return;
    }

    (shaderProgram as any)._gl.uniform1i(
      (shaderProgram as any).morphTargetNumber,
      primitive.targets.length
    );
    const dataTextureMorphOffsetPositionOfTargets: number[] = primitive.targets.map(
      (target: Attributes) => {
        const accessor = target.get(VertexAttribute.Position.XYZ) as Accessor;
        let offset = 0;

        if (ProcessApproach.isDataTextureApproach(SystemState.currentProcessApproach)) {
          offset = Config.totalSizeOfGPUShaderDataStorageExceptMorphData;
        }
        return (offset + accessor.byteOffsetInBuffer) / 4 / 4;
      }
    );
    (shaderProgram as any)._gl.uniform1iv(
      (shaderProgram as any).dataTextureMorphOffsetPosition,
      dataTextureMorphOffsetPositionOfTargets
    );
    let weights;
    if (blendShapeComponent!.weights.length > 0) {
      weights = blendShapeComponent!.weights;
    } else {
      weights = new Float32Array(primitive.targets.length);
    }
    (shaderProgram as any)._gl.uniform1fv((shaderProgram as any).morphWeights, weights);
  }

  _setInternalSettingParametersToGpuWebGL({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {}

  _setInternalSettingParametersToGpuWebGpu({
    material,
    args,
  }: {
    material: Material;
    args: RenderingArgWebGpu;
  }) {}

  setDefaultInputValue(inputName: string, value: any) {
    this.__defaultInputValues.set(inputName, value);
  }

  getDefinition() {
    return '';
  }

  protected doShaderReflection(
    vertexShader: ShaderityObject,
    pixelShader: ShaderityObject,
    vertexShaderWebGpu: ShaderityObject,
    pixelShaderWebGpu: ShaderityObject
  ) {
    let vertexShaderData: {
      shaderSemanticsInfoArray: ShaderSemanticsInfo[];
      shaderityObject: ShaderityObject;
    };
    let pixelShaderData: {
      shaderSemanticsInfoArray: ShaderSemanticsInfo[];
      shaderityObject: ShaderityObject;
    };
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      vertexShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(
        vertexShaderWebGpu!,
        AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
      );
      pixelShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(
        pixelShaderWebGpu!,
        AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
      );

      this.__vertexShaderityObject = vertexShaderData.shaderityObject;
      this.__pixelShaderityObject = pixelShaderData.shaderityObject;
    } else {
      vertexShaderData = ShaderityUtilityWebGL.getShaderDataReflection(
        vertexShader,
        AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
      );
      pixelShaderData = ShaderityUtilityWebGL.getShaderDataReflection(
        pixelShader,
        AbstractMaterialContent.__semanticsMap.get(this.shaderFunctionName)
      );

      this.__vertexShaderityObject = vertexShaderData.shaderityObject;
      this.__pixelShaderityObject = pixelShaderData.shaderityObject;
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    for (const vertexShaderSemanticsInfo of vertexShaderData.shaderSemanticsInfoArray) {
      vertexShaderSemanticsInfo.stage = ShaderType.VertexShader;
      shaderSemanticsInfoArray.push(vertexShaderSemanticsInfo);
    }
    for (const pixelShaderSemanticsInfo of pixelShaderData.shaderSemanticsInfoArray) {
      const foundShaderSemanticsInfo = shaderSemanticsInfoArray.find(
        (vertexInfo: ShaderSemanticsInfo) => {
          if (vertexInfo.semantic.str === pixelShaderSemanticsInfo.semantic.str) {
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
    return shaderSemanticsInfoArray;
  }
}

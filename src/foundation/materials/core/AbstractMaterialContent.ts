import { RnObject } from '../../core/RnObject';
import { ShaderSemanticsEnum, ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
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
import  ShaderityModule, { ShaderityObject } from 'shaderity';
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

const Shaderity = (ShaderityModule as any).default || ShaderityModule;

type MaterialNodeUID = number;

export abstract class AbstractMaterialContent extends RnObject {
  protected __semantics: ShaderSemanticsInfo[] = [];
  static materialNodes: AbstractMaterialContent[] = [];
  protected __materialName: string;

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

  private static __materialContentCount = 0;
  private __materialContentUid: number;

  private static __vertexShaderityObjectMap: Map<string, ShaderityObject> = new Map();
  private static __pixelShaderityObjectMap: Map<string, ShaderityObject> = new Map();
  private static __reflectedShaderSemanticsInfoArrayMap: Map<string, ShaderSemanticsInfo[]> = new Map();
  public shaderType: ShaderTypeEnum = ShaderType.VertexAndPixelShader;

  private __materialSemanticsVariantName = '';

  constructor(
    materialName: string,
    { isMorphing = false, isSkinning = false, isLighting = false } = {},
    vertexShaderityObject?: ShaderityObject,
    pixelShaderityObject?: ShaderityObject
  ) {
    super();
    this.__materialName = materialName;

    this.__isMorphing = isMorphing;
    this.__isSkinning = isSkinning;
    this.__isLighting = isLighting;

    this.__materialContentUid = AbstractMaterialContent.__materialContentCount++;

    this.setVertexShaderityObject(vertexShaderityObject);
    this.setPixelShaderityObject(pixelShaderityObject);
  }

  protected setVertexShaderityObject(vertexShaderityObject?: ShaderityObject) {
    if (vertexShaderityObject) {
      AbstractMaterialContent.__vertexShaderityObjectMap.set(this.__materialName, vertexShaderityObject);
    }
  }

  protected setPixelShaderityObject(pixelShaderityObject?: ShaderityObject) {
    if (pixelShaderityObject) {
      AbstractMaterialContent.__pixelShaderityObjectMap.set(this.__materialName, pixelShaderityObject);
    }
  }

  makeMaterialSemanticsVariantName() {
    let semantics = '';
    for (const semantic of this.__semantics) {
      semantics += `${semantic.semantic}_`; //${semantic.stage.index} ${semantic.componentType.index} ${semantic.compositionType.index} ${semantic.soloDatum} ${semantic.isInternalSetting} ${semantic.arrayLength} ${semantic.needUniformInDataTextureMode}\n`;
    }

    this.__materialSemanticsVariantName = this.__materialName + '_semanticsVariation_' + semantics;
  }

  getMaterialSemanticsVariantName() {
    return this.__materialSemanticsVariantName;
  }

  get vertexShaderityObject(): ShaderityObject | undefined {
    return AbstractMaterialContent.__vertexShaderityObjectMap.get(this.__materialName);
  }

  get pixelShaderityObject(): ShaderityObject | undefined {
    return AbstractMaterialContent.__pixelShaderityObjectMap.get(this.__materialName);
  }

  getDefinitions() {
    return this.__definitions;
  }

  static getMaterialNode(materialNodeUid: MaterialNodeUID) {
    return AbstractMaterialContent.materialNodes[materialNodeUid];
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
    this.makeMaterialSemanticsVariantName();
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

      const length = Math.min(lightComponentsEnabled!.length, Config.maxLightNumber);
      if (AbstractMaterialContent.__lightPositions.length !== 3 * length) {
        AbstractMaterialContent.__lightPositions = new Float32Array(3 * length);
        AbstractMaterialContent.__lightDirections = new Float32Array(3 * length);
        AbstractMaterialContent.__lightIntensities = new Float32Array(3 * length);
        AbstractMaterialContent.__lightProperties = new Float32Array(4 * length);
      }
      for (let i = 0; i < lightComponentsEnabled!.length; i++) {
        if (i >= Config.maxLightNumber) {
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
        const worldLightColor = lightComponent.color;

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

        AbstractMaterialContent.__lightIntensities[i * 3 + 0] = worldLightColor.x * worldLightIntensity;
        AbstractMaterialContent.__lightIntensities[i * 3 + 1] = worldLightColor.y * worldLightIntensity;
        AbstractMaterialContent.__lightIntensities[i * 3 + 2] = worldLightColor.z * worldLightIntensity;

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
          offset = SystemState.totalSizeOfGPUShaderDataStorageExceptMorphData;
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

  _setInternalSettingParametersToGpuWebGLPerShaderProgram({
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

  _setInternalSettingParametersToGpuWebGLPerMaterial({
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

  _setInternalSettingParametersToGpuWebGLPerPrimitive({
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

  getDefinition() {
    return '';
  }

  protected doShaderReflection(
    vertexShader: ShaderityObject,
    pixelShader: ShaderityObject,
    vertexShaderWebGpu: ShaderityObject,
    pixelShaderWebGpu: ShaderityObject,
    definitions: string[]
  ) {
    const definitionsStr = definitions.join('');
    const reflectedShaderSemanticsInfoArray = AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMap.get(this.__materialName + definitionsStr);
    if (reflectedShaderSemanticsInfoArray != null) {
      return reflectedShaderSemanticsInfoArray.concat();
    }

    let preprocessedVertexShaderData: {
      shaderSemanticsInfoArray: ShaderSemanticsInfo[];
      shaderityObject: ShaderityObject;
    };
    let preprocessedPixelShaderData: {
      shaderSemanticsInfoArray: ShaderSemanticsInfo[];
      shaderityObject: ShaderityObject;
    };
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {

      const preprocessedVertexShader = Shaderity.processPragma(vertexShaderWebGpu!, definitions);
      const preprocessedPixelShader = Shaderity.processPragma(pixelShaderWebGpu!, definitions);

      preprocessedVertexShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(preprocessedVertexShader);
      preprocessedPixelShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(preprocessedPixelShader);
      const vertexShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(vertexShaderWebGpu!);
      const pixelShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(pixelShaderWebGpu!);

      this.setVertexShaderityObject(vertexShaderData.shaderityObject);
      this.setPixelShaderityObject(pixelShaderData.shaderityObject);
    } else {
      const preprocessedVertexShader = Shaderity.processPragma(vertexShader, definitions);
      const preprocessedPixelShader = Shaderity.processPragma(pixelShader, definitions);

      preprocessedVertexShaderData = ShaderityUtilityWebGL.getShaderDataReflection(preprocessedVertexShader);
      preprocessedPixelShaderData = ShaderityUtilityWebGL.getShaderDataReflection(preprocessedPixelShader);

      const vertexShaderData = ShaderityUtilityWebGL.getShaderDataReflection(vertexShader);
      const pixelShaderData = ShaderityUtilityWebGL.getShaderDataReflection(pixelShader);

      this.setVertexShaderityObject(vertexShaderData.shaderityObject);
      this.setPixelShaderityObject(pixelShaderData.shaderityObject);
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    for (const vertexShaderSemanticsInfo of preprocessedVertexShaderData.shaderSemanticsInfoArray) {
      vertexShaderSemanticsInfo.stage = ShaderType.VertexShader;
      shaderSemanticsInfoArray.push(vertexShaderSemanticsInfo);
    }
    for (const pixelShaderSemanticsInfo of preprocessedPixelShaderData.shaderSemanticsInfoArray) {
      const foundShaderSemanticsInfo = shaderSemanticsInfoArray.find(
        (vertexInfo: ShaderSemanticsInfo) => {
          if (vertexInfo.semantic === pixelShaderSemanticsInfo.semantic) {
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
    AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMap.set(
      this.__materialName + definitionsStr,
      shaderSemanticsInfoArray
    );

    return shaderSemanticsInfoArray.concat();
  }
}

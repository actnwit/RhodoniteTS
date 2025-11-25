import ShaderityModule, { type ShaderityObject } from 'shaderity';
import { WebGLResourceRepository } from '../../../webgl/WebGLResourceRepository';
import { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import type { RnXR } from '../../../xr/main';
import type { BlendShapeComponent } from '../../components/BlendShape/BlendShapeComponent';
import type { CameraComponent } from '../../components/Camera/CameraComponent';
import type { LightComponent } from '../../components/Light/LightComponent';
import type { MeshComponent } from '../../components/Mesh/MeshComponent';
import type { SkeletalComponent } from '../../components/Skeletal/SkeletalComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { Config } from '../../core/Config';
import { RnObject } from '../../core/RnObject';
import { BoneDataType } from '../../definitions/BoneDataType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { ShaderSemanticsEnum, ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType, type ShaderTypeEnum } from '../../definitions/ShaderType';
import { VertexAttribute, VertexAttributeEnum } from '../../definitions/VertexAttribute';
import type { Attributes, Primitive } from '../../geometry/Primitive';
import type { IMatrix33 } from '../../math/IMatrix';
import type { IVector3 } from '../../math/IVector';
import type { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector4 } from '../../math/MutableVector4';
import { Vector3 } from '../../math/Vector3';
import type { Accessor } from '../../memory/Accessor';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { ModuleManager } from '../../system/ModuleManager';
import { SystemState } from '../../system/SystemState';
import type { Material } from './Material';
import { ShaderityUtilityWebGL } from './ShaderityUtilityWebGL';
import { ShaderityUtilityWebGPU } from './ShaderityUtilityWebGPU';

const Shaderity = (ShaderityModule as any).default || ShaderityModule;

type MaterialNodeUID = number;

/**
 * Abstract base class for material content that provides common functionality for material rendering.
 * This class handles shader semantics, rendering setup, and GPU parameter management for materials.
 */
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

  /**
   * Constructs a new AbstractMaterialContent instance.
   * @param materialName - The unique name identifier for this material
   * @param options - Configuration options for the material
   * @param options.isMorphing - Whether this material supports morph target animation
   * @param options.isSkinning - Whether this material supports skeletal animation
   * @param options.isLighting - Whether this material supports lighting calculations
   * @param vertexShaderityObject - Optional vertex shader object
   * @param pixelShaderityObject - Optional pixel shader object
   */
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

  /**
   * Sets the vertex shader object for this material.
   * @param vertexShaderityObject - The vertex shader object to set
   */
  protected setVertexShaderityObject(vertexShaderityObject?: ShaderityObject) {
    if (vertexShaderityObject) {
      AbstractMaterialContent.__vertexShaderityObjectMap.set(this.__materialName, vertexShaderityObject);
    }
  }

  /**
   * Sets the pixel shader object for this material.
   * @param pixelShaderityObject - The pixel shader object to set
   */
  protected setPixelShaderityObject(pixelShaderityObject?: ShaderityObject) {
    if (pixelShaderityObject) {
      AbstractMaterialContent.__pixelShaderityObjectMap.set(this.__materialName, pixelShaderityObject);
    }
  }

  /**
   * Generates a unique variant name for this material based on its shader semantics.
   * This name is used to differentiate materials with different semantic configurations.
   */
  makeMaterialSemanticsVariantName() {
    let semantics = '';
    for (const semantic of this.__semantics) {
      semantics += `${semantic.semantic}_`; //${semantic.stage.index} ${semantic.componentType.index} ${semantic.compositionType.index} ${semantic.soloDatum} ${semantic.isInternalSetting} ${semantic.arrayLength} ${semantic.needUniformInDataTextureMode}\n`;
    }

    this.__materialSemanticsVariantName = `${this.__materialName}_semanticsVariation_${semantics}`;
  }

  /**
   * Gets the material semantics variant name for this material.
   * @returns The unique variant name string
   */
  getMaterialSemanticsVariantName() {
    return this.__materialSemanticsVariantName;
  }

  /**
   * Gets the vertex shader object associated with this material.
   * @returns The vertex shader object or undefined if not set
   */
  get vertexShaderityObject(): ShaderityObject | undefined {
    return AbstractMaterialContent.__vertexShaderityObjectMap.get(this.__materialName);
  }

  /**
   * Gets the pixel shader object associated with this material.
   * @returns The pixel shader object or undefined if not set
   */
  get pixelShaderityObject(): ShaderityObject | undefined {
    return AbstractMaterialContent.__pixelShaderityObjectMap.get(this.__materialName);
  }

  /**
   * Gets the shader definitions string for this material.
   * @returns The definitions string
   */
  getDefinitions() {
    return this.__definitions;
  }

  /**
   * Retrieves a material node by its unique identifier.
   * @param materialNodeUid - The unique identifier of the material node
   * @returns The material node instance
   */
  static getMaterialNode(materialNodeUid: MaterialNodeUID) {
    return AbstractMaterialContent.materialNodes[materialNodeUid];
  }

  /**
   * Gets the shader semantics information array for this material.
   * @returns Array of shader semantics information
   */
  get _semanticsInfoArray() {
    return this.__semantics;
  }

  /**
   * Checks if this material supports skeletal animation.
   * @returns True if skinning is enabled
   */
  get isSkinning() {
    return this.__isSkinning;
  }

  /**
   * Checks if this material supports morph target animation.
   * @returns True if morphing is enabled
   */
  get isMorphing() {
    return this.__isMorphing;
  }

  /**
   * Checks if this material supports lighting calculations.
   * @returns True if lighting is enabled
   */
  get isLighting() {
    return this.__isLighting;
  }

  /**
   * Sets the shader semantics information array for this material.
   * @param shaderSemanticsInfoArray - Array of shader semantics information to set
   */
  setShaderSemanticsInfoArray(shaderSemanticsInfoArray: ShaderSemanticsInfo[]) {
    const infoArray: ShaderSemanticsInfo[] = [];
    for (const info of shaderSemanticsInfoArray) {
      infoArray.push(info);
    }
    this.__semantics = infoArray;
    this.makeMaterialSemanticsVariantName();
  }

  /**
   * Sets up basic rendering information including matrices, camera, and lighting.
   * @param args - WebGL rendering arguments
   * @param shaderProgram - The WebGL shader program
   * @param firstTime - Whether this is the first time setup
   * @param material - The material instance
   * @param CameraComponentClass - The camera component class
   */
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
      this.setIsVisible(shaderProgram, args.isVisible);
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

  /**
   * Sets the world transformation matrix uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param worldMatrix - The world transformation matrix
   */
  protected setWorldMatrix(shaderProgram: WebGLProgram, worldMatrix: Matrix44) {
    (shaderProgram as any)._gl.uniformMatrix4fv((shaderProgram as any).worldMatrix, false, worldMatrix._v);
  }

  /**
   * Sets the normal transformation matrix uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param normalMatrix - The normal transformation matrix
   */
  protected setNormalMatrix(shaderProgram: WebGLProgram, normalMatrix: IMatrix33) {
    (shaderProgram as any)._gl.uniformMatrix3fv((shaderProgram as any).normalMatrix, false, normalMatrix._v);
  }

  /**
   * Sets the billboard flag uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param isBillboard - Whether the object should be rendered as a billboard
   */
  protected setIsBillboard(shaderProgram: WebGLProgram, isBillboard: boolean) {
    (shaderProgram as any)._gl.uniform1i((shaderProgram as any).isBillboard, isBillboard ? 1 : 0);
  }

  /**
   * Sets the visibility flag uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param isVisible - Whether the object should be rendered
   */
  protected setIsVisible(shaderProgram: WebGLProgram, isVisible: boolean) {
    (shaderProgram as any)._gl.uniform1i((shaderProgram as any).isVisible, isVisible ? 1 : 0);
  }

  /**
   * Sets view-related uniforms including view matrix and camera position.
   * @param shaderProgram - The WebGL shader program
   * @param cameraComponent - The camera component
   * @param isVr - Whether rendering in VR mode
   * @param displayIdx - The display index for VR rendering
   */
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

    (shaderProgram as any)._gl.uniformMatrix4fv((shaderProgram as any).viewMatrix, false, viewMatrix!._v);
    (shaderProgram as any)._gl.uniform3fv((shaderProgram as any).viewPosition, cameraPosition!._v);
  }

  /**
   * Sets the projection matrix uniform in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param cameraComponent - The camera component
   * @param isVr - Whether rendering in VR mode
   * @param displayIdx - The display index for VR rendering
   */
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
    (shaderProgram as any)._gl.uniformMatrix4fv((shaderProgram as any).projectionMatrix, false, projectionMatrix!._v);
  }

  /**
   * Sets skeletal animation uniforms in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param setUniform - Whether to set uniform values
   * @param skeletalComponent - The skeletal component containing bone data
   */
  protected setSkinning(shaderProgram: WebGLProgram, setUniform: boolean, skeletalComponent?: SkeletalComponent) {
    if (!this.__isSkinning) {
      return;
    }
    if (skeletalComponent) {
      if (setUniform) {
        if (Config.boneDataType === BoneDataType.Mat43x1) {
          const jointMatricesArray = skeletalComponent.jointMatricesArray;
          (shaderProgram as any)._gl.uniformMatrix4x3fv((shaderProgram as any).boneMatrix, false, jointMatricesArray);
        } else if (Config.boneDataType === BoneDataType.Vec4x2) {
          const jointTranslatePackedQuat = skeletalComponent.jointTranslatePackedQuat;
          const jointScalePackedQuat = skeletalComponent.jointScalePackedQuat;
          (shaderProgram as any)._gl.uniform4fv(
            (shaderProgram as any).boneTranslatePackedQuat,
            jointTranslatePackedQuat
          );
          (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneScalePackedQuat, jointScalePackedQuat);
        } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
          const jointQuaternionArray = skeletalComponent.jointQuaternionArray;
          const jointTranslateScaleArray = skeletalComponent.jointTranslateScaleArray;
          (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneQuaternion, jointQuaternionArray);
          (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneTranslateScale, jointTranslateScaleArray);
        } else if (Config.boneDataType === BoneDataType.Vec4x1) {
          const jointCompressedChunk = skeletalComponent.jointCompressedChunk;
          const jointCompressedInfo = skeletalComponent.jointCompressedInfo;
          (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneCompressedChunk, jointCompressedChunk);
          (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneCompressedInfo, jointCompressedInfo._v);
        }

        (shaderProgram as any)._gl.uniform1i((shaderProgram as any).skinningMode, skeletalComponent.componentSID);
      }
    } else {
      if (setUniform) {
        (shaderProgram as any)._gl.uniform1i((shaderProgram as any).skinningMode, -1);
      }
    }
  }

  /**
   * Sets lighting information uniforms in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param lightComponents - Array of light components
   * @param material - The material instance
   * @param setUniform - Whether to set uniform values
   */
  protected setLightsInfo(
    shaderProgram: WebGLProgram,
    lightComponents: LightComponent[],
    _material: Material,
    setUniform: boolean
  ) {
    if (!this.__isLighting) {
      return;
    }
    if (setUniform) {
      const lightComponentsEnabled = lightComponents.filter(lightComponent => lightComponent.enable);

      (shaderProgram as any)._gl.uniform1i((shaderProgram as any).lightNumber, lightComponentsEnabled!.length);

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
          1.0 / Math.max(0.001, Math.cos(lightComponent.innerConeAngle) - Math.cos(lightComponent.outerConeAngle));
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

  /**
   * Sets morph target animation uniforms in the shader.
   * @param shaderProgram - The WebGL shader program
   * @param meshComponent - The mesh component
   * @param primitive - The primitive containing morph targets
   * @param blendShapeComponent - The blend shape component containing weights
   */
  setMorphInfo(
    shaderProgram: WebGLProgram,
    _meshComponent: MeshComponent,
    primitive: Primitive,
    _blendShapeComponent?: BlendShapeComponent
  ) {
    if (!this.__isMorphing) {
      return;
    }
    if (primitive.targets.length === 0) {
      return;
    }

    const primitiveIdx = (primitive.constructor as typeof Primitive).getPrimitiveIdxHasMorph(primitive.primitiveUid)!;
    (shaderProgram as any)._gl.uniform1i((shaderProgram as any).currentPrimitiveIdx, primitiveIdx);
  }

  /**
   * Sets internal setting parameters to GPU for WebGL per shader program.
   * This method should be overridden by derived classes to provide specific parameter handling.
   * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
   */
  _setInternalSettingParametersToGpuWebGLPerShaderProgram(_params: {}) {}

  /**
   * Sets internal setting parameters to GPU for WebGL per material.
   * This method should be overridden by derived classes to provide specific parameter handling.
   * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial(_params: {}) {}

  /**
   * Sets internal setting parameters to GPU for WebGL per primitive.
   * This method should be overridden by derived classes to provide specific parameter handling.
   * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
   */
  _setInternalSettingParametersToGpuWebGLPerPrimitive(_params: {}) {}

  /**
   * Sets internal setting parameters to GPU for WebGPU.
   * This method should be overridden by derived classes to provide specific parameter handling.
   * @param params - Object containing material and WebGPU rendering arguments
   */
  _setInternalSettingParametersToGpuWebGpu(_params: {}) {}

  /**
   * Gets the shader definition string for this material.
   * This method should be overridden by derived classes to provide specific definitions.
   * @returns Empty string by default
   */
  getDefinition() {
    return '';
  }

  /**
   * Performs shader reflection to extract semantics information from vertex and pixel shaders.
   * @param vertexShader - The vertex shader object for WebGL
   * @param pixelShader - The pixel shader object for WebGL
   * @param vertexShaderWebGpu - The vertex shader object for WebGPU
   * @param pixelShaderWebGpu - The pixel shader object for WebGPU
   * @param definitions - Array of shader definitions
   * @returns Array of shader semantics information
   */
  protected doShaderReflection(
    vertexShader: ShaderityObject,
    pixelShader: ShaderityObject,
    vertexShaderWebGpu: ShaderityObject,
    pixelShaderWebGpu: ShaderityObject,
    definitions: string[]
  ) {
    const definitionsStr = definitions.join('');
    const reflectedShaderSemanticsInfoArray = AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMap.get(
      this.__materialName + definitionsStr
    );
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
      const foundShaderSemanticsInfo = shaderSemanticsInfoArray.find((vertexInfo: ShaderSemanticsInfo) => {
        if (vertexInfo.semantic === pixelShaderSemanticsInfo.semantic) {
          return true;
        }
        return false;
      });
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

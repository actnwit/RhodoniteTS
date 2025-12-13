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
import type { Config } from '../../core/Config';
import { RnObject } from '../../core/RnObject';
import { BoneDataType } from '../../definitions/BoneDataType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, CompositionTypeEnum } from '../../definitions/CompositionType';
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
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
import { ModuleManager } from '../../system/ModuleManager';
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

  /** The engine instance this material content is associated with */
  protected _engine?: Engine;

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

  /** Shader caches managed per-Engine. Key is Engine.objectUID */
  private static __vertexShaderityObjectMapPerEngine: Map<number, Map<string, ShaderityObject>> = new Map();
  private static __pixelShaderityObjectMapPerEngine: Map<number, Map<string, ShaderityObject>> = new Map();
  private static __reflectedShaderSemanticsInfoArrayMapPerEngine: Map<number, Map<string, ShaderSemanticsInfo[]>> =
    new Map();

  public shaderType: ShaderTypeEnum = ShaderType.VertexAndPixelShader;

  private __materialSemanticsVariantName = '';
  private __materialVariationIdentifier = '';

  /**
   * Gets the vertex shaderity object map for a specific engine.
   * Creates the map if it doesn't exist.
   */
  private static __getVertexShaderityObjectMap(engineUid: number): Map<string, ShaderityObject> {
    let map = AbstractMaterialContent.__vertexShaderityObjectMapPerEngine.get(engineUid);
    if (!map) {
      map = new Map();
      AbstractMaterialContent.__vertexShaderityObjectMapPerEngine.set(engineUid, map);
    }
    return map;
  }

  /**
   * Gets the pixel shaderity object map for a specific engine.
   * Creates the map if it doesn't exist.
   */
  private static __getPixelShaderityObjectMap(engineUid: number): Map<string, ShaderityObject> {
    let map = AbstractMaterialContent.__pixelShaderityObjectMapPerEngine.get(engineUid);
    if (!map) {
      map = new Map();
      AbstractMaterialContent.__pixelShaderityObjectMapPerEngine.set(engineUid, map);
    }
    return map;
  }

  /**
   * Gets the reflected shader semantics info map for a specific engine.
   * Creates the map if it doesn't exist.
   */
  private static __getReflectedShaderSemanticsInfoArrayMap(engineUid: number): Map<string, ShaderSemanticsInfo[]> {
    let map = AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMapPerEngine.get(engineUid);
    if (!map) {
      map = new Map();
      AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMapPerEngine.set(engineUid, map);
    }
    return map;
  }

  /**
   * Constructs a new AbstractMaterialContent instance.
   * @param materialName - The unique name identifier for this material
   * @param options - Configuration options for the material
   * @param options.isMorphing - Whether this material supports morph target animation
   * @param options.isSkinning - Whether this material supports skeletal animation
   * @param options.isLighting - Whether this material supports lighting calculations
   * @param vertexShaderityObject - Optional vertex shader object
   * @param pixelShaderityObject - Optional pixel shader object
   * @param engine - Optional engine instance for proper shader caching
   */
  constructor(
    materialName: string,
    { isMorphing = false, isSkinning = false, isLighting = false } = {},
    vertexShaderityObject?: ShaderityObject,
    pixelShaderityObject?: ShaderityObject,
    engine?: Engine
  ) {
    super();
    this.__materialName = materialName;

    // Set engine if provided (important for proper shader caching)
    if (engine) {
      this._engine = engine;
    }

    this.__isMorphing = isMorphing;
    this.__isSkinning = isSkinning;
    this.__isLighting = isLighting;

    this.__materialContentUid = AbstractMaterialContent.__materialContentCount++;

    this.setVertexShaderityObject(vertexShaderityObject, engine);
    this.setPixelShaderityObject(pixelShaderityObject, engine);
  }

  /**
   * Sets the vertex shader object for this material.
   * @param vertexShaderityObject - The vertex shader object to set
   * @param engine - Optional engine instance (uses this._engine if not provided)
   */
  protected setVertexShaderityObject(vertexShaderityObject?: ShaderityObject, engine?: Engine) {
    if (vertexShaderityObject) {
      const engineToUse = engine ?? this._engine;
      if (engineToUse) {
        const map = AbstractMaterialContent.__getVertexShaderityObjectMap(engineToUse.objectUID);
        map.set(this.__materialName, vertexShaderityObject);
      }
    }
  }

  /**
   * Sets the pixel shader object for this material.
   * @param pixelShaderityObject - The pixel shader object to set
   * @param engine - Optional engine instance (uses this._engine if not provided)
   */
  protected setPixelShaderityObject(pixelShaderityObject?: ShaderityObject, engine?: Engine) {
    if (pixelShaderityObject) {
      const engineToUse = engine ?? this._engine;
      if (engineToUse) {
        const map = AbstractMaterialContent.__getPixelShaderityObjectMap(engineToUse.objectUID);
        map.set(this.__materialName, pixelShaderityObject);
      }
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

    // Store the variation identifier separately (just the semantics variation part)
    this.__materialVariationIdentifier = `semanticsVariation_${semantics}`;
    // Keep the full variant name for backward compatibility
    this.__materialSemanticsVariantName = `${this.__materialName}_${this.__materialVariationIdentifier}`;
  }

  /**
   * Gets the material semantics variant name for this material.
   * This is the full identifier combining material name and variation identifier.
   * @returns The unique variant name string
   */
  getMaterialSemanticsVariantName() {
    return this.__materialSemanticsVariantName;
  }

  /**
   * Gets the material variation identifier (without the base material name).
   * This represents only the parameter variation part of the material type.
   * @returns The variation identifier string
   */
  getMaterialVariationIdentifier() {
    return this.__materialVariationIdentifier;
  }

  /**
   * Gets the base material name (e.g., "PbrUber", "ClassicUber").
   * Double trailing underscores are removed for cleaner display.
   * @returns The base material name string
   */
  getBaseMaterialName() {
    // Remove double trailing underscores only (e.g., "PbrUber__" -> "PbrUber")
    // But keep single trailing underscore (e.g., "PbrUber_SomeName_" stays as is)
    return this.__materialName.replace(/__$/, '');
  }

  /**
   * Gets the vertex shader object associated with this material.
   * @returns The vertex shader object or undefined if not set
   */
  get vertexShaderityObject(): ShaderityObject | undefined {
    if (this._engine) {
      const map = AbstractMaterialContent.__getVertexShaderityObjectMap(this._engine.objectUID);
      return map.get(this.__materialName);
    }
    return undefined;
  }

  /**
   * Gets the pixel shader object associated with this material.
   * @returns The pixel shader object or undefined if not set
   */
  get pixelShaderityObject(): ShaderityObject | undefined {
    if (this._engine) {
      const map = AbstractMaterialContent.__getPixelShaderityObjectMap(this._engine.objectUID);
      return map.get(this.__materialName);
    }
    return undefined;
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

    // Construct a set of existing texture slot indices
    const existingTextureSlotIndices = new Set<number>();
    existingTextureSlotIndices.add(0); // Data texture slot index is 0
    infoArray.forEach(info => {
      if (CompositionType.isTexture(info.compositionType)) {
        const textureSlotIndex = info.initialValue[0];
        if (textureSlotIndex > 0) {
          existingTextureSlotIndices.add(textureSlotIndex);
        }
      }
    });

    // Assign new texture slot indices to textures that have negative slot indices
    infoArray.forEach(info => {
      if (CompositionType.isTexture(info.compositionType)) {
        const textureSlotIndex = info.initialValue[0];
        if (textureSlotIndex < 0) {
          let newTextureSlotIndex = -1;
          for (let i = 1; i < 32; i++) {
            if (!existingTextureSlotIndices.has(i)) {
              newTextureSlotIndex = i;
              break;
            }
          }
          info.initialValue[0] = newTextureSlotIndex;
          existingTextureSlotIndices.add(newTextureSlotIndex);
        }
      }
    });

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
    engine: Engine,
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
          cameraComponent = engine.componentRepository.getComponent(
            CameraComponentClass,
            CameraComponentClass.getCurrent(engine)
          ) as CameraComponent;
        }
        this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
        this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      }
      if (firstTime) {
        // Lights
        this.setLightsInfo(engine.config, shaderProgram, args.lightComponents, material, args.setUniform);
        /// Skinning
        const skeletalComponent = args.entity.tryToGetSkeletal();
        this.setSkinning(engine.config, shaderProgram, args.setUniform, skeletalComponent);
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
      const webxrSystem = cameraComponent.entity.engine.webXRSystem;
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
      const webxrSystem = cameraComponent.entity.engine.webXRSystem;
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
  protected setSkinning(
    config: Config,
    shaderProgram: WebGLProgram,
    setUniform: boolean,
    skeletalComponent?: SkeletalComponent
  ) {
    if (!this.__isSkinning) {
      return;
    }
    if (skeletalComponent) {
      if (setUniform) {
        if (config.boneDataType === BoneDataType.Mat43x1) {
          const jointMatricesArray = skeletalComponent.jointMatricesArray;
          (shaderProgram as any)._gl.uniformMatrix4x3fv((shaderProgram as any).boneMatrix, false, jointMatricesArray);
        } else if (config.boneDataType === BoneDataType.Vec4x2) {
          const jointTranslatePackedQuat = skeletalComponent.jointTranslatePackedQuat;
          const jointScalePackedQuat = skeletalComponent.jointScalePackedQuat;
          (shaderProgram as any)._gl.uniform4fv(
            (shaderProgram as any).boneTranslatePackedQuat,
            jointTranslatePackedQuat
          );
          (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneScalePackedQuat, jointScalePackedQuat);
        } else if (config.boneDataType === BoneDataType.Vec4x2Old) {
          const jointQuaternionArray = skeletalComponent.jointQuaternionArray;
          const jointTranslateScaleArray = skeletalComponent.jointTranslateScaleArray;
          (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneQuaternion, jointQuaternionArray);
          (shaderProgram as any)._gl.uniform4fv((shaderProgram as any).boneTranslateScale, jointTranslateScaleArray);
        } else if (config.boneDataType === BoneDataType.Vec4x1) {
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
    config: Config,
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

      const length = Math.min(lightComponentsEnabled!.length, config.maxLightNumber);
      if (AbstractMaterialContent.__lightPositions.length !== 3 * length) {
        AbstractMaterialContent.__lightPositions = new Float32Array(3 * length);
        AbstractMaterialContent.__lightDirections = new Float32Array(3 * length);
        AbstractMaterialContent.__lightIntensities = new Float32Array(3 * length);
        AbstractMaterialContent.__lightProperties = new Float32Array(4 * length);
      }
      for (let i = 0; i < lightComponentsEnabled!.length; i++) {
        if (i >= config.maxLightNumber) {
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
    engine: Engine,
    vertexShader: ShaderityObject,
    pixelShader: ShaderityObject,
    vertexShaderWebGpu: ShaderityObject,
    pixelShaderWebGpu: ShaderityObject,
    definitions: string[]
  ) {
    // Store the engine reference for this material content
    this._engine = engine;

    const definitionsStr = definitions.join('');
    const reflectedMap = AbstractMaterialContent.__getReflectedShaderSemanticsInfoArrayMap(engine.objectUID);
    const reflectedShaderSemanticsInfoArray = reflectedMap.get(this.__materialName + definitionsStr);
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
    if (engine.processApproach === ProcessApproach.WebGPU) {
      const preprocessedVertexShader = Shaderity.processPragma(vertexShaderWebGpu!, definitions);
      const preprocessedPixelShader = Shaderity.processPragma(pixelShaderWebGpu!, definitions);

      preprocessedVertexShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(engine, preprocessedVertexShader);
      preprocessedPixelShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(engine, preprocessedPixelShader);
      const vertexShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(engine, vertexShaderWebGpu!);
      const pixelShaderData = ShaderityUtilityWebGPU.getShaderDataReflection(engine, pixelShaderWebGpu!);

      this.setVertexShaderityObject(vertexShaderData.shaderityObject, engine);
      this.setPixelShaderityObject(pixelShaderData.shaderityObject, engine);
    } else {
      const preprocessedVertexShader = Shaderity.processPragma(vertexShader, definitions);
      const preprocessedPixelShader = Shaderity.processPragma(pixelShader, definitions);

      preprocessedVertexShaderData = ShaderityUtilityWebGL.getShaderDataReflection(engine, preprocessedVertexShader);
      preprocessedPixelShaderData = ShaderityUtilityWebGL.getShaderDataReflection(engine, preprocessedPixelShader);

      const vertexShaderData = ShaderityUtilityWebGL.getShaderDataReflection(engine, vertexShader);
      const pixelShaderData = ShaderityUtilityWebGL.getShaderDataReflection(engine, pixelShader);

      this.setVertexShaderityObject(vertexShaderData.shaderityObject, engine);
      this.setPixelShaderityObject(pixelShaderData.shaderityObject, engine);
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
    reflectedMap.set(this.__materialName + definitionsStr, shaderSemanticsInfoArray);

    return shaderSemanticsInfoArray.concat();
  }

  /**
   * Cleans up static caches for a specific Engine instance.
   * This should be called when the Engine is destroyed to prevent stale references.
   *
   * @param engine - The Engine instance being destroyed
   * @internal Called from Engine.destroy()
   */
  static _cleanupForEngine(engine: Engine): void {
    AbstractMaterialContent.__vertexShaderityObjectMapPerEngine.delete(engine.objectUID);
    AbstractMaterialContent.__pixelShaderityObjectMapPerEngine.delete(engine.objectUID);
    AbstractMaterialContent.__reflectedShaderSemanticsInfoArrayMapPerEngine.delete(engine.objectUID);

    // Note: We don't reset __materialContentCount as UIDs should remain unique across engine instances
    // Note: We don't clear materialNodes as they may still be referenced
    // Note: Light arrays and tmp vectors are just reusable buffers, no need to clear
  }
}

import { AnimationComponent } from '../foundation/components/Animation/AnimationComponent';
import { BlendShapeComponent } from '../foundation/components/BlendShape/BlendShapeComponent';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { CameraControllerComponent } from '../foundation/components/CameraController/CameraControllerComponent';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { Component } from '../foundation/core/Component';
import { ComponentRepository } from '../foundation/core/ComponentRepository';
import { Config } from '../foundation/core/Config';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { MemoryManager } from '../foundation/core/MemoryManager';
import { BufferUse } from '../foundation/definitions/BufferUse';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { CompositionType } from '../foundation/definitions/CompositionType';
import type { ShaderSemanticsName, getShaderPropertyFunc } from '../foundation/definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { VertexAttribute } from '../foundation/definitions/VertexAttribute';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { MaterialRepository } from '../foundation/materials/core/MaterialRepository';
import type { Accessor } from '../foundation/memory/Accessor';
import type { Buffer } from '../foundation/memory/Buffer';
import { Logger } from '../foundation/misc/Logger';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import type { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import { isSkipDrawing } from '../foundation/renderer/RenderingCommonMethods';
import { ModuleManager } from '../foundation/system/ModuleManager';
import {
  type CGAPIResourceHandle,
  Count,
  Index,
  type IndexOf4Bytes,
  type IndexOf16Bytes,
  type PrimitiveUID,
} from '../types/CommonTypes';
import type { WebXRSystem } from '../xr/WebXRSystem';
import type { RnXR } from '../xr/main';
import { WebGpuResourceRepository } from './WebGpuResourceRepository';

/**
 * Basic WebGPU rendering strategy implementation that handles mesh rendering,
 * storage buffer management, and shader program setup for WebGPU-based rendering pipeline.
 *
 * This class provides a complete rendering solution using WebGPU API, including:
 * - Storage buffer management for efficient GPU data transfer
 * - Shader program compilation and setup
 * - Morph target and blend shape handling
 * - Camera and transform matrix updates
 * - Render pass execution with proper primitive sorting
 *
 * @example
 * ```typescript
 * const strategy = WebGpuStrategyBasic.getInstance();
 * strategy.prerender();
 * strategy.common_$render(primitiveUids, renderPass, tickCount);
 * ```
 */
export class WebGpuStrategyBasic implements CGAPIStrategy {
  private static __instance: WebGpuStrategyBasic;
  private __storageBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __storageBlendShapeBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __uniformMorphOffsetsTypedArray?: Uint32Array;
  private __uniformMorphWeightsTypedArray?: Float32Array;

  private __lastMaterialsUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastSceneGraphComponentsUpdateCount = -1;
  private __lastCameraComponentsUpdateCount = -1;
  private __lastCameraControllerComponentsUpdateCount = -1;

  private __lastBlendShapeComponentsUpdateCountForWeights = -1;
  private __lastBlendShapeComponentsUpdateCountForBlendData = -1;
  private static __webxrSystem: WebXRSystem;

  private constructor() {}

  /**
   * Gets the singleton instance of WebGpuStrategyBasic.
   * Creates a new instance if none exists.
   *
   * @returns The singleton instance of WebGpuStrategyBasic
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebGpuStrategyBasic();
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      WebGpuStrategyBasic.__webxrSystem = webxrSystem;
    }
    return this.__instance;
  }

  /**
   * Generates vertex shader method definitions for storage buffer access.
   * These methods provide standardized access to transform matrices, visibility flags,
   * and morphing functionality in vertex shaders.
   *
   * @returns WGSL shader code containing helper functions for storage buffer access
   */
  static getVertexShaderMethodDefinitions_storageBuffer() {
    return `
fn get_worldMatrix(instanceId: u32) -> mat4x4<f32>
{
  let index: u32 = ${Component.getLocationOffsetOfMemberOfComponent(
    SceneGraphComponent,
    'worldMatrix'
  )}u + 4u * instanceId;
  let matrix = fetchMat4(index);

  return matrix;
}

fn get_normalMatrix(instanceId: u32) -> mat3x3<f32> {
  let index: u32 = ${Component.getLocationOffsetOfMemberOfComponent(
    SceneGraphComponent,
    'normalMatrix'
  )}u * 4 + 9 * instanceId;
  let matrix = fetchMat3No16BytesAligned(index);

  return matrix;
}

fn get_isVisible(instanceId: u32) -> bool {
  let index: u32 = ${Component.getLocationOffsetOfMemberOfComponent(
    SceneGraphComponent,
    'isVisible'
  )}u * 4u + instanceId;
  let visibility = fetchScalarNo16BytesAligned(index);
  if (visibility > 0.5) {
    return true;
  } else {
    return false;
  }
}

fn get_isBillboard(instanceId: u32) -> bool {
  let index: u32 = ${Component.getLocationOffsetOfMemberOfComponent(
    SceneGraphComponent,
    'isBillboard'
  )}u * 4u + instanceId;
  let isBillboard = fetchScalarNo16BytesAligned(index);
  if (isBillboard > 0.5) {
    return true;
  } else {
    return false;
  }
}

#ifdef RN_IS_VERTEX_SHADER
  #ifdef RN_IS_MORPHING
  fn get_position(vertexId: u32, basePosition: vec3<f32>, blendShapeComponentSID: u32) -> vec3<f32> {
    var position = basePosition;
    let scalar_idx = 3u * vertexId;
    for (var i=0u; i<uniformDrawParameters.morphTargetNumber; i++) {
      let currentPrimitiveIdx = uniformDrawParameters.currentPrimitiveIdx;
      let idx = ${Config.maxMorphTargetNumber}u * currentPrimitiveIdx + i;
      let offsets = uniformMorphOffsets.data[ idx / 4u];
      let offsetPosition = offsets[idx % 4u];

      let basePosIn4bytes = offsetPosition * 4u + scalar_idx;
      let addPos = fetchVec3No16BytesAlignedFromBlendShapeBuffer(basePosIn4bytes);

      let idx2 = ${Config.maxMorphTargetNumber}u * blendShapeComponentSID + i;
      let morphWeights: vec4f = uniformMorphWeights.data[ idx2 / 4u];
      let morphWeight: f32 = morphWeights[idx2 % 4u];
      position += addPos * morphWeight;
    }

    return position;
  }
  #endif
#endif

`;
  }

  /**
   * Generates shader property accessor functions for materials and global data.
   * Creates WGSL functions that can fetch property values from storage buffers
   * based on shader semantics information.
   *
   * @param materialTypeName - The name of the material type
   * @param info - Shader semantics information containing type and binding details
   * @param isGlobalData - Whether this property belongs to global data or material-specific data
   * @returns WGSL shader code for the property accessor function
   */
  private static __getShaderProperty(materialTypeName: string, info: ShaderSemanticsInfo, isGlobalData: boolean) {
    const returnType = info.compositionType.toWGSLType(info.componentType);
    const methodName = info.semantic.replace('.', '_');
    const isTexture = CompositionType.isTexture(info.compositionType);

    if (isTexture) {
      let textureType = 'texture_2d<f32>';
      if (info.compositionType === CompositionType.TextureCube) {
        textureType = 'texture_cube<f32>';
      } else if (info.compositionType === CompositionType.Texture2DArray) {
        textureType = 'texture_2d_array<f32>';
      }
      const samplerName = methodName.replace('Texture', 'Sampler');
      return `
@group(1) @binding(${info.initialValue[0]}) var ${methodName}: ${textureType};
@group(2) @binding(${info.initialValue[0]}) var ${samplerName}: sampler;
`;
    }

    // inner contents of 'get_' shader function
    const vec4SizeOfProperty: IndexOf16Bytes = info.compositionType.getVec4SizeOfProperty();
    // for non-`index` property (this is general case)
    const scalarSizeOfProperty: IndexOf4Bytes = info.compositionType.getNumberOfComponents();
    const offsetOfProperty: IndexOf16Bytes = WebGpuStrategyBasic.getOffsetOfPropertyInShader(
      isGlobalData,
      info.semantic,
      materialTypeName
    );

    if (offsetOfProperty === -1) {
      Logger.error('Could not get the location offset of the property.');
    }

    let indexStr: string;
    let instanceSize = vec4SizeOfProperty;
    indexStr = `  let vec4_idx: u32 = ${offsetOfProperty}u + ${instanceSize}u * instanceId;\n`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * (info.arrayLength ?? 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * (info.arrayLength ?? 1);
      indexStr = `  let vec4_idx: u32 = ${offsetOfProperty}u + ${instanceSize} * instanceId + ${vec4SizeOfProperty}u * idxOfArray;\n`;
      indexStr += `  let scalar_idx: u32 = ${
        // IndexOf4Bytes
        offsetOfProperty * 4 // IndexOf16bytes to IndexOf4Bytes
      } + ${instanceSizeInScalar} * instanceId + ${scalarSizeOfProperty}u * idxOfArray;\n`;
    }

    const firstPartOfInnerFunc = `
fn get_${methodName}(instanceId: u32, idxOfArray: u32) -> ${returnType} {
${indexStr}
`;

    let str = `${firstPartOfInnerFunc}`;

    switch (info.compositionType) {
      case CompositionType.Vec4:
      case CompositionType.Vec4Array:
        str += '  let val = fetchElement(vec4_idx);\n';
        break;
      case CompositionType.Vec3:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        str += `  let val = ${returnType}(col0.xyz);`;
        break;
      case CompositionType.Vec3Array:
        str += '  let val = fetchVec3No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Vec2:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        str += `  let val = ${returnType}(col0.xy);`;
        break;
      case CompositionType.Vec2Array:
        str += '  let val = fetchVec2No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Scalar:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        if (info.componentType === ComponentType.Int) {
          str += '  let val = i32(col0.x);';
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += '  let val = u32(col0.x);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '  let val = col0.x >= 0.5;';
        } else {
          str += '  let val = col0.x;';
        }
        break;
      case CompositionType.ScalarArray:
        str += '  let col0 = fetchScalarNo16BytesAligned(scalar_idx);\n';
        if (info.componentType === ComponentType.Int) {
          str += '  let val = i32(col0);';
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += '  let val = u32(col0);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '  let val = col0 >= 0.5;';
        } else {
          str += '  let val = col0;';
        }
        break;
      case CompositionType.Mat4:
        str += '  let val = fetchMat4(vec4_idx);\n';
        break;
      case CompositionType.Mat4Array:
        str += '  let val = fetchMat4(vec4_idx);\n';
        break;
      case CompositionType.Mat3:
        str += '  let val = fetchMat3(vec4_idx);\n';
        break;
      case CompositionType.Mat3Array:
        str += '  let val = fetchMat3No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Mat2:
        str += '  let val = fetchMat2(vec4_idx);\n';
        break;
      case CompositionType.Mat2Array:
        str += '  let val = fetchMat2No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Mat4x3Array:
        str += '  let val = fetchMat4x3(vec4_idx);\n';
        break;
      default:
        // Logger.error('unknown composition type', info.compositionType.str, memberName);
        str += '';
    }
    str += `
  return val;
}
`;
    return str;
  }

  /**
   * Calculates the memory offset of a shader property within storage buffers.
   *
   * @param isGlobalData - Whether to look in global data repository or material repository
   * @param propertyName - The semantic name of the property
   * @param materialTypeName - The material type name for material-specific properties
   * @returns The byte offset of the property in the storage buffer, or -1 if not found
   */
  private static getOffsetOfPropertyInShader(
    isGlobalData: boolean,
    propertyName: ShaderSemanticsName,
    materialTypeName: string
  ) {
    if (isGlobalData) {
      const globalDataRepository = GlobalDataRepository.getInstance();
      const dataBeginPos = globalDataRepository.getLocationOffsetOfProperty(propertyName);
      return dataBeginPos;
    }
    const dataBeginPos = MaterialRepository.getLocationOffsetOfMemberOfMaterial(materialTypeName, propertyName);
    return dataBeginPos;
  }

  /**
   * Loads and prepares a mesh component for rendering.
   * Sets up vertex buffer objects (VBO) and vertex array objects (VAO) if not already done.
   *
   * @param meshComponent - The mesh component to load
   * @returns True if the mesh was successfully loaded, false if the mesh is null
   */
  $load(meshComponent: MeshComponent): boolean {
    const mesh = meshComponent.mesh;
    if (mesh == null) {
      return false;
    }

    // setup VBO and VAO
    if (!mesh.isSetUpDone()) {
      mesh._updateVBOAndVAO();
    }

    return true;
  }

  /**
   * Performs common loading operations required for the WebGPU strategy.
   * Initializes morph target arrays and updates blend shape storage buffers when needed.
   */
  common_$load(): void {
    if (this.__uniformMorphOffsetsTypedArray == null) {
      this.__uniformMorphOffsetsTypedArray = new Uint32Array(
        Math.ceil((Config.maxMorphPrimitiveNumberInWebGPU * Config.maxMorphTargetNumber) / 4) * 4
      );
    }

    if (this.__uniformMorphWeightsTypedArray == null) {
      this.__uniformMorphWeightsTypedArray = new Float32Array(
        Math.ceil((Config.maxMorphPrimitiveNumberInWebGPU * Config.maxMorphTargetNumber) / 4) * 4
      );
    }

    if (BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForBlendData) {
      this.__createOrUpdateStorageBlendShapeBuffer();
      this.__lastBlendShapeComponentsUpdateCountForBlendData = BlendShapeComponent.updateCount;
    }
  }

  /**
   * Sets up shader programs for all primitives in the given mesh component.
   * Iterates through all primitives and ensures their materials have proper shader programs.
   *
   * @param meshComponent - The mesh component containing primitives to setup
   */
  private __setupShaderProgramForMeshComponent(meshComponent: MeshComponent) {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      this._setupShaderProgram(material, primitive);
    }
  }

  /**
   * Sets up a shader program for a specific material and primitive combination.
   * Handles shader compilation errors by falling back to backup materials when necessary.
   *
   * @param material - The material to setup the shader for
   * @param primitive - The primitive that will use this material
   */
  private _setupShaderProgram(material: Material, primitive: Primitive) {
    if (material == null) {
      return;
    }

    if (material.isShaderProgramReady(primitive)) {
      return;
    }

    try {
      this.setupShaderForMaterial(
        material,
        primitive,
        WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(),
        WebGpuStrategyBasic.__getShaderProperty
      );
      primitive._backupMaterial();
    } catch (e) {
      Logger.error(e as string);
      primitive._restoreMaterial();
      this.setupShaderForMaterial(
        primitive.material,
        primitive,
        WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(),
        WebGpuStrategyBasic.__getShaderProperty
      );
    }
  }

  /**
   * Sets up shader programs for materials using the WebGPU rendering strategy.
   * This method orchestrates the shader compilation process by providing the necessary
   * method definitions and property setters.
   *
   * @param material - The material to create shader programs for
   * @param primitive - The primitive geometry that will use this material
   * @param vertexShaderMethodDefinitions - WGSL code containing vertex shader helper methods
   * @param propertySetter - Function to generate property accessor methods
   */
  public setupShaderForMaterial(
    material: Material,
    primitive: Primitive,
    vertexShaderMethodDefinitions: string,
    propertySetter: getShaderPropertyFunc
  ): void {
    material._createProgramWebGpu(primitive, vertexShaderMethodDefinitions, propertySetter);
  }

  /**
   * Performs pre-rendering operations required before drawing.
   * Updates storage buffers when components have been modified and handles morph target updates.
   * This method should be called once per frame before any rendering operations.
   */
  prerender(): void {
    if (
      AnimationComponent.isAnimating ||
      TransformComponent.updateCount !== this.__lastTransformComponentsUpdateCount ||
      SceneGraphComponent.updateCount !== this.__lastSceneGraphComponentsUpdateCount ||
      Material.stateVersion !== this.__lastMaterialsUpdateCount
    ) {
      this.__createAndUpdateStorageBuffer();
      this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
      this.__lastSceneGraphComponentsUpdateCount = SceneGraphComponent.updateCount;
      this.__lastMaterialsUpdateCount = Material.stateVersion;
    } else if (
      CameraComponent.currentCameraUpdateCount !== this.__lastCameraComponentsUpdateCount ||
      CameraControllerComponent.updateCount !== this.__lastCameraControllerComponentsUpdateCount
    ) {
      this.__createAndUpdateStorageBufferForCameraOnly();
      this.__lastCameraComponentsUpdateCount = CameraComponent.currentCameraUpdateCount;
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
    }

    if (BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForWeights) {
      this.__updateUniformMorph();
      this.__lastBlendShapeComponentsUpdateCountForWeights = BlendShapeComponent.updateCount;
    }
  }

  /**
   * Main rendering method that draws all primitives in the specified render pass.
   * Handles different primitive types (opaque, translucent, blend) with appropriate depth writing settings.
   *
   * @param primitiveUids - Array of primitive UIDs to render, sorted by rendering order
   * @param renderPass - The render pass configuration containing rendering settings
   * @param renderPassTickCount - Current tick count for animation and timing purposes
   * @returns True if any primitives were successfully rendered
   */
  common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, _renderPassTickCount: number): boolean {
    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(renderPass);
      return true;
    }

    let renderedSomething = false;
    const isZWrite = renderPass.isDepthTest && renderPass.depthWriteMask;
    const isZWrite2 =
      renderPass.isDepthTest && renderPass.depthWriteMask && MeshRendererComponent.isDepthMaskTrueForBlendPrimitives;
    // For opaque primitives
    if (renderPass._toRenderOpaquePrimitives) {
      for (let i = renderPass._lastOpaqueIndex; i >= 0; i--) {
        // Drawing from the nearest object
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite);
        renderedSomething ||= rendered;
      }
    }

    // For translucent primitives
    if (renderPass._toRenderTranslucentPrimitives) {
      // Draw Translucent primitives
      for (let i = renderPass._lastOpaqueIndex + 1; i <= renderPass._lastTranslucentIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithZWritePrimitives) {
      // Draw Blend primitives with ZWrite
      for (let i = renderPass._lastTranslucentIndex + 1; i <= renderPass._lastBlendWithZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithoutZWritePrimitives) {
      // Draw Blend primitives without ZWrite
      for (let i = renderPass._lastBlendWithZWriteIndex + 1; i <= renderPass._lastBlendWithoutZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite2);
        renderedSomething ||= rendered;
      }
    }

    return renderedSomething;
  }

  /**
   * Renders primitives without using vertex/index buffers.
   * This is used for special rendering modes like full-screen effects or procedural geometry.
   *
   * @param renderPass - The render pass containing the material and rendering configuration
   */
  private __renderWithoutBuffers(renderPass: RenderPass) {
    const material = renderPass.material!;
    const primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    this._setupShaderProgram(material, primitive);

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    webGpuResourceRepository.updateUniformBufferForDrawParameters(
      `${renderPass.renderPassUID}-${primitive.primitiveUid}`,
      material.materialSID,
      0,
      0,
      0
    );
    webGpuResourceRepository.draw(primitive, material, renderPass, 0, true);
  }

  /**
   * Renders a single primitive with the specified material and render settings.
   * Handles shader setup, uniform buffer updates, and the actual draw call.
   *
   * @param primitiveUid - Unique identifier of the primitive to render
   * @param renderPass - Render pass containing rendering configuration
   * @param zWrite - Whether to enable depth buffer writing
   * @returns True if the primitive was successfully rendered
   */
  renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, zWrite: boolean) {
    if (primitiveUid === -1) {
      return false;
    }
    const primitive = Primitive.getPrimitive(primitiveUid);
    if (primitive == null) {
      return false;
    }
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    this._setupShaderProgram(material, primitive);
    if (isSkipDrawing(material, primitive)) {
      return false;
    }

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    const cameraSID = this.__getAppropriateCameraComponentSID(renderPass, 0, false);

    const primitiveIdxHasMorph = Primitive.getPrimitiveIdxHasMorph(primitive.primitiveUid) ?? 0;
    webGpuResourceRepository.updateUniformBufferForDrawParameters(
      `${renderPass.renderPassUID}-${primitive.primitiveUid}`,
      material.materialSID,
      cameraSID,
      primitiveIdxHasMorph,
      primitive.targets.length
    );
    webGpuResourceRepository.draw(primitive, material, renderPass, cameraSID, zWrite);
    return true;
  }

  /**
   * Creates or updates the main storage buffer containing all GPU instance data.
   * This buffer holds transform matrices, material properties, and other per-instance data
   * required for rendering all objects in the scene.
   */
  private __createAndUpdateStorageBuffer() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();

    // the GPU global Storage
    const gpuInstanceDataBuffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUInstanceData);

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    // const dataTextureByteSize =
    //   MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength * 4 * 4;
    const float32Array = new Float32Array(gpuInstanceDataBuffer!.getArrayBuffer());
    if (this.__storageBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      // Update
      const dataSizeForDataTexture = gpuInstanceDataBuffer!.takenSizeInByte / 4;
      webGpuResourceRepository.updateStorageBuffer(this.__storageBufferUid, float32Array, dataSizeForDataTexture);
    } else {
      // Create
      this.__storageBufferUid = webGpuResourceRepository.createStorageBuffer(float32Array);
    }
  }

  /**
   * Updates only the camera-related portion of the storage buffer for performance optimization.
   * Used when only camera properties have changed, avoiding unnecessary updates to transform data.
   */
  private __createAndUpdateStorageBufferForCameraOnly() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();

    // the GPU global Storage
    const gpuInstanceDataBuffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUInstanceData);

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    const globalDataRepository = GlobalDataRepository.getInstance();
    const float32Array = new Float32Array(gpuInstanceDataBuffer!.getArrayBuffer());
    if (this.__storageBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      // Update
      const offsetOfStorageBuffer = globalDataRepository.getLocationOffsetOfProperty('viewMatrix') * 16;
      const offsetOfFloat32Array = offsetOfStorageBuffer / 4;
      const positionOfBoneMatrix = (globalDataRepository.getLocationOffsetOfProperty('boneMatrix') * 16) / 4; // camera infos are before boneMatrix
      webGpuResourceRepository.updateStorageBufferPartially(
        this.__storageBufferUid,
        float32Array,
        offsetOfStorageBuffer,
        offsetOfFloat32Array,
        positionOfBoneMatrix - offsetOfFloat32Array
      );
    } else {
      // Create
      this.__storageBufferUid = webGpuResourceRepository.createStorageBuffer(float32Array);
    }
  }

  /**
   * Creates or updates the storage buffer containing blend shape vertex data.
   * This buffer holds morph target positions and other vertex attributes needed for blend shape animation.
   */
  private __createOrUpdateStorageBlendShapeBuffer() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();

    // the GPU global Storage
    const blendShapeDataBuffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUVertexData);

    if (blendShapeDataBuffer == null) {
      return;
    }

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    const float32Array = new Float32Array(blendShapeDataBuffer!.getArrayBuffer());
    if (this.__storageBlendShapeBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      // Update
      const componentSizeForDataTexture = blendShapeDataBuffer!.takenSizeInByte / 4;
      webGpuResourceRepository.updateStorageBlendShapeBuffer(
        this.__storageBlendShapeBufferUid,
        float32Array,
        componentSizeForDataTexture
      );
    } else {
      // Create
      this.__storageBlendShapeBufferUid = webGpuResourceRepository.createStorageBlendShapeBuffer(float32Array);
    }

    let i = 0;
    for (; i < Config.maxMorphPrimitiveNumberInWebGPU; i++) {
      const primitive = Primitive.getPrimitiveHasMorph(i);
      if (primitive != null) {
        for (let j = 0; j < primitive.targets.length; j++) {
          const target = primitive.targets[j];
          const accessor = target.get(VertexAttribute.Position.XYZ) as Accessor;
          this.__uniformMorphOffsetsTypedArray![Config.maxMorphTargetNumber * i + j] =
            accessor.byteOffsetInBuffer / 4 / 4;
        }
      } else {
        break;
      }
    }
    const elementNumToCopy = Config.maxMorphTargetNumber * i;
    webGpuResourceRepository.updateUniformMorphOffsetsBuffer(this.__uniformMorphOffsetsTypedArray!, elementNumToCopy);
  }

  /**
   * Updates uniform buffers containing morph target weights for blend shape animation.
   * Copies weight values from blend shape components to GPU-accessible uniform buffers.
   */
  private __updateUniformMorph() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const blendShapeDataBuffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUVertexData);
    if (blendShapeDataBuffer == null) {
      return;
    }

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();

    const blendShapeComponents = ComponentRepository.getComponentsWithType(BlendShapeComponent);
    for (let i = 0; i < blendShapeComponents.length; i++) {
      const blendShapeComponent = blendShapeComponents[i] as BlendShapeComponent;
      const weights = blendShapeComponent!.weights;
      for (let j = 0; j < weights.length; j++) {
        this.__uniformMorphWeightsTypedArray![Config.maxMorphTargetNumber * blendShapeComponent.componentSID + j] =
          weights[j];
      }
    }
    if (blendShapeComponents.length > 0) {
      const elementNumToCopy = Config.maxMorphTargetNumber * blendShapeComponents.length;
      webGpuResourceRepository.updateUniformMorphWeightsBuffer(this.__uniformMorphWeightsTypedArray!, elementNumToCopy);
    }
  }

  /**
   * Determines the appropriate camera component SID for the current rendering context.
   * Handles both VR and non-VR rendering scenarios, including multi-view stereo rendering.
   *
   * @param renderPass - The current render pass
   * @param displayIdx - Display index for stereo rendering (0 for left eye, 1 for right eye)
   * @param isVRMainPass - Whether this is a VR main rendering pass
   * @returns The component SID of the appropriate camera, or -1 if no camera is available
   */
  private __getAppropriateCameraComponentSID(renderPass: RenderPass, displayIdx: 0 | 1, isVRMainPass: boolean): number {
    if (isVRMainPass) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      let cameraComponentSid = -1;
      if (webxrSystem.isWebXRMode) {
        if (webxrSystem.isMultiView()) {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(0);
        } else {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(displayIdx);
        }
      }
      return cameraComponentSid;
    }
    // Non-VR Rendering
    let cameraComponent = renderPass.cameraComponent;
    if (cameraComponent == null) {
      // if the renderPass has no cameraComponent, try to get the current cameraComponent
      cameraComponent = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as CameraComponent;
    }
    if (cameraComponent) {
      return cameraComponent.componentSID;
    }
    return -1;
  }
}

import { AnimationComponent } from '../foundation/components/Animation/AnimationComponent';
import { BlendShapeComponent } from '../foundation/components/BlendShape/BlendShapeComponent';
import { LightComponent } from '../foundation/components/Light/LightComponent';
import type { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { Component } from '../foundation/core/Component';
import { ComponentRepository } from '../foundation/core/ComponentRepository';
import { Config } from '../foundation/core/Config';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { MemoryManager } from '../foundation/core/MemoryManager';
import { BufferUse } from '../foundation/definitions/BufferUse';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { PixelFormat } from '../foundation/definitions/PixelFormat';
import { ShaderSemantics } from '../foundation/definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { ShaderType, type ShaderTypeEnum } from '../foundation/definitions/ShaderType';
import { TextureFormat } from '../foundation/definitions/TextureFormat';
import { TextureParameter } from '../foundation/definitions/TextureParameter';
import { VertexAttribute } from '../foundation/definitions/VertexAttribute';
import type { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import type { Scalar } from '../foundation/math/Scalar';
import type { Vector2 } from '../foundation/math/Vector2';
import type { Accessor } from '../foundation/memory/Accessor';
import type { Buffer } from '../foundation/memory/Buffer';
import { Is } from '../foundation/misc/Is';
import { Logger } from '../foundation/misc/Logger';
import { MiscUtil } from '../foundation/misc/MiscUtil';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import type { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import { isSkipDrawing } from '../foundation/renderer/RenderingCommonMethods';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { SystemState } from '../foundation/system/SystemState';
import type { CGAPIResourceHandle, Count, Index, PrimitiveUID, WebGLResourceHandle } from '../types/CommonTypes';
import type { WebXRSystem } from '../xr/WebXRSystem';
import type { RnXR } from '../xr/main';
import type { WebGLContextWrapper } from './WebGLContextWrapper';
import { WebGLResourceRepository } from './WebGLResourceRepository';
import type { ShaderSources, WebGLStrategy } from './WebGLStrategy';
import WebGLStrategyCommonMethod, { setupShaderProgram } from './WebGLStrategyCommonMethod';

declare const spector: any;

/**
 * WebGL rendering strategy implementation using uniform-based approach.
 * This strategy uses uniforms to pass per-object data to shaders instead of vertex attributes,
 * which is more suitable for rendering multiple objects with different properties.
 *
 * @implements {CGAPIStrategy}
 * @implements {WebGLStrategy}
 */
export class WebGLStrategyUniform implements CGAPIStrategy, WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __morphOffsetsUniformBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __morphWeightsUniformBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __uniformMorphOffsetsTypedArray?: Uint32Array;
  private __uniformMorphWeightsTypedArray?: Float32Array;
  private __lastShader: CGAPIResourceHandle = -1;
  private __lastMaterial?: WeakRef<Material>;
  private __lastRenderPassTickCount = -1;
  private __lastMorphMaxIndex = -1;
  private __lastBlendShapeComponentsUpdateCountForWeights = -1;
  private __lastMorphOffsetsUniformDataSize = -1;
  private __lastMorphWeightsUniformDataSize = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __webxrSystem: WebXRSystem;

  /**
   * Shader semantics information for component matrices used in uniform rendering strategy.
   * Defines world matrix, normal matrix, billboard flag, and vertex attributes existence array.
   */
  private static getComponentMatricesInfoArray(): ShaderSemanticsInfo[] {
    const shaderSemanticsInfos: ShaderSemanticsInfo[] = [
      {
        semantic: 'vertexAttributesExistenceArray',
        compositionType: CompositionType.ScalarArray,
        componentType: ComponentType.Int,
        stage: ShaderType.VertexShader,
        min: 0,
        max: 1,
        isInternalSetting: true,
      },
    ];

    const memberInfo = Component.getMemberInfo();
    memberInfo.forEach((mapMemberNameMemberInfo, _componentClass) => {
      mapMemberNameMemberInfo.forEach((memberInfo, memberName) => {
        shaderSemanticsInfos.push({
          semantic: memberName,
          compositionType: memberInfo.compositionType,
          componentType: memberInfo.convertToBool ? ComponentType.Bool : memberInfo.componentType,
          stage: ShaderType.VertexShader,
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          isInternalSetting: true,
        });
      });
    });

    return shaderSemanticsInfos;
  }

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * method definitions for component data access for uniform-based rendering.
   * Provides GLSL functions for accessing component data through uniforms.
   */
  private static __getComponentDataAccessMethodDefinitions_uniform(shaderType: ShaderTypeEnum) {
    let str = '';
    const memberInfo = Component.getMemberInfo();
    memberInfo.forEach((mapMemberNameMemberInfo, _componentClass) => {
      mapMemberNameMemberInfo.forEach((memberInfo, memberName) => {
        if (memberInfo.shaderType !== shaderType && memberInfo.shaderType !== ShaderType.VertexAndPixelShader) {
          return;
        }
        let typeStr = '';
        switch (memberInfo.compositionType) {
          case CompositionType.Mat4:
            typeStr = 'mat4';
            break;
          case CompositionType.Mat3:
            typeStr = 'mat3';
            break;
          case CompositionType.Vec4:
            typeStr = 'vec4';
            break;
          case CompositionType.Vec3:
            typeStr = 'vec3';
            break;
          case CompositionType.Scalar:
            typeStr = 'float';
            break;
          case CompositionType.Mat4x3Array:
            typeStr = 'mat4x3';
            break;
          case CompositionType.Vec4Array:
            typeStr = 'vec4';
            break;
          default:
            throw new Error(`Unsupported composition type: ${memberInfo.compositionType.str}`);
        }
        const isArray = CompositionType.isArray(memberInfo.compositionType);
        str += `uniform ${memberInfo.convertToBool ? 'bool' : typeStr} u_${memberName}${isArray ? `[${Config.maxSkeletalBoneNumberForUniformMode}]` : ''};\n`;
        str += `${memberInfo.convertToBool ? 'bool' : typeStr} get_${memberName}(float instanceId${isArray ? ', int idxOfArray' : ''}) {
  return u_${memberName}${isArray ? '[idxOfArray]' : ''};
}\n`;
      });
    });

    return str;
  }

  private static __getMorphedPositionGetter(): string {
    const morphUniformDataTargetNumbers = Primitive.getMorphUniformDataTargetNumbers();
    const morphUniformDataTargetNumbersStr = `
    int morphUniformDataTargetNumbers[] = int[](${morphUniformDataTargetNumbers.join(', ')});
    `;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphUniformDataOffsetsStr = `
    int morphUniformDataOffsets[] = int[](${morphUniformDataOffsets.join(', ')});
    `;
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform();
    const blendShapeUniformDataOffsetsStr = `
    int blendShapeUniformDataOffsets[] = int[](${blendShapeUniformDataOffsets.join(', ')});
    `;

    const morphingStr = `
    #ifdef RN_IS_VERTEX_SHADER
      #ifdef RN_IS_MORPHING
      vec3 get_position(float vertexId, vec3 basePosition, int blendShapeComponentSID) {
        ${morphUniformDataTargetNumbersStr}
        ${morphUniformDataOffsetsStr}
        ${blendShapeUniformDataOffsetsStr}
        int currentPrimitiveIdx = u_currentPrimitiveIdx;
        int offsetInUniform = morphUniformDataOffsets[currentPrimitiveIdx];
        int offsetInUniform2 = blendShapeUniformDataOffsets[blendShapeComponentSID];
        vec3 position = basePosition;
        int scalar_idx = 3 * int(vertexId);
        for (int i=0; i<morphUniformDataTargetNumbers[currentPrimitiveIdx]; i++) {
          int idx = offsetInUniform + i;
          ivec4 offsets = uniformMorphOffsets.data[ idx / 4];
          int offsetPosition = offsets[idx % 4];

          int basePosIn4bytes = offsetPosition * 4 + scalar_idx;
          vec3 addPos = fetchVec3No16BytesAligned(basePosIn4bytes);

          int idx2 = offsetInUniform2 + i;
          vec4 morphWeights = uniformMorphWeights.data[ idx2 / 4];
          float morphWeight = morphWeights[idx2 % 4];

          position += addPos * morphWeight;
        }

        return position;
      }
      #endif
    #endif
    `;

    return morphingStr;
  }

  /**
   * Sets up shader program for the given material and primitive in this WebGL strategy.
   * Creates a new shader program if needed and configures uniform locations for rendering.
   *
   * @param material - The material to setup shader program for
   * @param primitive - The primitive geometry to associate with the shader
   * @returns The CGAPIResourceHandle of the created or existing shader program
   */
  public setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const _glw = webglResourceRepository.currentWebGLContextWrapper!;

    const [programUid, newOne] = material._createProgramWebGL(
      WebGLStrategyUniform.__getComponentDataAccessMethodDefinitions_uniform(ShaderType.VertexShader),
      WebGLStrategyUniform.__getComponentDataAccessMethodDefinitions_uniform(ShaderType.PixelShader),
      ShaderSemantics.getShaderPropertyOfGlobalDataRepository,
      ShaderSemantics.getShaderPropertyOfMaterial,
      WebGLStrategyUniform.__getMorphedPositionGetter(),
      primitive
    );

    if (newOne) {
      material._setupBasicUniformsLocations(primitive);

      material._setUniformLocationsOfMaterialNodes(true, primitive);

      const shaderSemanticsInfos = WebGLStrategyUniform.getComponentMatricesInfoArray();
      const shaderSemanticsInfosPointSprite = WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray();

      material._setupAdditionalUniformLocations(
        shaderSemanticsInfos.concat(shaderSemanticsInfosPointSprite),
        true,
        primitive
      );

      WebGLStrategyUniform.__globalDataRepository._setUniformLocationsForUniformModeOnly(
        material.getShaderProgramUid(primitive)
      );

      webglResourceRepository.setUniformBlockBindingForMorphOffsetsAndWeights(
        programUid,
        this.__morphOffsetsUniformBufferUid,
        this.__morphWeightsUniformBufferUid
      );
    }

    return programUid;
  }

  /**
   * Re-sets up shader program for the material using updated shader sources from Spector.js.
   * This method is specifically designed for shader debugging and live editing scenarios.
   *
   * @param material - The material to re-setup shader program for
   * @param primitive - The primitive geometry associated with the shader
   * @param updatedShaderSources - The updated shader source code
   * @param onError - Callback function to handle compilation errors
   * @returns The CGAPIResourceHandle of the updated shader program, or InvalidCGAPIResourceUid on failure
   */
  public _reSetupShaderForMaterialBySpector(
    material: Material,
    primitive: Primitive,
    updatedShaderSources: ShaderSources,
    onError: (message: string) => void
  ): CGAPIResourceHandle {
    const [programUid, newOne] = material._createProgramByUpdatedSources(updatedShaderSources, primitive, onError);
    if (programUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return programUid;
    }

    if (newOne) {
      material._setupBasicUniformsLocations(primitive);

      material._setUniformLocationsOfMaterialNodes(true, primitive);

      const shaderSemanticsInfos = WebGLStrategyUniform.getComponentMatricesInfoArray();
      const shaderSemanticsInfosPointSprite = WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray();

      material._setupAdditionalUniformLocations(
        shaderSemanticsInfos.concat(shaderSemanticsInfosPointSprite),
        true,
        primitive
      );
    }

    WebGLStrategyUniform.__globalDataRepository._setUniformLocationsForUniformModeOnly(
      material.getShaderProgramUid(primitive)
    );

    return programUid;
  }

  /**
   * Loads and prepares mesh data for rendering.
   * Sets up VBO (Vertex Buffer Object) and VAO (Vertex Array Object) if not already done.
   *
   * @param meshComponent - The mesh component containing the mesh to load
   * @returns True if the mesh was loaded successfully, false otherwise
   */
  $load(meshComponent: MeshComponent) {
    const mesh = meshComponent.mesh as Mesh;
    if (!Is.exist(mesh)) {
      return false;
    }

    // setup VBO and VAO
    if (!mesh.isSetUpDone()) {
      mesh._updateVBOAndVAO();
    }

    return true;
  }

  private __updateMorphOffsetsUniformBuffersInner() {
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    for (let i = 0; i < Primitive.getPrimitiveCountHasMorph(); i++) {
      const primitive = Primitive.getPrimitiveHasMorph(i);
      if (primitive != null) {
        for (let j = 0; j < primitive.targets.length; j++) {
          const target = primitive.targets[j];
          const accessor = target.get(VertexAttribute.Position.XYZ) as Accessor;
          const byteOffsetOfExistingBuffer = MemoryManager.getInstance().getByteOffsetOfExistingBuffers(
            BufferUse.GPUVertexData,
            accessor.bufferView.buffer.indexOfTheBufferUsage
          );
          this.__uniformMorphOffsetsTypedArray![morphUniformDataOffsets[i] + j] =
            (SystemState.totalSizeOfGPUShaderDataStorageExceptMorphData +
              byteOffsetOfExistingBuffer +
              accessor.byteOffsetInBuffer) /
            4 /
            4;
        }
      } else {
        break;
      }
    }
    const elementNumToCopy = morphUniformDataOffsets[morphUniformDataOffsets.length - 1];
    this.__webglResourceRepository.updateUniformBuffer(
      this.__morphOffsetsUniformBufferUid,
      this.__uniformMorphOffsetsTypedArray!,
      0,
      elementNumToCopy
    );
  }

  private __initMorphUniformBuffers() {
    let needsRebindMorphUniformBuffers = false;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphOffsetsUniformDataSize = Math.max(
      Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );

    if (morphOffsetsUniformDataSize !== this.__lastMorphOffsetsUniformDataSize) {
      // delete the old morph offsets uniform buffer
      if (this.__morphOffsetsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__webglResourceRepository.deleteUniformBuffer(this.__morphOffsetsUniformBufferUid);
        this.__morphOffsetsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
      // create the new morph offsets uniform buffer
      this.__lastMorphOffsetsUniformDataSize = morphOffsetsUniformDataSize;
      if (this.__morphOffsetsUniformBufferUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayOffsets = new Uint32Array(morphOffsetsUniformDataSize);
        this.__uniformMorphOffsetsTypedArray = inputArrayOffsets;
        this.__morphOffsetsUniformBufferUid =
          this.__webglResourceRepository.createUniformBufferWithBufferView(inputArrayOffsets);
        this.__updateMorphOffsetsUniformBuffersInner();
      }

      this.__lastMorphOffsetsUniformDataSize = morphOffsetsUniformDataSize;
      needsRebindMorphUniformBuffers = true;
    }

    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform();
    const blendShapeWeightsUniformDataSize = Math.max(
      Math.ceil(blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );

    if (blendShapeWeightsUniformDataSize !== this.__lastMorphWeightsUniformDataSize) {
      // delete the old morph weights uniform buffer
      if (this.__morphWeightsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__webglResourceRepository.deleteUniformBuffer(this.__morphWeightsUniformBufferUid);
        this.__morphWeightsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }

      // create the new morph weights uniform buffer
      if (this.__morphWeightsUniformBufferUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayWeights = new Float32Array(blendShapeWeightsUniformDataSize);
        this.__uniformMorphWeightsTypedArray = inputArrayWeights;
        this.__morphWeightsUniformBufferUid =
          this.__webglResourceRepository.createUniformBufferWithBufferView(inputArrayWeights);
        this.__updateMorphWeightsUniformBuffer();
      }

      this.__lastMorphWeightsUniformDataSize = blendShapeWeightsUniformDataSize;
      needsRebindMorphUniformBuffers = true;
    }

    if (needsRebindMorphUniformBuffers) {
      this.__bindMorphUniformBuffers();
    }
  }

  private __bindMorphUniformBuffers() {
    if (
      this.__morphOffsetsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid &&
      this.__morphWeightsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid
    ) {
      this.__webglResourceRepository.setUniformBlockBindingForMorphOffsetsAndWeightsWithoutShaderProgram(
        this.__morphOffsetsUniformBufferUid,
        this.__morphWeightsUniformBufferUid
      );
    }
  }

  /**
   * Updates uniform buffers containing morph target weights for blend shape animation.
   * Copies weight values from blend shape components to GPU-accessible uniform buffers.
   */
  private __updateMorphWeightsUniformBuffer() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const blendShapeDataBuffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUVertexData);
    if (blendShapeDataBuffer == null) {
      return;
    }
    if (blendShapeDataBuffer.takenSizeInByte === 0) {
      return;
    }

    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform();
    const blendShapeComponents = ComponentRepository.getComponentsWithType(
      BlendShapeComponent
    ) as BlendShapeComponent[];
    for (let i = 0; i < blendShapeComponents.length; i++) {
      const blendShapeComponent = blendShapeComponents[i];
      const weights = blendShapeComponent.weights;
      for (let j = 0; j < weights.length; j++) {
        this.__uniformMorphWeightsTypedArray![blendShapeUniformDataOffsets[i] + j] = weights[j];
      }
    }
    if (blendShapeComponents.length > 0) {
      const elementNumToCopy = blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1];
      this.__webglResourceRepository.updateUniformBuffer(
        this.__morphWeightsUniformBufferUid,
        this.__uniformMorphWeightsTypedArray!,
        0,
        elementNumToCopy
      );
    }
  }

  /**
   * Performs pre-rendering setup operations.
   * Initializes light components, sets up data texture for GPU vertex data,
   * and prepares global rendering state.
   */
  prerender(): void {
    this.__lightComponents = ComponentRepository.getComponentsWithType(LightComponent) as LightComponent[];

    // Setup Data Texture
    if (this.__dataTextureUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const memoryManager: MemoryManager = MemoryManager.getInstance();
      const buffers: Buffer[] = memoryManager.getBuffers(BufferUse.GPUVertexData);
      if (buffers.length === 0) {
        return;
      }

      const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
      if (glw == null) {
        return;
      }
      const dataTextureWidth = glw.getMaxTextureSize();
      const totalSizeOfTheBuffersInTexel = buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0) / 4 / 4;
      const dataTextureHeight = Math.ceil(totalSizeOfTheBuffersInTexel / dataTextureWidth);

      const dataTextureByteSize = dataTextureWidth * dataTextureHeight * 4 * 4;
      const concatArrayBuffer = MiscUtil.concatArrayBuffers2({
        finalSize: dataTextureByteSize,
        srcs: buffers.map(buffer => buffer.getArrayBuffer()),
        srcsCopySize: buffers.map(buffer => buffer.byteLength),
        srcsOffset: buffers.map(_buffer => 0),
      });
      const floatDataTextureBuffer = new Float32Array(concatArrayBuffer);

      this.__dataTextureUid = this.__webglResourceRepository.createTextureFromTypedArray(floatDataTextureBuffer, {
        internalFormat: TextureFormat.RGBA32F,
        width: dataTextureWidth,
        height: dataTextureHeight,
        format: PixelFormat.RGBA,
        type: ComponentType.Float,
        generateMipmap: false,
      });

      SystemState.totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
    }

    if (BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForWeights) {
      this.__updateMorphWeightsUniformBuffer();
      this.__lastBlendShapeComponentsUpdateCountForWeights = BlendShapeComponent.updateCount;
    }

    this.__updateMorphOffsetsUniformBuffers();
  }

  /**
   * Deletes the current data texture and frees associated GPU resources.
   * This method should be called when the data texture needs to be recreated
   * or when cleaning up resources.
   *
   * @remarks
   * After calling this method, the data texture UID is reset to an invalid state,
   * and a new data texture will be created on the next rendering cycle.
   */
  deleteDataTexture(): void {
    if (this.__dataTextureUid != null) {
      this.__webglResourceRepository.deleteTexture(this.__dataTextureUid);
      this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }

  /**
   * Attaches GPU data for the primitive.
   * This method is part of the CGAPIStrategy interface but is a no-op in uniform strategy
   * as GPU data is handled differently through data textures.
   *
   * @param primitive - The primitive to attach GPU data for
   */
  attachGPUData(_primitive: Primitive): void {}

  /**
   * Attaches vertex data for rendering.
   * This method is part of the CGAPIStrategy interface but is a no-op in uniform strategy
   * as vertex data attachment is handled in attachVertexDataInner.
   *
   * @param i - Index parameter (unused in uniform strategy)
   * @param primitive - The primitive containing vertex data
   * @param glw - WebGL context wrapper
   * @param instanceIDBufferUid - Instance ID buffer handle (unused in uniform strategy)
   */
  attachVertexData(
    _i: number,
    _primitive: Primitive,
    _glw: WebGLContextWrapper,
    _instanceIDBufferUid: WebGLResourceHandle
  ) {}

  /**
   * Internal method to attach vertex data for a specific mesh and primitive.
   * Binds the appropriate VAO or sets up vertex data pipeline for rendering.
   *
   * @param mesh - The mesh containing vertex data
   * @param primitive - The primitive geometry to render
   * @param primitiveUid - Unique identifier for the primitive
   * @param glw - WebGL context wrapper
   * @param instanceIDBufferUid - Instance ID buffer handle (unused in uniform strategy)
   */
  attachVertexDataInner(
    mesh: Mesh,
    primitive: Primitive,
    primitiveUid: Index,
    glw: WebGLContextWrapper,
    instanceIDBufferUid: WebGLResourceHandle
  ) {
    const vao = this.__webglResourceRepository.getWebGLResource(
      mesh.getVaoUidsByPrimitiveUid(primitiveUid)
    ) as WebGLVertexArrayObjectOES;

    if (vao != null) {
      glw.bindVertexArray(vao);
    } else {
      const vaoHandles = primitive.vertexHandles!;
      this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, instanceIDBufferUid);
      const ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle!) as WebGLBuffer;
      const gl = glw.getRawContext();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }

  /**
   * Detaches vertex data and cleans up OpenGL state after rendering.
   * Unbinds VAO, element array buffer, and array buffer to prevent state leakage.
   *
   * @param glw - WebGL context wrapper used for state cleanup
   */
  dettachVertexData(glw: WebGLContextWrapper) {
    const gl = glw.getRawContext();
    if (glw.bindVertexArray) {
      glw.bindVertexArray(null);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /**
   * Gets the singleton instance of WebGLStrategyUniform.
   * Initializes the instance and WebXR system if not already created.
   *
   * @returns The singleton instance of WebGLStrategyUniform
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebGLStrategyUniform();
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      WebGLStrategyUniform.__webxrSystem = webxrSystem;
    }

    return this.__instance;
  }

  common_$load(): void {
    this.__initMorphUniformBuffers();
  }

  private __updateMorphOffsetsUniformBuffers() {
    const morphMaxIndex = Primitive.getPrimitiveCountHasMorph();
    if (morphMaxIndex !== this.__lastMorphMaxIndex) {
      this.__updateMorphOffsetsUniformBuffersInner();
      this.deleteDataTexture();
      this.__lastMorphMaxIndex = morphMaxIndex;
    }
  }

  /**
   * Common rendering method that handles the main rendering pipeline.
   * Processes primitives in different rendering phases: opaque, translucent, blend with/without Z-write.
   * Supports buffer-less rendering mode for special cases like post-processing effects.
   *
   * @param primitiveUids - Array of primitive UIDs to render, sorted by rendering order
   * @param renderPass - The render pass configuration containing rendering settings
   * @param renderPassTickCount - Current tick count for the render pass
   * @param displayIdx - The index of the display to render to
   * @returns True if any primitives were rendered, false otherwise
   */
  common_$render(
    primitiveUids: PrimitiveUID[],
    renderPass: RenderPass,
    renderPassTickCount: Count,
    _displayIdx: Index
  ) {
    if (typeof spector !== 'undefined') {
      spector.setMarker('|  |  Uniform:$render#');
    }

    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContextAsWebGL2();

    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(gl, renderPass);
      gl.depthMask(true);
      return true;
    }

    let renderedSomething = false;

    // For opaque primitives
    if (renderPass._toRenderOpaquePrimitives) {
      if (!renderPass.depthWriteMask) {
        gl.depthMask(false);
      }
      for (let i = renderPass._lastOpaqueIndex; i >= 0; i--) {
        // Drawing from the nearest object
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, glw, renderPass, renderPassTickCount);
        renderedSomething ||= rendered;
      }
    }

    // For translucent primitives
    if (renderPass._toRenderTranslucentPrimitives) {
      // Draw Translucent primitives
      for (let i = renderPass._lastOpaqueIndex + 1; i <= renderPass._lastTranslucentIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, glw, renderPass, renderPassTickCount);
        renderedSomething ||= rendered;
      }
    }

    // Draw Blend primitives with ZWrite
    if (renderPass._toRenderBlendWithZWritePrimitives) {
      for (let i = renderPass._lastTranslucentIndex + 1; i <= renderPass._lastBlendWithZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, glw, renderPass, renderPassTickCount);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithoutZWritePrimitives) {
      // disable depth write for blend primitives
      gl.depthMask(false);

      // Draw Blend primitives without ZWrite
      for (let i = renderPass._lastBlendWithZWriteIndex + 1; i <= renderPass._lastBlendWithoutZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, glw, renderPass, renderPassTickCount);
        renderedSomething ||= rendered;
      }
    }
    gl.depthMask(true);

    // this.__webglResourceRepository.unbindTextureSamplers();

    return renderedSomething;
  }

  /**
   * Renders primitives without using vertex/index buffers.
   * Used for buffer-less rendering scenarios such as full-screen post-processing effects.
   *
   * @param gl - WebGL2 rendering context
   * @param renderPass - The render pass containing material and rendering configuration
   */
  private __renderWithoutBuffers(gl: WebGL2RenderingContext, renderPass: RenderPass) {
    // setup shader program
    const material: Material = renderPass.material!;
    const primitive: Primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    setupShaderProgram(material, primitive, this);

    const shaderProgramUid = material.getShaderProgramUid(primitive);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
    gl.useProgram(shaderProgram);
    this.__lastShader = shaderProgramUid;

    this.bindDataTexture(gl, shaderProgram);

    WebGLStrategyCommonMethod.setWebGLParameters(material, gl);
    material._setParametersToGpuWebGLWithOutInternalSetting({
      shaderProgram,
      firstTime: true,
      isUniformMode: true,
    });

    const isVrMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    if ((shaderProgram as any).vrState != null && isVrMainPass) {
      const vrState = GlobalDataRepository.getInstance().getValue('vrState', 0) as Vector2;
      vrState._v[0] = isVrMainPass ? 1 : 0;
      vrState._v[1] = 0;
      (shaderProgram as any)._gl.uniform2iv((shaderProgram as any).vrState, vrState._v);
    }

    if (renderPass.depthWriteMask) {
      gl.depthMask(true);
    } else {
      gl.depthMask(false);
    }

    this.__webglResourceRepository.setViewport(renderPass.getViewport());

    gl.drawArrays(
      renderPass._primitiveModeForBufferLessRendering.index,
      0,
      renderPass._drawVertexNumberForBufferLessRendering
    );
  }

  /**
   * Internal rendering method for processing individual primitives.
   * Handles shader setup, material parameters, lighting, VR rendering, and draw calls
   * for each mesh entity associated with the primitive.
   *
   * @param primitiveUid - Unique identifier of the primitive to render
   * @param glw - WebGL context wrapper
   * @param renderPass - The render pass configuration
   * @param renderPassTickCount - Current tick count for the render pass
   * @returns True if the primitive was rendered successfully, false otherwise
   */
  renderInner(
    primitiveUid: PrimitiveUID,
    glw: WebGLContextWrapper,
    renderPass: RenderPass,
    _renderPassTickCount: Count
  ) {
    const gl = glw.getRawContext();
    const primitive = Primitive.getPrimitive(primitiveUid);
    if (primitive == null) {
      return false;
    }
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    setupShaderProgram(material, primitive, this);

    const mesh = primitive.mesh as Mesh;
    const meshEntities = mesh.meshEntitiesInner;

    let renderedSomething = false;
    const isVrMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    const displayCount = WebGLStrategyCommonMethod.getDisplayCount(isVrMainPass, WebGLStrategyUniform.__webxrSystem);
    for (const entity of meshEntities) {
      if (entity.getSceneGraph()._isCulled) {
        continue;
      }
      const meshComponent = entity.getMesh();

      this.attachVertexDataInner(
        meshComponent.mesh!,
        primitive,
        primitiveUid,
        glw,
        CGAPIResourceRepository.InvalidCGAPIResourceUid
      );

      const shaderProgramUid = material.getShaderProgramUid(primitive);
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;

      let firstTimeForShaderProgram = true;
      let firstTimeForMaterial = true;
      if (shaderProgramUid !== this.__lastShader || (gl as any).__changedProgram) {
        if (isSkipDrawing(material, primitive)) {
          return false;
        }
        firstTimeForShaderProgram = true;
        firstTimeForMaterial = true;
        (gl as any).__changedProgram = false;

        gl.useProgram(shaderProgram);
        this.bindDataTexture(gl, shaderProgram);

        if (AnimationComponent.isAnimating) {
          const time = GlobalDataRepository.getInstance().getValue('time', 0) as Scalar;
          (shaderProgram as any)._gl.uniform1f((shaderProgram as any).time, time._v[0]);
        }

        this.__lastShader = shaderProgramUid;
      }

      if (this.__lastMaterial?.deref() !== material) {
        firstTimeForMaterial = true;
        this.__lastMaterial = new WeakRef(material);
      }

      for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
        if (isVrMainPass) {
          WebGLStrategyCommonMethod.setVRViewport(renderPass, displayIdx);
        }

        const renderingArg = {
          setUniform: true,
          glw: glw,
          entity,
          primitive: primitive,
          worldMatrix: entity.getSceneGraph().matrix,
          normalMatrix: entity.getSceneGraph().normalMatrix,
          isBillboard: entity.getSceneGraph().isBillboard,
          isVisible: entity.getSceneGraph().isVisible,
          lightComponents: this.__lightComponents!,
          renderPass: renderPass,
          diffuseCube: entity.tryToGetMeshRenderer()?.diffuseCubeMap,
          specularCube: entity.tryToGetMeshRenderer()?.specularCubeMap,
          sheenCube: entity.tryToGetMeshRenderer()?.sheenCubeMap,
          isVr: isVrMainPass,
          displayIdx,
        };

        if (firstTimeForShaderProgram) {
          material._setParametersToGpuWebGLPerShaderProgram({
            material,
            shaderProgram,
            firstTime: firstTimeForShaderProgram,
            args: renderingArg,
          });
        }

        if (firstTimeForMaterial) {
          WebGLStrategyCommonMethod.setWebGLParameters(material, gl);
          material._setParametersToGpuWebGL({
            material,
            shaderProgram,
            firstTime: firstTimeForMaterial,
            args: renderingArg,
          });
        }
        material._setParametersToGpuWebGLPerPrimitive({
          material: material,
          shaderProgram: shaderProgram,
          firstTime: firstTimeForMaterial,
          args: renderingArg,
        });

        if ((shaderProgram as any).vrState != null && isVrMainPass) {
          const vrState = GlobalDataRepository.getInstance().getValue('vrState', 0) as Vector2;
          vrState._v[0] = isVrMainPass ? 1 : 0;
          vrState._v[1] = displayIdx;
          (shaderProgram as any)._gl.uniform2iv((shaderProgram as any).vrState, vrState._v);
        }

        if (primitive.indicesAccessor) {
          gl.drawElements(
            primitive.primitiveMode.index,
            primitive.indicesAccessor.elementCount,
            primitive.indicesAccessor.componentType.index,
            0
          );
        } else {
          gl.drawArrays(primitive.primitiveMode.index, 0, primitive.getVertexCountAsVerticesBased());
        }
      }
      renderedSomething = true;
    }

    return renderedSomething;
  }

  /**
   * Binds the data texture containing vertex data to the shader program.
   * The data texture is used to store and access vertex data in uniform rendering strategy.
   *
   * @param gl - WebGL rendering context
   * @param shaderProgram - The shader program to bind the texture to
   */
  private bindDataTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    gl.uniform1i((shaderProgram as any).dataTexture, 7);
    this.__webglResourceRepository.bindTexture2D(7, this.__dataTextureUid);
    const samplerUid = this.__webglResourceRepository.createOrGetTextureSamplerRepeatNearest();
    this.__webglResourceRepository.bindTextureSampler(7, samplerUid);
  }

  // $render() {}
}

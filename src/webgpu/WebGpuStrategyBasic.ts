import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { MemoryManager } from '../foundation/core/MemoryManager';
import { BufferUse } from '../foundation/definitions/BufferUse';
import { Buffer } from '../foundation/memory/Buffer';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { isSkipDrawing, updateVBOAndVAO } from '../foundation/renderer/RenderingCommonMethods';
import {
  CGAPIResourceHandle,
  Count,
  Index,
  IndexOf16Bytes,
  IndexOf4Bytes,
  PrimitiveUID,
} from '../types/CommonTypes';
import { WebGpuResourceRepository } from './WebGpuResourceRepository';
import { Component } from '../foundation/core/Component';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { MaterialRepository } from '../foundation/materials/core/MaterialRepository';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { ComponentType } from '../foundation/definitions/ComponentType';
import {
  getShaderPropertyFunc,
  ShaderSemanticsName,
} from '../foundation/definitions/ShaderSemantics';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { ComponentRepository } from '../foundation/core/ComponentRepository';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { RnXR } from '../xr/main';
import { Config } from '../foundation/core/Config';
import { VertexAttribute } from '../foundation/definitions/VertexAttribute';
import { Accessor } from '../foundation/memory/Accessor';
import { BlendShapeComponent } from '../foundation/components/BlendShape/BlendShapeComponent';
import { CameraControllerComponent } from '../foundation/components/CameraController/CameraControllerComponent';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { Mesh } from '../foundation/geometry/Mesh';
import { AnimationComponent } from '../foundation/components/Animation/AnimationComponent';
import { Logger } from '../foundation/misc/Logger';

export class WebGpuStrategyBasic implements CGAPIStrategy {
  private static __instance: WebGpuStrategyBasic;
  private __storageBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __storageBlendShapeBufferUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __uniformMorphOffsetsTypedArray?: Uint32Array;
  private __uniformMorphWeightsTypedArray?: Float32Array;

  private __lastMaterialsUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastSceneGraphComponentsUpdateCount = -1;
  private __lastCameraControllerComponentsUpdateCount = -1;

  private __lastBlendShapeComponentsUpdateCountForWeights = -1;
  private __lastBlendShapeComponentsUpdateCountForBlendData = -1;

  private static __drawCount = 0;

  private constructor() {}

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebGpuStrategyBasic();
    }
    return this.__instance;
  }

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

#ifdef RN_IS_VERTEX_SHADER
  #ifdef RN_IS_MORPHING
  fn get_position(vertexId: u32, basePosition: vec3<f32>, blendShapeComponentSID: u32) -> vec3<f32> {
    var position = basePosition;
    let scalar_idx = 3u * vertexId;
    for (var i=0u; i<uniformDrawParameters.morphTargetNumber; i++) {
      let currentPrimitiveIdx = uniformDrawParameters.currentPrimitiveIdx;
      let idx = ${Config.maxVertexMorphNumberInShader}u * currentPrimitiveIdx + i;
      let offsets = uniformMorphOffsets.data[ idx / 4u];
      let offsetPosition = offsets[idx % 4u];

      let basePosIn4bytes = offsetPosition * 4u + scalar_idx;
      let addPos = fetchVec3No16BytesAlignedFromBlendShapeBuffer(basePosIn4bytes);

      let idx2 = ${Config.maxVertexMorphNumberInShader}u * blendShapeComponentSID + i;
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

  private static __getShaderProperty(
    materialTypeName: string,
    info: ShaderSemanticsInfo,
    isGlobalData: boolean
  ) {
    const returnType = info.compositionType.toWGSLType(info.componentType);
    const methodName = info.semantic.replace('.', '_');
    const isTexture = CompositionType.isTexture(info.compositionType);

    if (isTexture) {
      const isCubeMap = info.compositionType === CompositionType.TextureCube;
      const textureType = isCubeMap ? 'texture_cube<f32>' : 'texture_2d<f32>';
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

    let indexStr;
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
          str += `  let val = i32(col0.x);`;
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += '  let val = u32(col0.x);';
        } else if (info.componentType === ComponentType.Bool) {
          str += `  let val = col0.x >= 0.5;`;
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
  private static getOffsetOfPropertyInShader(
    isGlobalData: boolean,
    propertyName: ShaderSemanticsName,
    materialTypeName: string
  ) {
    if (isGlobalData) {
      const globalDataRepository = GlobalDataRepository.getInstance();
      const dataBeginPos = globalDataRepository.getLocationOffsetOfProperty(propertyName);
      return dataBeginPos;
    } else {
      const dataBeginPos = MaterialRepository.getLocationOffsetOfMemberOfMaterial(
        materialTypeName,
        propertyName
      );
      return dataBeginPos;
    }
  }

  $load(meshComponent: MeshComponent): boolean {
    const mesh = meshComponent.mesh;
    if (mesh == null) {
      return false;
    }

    // setup VBO and VAO
    if (!mesh.isSetUpDone()) {
      updateVBOAndVAO(mesh);
    }

    return true;
  }

  common_$load(): void {
    if (this.__uniformMorphOffsetsTypedArray == null) {
      this.__uniformMorphOffsetsTypedArray = new Uint32Array(
        Math.ceil(
          (Config.maxVertexPrimitiveNumberInShader * Config.maxVertexMorphNumberInShader) / 4
        ) * 4
      );
    }

    if (this.__uniformMorphWeightsTypedArray == null) {
      this.__uniformMorphWeightsTypedArray = new Float32Array(
        Math.ceil(
          (Config.maxVertexPrimitiveNumberInShader * Config.maxVertexMorphNumberInShader) / 4
        ) * 4
      );
    }

    if (
      BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForBlendData
    ) {
      this.__createOrUpdateStorageBlendShapeBuffer();
      this.__lastBlendShapeComponentsUpdateCountForBlendData = BlendShapeComponent.updateCount;
    }
  }

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
   * setup shader program for the material in this WebGL strategy
   * @param material - a material to setup shader program
   */
  public setupShaderForMaterial(
    material: Material,
    primitive: Primitive,
    vertexShaderMethodDefinitions: string,
    propertySetter: getShaderPropertyFunc
  ): void {
    material._createProgramWebGpu(primitive, vertexShaderMethodDefinitions, propertySetter);
  }

  renderWithRenderBundle(renderPass: RenderPass): boolean {
    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    return webGpuResourceRepository.executeRenderBundle(renderPass);
  }

  prerender(): void {
    if (
      AnimationComponent.isAnimating ||
      TransformComponent.updateCount !== this.__lastTransformComponentsUpdateCount ||
      SceneGraphComponent.updateCount !== this.__lastSceneGraphComponentsUpdateCount ||
      CameraControllerComponent.updateCount !== this.__lastCameraControllerComponentsUpdateCount ||
      Material.stateVersion !== this.__lastMaterialsUpdateCount
    ) {
      this.__createAndUpdateStorageBuffer();
      this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
      this.__lastSceneGraphComponentsUpdateCount = SceneGraphComponent.updateCount;
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
      this.__lastMaterialsUpdateCount = Material.stateVersion;
    }

    if (BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForWeights) {
      this.__updateUniformMorph();
      this.__lastBlendShapeComponentsUpdateCountForWeights = BlendShapeComponent.updateCount;
    }
  }
  common_$render(
    primitiveUids: PrimitiveUID[],
    renderPass: RenderPass,
    renderPassTickCount: number
  ): boolean {
    WebGpuStrategyBasic.__drawCount = 0;

    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(renderPass);
      return true;
    }

    let renderedSomething = false;
    // For opaque primitives
    if (renderPass._toRenderOpaquePrimitives) {
      for (let i = 0; i <= renderPass._lastOpaqueIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, true);
        renderedSomething ||= rendered;
      }
    }

    // For translucent primitives
    if (renderPass._toRenderTransparentPrimitives) {
      for (let i = renderPass._lastOpaqueIndex + 1; i <= renderPass._lastTranslucentIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, true);
        renderedSomething ||= rendered;
      }

      for (let i = renderPass._lastTranslucentIndex + 1; i <= renderPass._lastBlendIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, false);
        renderedSomething ||= rendered;
      }
      // gl.depthMask(true);
    }

    return renderedSomething;
  }

  private __renderWithoutBuffers(renderPass: RenderPass) {
    const material = renderPass.material!;
    const primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    this._setupShaderProgram(material, primitive);

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    webGpuResourceRepository.updateUniformDrawParametersBuffer(
      WebGpuStrategyBasic.__drawCount,
      material.materialSID,
      0,
      0,
      0
    );
    webGpuResourceRepository.draw(
      primitive,
      material,
      renderPass,
      0,
      true,
      WebGpuStrategyBasic.__drawCount
    );
    WebGpuStrategyBasic.__drawCount++;
  }

  renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, isOpaque: boolean) {
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
    webGpuResourceRepository.updateUniformDrawParametersBuffer(
      WebGpuStrategyBasic.__drawCount,
      material.materialSID,
      cameraSID,
      primitiveIdxHasMorph,
      primitive.targets.length
    );
    webGpuResourceRepository.draw(
      primitive,
      material,
      renderPass,
      cameraSID,
      isOpaque,
      WebGpuStrategyBasic.__drawCount
    );
    WebGpuStrategyBasic.__drawCount++;
    return true;
  }

  private __createAndUpdateStorageBuffer() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();

    // the GPU global Storage
    const gpuInstanceDataBuffer: Buffer | undefined = memoryManager.getBuffer(
      BufferUse.GPUInstanceData
    );

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    // const dataTextureByteSize =
    //   MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength * 4 * 4;
    const float32Array = new Float32Array(gpuInstanceDataBuffer!.getArrayBuffer());
    if (this.__storageBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      // Update
      const dataSizeForDataTexture = gpuInstanceDataBuffer!.takenSizeInByte / 4;
      webGpuResourceRepository.updateStorageBuffer(
        this.__storageBufferUid,
        float32Array,
        dataSizeForDataTexture
      );
    } else {
      // Create
      this.__storageBufferUid = webGpuResourceRepository.createStorageBuffer(float32Array);
    }
  }

  private __createOrUpdateStorageBlendShapeBuffer() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();

    // the GPU global Storage
    const blendShapeDataBuffer: Buffer | undefined = memoryManager.getBuffer(
      BufferUse.GPUVertexData
    );

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
      this.__storageBlendShapeBufferUid =
        webGpuResourceRepository.createStorageBlendShapeBuffer(float32Array);
    }

    let i = 0;
    for (; i < Config.maxVertexPrimitiveNumberInShader; i++) {
      const primitive = Primitive.getPrimitiveHasMorph(i);
      if (primitive != null) {
        for (let j = 0; j < primitive.targets.length; j++) {
          const target = primitive.targets[j];
          const accessor = target.get(VertexAttribute.Position.XYZ) as Accessor;
          this.__uniformMorphOffsetsTypedArray![Config.maxVertexMorphNumberInShader * i + j] =
            accessor.byteOffsetInBuffer / 4 / 4;
        }
      } else {
        break;
      }
    }
    const elementNumToCopy = Config.maxVertexMorphNumberInShader * i;
    webGpuResourceRepository.updateUniformMorphOffsetsBuffer(
      this.__uniformMorphOffsetsTypedArray!,
      elementNumToCopy
    );
  }

  private __updateUniformMorph() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const blendShapeDataBuffer: Buffer | undefined = memoryManager.getBuffer(
      BufferUse.GPUVertexData
    );
    if (blendShapeDataBuffer == null) {
      return;
    }

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();

    const blendShapeComponents = ComponentRepository.getComponentsWithType(BlendShapeComponent);
    for (let i = 0; i < blendShapeComponents.length; i++) {
      const blendShapeComponent = blendShapeComponents[i] as BlendShapeComponent;
      const weights = blendShapeComponent!.weights;
      for (let j = 0; j < weights.length; j++) {
        this.__uniformMorphWeightsTypedArray![
          Config.maxVertexMorphNumberInShader * blendShapeComponent.componentSID + j
        ] = weights[j];
      }
    }
    if (blendShapeComponents.length > 0) {
      const elementNumToCopy = Config.maxVertexMorphNumberInShader * blendShapeComponents.length;
      webGpuResourceRepository.updateUniformMorphWeightsBuffer(
        this.__uniformMorphWeightsTypedArray!,
        elementNumToCopy
      );
    }
  }

  private __getAppropriateCameraComponentSID(
    renderPass: RenderPass,
    displayIdx: 0 | 1,
    isVRMainPass: boolean
  ): number {
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
    } else {
      // Non-VR Rendering
      let cameraComponent = renderPass.cameraComponent;
      if (cameraComponent == null) {
        // if the renderPass has no cameraComponent, try to get the current cameraComponent
        cameraComponent = ComponentRepository.getComponent(
          CameraComponent,
          CameraComponent.current
        ) as CameraComponent;
      }
      if (cameraComponent) {
        return cameraComponent.componentSID;
      } else {
        return -1;
      }
    }
  }
}

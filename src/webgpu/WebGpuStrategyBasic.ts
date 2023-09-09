import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { MemoryManager } from '../foundation/core/MemoryManager';
import { BufferUse } from '../foundation/definitions/BufferUse';
import { Buffer } from '../foundation/memory/Buffer';
import { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { Is } from '../foundation/misc/Is';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { RenderPass } from '../foundation/renderer/RenderPass';
import {
  isMaterialsSetup,
  isSkipDrawing,
  updateVBOAndVAO,
} from '../foundation/renderer/RenderingCommonMethods';
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
import { ShaderSemantics, getShaderPropertyFunc } from '../foundation/definitions/ShaderSemantics';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { WellKnownComponentTIDs } from '../foundation/components/WellKnownComponentTIDs';
import { ComponentRepository } from '../foundation/core/ComponentRepository';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { VectorN } from '../foundation/math/VectorN';
import { RnXR } from '../xr/main';

export class WebGpuStrategyBasic implements CGAPIStrategy {
  private __latestPrimitivePositionAccessorVersions: number[] = [];
  private static __instance: WebGpuStrategyBasic;
  private static __currentComponentSIDs?: VectorN;
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private __storageBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
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
`;
  }

  private static __getShaderProperty(
    materialTypeName: string,
    info: ShaderSemanticsInfo,
    propertyIndex: Index,
    isGlobalData: boolean
  ) {
    const returnType = info.compositionType.toWGSLType(info.componentType);
    const methodName = info.semantic.str.replace('.', '_');
    const isTexture = CompositionType.isTexture(info.compositionType);
    if (isTexture) {
      return '';
    }

    // inner contents of 'get_' shader function
    const vec4SizeOfProperty: IndexOf16Bytes = info.compositionType.getVec4SizeOfProperty();
    // for non-`index` property (this is general case)
    const scalarSizeOfProperty: IndexOf4Bytes = info.compositionType.getNumberOfComponents();
    const offsetOfProperty: IndexOf16Bytes = WebGpuStrategyBasic.getOffsetOfPropertyInShader(
      isGlobalData,
      propertyIndex,
      materialTypeName
    );

    if (offsetOfProperty === -1) {
      console.error('Could not get the location offset of the property.');
    }

    let indexStr;
    const instanceSize = vec4SizeOfProperty * (info.arrayLength ?? 1);
    indexStr = `  let vec4_idx: u32 = ${offsetOfProperty}u + ${instanceSize}u * instanceId;\n`;
    if (CompositionType.isArray(info.compositionType)) {
      const instanceSizeInScalar = scalarSizeOfProperty * (info.arrayLength ?? 1);
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
        } else if (info.componentType === ComponentType.Bool) {
          str += `  let val = bool(col0.x);`;
        } else {
          str += '  let val = col0.x;';
        }
        break;
      case CompositionType.ScalarArray:
        str += '  let col0 = fetchScalarNo16BytesAligned(scalar_idx);\n';
        if (info.componentType === ComponentType.Int) {
          str += '  let val = i32(col0);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '  let val = bool(col0);';
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
        // console.error('unknown composition type', info.compositionType.str, memberName);
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
    propertyIndex: number,
    materialTypeName: string
  ) {
    if (isGlobalData) {
      const globalDataRepository = GlobalDataRepository.getInstance();
      const dataBeginPos = globalDataRepository.getLocationOffsetOfProperty(propertyIndex);
      return dataBeginPos;
    } else {
      const dataBeginPos = MaterialRepository.getLocationOffsetOfMemberOfMaterial(
        materialTypeName,
        propertyIndex
      );
      return dataBeginPos;
    }
  }

  $load(meshComponent: MeshComponent): void {
    const mesh = meshComponent.mesh as Mesh;
    if (!Is.exist(mesh)) {
      return;
    }

    WebGpuStrategyBasic.__currentComponentSIDs =
      WebGpuStrategyBasic.__globalDataRepository.getValue(ShaderSemantics.CurrentComponentSIDs, 0);

    // setup shader program
    if (!isMaterialsSetup(meshComponent)) {
      this.__setupShaderProgramForMeshComponent(meshComponent);
    }

    // setup VBO and VAO
    if (!this.__isMeshSetup(mesh)) {
      updateVBOAndVAO(mesh);

      const primitiveNum = mesh.getPrimitiveNumber();
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = mesh.getPrimitiveAt(i);
        this.__latestPrimitivePositionAccessorVersions[primitive.primitiveUid] =
          primitive.positionAccessorVersion!;
      }
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
      if (material == null || material.isEmptyMaterial()) {
        continue;
      }

      if (material.isShaderProgramReady()) {
        continue;
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
        console.log(e);
        primitive._restoreMaterial();
        this.setupShaderForMaterial(
          primitive._prevMaterial,
          primitive,
          WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(),
          WebGpuStrategyBasic.__getShaderProperty
        );
      }
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

  private __isMeshSetup(mesh: Mesh) {
    if (mesh._variationVBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return false;
    }

    const primitiveNum = mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = mesh.getPrimitiveAt(i);
      if (
        Is.not.exist(primitive.vertexHandles) ||
        primitive.positionAccessorVersion !==
          this.__latestPrimitivePositionAccessorVersions[primitive.primitiveUid]
      ) {
        return false;
      }
    }

    return true;
  }

  $prerender(
    meshComponent: MeshComponent,
    meshRendererComponent: MeshRendererComponent,
    instanceIDBufferUid: number
  ): void {
    // throw new Error('Method not implemented.');
  }
  common_$prerender(): void {
    this.__createAndUpdateStorageBuffer();
  }
  common_$render(
    primitiveUids: Int32Array,
    renderPass: RenderPass,
    renderPassTickCount: number
  ): boolean {
    this.__setCurrentComponentSIDsForEachRenderPass(renderPass, 0, false);

    for (let j = 0; j < renderPass.drawCount; j++) {
      renderPass.doPreEachDraw(j);

      // For opaque primitives
      if (renderPass.toRenderOpaquePrimitives) {
        for (let i = 0; i <= MeshRendererComponent._lastOpaqueIndex; i++) {
          const primitiveUid = primitiveUids[i];
          this.renderInner(primitiveUid, renderPass, renderPassTickCount);
        }
      }

      // For translucent primitives
      if (renderPass.toRenderTransparentPrimitives) {
        if (!MeshRendererComponent.isDepthMaskTrueForTransparencies) {
          // disable depth write for transparent primitives
          // gl.depthMask(false);
        }

        for (
          let i = MeshRendererComponent._lastOpaqueIndex + 1;
          i <= MeshRendererComponent._lastTransparentIndex;
          i++
        ) {
          const primitiveUid = primitiveUids[i];
          this.renderInner(primitiveUid, renderPass, renderPassTickCount);
        }
        // gl.depthMask(true);
      }
    }

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    webGpuResourceRepository.flush();

    return true;
  }

  renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, renderPassTickCount: Count) {
    const primitive = Primitive.getPrimitive(primitiveUid);
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    if (isSkipDrawing(material)) {
      return false;
    }

    this.__setCurrentComponentSIDsForEachPrimitive(material);

    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    webGpuResourceRepository.draw(primitive, material, renderPass);

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
      const bufferSizeForDataTextureInByte = gpuInstanceDataBuffer!.takenSizeInByte;
      webGpuResourceRepository.updateStorageBuffer(
        this.__storageBufferUid,
        float32Array,
        bufferSizeForDataTextureInByte
      );
    } else {
      this.__storageBufferUid = webGpuResourceRepository.createStorageBuffer(float32Array);
    }
  }

  private __setCurrentComponentSIDsForEachRenderPass(
    renderPass: RenderPass,
    displayIdx: 0 | 1,
    isVRMainPass: boolean
  ) {
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
      WebGpuStrategyBasic.__currentComponentSIDs!._v[WellKnownComponentTIDs.CameraComponentTID] =
        cameraComponentSid;
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
        WebGpuStrategyBasic.__currentComponentSIDs!._v[WellKnownComponentTIDs.CameraComponentTID] =
          cameraComponent.componentSID;
      } else {
        WebGpuStrategyBasic.__currentComponentSIDs!._v[WellKnownComponentTIDs.CameraComponentTID] =
          -1;
      }
    }
  }

  private __setCurrentComponentSIDsForEachPrimitive(material: Material) {
    WebGpuStrategyBasic.__currentComponentSIDs!._v[0] = material.materialSID;
  }
}

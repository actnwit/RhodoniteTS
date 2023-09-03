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
import { CGAPIResourceHandle, Count, Index, PrimitiveUID } from '../types/CommonTypes';
import { WebGpuResourceRepository } from './WebGpuResourceRepository';
import { Component } from '../foundation/core/Component';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';

export class WebGpuStrategyBasic implements CGAPIStrategy {
  private __latestPrimitivePositionAccessorVersions: number[] = [];
  private static __instance: WebGpuStrategyBasic;
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

  fn get_worldMatrix(instanceId: f32) -> mat4x4<f32>
  {
    let index: i32 = ${Component.getLocationOffsetOfMemberOfComponent(
      SceneGraphComponent,
      'worldMatrix'
    )} * 4 + 16 * i32(instanceId);
    let matrix = fetchMat4(index);

    return matrix;
  }
`;
  }

  $load(meshComponent: MeshComponent): void {
    const mesh = meshComponent.mesh as Mesh;
    if (!Is.exist(mesh)) {
      return;
    }

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
          WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer()
        );
        primitive._backupMaterial();
      } catch (e) {
        console.log(e);
        primitive._restoreMaterial();
        this.setupShaderForMaterial(
          primitive._prevMaterial,
          primitive,
          WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer()
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
    vertexShaderMethodDefinitions: string
  ): void {
    material._createProgramWebGpu(primitive, vertexShaderMethodDefinitions);
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

    return true;
  }

  renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, renderPassTickCount: Count) {
    const primitive = Primitive.getPrimitive(primitiveUid);
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    if (isSkipDrawing(material)) {
      return false;
    }

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
}

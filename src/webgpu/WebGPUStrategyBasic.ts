import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { Mesh } from '../foundation/geometry/Mesh';
import { Is } from '../foundation/misc/Is';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { Count, PrimitiveUID } from '../types/CommonTypes';

export class WebGPUStrategyBasic implements CGAPIStrategy {
  private __latestPrimitivePositionAccessorVersions: number[] = [];

  $load(meshComponent: MeshComponent): void {
    const mesh = meshComponent.mesh as Mesh;
    if (!Is.exist(mesh)) {
      return;
    }

    // setup shader program
    // if (!WebGLStrategyCommonMethod.isMaterialsSetup(meshComponent)) {
    //   setupShaderProgramForMeshComponent(this, meshComponent);
    // }

    // setup VBO and VAO
    if (!this.__isMeshSetup(mesh)) {
      // WebGLStrategyCommonMethod.updateVBOAndVAO(mesh);

      const primitiveNum = mesh.getPrimitiveNumber();
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = mesh.getPrimitiveAt(i);
        this.__latestPrimitivePositionAccessorVersions[primitive.primitiveUid] =
          primitive.positionAccessorVersion!;
      }
    }
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
    throw new Error('Method not implemented.');
  }
  common_$prerender(): void {
    throw new Error('Method not implemented.');
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

  renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, renderPassTickCount: Count) {}
}

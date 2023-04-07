import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { RenderPass } from '../foundation/renderer/RenderPass';

export class WebGPUStrategyBasic implements CGAPIStrategy {
  $load(meshComponent: MeshComponent): void {
    throw new Error('Method not implemented.');
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
    throw new Error('Method not implemented.');
  }
}

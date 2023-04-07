import { CGAPIResourceHandle, Count, Index } from '../../types/CommonTypes';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { RenderPass } from './RenderPass';

export interface CGAPIStrategy {
  $load(meshComponent: MeshComponent): void;
  $prerender(
    meshComponent: MeshComponent,
    meshRendererComponent: MeshRendererComponent,
    instanceIDBufferUid: CGAPIResourceHandle
  ): void;
  common_$prerender(): void;
  common_$render(
    primitiveUids: Int32Array,
    renderPass: RenderPass,
    renderPassTickCount: Count
  ): boolean;
}

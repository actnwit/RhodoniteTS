import { CGAPIResourceHandle, Count, Index, PrimitiveUID } from '../../types/CommonTypes';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { RenderPass } from './RenderPass';

export interface CGAPIStrategy {
  $load(meshComponent: MeshComponent): boolean;
  common_$prerender(): void;
  common_$render(
    primitiveUids: PrimitiveUID[],
    renderPass: RenderPass,
    renderPassTickCount: Count
  ): boolean;
}

import { Count, PrimitiveUID } from '../../types/CommonTypes';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { RenderPass } from './RenderPass';
export interface CGAPIStrategy {
    $load(meshComponent: MeshComponent): boolean;
    prerender(): void;
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count): boolean;
}

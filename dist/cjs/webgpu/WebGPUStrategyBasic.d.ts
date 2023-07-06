import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { Count, PrimitiveUID } from '../types/CommonTypes';
export declare class WebGPUStrategyBasic implements CGAPIStrategy {
    private __latestPrimitivePositionAccessorVersions;
    $load(meshComponent: MeshComponent): void;
    private __isMeshSetup;
    $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: number): void;
    common_$prerender(): void;
    common_$render(primitiveUids: Int32Array, renderPass: RenderPass, renderPassTickCount: number): boolean;
    renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, renderPassTickCount: Count): void;
}

import type { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import type { CGAPIResourceHandle, Count, Index, PrimitiveUID, WebGLResourceHandle } from '../types/CommonTypes';
import type { WebGLContextWrapper } from './WebGLContextWrapper';

export type ShaderSources = {
  vertex: string;
  pixel: string;
};

export interface WebGLStrategy {
  common_$load(): void;
  prerender(): void;
  $load(meshComponent: MeshComponent): boolean;
  common_$render(
    primitiveUids: PrimitiveUID[],
    renderPass: RenderPass,
    renderPassTickCount: Count,
    displayIdx: Index
  ): boolean;
  attachGPUData(primitive: Primitive): void;
  attachVertexData(
    i: number,
    primitive: Primitive,
    glw: WebGLContextWrapper,
    instanceIDBufferUid: WebGLResourceHandle
  ): void;
  setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle;
  _reSetupShaderForMaterialBySpector(
    material: Material,
    primitive: Primitive,
    updatedShaderSources: ShaderSources,
    onError: (message: string) => void
  ): CGAPIResourceHandle;
}

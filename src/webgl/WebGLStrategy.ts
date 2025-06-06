import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import { type CGAPIResourceHandle, Count, Index, type WebGLResourceHandle } from '../types/CommonTypes';
import type { WebGLContextWrapper } from './WebGLContextWrapper';

export type ShaderSources = {
  vertex: string;
  pixel: string;
};

export interface WebGLStrategy {
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

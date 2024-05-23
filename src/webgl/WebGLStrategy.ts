import { WebGLContextWrapper } from './WebGLContextWrapper';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { WebGLResourceHandle, Index, Count, CGAPIResourceHandle } from '../types/CommonTypes';

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
    updatedShaderSources: ShaderSources,
    onError: (message: string) => void
  ): CGAPIResourceHandle;
}

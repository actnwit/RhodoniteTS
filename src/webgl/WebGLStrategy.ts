import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { Primitive } from '../foundation/geometry/Primitive';
import { Matrix44 } from '../foundation/math/Matrix44';
import { Matrix33 } from '../foundation/math/Matrix33';
import { CubeTexture } from '../foundation/textures/CubeTexture';
import { Material } from '../foundation/materials/core/Material';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { WebGLResourceHandle, Index, Count, CGAPIResourceHandle } from '../types/CommonTypes';
import { IMeshEntity } from '../foundation/helpers/EntityHelper';

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
  //setupShaderProgram(meshComponent: MeshComponent): void;
  attachShaderProgram(material: Material): void;
  setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle;
  _reSetupShaderForMaterialBySpector(
    material: Material,
    updatedShaderSources: ShaderSources,
    onError: (message: string) => void
  ): CGAPIResourceHandle;
}

import { WebGLContextWrapper } from './WebGLContextWrapper';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { WebGLResourceHandle, CGAPIResourceHandle } from '../types/CommonTypes';
export declare type ShaderSources = {
    vertex: string;
    pixel: string;
};
export interface WebGLStrategy {
    attachGPUData(primitive: Primitive): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    attachShaderProgram(material: Material): void;
    setupShaderForMaterial(material: Material): CGAPIResourceHandle;
    _reSetupShaderForMaterialBySpector(material: Material, updatedShaderSources: ShaderSources, onError: (message: string) => void): CGAPIResourceHandle;
}

import { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
export declare abstract class CGAPIResourceRepository {
    static readonly InvalidCGAPIResourceUid = -1;
    static getWebGLResourceRepository(): WebGLResourceRepository;
}

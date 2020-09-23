import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
export default abstract class CGAPIResourceRepository {
    static readonly InvalidCGAPIResourceUid = -1;
    static getWebGLResourceRepository(): WebGLResourceRepository;
}

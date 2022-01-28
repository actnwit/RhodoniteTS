import ModuleManager from '../system/ModuleManager';
import WebGLResourceRepository from '../../webgl/WebGLResourceRepository';

export default abstract class CGAPIResourceRepository {
  static readonly InvalidCGAPIResourceUid = -1;

  static getWebGLResourceRepository(): WebGLResourceRepository {
    const moduleName = 'webgl';
    const moduleManager = ModuleManager.getInstance();
    const webglModule = moduleManager.getModule(moduleName)! as any;
    const webGLResourceRepository: WebGLResourceRepository =
      webglModule.WebGLResourceRepository.getInstance();
    return webGLResourceRepository;
  }
}

import { ModuleManager } from '../system/ModuleManager';
import { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import { Index, Size, TypedArray, WebGLResourceHandle } from '../../types/CommonTypes';
import { PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { TextureParameterEnum } from '../definitions/TextureParameter';

export type DirectTextureData =
  | TypedArray
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | ImageBitmap;

export abstract class CGAPIResourceRepository {
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

export interface ICGAPIResourceRepository {
  /**
   * create a Texture
   * @param imageData
   * @param param1
   * @returns
   */
  createTexture(
    imageData: DirectTextureData,
    {
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      generateMipmap,
      anisotropy,
      isPremultipliedAlpha,
    }: {
      level: Index;
      internalFormat: TextureParameterEnum;
      width: Size;
      height: Size;
      border: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      magFilter: TextureParameterEnum;
      minFilter: TextureParameterEnum;
      wrapS: TextureParameterEnum;
      wrapT: TextureParameterEnum;
      generateMipmap: boolean;
      anisotropy: boolean;
      isPremultipliedAlpha: boolean;
    }
  ): WebGLResourceHandle;
}

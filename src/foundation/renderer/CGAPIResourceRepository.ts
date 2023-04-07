import { ModuleManager } from '../system/ModuleManager';
import type { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { Index, Size, TypedArray, WebGLResourceHandle } from '../../types/CommonTypes';
import type { PixelFormatEnum } from '../definitions/PixelFormat';
import type { ComponentTypeEnum } from '../definitions/ComponentType';
import type { TextureParameterEnum } from '../definitions/TextureParameter';

export type DirectTextureData =
  | TypedArray
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | ImageBitmap;

export type ImageBitmapData = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

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
  createTextureFromImageBitmapData(
    imageData: ImageBitmapData,
    {
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      generateMipmap,
    }: {
      level: Index;
      internalFormat: TextureParameterEnum;
      width: Size;
      height: Size;
      border: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      generateMipmap: boolean;
    }
  ): WebGLResourceHandle;
}

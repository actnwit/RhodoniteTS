import { ModuleManager } from '../system/ModuleManager';
import type { VertexHandles, WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type {
  CGAPIResourceHandle,
  Index,
  Size,
  TypedArray,
  WebGLResourceHandle,
  WebGPUResourceHandle,
} from '../../types/CommonTypes';
import type { PixelFormatEnum } from '../definitions/PixelFormat';
import type { ComponentTypeEnum } from '../definitions/ComponentType';
import type { TextureParameterEnum } from '../definitions/TextureParameter';
import { Accessor } from '../memory';
import { Primitive } from '../geometry/Primitive';

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
  ): CGAPIResourceHandle;

  /**
   * create a Vertex Buffer
   * @param accessor
   * @returns a CGAPIResourceHandle
   */
  createVertexBuffer(accessor: Accessor): CGAPIResourceHandle;

  /**
   * create a Index Buffer
   * @param accessor - an accessor
   * @returns a CGAPIResourceHandle
   */
  createIndexBuffer(accessor: Accessor): CGAPIResourceHandle;

  /**
   * create a Vertex Buffer and Index Buffer
   * @param primitive
   */
  createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;

  /**
   * update a Vertex Buffer
   */
  updateVertexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle): void;

  /**
   * update a Index Buffer
   */
  updateIndexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle): void;
}

import { ModuleManager } from '../system/ModuleManager';
import type { VertexHandles, WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { CGAPIResourceHandle, Index, Size, TypedArray } from '../../types/CommonTypes';
import type { PixelFormatEnum } from '../definitions/PixelFormat';
import type { ComponentTypeEnum } from '../definitions/ComponentType';
import type { TextureParameterEnum } from '../definitions/TextureParameter';
import type { Accessor } from '../memory/Accessor';
import type { Primitive } from '../geometry/Primitive';
import { SystemState } from '../system/SystemState';
import { ProcessApproach, ShaderSemanticsInfo, VertexAttributeEnum } from '../definitions';
import { Material } from '../materials/core/Material';
import { AttributeNames } from '../../webgl/types/CommonTypes';

export type DirectTextureData =
  | TypedArray
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | ImageBitmap;

export type ImageBitmapData = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

export abstract class CGAPIResourceRepository {
  static readonly InvalidCGAPIResourceUid = -1;

  static getCgApiResourceRepository(): ICGAPIResourceRepository {
    const moduleName = ProcessApproach.isWebGL2Approach(SystemState.currentProcessApproach)
      ? 'webgl'
      : 'webgpu';
    // const moduleName = 'webgl';
    const moduleManager = ModuleManager.getInstance();
    const webglModule = moduleManager.getModule(moduleName)! as any;

    if (moduleName === 'webgl') {
      const webGLResourceRepository: ICGAPIResourceRepository =
        webglModule.WebGLResourceRepository.getInstance();
      return webGLResourceRepository;
    } else {
      // WebGPU
      const webGLResourceRepository: ICGAPIResourceRepository =
        webglModule.WebGpuResourceRepository.getInstance();
      return webGLResourceRepository;
    }
  }

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
   * Get a Canvas Size
   */
  getCanvasSize(): [Size, Size];

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
   * create a Vertex Buffer
   * @param typedArray - a typed array
   * @returns a CGAPIResourceHandle
   */
  createVertexBufferFromTypedArray(typedArray: TypedArray): CGAPIResourceHandle;

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
  updateVertexBuffer(accessor: Accessor, resourceHandle: CGAPIResourceHandle): void;

  /**
   * update a Index Buffer
   */
  updateIndexBuffer(accessor: Accessor, resourceHandle: CGAPIResourceHandle): void;

  /**
   * update the VertexBuffer and IndexBuffer
   * @param primitive
   * @param vertexHandles
   */
  updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;

  /**
   * delete a Vertex Buffer
   * @param resourceHandle - a CGAPIResourceHandle
   */
  deleteVertexBuffer(resourceHandle: CGAPIResourceHandle): void;

  /**
   * set the VertexData to the Pipeline
   */
  setVertexDataToPipeline(
    {
      vaoHandle,
      iboHandle,
      vboHandles,
    }: {
      vaoHandle: CGAPIResourceHandle;
      iboHandle?: CGAPIResourceHandle;
      vboHandles: Array<CGAPIResourceHandle>;
    },
    primitive: Primitive,
    instanceIDBufferUid: CGAPIResourceHandle
  ): void;

  /**
   * Create a shader program
   * @return a shader program handle
   */
  createShaderProgram({
    material,
    vertexShaderStr,
    fragmentShaderStr,
    attributeNames,
    attributeSemantics,
    onError,
  }: {
    material: Material;
    vertexShaderStr: string;
    fragmentShaderStr: string;
    attributeNames: AttributeNames;
    attributeSemantics: VertexAttributeEnum[];
    onError?: (message: string) => void;
  }): CGAPIResourceHandle;
}

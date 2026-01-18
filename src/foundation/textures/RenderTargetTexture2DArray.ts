import type { Index, Size } from '../../types/CommonTypes';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { ComponentType, type ComponentTypeEnum } from '../definitions/ComponentType';
import { PixelFormat, type PixelFormatEnum } from '../definitions/PixelFormat';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { TextureFormat, type TextureFormatEnum } from '../definitions/TextureFormat';
import { Vector4 } from '../math/Vector4';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import { AbstractTexture } from './AbstractTexture';
import type { IRenderable } from './IRenderable';

/**
 * A 2D texture array that can be used as a render target.
 * This class extends AbstractTexture and implements IRenderable to provide
 * functionality for creating and managing 2D texture arrays that can be
 * rendered to in graphics pipelines.
 */
export class RenderTargetTexture2DArray extends AbstractTexture implements IRenderable {
  private __fbo?: FrameBuffer;
  private __arrayLength = 0;

  /**
   * Creates and initializes the 2D texture array with the specified parameters.
   * @param params - Configuration object for texture creation
   * @param params.width - Width of the texture in pixels
   * @param params.height - Height of the texture in pixels
   * @param params.level - Mipmap level (default: 0)
   * @param params.internalFormat - Internal format of the texture (default: RGB8)
   * @param params.format - Pixel format of the texture (default: RGBA)
   * @param params.type - Component type of the texture data (default: UnsignedByte)
   * @param params.arrayLength - Number of layers in the texture array
   */
  create({
    width,
    height,
    level = 0,
    internalFormat = TextureFormat.RGB8,
    format = PixelFormat.RGBA,
    type = ComponentType.UnsignedByte,
    arrayLength,
  }: {
    width: Size;
    height: Size;
    level: number;
    internalFormat: TextureFormatEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    arrayLength: number;
  }) {
    this.__width = width;
    this.__height = height;
    this.__level = level;
    this.__internalFormat = internalFormat;
    this.__format = format;
    this.__type = type;
    this.__arrayLength = arrayLength;

    this.__createRenderTargetTextureArray();
  }

  /**
   * Sets the framebuffer object associated with this render target.
   * @param fbo - The framebuffer object to associate with this texture
   */
  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  /**
   * Gets the framebuffer object associated with this render target.
   * @returns The associated framebuffer object, or undefined if not set
   */
  get fbo() {
    return this.__fbo;
  }

  /**
   * Gets the number of layers in the texture array.
   * @returns The array length (number of layers)
   */
  get arrayLength() {
    return this.__arrayLength;
  }

  /**
   * Creates the underlying graphics API resources for the render target texture array.
   * This method handles both WebGL and WebGPU resource creation.
   * @private
   */
  private __createRenderTargetTextureArray() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    const texture = cgApiResourceRepository.createRenderTargetTextureArray({
      width: this.__width,
      height: this.__height,
      level: this.__level,
      internalFormat: this.__internalFormat,
      format: this.__format,
      type: this.__type,
      arrayLength: this.__arrayLength,
    });
    this._textureResourceUid = texture;

    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureView2dArray(
        this._textureResourceUid,
        this.__arrayLength
      );
      this._textureViewAsRenderTargetResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2dArrayAsRenderTarget(this._textureResourceUid, 0, 0);
    }
  }

  /**
   * Changes the render target layer for WebGPU rendering.
   * This method creates a new texture view targeting a specific layer of the array.
   * @param layerIndex - The index of the layer to target for rendering
   */
  public changeRenderTargetLayerWebGPU(layerIndex: Index) {
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
      this._textureViewAsRenderTargetResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureView2dArrayAsRenderTarget(this._textureResourceUid, layerIndex, 0);
    }
  }

  /**
   * Resizes the texture array to new dimensions.
   * This destroys the existing resources and recreates them with the new size.
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.__width = width;
    this.__height = height;
    this.__createRenderTargetTextureArray();
  }

  /**
   * Destroys all graphics API resources associated with this texture.
   * This should be called when the texture is no longer needed to free GPU memory.
   * @returns True if resources were successfully destroyed
   */
  destroy3DAPIResources() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.deleteTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;

    return true;
  }

  /**
   * Retrieves the pixel data from the texture as a byte array.
   * This is an asynchronous operation that reads back data from the GPU.
   * @returns Promise that resolves to a Uint8Array containing the pixel data
   */
  async getTexturePixelData() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    const data = cgApiResourceRepository.getTexturePixelData(
      this._textureResourceUid,
      this.__width,
      this.__height,
      this.__fbo!.framebufferUID,
      this.__fbo!.whichColorAttachment(this)
    );

    return data;
  }

  /**
   * Downloads the texture pixel data as a PNG image file.
   * This method creates a canvas, draws the texture data to it, and triggers
   * a download of the resulting image.
   */
  async downloadTexturePixelData() {
    const data = await this.getTexturePixelData();
    const canvas = document.createElement('canvas');
    canvas.width = this.__width;
    canvas.height = this.__height;
    const ctx = canvas.getContext('2d')!;
    if (!(data.buffer instanceof ArrayBuffer)) {
      throw new Error('SharedArrayBuffer is not supported when downloading texture pixel data.');
    }
    const pixelData = new Uint8ClampedArray(
      data.buffer as ArrayBuffer,
      data.byteOffset,
      data.byteLength / Uint8ClampedArray.BYTES_PER_ELEMENT
    );
    const imageData = new ImageData(pixelData as Uint8ClampedArray<ArrayBuffer>, this.__width, this.__height);
    ctx.putImageData(imageData, this.__width, this.__height);
    const dataUri = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    const e = document.createEvent('MouseEvent');
    a.href = dataUri;
    a.download = 'texture.png';
    e.initEvent('click', true, true); //, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e);
  }

  /**
   * Gets the pixel value at a specific coordinate in the texture.
   * The coordinate system has its origin at the bottom-left corner.
   * @param x - Horizontal pixel position (0 is left)
   * @param y - Vertical pixel position (0 is bottom)
   * @param argByteArray - Optional pre-fetched pixel data array. If not provided, data will be fetched from GPU
   * @returns Promise that resolves to a Vector4 containing the RGBA pixel values
   */
  async getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Promise<Vector4> {
    let byteArray = argByteArray;
    if (!byteArray) {
      byteArray = await this.getTexturePixelData();
    }

    const color = Vector4.fromCopyArray([
      byteArray[(y * this.width + x) * 4 + 0],
      byteArray[(y * this.width + x) * 4 + 1],
      byteArray[(y * this.width + x) * 4 + 2],
      byteArray[(y * this.width + x) * 4 + 3],
    ]);
    return color;
  }

  /**
   * Generates mipmaps for the texture.
   * This creates lower resolution versions of the texture for improved rendering performance
   * and quality when the texture is viewed at different distances.
   */
  generateMipmaps() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.generateMipmaps2d(this._textureResourceUid, this.width, this.height);
  }

  /**
   * Blits (copies) data from this texture array to a 2D texture.
   * This operation copies the first layer of the array to the target texture.
   * @param targetTexture2D - The target 2D texture to copy data to
   */
  blitToTexture2dFromTexture2dArray(targetTexture2D: RenderTargetTexture2DArray) {
    if (this.__arrayLength === 0) {
      return;
    }
    const webglResourceRepository = this.__engine.webglResourceRepository;
    webglResourceRepository.blitToTexture2dFromTexture2dArray(
      this._textureResourceUid,
      targetTexture2D.__fbo!.cgApiResourceUid,
      targetTexture2D.width,
      targetTexture2D.height
    );
  }

  /**
   * Performs a fake blit operation from this texture array to a 2D texture.
   * This is likely a fallback or alternative implementation for specific use cases.
   * @param targetTexture2D - The target 2D texture to copy data to
   */
  blitToTexture2dFromTexture2dArrayFake(targetTexture2D: RenderTargetTexture2DArray) {
    if (this.__arrayLength === 0) {
      return;
    }
    const webglResourceRepository = this.__engine.webglResourceRepository;
    webglResourceRepository.blitToTexture2dFromTexture2dArrayFake(
      this._textureResourceUid,
      targetTexture2D.__fbo!.cgApiResourceUid,
      targetTexture2D.width,
      targetTexture2D.height
    );
  }

  /**
   * Alternative blit implementation from texture array to 2D texture.
   * This version uses a different approach and scales the target to half width.
   * @param targetTexture2D - The target 2D texture to copy data to
   */
  blitToTexture2dFromTexture2dArray2(targetTexture2D: RenderTargetTexture2DArray) {
    if (this.__arrayLength === 0) {
      return;
    }
    const webglResourceRepository = this.__engine.webglResourceRepository;
    webglResourceRepository.blitToTexture2dFromTexture2dArray2(
      this._textureResourceUid,
      targetTexture2D._textureResourceUid,
      targetTexture2D.width / 2,
      targetTexture2D.height
    );
  }

  /**
   * Creates a cube texture view as a render target for a specific face and mip level.
   * Currently this method is not implemented (empty body).
   * @param faceIdx - The index of the cube face to target
   * @param mipLevel - The mipmap level to target
   */
  createCubeTextureViewAsRenderTarget(_faceIdx: Index, _mipLevel: Index): void {}
}

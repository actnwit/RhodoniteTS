import type { Index, Size } from '../../types/CommonTypes';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { TextureFormat, type TextureFormatEnum } from '../definitions/TextureFormat';
import { Vector4 } from '../math/Vector4';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import type { FrameBuffer } from '../renderer/FrameBuffer';
import { EngineState } from '../system/EngineState';
import { AbstractTexture } from './AbstractTexture';
import type { IRenderable } from './IRenderable';

/**
 * A texture that can be used as a render target for off-screen rendering.
 * This class extends AbstractTexture and implements IRenderable to provide
 * functionality for rendering to texture, which is commonly used for
 * post-processing effects, shadow mapping, and other advanced rendering techniques.
 */
export class RenderTargetTexture extends AbstractTexture implements IRenderable {
  private __fbo?: FrameBuffer;

  /**
   * Creates and initializes the render target texture with the specified parameters.
   *
   * @param params - Configuration object for the render target texture
   * @param params.width - Width of the texture in pixels
   * @param params.height - Height of the texture in pixels
   * @param params.mipLevelCount - Number of mip levels to generate (optional, defaults to full mip chain)
   * @param params.format - Internal format of the texture
   */
  create({
    width,
    height,
    mipLevelCount,
    format: internalFormat,
  }: {
    width: Size;
    height: Size;
    mipLevelCount?: number;
    format: TextureFormatEnum;
  }) {
    this.__width = width;
    this.__height = height;
    this.__mipLevelCount = mipLevelCount ?? Math.floor(Math.log2(Math.max(width, height))) + 1;

    const { format, type } = TextureFormat.getPixelFormatAndComponentTypeFromTextureFormat(internalFormat);

    this.__internalFormat = internalFormat;
    this.__format = format;
    this.__type = type;

    this.__createRenderTargetTexture();
  }

  /**
   * Sets the framebuffer object associated with this render target texture.
   *
   * @param fbo - The FrameBuffer object to associate with this texture
   */
  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  /**
   * Gets the framebuffer object associated with this render target texture.
   *
   * @returns The associated FrameBuffer object, or undefined if not set
   */
  get fbo() {
    return this.__fbo;
  }

  /**
   * Creates the underlying 3D API resources for the render target texture.
   * This method handles both WebGL and WebGPU resource creation.
   *
   * @private
   */
  private __createRenderTargetTexture() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    const texture = cgApiResourceRepository.createRenderTargetTexture({
      width: this.__width,
      height: this.__height,
      mipLevelCount: this.__mipLevelCount,
      format: this.__internalFormat,
    });
    this._textureResourceUid = texture;

    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureView2d(
        this._textureResourceUid
      );
      this._textureViewAsRenderTargetResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureViewAsRenderTarget(this._textureResourceUid);
    }
  }

  /**
   * Resizes the render target texture to the specified dimensions.
   * This operation destroys the existing resources and creates new ones.
   *
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.__width = width;
    this.__height = height;
    this.__createRenderTargetTexture();
  }

  /**
   * Destroys all 3D API resources associated with this render target texture.
   * This method should be called when the texture is no longer needed to free GPU memory.
   *
   * @returns True if the resources were successfully destroyed
   */
  destroy3DAPIResources() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.deleteTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;

    return true;
  }

  /**
   * Retrieves the pixel data from the render target texture.
   * This operation reads back the texture data from GPU memory to CPU memory.
   *
   * @returns A promise that resolves to a Uint8Array containing the pixel data
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
   * Gets the pixel value at the specified coordinates.
   * The coordinate system has its origin at the bottom-left corner.
   *
   * @param x - Horizontal pixel position (0 is left edge)
   * @param y - Vertical pixel position (0 is bottom edge)
   * @param argByteArray - Optional pre-fetched pixel data array to avoid redundant GPU reads
   * @returns A promise that resolves to a Vector4 containing the RGBA pixel values (0-255)
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
   * Generates mipmaps for the render target texture.
   * Mipmaps are pre-calculated, optimized sequences of images that accompany
   * a main texture, intended to increase rendering speed and reduce aliasing artifacts.
   */
  generateMipmaps() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    cgApiResourceRepository.generateMipmaps2d(this._textureResourceUid, this.width, this.height);
  }

  /**
   * Creates a cube texture view as a render target for the specified face and mip level.
   * This method is currently not implemented and serves as a placeholder for future functionality.
   *
   * @param faceIdx - Index of the cube face (0-5)
   * @param mipLevel - Mip level to create the view for
   */
  createCubeTextureViewAsRenderTarget(_faceIdx: Index, _mipLevel: Index): void {}
}

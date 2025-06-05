import { Index, Size } from '../../types/CommonTypes';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { HdriFormat } from '../definitions/HdriFormat';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { TextureFormat, TextureFormatEnum } from '../definitions/TextureFormat';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { SystemState } from '../system/SystemState';
import { AbstractTexture } from './AbstractTexture';
import { IRenderable } from './IRenderable';

/**
 * A cube texture that can be used as a render target for rendering operations.
 * This class extends AbstractTexture and implements IRenderable to provide
 * cube map rendering capabilities with support for multiple mip levels.
 *
 * @example
 * ```typescript
 * const cubeTexture = new RenderTargetTextureCube();
 * cubeTexture.create({
 *   width: 512,
 *   height: 512,
 *   format: TextureFormat.RGBA8
 * });
 * ```
 */
export class RenderTargetTextureCube extends AbstractTexture implements IRenderable {
  private __fbo?: FrameBuffer;
  public hdriFormat = HdriFormat.HDR_LINEAR;
  public _textureViewAsRenderTargetResourceUid: number = -1;

  /**
   * Creates a new RenderTargetTextureCube instance.
   * The texture must be initialized using the create() method before use.
   */
  constructor() {
    super();
  }

  /**
   * Creates and initializes the cube render target texture with the specified parameters.
   * This method sets up the internal texture resources and calculates mip levels if not provided.
   *
   * @param params - Configuration object for texture creation
   * @param params.width - Width of each cube face in pixels
   * @param params.height - Height of each cube face in pixels (should equal width for proper cube)
   * @param params.mipLevelCount - Optional number of mip levels. If not provided, calculates automatically
   * @param params.format - Internal texture format to use
   *
   * @example
   * ```typescript
   * cubeTexture.create({
   *   width: 1024,
   *   height: 1024,
   *   mipLevelCount: 10,
   *   format: TextureFormat.RGBA16F
   * });
   * ```
   */
  create({
    width,
    height,
    mipLevelCount,
    format: internalFormat,
  }: {
    width: number;
    height: number;
    mipLevelCount?: number;
    format: TextureFormatEnum;
  }) {
    this.__width = width;
    this.__height = height;
    this.__mipLevelCount = mipLevelCount ?? Math.floor(Math.log2(Math.max(width, height))) + 1;

    const { format, type } =
      TextureFormat.getPixelFormatAndComponentTypeFromTextureFormat(internalFormat);

    this.__internalFormat = internalFormat;
    this.__format = format;
    this.__type = type;

    this.__createRenderTargetTexture();
  }

  /**
   * Creates the underlying 3D API texture resources for the cube render target.
   * This method handles both WebGL and WebGPU resource creation and sets up
   * appropriate texture views for rendering operations.
   *
   * @private
   */
  private __createRenderTargetTexture() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const texture = cgApiResourceRepository.createRenderTargetTextureCube({
      width: this.__width,
      height: this.__height,
      mipLevelCount: this.__mipLevelCount,
      format: this.__internalFormat,
    });
    this._textureResourceUid = texture;

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createTextureViewCube(this._textureResourceUid);

      this._textureViewAsRenderTargetResourceUid = (
        cgApiResourceRepository as WebGpuResourceRepository
      ).createCubeTextureViewAsRenderTarget(this._textureResourceUid, 0, 0);
    }
  }

  /**
   * Generates mipmaps for the cube texture using the graphics API.
   * This method creates a complete mipmap chain for all faces of the cube texture,
   * which is useful for proper filtering and rendering quality.
   *
   * @remarks
   * This operation should be called after rendering to the base level (mip 0)
   * to ensure proper mipmap generation from the rendered content.
   */
  generateMipmaps() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.generateMipmapsCube(this._textureResourceUid, this.width, this.height);
  }

  /**
   * Resizes the cube texture to new dimensions.
   * This method destroys the current texture resources and recreates them
   * with the specified width and height.
   *
   * @param width - New width for each cube face in pixels
   * @param height - New height for each cube face in pixels
   *
   * @remarks
   * All existing texture content will be lost during the resize operation.
   * The mip level count will be recalculated based on the new dimensions.
   */
  resize(width: Size, height: Size) {
    this.destroy3DAPIResources();
    this.__width = width;
    this.__height = height;
    this.__createRenderTargetTexture();
  }

  /**
   * Destroys all 3D API resources associated with this texture.
   * This method releases GPU memory and invalidates the texture resource UID.
   *
   * @returns Always returns true to indicate successful cleanup
   *
   * @remarks
   * After calling this method, the texture cannot be used until recreated.
   * This is automatically called during resize operations.
   */
  destroy3DAPIResources() {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.deleteTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;

    return true;
  }

  /**
   * Creates a texture view for a specific cube face and mip level that can be used as a render target.
   * This method is WebGPU-specific and allows rendering to individual faces of the cube texture.
   *
   * @param faceIdx - Index of the cube face (0-5: +X, -X, +Y, -Y, +Z, -Z)
   * @param mipLevel - Mip level to create the view for (0 = base level)
   *
   * @remarks
   * This method only works when using the WebGPU rendering backend.
   * For WebGL, face-specific rendering is handled differently through framebuffer operations.
   */
  createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      const webGpuResourceRepository = CGAPIResourceRepository.getWebGpuResourceRepository();
      this._textureViewAsRenderTargetResourceUid =
        webGpuResourceRepository.createCubeTextureViewAsRenderTarget(
          this._textureResourceUid,
          faceIdx,
          mipLevel
        );
    }
  }

  /**
   * Sets the framebuffer object associated with this render target texture.
   *
   * @param fbo - The framebuffer object to associate with this texture
   *
   * @internal
   */
  set _fbo(fbo: FrameBuffer) {
    this.__fbo = fbo;
  }

  /**
   * Gets the framebuffer object associated with this render target texture.
   *
   * @returns The associated framebuffer object, or undefined if none is set
   */
  get fbo() {
    return this.__fbo;
  }

  /**
   * Gets the number of mip levels in this cube texture.
   *
   * @returns The total number of mip levels, including the base level
   */
  get mipmapLevelNumber() {
    return this.__mipLevelCount;
  }

  /**
   * Marks the texture as ready for use.
   * This method sets the internal ready state flag to indicate that
   * the texture has been properly initialized and can be used for rendering.
   *
   * @remarks
   * This is typically called internally after successful texture creation
   * and resource allocation.
   */
  setIsTextureReady() {
    this.__isTextureReady = true;
  }
}

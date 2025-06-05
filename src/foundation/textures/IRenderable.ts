import { CGAPIResourceHandle, Index, Size } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';

/**
 * Interface for renderable texture objects that can be used as render targets.
 * This interface defines the contract for objects that can be rendered to,
 * providing texture resources and rendering capabilities.
 */
export interface IRenderable {
  /** The width of the renderable texture in pixels */
  width: Size;

  /** The height of the renderable texture in pixels */
  height: Size;

  /** The unique identifier for the underlying texture resource */
  _textureResourceUid: CGAPIResourceHandle;

  /** The unique identifier for the texture view resource */
  _textureViewResourceUid: CGAPIResourceHandle;

  /** The unique identifier for the texture view used as a render target */
  _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle;

  /**
   * Resizes the renderable texture to the specified dimensions.
   * This method should handle the recreation of underlying graphics API resources
   * to accommodate the new size.
   *
   * @param width - The new width in pixels
   * @param height - The new height in pixels
   */
  resize(width: Size, height: Size): void;

  /**
   * Destroys all associated 3D graphics API resources.
   * This method should clean up GPU memory and release all allocated resources
   * to prevent memory leaks.
   *
   * @returns True if the resources were successfully destroyed, false otherwise
   */
  destroy3DAPIResources(): boolean;

  /**
   * Creates a cube texture view as a render target for a specific face and mip level.
   * This is typically used for cube map rendering where each face needs to be
   * rendered to individually.
   *
   * @param faceIdx - The index of the cube face (0-5 for +X, -X, +Y, -Y, +Z, -Z)
   * @param mipLevel - The mip level to create the view for (0 being the base level)
   */
  createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void;

  /** Optional frame buffer object associated with this renderable */
  fbo?: FrameBuffer;
}

import type { CGAPIResourceHandle } from '../../types/CommonTypes';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { Config } from '../core/Config';
import { ComponentType } from '../definitions/ComponentType';
import { PixelFormat } from '../definitions/PixelFormat';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { TextureFormat } from '../definitions/TextureFormat';
import { TextureParameter } from '../definitions/TextureParameter';
import { Logger } from '../misc/Logger';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import type { Engine } from '../system/Engine';
import { EngineState } from '../system/EngineState';
import { AbstractTexture } from './AbstractTexture';

/**
 * Object type used for finalization registry to track texture resources
 */
type FinalizationRegistryObject = {
  textureResourceUid: CGAPIResourceHandle;
  engine: Engine;
  uniqueName: string;
};

/**
 * TextureArray class represents a 2D texture array that can hold multiple texture layers.
 * This class extends AbstractTexture and implements the Disposable interface for proper resource management.
 * It provides automatic garbage collection cleanup through FinalizationRegistry and supports both WebGL and WebGPU APIs.
 */
export class TextureArray extends AbstractTexture implements Disposable {
  /**
   * Finalization registry for automatic cleanup of texture resources when objects are garbage collected.
   * This helps prevent memory leaks by automatically releasing GPU resources.
   */
  private static managedRegistry: FinalizationRegistry<FinalizationRegistryObject> =
    new FinalizationRegistry<FinalizationRegistryObject>(texObj => {
      Logger.info(
        `WebGL/WebGPU texture array "${texObj.uniqueName}" was automatically released along with GC. But explicit release is recommended.`
      );
      TextureArray.__deleteInternalTexture(texObj.engine, texObj.textureResourceUid);
    });

  /**
   * Sets the texture resource UID and registers the texture for automatic cleanup.
   * This method is called internally when a texture resource is created.
   *
   * @param textureResourceUid - The unique identifier for the texture resource
   * @param uniqueName - A unique name for the texture used in logging and debugging
   * @private
   */
  private __setTextureResourceUid(textureResourceUid: CGAPIResourceHandle, uniqueName: string) {
    this._textureResourceUid = textureResourceUid;
    TextureArray.managedRegistry.register(this, { textureResourceUid, engine: this.__engine, uniqueName }, this);
  }

  /**
   * Deletes the internal texture resource from the graphics API.
   * This is a static method used by the finalization registry for cleanup.
   *
   * @param textureResourceUid - The unique identifier of the texture resource to delete
   * @private
   */
  private static __deleteInternalTexture(engine: Engine, textureResourceUid: CGAPIResourceHandle) {
    const cgApiResourceRepository = engine.cgApiResourceRepository;
    cgApiResourceRepository.deleteTexture(textureResourceUid);
  }

  /**
   * Loads a 1x1 texture array with a solid color.
   * This creates a texture array with the specified number of layers (Config.maxLightNumber),
   * each containing a single pixel of the specified color.
   *
   * @param rgbaStr - CSS color string in rgba format (default: 'rgba(0,0,0,1)' for black)
   *
   * @example
   * ```typescript
   * const textureArray = new TextureArray();
   * textureArray.load1x1Texture('rgba(255,0,0,1)'); // Red texture
   * ```
   */
  load1x1Texture(rgbaStr = 'rgba(0,0,0,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
      Logger.error('Failed to get canvas context.');
      return;
    }
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);
    const imageData = ctx.getImageData(0, 0, 1, 1);
    const uint8Array = new Uint8Array(imageData.data.buffer);

    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;

    const resourceUid = cgApiResourceRepository.createTextureArray(
      1,
      1,
      Config.maxLightNumber,
      1,
      TextureFormat.RGBA8,
      PixelFormat.RGBA,
      ComponentType.UnsignedByte,
      uint8Array
    );
    this.__setTextureResourceUid(resourceUid, this.uniqueName);

    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      this._textureViewResourceUid = (cgApiResourceRepository as WebGpuResourceRepository).createTextureView2dArray(
        this._textureResourceUid,
        Config.maxLightNumber
      );
    }

    this.__isTextureReady = true;
  }

  /**
   * Destroys the 3D API resources associated with this texture array.
   * This method releases the texture from GPU memory and resets the texture state.
   * After calling this method, the texture cannot be used until reloaded.
   */
  destroy3DAPIResources() {
    TextureArray.__deleteInternalTexture(this.__engine, this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__isTextureReady = false;
    this.__startedToLoad = false;
  }

  /**
   * Symbol.dispose implementation for automatic resource cleanup.
   * This method is called when the object is used with 'using' declaration or explicit disposal.
   * It provides a standardized way to clean up resources.
   */
  [Symbol.dispose]() {
    Logger.debug('[Symbol.dispose] is called');
    this.destroy();
  }

  /**
   * Completely destroys the texture array and all associated resources.
   * This method should be called when the texture is no longer needed to prevent memory leaks.
   * It performs the following cleanup operations:
   * - Destroys 3D API resources
   * - Unregisters from parent class
   * - Unregisters from finalization registry
   */
  destroy() {
    this.destroy3DAPIResources();
    this.unregister();
    TextureArray.managedRegistry.unregister(this);
  }
}

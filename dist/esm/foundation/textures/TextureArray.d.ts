import { AbstractTexture } from './AbstractTexture';
/**
 * TextureArray class represents a 2D texture array that can hold multiple texture layers.
 * This class extends AbstractTexture and implements the Disposable interface for proper resource management.
 * It provides automatic garbage collection cleanup through FinalizationRegistry and supports both WebGL and WebGPU APIs.
 */
export declare class TextureArray extends AbstractTexture implements Disposable {
    /**
     * Finalization registry for automatic cleanup of texture resources when objects are garbage collected.
     * This helps prevent memory leaks by automatically releasing GPU resources.
     */
    private static managedRegistry;
    /**
     * Sets the texture resource UID and registers the texture for automatic cleanup.
     * This method is called internally when a texture resource is created.
     *
     * @param textureResourceUid - The unique identifier for the texture resource
     * @param uniqueName - A unique name for the texture used in logging and debugging
     * @private
     */
    private __setTextureResourceUid;
    /**
     * Deletes the internal texture resource from the graphics API.
     * This is a static method used by the finalization registry for cleanup.
     *
     * @param textureResourceUid - The unique identifier of the texture resource to delete
     * @private
     */
    private static __deleteInternalTexture;
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
    load1x1Texture(rgbaStr?: string): void;
    /**
     * Destroys the 3D API resources associated with this texture array.
     * This method releases the texture from GPU memory and resets the texture state.
     * After calling this method, the texture cannot be used until reloaded.
     */
    destroy3DAPIResources(): void;
    /**
     * Symbol.dispose implementation for automatic resource cleanup.
     * This method is called when the object is used with 'using' declaration or explicit disposal.
     * It provides a standardized way to clean up resources.
     */
    [Symbol.dispose](): void;
    /**
     * Completely destroys the texture array and all associated resources.
     * This method should be called when the texture is no longer needed to prevent memory leaks.
     * It performs the following cleanup operations:
     * - Destroys 3D API resources
     * - Unregisters from parent class
     * - Unregisters from finalization registry
     */
    destroy(): void;
}

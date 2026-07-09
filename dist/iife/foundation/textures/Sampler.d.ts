import type { CGAPIResourceHandle } from '../../types/CommonTypes';
import { type TextureParameterEnum } from '../definitions';
import type { Engine } from '../system/Engine';
/**
 * Descriptor object for configuring a texture sampler.
 */
export type SamplerDescriptor = {
    /** Minification filter mode for texture sampling */
    minFilter: TextureParameterEnum;
    /** Magnification filter mode for texture sampling */
    magFilter: TextureParameterEnum;
    /** Texture wrapping mode for S coordinate */
    wrapS: TextureParameterEnum;
    /** Texture wrapping mode for T coordinate */
    wrapT: TextureParameterEnum;
    /** Texture wrapping mode for R coordinate (optional) */
    wrapR?: TextureParameterEnum;
    /** Whether to enable anisotropic filtering (optional) */
    anisotropy?: boolean;
    /** Whether to enable shadow comparison mode (optional) */
    shadowCompareMode?: boolean;
};
/**
 * Represents a texture sampler that defines how textures are sampled during rendering.
 * A sampler encapsulates filtering and wrapping parameters for texture sampling operations.
 */
export declare class Sampler {
    private __engine;
    private __minFilter;
    private __magFilter;
    private __wrapS;
    private __wrapT;
    private __wrapR;
    private __anisotropy;
    private __shadowCompareMode;
    private __samplerResourceUid;
    /**
     * Creates a new Sampler instance with the specified configuration.
     * @param desc - The sampler descriptor containing filtering and wrapping parameters
     */
    constructor(engine: Engine, desc: SamplerDescriptor);
    /**
     * Creates the underlying graphics API sampler resource.
     * This method must be called before the sampler can be used for rendering.
     */
    create(): void;
    /**
     * Checks whether the sampler resource has been created.
     * @returns True if the sampler has been created, false otherwise
     */
    get created(): boolean;
    /**
     * Gets the minification filter mode used when the texture is scaled down.
     * @returns The minification filter parameter
     */
    get minFilter(): TextureParameterEnum;
    /**
     * Gets the magnification filter mode used when the texture is scaled up.
     * @returns The magnification filter parameter
     */
    get magFilter(): TextureParameterEnum;
    /**
     * Gets the texture wrapping mode for the S (horizontal) coordinate.
     * @returns The S-coordinate wrapping parameter
     */
    get wrapS(): TextureParameterEnum;
    /**
     * Gets the texture wrapping mode for the T (vertical) coordinate.
     * @returns The T-coordinate wrapping parameter
     */
    get wrapT(): TextureParameterEnum;
    /**
     * Gets the texture wrapping mode for the R (depth) coordinate.
     * @returns The R-coordinate wrapping parameter
     */
    get wrapR(): TextureParameterEnum;
    /**
     * Gets the internal sampler resource handle used by the graphics API.
     * @returns The sampler resource UID
     * @internal
     */
    get _samplerResourceUid(): CGAPIResourceHandle;
    /**
     * Destroys the sampler resource and resets its internal state.
     * This invalidates the sampler resource UID, allowing it to be recreated.
     * @internal Called from Engine.destroy() or texture cleanup
     */
    destroy(): void;
}

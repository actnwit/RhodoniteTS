import type { Engine } from '../../system/Engine';
import { CubeTexture } from '../../textures/CubeTexture';
import { Texture } from '../../textures/Texture';
import { TextureArray } from '../../textures/TextureArray';
export declare class DummyTextures {
    /**
     * A dummy white 1x1 texture used as a fallback for missing textures.
     * This texture provides a safe default when no specific texture is available.
     */
    dummyWhiteTexture: Texture;
    /**
     * A dummy blue 1x1 texture with RGB values of (127.5, 127.5, 255).
     * Commonly used as a default normal map texture.
     */
    dummyBlueTexture: Texture;
    /**
     * A dummy black 1x1 texture with RGB values of (0, 0, 0).
     * Used as a fallback for textures that should have no contribution.
     */
    dummyBlackTexture: Texture;
    /**
     * A dummy black cube texture used as a fallback for environment maps.
     * Provides a default cube texture when no environment map is specified.
     */
    dummyBlackCubeTexture: CubeTexture;
    /**
     * A dummy transparent 1x1 texture with RGBA values of (0, 0, 0, 0).
     * Used when a completely transparent texture is needed.
     */
    dummyZeroTexture: Texture;
    /**
     * A lookup texture for sheen calculations in material rendering.
     * Contains pre-computed sheen values for efficient material evaluation.
     */
    sheenLutTexture: Texture;
    /**
     * A dummy sRGB gray 1x1 texture with RGB values of (186, 186, 186).
     * Provides a neutral gray color in sRGB color space.
     */
    dummySRGBGrayTexture: Texture;
    /**
     * A dummy anisotropy 1x1 texture with RGB values of (255, 127.5, 255).
     * Used as a default for anisotropic material properties.
     */
    dummyAnisotropyTexture: Texture;
    /**
     * A dummy depth moment texture array used for variance shadow mapping.
     * Provides default depth and moment values for shadow calculations.
     */
    dummyDepthMomentTextureArray: TextureArray;
    /**
     * Initializes all default dummy textures with their appropriate data.
     * This function should be called once during application startup to ensure
     * all dummy textures are properly configured and ready for use.
     *
     * @returns A promise that resolves when all textures are initialized
     */
    constructor(engine: Engine);
    static init(engine: Engine): Promise<DummyTextures>;
    /**
     * Destroys all dummy textures and releases their GPU resources.
     *
     * @remarks
     * This method should be called when the engine is being destroyed
     * to properly clean up all texture resources.
     */
    destroy(): void;
}

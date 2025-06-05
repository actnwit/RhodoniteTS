import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SystemState } from '../../system/SystemState';
import { CubeTexture } from '../../textures/CubeTexture';
import { Texture } from '../../textures/Texture';
import { TextureArray } from '../../textures/TextureArray';

/**
 * A dummy white 1x1 texture used as a fallback for missing textures.
 * This texture provides a safe default when no specific texture is available.
 */
export const dummyWhiteTexture = new Texture();

/**
 * A dummy blue 1x1 texture with RGB values of (127.5, 127.5, 255).
 * Commonly used as a default normal map texture.
 */
export const dummyBlueTexture = new Texture();

/**
 * A dummy black 1x1 texture with RGB values of (0, 0, 0).
 * Used as a fallback for textures that should have no contribution.
 */
export const dummyBlackTexture = new Texture();

/**
 * A dummy black cube texture used as a fallback for environment maps.
 * Provides a default cube texture when no environment map is specified.
 */
export const dummyBlackCubeTexture = new CubeTexture();

/**
 * A dummy transparent 1x1 texture with RGBA values of (0, 0, 0, 0).
 * Used when a completely transparent texture is needed.
 */
export const dummyZeroTexture = new Texture();

/**
 * A lookup texture for sheen calculations in material rendering.
 * Contains pre-computed sheen values for efficient material evaluation.
 */
export const sheenLutTexture = new Texture();

/**
 * A dummy sRGB gray 1x1 texture with RGB values of (186, 186, 186).
 * Provides a neutral gray color in sRGB color space.
 */
export const dummySRGBGrayTexture = new Texture();

/**
 * A dummy anisotropy 1x1 texture with RGB values of (255, 127.5, 255).
 * Used as a default for anisotropic material properties.
 */
export const dummyAnisotropyTexture = new Texture();

/**
 * A dummy depth moment texture array used for variance shadow mapping.
 * Provides default depth and moment values for shadow calculations.
 */
export const dummyDepthMomentTextureArray = new TextureArray();

/**
 * Initializes all default dummy textures with their appropriate data.
 * This function should be called once during application startup to ensure
 * all dummy textures are properly configured and ready for use.
 *
 * @returns A promise that resolves when all textures are initialized
 */
export async function initDefaultTextures() {
  if (dummyWhiteTexture.isTextureReady) {
    return;
  }
  dummyWhiteTexture.tryToSetUniqueName('dummyWhiteTexture', true);
  dummyBlueTexture.tryToSetUniqueName('dummyBlueTexture', true);
  dummyBlackTexture.tryToSetUniqueName('dummyBlackTexture', true);
  dummyBlackCubeTexture.tryToSetUniqueName('dummyBlackCubeTexture', true);
  dummyZeroTexture.tryToSetUniqueName('dummyZeroTexture', true);
  sheenLutTexture.tryToSetUniqueName('sheenLutTexture', true);
  dummySRGBGrayTexture.tryToSetUniqueName('dummySRGBGrayTexture', true);
  dummyAnisotropyTexture.tryToSetUniqueName('dummyAnisotropyTexture', true);
  dummyDepthMomentTextureArray.tryToSetUniqueName('dummyDepthMomentTextureArray', true);

  await dummyWhiteTexture.generate1x1TextureFrom();
  await dummyBlueTexture.generate1x1TextureFrom('rgba(127.5, 127.5, 255, 1)');
  await dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
  dummyBlackCubeTexture.load1x1Texture('rgba(0, 0, 0, 1)');
  dummyZeroTexture.generate1x1TextureFrom('rgba(0, 0, 0, 0)');
  await sheenLutTexture.generateSheenLutTextureFromDataUri();
  await dummySRGBGrayTexture.generate1x1TextureFrom('rgba(186, 186, 186, 1)');
  await dummyAnisotropyTexture.generate1x1TextureFrom('rgba(255, 127.5, 255, 1)');
  dummyDepthMomentTextureArray.load1x1Texture('rgba(255, 255, 255, 1)');
}

/**
 * A collection of all default textures available in the system.
 * This object provides convenient access to all dummy textures
 * and can be used for texture fallbacks throughout the application.
 */
export const DefaultTextures = {
  dummyWhiteTexture,
  dummyBlueTexture,
  dummyBlackTexture,
  dummyBlackCubeTexture,
  dummyZeroTexture,
  sheenLutTexture,
  dummySRGBGrayTexture,
  dummyAnisotropyTexture,
  dummyDepthMomentTextureArray,
};

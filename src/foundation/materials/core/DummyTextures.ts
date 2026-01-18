import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
import { CubeTexture } from '../../textures/CubeTexture';
import { Texture } from '../../textures/Texture';
import { TextureArray } from '../../textures/TextureArray';

export class DummyTextures {
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
  constructor(engine: Engine) {
    this.dummyWhiteTexture = new Texture(engine);
    this.dummyBlueTexture = new Texture(engine);
    this.dummyBlackTexture = new Texture(engine);
    this.dummyBlackCubeTexture = new CubeTexture(engine);
    this.dummyZeroTexture = new Texture(engine);
    this.sheenLutTexture = new Texture(engine);
    this.dummySRGBGrayTexture = new Texture(engine);
    this.dummyAnisotropyTexture = new Texture(engine);
    this.dummyDepthMomentTextureArray = new TextureArray(engine);
  }

  static async init(engine: Engine) {
    const dummyTextures = new DummyTextures(engine);
    dummyTextures.dummyWhiteTexture.tryToSetUniqueName('dummyWhiteTexture', true);
    dummyTextures.dummyBlueTexture.tryToSetUniqueName('dummyBlueTexture', true);
    dummyTextures.dummyBlackTexture.tryToSetUniqueName('dummyBlackTexture', true);
    dummyTextures.dummyBlackCubeTexture.tryToSetUniqueName('dummyBlackCubeTexture', true);
    dummyTextures.dummyZeroTexture.tryToSetUniqueName('dummyZeroTexture', true);
    dummyTextures.sheenLutTexture.tryToSetUniqueName('sheenLutTexture', true);
    dummyTextures.dummySRGBGrayTexture.tryToSetUniqueName('dummySRGBGrayTexture', true);
    dummyTextures.dummyAnisotropyTexture.tryToSetUniqueName('dummyAnisotropyTexture', true);
    dummyTextures.dummyDepthMomentTextureArray.tryToSetUniqueName('dummyDepthMomentTextureArray', true);

    await dummyTextures.dummyWhiteTexture.generate1x1TextureFrom();
    dummyTextures.dummyWhiteTexture.markAsDummyTexture();
    await dummyTextures.dummyBlueTexture.generate1x1TextureFrom('rgba(127.5, 127.5, 255, 1)');
    dummyTextures.dummyBlueTexture.markAsDummyTexture();
    await dummyTextures.dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
    dummyTextures.dummyBlackTexture.markAsDummyTexture();
    dummyTextures.dummyBlackCubeTexture.load1x1Texture('rgba(0, 0, 0, 1)');
    dummyTextures.dummyBlackCubeTexture.markAsDummyTexture();
    dummyTextures.dummyZeroTexture.generate1x1TextureFrom('rgba(0, 0, 0, 0)');
    dummyTextures.dummyZeroTexture.markAsDummyTexture();
    await dummyTextures.sheenLutTexture.generateSheenLutTextureFromDataUri();
    await dummyTextures.dummySRGBGrayTexture.generate1x1TextureFrom('rgba(186, 186, 186, 1)');
    dummyTextures.dummySRGBGrayTexture.markAsDummyTexture();
    await dummyTextures.dummyAnisotropyTexture.generate1x1TextureFrom('rgba(255, 127.5, 255, 1)');
    dummyTextures.dummyAnisotropyTexture.markAsDummyTexture();
    dummyTextures.dummyDepthMomentTextureArray.load1x1Texture('rgba(255, 255, 255, 1)');
    dummyTextures.dummyDepthMomentTextureArray.markAsDummyTexture();

    return dummyTextures;
  }

  /**
   * Destroys all dummy textures and releases their GPU resources.
   *
   * @remarks
   * This method should be called when the engine is being destroyed
   * to properly clean up all texture resources.
   */
  destroy() {
    this.dummyWhiteTexture.destroy();
    this.dummyBlueTexture.destroy();
    this.dummyBlackTexture.destroy();
    this.dummyBlackCubeTexture.destroy();
    this.dummyZeroTexture.destroy();
    this.sheenLutTexture.destroy();
    this.dummySRGBGrayTexture.destroy();
    this.dummyAnisotropyTexture.destroy();
    this.dummyDepthMomentTextureArray.destroy();
  }
}

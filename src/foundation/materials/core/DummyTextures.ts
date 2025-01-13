import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SystemState } from '../../system/SystemState';
import { CubeTexture } from '../../textures/CubeTexture';
import { Texture } from '../../textures/Texture';

export const dummyWhiteTexture = new Texture();
export const dummyBlueTexture = new Texture();
export const dummyBlackTexture = new Texture();
export const dummyBlackCubeTexture = new CubeTexture();
export const dummyZeroTexture = new Texture();
export const sheenLutTexture = new Texture();
export const dummySRGBGrayTexture = new Texture();
export const dummyAnisotropyTexture = new Texture();

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

  dummyWhiteTexture.generate1x1TextureFrom();
  dummyBlueTexture.generate1x1TextureFrom('rgba(127.5, 127.5, 255, 1)');
  dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
  dummyBlackCubeTexture.load1x1Texture('rgba(0, 0, 0, 1)');
  dummyZeroTexture.generate1x1TextureFrom('rgba(0, 0, 0, 0)');
  await sheenLutTexture.generateSheenLutTextureFromDataUri();
  dummySRGBGrayTexture.generate1x1TextureFrom('rgba(186, 186, 186, 1)');
  dummyAnisotropyTexture.generate1x1TextureFrom('rgba(255, 127.5, 255, 1)');
}

export const DefaultTextures = {
  dummyWhiteTexture,
  dummyBlueTexture,
  dummyBlackTexture,
  dummyBlackCubeTexture,
  dummyZeroTexture,
  sheenLutTexture,
  dummySRGBGrayTexture,
  dummyAnisotropyTexture,
};

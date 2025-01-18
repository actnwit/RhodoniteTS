import { CGAPIResourceHandle } from '../../types/CommonTypes';
import { ComponentType } from '../definitions/ComponentType';
import { PixelFormat } from '../definitions/PixelFormat';
import { TextureFormat } from '../definitions/TextureFormat';
import { TextureParameter } from '../definitions/TextureParameter';
import { Logger } from '../misc/Logger';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { AbstractTexture } from './AbstractTexture';

type FinalizationRegistryObject = {
  textureResourceUid: CGAPIResourceHandle;
  uniqueName: string;
};

export class TextureArray extends AbstractTexture implements Disposable {
  private static managedRegistry: FinalizationRegistry<FinalizationRegistryObject> =
    new FinalizationRegistry<FinalizationRegistryObject>((texObj) => {
      Logger.info(
        `WebGL/WebGPU texture array "${texObj.uniqueName}" was automatically released along with GC. But explicit release is recommended.`
      );
      TextureArray.__deleteInternalTexture(texObj.textureResourceUid);
    });

  constructor() {
    super();
  }

  private __setTextureResourceUid(textureResourceUid: CGAPIResourceHandle, uniqueName: string) {
    this._textureResourceUid = textureResourceUid;
    TextureArray.managedRegistry.register(this, { textureResourceUid, uniqueName }, this);
  }

  private static __deleteInternalTexture(textureResourceUid: CGAPIResourceHandle) {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.deleteTexture(textureResourceUid);
  }

  load1x1Texture(rgbaStr = 'rgba(0,0,0,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);
    const imageData = ctx.getImageData(0, 0, 1, 1);
    const uint8Array = new Uint8Array(imageData.data.buffer);

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();

    const resourceUid = cgApiResourceRepository.createTextureArray(
      1,
      1,
      10,
      1,
      TextureFormat.RGBA8,
      PixelFormat.RGBA,
      ComponentType.UnsignedByte,
      uint8Array
    );
    this.__setTextureResourceUid(resourceUid, this.uniqueName);

    // if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
    //   this._textureViewResourceUid = (
    //     cgApiResourceRepository as WebGpuResourceRepository
    //   ).createTextureViewCube(this._textureResourceUid);
    // }

    this.__isTextureReady = true;
  }

  destroy3DAPIResources() {
    TextureArray.__deleteInternalTexture(this._textureResourceUid);
    this._textureResourceUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__isTextureReady = false;
    this.__startedToLoad = false;
  }

  [Symbol.dispose]() {
    Logger.debug('[Symbol.dispose] is called');
    this.destroy();
  }

  destroy() {
    this.destroy3DAPIResources();
    this.unregister();
    TextureArray.managedRegistry.unregister(this);
  }
}

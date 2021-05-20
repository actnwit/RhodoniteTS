import {KTX2Container, read} from 'ktx-parse';

declare const MSC_TRANSCODER: any;

export default class KTX2TextureLoader {
  private static __instance: KTX2TextureLoader;

  // TODO: create type of __mscTranscoderModule
  private static __mscTranscoderModule: any;

  private __mscTranscoderPromise: Promise<void>;

  constructor() {
    if (typeof MSC_TRANSCODER === 'undefined') {
      console.error(
        'Failed to call MSC_TRANSCODER() function. Please check to import msc_basis_transcoder.js.'
      );
    }
    this.__mscTranscoderPromise = this.__loadMSCTranscoder();
  }

  // ----- Public Methods -----------------------------------------------------

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new KTX2TextureLoader();
    }
    return this.__instance;
  }

  transcode(uint8Array: Uint8Array) {
    const ktx2Container = this.__parse(uint8Array);

    if (ktx2Container.pixelDepth > 0) {
      throw new Error('Only 2D textures are currently supported');
    }

    if (ktx2Container.layerCount > 1) {
      throw new Error('Array textures are not currently supported');
    }

    if (ktx2Container.faceCount > 1) {
      throw new Error('Cube textures are not currently supported');
    }
  }

  // ----- Private Methods ----------------------------------------------------

  private __loadMSCTranscoder(): Promise<void> {
    // load msc_basis_transcoder once
    return new Promise(resolve => {
      if (KTX2TextureLoader.__mscTranscoderModule) {
        resolve();
      }

      MSC_TRANSCODER().then((transcoderModule: any) => {
        transcoderModule.initTranscoders();
        KTX2TextureLoader.__mscTranscoderModule = transcoderModule;
        resolve();
      });
    });
  }

  private __parse(uint8Array: Uint8Array): KTX2Container {
    // The parser can detect an invalid identifier.
    return read(uint8Array);
  }
}

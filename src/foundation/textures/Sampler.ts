import { CGAPIResourceHandle } from '../../types/CommonTypes';
import { TextureParameter, TextureParameterEnum } from '../definitions';

export type SamplerDescriptor = {
  minFilter: TextureParameterEnum;
  magFilter: TextureParameterEnum;
  wrapS: TextureParameterEnum;
  wrapT: TextureParameterEnum;
  wrapR?: TextureParameterEnum;
};

export class Sampler {
  private __minFilter: TextureParameterEnum;
  private __magFilter: TextureParameterEnum;
  private __wrapS: TextureParameterEnum;
  private __wrapT: TextureParameterEnum;
  private __wrapR: TextureParameterEnum;
  private __samplerResourceUid: CGAPIResourceHandle = -1;

  constructor(desc: SamplerDescriptor) {
    this.__minFilter = desc.minFilter;
    this.__magFilter = desc.magFilter;
    this.__wrapS = desc.wrapS;
    this.__wrapT = desc.wrapT;
    this.__wrapR = desc.wrapR ?? TextureParameter.ClampToEdge;
  }

  get minFilter(): TextureParameterEnum {
    return this.__minFilter;
  }

  get magFilter(): TextureParameterEnum {
    return this.__magFilter;
  }

  get wrapS(): TextureParameterEnum {
    return this.__wrapS;
  }

  get wrapT(): TextureParameterEnum {
    return this.__wrapT;
  }

  get wrapR(): TextureParameterEnum {
    return this.__wrapR;
  }

  get _samplerResourceUid(): CGAPIResourceHandle {
    return this.__samplerResourceUid;
  }
}

import { CGAPIResourceHandle } from '../../types/CommonTypes';
import { TextureParameter, TextureParameterEnum } from '../definitions';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';

export type SamplerDescriptor = {
  minFilter: TextureParameterEnum;
  magFilter: TextureParameterEnum;
  wrapS: TextureParameterEnum;
  wrapT: TextureParameterEnum;
  wrapR?: TextureParameterEnum;
  anisotropy?: boolean;
};

export class Sampler {
  private __minFilter: TextureParameterEnum;
  private __magFilter: TextureParameterEnum;
  private __wrapS: TextureParameterEnum;
  private __wrapT: TextureParameterEnum;
  private __wrapR: TextureParameterEnum;
  private __anisotropy: boolean;
  private __samplerResourceUid: CGAPIResourceHandle = -1;

  constructor(desc: SamplerDescriptor) {
    this.__minFilter = desc.minFilter;
    this.__magFilter = desc.magFilter;
    this.__wrapS = desc.wrapS;
    this.__wrapT = desc.wrapT;
    this.__wrapR = desc.wrapR ?? TextureParameter.Repeat;
    this.__anisotropy = desc.anisotropy ?? true;
  }

  create() {
    const webGLResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    this.__samplerResourceUid = webGLResourceRepository.createTextureSampler({
      minFilter: this.__minFilter,
      magFilter: this.__magFilter,
      wrapS: this.__wrapS,
      wrapT: this.__wrapT,
      wrapR: this.__wrapR,
      anisotropy: this.__anisotropy,
    });
  }

  get created(): boolean {
    return this.__samplerResourceUid !== -1;
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

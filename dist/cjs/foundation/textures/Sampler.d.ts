import { CGAPIResourceHandle } from '../../types/CommonTypes';
import { TextureParameterEnum } from '../definitions';
export type SamplerDescriptor = {
    minFilter: TextureParameterEnum;
    magFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    wrapR?: TextureParameterEnum;
    anisotropy?: boolean;
    shadowCompareMode?: boolean;
};
export declare class Sampler {
    private __minFilter;
    private __magFilter;
    private __wrapS;
    private __wrapT;
    private __wrapR;
    private __anisotropy;
    private __shadowCompareMode;
    private __samplerResourceUid;
    constructor(desc: SamplerDescriptor);
    create(): void;
    get created(): boolean;
    get minFilter(): TextureParameterEnum;
    get magFilter(): TextureParameterEnum;
    get wrapS(): TextureParameterEnum;
    get wrapT(): TextureParameterEnum;
    get wrapR(): TextureParameterEnum;
    get _samplerResourceUid(): CGAPIResourceHandle;
}

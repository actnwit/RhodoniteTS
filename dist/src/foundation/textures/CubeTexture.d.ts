import AbstractTexture from "./AbstractTexture";
export default class CubeTexture extends AbstractTexture {
    baseUriToLoad?: string;
    mipmapLevelNumber: number;
    hdriFormat: import("../definitions/HdriFormat").HdriFormatEnum;
    isNamePosNeg: boolean;
    constructor();
    loadTextureImages(): Promise<void>;
    loadTextureImagesAsync(): void;
    loadTextureImagesFromBasis(uint8Array: Uint8Array, { magFilter, minFilter, wrapS, wrapT, }?: {
        magFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        minFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        wrapS?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        wrapT?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    }): void;
    load1x1Texture(rgbaStr?: string): void;
}

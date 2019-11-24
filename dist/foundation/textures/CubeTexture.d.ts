import AbstractTexture from "./AbstractTexture";
export default class CubeTexture extends AbstractTexture {
    baseUriToLoad?: string;
    mipmapLevelNumber: number;
    hdriFormat: import("../definitions/HdriFormat").HdriFormatEnum;
    isNamePosNeg: boolean;
    constructor();
    loadTextureImages(): Promise<void>;
    loadTextureImagesAsync(): void;
    load1x1Texture(rgbaStr?: string): void;
}

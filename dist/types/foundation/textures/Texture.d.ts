import AbstractTexture from "./AbstractTexture";
export default class Texture extends AbstractTexture {
    private __imageData?;
    autoResize: boolean;
    autoDetectTransparency: boolean;
    constructor();
    private __getResizedCanvas;
    generateTextureFromImage(image: HTMLImageElement): void;
    generateTextureFromUri(imageUri: string): Promise<unknown>;
    generate1x1TextureFrom(rgbaStr?: string): void;
}

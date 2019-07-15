import AbstractTexture from "./AbstractTexture";
export default class Texture extends AbstractTexture {
    constructor();
    private __getResizedCanvas;
    generateTextureFromImage(image: HTMLImageElement): void;
    generateTextureFromUri(imageUri: string): Promise<unknown>;
}

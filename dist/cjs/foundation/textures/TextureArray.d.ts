import { AbstractTexture } from './AbstractTexture';
export declare class TextureArray extends AbstractTexture implements Disposable {
    private static managedRegistry;
    constructor();
    private __setTextureResourceUid;
    private static __deleteInternalTexture;
    load1x1Texture(rgbaStr?: string): void;
    destroy3DAPIResources(): void;
    [Symbol.dispose](): void;
    destroy(): void;
}

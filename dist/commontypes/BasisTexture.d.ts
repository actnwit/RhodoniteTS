declare class _BasisFile {
    constructor(x: Uint8Array);
    close(): void;
    getHasAlpha(): number;
    getNumImages(): number;
    getNumLevels(imageIndex: number): number;
    getImageWidth(imageIndex: number, levelIndex: number): number;
    getImageHeight(imageIndex: number, levelIndex: number): number;
    getImageTranscodedSizeInBytes(imageIndex: number, levelImdex: number, format: number): number;
    startTranscoding(): number;
    transcodeImage(dst: Uint8Array, imageIndex: number, levelIndex: number, format: number, unused: number, getAlphaForOpaqueFormats: number): number;
    delete(): void;
}
export declare type BasisFile = _BasisFile;
export declare type BasisTranscoder = {
    BasisFile: new (x: Uint8Array) => BasisFile;
    initializeBasis: () => void;
};
declare function _BASIS(): {
    then: (callback: (basisTranscoder: BasisTranscoder) => void) => void;
};
export declare type BASIS = typeof _BASIS;
export {};

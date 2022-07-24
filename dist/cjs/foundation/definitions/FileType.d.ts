import { EnumIO } from '../misc/EnumIO';
export declare type FileTypeEnum = EnumIO;
declare function from(index: number): FileTypeEnum;
declare function fromString(str: string): FileTypeEnum;
declare function isGltfOrGlb(file: FileTypeEnum): boolean;
export declare const FileType: Readonly<{
    Unknown: EnumIO;
    Gltf: EnumIO;
    GltfBinary: EnumIO;
    VRM: EnumIO;
    Draco: EnumIO;
    EffekseerEffect: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
    isGltfOrGlb: typeof isGltfOrGlb;
}>;
export {};

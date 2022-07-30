import { EnumIO } from '../misc/EnumIO';
export declare type BufferUseEnum = EnumIO;
declare function from(index: number): BufferUseEnum;
declare function fromString(str: string): BufferUseEnum;
export declare const BufferUse: Readonly<{
    GPUInstanceData: EnumIO;
    GPUVertexData: EnumIO;
    UBOGeneric: EnumIO;
    CPUGeneric: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};

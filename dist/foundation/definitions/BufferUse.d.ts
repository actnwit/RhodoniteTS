import { EnumIO } from "../misc/EnumIO";
export interface BufferUseEnum extends EnumIO {
}
declare function from(index: number): BufferUseEnum;
declare function fromString(str: string): BufferUseEnum;
export declare const BufferUse: Readonly<{
    GPUInstanceData: BufferUseEnum;
    GPUVertexData: BufferUseEnum;
    UBOGeneric: BufferUseEnum;
    CPUGeneric: BufferUseEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};

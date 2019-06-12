import Buffer from '../memory/Buffer';
import { BufferUseEnum } from '../definitions/BufferUse';
/**
 * Usage
 * const mm = MemoryManager.getInstance();
 * this.translate = new Vector3(
 *   mm.assignMem(componentUID, propetyId, entityUID, isRendered)
 * );
 */
export default class MemoryManager {
    private static __instance;
    private __buffers;
    private static __bufferWidthLength;
    private static __bufferHeightLength;
    private constructor();
    static createInstanceIfNotCreated(cpuGeneric: number, gpuInstanceData: number, gpuVertexData: number, UBOGeneric: number): MemoryManager;
    private __makeMultipleOf4byteSize;
    static getInstance(): MemoryManager;
    getBuffer(bufferUse: BufferUseEnum): Buffer;
    static readonly bufferWidthLength: Size;
    static readonly bufferHeightLength: Size;
    printMemoryUsage(): void;
}

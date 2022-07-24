import { Buffer } from '../memory/Buffer';
import { BufferUseEnum } from '../definitions/BufferUse';
import { Size, Byte } from '../../types/CommonTypes';
import { RnObject } from './RnObject';
/**
 * Usage
 * const mm = MemoryManager.getInstance();
 * this.translate = new Vector3(
 *   mm.assignMem(componentUID, propertyId, entityUID, isRendered)
 * );
 */
export declare class MemoryManager {
    private static __instance;
    private __buffers;
    private __buffersOnDemand;
    private __memorySizeRatios;
    private constructor();
    static createInstanceIfNotCreated({ cpuGeneric, gpuInstanceData, gpuVertexData, }: {
        cpuGeneric: number;
        gpuInstanceData: number;
        gpuVertexData: number;
    }): MemoryManager;
    private __makeMultipleOf4byteSize;
    static getInstance(): MemoryManager;
    private __createBuffer;
    getBuffer(bufferUse: BufferUseEnum): Buffer | undefined;
    createOrGetBuffer(bufferUse: BufferUseEnum): Buffer;
    createBufferOnDemand(size: Byte, object: RnObject, byteAlign: Byte): Buffer;
    getBufferOnDemand(object: RnObject): Buffer | undefined;
    static get bufferWidthLength(): Size;
    static get bufferHeightLength(): Size;
    printMemoryUsage(): void;
    dumpBuffer(bufferUse: BufferUseEnum): Buffer | undefined;
}

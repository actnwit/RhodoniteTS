import Buffer from '../memory/Buffer';
import { BufferUseEnum } from '../definitions/BufferUse';
import { Size, Byte } from '../../types/CommonTypes';
import RnObject from './RnObject';
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
    private __buffersOnDemand;
    private constructor();
    static createInstanceIfNotCreated(cpuGeneric: number, gpuInstanceData: number, gpuVertexData: number, UBOGeneric: number): MemoryManager;
    private __makeMultipleOf4byteSize;
    static getInstance(): MemoryManager;
    getBuffer(bufferUse: BufferUseEnum): Buffer;
    createBufferOnDemand(size: Byte, object: RnObject): Buffer;
    getBufferOnDemand(object: RnObject): Buffer | undefined;
    static get bufferWidthLength(): Size;
    static get bufferHeightLength(): Size;
    printMemoryUsage(): void;
}

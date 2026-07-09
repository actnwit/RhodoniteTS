import type { Byte, Count, Index } from '../../types/CommonTypes';
import { type BufferUseEnum } from '../definitions/BufferUse';
import { Buffer } from '../memory/Buffer';
import type { Engine } from '../system/Engine';
export declare class MemoryManager {
    private __engine;
    private __buffers;
    private __countOfTheBufferUsageMap;
    private __maxGPUDataStorageSize;
    private __bufferSizeDivisionRatiosForGPUInstanceDataUsage;
    private __bufferSizeDivisionRatiosForGPUVertexDataUsage;
    /**
     * Private constructor to ensure singleton pattern.
     * Initializes memory size ratios for different buffer types.
     * @param maxGPUDataStorageSize - The maximum GPU data storage size in bytes
     */
    private constructor();
    /**
     * Creates a MemoryManager instance if it doesn't exist, or returns the existing instance.
     * This method enforces the singleton pattern.
     * @param maxGPUDataStorageSize - The maximum GPU data storage size in bytes
     * @returns The MemoryManager singleton instance
     */
    static createInstanceIfNotCreated(engine: Engine, maxGPUDataStorageSize: Byte): MemoryManager;
    /**
     * Ensures the memory size is a multiple of 4 bytes for proper alignment.
     * @param memorySize - The original memory size in bytes
     * @returns The adjusted memory size that is a multiple of 4 bytes
     */
    private __makeMultipleOf4byteSize;
    /**
     * Creates a new buffer for the specified buffer use type.
     * Sets appropriate byte alignment based on buffer type (4 bytes for CPU, 16 bytes for GPU).
     * @param bufferUse - The type of buffer to create
     * @returns The newly created Buffer instance
     */
    private __createBuffer;
    /**
     * Retrieves an existing buffer for the specified buffer use type.
     * @param bufferUse - The type of buffer to retrieve
     * @returns The Buffer instance if it exists, undefined otherwise
     */
    getBuffer(bufferUse: BufferUseEnum, indexOfTheBufferLayer?: Index): Buffer | undefined;
    /**
     * Gets an existing buffer or creates a new one if it doesn't exist.
     * @param bufferUse - The type of buffer to retrieve or create
     * @param requireIndexOfTheBufferLayer - The index of the buffer layer to retrieve or create
     * @returns The Buffer instance (existing or newly created)
     */
    createOrGetBuffer(bufferUse: BufferUseEnum, requireIndexOfTheBufferLayer?: Index): Buffer;
    /**
     * Creates a buffer on-demand with custom size and alignment for a specific object.
     * @param bufferUse - The type of buffer to create
     * @param size - The size of the buffer in bytes
     * @param byteAlign - The byte alignment requirement for the buffer
     * @returns The newly created Buffer instance
     */
    createBufferOnDemand(bufferUse: BufferUseEnum, size: Byte, byteAlign: Byte): Buffer;
    /**
     * Gets the index of the active buffer layer for the specified buffer use type.
     * @param bufferUse - The type of buffer to get the active layer index of
     * @returns The index of the active buffer layer
     */
    getActiveBufferLayerIndexOfTheBufferUsage(bufferUse: BufferUseEnum): Index;
    /**
     * Gets the count of the buffer layers for the specified buffer use type.
     * @param bufferUse - The type of buffer to get the count of layers of
     * @returns The count of the buffer layers
     */
    getLayerCountOfTheBufferUsage(bufferUse: BufferUseEnum): Count;
    /**
     * Increments the count of the buffer layers for the specified buffer use type.
     * @param bufferUse - The type of buffer to increment the count of layers of
     */
    incrementCountOfTheBufferUsage(bufferUse: BufferUseEnum): void;
    /**
     * Gets the sizes of the buffers for the specified buffer use type.
     * @param bufferUse - The type of buffer to get the sizes of
     * @returns The sizes of the buffers in bytes
     */
    getSizesOfTheBuffers(bufferUse: BufferUseEnum): Byte[];
    getBuffers(bufferUse: BufferUseEnum): Buffer[];
    /**
     * Gets the byte offset of the existing buffers for the specified buffer use type and index of the buffer layer.
     * @param bufferUse - The type of buffer to get the byte offset of
     * @param indexOfTheBufferLayer - The index of the buffer layer to get the byte offset of
     * @returns The byte offset of the existing buffers in bytes
     */
    getByteOffsetOfExistingBuffers(bufferUse: BufferUseEnum, indexOfTheBufferLayer: Index): Byte;
    /**
     * Prints memory usage statistics for all managed buffers to the console.
     * Shows used bytes, total bytes, and usage percentage for each buffer type.
     */
    printMemoryUsage(): void;
    /**
     * Dumps the contents of a buffer to a downloadable file for debugging purposes.
     * @param bufferUse - The type of buffer to dump
     */
    dumpBuffer(bufferUse: BufferUseEnum): void;
    /**
     * Destroys all allocated buffers and clears internal state.
     *
     * @remarks
     * This method clears all buffer maps and resets the buffer usage counters.
     * After calling this method, the MemoryManager should not be used.
     */
    destroy(): void;
}

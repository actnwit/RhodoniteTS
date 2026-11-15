import type { WebGLContextWrapper } from './WebGLContextWrapper';
/**
 * Engine-wide CPU tables for WebGL multi-draw instance identity.
 *
 * The tables are stored in the renderer's data texture (RGBA32F, texture unit 0) so
 * multi-draw does not consume additional texture units:
 * - SID region: one RGBA texel per stable slot `[componentSID, skeletalSID, blendShapeSID, 0]`
 * - remap region: four packed entries per RGBA texel
 *
 * IDs are written as float32, which represents integers exactly up to 2^24. Component
 * SIDs stay far below that limit in practice.
 */
export declare class InstanceSidTable {
    private __records;
    private __remap;
    private __capacity;
    private __usedEnd;
    private __freeRanges;
    private __sidDirty;
    private __remapDirty;
    private __isSupported;
    constructor(glw: WebGLContextWrapper);
    /**
     * Whether the instance tables are usable in this context. The tables live in the
     * data texture, so WebGL2 (the data texture mode) is the only requirement.
     */
    static isSupported(glw: WebGLContextWrapper): boolean;
    get isSupported(): boolean;
    /** The number of stable slots that have been handed out. */
    get usedEnd(): number;
    get sidDirty(): boolean;
    get remapDirty(): boolean;
    /**
     * Allocates a contiguous range of stable instance slots.
     * Existing ranges are never moved.
     */
    allocate(count: number): number;
    /** Releases a range so that it can be reused by a later allocation. */
    free(base: number, count: number): void;
    /** Writes one instance identity record. */
    setRecord(index: number, componentSID: number, skeletalSID: number, blendShapeSID: number): void;
    /** Resets the remap entries of a range to the identity mapping. */
    writeIdentityRemap(base: number, count: number): void;
    /** Gets the SID components of a stable slot (for tests and debugging). */
    getRecord(index: number): [number, number, number];
    /** Gets a remap entry (for tests and debugging). */
    getRemapValue(index: number): number;
    /** Sets a remap entry: packed index -> local stable index. */
    setRemap(packedIndex: number, localIndex: number): void;
    /** Marks both tables as changed without touching individual entries. */
    markAllDirty(): void;
    /** Clears the dirty flag of the SID region after it has been uploaded. */
    clearSidDirty(): void;
    /** Clears the dirty flag of the remap region after it has been uploaded. */
    clearRemapDirty(): void;
    /**
     * Writes `count` SID texels starting at `texelOffset` into a data-texture upload
     * buffer as RGBA float texels. The `0xFFFFFFFF` invalid sentinel is stored as -1
     * because float32 cannot represent 0xFFFFFFFF exactly; the shader converts the
     * components through ivec4 so the bit pattern round-trips.
     */
    writeSidTexels(dst: Float32Array, texelOffset: number, count: number): void;
    private __toSidFloat;
    /**
     * Writes `count` remap texels (four packed entries per texel) starting at
     * `texelOffset` into a data-texture upload buffer.
     */
    writeRemapTexels(dst: Float32Array, texelOffset: number, count: number): void;
    private __ensureCapacity;
}

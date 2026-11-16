/**
 * Types for the shader parameter debugger.
 *
 * The debugger reports, for each shader semantic, both the CPU-side value and the
 * location/value the shader will read from the WebGL2 data texture or the WebGPU
 * storage buffer.
 */
export type ShaderParameterBackend = 'WebGL2' | 'WebGPU' | 'None';
export type ShaderParameterSource = 'dataTexture' | 'storageBuffer' | 'uniform' | 'texture' | 'soloDatum';
/** One raw vec4 value (a texel in WebGL2, a storage-buffer vec4 in WebGPU). */
export type RawVec4 = [number, number, number, number];
/**
 * Location of a value inside the GPU data buffer.
 *
 * `vec4Index` is the global vec4 index the shader computes (or the base vec4 index for
 * scalar-unaligned fetches). `byteOffset` is `vec4Index * 16`. `row` and `col` are the
 * data-texture coordinates in WebGL2 and are `-1` in WebGPU, which has no texture rows.
 */
export type BufferLocation = {
    bufferViewIndex: number;
    vec4Index: number;
    byteOffset: number;
    row: number;
    col: number;
    fetchFunction: string;
    vec4s: RawVec4[];
    scalarIndex?: number;
    arrayElement?: number;
    warnings: string[];
};
export type BufferLocationInfo = {
    bufferViewOffsets: number[];
    bufferViewIndex: number;
    indexInBufferView: number;
    arrayLengthForShader: number;
    locations: BufferLocation[];
};
export type RealUniformInfo = {
    locationFound: boolean;
    value: unknown;
};
export type TextureBindingInfo = {
    /** WebGL2 sampler unit. Null in WebGPU. */
    unit: number | null;
    /** WebGL2 sampler unit / WebGPU bind-group binding. */
    binding: number | null;
    textureUid: number | null;
    samplerUid: number | null;
};
export type ShaderParameterEntry = {
    semantic: string;
    stage: string;
    compositionType: string;
    componentType: string;
    arrayLength?: number;
    isTexture: boolean;
    isInternalSetting: boolean;
    needUniformInDataTextureMode: boolean;
    soloDatum: boolean;
    source: ShaderParameterSource;
    /** Serializable preview of the CPU-side value. */
    valuePreview: unknown;
    buffer?: BufferLocationInfo;
    realUniform?: RealUniformInfo;
    texture?: TextureBindingInfo;
};
export type MaterialParameterReport = {
    available: boolean;
    reason?: string;
    backend: ShaderParameterBackend;
    processApproach: string;
    materialTypeName: string;
    materialUID: number;
    materialSID: number;
    materialCountPerBufferView: number;
    bufferViewIndex: number;
    shaderProgramUid: number;
    /** Data-texture width in WebGL2. Zero in WebGPU. */
    bufferWidth: number;
    /**
     * True when the shader program was last used with another material. Uniform values
     * are per program (last-set state), so `realUniform.value` may belong to that material.
     */
    sharedProgramMaterialMismatch: boolean;
    entries: ShaderParameterEntry[];
};
export type GlobalParameterReport = {
    available: boolean;
    reason?: string;
    backend: ShaderParameterBackend;
    processApproach: string;
    /** Data-texture width in WebGL2. Zero in WebGPU. */
    bufferWidth: number;
    shaderProgramUid: number;
    entries: ShaderParameterEntry[];
};
export type ComponentParameterReport = {
    available: boolean;
    reason?: string;
    backend: ShaderParameterBackend;
    componentClassName: string;
    componentSID: number;
    componentCountPerBufferView: number;
    entries: ShaderParameterEntry[];
};
export type EntityParameterReport = {
    entityUID: number;
    materials: MaterialParameterReport[];
    components: ComponentParameterReport[];
};
export type AllParameterReport = {
    globals: GlobalParameterReport;
    materials: MaterialParameterReport[];
};

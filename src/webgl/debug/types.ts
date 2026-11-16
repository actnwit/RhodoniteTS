/**
 * Types for the shader parameter debugger.
 *
 * The debugger reports, for each shader semantic, both the CPU-side value and the
 * location/value the shader will read from the data texture (or from a real uniform).
 */

export type ShaderParameterSource = 'dataTexture' | 'uniform' | 'texture' | 'soloDatum';

/** One RGBA32F texel. */
export type Texel = [number, number, number, number];

/**
 * Location of a value inside the data texture.
 *
 * `vec4Index` is the global texel index the shader computes (or the base texel for
 * scalar-unaligned fetches). `scalarIndex` is reported for fetches that use a
 * scalar-unaligned helper such as `fetchVec3No16BytesAligned`.
 */
export type TexelLocation = {
  bufferViewIndex: number;
  vec4Index: number;
  row: number;
  col: number;
  fetchFunction: string;
  texels: Texel[];
  scalarIndex?: number;
  arrayElement?: number;
  warnings: string[];
};

export type DataTextureLocationInfo = {
  bufferViewOffsets: number[];
  bufferViewIndex: number;
  indexInBufferView: number;
  arrayLengthForShader: number;
  locations: TexelLocation[];
};

export type RealUniformInfo = {
  locationFound: boolean;
  value: unknown;
};

export type TextureBindingInfo = {
  unit: number | null;
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
  dataTexture?: DataTextureLocationInfo;
  realUniform?: RealUniformInfo;
  texture?: TextureBindingInfo;
};

export type MaterialParameterReport = {
  available: boolean;
  reason?: string;
  processApproach: string;
  materialTypeName: string;
  materialUID: number;
  materialSID: number;
  materialCountPerBufferView: number;
  bufferViewIndex: number;
  shaderProgramUid: number;
  dataTextureWidth: number;
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
  processApproach: string;
  dataTextureWidth: number;
  shaderProgramUid: number;
  entries: ShaderParameterEntry[];
};

export type ComponentParameterReport = {
  available: boolean;
  reason?: string;
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

export type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array |
Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

export type TypedArrayConstructor = Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor | Int16ArrayConstructor |
Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor;

export type Index = number;
export type Size = number;
export type Count = number;
export type Byte = number;

export type ObjectUID = number;
export type PrimitiveUID = number;
export type EntityUID = number;
export type ComponentTID = number;
export type ComponentSID = number;

export type MaterialUID = number;
export type MaterialNodeUID = number;
export type TextureUID = number;
export type MeshUID = number;

export type WebGLResourceHandle = number;

export type CGAPIResourceHandle = WebGLResourceHandle;

export type RnTags = {[s:string]: string};

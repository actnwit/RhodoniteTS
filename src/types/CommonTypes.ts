export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;
export type FloatTypedArray = Float32Array | Float64Array;
export type IntegerTypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array;
export type ArrayType = TypedArray | Array<number>;

export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

export type FloatTypedArrayConstructor =
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

export type Array4<T> = [T, T, T, T];
export type Array3<T> = [T, T, T];
export type Array2<T> = [T, T];
export type Array1<T> = [T];
export type Array1to4<T> = Array1<T> | Array2<T> | Array3<T> | Array4<T>;
export type Index = number;
export type IndexOf16Bytes = number;
export type IndexOf4Bytes = number;
export type Size = number;
export type Count = number;
export type Byte = number;
export type Second = number;
export type MilliSecond = number;

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

export type RnTags = {[s: string]: string};

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
export type IntegerTypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array;
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

export type FloatTypedArrayConstructor = Float32ArrayConstructor | Float64ArrayConstructor;

export type Array16<T> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];
export type Array9<T> = [T, T, T, T, T, T, T, T, T];
export type primitives = number | string | boolean | null | undefined;

export type Array4<T> = [T, T, T, T];
export type Array3<T> = [T, T, T];
export type Array2<T> = [T, T];
export type Array1<T> = [T];
export type Array1to4<T> = Array1<T> | Array2<T> | Array3<T> | Array4<T>;
export type VectorComponentN = 1 | 2 | 3 | 4;
export type VectorAndSquareMatrixComponentN = 1 | 2 | 3 | 4 | 9 | 16;
export type SquareMatrixComponentN = 4 | 9 | 16;
export type Index = number;
export type IndexOf16Bytes = number;
export type IndexOf4Bytes = number;
export type Offset = number;
export type Size = number;
export type Count = number;
export type Byte = number;
export type Second = number;
export type MilliSecond = number;

export type ObjectUID = Index;
export type PrimitiveUID = Index;
export type EntityUID = Index;
export type ComponentTID = Index;
export type ComponentSID = Index;

export type MaterialNodeUID = Index;
export type MaterialUID = Index; // a unique number of any Material
export type MaterialSID = Index; // a serial number in the Material Type
export type MaterialTID = Index; // a type number of the Material Type
export type TextureUID = Index;
export type MeshUID = Index;
export type CameraSID = Index;
export type RenderPassUID = Index;

export type WebGLResourceHandle = number;
export type WebGPUResourceHandle = number;

export type CGAPIResourceHandle = WebGLResourceHandle;

export type RnTags = { [s: string]: any };

export type ColorComponentLetter = 'r' | 'g' | 'b' | 'a';

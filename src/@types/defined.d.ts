type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array |
Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

type TypedArrayConstructor = Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor | Int16ArrayConstructor |
Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor;

type Index = number;
type Size = number;
type Count = number;
type Byte = number;

type ObjectUID = number;
type PrimitiveUID = number;
type EntityUID = number;
type ComponentTID = number;
type ComponentSID = number;

type MaterialUID = number;
type MaterialNodeUID = number;
type TextureUID = number;

type WebGLResourceHandle = number;

type CGAPIResourceHandle = WebGLResourceHandle;

type RnTags = {[s:string]: string};

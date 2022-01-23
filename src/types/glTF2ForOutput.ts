import {
  Gltf2BufferView,
  Gltf2Accessor,
  Gltf2,
  Gltf2Buffer,
  Gltf2Mesh,
  Gltf2Material,
} from './glTF2';

export interface Gltf2BufferViewEx extends Gltf2BufferView {
  buffer: number;
  byteOffset: number;
  extras: {
    uint8Array: Uint8Array;
  };
}

export interface Gltf2AccessorEx extends Gltf2Accessor {
  extras: {
    uint8Array: Uint8Array;
  };
}

export interface Gltf2Ex extends Gltf2 {
  asset: {
    version: string;
    generator: string;
  };
  buffers: Gltf2Buffer[];
  bufferViews: Gltf2BufferView[];
  accessors: Gltf2Accessor[];
  meshes: Gltf2Mesh[];
  materials: Gltf2Material[];
}

import {ISkeletalEntity} from '../foundation/helpers/EntityHelper';
import Texture from '../foundation/textures/Texture';
import { Byte, Index } from './CommonTypes';
import {
  Gltf2BufferView,
  Gltf2Accessor,
  Gltf2,
  Gltf2Buffer,
  Gltf2Mesh,
  Gltf2Material,
  Gltf2Animation,
  Gltf2Skin,
  Gltf2PbrMetallicRoughness,
  Gltf2TextureInfo,
  Gltf2Image,
  Gltf2Texture,
  Gltf2TextureSampler,
} from './glTF2';

export interface Gltf2BufferViewEx extends Gltf2BufferView {
  buffer: number;
  byteOffset: number;
  extras: {
    uint8Array?: Uint8Array;
  };
}

export interface Gltf2AccessorEx extends Gltf2Accessor {
  extras: {
    uint8Array?: Uint8Array;
  };
}

export interface Gltf2MaterialEx extends Gltf2Material {
  pbrMetallicRoughness: Gltf2PbrMetallicRoughnessEx;
}
export interface Gltf2ImageEx extends Gltf2Image {
  rnTextureUID?: Index;
}

export interface Gltf2PbrMetallicRoughnessEx extends Gltf2PbrMetallicRoughness {
  diffuseColorTexture?: Gltf2TextureInfo;
}

export interface Gltf2Ex extends Gltf2 {
  asset: {
    version: string;
    generator: string;
  };
  buffers: Gltf2Buffer[];
  bufferViews: Gltf2BufferViewEx[];
  accessors: Gltf2AccessorEx[];
  meshes: Gltf2Mesh[];
  materials: Gltf2Material[];
  animations: Gltf2Animation[];
  textures: Gltf2Texture[];
  images: Gltf2ImageEx[];
  skins: Gltf2Skin[];
  samplers: Gltf2TextureSampler[];
  extras: {
    rnSkins: ISkeletalEntity[];
    bufferViewByteLengthAccumulatedArray: Byte[];
    // bufferViewByteLengthAccumulatedArray[0] for buffer 0
    // bufferViewByteLengthAccumulatedArray[1] for buffer 1
    // ...
  };
}

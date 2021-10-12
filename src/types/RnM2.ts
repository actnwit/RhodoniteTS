import Entity from '../foundation/core/Entity';
import RnPromise from '../foundation/misc/RnPromise';
import {Array3, Index, TypedArray} from './CommonTypes';
import {ShaderSemanticsEnum} from '../foundation/definitions/ShaderSemantics';
import CameraComponent from '../foundation/components/CameraComponent';
import Material from '../foundation/materials/core/Material';
import Expression from '../foundation/renderer/Expression';
import ILoaderExtension from '../foundation/importer/ILoaderExtension';
import Accessor from '../foundation/memory/Accessor';
import { GltfLoadOption } from '..';

export type RnM2Scene = {
  name?: string;
  scene?: number;
  nodes?: number[];
  extensions: any;
  extras: {
    nodes: RnM2Node[];
    scene: RnM2Node;
  };
};

export type AttributeName =
  | 'POSITION'
  | 'NORMAL'
  | 'TANGENT'
  | 'TEXCOORD_0'
  | 'TEXCOORD_1'
  | 'COLOR_0'
  | 'JOINTS_0'
  | 'WEIGHTS_0';

export type RnM2Attribute = {[s: string]: number};
export type RnM2AttributeAccessor = {[s: string]: RnM2Accessor};
export type RnM2AttributeBlendShape = RnM2Attribute;
export type RnM2AttributeBlendShapeAccessor = RnM2AttributeAccessor;

export type RnM2Primitive = {
  attributes?: RnM2Attribute;
  indices?: number;
  material?: number;
  mode?: number;
  targets?: RnM2AttributeBlendShape;
  extensions?: any;
  extras: {
    attributes: RnM2AttributeAccessor;
    indices: RnM2Accessor;
    material: RnM2Material;
    targets: RnM2AttributeBlendShapeAccessor;
  };
};

export type RnM2Mesh = {
  primitives: RnM2Primitive[];
  weights?: number[];
  name?: string;
  extensions: any;
  extras?: any;
};

export type RnM2Node = {
  camera?: number;
  children?: number[];
  skin?: number;
  matrix?: number[];
  mesh?: number;
  meshNames?: string[];
  rotation?: number[];
  scale?: number[];
  translation?: number[];
  weights?: number[];
  name?: string;
  extensions?: any;
  extras: {
    camera: RnM2Camera;
    children: RnM2Node[];
    skin: RnM2Skin;
    mesh: RnM2Mesh;
  };
};

export type RnM2Skin = {
  inverseBindMatrices?: number;
  bindShapeMatrix?: number[];
  skeleton?: number;
  joints: number[];
  name?: string;
  extensions?: any;
  extras: {
    inverseBindMatrices: RnM2Accessor;
    skeleton?: RnM2Node;
    joints: RnM2Node[];
  };
};

export type RnM2TextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnM2Texture;
  extensions?: any;
  extras?: any;
};

export type RnM2OcclusionTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnM2Texture;
  strength?: number;
  extensions?: any;
  extras?: any;
};

export type RnM2NormalTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnM2Texture;
  scale?: number;
  extensions?: any;
  extras?: any;
};

export type RnM2PbrMetallicRoughness = {
  baseColorFactor?: number[];
  baseColorTexture?: RnM2TextureInfo;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: RnM2TextureInfo;
  extensions?: any;
  extras?: any;
};

export type RnM2Material = {
  pbrMetallicRoughness?: RnM2PbrMetallicRoughness;
  normalTexture?: RnM2NormalTextureInfo;
  occlusionTexture?: RnM2OcclusionTextureInfo;
  emissiveTexture?: RnM2TextureInfo;
  emissiveFactor?: number[];
  alphaMode?: string;
  alphaCutoff?: number;
  doubleSided?: boolean;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnM2CameraOrthographic = {
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
  extensions?: any;
  extras?: any;
};

export type RnM2CameraPerspective = {
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
  extensions?: any;
  extras?: any;
};

export type RnM2Camera = {
  orthographic?: RnM2CameraOrthographic;
  perspective?: RnM2CameraPerspective;
  type: string;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnM2Image = {
  uri?: string;
  mimeType?: string;
  bufferView?: number;
  image?: HTMLImageElement;
  basis?: Uint8Array;
  ktx2?: Uint8Array;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type PathType = 'translation' | 'rotation' | 'scale' | 'weights';

export type RnM2AnimationChannelTarget = {
  node?: number;
  path: PathType;
  extensions?: any;
  extras: {
    node?: RnM2Node;
  };
};

export type RnM2AnimationChannel = {
  sampler: number;
  target: RnM2AnimationChannelTarget;
  extensions?: any;
  extras: {
    sampler: RnM2AnimationSampler;
  };
};

export type RnM2AnimationSampler = {
  input: number;
  output: number;
  interpolation?: string;
  extensions?: any;
  extras: {
    input: RnM2Accessor;
    output: RnM2Accessor;
  };
};

export type RnM2Animation = {
  channels: RnM2AnimationChannel[];
  samplers: RnM2AnimationSampler[];
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnM2Texture = {
  sampler?: number;
  source?: number;
  image?: RnM2Image;
  name?: string;
  extensions?: any;
  extras: {
    sampler: RnM2TextureSampler;
    source: RnM2Image;
  }
};

export type RnM2TextureSampler = {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnM2SparseValues = {
  bufferView: number;
  byteOffset?: number;
  extensions?: any;
  extras: {
    bufferView: RnM2BufferView;
  };
};

export type RnM2SparseIndices = {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  extensions?: any;
  extras: {
    bufferView: RnM2BufferView;
  };
};

export type RnM2Sparse = {
  count: number;
  indices?: RnM2SparseIndices;
  values?: RnM2SparseValues;
  extensions?: any;
  extras?: any;
};

export type RnM2Accessor = {
  bufferView?: number;
  byteOffset?: number;
  byteStride?: number; // for glTF1 only
  componentType: number;
  normalized?: boolean;
  count: number;
  type: string;
  max?: number[];
  min?: number[];
  sparse?: RnM2Sparse;
  name?: string;
  accessor?: Accessor;
  extensions?: any;
  extras?: {
    bufferView?: RnM2BufferView;
    attributeName: string;
    toGetAsTypedArray: boolean;
    typedDataArray?: Float32Array;
    componentN?: number;
    componentBytes?: number;
    dataViewMethod?: string;
    weightsArrayLength?: number;
    quaternionIfVec4?: boolean;
  };
};

export type RnM2Buffer = {
  uri?: string;
  byteLength: number;
  buffer?: Uint8Array; // Uint8Array is needed insted of ArrayBuffer, because it may have non-zero byteoffset for .glb file header
  dataUri?: string;
  bufferPromise?: RnPromise<ArrayBuffer>;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnM2BufferView = {
  buffer?: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target: number;
  name?: string;
  extensions?: any;
  extras: {
    buffer?: RnM2Buffer;
  };
};

export type RnM2 = {
  asset: {
    extras?: {
      rnLoaderOptions?: GltfLoadOption;
      rnEntities?: Entity[];
      rnMaterials?: {[s: string]: Material};
      version?: string;
      fileType?: string;
    };
    version: string;
  };
  buffers: RnM2Buffer[];
  scenes: RnM2Scene[];
  scene: number;
  meshes: RnM2Mesh[];
  nodes: RnM2Node[];
  skins: RnM2Skin[];
  materials: RnM2Material[];
  cameras: RnM2Camera[];
  images: RnM2Image[];
  animations: RnM2Animation[];
  textures?: RnM2Texture[];
  samplers: RnM2TextureSampler[];
  accessors: RnM2Accessor[];
  bufferViews: RnM2BufferView[];
  extensionsUsed?: string[];
  extensions?: any;
};

export type PointType = 'directional' | 'point' | 'spot';

export type KHR_lights_punctual_Light = {
  color: Array3<number>;
  type: PointType;
  name?: string;
  intensity?: number;
  range: number;
};

export type KHR_lights_punctual = {
  lights: KHR_lights_punctual_Light[];
};

export type GltfFileBuffers = {
  [s: string]: ArrayBuffer;
  //        "foo.gltf": content of file as ArrayBuffer,
  //        "foo.bin": content of file as ArrayBuffer,
  //        "boo.png": content of file as ArrayBuffer
};

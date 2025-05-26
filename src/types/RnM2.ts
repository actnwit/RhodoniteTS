import { RnPromise } from '../foundation/misc/RnPromise';
import { Array3, Array4 } from './CommonTypes';
import { Material } from '../foundation/materials/core/Material';
import { Accessor } from '../foundation/memory/Accessor';
import { Gltf2AnimationSamplerInterpolation, Gltf2AnyObject, Gltf2Mesh, Gltf2Node, Gltf2Primitive, Gltf2Scene, GltfLoadOption } from './glTF2';
import { ISceneGraphEntity } from '../foundation/helpers/EntityHelper';

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-gltf
export type RnM2 = {
  extensionsUsed: string[];
  extensionsRequired: string[];
  accessors: RnM2Accessor[];
  animations: RnM2Animation[];
  asset: RnM2Asset;
  buffers: RnM2Buffer[];
  bufferViews: RnM2BufferView[];
  cameras: RnM2Camera[];
  images: RnM2Image[];
  materials: RnM2Material[];
  meshes: RnM2Mesh[];
  nodes: RnM2Node[];
  samplers: RnM2TextureSampler[];
  scene: number;
  scenes: RnM2Scene[];
  skins: RnM2Skin[];
  textures: RnM2Texture[];
  extensions: Gltf2AnyObject;
  extras: {
    rnEntities: ISceneGraphEntity[];
    rnEntitiesByNames: Map<string, ISceneGraphEntity>;
    [key: string]: any;
  };
};

export interface RnM2Scene extends Gltf2Scene {
  nodesObjects?: RnM2Node[];
  sceneObject?: RnM2Node;
};

export type RnM2AttributesObject = {
  [s: string]: RnM2Accessor;
};

export type RnM2Attributes = { [s: string]: number };
export type RnM2AttributeAccessors = { [s: string]: RnM2Accessor };
export type RnM2AttributeBlendShapes = RnM2Attributes[];
export type RnM2AttributeBlendShapesAccessors = RnM2AttributeAccessors[];

export type RnM2MaterialVariant = {
  materialObject: RnM2Material;
  material: number;
  variants: string[];
};

export interface RnM2Primitive extends Gltf2Primitive {
  attributesObjects?: RnM2AttributeAccessors;
  attributesNames?: { [s: string]: string };
  indicesObject?: RnM2Accessor;
  materialObject?: RnM2Material;
  materialVariants?: RnM2MaterialVariant[];
  materialName?: string;
  targetsObjects?: RnM2AttributeBlendShapesAccessors;
  targets?: RnM2AttributeBlendShapes;
};

export interface RnM2Mesh extends Gltf2Mesh {
  primitives: RnM2Primitive[];
};

export interface RnM2Node extends Gltf2Node {
  cameraObject?: RnM2Camera;
  childrenObjects?: RnM2Node[];
  parent?: number;
  parentObject?: RnM2Node;
  skinObject?: RnM2Skin;
  skinName?: string;
  meshObject?: RnM2Mesh;
  meshNames?: string[];
};

export type RnM2Skin = {
  inverseBindMatrices?: number;
  inverseBindMatricesObject?: RnM2Accessor;
  bindShapeMatrix?: number[];
  skeleton?: number;
  skeletonObject?: RnM2Node;
  joints: number[];
  jointsObjects: RnM2Node[];
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2TextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnM2Texture;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2OcclusionTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnM2Texture;
  strength?: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2NormalTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnM2Texture;
  scale?: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2PbrMetallicRoughness = {
  baseColorFactor?: Array4<number>;
  baseColorTexture?: RnM2TextureInfo;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: RnM2TextureInfo;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export interface RnM2Material {
  pbrMetallicRoughness?: RnM2PbrMetallicRoughness;
  normalTexture?: RnM2NormalTextureInfo;
  occlusionTexture?: RnM2OcclusionTextureInfo;
  emissiveTexture?: RnM2TextureInfo;
  emissiveFactor?: Array3<number>;
  alphaMode?: string;
  alphaCutoff?: number;
  doubleSided?: boolean;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
}

export type RnM2CameraOrthographic = {
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2CameraPerspective = {
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2Camera = {
  orthographic?: RnM2CameraOrthographic;
  perspective?: RnM2CameraPerspective;
  type: string;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2Image = {
  uri?: string;
  mimeType?: string;
  bufferView?: number;
  image?: HTMLImageElement;
  basis?: Uint8Array;
  ktx2?: Uint8Array;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type PathType = 'translation' | 'rotation' | 'scale' | 'weights' | 'pointer';

export type RnM2AnimationChannelTarget = {
  nodeObject?: RnM2Node;
  node?: number;
  path: PathType;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2AnimationChannel = {
  sampler: number;
  target: RnM2AnimationChannelTarget;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;

  // RnM2 Properties
  samplerObject?: RnM2AnimationSampler;
};

export type RnM2AnimationSampler = {
  input: number;
  output: number;
  interpolation?: Gltf2AnimationSamplerInterpolation;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;

  // RnM2 Properties
  inputObject?: RnM2Accessor;
  outputObject?: RnM2Accessor;
};

export type RnM2Animation = {
  channels: RnM2AnimationChannel[];
  samplers: RnM2AnimationSampler[];
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;

  // RnM2 Properties
  parameters: { [s: string]: any };
};

export type RnM2Texture = {
  samplerObject?: RnM2TextureSampler;
  sampler?: number;
  sourceObject?: RnM2Image;
  source?: number;
  image?: RnM2Image;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2TextureSampler = {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2SparseValues = {
  bufferView: number;
  bufferViewObject: RnM2BufferView;
  byteOffset?: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2SparseIndices = {
  bufferView: number;
  bufferViewObject: RnM2BufferView;
  byteOffset?: number;
  componentType: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2Sparse = {
  count: number;
  indices?: RnM2SparseIndices;
  values?: RnM2SparseValues;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2Accessor = {
  bufferViewObject?: RnM2BufferView;
  bufferView?: number;
  bufferViewName?: string;
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
  extensions?: Gltf2AnyObject;
  extras?: {
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
  buffer?: Uint8Array; // Uint8Array is needed instead of ArrayBuffer, because it may have non-zero byteoffset for .glb file header
  dataUri?: string;
  bufferPromise?: RnPromise<ArrayBuffer>;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2BufferView = {
  bufferObject?: RnM2Buffer;
  buffer?: number;
  bufferName?: string;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target: number;
  name?: string;
  rnAccessor?: Accessor;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2Asset = {
  copyright?: string;
  generator?: string;
  version: string;
  minVersion?: string;
  extensions?: object;
  extras?: {
    rnLoaderOptions?: GltfLoadOption;
    rnEntities?: ISceneGraphEntity[];
    rnMaterials?: { [s: string]: Material };
    version?: string;
    fileType?: string;
  };
};

export type RnM2ExtensionEffekseer = {
  effects: RnM2ExtensionsEffekseerEffect[];
};

export type RnM2ExtensionsEffekseerEffect = {
  node: number;
  name?: string;
  uri?: string;
  bufferView?: number;
  timelines?: RnM2ExtensionsEffekseerTimeline[];
};

export type RnM2ExtensionsEffekseerTimeline = {
  name?: string;
  values: RnM2ExtensionsEffekseerTimelineItem[];
};

export type RnM2ExtensionsEffekseerTimelineItem = {
  input: number;
  event: 'play' | 'stop' | 'pause';
};

export type RnM2Sampler = {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

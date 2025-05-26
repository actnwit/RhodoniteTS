import { RnPromise } from '../foundation/misc/RnPromise';
import { Array3, Array4 } from './CommonTypes';
import { Material } from '../foundation/materials/core/Material';
import { Accessor } from '../foundation/memory/Accessor';
import { Gltf2Accessor, Gltf2Animation, Gltf2AnimationChannel, Gltf2AnimationChannelTarget, Gltf2AnimationPathName, Gltf2AnimationSampler, Gltf2AnimationSamplerInterpolation, Gltf2AnyObject, Gltf2Asset, Gltf2Buffer, Gltf2BufferView, Gltf2Camera, Gltf2CameraOrthographic, Gltf2CameraPerspective, Gltf2Image, Gltf2Material, Gltf2Mesh, Gltf2Node, Gltf2NormalTextureInfo, Gltf2OcclusionTextureInfo, Gltf2PbrMetallicRoughness, Gltf2Primitive, Gltf2Scene, Gltf2Skin, Gltf2Sparse, Gltf2SparseIndices, Gltf2SparseValues, Gltf2Texture, Gltf2TextureInfo, Gltf2TextureSampler, GltfLoadOption } from './glTF2';
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

export interface RnM2Skin extends Gltf2Skin {
  inverseBindMatricesObject?: RnM2Accessor;
  skeletonObject?: RnM2Node;
  jointsObjects: RnM2Node[];
};

export interface RnM2TextureInfo extends Gltf2TextureInfo {
  texture?: RnM2Texture;
};

export interface RnM2OcclusionTextureInfo extends Gltf2OcclusionTextureInfo {
  texture?: RnM2Texture;
};

export interface RnM2NormalTextureInfo extends Gltf2NormalTextureInfo {
  texture?: RnM2Texture;
};

export interface RnM2PbrMetallicRoughness extends Gltf2PbrMetallicRoughness {
  baseColorTexture?: RnM2TextureInfo;
  metallicRoughnessTexture?: RnM2TextureInfo;
};

export interface RnM2Material extends Gltf2Material {
  pbrMetallicRoughness?: RnM2PbrMetallicRoughness;
  normalTexture?: RnM2NormalTextureInfo;
  occlusionTexture?: RnM2OcclusionTextureInfo;
  emissiveTexture?: RnM2TextureInfo;
}

export interface RnM2CameraOrthographic extends Gltf2CameraOrthographic {
};

export interface RnM2CameraPerspective extends Gltf2CameraPerspective {
};

export interface RnM2Camera extends Gltf2Camera {
}

export interface RnM2Image extends Gltf2Image {
};

export interface RnM2AnimationChannelTarget extends Gltf2AnimationChannelTarget {
  nodeObject?: RnM2Node;
};

export interface RnM2AnimationChannel extends Gltf2AnimationChannel {
  target: RnM2AnimationChannelTarget;
  samplerObject?: RnM2AnimationSampler;
};

export interface RnM2AnimationSampler extends Gltf2AnimationSampler {
  inputObject?: RnM2Accessor;
  outputObject?: RnM2Accessor;
};

export interface RnM2Animation extends Gltf2Animation {
  channels: RnM2AnimationChannel[];
  samplers: RnM2AnimationSampler[];
  parameters: { [s: string]: any };
};

export interface RnM2Texture extends Gltf2Texture {
  samplerObject?: RnM2TextureSampler;
  sourceObject?: RnM2Image;
};

export interface RnM2TextureSampler extends Gltf2TextureSampler {
};

export interface RnM2SparseValues extends Gltf2SparseValues {
  bufferViewObject: RnM2BufferView;
};

export interface RnM2SparseIndices extends Gltf2SparseIndices {
  bufferViewObject: RnM2BufferView;
};

export interface RnM2Sparse extends Gltf2Sparse {
  indices?: RnM2SparseIndices;
  values?: RnM2SparseValues;
};

export interface RnM2Accessor extends Gltf2Accessor {
  bufferViewObject?: RnM2BufferView;
  bufferViewName?: string;
  sparse?: RnM2Sparse;
  accessor?: Accessor;
  extras?: {
    typedDataArray?: Float32Array;
    componentN?: number;
    componentBytes?: number;
    dataViewMethod?: string;
    weightsArrayLength?: number;
    quaternionIfVec4?: boolean;
  };
};

export interface RnM2Buffer extends Gltf2Buffer {
  bufferPromise?: RnPromise<ArrayBuffer>;
};

export interface RnM2BufferView extends Gltf2BufferView {
  bufferObject?: RnM2Buffer;
  bufferName?: string;
  rnAccessor?: Accessor;
};

export interface RnM2Asset extends Gltf2Asset {
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

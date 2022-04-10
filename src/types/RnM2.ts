import { Entity } from '../foundation/core/Entity';
import {RnPromise} from '../foundation/misc/RnPromise';
import {Array3, Array4, Index} from './CommonTypes';
import {ShaderSemanticsEnum} from '../foundation/definitions/ShaderSemantics';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import Material from '../foundation/materials/core/Material';
import Expression from '../foundation/renderer/Expression';
import ILoaderExtension from '../foundation/importer/ILoaderExtension';
import Accessor from '../foundation/memory/Accessor';
import {Gltf2AnimationSamplerInterpolation, Gltf2AnyObject} from './glTF2';
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
  textures?: RnM2Texture[];
  extensions: Gltf2AnyObject;
  extras: Gltf2AnyObject;
};

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-scene
export type RnM2Scene = {
  nodesObjects?: RnM2Node[];
  name?: string;
  scene?: number;
  sceneObject?: RnM2Node;
  nodes?: number[];
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type RnM2AttributesObject = {
  [s: string]: RnM2Accessor;
};

export type RnM2Attributes = {[s: string]: number};
export type RnM2AttributeAccessors = {[s: string]: RnM2Accessor};
export type RnM2AttributeBlendShapes = RnM2Attributes[];
export type RnM2AttributeBlendShapesAccessors = RnM2AttributeAccessors[];

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-mesh-primitive
export type RnM2Primitive = {
  attributesObjects?: RnM2AttributeAccessors;
  attributesNames?: {[s: string]: string};
  attributes?: {[s: string]: number};
  indicesObject?: RnM2Accessor;
  indices?: number;
  materialObject?: RnM2Material;
  material?: number;
  materialName?: string;
  mode?: number;
  targetsObjects?: RnM2AttributeBlendShapesAccessors;
  targets?: RnM2AttributeBlendShapes;
  extensions: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-mesh
export type RnM2Mesh = {
  primitives: RnM2Primitive[];
  weights?: number[];
  name?: string;
  extensions: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-node
export type RnM2Node = {
  cameraObject?: RnM2Camera;
  camera?: number;
  childrenObjects?: RnM2Node[];
  children?: number[];
  skinObject?: RnM2Skin;
  skin?: number;
  skinName?: string;
  matrix?: number[];
  meshObject?: RnM2Mesh;
  mesh?: number;
  meshNames?: string[];
  rotation?: number[];
  scale?: number[];
  translation?: number[];
  weights?: number[];
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
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

export type RnM2Material = {
  pbrMetallicRoughness?: RnM2PbrMetallicRoughness;
  normalTexture?: RnM2NormalTextureInfo;
  occlusionTexture?: RnM2OcclusionTextureInfo;
  emissiveTexture?: RnM2TextureInfo;
  emissiveFactor?: number[];
  diffuseTexture?: RnM2TextureInfo;
  diffuseColorFactor?: number[];
  alphaMode?: string;
  alphaCutoff?: number;
  doubleSided?: boolean;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

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

export type PathType = 'translation' | 'rotation' | 'scale' | 'weights';

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
  parameters: {[s: string]: any};
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
    rnMaterials?: {[s: string]: Material};
    version?: string;
    fileType?: string;
  };
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

export type RnM2ExtensionEffekseer = {
  effects: RnM2ExtensionsEffekseerEffect[];
};

export type RnM2ExtensionsEffekseerEffect = {
  node: number;
  name?: string;
  uri?: string;
  bufferView?: number;
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

export type GltfLoadOption = {
  files?: GltfFileBuffers;
  loaderExtensionName?: string;
  loaderExtension?: ILoaderExtension;
  defaultMaterialHelperName?: string;
  defaultMaterialHelperArgumentArray?: any[];
  statesOfElements?: [
    {
      targets: any[]; //["name_foo", "name_boo"],
      states: {
        enable: any[];
        // 3042,  // BLEND
        functions: object; //"blendFuncSeparate": [1, 0, 1, 0],
      };
      isTransparent: boolean;
      opacity: number;
      isTextureImageToLoadPreMultipliedAlpha: boolean;
    }
  ];
  alphaMode?: string;
  ignoreLists?: [];
  autoDetectTextureTransparency?: boolean;
  autoResizeTexture?: boolean;
  tangentCalculationMode?: Index;
  extendedJson?: string | Object | ArrayBuffer; //   URI string / JSON Object / ArrayBuffer
  isImportVRM?: boolean;
  maxMorphTargetNumber?: number;
  defaultTextures?: {
    basePath: string; // e.g. "./assets/jpg/"
    textureInfos: {
      shaderSemantics: ShaderSemanticsEnum;
      fileName: string;
      image?: RnM2Image;
      sampler?: RnM2Sampler;
    }[];
  };
  cameraComponent?: CameraComponent;
  fileType?: string;
  expression?: Expression; // If specified, GltfImporter set render passes including loaded model to this expression
};

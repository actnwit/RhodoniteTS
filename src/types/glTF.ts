import Entity from '../foundation/core/Entity';
import RnPromise from '../foundation/misc/RnPromise';
import {Array4, Index} from './CommonTypes';
import {ShaderSemanticsEnum} from '../foundation/definitions/ShaderSemantics';
import CameraComponent from '../foundation/components/CameraComponent';
import Material from '../foundation/materials/core/Material';
import Expression from '../foundation/renderer/Expression';
import ILoaderExtension from '../foundation/importer/ILoaderExtension';
import Accessor from '../foundation/memory/Accessor';

export type Gltf2Scene = {
  nodes?: any[];
  name?: string;
  sceneIndex?: number;
  nodesIndices?: number[];
  extensions: any;
  extras?: any;
};

export type Gltf2Attributes = {
  [s: string]: Gltf2Accessor;
};

export type Gltf2Primitive = {
  attributes: Gltf2Attributes;
  attributesIndex?: any;
  indices?: any;
  indicesIndex?: number;
  material?: any;
  materialIndex?: number;
  mode?: number;
  targets?: any[];
  targetIndices?: any;
  extensions?: any;
  extras?: any;
};

export type Gltf2Mesh = {
  primitives: Gltf2Primitive[];
  weights?: number[];
  name?: string;
  extensions: any;
  extras?: any;
};

export type Gltf2Node = {
  camera?: any;
  cameraIndex?: number;
  children?: any[];
  childrenIndices?: number[];
  skin?: number;
  skinObject?: Gltf2Skin;
  matrix?: number[];
  mesh?: any;
  meshIndex?: number;
  meshNames?: string[];
  rotation?: number[];
  scale?: number[];
  translation?: number[];
  weights?: number[];
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2Skin = {
  inverseBindMatrices?: number;
  inverseBindMatricesObject?: Gltf2Accessor;
  bindShapeMatrix?: number[];
  skeleton?: number;
  skeletonObject?: Gltf2Node;
  joints: number[];
  jointsObjects: Gltf2Node[];
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2TextureInfo = {
  index: number;
  texCoord?: number;
  texture?: any;
  extensions?: any;
  extras?: any;
};

export type Gltf2OcclusionTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: any;
  strength?: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2NormalTextureInfo = {
  index: number;
  image?: any;
  texCoord?: number;
  texture?: any;
  scale?: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2PbrMetallicRoughness = {
  baseColorFactor?: Array4<number>;
  baseColorTexture?: Gltf2TextureInfo;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: Gltf2TextureInfo;
  extensions?: any;
  extras?: any;
};

export type Gltf2Material = {
  pbrMetallicRoughness?: any;
  normalTexture?: Gltf2NormalTextureInfo;
  occlusionTexture?: Gltf2OcclusionTextureInfo;
  emissiveTexture?: Gltf2TextureInfo;
  emissiveFactor?: number[];
  alphaMode?: string;
  alphaCutoff?: number;
  doubleSided?: boolean;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2CameraOrthographic = {
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2CameraPerspective = {
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2Camera = {
  orthographic?: Gltf2CameraOrthographic;
  perspective?: Gltf2CameraPerspective;
  type: string;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2Image = {
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

export type Gltf2AnimationChannelTarget = {
  node?: any;
  nodeIndex?: number;
  path: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2AnimationChannel = {
  sampler: any;
  samplerIndex?: number;
  target: Gltf2AnimationChannelTarget;
  extensions?: any;
  extras?: any;
};

export type Gltf2AnimationSampler = {
  input: Gltf2Accessor;
  interpolation?: string;
  output: Gltf2Accessor;
  extensions?: any;
  extras?: any;
};

export type Gltf2Animation = {
  channels: Gltf2AnimationChannel[];
  samplers: Gltf2AnimationSampler[];
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2Texture = {
  samplerObject?: Gltf2Sampler;
  sampler?: number;
  source?: any;
  sourceIndex?: number;
  image?: Gltf2Image;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2Sampler = {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2SparseValues = {
  bufferView: number;
  byteOffset?: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2SparseIndices = {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2Sparse = {
  count: number;
  indices?: Gltf2SparseIndices;
  values?: Gltf2SparseValues;
  extensions?: any;
  extras?: any;
};

export type Gltf2Accessor = {
  bufferViewObject?: Gltf2BufferView;
  bufferView?: number;
  byteOffset?: number;
  byteStride?: number; // for glTF1 only
  componentType: number;
  normalized?: boolean;
  count: number;
  type: string;
  max?: number[];
  min?: number[];
  sparse?: any;
  name?: string;
  accessor?: Accessor;
  extensions?: any;
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

export type Gltf2Buffer = {
  uri?: string;
  byteLength: number;
  buffer?: Uint8Array; // Uint8Array is needed insted of ArrayBuffer, because it may have non-zero byteoffset for .glb file header
  dataUri?: string;
  bufferPromise?: RnPromise<ArrayBuffer>;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2BufferView = {
  buffer: Gltf2Buffer;
  bufferIndex?: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target: number;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type glTF2 = {
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
  buffers: Gltf2Buffer[];
  scenes: Gltf2Scene[];
  scene: number;
  meshes: Gltf2Mesh[];
  nodes: Gltf2Node[];
  skins: Gltf2Skin[];
  materials: Gltf2Material[];
  cameras: Gltf2Camera[];
  images: Gltf2Image[];
  animations: Gltf2Animation[];
  textures?: Gltf2Texture[];
  samplers: Gltf2Sampler[];
  accessors: Gltf2Accessor[];
  bufferViews: Gltf2BufferView[];
  extensionsUsed?: string[];
  extensions?: any;
};

export type glTF1 = {
  asset: {
    extras?: {
      rnLoaderOptions?: {[s: string]: any};
      version?: string;
      fileType?: string;
    };
  };
  buffers: any[];
  bufferDic: object;

  scenes: any[];
  sceneDic: object;

  meshes: any[];
  meshDic: object;

  nodesIndices: number[];
  nodes: any[];
  nodeDic: object;

  skins: any[];
  skinDic: object;

  materials: any[];
  materialDic: object;

  cameras: any[];
  cameraDic: object;

  shaders: any[];
  shaderDic: object;

  images: any[];
  imageDic: object;

  animations: Array<{
    channels: any[];
    samplers: any[];
  }>;

  animationDic: {
    [s: string]: {
      channels: any[];
      samplers: any[];
    };
  };

  textures: any[];
  textureDic: object;

  samplers: any[];
  samplerDic: object;

  accessors: any[];
  accessorDic: object;

  bufferViews: any[];
  bufferViewDic: object;

  buffer: any[];
  techniques: any[];
};

export type GltfFileBuffers = {
  [s: string]: ArrayBuffer;
  //        "foo.gltf": content of file as ArrayBuffer,
  //        "foo.bin": content of file as ArrayBuffer,
  //        "boo.png": content of file as ArrayBuffer
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
  isPreComputeForRayCastPickingEnable?: boolean;
  extendedJson?: string | Object | ArrayBuffer; //   URI string / JSON Object / ArrayBuffer
  isImportVRM?: boolean;
  maxMorphTargetNumber?: number;
  defaultTextures?: {
    basePath: string; // e.g. "./assets/jpg/"
    textureInfos: {
      shaderSemantics: ShaderSemanticsEnum;
      fileName: string;
      image?: Gltf2Image;
      sampler?: Gltf2Sampler;
    }[];
  };
  cameraComponent?: CameraComponent;
  fileType?: string;
  expression?: Expression; // If specified, GltfImporter set render passes including loaded model to this expression
};

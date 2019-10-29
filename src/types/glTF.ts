import Entity from "../foundation/core/Entity";
import RnPromise from "../foundation/misc/RnPromise";
import { Index } from "./CommonTypes";
import { ShaderSemanticsEnum } from "../foundation/definitions/ShaderSemantics";
import CameraComponent from "../foundation/components/CameraComponent";

export type Gltf2Scene = {
  nodes?: any[],
  name?: string,
  sceneIndex?: number,
  nodesIndices?: number[],
  extensions: any,
  extras?: any
}

export type Gltf2Attribute = {
  POSITION: number,
  NORMAL?: number,
  TANGENT?: number,
  TEXCOORD_0?: number,
  TEXCOORD_1?: number,
  COLOR_0?: number,
  JOINTS_0?: number,
  WEIGHTS_0?: number
}

export type Gltf2Primitive = {
  attributes: Gltf2Attribute,
  attributesIndex?: any
  indices?: any,
  indicesIndex?: number,
  material?: any,
  materialIndex?: number,
  mode?: number,
  targets?: any[],
  targetIndices?: any
  extensions?: any,
  extras?: any
}

export type Gltf2Mesh = {
  primitives: Gltf2Primitive[],
  weights?: number[],
  name?: string,
  extensions: any,
  extras?: any
}

export type Gltf2Node = {
  camera?: any,
  cameraIndex?: number,
  children?: any[],
  childrenIndices?: number[]
  skin?: any,
  skinIndex?: any,
  matrix?: number[],
  mesh?: any,
  meshIndex?: number,
  meshNames?: string[],
  rotation?: number[],
  scale?: number[],
  translation?: number[],
  weights?: number[],
  name?: string,
  extensions?: any,
  extras?: any
}

export type Gltf2Skin = {
  inverseBindMatrices?: any,
  inverseBindMatricesIndex?: number,
  skeleton?: any,
  skeletonIndex?: number,
  joints: any[],
  jointsIndices: number[],
  name?: string,
  extensions?: any,
  extras?: any
}

export type Gltf2TextureInfo = {
  index: number,
  texCoord?: number,
  texture?: any,
  extensions?: any,
  extras?: any
}

export type Gltf2OcclusionTextureInfo = {
  index: number,
  texCoord?: number,
  texture?: any,
  strength?: number,
  extensions?: any,
  extras?: any
}


export type Gltf2NormalTextureInfo = {
  index: number,
  image?: any,
  texCoord?: number,
  texture?: any,
  scale?: number,
  extensions?: any,
  extras?: any
}

export type Gltf2PbrMetallicRoughness = {
  baseColorFactor?: number[],
  baseColorTexture?: Gltf2TextureInfo,
  metallicFactor?: number,
  roughnessFactor?: number,
  metallicRoughnessTexture?: Gltf2TextureInfo,
  extensions?: any,
  extras?: any
}

export type Gltf2Material = {
  pbrMetallicRoughness?: any,
  normalTexture?: Gltf2NormalTextureInfo,
  occlusionTexture?: Gltf2OcclusionTextureInfo,
  emissiveTexture?: Gltf2TextureInfo,
  emissiveFactor?: number[],
  alphaMode?: string,
  alphaCutoff?: number,
  doubleSided?: boolean,
  name?: string,
  extensions?: any,
  extras?: any
}

export type Gltf2CameraOrthographic = {
  xmag: number,
  ymag: number,
  zfar: number,
  znear: number,
  extensions?: any,
  extras?: any
}

export type Gltf2CameraPerspective = {
  aspectRatio?: number,
  yfov: number,
  zfar?: number,
  znear: number,
  extensions?: any,
  extras?: any
}


export type Gltf2Camera = {
  orthographic?: Gltf2CameraOrthographic,
  perspective?: Gltf2CameraPerspective,
  type: string,
  name?: string,
  extensions?: any,
  extras?: any
}

export type Gltf2Image = {
  uri?: string,
  mimeType?: string,
  bufferView?: number,
  image?: HTMLImageElement,
  name?: string,
  extensions?: any,
  extras?: any
}


export type Gltf2AnimationChannelTarget = {
  node?: any,
  nodeIndex?: number,
  path: string,
  extensions?: any,
  extras?: any
}

export type Gltf2AnimationChannel = {
  sampler: any,
  samplerIndex?: number,
  target: Gltf2AnimationChannelTarget,
  extensions?: any,
  extras?: any
}

export type Gltf2AnimationSampler = {
  input: number,
  interpolation?: string,
  output: number,
  extensions?: any,
  extras?: any
}

export type Gltf2Animation = {
  channels: Gltf2AnimationChannel[],
  samplers: Gltf2AnimationSampler[],
  name?: string,
  extensions?: any,
  extras?: any
}

export type Gltf2Texture = {
  sampler?: any,
  samplerIndex?: number,
  source?: any,
  sourceIndex?: number
  texture?: Gltf2Texture,
  image?: Gltf2Image,
  name?: string,
  extensions?: any,
  extras?: any
}

export type Gltf2Sampler = {
  magFilter?: number,
  minFilter?: number,
  wrapS?: number,
  wrapT?: number,
  name?: string,
  extensions?: any,
  extras?: any
}


export type Gltf2SparseValues = {
  bufferView: number,
  byteOffset?: number,
  extensions?: any,
  extras?: any
}


export type Gltf2SparseIndices = {
  bufferView: number,
  byteOffset?: number,
  componentType: number,
  extensions?: any,
  extras?: any
}

export type Gltf2Sparse = {
  count: number,
  indices?: Gltf2SparseIndices,
  values?: Gltf2SparseValues,
  extensions?: any,
  extras?: any
}

export type Gltf2Accessor = {
  bufferView?: any,
  bufferViewIndex?: number,
  byteOffset?: number,
  componentType: number,
  normalized?: boolean,
  count: number,
  type: string,
  max?: number[],
  min?: number[],
  sparse?: any,
  name?: string,
  extensions?: any,
  extras?: any
}

export type Gltf2BufferView = {
  buffer: any,
  bufferIndex?: number,
  byteOffset?: number,
  byteLength: number,
  byteStride?: boolean,
  target: number,
  name?: string,
  extensions?: any,
  extras?: any
}

export type Gltf2Buffer = {
  uri?: string,
  byteLength: number,
  buffer?: Uint8Array,
  bufferPromise?: RnPromise<ArrayBuffer>,
  name?: string,
  extensions?: any,
  extras?: any
}



export type glTF2 = {
  asset: {
    extras?: {
      rnLoaderOptions?: GltfLoadOption,
      rnEntities?: Entity[]
      basePath?: string,
      version?: string,
      fileType?: string,
    }
  },
  buffers: Gltf2Buffer[],
  scenes: Gltf2Scene[],
  scene: number,
  meshes: Gltf2Mesh[],
  nodes: Gltf2Node[],
  skins: Gltf2Skin[],
  materials: Gltf2Material[],
  cameras: Gltf2Camera[],
  images: Gltf2Image[],
  animations: Gltf2Animation[],
  textures?: Gltf2Texture[],
  samplers: Gltf2Sampler[],
  accessors: Gltf2Accessor[],
  bufferViews: Gltf2BufferView[],
  extensionsUsed?: string[],
  extensions?: any
};

export type glTF1 = {
  asset: {
    extras?: {
      rnLoaderOptions?: { [s: string]: any },
      basePath?: string,
      version?: string,
      fileType?: string,
    }
  },
  buffers: any[],
  bufferDic: Object,

  scenes: any[],
  sceneDic: Object,

  meshes: any[],
  meshDic: Object,

  nodesIndices: number[],
  nodes: any[],
  nodeDic: Object,

  skins: any[],
  skinDic: Object,

  materials: any[],
  materialDic: Object,

  cameras: any[],
  cameraDic: Object,

  shaders: any[],
  shaderDic: Object,

  images: any[],
  imageDic: Object,

  animations: Array<{
    channels: any[],
    samplers: any[]
  }>,

  animationDic: {
    [s: string]: {
      channels: any[],
      samplers: any[]
    }
  },

  textures: any[],
  textureDic: Object,

  samplers: any[],
  samplerDic: Object,

  accessors: any[],
  accessorDic: Object,

  bufferViews: any[],
  bufferViewDic: Object,

  buffer: any[],
  techniques: any[]
};

export type GltfLoadOption = {
  files: {
    [s: string]: ArrayBuffer
    //        "foo.gltf": content of file as ArrayBuffer,
    //        "foo.bin": content of file as ArrayBuffer,
    //        "boo.png": content of file as ArrayBuffer
  },
  loaderExtension: any,
  defaultMaterialHelperName: string | null,
  defaultMaterialHelperArgumentArray: any[],
  statesOfElements: [
    {
      targets: any[], //["name_foo", "name_boo"],
      states: {
        enable: any[
        // 3042,  // BLEND
        ],
        functions: Object //"blendFuncSeparate": [1, 0, 1, 0],
      },
      isTransparent: boolean,
      opacity: number,
      isTextureImageToLoadPreMultipliedAlpha: boolean,
    }
  ],
  alphaMode?: string,
  ignoreLists?: [],
  autoDetectTextureTransparency?: boolean,
  autoResizeTexture?: boolean,
  tangentCalculationMode?: Index,
  isPrecomputeForRayCastPickingEnable?: boolean,
  extendedJson?: string | Object | ArrayBuffer, //   URI string / JSON Object / ArrayBuffer
  isImportVRM?: boolean,
  maxMorphTargetNumber?: number,
  defaultTextures?: {
    basePath: string, // e.g. "./assets/jpg/"
    textureInfos: {
      shaderSemantics: ShaderSemanticsEnum,
      fileName: string
      image?: Gltf2Image,
    }[]
  },
  cameraComponent?: CameraComponent
}

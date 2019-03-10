type glTF2 = {
  asset: {
    extras?: {
      loadOptions?:{[s:string]: any},
      basePath?: string
    }
  },
  buffers: any[],
  scenes: any[],
  meshes: any[],
  nodes: any[],
  skins: any[],
  materials: any[],
  cameras: any[],
  shaders?: any[],
  images: any[],
  animations: Array<{
    channels: any[],
    samplers: any[]
  }>,
  textures: any[],
  samplers: any[],
  accessors: any[],
  bufferViews: any[],
  buffer: any[]
};

type glTF1 = {
  asset: {
    extras?: {
      loadOptions?:{[s:string]: any},
      basePath?: string
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
    [s:string]: {
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

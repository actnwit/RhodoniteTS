export type glTF1 = {
  asset: {
    extras?: {
      rnLoaderOptions?: {[s: string]: object};
      version?: string;
      fileType?: string;
    };
  };
  buffers: {[s: string]: object};
  bufferDic: Object;

  scenes: {[s: string]: object};
  sceneDic: Object;

  meshes: {[s: string]: object};
  meshDic: Object;

  nodesIndices: number[];
  nodes: {[s: string]: object};
  nodeDic: Object;

  skins: {[s: string]: object};
  skinDic: Object;

  materials: {[s: string]: object};
  materialDic: Object;

  cameras: {[s: string]: object};
  cameraDic: Object;

  shaders: {[s: string]: object};
  shaderDic: Object;

  images: {[s: string]: object};
  imageDic: Object;

  animations: Array<{
    channels: {[s: string]: object};
    samplers: {[s: string]: object};
  }>;

  animationDic: {
    [s: string]: {
      channels: {[s: string]: object};
      samplers: {[s: string]: object};
    };
  };

  textures: {[s: string]: object};
  textureDic: Object;

  samplers: {[s: string]: object};
  samplerDic: Object;

  accessors: {[s: string]: object};
  accessorDic: Object;

  bufferViews: {[s: string]: object};
  bufferViewDic: Object;

  buffer: {[s: string]: object};
  techniques: {[s: string]: object};
};

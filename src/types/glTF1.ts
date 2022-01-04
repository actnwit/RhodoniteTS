export type glTF1 = {
  asset: {
    extras?: {
      rnLoaderOptions?: {[s: string]: object};
      version?: string;
      fileType?: string;
    };
  };
  buffers: {[s: string]: object};
  bufferDic: object;

  scenes: {[s: string]: object};
  sceneDic: object;

  meshes: {[s: string]: object};
  meshDic: object;

  nodesIndices: number[];
  nodes: {[s: string]: object};
  nodeDic: object;

  skins: {[s: string]: object};
  skinDic: object;

  materials: {[s: string]: object};
  materialDic: object;

  cameras: {[s: string]: object};
  cameraDic: object;

  shaders: {[s: string]: object};
  shaderDic: object;

  images: {[s: string]: object};
  imageDic: object;

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
  textureDic: object;

  samplers: {[s: string]: object};
  samplerDic: object;

  accessors: {[s: string]: object};
  accessorDic: object;

  bufferViews: {[s: string]: object};
  bufferViewDic: object;

  buffer: {[s: string]: object};
  techniques: {[s: string]: object};
};

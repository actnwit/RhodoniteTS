export type Gltf1AnyObject = {
  [s: string]: any;
};

export type glTF1 = {
  asset: {
    extras?: {
      rnLoaderOptions?: any;
      version?: string;
      fileType?: string;
    };
  };
  buffers: any[];
  bufferDic: Gltf1AnyObject;

  scenes: any[];
  sceneDic: Gltf1AnyObject;

  meshes: any[];
  meshDic: Gltf1AnyObject;

  nodesIndices: number[];
  nodes: any[];
  nodeDic: Gltf1AnyObject;

  skins: any[];
  skinDic: Gltf1AnyObject;

  materials: any[];
  materialDic: Gltf1AnyObject;

  cameras: any[];
  cameraDic: Gltf1AnyObject;

  shaders: any[];
  shaderDic: Gltf1AnyObject;

  images: any[];
  imageDic: Gltf1AnyObject;

  animations: Array<{
    channels: any[];
    samplers: any[];
    parameters: Gltf1AnyObject;
  }>;

  animationDic: {
    [s: string]: {
      channels: any[];
      samplers: any[];
    };
  };

  textures: any[];
  textureDic: Gltf1AnyObject;

  samplers: any[];
  samplerDic: Gltf1AnyObject;

  accessors: any[];
  accessorDic: Gltf1AnyObject;

  bufferViews: any[];
  bufferViewDic: Gltf1AnyObject;

  buffer: any[];
  techniques: any[];
};

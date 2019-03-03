declare type GltfLoadOption = {
  files: {
    //        "foo.gltf": content of file as ArrayBuffer,
    //        "foo.bin": content of file as ArrayBuffer,
    //        "boo.png": content of file as ArrayBuffer
  },
  loaderExtension: any,
  defaultShaderClass: any,
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
  extendedJson?: string|Object|ArrayBuffer //   URI string / JSON Object / ArrayBuffer
}
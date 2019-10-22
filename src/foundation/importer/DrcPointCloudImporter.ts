import DataUtil from "../misc/DataUtil";
import Primitive from '../geometry/Primitive';
import MaterialHelper from "../helpers/MaterialHelper";
import { CompositionType, CompositionTypeEnum } from '../definitions/CompositionType';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute, VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from "../memory/Accessor";
import { TypedArray } from "../../types/CommonTypes";
import { glTF2, GltfLoadOption } from "../../types/glTF";

declare var DracoDecoderModule: any;

export default class DrcPointCloudImporter {
  private static __instance: DrcPointCloudImporter;

  private constructor() {
  }

  // for ModelConverter, mesh type is not support yet
  async importPointCloud(gltfUri: string, textureUri: string, options?: GltfLoadOption) {
    let defaultOptions: GltfLoadOption = {
      files: {
        //        "foo.gltf": content of file as ArrayBuffer,
        //        "foo.bin": content of file as ArrayBuffer,
        //        "boo.png": content of file as ArrayBuffer
      },
      loaderExtension: null,
      defaultMaterialHelperName: null,
      defaultMaterialHelperArgumentArray: [],
      statesOfElements: [
        {
          targets: [], //["name_foo", "name_boo"],
          states: {
            enable: [
              // 3042,  // BLEND
            ],
            functions: {
              //"blendFuncSeparate": [1, 0, 1, 0],
            }
          },
          isTransparent: true,
          opacity: 1.0,
          isTextureImageToLoadPreMultipliedAlpha: false,
        }
      ],
      extendedJson: void 0 //   URI string / JSON Object / ArrayBuffer
    };

    if (options && options.files) {
      for (let fileName in options.files) {
        const splitted = fileName.split('.');
        const fileExtension = splitted[splitted.length - 1];

        if (fileExtension === 'drc') {
          return await this.__decodeDraco((options.files as any)[fileName], defaultOptions, options, void 0, textureUri).catch((err) => {
            console.log('this.__decodeDraco error', err);
          });
        }
      }
    }

    let response: Response;
    try {
      response = await fetch(gltfUri);
    } catch (err) {
      throw new Error('this.__loadFromArrayBuffer: ' + err);
    };
    const arrayBuffer = await response.arrayBuffer();

    return await this.__decodeDraco(arrayBuffer, defaultOptions, options, gltfUri, textureUri).catch((err) => {
      console.log('this.__decodeDraco error', err);
    });

    // return await this.__loadFromArrayBuffer(arrayBuffer, options, defaultOptions, uri).catch((err) => {
    //   console.log('this.__loadFromArrayBuffer error', err);
    // });;

  }

  private async __decodeDraco(arrayBuffer: ArrayBuffer, defaultOptions: GltfLoadOption, options?: {}, gltfUri?: string, textureUri?: string) {
    let gotText: any;
    let gltfJson: any;
    await this.__decodeBuffer(arrayBuffer, textureUri).then(async (json: any) => {
      gotText = JSON.stringify(json);
      gltfJson = JSON.parse(gotText);
    });
    return await this._loadAsTextJson(gltfJson, options as GltfLoadOption, defaultOptions, gltfUri).catch((err) => {
      console.log('this.__loadAsTextJson error', err);
    });
  }

  private __decodeBuffer(arrayBuffer: ArrayBuffer, textureUri?: string) {
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.__getGeometryFromDracoBuffer(draco, decoder, arrayBuffer);
    if (dracoGeometry == null) {
      throw new Error('invalid dracoGeometry.');
    }
    if (dracoGeometry.geometryType !== draco.POINT_CLOUD) {
      throw new Error('invalid geometryType of drc file.');
    }

    const posAttId = decoder.GetAttributeId(dracoGeometry, draco.POSITION);
    if (posAttId === -1) {
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      throw new Error('Draco: No position attribute found.');
    }

    const geometryAttributes = ['POSITION', 'NORMAL', 'COLOR', 'TEX_COORD'];
    const numPoints = dracoGeometry.num_points();

    const attributeDataAll: any[] = [];
    const attributeComponents: number[] = [];
    let bufferLength = 0;
    for (let i = 0; i < geometryAttributes.length; i++) {
      const attId = decoder.GetAttributeId(dracoGeometry, draco[geometryAttributes[i]]);
      if (attId === -1) {
        geometryAttributes.splice(i, 1);
        i--;
        continue;
      }

      const attribute = decoder.GetAttribute(dracoGeometry, attId);
      const attributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, attributeData);
      attributeDataAll[i] = attributeData;

      let numComponent = attribute.num_components();
      attributeComponents[i] = numComponent;
      if (geometryAttributes[i] === 'COLOR') {
        bufferLength += numPoints * 4;
      } else {
        bufferLength += numPoints * numComponent;
      }
    }

    const buffer = new Float32Array(bufferLength);
    for (let i = 0, currentBufferindex = 0; i < geometryAttributes.length; i++) {
      if (geometryAttributes[i] === 'COLOR' && attributeComponents[i] === 3) {
        for (var j = 0; j < numPoints; currentBufferindex += 4, j += 3) {
          buffer[currentBufferindex] = attributeDataAll[i].GetValue(j);
          buffer[currentBufferindex + 1] = attributeDataAll[i].GetValue(j + 1);
          buffer[currentBufferindex + 2] = attributeDataAll[i].GetValue(j + 2);
          buffer[currentBufferindex + 3] = 1.0; // alpha value
        }
      } else if (geometryAttributes[i] === 'TEX_COORD') {
        for (var j = 0; j < numPoints; currentBufferindex += 2, j++) {
          buffer[currentBufferindex] = attributeDataAll[i].GetValue(2 * j);
          buffer[currentBufferindex + 1] = 1.0 - attributeDataAll[i].GetValue(2 * j + 1);
        }
      } else {
        for (var j = 0; j < numPoints * attributeComponents[i]; currentBufferindex++ , j++) {
          buffer[currentBufferindex] = attributeDataAll[i].GetValue(j);
        }
      }
      draco.destroy(attributeDataAll[i]);
    }
    draco.destroy(decoder);
    draco.destroy(dracoGeometry);

    return this.__decodedBufferToJSON(buffer, numPoints, geometryAttributes, attributeComponents, textureUri);
  }

  private async __decodedBufferToJSON(buffer: Float32Array, numPoints: number,
    geometryAttributes: string[], attributeComponents: number[], textureUri?: string) {
    let json: any = {
      "asset": {
        version: "2.0"
      },
      "nodes": [
        {
          "name": "Node",
          "mesh": 0
        }
      ],
      "scenes": [
        {
          "nodes": [
            0
          ]
        }
      ]
    };

    const mimeType = 'application/octet-stream';
    await this.__convertBufferToURI(buffer.buffer, mimeType).then((uri) => {
      json["buffers"] = [
        {
          "name": "input",
          "byteLength": buffer.byteLength,
          "uri": uri
        }
      ];
    }).catch((err) => {
      console.log('this.__convertBufferToURI error:', err);
    });

    const accessors: any = [];
    const bufferViews: any = [];

    let byteOffsetOfBufferView = 0;
    for (let i = 0, currentIndexOfBufferView = 0; i < geometryAttributes.length; currentIndexOfBufferView++) {
      const currentComponent = attributeComponents[i];
      const type = "VEC" + currentComponent;

      let byteOffsetOfAccessor = 0;
      while (i < geometryAttributes.length && currentComponent === attributeComponents[i]) {
        accessors.push({
          "name": "point-cloud_" + geometryAttributes[i].toLowerCase() + "s",
          "componentType": 5126, // 5126 is float
          "count": numPoints,
          "type": type,
          "bufferView": currentIndexOfBufferView,
          "byteOffset": byteOffsetOfAccessor
        });
        if (geometryAttributes[i] === 'COLOR') {
          byteOffsetOfAccessor += numPoints * 4 * 4;
        } else {
          byteOffsetOfAccessor += numPoints * attributeComponents[i] * 4;
        }
        i++;
      }

      bufferViews[currentIndexOfBufferView] = {
        "name": "bufferView_" + currentIndexOfBufferView,
        "buffer": 0,
        "byteLength": byteOffsetOfAccessor,
        "byteOffset": byteOffsetOfBufferView,
        "byteStride": currentComponent * 4,
        "target": 34962
      };
      byteOffsetOfBufferView += byteOffsetOfAccessor;

    }

    json["accessors"] = accessors;
    json["bufferViews"] = bufferViews;

    const mesh: any = {
      "name": "Node-Mesh",
      "primitives": [
        {
          "mode": 0
        }
      ]
    };

    const attributes: any = {};
    for (let i = 0; i < geometryAttributes.length; i++) {
      if (geometryAttributes[i] !== 'TEX_COORD') {
        attributes[geometryAttributes[i]] = i;
      } else {
        if (!textureUri) continue;

        attributes['TEXCOORD_0'] = i;

        try {
          let response: Response = await fetch(textureUri);
          const arrayBuffer = await response.arrayBuffer();
          const mimeType = 'image/jpeg';
          await this.__convertBufferToURI(arrayBuffer, mimeType).then((uri) => {
            json["images"] = [
              {
                "mimeType": mimeType,
                "uri": uri
              }
            ];

            json["textures"] = [
              {
                "source": 0
              }
            ];
            json["materials"] = [
              {
                "pbrMetallicRoughness": {
                  "baseColorTexture": {
                    "index": 0
                  },
                  "metallicFactor": 0
                }
              }
            ];
            mesh.primitives[0].material = 0;
          }).catch((err) => {
            console.log('this.__convertBufferToURI error:', err);
          });
        } catch (err) {
          throw new Error('jpg load error');
        };
      }
    }

    mesh.primitives[0].attributes = attributes;
    json["meshes"] = [mesh];


    return new Promise((resolve, reject) => {
      resolve(json);
    });
  }

  private __convertBufferToURI(arrayBuffer: ArrayBuffer, mimeType: string) {
    return new Promise((resolve, reject) => {
      var blob = new Blob([arrayBuffer], { type: mimeType });
      var fr = new FileReader();

      fr.onload = (event) => {
        resolve(fr.result!);
      };
      fr.onerror = (event) => {
        reject(fr.error);
      };
      fr.readAsDataURL(blob);
    });
  }

  async importDirect(uri: string, options: GltfLoadOption) {
    let defaultOptions: GltfLoadOption = {
      files: {
        //        "foo.gltf": content of file as ArrayBuffer,
        //        "foo.bin": content of file as ArrayBuffer,
        //        "boo.png": content of file as ArrayBuffer
      },
      loaderExtension: null,
      defaultMaterialHelperName: null,
      defaultMaterialHelperArgumentArray: [],
      statesOfElements: [
        {
          targets: [], //["name_foo", "name_boo"],
          states: {
            enable: [
              // 3042,  // BLEND
            ],
            functions: {
              //"blendFuncSeparate": [1, 0, 1, 0],
            }
          },
          isTransparent: true,
          opacity: 1.0,
          isTextureImageToLoadPreMultipliedAlpha: false,
        }
      ],
      extendedJson: void 0 //   URI string / JSON Object / ArrayBuffer
    };

    if (options && options.files) {
      for (let fileName in options.files) {
        const splitted = fileName.split('.');
        const fileExtension = splitted[splitted.length - 1];

        if (fileExtension === 'gltf' || fileExtension === 'glb') {
          return await this.__loadFromArrayBuffer((options.files as any)[fileName], options, defaultOptions, void 0).catch((err) => {
            console.log('this.__loadFromArrayBuffer error', err);
          });
        }
      }
    }

    let response: Response;
    try {
      response = await fetch(uri);
    } catch (err) {
      console.log('this.__loadFromArrayBuffer', err);
    };
    const arrayBuffer = await response!.arrayBuffer();

    return this.__decodeDracoDirect(arrayBuffer, options);

    // return await this.__loadFromArrayBuffer(arrayBuffer, options, defaultOptions, uri).catch((err) => {
    //   console.log('this.__loadFromArrayBuffer error', err);
    // });;

  }

  private __decodeDracoDirect(arrayBuffer: ArrayBuffer, options: GltfLoadOption) {
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.__getGeometryFromDracoBuffer(draco, decoder, arrayBuffer);
    if (dracoGeometry == null) {
      return void 0;
    }
    if (dracoGeometry.geometryType !== draco.POINT_CLOUD) {
      throw new Error('invalid geometryType of drc file.');
    }

    const attributeCompositionTypes: Array<CompositionTypeEnum> = [];
    const attributeSemantics: Array<VertexAttributeEnum> = [];
    const attributes: Array<TypedArray> = [];

    this.__getPositions(draco, decoder, dracoGeometry,
      attributeCompositionTypes, attributeSemantics, attributes);
    this.__getColors(draco, decoder, dracoGeometry,
      attributeCompositionTypes, attributeSemantics, attributes);
    this.__getNormals(draco, decoder, dracoGeometry,
      attributeCompositionTypes, attributeSemantics, attributes);

    //    const texcoord = this.__getTextures(draco, decoder, dracoGeometry);

    const primitive = Primitive.createPrimitive({
      attributeCompositionTypes: attributeCompositionTypes,
      attributeSemantics: attributeSemantics,
      attributes: attributes,
      material: MaterialHelper.createClassicUberMaterial({ isSkinning: false, isLighting: true }),
      primitiveMode: PrimitiveMode.Points
    });

    draco.destroy(decoder);
    draco.destroy(dracoGeometry);

    return new Promise((resolve, reject) => {
      resolve(primitive);
    });
  }

  private __getGeometryFromDracoBuffer(draco: any, decoder: any, arrayBuffer: ArrayBuffer) {
    const buffer = new draco.DecoderBuffer();
    buffer.Init(new Int8Array(arrayBuffer), arrayBuffer.byteLength);
    const geometryType = decoder.GetEncodedGeometryType(buffer);
    let dracoGeometry;
    let decodingStatus;
    if (geometryType === draco.TRIANGULAR_MESH) {
      dracoGeometry = new draco.Mesh();
      decodingStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
    } else if (geometryType === draco.POINT_CLOUD) {
      dracoGeometry = new draco.PointCloud();
      decodingStatus = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
    } else {
      const errorMsg = 'Unknown geometry type.';
      console.error(errorMsg);
    }

    dracoGeometry.geometryType = geometryType; // store

    if (!decodingStatus.ok() || dracoGeometry.ptr == 0) {
      let errorMsg = 'Decoding failed: ';
      errorMsg += decodingStatus.error_msg();
      console.error(errorMsg);
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      return void 0;
    }
    draco.destroy(buffer);

    return dracoGeometry;
  }

  private __getPositions(draco: any, decoder: any, dracoGeometry: any,
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeSemantics: Array<VertexAttributeEnum>,
    attributes: Array<TypedArray>
  ) {
    const posAttId = decoder.GetAttributeId(dracoGeometry, draco.POSITION);
    if (posAttId === -1) {
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      throw new Error('Draco: No position attribute found.');
    }

    const posAttribute = decoder.GetAttribute(dracoGeometry, posAttId);
    const posAttributeData = new draco.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(dracoGeometry, posAttribute, posAttributeData);

    const numPoints = dracoGeometry.num_points();
    const numVertces = numPoints * 3;
    const positions = new Float32Array(numVertces);

    for (var i = 0; i < numVertces; i += 1) {
      positions[i] = posAttributeData.GetValue(i);  // XYZ XYZ
    }

    attributeCompositionTypes.push(CompositionType.Vec3);
    attributeSemantics.push(VertexAttribute.Position);
    attributes.push(positions);

    draco.destroy(posAttributeData);
    return positions;
  }

  private __getColors(draco: any, decoder: any, dracoGeometry: any,
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeSemantics: Array<VertexAttributeEnum>,
    attributes: Array<TypedArray>
  ) {
    // Get color attributes if exists.
    const colorAttId = decoder.GetAttributeId(dracoGeometry, draco.COLOR);
    if (colorAttId === -1) {
      return null;
    } else {
      //console.log('Loaded color attribute.');

      const colAttribute = decoder.GetAttribute(dracoGeometry, colorAttId);
      const colAttributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(dracoGeometry, colAttribute, colAttributeData);

      const numPoints = dracoGeometry.num_points();
      const numComponents = colAttribute.num_components();
      const numVertces = numPoints * 4;
      const colors = new Float32Array(numVertces);
      for (let i = 0; i < numVertces; i += numComponents) {
        colors[i] = colAttributeData.GetValue(i);
        colors[i + 1] = colAttributeData.GetValue(i + 1);
        colors[i + 2] = colAttributeData.GetValue(i + 2);
        if (numComponents == 4) {
          colors[i + 3] = colAttributeData.GetValue(i + 3);
        } else {
          colors[i + 3] = 1.0;
        }
      }

      attributeCompositionTypes.push(CompositionType.Vec3);
      attributeSemantics.push(VertexAttribute.Color0);
      attributes.push(colors);

      draco.destroy(colAttributeData);
      return colors;
    }

  }

  private __getNormals(draco: any, decoder: any, dracoGeometry: any,
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeSemantics: Array<VertexAttributeEnum>,
    attributes: Array<TypedArray>
  ) {
    // Get normal attributes if exists.
    const normalAttId = decoder.GetAttributeId(dracoGeometry, draco.NORMAL);
    if (normalAttId === -1) {
      return null;
    } else {
      //console.log('Loaded normal attribute.');

      const norAttribute = decoder.GetAttribute(dracoGeometry, normalAttId);
      const norAttributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(dracoGeometry, norAttribute, norAttributeData);

      const numPoints = dracoGeometry.num_points();
      const numVertces = numPoints * 3;
      const normals = new Float32Array(numVertces);
      for (var i = 0; i < numVertces; i += 1) {
        normals[i] = norAttributeData.GetValue(i);  // XYZ XYZ
      }
      attributeCompositionTypes.push(CompositionType.Vec3);
      attributeSemantics.push(VertexAttribute.Normal);
      attributes.push(normals);

      draco.destroy(norAttributeData);
      return normals;
    }
  }

  private async __loadFromArrayBuffer(arrayBuffer: ArrayBuffer, options: {}, defaultOptions: GltfLoadOption, uri?: string) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const isLittleEndian = true;
    // Magic field
    const magic = dataView.getUint32(0, isLittleEndian);
    let result;
    // 0x46546C67 is 'glTF' in ASCII codes.
    if (magic !== 0x46546C67) {
      //const json = await response.json();
      const gotText = DataUtil.arrayBufferToString(arrayBuffer);
      const json = JSON.parse(gotText);
      result = await this._loadAsTextJson(json, options as GltfLoadOption, defaultOptions, uri).catch((err) => {
        console.log('this.__loadAsTextJson error', err);
      });
    }
    else {
      result = await this._loadAsBinaryJson(dataView, isLittleEndian, arrayBuffer, options as GltfLoadOption, defaultOptions, uri).catch((err) => {
        console.log('this.__loadAsBinaryJson error', err);
      });
    }
    return result;
  }

  _getOptions(defaultOptions: any, json: glTF2, options: any): GltfLoadOption {
    if (json.asset && json.asset.extras && json.asset.extras.rnLoaderOptions) {
      for (let optionName in json.asset.extras.rnLoaderOptions) {
        defaultOptions[optionName] = (json.asset.extras.rnLoaderOptions as any)[optionName];
      }
    }

    for (let optionName in options) {
      defaultOptions[optionName] = options[optionName];
    }

    return defaultOptions;
  }

  async _loadAsBinaryJson(dataView: DataView, isLittleEndian: boolean, arrayBuffer: ArrayBuffer, options: GltfLoadOption, defaultOptions: GltfLoadOption, uri?: string) {
    let gltfVer = dataView.getUint32(4, isLittleEndian);
    if (gltfVer !== 2) {
      throw new Error('invalid version field in this binary glTF file.');
    }
    let lengthOfThisFile = dataView.getUint32(8, isLittleEndian);
    let lengthOfJSonChunkData = dataView.getUint32(12, isLittleEndian);
    let chunkType = dataView.getUint32(16, isLittleEndian);
    // 0x4E4F534A means JSON format (0x4E4F534A is 'JSON' in ASCII codes)
    if (chunkType !== 0x4E4F534A) {
      throw new Error('invalid chunkType of chunk0 in this binary glTF file.');
    }
    let arrayBufferJSonContent = arrayBuffer.slice(20, 20 + lengthOfJSonChunkData);
    let gotText = DataUtil.arrayBufferToString(arrayBufferJSonContent);
    let gltfJson = JSON.parse(gotText);
    options = this._getOptions(defaultOptions, gltfJson, options);
    let arrayBufferBinary = arrayBuffer.slice(20 + lengthOfJSonChunkData + 8);

    let basePath = null;
    if (uri) {
      //Set the location of glb file as basePath
      basePath = uri.substring(0, uri.lastIndexOf('/')) + '/';
    }

    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = { fileType: "glTF", version: "2" };
    }
    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.basePath = basePath;

    let result: any;
    try {
      result = await this._loadInner(arrayBufferBinary, basePath!, gltfJson, options);
    } catch (err) {
      console.log("this._loadInner error in _loadAsBinaryJson", err);
    }
    return (result[0] as any)[0];
  }

  async _loadAsTextJson(gltfJson: glTF2, options: GltfLoadOption, defaultOptions: GltfLoadOption, uri?: string) {
    let basePath: string;
    if (uri) {
      //Set the location of gltf file as basePath
      basePath = uri.substring(0, uri.lastIndexOf('/')) + '/';
    }
    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = { fileType: "glTF", version: "2" };
    }

    options = this._getOptions(defaultOptions, gltfJson, options);

    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.basePath = basePath!;

    let result: any;
    try {
      result = await this._loadInner(undefined, basePath!, gltfJson, options);
    } catch (err) {
      console.log('this._loadInner error in _loadAsTextJson', err);
    }
    return (result[0] as any)[0];
  }

  _loadInner(arrayBufferBinary: ArrayBuffer | undefined, basePath: string, gltfJson: glTF2, options: GltfLoadOption) {
    let promises = [];

    let resources = {
      shaders: [],
      buffers: [],
      images: []
    };
    promises.push(this._loadResources(arrayBufferBinary!, basePath, gltfJson, options, resources));
    promises.push(new Promise((resolve, reject) => {
      this._loadJsonContent(gltfJson, options);
      resolve();
    }));

    return Promise.all(promises);
  }

  _loadJsonContent(gltfJson: glTF2, options: GltfLoadOption) {

    // Scene
    this._loadDependenciesOfScenes(gltfJson);

    // Node
    this._loadDependenciesOfNodes(gltfJson);

    // Mesh
    this._loadDependenciesOfMeshes(gltfJson);

    // Material
    this._loadDependenciesOfMaterials(gltfJson);

    // Texture
    this._loadDependenciesOfTextures(gltfJson);

    // Joint
    this._loadDependenciesOfJoints(gltfJson);

    // Animation
    this._loadDependenciesOfAnimations(gltfJson);

    // Accessor
    this._loadDependenciesOfAccessors(gltfJson);

    // BufferView
    this._loadDependenciesOfBufferViews(gltfJson);

    if (gltfJson.asset === void 0) {
      gltfJson.asset = {};
    }
    if (gltfJson.asset.extras === void 0) {
      gltfJson.asset.extras = {};
    }

  }

  _loadDependenciesOfScenes(gltfJson: glTF2) {
    for (let scene of gltfJson.scenes) {
      scene.nodesIndices = scene.nodes!.concat();
      for (let i in scene.nodesIndices) {
        scene.nodes![i] = gltfJson.nodes[scene.nodes![i]];
      }
    }
  }

  _loadDependenciesOfNodes(gltfJson: glTF2) {

    for (let node of gltfJson.nodes) {

      // Hierarchy
      if (node.children) {
        node.childrenIndices = node.children.concat();
        node.children = [];
        for (let i in node.childrenIndices) {
          node.children[i] = gltfJson.nodes[node.childrenIndices[i]];
        }
      }

      // Mesh
      if (node.mesh !== void 0 && gltfJson.meshes !== void 0) {
        node.meshIndex = node.mesh;
        node.mesh = gltfJson.meshes[node.meshIndex!];
      }

      // Skin
      if (node.skin !== void 0 && gltfJson.skins !== void 0) {
        node.skinIndex = node.skin;
        node.skin = gltfJson.skins[node.skinIndex];
        if (node.mesh.extras === void 0) {
          node.mesh.extras = {};
        }

        node.mesh.extras._skin = node.skin;
      }

      // Camera
      if (node.camera !== void 0 && gltfJson.cameras !== void 0) {
        node.cameraIndex = node.camera;
        node.camera = gltfJson.cameras[node.cameraIndex!];
      }

    }
  }

  _loadDependenciesOfMeshes(gltfJson: glTF2) {
    // Mesh
    for (let mesh of gltfJson.meshes) {
      for (let primitive of mesh.primitives) {
        if (primitive.material !== void 0) {
          primitive.materialIndex = primitive.material;
          primitive.material = gltfJson.materials[primitive.materialIndex!];
        }

        primitive.attributesIndex = Object.assign({}, primitive.attributes);
        for (let attributeName in primitive.attributesIndex) {
          if (primitive.attributesIndex[attributeName] >= 0) {
            let accessor = gltfJson.accessors[primitive.attributesIndex[attributeName]];
            accessor.extras = {
              toGetAsTypedArray: true,
              attributeName: attributeName
            };
            (primitive.attributes as any)[attributeName] = accessor;
          } else {
            (primitive.attributes as any)[attributeName] = void 0;
          }
        }

        if (primitive.indices != null) {
          primitive.indicesIndex = primitive.indices;
          primitive.indices = gltfJson.accessors[primitive.indicesIndex!];
        }

        if (primitive.targets != null) {
          primitive.targetIndices = primitive.targets;
          primitive.targets = [];
          for (let target of primitive.targetIndices) {
            const attributes = {};
            for (let attributeName in target) {
              if (target[attributeName] >= 0) {
                let accessor = gltfJson.accessors[target[attributeName]];
                accessor.extras = {
                  toGetAsTypedArray: true,
                  attributeName: attributeName
                };
                (attributes as any)[attributeName] = accessor;
              } else {
                (attributes as any)[attributeName] = void 0;
              }
            }
            primitive.targets.push(attributes);
          }
        }
      }
    }
  }

  _loadDependenciesOfMaterials(gltfJson: glTF2) {
    // Material
    if (gltfJson.materials) {
      for (let material of gltfJson.materials) {
        if (material.pbrMetallicRoughness) {
          let baseColorTexture = material.pbrMetallicRoughness.baseColorTexture;
          if (baseColorTexture !== void 0) {
            baseColorTexture.texture = gltfJson.textures[baseColorTexture.index];
          }
          let metallicRoughnessTexture = material.pbrMetallicRoughness.metallicRoughnessTexture;
          if (metallicRoughnessTexture !== void 0) {
            metallicRoughnessTexture.texture = gltfJson.textures[metallicRoughnessTexture.index];
          }
        }

        let normalTexture = material.normalTexture;
        if (normalTexture !== void 0) {
          normalTexture.texture = gltfJson.textures[normalTexture.index];
        }

        const occlusionTexture = material.occlusionTexture;
        if (occlusionTexture !== void 0) {
          occlusionTexture.texture = gltfJson.textures[occlusionTexture.index];
        }

        const emissiveTexture = material.emissiveTexture;
        if (emissiveTexture !== void 0) {
          emissiveTexture.texture = gltfJson.textures[emissiveTexture.index];
        }
      }
    }
  }

  _loadDependenciesOfTextures(gltfJson: glTF2) {
    // Texture
    if (gltfJson.textures) {
      for (let texture of gltfJson.textures) {
        if (texture.sampler !== void 0) {
          texture.samplerIndex = texture.sampler;
          texture.sampler = gltfJson.samplers[texture.samplerIndex!];
        }
        if (texture.source !== void 0) {
          texture.sourceIndex = texture.source;
          texture.image = gltfJson.images[texture.sourceIndex!];
        }
      }
    }
  }

  _loadDependenciesOfJoints(gltfJson: glTF2) {
    if (gltfJson.skins) {
      for (let skin of gltfJson.skins) {
        skin.skeletonIndex = skin.skeleton;
        skin.skeleton = gltfJson.nodes[skin.skeletonIndex!];

        skin.inverseBindMatricesIndex = skin.inverseBindMatrices;
        skin.inverseBindMatrices = gltfJson.accessors[skin.inverseBindMatricesIndex!];

        if (skin.skeleton == null) {
          skin.skeletonIndex = skin.joints[0];
          skin.skeleton = gltfJson.nodes[skin.skeletonIndex!];
        }

        skin.jointsIndices = skin.joints;
        skin.joints = [];
        for (let jointIndex of skin.jointsIndices) {
          skin.joints.push(gltfJson.nodes[jointIndex]);
        }
      }

    }
  }


  _loadDependenciesOfAnimations(gltfJson: glTF2) {
    if (gltfJson.animations) {
      for (let animation of gltfJson.animations) {
        for (let channel of animation.channels) {
          channel.samplerIndex = channel.sampler;
          channel.sampler = animation.samplers[channel.samplerIndex!];

          channel.target.nodeIndex = channel.target.node;
          channel.target.node = gltfJson.nodes[channel.target.nodeIndex!];
        }
        for (let channel of animation.channels) {
          channel.sampler.inputIndex = channel.sampler.input;
          channel.sampler.outputIndex = channel.sampler.output;
          channel.sampler.input = gltfJson.accessors[channel.sampler.inputIndex];
          channel.sampler.output = gltfJson.accessors[channel.sampler.outputIndex];
          if (channel.sampler.output.extras === void 0) {
            channel.sampler.output.extras = {};
          }
          if (channel.target.path === 'rotation') {
            channel.sampler.output.extras.quaternionIfVec4 = true;
          }
          if (channel.target.path === 'weights') {
            const weightCount = channel.sampler.output.count / channel.sampler.input.count
            channel.sampler.output.extras.weightCount = weightCount;
          }
        }
      }
    }
  }

  _loadDependenciesOfAccessors(gltfJson: glTF2) {
    // Accessor
    for (let accessor of gltfJson.accessors) {
      if (accessor.bufferView == null) {
        accessor.bufferView = 0;
      }
      accessor.bufferViewIndex = accessor.bufferView;
      accessor.bufferView = gltfJson.bufferViews[accessor.bufferViewIndex!];
    }
  }

  _loadDependenciesOfBufferViews(gltfJson: glTF2) {
    // BufferView
    for (let bufferView of gltfJson.bufferViews) {
      if (bufferView.buffer !== void 0) {
        bufferView.bufferIndex = bufferView.buffer;
        bufferView.buffer = gltfJson.buffers[bufferView.bufferIndex!];
      }
    }
  }

  _mergeExtendedJson(gltfJson: glTF2, extendedData: any) {
    let extendedJson = null;
    if (extendedData instanceof ArrayBuffer) {
      const extendedJsonStr = DataUtil.arrayBufferToString(extendedData);
      extendedJson = JSON.parse(extendedJsonStr);
    } else if (typeof extendedData === 'string') {
      extendedJson = JSON.parse(extendedData);
      extendedJson = extendedJson;
    } else if (typeof extendedData === 'object') {
      extendedJson = extendedData;
    } else {
    }

    Object.assign(gltfJson, extendedJson);
  }

  _loadResources(arrayBufferBinary: ArrayBuffer, basePath: string, gltfJson: glTF2, options: GltfLoadOption, resources: {
    shaders: any[],
    buffers: any[],
    images: any[]
  }) {
    let promisesToLoadResources = [];

    // Shaders Async load

    // for (let _i in gltfJson.shaders) {
    //   const i = _i as any as number;
    //   resources.shaders[i] = {};

    //   let shaderJson = gltfJson.shaders[i];
    //   let shaderType = shaderJson.type;
    //   if (typeof shaderJson.extensions !== 'undefined' && typeof shaderJson.extensions.KHR_binary_glTF !== 'undefined') {
    //     resources.shaders[i].shaderText = this._accessBinaryAsShader(shaderJson.extensions.KHR_binary_glTF.bufferView, gltfJson, arrayBufferBinary);
    //     resources.shaders[i].shaderType = shaderType;
    //     continue;
    //   }

    //   let shaderUri = shaderJson.uri;

    //   if (options.files) {
    //     const splitted = shaderUri.split('/');
    //     const filename = splitted[splitted.length - 1];
    //     if (options.files[filename]) {
    //       const arrayBuffer = options.files[filename];
    //       resources.shaders[i].shaderText = DataUtil.arrayBufferToString(arrayBuffer);
    //       resources.shaders[i].shaderType = shaderType;
    //       continue;
    //     }
    //   }

    //   if (shaderUri.match(/^data:/)) {
    //     promisesToLoadResources.push(
    //       new Promise((resolve, rejected) => {
    //         let arrayBuffer = DataUtil.dataUriToArrayBuffer(shaderUri);
    //         resources.shaders[i].shaderText = DataUtil.arrayBufferToString(arrayBuffer);
    //         resources.shaders[i].shaderType = shaderType;
    //         resolve();
    //       })
    //     );
    //   } else {
    //     shaderUri = basePath + shaderUri;
    //     promisesToLoadResources.push(
    //       DataUtil.loadResourceAsync(shaderUri, false,
    //         (resolve:Function, response:any)=>{
    //           resources.shaders[i].shaderText = response;
    //           resources.shaders[i].shaderType = shaderType;
    //           resolve(gltfJson);
    //         },
    //         (reject:Function, error:any)=>{

    //         }
    //       )
    //     );
    //   }
    // }

    // Buffers Async load
    for (let i in gltfJson.buffers) {
      let bufferInfo = gltfJson.buffers[i];

      let splitted: string[];
      let filename: string;
      if (bufferInfo.uri) {
        splitted = bufferInfo.uri.split('/');
        filename = splitted[splitted.length - 1];
      }
      if (typeof bufferInfo.uri === 'undefined') {
        promisesToLoadResources.push(
          new Promise((resolve, rejected) => {
            resources.buffers[i] = arrayBufferBinary;
            bufferInfo.buffer = arrayBufferBinary;
            resolve(gltfJson);
          }
          ));
      } else if (bufferInfo.uri.match(/^data:application\/(.*);base64,/)) {
        promisesToLoadResources.push(
          new Promise((resolve, rejected) => {
            let arrayBuffer = DataUtil.dataUriToArrayBuffer(bufferInfo.uri!);
            resources.buffers[i] = arrayBuffer;
            bufferInfo.buffer = arrayBuffer;
            resolve(gltfJson);
          })
        );
      } else if (options.files && options.files[filename!]) {
        promisesToLoadResources.push(
          new Promise((resolve, rejected) => {
            const arrayBuffer = options.files[filename];
            resources.buffers[i] = arrayBuffer;
            bufferInfo.buffer = arrayBuffer;
            resolve(gltfJson);
          }
          ));
      } else {
        promisesToLoadResources.push(
          DataUtil.loadResourceAsync(basePath + bufferInfo.uri, true,
            (resolve: Function, response: any) => {
              resources.buffers[i] = response;
              bufferInfo.buffer = response;
              resolve(gltfJson);
            },
            (reject: Function, error: any) => {

            }
          )
        );
      }
    }

    // Textures Async load
    for (let _i in gltfJson.images) {
      const i = _i as any as number;
      let imageJson = gltfJson.images[i];
      //let imageJson = gltfJson.images[textureJson.source];
      //let samplerJson = gltfJson.samplers[textureJson.sampler];

      let imageUri: string;

      if (typeof imageJson.uri === 'undefined') {
        imageUri = DataUtil.accessBinaryAsImage(imageJson.bufferView!, gltfJson, arrayBufferBinary, imageJson.mimeType!);
      } else {
        let imageFileStr = imageJson.uri;
        const splitted = imageFileStr.split('/');
        const filename = splitted[splitted.length - 1];
        if (options.files && options.files[filename]) {
          const arrayBuffer = options.files[filename];
          const splitted = filename.split('.');
          const fileExtension = splitted[splitted.length - 1];
          imageUri = DataUtil.accessArrayBufferAsImage(arrayBuffer, fileExtension);
        } else if (imageFileStr.match(/^data:/)) {
          imageUri = imageFileStr;
        } else {
          imageUri = basePath + imageFileStr;
        }
      }

      // if (options.extensionLoader && options.extensionLoader.setUVTransformToTexture) {
      //   options.extensionLoader.setUVTransformToTexture(texture, samplerJson);
      // }

      promisesToLoadResources.push(new Promise(async (resolve, reject) => {
        let img = new Image();
        img.crossOrigin = 'Anonymous';
        await DataUtil.imgLoad(img, imageUri);

        imageJson.image = img;
        resources.images[i] = img;
        if (imageUri.match(/^data:/)) {
          resolve(gltfJson);
        } else {
          const load = (img: HTMLImageElement, response: any) => {
            const bytes = new Uint8Array(response);
            const binaryData = DataUtil.uint8ArrayToStringInner(bytes);
            const split = imageUri.split('.');
            let ext = split[split.length - 1];
            img.src = DataUtil.getImageType(ext) + window.btoa(binaryData);
            img.name = (imageJson.name) ? imageJson.name! : imageJson.uri!;
            img.onload = () => {
              resolve(gltfJson);
            }
          }

          const loadBinaryImage = () => {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = (function (_img) {
              return function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                  load(_img, xhr.response);
                }
              }
            })(img);
            xhr.open('GET', imageUri);
            xhr.responseType = 'arraybuffer';
            xhr.send();
          }
          loadBinaryImage();

        }

        resources.images[i] = img;
      }));
    }

    return Promise.all(promisesToLoadResources).then().catch((err) => {
      console.log('Promise.all error', err);
    });
  }


  static getInstance() {
    if (!this.__instance) {
      this.__instance = new DrcPointCloudImporter();
    }
    return this.__instance;
  }
}

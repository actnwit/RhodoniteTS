import EntityRepository from "../core/EntityRepository";
import TransformComponent from "../components/TransformComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";
import Entity from "../core/Entity";
import ImmutableVector3 from "../math/ImmutableVector3";
import ImmutableQuaternion from "../math/ImmutableQuaternion";
import ImmutableMatrix44 from "../math/ImmutableMatrix44";
import MeshRendererComponent from "../components/MeshRendererComponent";
import Primitive from "../geometry/Primitive";
import Buffer from "../memory/Buffer";
import { PrimitiveMode } from "../definitions/PrimitiveMode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import { VertexAttribute } from "../definitions/VertexAttribute";
import MutableMatrix44 from "../math/MutableMatrix44";

/**
 * A converter class from glTF2 model to Rhodonite Native data
 */
export default class ModelConverter {
  private static __instance: ModelConverter;

  private constructor() {
  }

  /**
   * The static method to get singleton instance of this class.
   * @return The singleton instance of ModelConverter class
   */
  static getInstance(): ModelConverter {
    if (!this.__instance) {
      this.__instance = new ModelConverter();
    }
    return this.__instance;
  }

  _getDefaultShader(options: ImporterOpition) {
    let defaultShader = null;

    // if (options && typeof options.defaultShaderClass !== "undefined") {
    //   if (typeof options.defaultShaderClass === "string") {
    //     defaultShader = GLBoost[options.defaultShaderClass];
    //   } else {
    //     defaultShader = options.defaultShaderClass;
    //   }
    // }

    return defaultShader;
  }

  private __generateGroupEntity() {
    const repo = EntityRepository.getInstance();
    const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID]);
    return entity;
  }

  private __generateMeshEntity() {
    const repo = EntityRepository.getInstance();
    const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID,
      MeshComponent.componentTID, MeshRendererComponent.componentTID]);
    return entity;
  }

  convertToRhodoniteObject(gltfModel: glTF2) {

    // load binary data
    // for (let accessor of gltfModel.accessors) {
    //   this._accessBinaryWithAccessor(accessor);
    // }

    const rnBuffer = this.createRnBuffer(gltfModel);


    // Mesh data
    const meshEntities = this._setupMesh(gltfModel, rnBuffer);

    let groups: Entity[] = [];
    for (let node of gltfModel.nodes) {
      const group = this.__generateGroupEntity();
      group.tryToSetUniqueName(node.name, true);
      groups.push(group);
    }

    // Transfrom
    this._setupTransform(gltfModel, groups);

    // Skeleton
//    this._setupSkeleton(gltfModel, groups, glboostMeshes);

    // Hierarchy
    this._setupHierarchy(gltfModel, groups, meshEntities);

    // Animation
//    this._setupAnimation(gltfModel, groups);

    // Root Group
    const rootGroup = this.__generateGroupEntity();
    rootGroup.tryToSetUniqueName('FileRoot', true);
    if (gltfModel.scenes[0].nodesIndices) {
      for (let nodesIndex of gltfModel.scenes[0].nodesIndices) {
        rootGroup.getSceneGraph().addChild(groups[nodesIndex].getSceneGraph());
      }
    }

    // Post Skeletal Proccess
    // for (let glboostMesh of glboostMeshes) {
    //   if (glboostMesh instanceof M_SkeletalMesh) {
    //     if (!glboostMesh.jointsHierarchy) {
    //       glboostMesh.jointsHierarchy = rootGroup;
    //     }
    //   }
    // }

    // let options = gltfModel.asset.extras.glboostOptions;
    // if (options.loaderExtension && options.loaderExtension.setAssetPropertiesToRootGroup) {
    //   options.loaderExtension.setAssetPropertiesToRootGroup(rootGroup, gltfModel.asset);
    // }
    // if (options && options.loaderExtension && options.loaderExtension.loadExtensionInfoAndSetToRootGroup) {
    //   options.loaderExtension.loadExtensionInfoAndSetToRootGroup(rootGroup, gltfModel, glBoostContext);
    // }

    // rootGroup.allMeshes = rootGroup.searchElementsByType(M_Mesh);

    return rootGroup;
  }

  private createRnBuffer(gltfModel: glTF2) {
    const buffer = gltfModel.buffers[0];
    const rnBuffer = new Buffer({
      byteLength: buffer.byteLength,
      arrayBuffer: buffer.buffer,
      name: `gltf2Buffer_0_(${buffer.uri})`
    });

    return rnBuffer;
  }

  _setupTransform(gltfModel: glTF2, groups: Entity[]) {
    for (let node_i in gltfModel.nodes) {
      let group = groups[node_i];
      let nodeJson = gltfModel.nodes[node_i];

      if (nodeJson.translation) {
        group.getTransform().translate = new ImmutableVector3(nodeJson.translation[0], nodeJson.translation[1], nodeJson.translation[2]);
      }
      if (nodeJson.scale) {
        group.getTransform().scale = new ImmutableVector3(nodeJson.scale[0], nodeJson.scale[1], nodeJson.scale[2]);
      }
      if (nodeJson.rotation) {
        group.getTransform().quaternion = new ImmutableQuaternion(nodeJson.rotation[0], nodeJson.rotation[1], nodeJson.rotation[2], nodeJson.rotation[3]);
      }
      if (nodeJson.matrix) {
        group.getTransform().matrix = new ImmutableMatrix44(nodeJson.matrix, true);
      }
    }
  }

  _setupHierarchy(gltfModel: glTF2, groups: Entity[], meshEntities: Entity[]) {
    const groupSceneComponents = groups.map(group=>{return group.getSceneGraph();});
    const meshSceneComponents = meshEntities.map(mesh=>{return mesh.getSceneGraph();});

    for (let node_i in gltfModel.nodes) {
      let node = gltfModel.nodes[parseInt(node_i)];
      let parentGroup = groupSceneComponents[node_i];
      if (node.mesh) {
        parentGroup.addChild(meshSceneComponents[node.meshIndex]);
      }
      if (node.childrenIndices) {
        for (let childNode_i of node.childrenIndices) {
          let childGroup = groupSceneComponents[childNode_i];
          parentGroup.addChild(childGroup);
        }
      }
    }
  }

  // _setupAnimation(gltfModel: glTF2, groups: Entity[]) {
  //   if (gltfModel.animations) {
  //     for (let animation of gltfModel.animations) {

  //       for (let channel of animation.channels) {
  //         let animInputArray = channel.sampler.input.extras.vertexAttributeArray;

  //         let animOutputArray = channel.sampler.output.extras.vertexAttributeArray;;

  //         let animationAttributeName = '';
  //         if (channel.target.path === 'translation') {
  //           animationAttributeName = 'translate';
  //         } else if (channel.target.path === 'rotation') {
  //           animationAttributeName = 'quaternion';
  //         } else {
  //           animationAttributeName = channel.target.path;
  //         }

  //         let group = groups[channel.target.nodeIndex];
  //         if (group) {
  //           group.setAnimationAtLine('time', animationAttributeName, animInputArray, animOutputArray);
  //           group.setActiveAnimationLine('time');
  //         }
  //       }
  //     }
  //   }
  // }

  // _setupSkeleton(gltfModel: glTF2, groups: Entity[], glboostMeshes) {
  //   for (let node_i in gltfModel.nodes) {
  //     let node = gltfModel.nodes[node_i];
  //     let group = groups[node_i];
  //     if (node.skin && node.skin.skeleton) {
  //       group._isRootJointGroup = true;
  //       if (node.mesh) {
  //         let glboostMesh = glboostMeshes[node.meshIndex];
  //         glboostMesh.jointsHierarchy = groups[node.skin.skeletonIndex];
  //       }
  //     }

  //     if (node.skin && node.skin.joints) {
  //       for (let joint_i of node.skin.jointsIndices) {
  //         let joint = node.skin.joints[joint_i];
  //         let options = gltfModel.asset.extras.glboostOptions;
  //         let glboostJoint = glBoostContext.createJoint(options.isExistJointGizmo);
  //         glboostJoint._glTFJointIndex = joint_i;
  //         let group = groups[joint_i];
  //         group.addChild(glboostJoint, true);
  //       }
  //     }
  //   }
  // }


  _setupMesh(gltfModel: glTF2, rnBuffer: Buffer) {
    const meshEntities: Entity[] = [];
    for (let mesh of gltfModel.meshes) {
      const meshEntity = this.__generateMeshEntity();
      meshEntities.push(meshEntity);

      let rnPrimitiveMode = PrimitiveMode.from(4);

      for (let i in mesh.primitives) {

        let primitive = mesh.primitives[i];
        if (primitive.mode != null) {
          rnPrimitiveMode = PrimitiveMode.from(primitive.mode);
        }

        const indicesRnAccessor = this.__getRnAccessor(primitive.indices, rnBuffer);

        const attributeRnAccessors = [];
        const attributeSemantics = [];
        for (let attributeName in primitive.attributes) {
          let attributeAccessor = primitive.attributes[attributeName];
          const attributeRnAccessor = this.__getRnAccessor(attributeAccessor, rnBuffer);
          attributeRnAccessors.push(attributeRnAccessor);
          attributeSemantics.push(VertexAttribute.fromString(attributeAccessor.extras.attributeName));
        }

        const rnPrimitive = new Primitive(attributeRnAccessors, attributeSemantics, rnPrimitiveMode, 0, indicesRnAccessor);
        const meshComponent = meshEntity.getComponent(MeshComponent.componentTID)! as MeshComponent;
        meshComponent.addPrimitive(rnPrimitive);
      }
    }

      return meshEntities;
   }


  private __getRnAccessor(accessor: any, rnBuffer: Buffer) {
    const bufferView = accessor.bufferView;
    const rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
      byteLengthToNeed: bufferView.byteLength,
      byteStride: bufferView.byteStride,
      byteOffset: bufferView.byteOffset,
      isAoS: false
    });
    const rnAccessor = rnBufferView.takeAccessorWithByteOffset({
      compositionType: CompositionType.fromString(accessor.type),
      componentType: ComponentType.from(accessor.componentType),
      count: accessor.count,
      byteOffset: accessor.byteOffset
    });

    return rnAccessor;
  }
//   _setupMaterial(glBoostContext, gltfModel, gltfMaterial, materialJson, accessor, additional, vertexData, dataViewMethodDic, _positions, indices, geometry, i) {
//     let options = gltfModel.asset.extras.glboostOptions;

//     if (accessor) {
//       additional['texcoord'][i] =  accessor.extras.vertexAttributeArray;
//       vertexData.components.texcoord = accessor.extras.componentN;
//       vertexData.componentBytes.texcoord = accessor.extras.componentBytes;
//       vertexData.componentType.texcoord = accessor.componentType;
//       dataViewMethodDic.texcoord = accessor.extras.dataViewMethod;

//       let setTextures = (materialJson)=> {
//         if (materialJson.pbrMetallicRoughness) {
//           let baseColorTexture = materialJson.pbrMetallicRoughness.baseColorTexture;
//           if (baseColorTexture) {
//             let sampler = baseColorTexture.texture.sampler;

//             let isNeededToMultiplyAlphaToColorOfTexture = false;

//             if (options.isNeededToMultiplyAlphaToColorOfPixelOutput) {
//               if (options.isTextureImageToLoadPreMultipliedAlphaAsDefault) {
//                 // Nothing to do because premultipling alpha is already done.
//               } else {
//                 isNeededToMultiplyAlphaToColorOfTexture = true;
//               }
//             } else { // if is NOT Needed To Multiply AlphaToColor Of PixelOutput
//               if (options.isTextureImageToLoadPreMultipliedAlphaAsDefault) {
//                 // TODO: Implement to Make Texture Straight.
//               } else {
//                 // Nothing to do because the texture is straight.
//               }
//             }

//             if (options && options.statesOfElements) {
//               for (let statesInfo of options.statesOfElements) {
//                 if (statesInfo.targets) {
//                   for (let target of statesInfo.targets) {
//                     let isMatch = false;
//                     let specifyMethod = statesInfo.specifyMethod !== void 0 ? statesInfo.specifyMethod : GLBoost.QUERY_TYPE_USER_FLAVOR_NAME;
//                     switch (specifyMethod) {
//                       case GLBoost.QUERY_TYPE_USER_FLAVOR_NAME:
//                         isMatch = group.userFlavorName === target; break;
//                       case GLBoost.QUERY_TYPE_INSTANCE_NAME:
//                         isMatch = group.instanceName === target; break;
//                       case GLBoost.QUERY_TYPE_INSTANCE_NAME_WITH_USER_FLAVOR:
//                         isMatch = group.instanceNameWithUserFlavor === target; break;
//                     }

//                     if (isMatch) {
//                       if (options.isNeededToMultiplyAlphaToColorOfPixelOutput) {
//                         if (statesInfo.isTextureImageToLoadPreMultipliedAlpha) {
//                           // Nothing to do because premultipling alpha is already done.
//                         } else {
//                           isNeededToMultiplyAlphaToColorOfTexture = true;
//                         }
//                       } else { // if is NOT Needed To Multiply AlphaToColor Of PixelOutput
//                         if (statesInfo.isTextureImageToLoadPreMultipliedAlpha) {
//                           // TODO: Implement to Make Texture Straight.
//                         } else {
//                           // Nothing to do because the texture is straight.
//                         }
//                       }
//                     }

//                     //texture.setParameter('UNPACK_PREMULTIPLY_ALPHA_WEBGL', isNeededToMultiplyAlphaToColorOfTexture);
// //                    texture.loadWebGLTexture();
//                   }
//                 }
//               }
//             }

//             let texture = glBoostContext.createTexture(baseColorTexture.texture.image.image, '', {
//               'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
//               'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
//               'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
//               'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT,
//               'UNPACK_PREMULTIPLY_ALPHA_WEBGL': isNeededToMultiplyAlphaToColorOfTexture
//             });
//             texture.userFlavorName = `Texture_Diffuse_index_${baseColorTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
//             gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_DIFFUSE);
//           }


//           let metallicRoughnessTexture = materialJson.pbrMetallicRoughness.metallicRoughnessTexture;
//           if (metallicRoughnessTexture) {
//             let sampler = metallicRoughnessTexture.texture.sampler;
//             let texture = glBoostContext.createTexture(metallicRoughnessTexture.texture.image.image, '', {
//               'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
//               'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
//               'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
//               'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT
//             });
//             texture.userFlavorName = `Texture_MetallicRoughness_index_${metallicRoughnessTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
//             gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_METALLIC_ROUGHNESS);
//           }

//           const normalTexture = materialJson.normalTexture;
//           if (normalTexture) {
//             const sampler = normalTexture.texture.sampler;
//             const texture = glBoostContext.createTexture(normalTexture.texture.image.image, '', {
//               'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
//               'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
//               'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
//               'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT
//             });
//             texture.userFlavorName = `Texture_MetallicRoughness_index_${normalTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
//             gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_NORMAL);
//           }

//           const occlusionTexture = materialJson.occlusionTexture;
//           if (occlusionTexture) {
//             const sampler = occlusionTexture.texture.sampler;
//             const texture = glBoostContext.createTexture(occlusionTexture.texture.image.image, '', {
//               'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
//               'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
//               'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
//               'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT
//             });
//             texture.userFlavorName = `Texture_Occlusion_index_${occlusionTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
//             gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_OCCLUSION);
//           }

//           const emissiveTexture = materialJson.emissiveTexture;
//           if (emissiveTexture) {
//             const sampler = normalTexture.texture.sampler;
//             const texture = glBoostContext.createTexture(emissiveTexture.texture.image.image, '', {
//               'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
//               'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
//               'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
//               'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT
//             });
//             texture.userFlavorName = `Texture_Emissive_index_${emissiveTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
//             gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_EMISSIVE);
//           }

//           const alphaMode = materialJson.alphaMode;
//           if (alphaMode === 'MASK') {
//             // doalpha test in fragment shader
//             gltfMaterial.isAlphaTest = true;
//             gltfMaterial.alphaCutoff = materialJson.alphaCutoff;
//           }

//           let enables = [];
//           if (options.isBlend || alphaMode === 'BLEND') {
//             enables.push(3042);
//           }
//           if (options.isDepthTest) {
//             enables.push(2929);
//           }
//           gltfMaterial.states.enable = enables; // It means, [gl.BLEND];
//           if (options.isBlend && options.isNeededToMultiplyAlphaToColorOfPixelOutput) {
//             gltfMaterial.states.functions.blendFuncSeparate = [1, 771, 1, 771];
//           }
//           gltfMaterial.globalStatesUsage = GLBoost.GLOBAL_STATES_USAGE_IGNORE;
//         }
//       };
//       setTextures(materialJson);



//     } else {
//       if (typeof vertexData.components.texcoord !== 'undefined') {
//         // If texture coordinates existed even once in the previous loop
//         let emptyTexcoords = [];
//         let componentN = vertexData.components.position;
//         let length = _positions[i].length / componentN;
//         for (let k = 0; k < length; k++) {
//           emptyTexcoords.push(0);
//           emptyTexcoords.push(0);
//         }
//         additional['texcoord'][i] = new Float32Array(emptyTexcoords);
//         vertexData.components.texcoord = 2;
//         vertexData.componentBytes.texcoord = 4;
//         dataViewMethodDic.texcoord = 'getFloat32';
//       }
//     }

//     const pmr = materialJson.pbrMetallicRoughness;
//     if (pmr != null) {
//       if (pmr.baseColorFactor) {
//         gltfMaterial.baseColor = new Vector4(pmr.baseColorFactor);
//       }
//       if (pmr.metallicFactor) {
//         gltfMaterial.metallic = pmr.metallicFactor;
//       }
//       if (pmr.roughnessFactor) {
//         gltfMaterial.roughness = pmr.roughnessFactor;
//       }
//       if (materialJson.emissiveFactor) {
//         gltfMaterial.emissive = new Vector3(materialJson.emissiveFactor);
//       }
//     }


//     if (indices !== null) {
//       gltfMaterial.setVertexN(geometry, indices.length);
//     }

//     const defaultShader = this._getDefaultShader(options);
//     if (defaultShader) {
//       gltfMaterial.shaderClass = defaultShader;
//     }
//   }

  // _adjustByteAlign(typedArrayClass, arrayBuffer, alignSize, byteOffset, length) {
  //   if (( byteOffset % alignSize ) != 0) {
  //     return new typedArrayClass(arrayBuffer.slice(byteOffset), 0, length);
  //   } else {
  //     return new typedArrayClass(arrayBuffer, byteOffset, length);
  //   }
  // }

  // _checkBytesPerComponent(accessor) {

  //   var bytesPerComponent = 0;
  //   switch (accessor.componentType) {
  //     case 5120: // gl.BYTE
  //       bytesPerComponent = 1;
  //       break;
  //     case 5121: // gl.UNSIGNED_BYTE
  //       bytesPerComponent = 1;
  //       break;
  //     case 5122: // gl.SHORT
  //       bytesPerComponent = 2;
  //       break;
  //     case 5123: // gl.UNSIGNED_SHORT
  //       bytesPerComponent = 2;
  //       break;
  //     case 5124: // gl.INT
  //       bytesPerComponent = 4;
  //       break;
  //     case 5125: // gl.UNSIGNED_INT
  //       bytesPerComponent = 4;
  //       break;
  //     case 5126: // gl.FLOAT
  //       bytesPerComponent = 4;
  //       break;
  //     default:
  //       break;
  //   }
  //   return bytesPerComponent;
  // }

  // _checkComponentNumber(accessor) {

  //   var componentN = 0;
  //   switch (accessor.type) {
  //     case 'SCALAR':
  //       componentN = 1;
  //       break;
  //     case 'VEC2':
  //       componentN = 2;
  //       break;
  //     case 'VEC3':
  //       componentN = 3;
  //       break;
  //     case 'VEC4':
  //       componentN = 4;
  //       break;
  //     case 'MAT4':
  //       componentN = 16;
  //       break;
  //   }

  //   return componentN;
  // }

  // _checkDataViewMethod(accessor) {
  //   var dataViewMethod = '';
  //   switch (accessor.componentType) {
  //     case 5120: // gl.BYTE
  //       dataViewMethod = 'getInt8';
  //       break;
  //     case 5121: // gl.UNSIGNED_BYTE
  //       dataViewMethod = 'getUint8';
  //       break;
  //     case 5122: // gl.SHORT
  //       dataViewMethod = 'getInt16';
  //       break;
  //     case 5123: // gl.UNSIGNED_SHORT
  //       dataViewMethod = 'getUint16';
  //       break;
  //     case 5124: // gl.INT
  //       dataViewMethod = 'getInt32';
  //       break;
  //     case 5125: // gl.UNSIGNED_INT
  //       dataViewMethod = 'getUint32';
  //       break;
  //     case 5126: // gl.FLOAT
  //       dataViewMethod = 'getFloat32';
  //       break;
  //     default:
  //       break;
  //   }
  //   return dataViewMethod;
  // }

  // static _isSystemLittleEndian() {
  //   return !!(new Uint8Array((new Uint16Array([0x00ff])).buffer))[0];
  // }

  // _accessBinaryWithAccessor(accessor) {
  //   var bufferView = accessor.bufferView;
  //   const byteOffset = bufferView.byteOffset + (accessor.byteOffset !== void 0 ? accessor.byteOffset : 0);
  //   var buffer = bufferView.buffer;
  //   var arrayBuffer = buffer.buffer;

  //   let componentN = this._checkComponentNumber(accessor);
  //   let componentBytes = this._checkBytesPerComponent(accessor);
  //   let dataViewMethod = this._checkDataViewMethod(accessor);
  //   if (accessor.extras === void 0) {
  //     accessor.extras = {};
  //   }

  //   accessor.extras.componentN = componentN;
  //   accessor.extras.componentBytes = componentBytes;
  //   accessor.extras.dataViewMethod = dataViewMethod;

  //   var byteLength = componentBytes * componentN * accessor.count;

  //   var vertexAttributeArray = [];

  //   if (accessor.extras && accessor.extras.toGetAsTypedArray) {
  //     if (ModelConverter._isSystemLittleEndian()) {
  //       if (dataViewMethod === 'getFloat32') {
  //         vertexAttributeArray = this._adjustByteAlign(Float32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
  //       } else if (dataViewMethod === 'getInt8') {
  //         vertexAttributeArray = new Int8Array(arrayBuffer, byteOffset, byteLength / componentBytes);
  //       } else if (dataViewMethod === 'getUint8') {
  //         vertexAttributeArray = new Uint8Array(arrayBuffer, byteOffset, byteLength / componentBytes);
  //       } else if (dataViewMethod === 'getInt16') {
  //         vertexAttributeArray = this._adjustByteAlign(Int16Array, arrayBuffer, 2, byteOffset, byteLength / componentBytes);
  //       } else if (dataViewMethod === 'getUint16') {
  //         vertexAttributeArray = this._adjustByteAlign(Uint16Array, arrayBuffer, 2, byteOffset, byteLength / componentBytes);
  //       } else if (dataViewMethod === 'getInt32') {
  //         vertexAttributeArray = this._adjustByteAlign(Int32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
  //       } else if (dataViewMethod === 'getUint32') {
  //         vertexAttributeArray = this._adjustByteAlign(Uint32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
  //       }

  //     } else {
  //       let dataView = new DataView(arrayBuffer, byteOffset, byteLength);
  //       let byteDelta = componentBytes * componentN;
  //       let littleEndian = true;
  //       for (let pos = 0; pos < byteLength; pos += byteDelta) {
  //         switch (accessor.type) {
  //           case 'SCALAR':
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
  //             break;
  //           case 'VEC2':
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
  //             break;
  //           case 'VEC3':
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes * 2, littleEndian));
  //             break;
  //           case 'VEC4':
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes * 2, littleEndian));
  //             vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes * 3, littleEndian));
  //             break;
  //         }
  //       }
  //       if (dataViewMethod === 'getInt8') {
  //         vertexAttributeArray = new Int8Array(vertexAttributeArray);
  //       } else if (dataViewMethod === 'getUint8') {
  //         vertexAttributeArray = new Uint8Array(vertexAttributeArray);
  //       } else if (dataViewMethod === 'getInt16') {
  //         vertexAttributeArray = new Int16Array(vertexAttributeArray);
  //       } else if (dataViewMethod === 'getUint16') {
  //         vertexAttributeArray = new Uint16Array(vertexAttributeArray);
  //       } else if (dataViewMethod === 'getInt32') {
  //         vertexAttributeArray = new Int32Array(vertexAttributeArray);
  //       } else if (dataViewMethod === 'getUint32') {
  //         vertexAttributeArray = new Uint32Array(vertexAttributeArray);
  //       } else if (dataViewMethod === 'getFloat32') {
  //         vertexAttributeArray = new Float32Array(vertexAttributeArray);
  //       }
  //     }
  //   } else {
  //     let dataView = new DataView(arrayBuffer, byteOffset, byteLength);
  //     let byteDelta = componentBytes * componentN;
  //     let littleEndian = true;
  //     for (let pos = 0; pos < byteLength; pos += byteDelta) {

  //       switch (accessor.type) {
  //         case 'SCALAR':
  //           vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
  //           break;
  //         case 'VEC2':
  //           vertexAttributeArray.push(new Vector2(
  //             dataView[dataViewMethod](pos, littleEndian),
  //             dataView[dataViewMethod](pos+componentBytes, littleEndian)
  //           ));
  //           break;
  //         case 'VEC3':
  //           vertexAttributeArray.push(new Vector3(
  //             dataView[dataViewMethod](pos, littleEndian),
  //             dataView[dataViewMethod](pos+componentBytes, littleEndian),
  //             dataView[dataViewMethod](pos+componentBytes*2, littleEndian)
  //           ));
  //           break;
  //         case 'VEC4':
  //           if (accessor.extras && accessor.extras.quaternionIfVec4) {
  //             vertexAttributeArray.push(new Quaternion(
  //               dataView[dataViewMethod](pos, littleEndian),
  //               dataView[dataViewMethod](pos+componentBytes, littleEndian),
  //               dataView[dataViewMethod](pos+componentBytes*2, littleEndian),
  //               dataView[dataViewMethod](pos+componentBytes*3, littleEndian)
  //             ));
  //           } else {
  //             vertexAttributeArray.push(new Vector4(
  //               dataView[dataViewMethod](pos, littleEndian),
  //               dataView[dataViewMethod](pos+componentBytes, littleEndian),
  //               dataView[dataViewMethod](pos+componentBytes*2, littleEndian),
  //               dataView[dataViewMethod](pos+componentBytes*3, littleEndian)
  //             ));
  //           }
  //           break;
  //         case 'MAT4':
  //           let matrixComponents = [];
  //           for (let i=0; i<16; i++) {
  //             matrixComponents[i] = dataView[dataViewMethod](pos+componentBytes*i, littleEndian);
  //           }
  //           vertexAttributeArray.push(new Matrix44(matrixComponents, true));
  //           break;
  //       }

  //     }
  //   }

  //   accessor.extras.vertexAttributeArray = vertexAttributeArray;

  //   return vertexAttributeArray;
  // }
}

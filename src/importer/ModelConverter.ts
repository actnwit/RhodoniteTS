import EntityRepository from "../core/EntityRepository";
import TransformComponent from "../components/TransformComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";

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
    const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID, MeshComponent.componentTID]);
    return entity;
  }

  convertToRhodoniteObject(gltfModel: glTF2) {

    // load binary data
    for (let accessor of gltfModel.accessors) {
      this._accessBinaryWithAccessor(accessor);
    }

    // Mesh data
    let glboostMeshes = this._setupMesh(gltfModel);

    let groups = [];
    for (let node of gltfModel.nodes) {
      let group = glBoostContext.createGroup();
      group.userFlavorName = node.name;
      groups.push(group);
    }

    // Transfrom
    this._setupTransform(gltfModel, groups);

    // Skeleton
    this._setupSkeleton(gltfModel, groups, glboostMeshes);

    // Hierarchy
    this._setupHierarchy(gltfModel, groups, glboostMeshes);

    // Animation
    this._setupAnimation(gltfModel, groups);

    // Root Group
    const rootGroup = this.__generateGroupEntity();
    rootGroup.tryToSetUniqueName('FileRoot', true);
    if (gltfModel.scenes[0].nodesIndices) {
      for (let nodesIndex of gltfModel.scenes[0].nodesIndices) {
        rootGroup.getSceneGraph().addChild(groups[nodesIndex], true);
      }
    }

    // Post Skeletal Proccess
    for (let glboostMesh of glboostMeshes) {
      if (glboostMesh instanceof M_SkeletalMesh) {
        if (!glboostMesh.jointsHierarchy) {
          glboostMesh.jointsHierarchy = rootGroup;
        }
      }
    }

    let options = gltfModel.asset.extras.glboostOptions;
    if (options.loaderExtension && options.loaderExtension.setAssetPropertiesToRootGroup) {
      options.loaderExtension.setAssetPropertiesToRootGroup(rootGroup, gltfModel.asset);
    }
    if (options && options.loaderExtension && options.loaderExtension.loadExtensionInfoAndSetToRootGroup) {
      options.loaderExtension.loadExtensionInfoAndSetToRootGroup(rootGroup, gltfModel, glBoostContext);
    }

    rootGroup.allMeshes = rootGroup.searchElementsByType(M_Mesh);

    return rootGroup;
  }

  _setupTransform(gltfModel: glTF2, groups) {
    for (let node_i in gltfModel.nodes) {
      let group = groups[node_i];
      let nodeJson = gltfModel.nodes[node_i];

      if (nodeJson.translation) {
        group.translate = new Vector3(nodeJson.translation[0], nodeJson.translation[1], nodeJson.translation[2]);
      }
      if (nodeJson.scale) {
        group.scale = new Vector3(nodeJson.scale[0], nodeJson.scale[1], nodeJson.scale[2]);
      }
      if (nodeJson.rotation) {
        group.quaternion = new Quaternion(nodeJson.rotation[0], nodeJson.rotation[1], nodeJson.rotation[2], nodeJson.rotation[3]);
      }
      if (nodeJson.matrix) {
        group.matrix = new Matrix44(nodeJson.matrix, true);
      }
    }
  }

  _setupHierarchy(gltfModel: glTF2, groups, glboostMeshes) {

    for (let node_i in gltfModel.nodes) {
      let node = gltfModel.nodes[parseInt(node_i)];
      let parentGroup = groups[node_i];
      if (node.mesh) {
        parentGroup.addChild(glboostMeshes[node.meshIndex], true);
      }
      if (node.childrenIndices) {
        for (let childNode_i of node.childrenIndices) {
          let childGroup = groups[childNode_i];
          parentGroup.addChild(childGroup, true);
        }
      }
    }

  }

  _setupAnimation(gltfModel: glTF2, groups) {
    if (gltfModel.animations) {
      for (let animation of gltfModel.animations) {

        for (let channel of animation.channels) {
          let animInputArray = channel.sampler.input.extras.vertexAttributeArray;

          let animOutputArray = channel.sampler.output.extras.vertexAttributeArray;;

          let animationAttributeName = '';
          if (channel.target.path === 'translation') {
            animationAttributeName = 'translate';
          } else if (channel.target.path === 'rotation') {
            animationAttributeName = 'quaternion';
          } else {
            animationAttributeName = channel.target.path;
          }

          let group = groups[channel.target.nodeIndex];
          if (group) {
            group.setAnimationAtLine('time', animationAttributeName, animInputArray, animOutputArray);
            group.setActiveAnimationLine('time');
          }
        }
      }
    }
  }

  _setupSkeleton(gltfModel: glTF2, groups, glboostMeshes) {
    for (let node_i in gltfModel.nodes) {
      let node = gltfModel.nodes[node_i];
      let group = groups[node_i];
      if (node.skin && node.skin.skeleton) {
        group._isRootJointGroup = true;
        if (node.mesh) {
          let glboostMesh = glboostMeshes[node.meshIndex];
          glboostMesh.jointsHierarchy = groups[node.skin.skeletonIndex];
        }
      }

      if (node.skin && node.skin.joints) {
        for (let joint_i of node.skin.jointsIndices) {
          let joint = node.skin.joints[joint_i];
          let options = gltfModel.asset.extras.glboostOptions;
          let glboostJoint = glBoostContext.createJoint(options.isExistJointGizmo);
          glboostJoint._glTFJointIndex = joint_i;
          let group = groups[joint_i];
          group.addChild(glboostJoint, true);
        }
      }
    }
  }

  _setupMesh(gltfModel: glTF2) {
    let glboostMeshes = [];
    for (let mesh of gltfModel.meshes) {
      let geometry = null;
      let glboostMesh = null;
      if (mesh.extras && mesh.extras._skin && mesh.extras._skin.jointsIndices.length > 0) {
        geometry = glBoostContext.createSkeletalGeometry();
        glboostMesh = glBoostContext.createSkeletalMesh(geometry, null);
        glboostMesh.gltfJointIndices = mesh.extras._skin.jointsIndices;
        if (mesh.extras._skin.inverseBindMatrices) {
          glboostMesh.inverseBindMatrices = mesh.extras._skin.inverseBindMatrices.extras.vertexAttributeArray;
        } else {
          glboostMesh.inverseBindMatrices = [];
        }
      } else {
        geometry = glBoostContext.createGeometry();
        glboostMesh = glBoostContext.createMesh(geometry);
      }
      glboostMeshes.push(glboostMesh);

      let options = gltfModel.asset.extras.glboostOptions;
      if (options.isMeshTransparentAsDefault) {
        glboostMeshes.isTransparent = true;
      }

      let _indicesArray = [];
      let _positions = [];
      let _normals = [];
      let vertexData = {
        position: _positions,
        normal: _normals,
        components: {},
        componentBytes: {},
        componentType: {}
      };
      let additional = {
        'joint': [],
        'weight': [],
        'texcoord': [],
        'color': []
      };

      let dataViewMethodDic = {};
      let materials = [];
      let indicesAccumulatedLength = 0;

      let primitiveMode = 4;

      for (let i in mesh.primitives) {
        let primitive = mesh.primitives[i];
        if (primitive.mode != null) {
          primitiveMode = primitive.mode;
        }

        {
          let accessor = primitive.attributes.POSITION;
          _positions[i] = accessor.extras.vertexAttributeArray;
          vertexData.components.position = accessor.extras.componentN;
          vertexData.componentBytes.position = accessor.extras.componentBytes;
          vertexData.componentType.position = accessor.componentType;
          dataViewMethodDic.position = accessor.extras.dataViewMethod;
        }

        let indices = null;
        if (typeof primitive.indices !== 'undefined') {
          primitive.indices.indices = gltfModel.accessors[primitive.indicesIndex];
          indices = primitive.indices.indices.extras.vertexAttributeArray;
          for (let j=0; j<indices.length; j++) {
            indices[j] = indicesAccumulatedLength + indices[j];
          }
          _indicesArray[i] = indices;
          indicesAccumulatedLength += _positions[i].length /  vertexData.components.position;
        }

        {
          let accessor = primitive.attributes.NORMAL;
          if (accessor) {
            _normals[i] = accessor.extras.vertexAttributeArray;
            vertexData.components.normal = accessor.extras.componentN;
            vertexData.componentBytes.normal = accessor.extras.componentBytes;
            vertexData.componentType.normal = accessor.componentType;
            dataViewMethodDic.normal = accessor.extras.dataViewMethod;
          }

          accessor = primitive.attributes.COLOR_0;
          if (accessor) {
            additional['color'][i] = accessor.extras.vertexAttributeArray;
            vertexData.components.color = accessor.extras.componentN;
            vertexData.componentBytes.color = accessor.extras.componentBytes;
            vertexData.componentType.color = accessor.componentType;
            dataViewMethodDic.color = accessor.extras.dataViewMethod;
          }
        }


        {
          let accessor = primitive.attributes.JOINTS_0;
          if (accessor) {
            additional['joint'][i] = accessor.extras.vertexAttributeArray;
            vertexData.components.joint = accessor.extras.componentN;
            vertexData.componentBytes.joint = accessor.extras.componentBytes;
            vertexData.componentType.joint = accessor.componentType;
            dataViewMethodDic.joint = accessor.extras.dataViewMethod;
          }
          accessor = primitive.attributes.WEIGHTS_0;
          if (accessor) {
            additional['weight'][i] = accessor.extras.vertexAttributeArray;
            vertexData.components.weight = accessor.extras.componentN;
            vertexData.componentBytes.weight = accessor.extras.componentBytes;
            vertexData.componentType.weight = accessor.componentType;
            dataViewMethodDic.weight = accessor.extras.dataViewMethod;
          }
        }

        if (primitive.material) {
          var texcoords = null;

          let material = primitive.material;

          let glboostMaterial = glBoostContext.createPBRMetallicRoughnessMaterial();
          if (options.isNeededToMultiplyAlphaToColorOfPixelOutput) {
            glboostMaterial.shaderParameters.isNeededToMultiplyAlphaToColorOfPixelOutput = options.isNeededToMultiplyAlphaToColorOfPixelOutput;
          }
          //this._materials.push(glboostMaterial);

          let accessor = primitive.attributes.TEXCOORD_0;

          texcoords = this._setupMaterial(glBoostContext, gltfModel, glboostMaterial, material, accessor, additional, vertexData, dataViewMethodDic, _positions, indices, geometry, i);

          materials.push(glboostMaterial);
        } else {
          let glboostMaterial = null;
          if (options.loaderExtension && options.loaderExtension.createClassicMaterial) {
            glboostMaterial = options.loaderExtension.createClassicMaterial(glBoostContext);
          } else {
            glboostMaterial = glBoostContext.createClassicMaterial();
          }

          const defaultShader = this._getDefaultShader(options);
          if (defaultShader) {
            glboostMaterial.shaderClass = defaultShader;
          } else {
            glboostMaterial.baseColor = new Vector4(0.5, 0.5, 0.5, 1);
          }
          materials.push(glboostMaterial);
        }
      }

      if (mesh.primitives.length > 1) {
        let lengthDic = {index: 0, position: 0, normal: 0, joint: 0, weight: 0, texcoord: 0, color: 0};
        for (let i = 0; i < mesh.primitives.length; i++) {
          //lengthDic.index += _indicesArray[i].length;
          lengthDic.position += _positions[i].length;
          if (_normals[i]) {
            lengthDic.normal += _normals[i].length;
          }
          if (typeof additional['joint'][i] !== 'undefined') {
            lengthDic.joint += additional['joint'][i].length;
          }
          if (typeof additional['weight'][i] !== 'undefined') {
            lengthDic.weight += additional['weight'][i].length;
          }
          if (typeof additional['texcoord'][i] !== 'undefined') {
            lengthDic.texcoord += additional['texcoord'][i].length;
          }
          if (typeof additional['color'][i] !== 'undefined') {
            lengthDic.color += additional['color'][i].length;
          }
        }

        function getTypedArray(dataViewMethod, length) {
          let vertexAttributeArray = null;
          if (dataViewMethod === 'getInt8') {
            vertexAttributeArray = new Int8Array(length);
          } else if (dataViewMethod === 'getUint8') {
            vertexAttributeArray = new Uint8Array(length);
          } else if (dataViewMethod === 'getInt16') {
            vertexAttributeArray = new Int16Array(length);
          } else if (dataViewMethod === 'getUint16') {
            vertexAttributeArray = new Uint16Array(length);
          } else if (dataViewMethod === 'getInt32') {
            vertexAttributeArray = new Int32Array(length);
          } else if (dataViewMethod === 'getUint32') {
            vertexAttributeArray = new Uint32Array(length);
          } else if (dataViewMethod === 'getFloat32') {
            vertexAttributeArray = new Float32Array(length);
          }

          return vertexAttributeArray;
        }

        for (let attribName in dataViewMethodDic) {
          let newTypedArray = getTypedArray(dataViewMethodDic[attribName], lengthDic[attribName]);
          let offset = 0;
          for (let i = 0; i < mesh.primitives.length; i++) {

            let array = null;

            if (attribName === 'position') {
              array = _positions[i];
            } else if (attribName === 'normal') {
              array = _normals[i];
            } else if (attribName === 'joint') {
              array = additional['joint'][i];
            } else if (attribName === 'weight') {
              array = additional['weight'][i];
            } else if (attribName === 'texcoord') {
              array = additional['texcoord'][i];
            } else if (attribName === 'color') {
              array = additional['color'][i];
            }

            if (array) {
              newTypedArray.set(array, offset);
              offset += array.length;
            }
          }

          if (attribName === 'position') {
            vertexData.position = newTypedArray;
          } else if (attribName === 'normal') {
            vertexData.normal = newTypedArray;
          } else if (attribName === 'joint') {
            additional['joint'] = newTypedArray;
          } else if (attribName === 'weight') {
            additional['weight'] = newTypedArray;
          } else if (attribName === 'texcoord') {
            additional['texcoord'] = newTypedArray;
          } else if (attribName === 'color') {
            additional['color'] = newTypedArray;
          }
        }


      } else {
        vertexData.position = _positions[0];
        vertexData.normal = _normals[0];
        additional['joint'] = additional['joint'][0];
        additional['weight'] = additional['weight'][0];
        additional['texcoord'] = additional['texcoord'][0];
        additional['color'] = additional['color'][0];
      }

      if (typeof vertexData.normal === 'undefined' || vertexData.normal.length === 0) {
        delete vertexData.normal;
      }
      if (typeof additional['joint'] === 'undefined' || additional['joint'].length === 0) {
        delete additional['joint'];
      }
      if (typeof additional['weight'] === 'undefined' || additional['weight'].length === 0) {
        delete additional['weight'];
      }
      if (typeof additional['texcoord'] === 'undefined' || additional['texcoord'].length === 0) {
        delete additional['texcoord'];
      }
      if (typeof additional['color'] === 'undefined' || additional['color'].length === 0) {
        delete additional['color'];
      }


      if (_indicesArray.length === 0) {
        _indicesArray = null;
      }

      geometry.setVerticesData(ArrayUtil.merge(vertexData, additional), _indicesArray, primitiveMode);
      geometry.materials = materials;
    }

    return glboostMeshes;
  }

  _setupMaterial(glBoostContext, gltfModel, gltfMaterial, materialJson, accessor, additional, vertexData, dataViewMethodDic, _positions, indices, geometry, i) {
    let options = gltfModel.asset.extras.glboostOptions;

    if (accessor) {
      additional['texcoord'][i] =  accessor.extras.vertexAttributeArray;
      vertexData.components.texcoord = accessor.extras.componentN;
      vertexData.componentBytes.texcoord = accessor.extras.componentBytes;
      vertexData.componentType.texcoord = accessor.componentType;
      dataViewMethodDic.texcoord = accessor.extras.dataViewMethod;

      let setTextures = (materialJson)=> {
        if (materialJson.pbrMetallicRoughness) {
          let baseColorTexture = materialJson.pbrMetallicRoughness.baseColorTexture;
          if (baseColorTexture) {
            let sampler = baseColorTexture.texture.sampler;

            let isNeededToMultiplyAlphaToColorOfTexture = false;

            if (options.isNeededToMultiplyAlphaToColorOfPixelOutput) {
              if (options.isTextureImageToLoadPreMultipliedAlphaAsDefault) {
                // Nothing to do because premultipling alpha is already done.
              } else {
                isNeededToMultiplyAlphaToColorOfTexture = true;
              }
            } else { // if is NOT Needed To Multiply AlphaToColor Of PixelOutput
              if (options.isTextureImageToLoadPreMultipliedAlphaAsDefault) {
                // TODO: Implement to Make Texture Straight.
              } else {
                // Nothing to do because the texture is straight.
              }
            }

            if (options && options.statesOfElements) {
              for (let statesInfo of options.statesOfElements) {
                if (statesInfo.targets) {
                  for (let target of statesInfo.targets) {
                    let isMatch = false;
                    let specifyMethod = statesInfo.specifyMethod !== void 0 ? statesInfo.specifyMethod : GLBoost.QUERY_TYPE_USER_FLAVOR_NAME;
                    switch (specifyMethod) {
                      case GLBoost.QUERY_TYPE_USER_FLAVOR_NAME:
                        isMatch = group.userFlavorName === target; break;
                      case GLBoost.QUERY_TYPE_INSTANCE_NAME:
                        isMatch = group.instanceName === target; break;
                      case GLBoost.QUERY_TYPE_INSTANCE_NAME_WITH_USER_FLAVOR:
                        isMatch = group.instanceNameWithUserFlavor === target; break;
                    }

                    if (isMatch) {
                      if (options.isNeededToMultiplyAlphaToColorOfPixelOutput) {
                        if (statesInfo.isTextureImageToLoadPreMultipliedAlpha) {
                          // Nothing to do because premultipling alpha is already done.
                        } else {
                          isNeededToMultiplyAlphaToColorOfTexture = true;
                        }
                      } else { // if is NOT Needed To Multiply AlphaToColor Of PixelOutput
                        if (statesInfo.isTextureImageToLoadPreMultipliedAlpha) {
                          // TODO: Implement to Make Texture Straight.
                        } else {
                          // Nothing to do because the texture is straight.
                        }
                      }
                    }

                    //texture.setParameter('UNPACK_PREMULTIPLY_ALPHA_WEBGL', isNeededToMultiplyAlphaToColorOfTexture);
//                    texture.loadWebGLTexture();
                  }
                }
              }
            }

            let texture = glBoostContext.createTexture(baseColorTexture.texture.image.image, '', {
              'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
              'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
              'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
              'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT,
              'UNPACK_PREMULTIPLY_ALPHA_WEBGL': isNeededToMultiplyAlphaToColorOfTexture
            });
            texture.userFlavorName = `Texture_Diffuse_index_${baseColorTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
            gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_DIFFUSE);
          }


          let metallicRoughnessTexture = materialJson.pbrMetallicRoughness.metallicRoughnessTexture;
          if (metallicRoughnessTexture) {
            let sampler = metallicRoughnessTexture.texture.sampler;
            let texture = glBoostContext.createTexture(metallicRoughnessTexture.texture.image.image, '', {
              'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
              'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
              'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
              'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT
            });
            texture.userFlavorName = `Texture_MetallicRoughness_index_${metallicRoughnessTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
            gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_METALLIC_ROUGHNESS);
          }

          const normalTexture = materialJson.normalTexture;
          if (normalTexture) {
            const sampler = normalTexture.texture.sampler;
            const texture = glBoostContext.createTexture(normalTexture.texture.image.image, '', {
              'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
              'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
              'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
              'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT
            });
            texture.userFlavorName = `Texture_MetallicRoughness_index_${normalTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
            gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_NORMAL);
          }

          const occlusionTexture = materialJson.occlusionTexture;
          if (occlusionTexture) {
            const sampler = occlusionTexture.texture.sampler;
            const texture = glBoostContext.createTexture(occlusionTexture.texture.image.image, '', {
              'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
              'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
              'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
              'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT
            });
            texture.userFlavorName = `Texture_Occlusion_index_${occlusionTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
            gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_OCCLUSION);
          }

          const emissiveTexture = materialJson.emissiveTexture;
          if (emissiveTexture) {
            const sampler = normalTexture.texture.sampler;
            const texture = glBoostContext.createTexture(emissiveTexture.texture.image.image, '', {
              'TEXTURE_MAG_FILTER': sampler === void 0 ? GLBoost.LINEAR : sampler.magFilter,
              'TEXTURE_MIN_FILTER': sampler === void 0 ? GLBoost.LINEAR_MIPMAP_LINEAR : sampler.minFilter,
              'TEXTURE_WRAP_S': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapS,
              'TEXTURE_WRAP_T': sampler === void 0 ? GLBoost.REPEAT : sampler.wrapT
            });
            texture.userFlavorName = `Texture_Emissive_index_${emissiveTexture.index}_of_${gltfMaterial.instanceNameWithUserFlavor}`;
            gltfMaterial.setTexture(texture, GLBoost.TEXTURE_PURPOSE_EMISSIVE);
          }

          const alphaMode = materialJson.alphaMode;
          if (alphaMode === 'MASK') {
            // doalpha test in fragment shader
            gltfMaterial.isAlphaTest = true;
            gltfMaterial.alphaCutoff = materialJson.alphaCutoff;
          }

          let enables = [];
          if (options.isBlend || alphaMode === 'BLEND') {
            enables.push(3042);
          }
          if (options.isDepthTest) {
            enables.push(2929);
          }
          gltfMaterial.states.enable = enables; // It means, [gl.BLEND];
          if (options.isBlend && options.isNeededToMultiplyAlphaToColorOfPixelOutput) {
            gltfMaterial.states.functions.blendFuncSeparate = [1, 771, 1, 771];
          }
          gltfMaterial.globalStatesUsage = GLBoost.GLOBAL_STATES_USAGE_IGNORE;
        }
      };
      setTextures(materialJson);



    } else {
      if (typeof vertexData.components.texcoord !== 'undefined') {
        // If texture coordinates existed even once in the previous loop
        let emptyTexcoords = [];
        let componentN = vertexData.components.position;
        let length = _positions[i].length / componentN;
        for (let k = 0; k < length; k++) {
          emptyTexcoords.push(0);
          emptyTexcoords.push(0);
        }
        additional['texcoord'][i] = new Float32Array(emptyTexcoords);
        vertexData.components.texcoord = 2;
        vertexData.componentBytes.texcoord = 4;
        dataViewMethodDic.texcoord = 'getFloat32';
      }
    }

    const pmr = materialJson.pbrMetallicRoughness;
    if (pmr != null) {
      if (pmr.baseColorFactor) {
        gltfMaterial.baseColor = new Vector4(pmr.baseColorFactor);
      }
      if (pmr.metallicFactor) {
        gltfMaterial.metallic = pmr.metallicFactor;
      }
      if (pmr.roughnessFactor) {
        gltfMaterial.roughness = pmr.roughnessFactor;
      }
      if (materialJson.emissiveFactor) {
        gltfMaterial.emissive = new Vector3(materialJson.emissiveFactor);
      }
    }


    if (indices !== null) {
      gltfMaterial.setVertexN(geometry, indices.length);
    }

    const defaultShader = this._getDefaultShader(options);
    if (defaultShader) {
      gltfMaterial.shaderClass = defaultShader;
    }
  }

  _adjustByteAlign(typedArrayClass, arrayBuffer, alignSize, byteOffset, length) {
    if (( byteOffset % alignSize ) != 0) {
      return new typedArrayClass(arrayBuffer.slice(byteOffset), 0, length);
    } else {
      return new typedArrayClass(arrayBuffer, byteOffset, length);
    }
  }

  _checkBytesPerComponent(accessor) {

    var bytesPerComponent = 0;
    switch (accessor.componentType) {
      case 5120: // gl.BYTE
        bytesPerComponent = 1;
        break;
      case 5121: // gl.UNSIGNED_BYTE
        bytesPerComponent = 1;
        break;
      case 5122: // gl.SHORT
        bytesPerComponent = 2;
        break;
      case 5123: // gl.UNSIGNED_SHORT
        bytesPerComponent = 2;
        break;
      case 5124: // gl.INT
        bytesPerComponent = 4;
        break;
      case 5125: // gl.UNSIGNED_INT
        bytesPerComponent = 4;
        break;
      case 5126: // gl.FLOAT
        bytesPerComponent = 4;
        break;
      default:
        break;
    }
    return bytesPerComponent;
  }

  _checkComponentNumber(accessor) {

    var componentN = 0;
    switch (accessor.type) {
      case 'SCALAR':
        componentN = 1;
        break;
      case 'VEC2':
        componentN = 2;
        break;
      case 'VEC3':
        componentN = 3;
        break;
      case 'VEC4':
        componentN = 4;
        break;
      case 'MAT4':
        componentN = 16;
        break;
    }

    return componentN;
  }

  _checkDataViewMethod(accessor) {
    var dataViewMethod = '';
    switch (accessor.componentType) {
      case 5120: // gl.BYTE
        dataViewMethod = 'getInt8';
        break;
      case 5121: // gl.UNSIGNED_BYTE
        dataViewMethod = 'getUint8';
        break;
      case 5122: // gl.SHORT
        dataViewMethod = 'getInt16';
        break;
      case 5123: // gl.UNSIGNED_SHORT
        dataViewMethod = 'getUint16';
        break;
      case 5124: // gl.INT
        dataViewMethod = 'getInt32';
        break;
      case 5125: // gl.UNSIGNED_INT
        dataViewMethod = 'getUint32';
        break;
      case 5126: // gl.FLOAT
        dataViewMethod = 'getFloat32';
        break;
      default:
        break;
    }
    return dataViewMethod;
  }

  static _isSystemLittleEndian() {
    return !!(new Uint8Array((new Uint16Array([0x00ff])).buffer))[0];
  }

  _accessBinaryWithAccessor(accessor) {
    var bufferView = accessor.bufferView;
    const byteOffset = bufferView.byteOffset + (accessor.byteOffset !== void 0 ? accessor.byteOffset : 0);
    var buffer = bufferView.buffer;
    var arrayBuffer = buffer.buffer;

    let componentN = this._checkComponentNumber(accessor);
    let componentBytes = this._checkBytesPerComponent(accessor);
    let dataViewMethod = this._checkDataViewMethod(accessor);
    if (accessor.extras === void 0) {
      accessor.extras = {};
    }

    accessor.extras.componentN = componentN;
    accessor.extras.componentBytes = componentBytes;
    accessor.extras.dataViewMethod = dataViewMethod;

    var byteLength = componentBytes * componentN * accessor.count;

    var vertexAttributeArray = [];

    if (accessor.extras && accessor.extras.toGetAsTypedArray) {
      if (ModelConverter._isSystemLittleEndian()) {
        if (dataViewMethod === 'getFloat32') {
          vertexAttributeArray = this._adjustByteAlign(Float32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt8') {
          vertexAttributeArray = new Int8Array(arrayBuffer, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint8') {
          vertexAttributeArray = new Uint8Array(arrayBuffer, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt16') {
          vertexAttributeArray = this._adjustByteAlign(Int16Array, arrayBuffer, 2, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint16') {
          vertexAttributeArray = this._adjustByteAlign(Uint16Array, arrayBuffer, 2, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt32') {
          vertexAttributeArray = this._adjustByteAlign(Int32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint32') {
          vertexAttributeArray = this._adjustByteAlign(Uint32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
        }

      } else {
        let dataView = new DataView(arrayBuffer, byteOffset, byteLength);
        let byteDelta = componentBytes * componentN;
        let littleEndian = true;
        for (let pos = 0; pos < byteLength; pos += byteDelta) {
          switch (accessor.type) {
            case 'SCALAR':
              vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
              break;
            case 'VEC2':
              vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
              vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
              break;
            case 'VEC3':
              vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
              vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
              vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes * 2, littleEndian));
              break;
            case 'VEC4':
              vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
              vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
              vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes * 2, littleEndian));
              vertexAttributeArray.push(dataView[dataViewMethod](pos + componentBytes * 3, littleEndian));
              break;
          }
        }
        if (dataViewMethod === 'getInt8') {
          vertexAttributeArray = new Int8Array(vertexAttributeArray);
        } else if (dataViewMethod === 'getUint8') {
          vertexAttributeArray = new Uint8Array(vertexAttributeArray);
        } else if (dataViewMethod === 'getInt16') {
          vertexAttributeArray = new Int16Array(vertexAttributeArray);
        } else if (dataViewMethod === 'getUint16') {
          vertexAttributeArray = new Uint16Array(vertexAttributeArray);
        } else if (dataViewMethod === 'getInt32') {
          vertexAttributeArray = new Int32Array(vertexAttributeArray);
        } else if (dataViewMethod === 'getUint32') {
          vertexAttributeArray = new Uint32Array(vertexAttributeArray);
        } else if (dataViewMethod === 'getFloat32') {
          vertexAttributeArray = new Float32Array(vertexAttributeArray);
        }
      }
    } else {
      let dataView = new DataView(arrayBuffer, byteOffset, byteLength);
      let byteDelta = componentBytes * componentN;
      let littleEndian = true;
      for (let pos = 0; pos < byteLength; pos += byteDelta) {

        switch (accessor.type) {
          case 'SCALAR':
            vertexAttributeArray.push(dataView[dataViewMethod](pos, littleEndian));
            break;
          case 'VEC2':
            vertexAttributeArray.push(new Vector2(
              dataView[dataViewMethod](pos, littleEndian),
              dataView[dataViewMethod](pos+componentBytes, littleEndian)
            ));
            break;
          case 'VEC3':
            vertexAttributeArray.push(new Vector3(
              dataView[dataViewMethod](pos, littleEndian),
              dataView[dataViewMethod](pos+componentBytes, littleEndian),
              dataView[dataViewMethod](pos+componentBytes*2, littleEndian)
            ));
            break;
          case 'VEC4':
            if (accessor.extras && accessor.extras.quaternionIfVec4) {
              vertexAttributeArray.push(new Quaternion(
                dataView[dataViewMethod](pos, littleEndian),
                dataView[dataViewMethod](pos+componentBytes, littleEndian),
                dataView[dataViewMethod](pos+componentBytes*2, littleEndian),
                dataView[dataViewMethod](pos+componentBytes*3, littleEndian)
              ));
            } else {
              vertexAttributeArray.push(new Vector4(
                dataView[dataViewMethod](pos, littleEndian),
                dataView[dataViewMethod](pos+componentBytes, littleEndian),
                dataView[dataViewMethod](pos+componentBytes*2, littleEndian),
                dataView[dataViewMethod](pos+componentBytes*3, littleEndian)
              ));
            }
            break;
          case 'MAT4':
            let matrixComponents = [];
            for (let i=0; i<16; i++) {
              matrixComponents[i] = dataView[dataViewMethod](pos+componentBytes*i, littleEndian);
            }
            vertexAttributeArray.push(new Matrix44(matrixComponents, true));
            break;
        }

      }
    }

    accessor.extras.vertexAttributeArray = vertexAttributeArray;

    return vertexAttributeArray;
  }
}

import EntityRepository from "../core/EntityRepository";
import TransformComponent from "../components/TransformComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";
import Entity from "../core/Entity";
import Vector3 from "../math/Vector3";
import Quaternion from "../math/Quaternion";
import Matrix44 from "../math/Matrix44";
import MeshRendererComponent from "../components/MeshRendererComponent";
import Primitive from "../geometry/Primitive";
import Buffer from "../memory/Buffer";
import { PrimitiveMode } from "../definitions/PrimitiveMode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import { VertexAttribute } from "../definitions/VertexAttribute";
import MutableMatrix44 from "../math/MutableMatrix44";
import ColorRgb from "../math/ColorRgb";
import CameraComponent from "../components/CameraComponent";
import { CameraType } from "../definitions/CameraType";
import Texture from "../textures/Texture";
import Vector4 from "../math/Vector4";
import Vector2_F64 from "../math/Vector2";
import AnimationComponent from "../components/AnimationComponent";
import { Animation } from "../definitions/Animation";
import { MathUtil } from "../math/MathUtil";
import SkeletalComponent from "../components/SkeletalComponent";
import { AlphaMode } from "../definitions/AlphaMode";
import MaterialHelper from "../helpers/MaterialHelper";
import { ShaderSemantics } from "../definitions/ShaderSemantics";
import Vector2 from "../math/Vector2";
import Material from "../materials/Material";
import { ShadingModel } from "../definitions/ShadingModel";
import Component from "../core/Component";
import { VertexAttributeEnum } from "../main";
import Accessor from "../memory/Accessor";

declare var DracoDecoderModule: any;

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

  private __generateEntity(components: typeof Component[], gltfModel: glTF2): Entity {

    const repo = EntityRepository.getInstance();
    const entity = repo.createEntity(components);
    entity.tryToSetTag('SourceType', gltfModel.asset.extras!.fileType!);
    entity.tryToSetTag('SourceTypeVersion', gltfModel.asset.extras!.version!);

    return entity;
  }

  private __generateGroupEntity(gltfModel: glTF2): Entity {
    const entity = this.__generateEntity([TransformComponent, SceneGraphComponent], gltfModel);
    return entity;
  }

  private __generateMeshEntity(gltfModel: glTF2): Entity {
    const entity = this.__generateEntity([TransformComponent, SceneGraphComponent, MeshComponent, MeshRendererComponent], gltfModel);
    return entity;
  }

  private __generateCameraEntity(gltfModel: glTF2): Entity {
    const entity = this.__generateEntity([TransformComponent, SceneGraphComponent, CameraComponent], gltfModel);
    return entity;
  }

  convertToRhodoniteObject(gltfModel: glTF2) {

    // load binary data
    // for (let accessor of gltfModel.accessors) {
    //   this._accessBinaryWithAccessor(accessor);
    // }

    const rnBuffer = this.createRnBuffer(gltfModel);


    // Mesh, Camera, Group, ...
    const rnEntities = this.__setupObjects(gltfModel, rnBuffer);

    // Transfrom
    this._setupTransform(gltfModel, rnEntities);

    // Skeleton
    this._setupSkeleton(gltfModel, rnEntities);

    // Hierarchy
    this._setupHierarchy(gltfModel, rnEntities);

    // Camera
    //this._setupCamera(gltfModel, groups);

    // Animation
    this.__setupAnimation(gltfModel, rnEntities);

    // Root Group
    const rootGroup = this.__generateGroupEntity(gltfModel);
    rootGroup.tryToSetUniqueName('FileRoot', true);
    rootGroup.tryToSetTag('ObjectType', 'top');
    if (gltfModel.scenes[0].nodesIndices) {
      for (let nodesIndex of gltfModel.scenes[0].nodesIndices) {
        rootGroup.getSceneGraph().addChild(rnEntities[nodesIndex].getSceneGraph());
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

  _setupCamera(gltfModel: glTF2) {

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
        group.getTransform().translate = new Vector3(nodeJson.translation[0], nodeJson.translation[1], nodeJson.translation[2]);
      }
      if (nodeJson.scale) {
        group.getTransform().scale = new Vector3(nodeJson.scale[0], nodeJson.scale[1], nodeJson.scale[2]);
      }
      if (nodeJson.rotation) {
        group.getTransform().quaternion = new Quaternion(nodeJson.rotation[0], nodeJson.rotation[1], nodeJson.rotation[2], nodeJson.rotation[3]);
      }
      if (nodeJson.matrix) {
        group.getTransform().matrix = new Matrix44(nodeJson.matrix, true);
      }
    }
  }

  _setupHierarchy(gltfModel: glTF2, rnEntities: Entity[]) {
    const groupSceneComponents = rnEntities.map(group => { return group.getSceneGraph(); });

    for (let node_i in gltfModel.nodes) {
      const parentNode_i = parseInt(node_i);
      let node = gltfModel.nodes[parentNode_i];
      if (node.childrenIndices) {
        let parentGroup = groupSceneComponents[parentNode_i];
        for (let childNode_i of node.childrenIndices) {
          let childGroup = groupSceneComponents[childNode_i];
          parentGroup.addChild(childGroup);
        }
      }
    }
  }

  __setupAnimation(gltfModel: glTF2, rnEntities: Entity[]) {
    if (gltfModel.animations) {

      for (let animation of gltfModel.animations) {
        for (let sampler of animation.samplers) {
          this._accessBinaryWithAccessor(sampler.input);
          this._accessBinaryWithAccessor(sampler.output);
        }
      }
    }

    const entityRepository = EntityRepository.getInstance();

    if (gltfModel.animations) {
      for (let animation of gltfModel.animations) {

        for (let channel of animation.channels) {
          const animInputArray = channel.sampler.input.extras.typedDataArray;
          const animOutputArray = channel.sampler.output.extras.typedDataArray;
          const interpolation = (channel.sampler.interpolation != null) ? channel.sampler.interpolation : 'LINEAR';

          let animationAttributeName = '';
          if (channel.target.path === 'translation') {
            animationAttributeName = 'translate';
          } else if (channel.target.path === 'rotation') {
            animationAttributeName = 'quaternion';
          } else {
            animationAttributeName = channel.target.path;
          }

          let rnEntity = rnEntities[channel.target.nodeIndex];
          if (rnEntity) {
            entityRepository.addComponentsToEntity([AnimationComponent], rnEntity.entityUID);
            const animationComponent = rnEntity.getComponent(AnimationComponent) as AnimationComponent;
            if (animationComponent) {
              animationComponent.setAnimation(animationAttributeName, animInputArray, animOutputArray, Animation.fromString(interpolation));
            }
          }
        }
      }
    }
  }

  _setupSkeleton(gltfModel: glTF2, rnEntities: Entity[]) {
    if (gltfModel.skins == null) {
      return;
    }
    const entityRepository = EntityRepository.getInstance();
    for (let skin of gltfModel.skins) {
      if (skin.inverseBindMatrices) {
        this._accessBinaryWithAccessor(skin.inverseBindMatrices);
      }
    }

    for (let node_i in gltfModel.nodes) {
      let node = gltfModel.nodes[node_i];
      let sg = rnEntities[node_i].getSceneGraph();
      let skeletalComponent: SkeletalComponent;
      if (node.skin != null) {
        let rnEntity = rnEntities[node_i];
        entityRepository.addComponentsToEntity([SkeletalComponent], rnEntity.entityUID);
        skeletalComponent = rnEntity.getComponent(SkeletalComponent) as SkeletalComponent;

        //        skeletalComponent.isSkinning = false;

        skeletalComponent._jointIndices = node.skin.jointsIndices;
        if (node.skin.bindShapeMatrix != null) {
          skeletalComponent._bindShapeMatrix = new Matrix44(node.skin.bindShapeMatrix);
        }
      }

      if (node.skin && node.skin.skeleton) {
        sg.isRootJoint = true;
        // if (node.meshes) {
        //   // let rnEntity = rnEntities[node_i];
        //   // entityRepository
        //   // for (let mesh of node.meshes) {
        //   //   mesh
        //   //   const entity = this.__generateMeshEntity() {

        //   //   }
        //   // }
        //   // skeletalComponent!.jointsHierarchy = rnEntities[node.skin.skeletonIndex].getSceneGraph();
        // } else 
        if (node.mesh) {
          const joints = [];
          for (let i of node.skin.jointsIndices) {
            joints.push(rnEntities[i].getSceneGraph());
          }
          skeletalComponent!.joints = joints;
          //skeletalComponent!.jointsHierarchy = rnEntities[node.skin.skeletonIndex].getSceneGraph();
        }
      }

      if (node.skin && node.skin.joints) {
        for (let joint_i of node.skin.jointsIndices) {
          let sg = rnEntities[joint_i].getSceneGraph();
          sg.jointIndex = joint_i;
        }
      }
      if (node.skin && node.skin.inverseBindMatrices != null) {
        skeletalComponent!._inverseBindMatrices = node.skin.inverseBindMatrices.extras.typedDataArray;
      }
    }
  }


  __setupObjects(gltfModel: glTF2, rnBuffer: Buffer) {
    //const meshEntities: Entity[] = [];
    const rnEntities: Entity[] = [];

    for (let node_i in gltfModel.nodes) {
      let node = gltfModel.nodes[parseInt(node_i)];
      if (node.mesh != null) {
        const meshEntity = this.__setupMesh(node.mesh, rnBuffer, gltfModel);
        if (node.name) {
          meshEntity.tryToSetUniqueName(node.name, true);
        }
        if (node.mesh.name) {
          meshEntity.tryToSetUniqueName(node.mesh.name, true);
        }
        rnEntities.push(meshEntity);
      } else if (node.camera != null) {
        const cameraEntity = this.__setupCamera(node.camera, gltfModel);
        if (node.name) {
          cameraEntity.tryToSetUniqueName(node.name, true);
        }
        rnEntities.push(cameraEntity);
      } else {
        const group = this.__generateGroupEntity(gltfModel);
        if (node.name) {
          group.tryToSetUniqueName(node.name, true);
        }
        rnEntities.push(group);
      }
    }

    return rnEntities;
  }

  private __setupCamera(camera: any, gltfModel: glTF2) {
    const cameraEntity = this.__generateCameraEntity(gltfModel);
    const cameraComponent = cameraEntity.getComponent(CameraComponent)! as CameraComponent;
    cameraComponent.direction = new Vector3(0, 0, -1);
    if (gltfModel.asset && (gltfModel.asset as any).LastSaved_ApplicationVendor) {
      // For an old exporter compatibility
      cameraComponent.direction = new Vector3(1, 0, 0);
      cameraComponent.directionInner = new Vector3(1, 0, 0);
    }
    cameraComponent.up = new Vector3(0, 1, 0);
    cameraComponent.type = CameraType.fromString(camera.type);
    if (cameraComponent.type === CameraType.Perspective) {
      cameraComponent.aspect = camera.perspective.aspectRatio ? camera.perspective.aspectRatio : 1;
      cameraComponent.fovy = MathUtil.radianToDegree(camera.perspective.yfov);
      cameraComponent.zNear = camera.perspective.znear;
      cameraComponent.zFar = camera.perspective.zfar ? camera.perspective.zfar : 100000;
    } else if (cameraComponent.type === CameraType.Orthographic) {
      cameraComponent.xmag = camera.orthographic.zmag;
      cameraComponent.ymag = camera.orthographic.ymag;
      cameraComponent.zNear = camera.orthographic.znear;
      cameraComponent.zFar = camera.orthographic.zfar;
    }
    return cameraEntity;
  }

  private __setupMesh(mesh: any, rnBuffer: Buffer, gltfModel: glTF2) {
    const meshEntity = this.__generateMeshEntity(gltfModel);
    let rnPrimitiveMode = PrimitiveMode.Triangles;

    const meshComponent = meshEntity.getComponent(MeshComponent)! as MeshComponent;

    for (let i in mesh.primitives) {
      let primitive = mesh.primitives[i];
      if (primitive.mode != null) {
        rnPrimitiveMode = PrimitiveMode.from(primitive.mode);
      }
      // indices
      let indicesRnAccessor;
      const map: Map<VertexAttributeEnum, Accessor> = new Map();

      if (primitive.extensions && primitive.extensions.KHR_draco_mesh_compression) {
        indicesRnAccessor = this.__decodeDraco(primitive, rnBuffer, gltfModel, map);

        if (indicesRnAccessor == null) {
          break;
        }
      } else {
        // attributes
        if (primitive.indices) {
          indicesRnAccessor = this.__getRnAccessor(primitive.indices, rnBuffer);
        }
        for (let attributeName in primitive.attributes) {
          let attributeAccessor = primitive.attributes[attributeName];
          const attributeRnAccessor = this.__getRnAccessor(attributeAccessor, rnBuffer);
          map.set(VertexAttribute.fromString(attributeAccessor.extras.attributeName), attributeRnAccessor);
        }
      }
      const material = this.__setupMaterial(gltfModel, primitive.material);
      const rnPrimitive = new Primitive();
      rnPrimitive.setData(map, rnPrimitiveMode, material, indicesRnAccessor);

      // morph targets
      if (primitive.targets != null) {
        const targets: Array<Map<VertexAttributeEnum, Accessor>> = [];
        for (let target of primitive.targets) {
          const targetMap: Map<VertexAttributeEnum, Accessor> = new Map();
          for (let attributeName in target) {
            let attributeAccessor = target[attributeName];
            const attributeRnAccessor = this.__getRnAccessor(attributeAccessor, rnBuffer);
            targetMap.set(VertexAttribute.fromString(attributeName), attributeRnAccessor);
          }
          targets.push(targetMap);
        }
        rnPrimitive.setTargets(targets);
      }

      meshComponent.addPrimitive(rnPrimitive);
    }

    if (mesh.weights) {
      meshComponent.weights = mesh.weights;
    }

    return meshEntity;
  }

  private __setupMaterial(gltfModel: any, materialJson: any): Material | undefined {
    if (materialJson == null) {
      return void 0;
    }

    let material: Material;
    if (gltfModel.asset != null && gltfModel.asset.version === '2') {
    } else {
    }
    const pbrMetallicRoughness = materialJson.pbrMetallicRoughness;
    if (pbrMetallicRoughness != null) {
      material = MaterialHelper.createPbrUberMaterial();

      const baseColorFactor = pbrMetallicRoughness.baseColorFactor;
      if (baseColorFactor != null) {
        material.setParameter(ShaderSemantics.BaseColorFactor, new Vector4(baseColorFactor));
      }

      const baseColorTexture = pbrMetallicRoughness.baseColorTexture;
      if (baseColorTexture != null) {
        const texture = baseColorTexture.texture;
        const image = texture.image.image;
        const rnTexture = new Texture();
        rnTexture.generateTextureFromImage(image);
        rnTexture.name = image.name;
        // material.baseColorTexture = rnTexture;
        material.setTextureParameter(ShaderSemantics.BaseColorTexture, rnTexture.texture3DAPIResourseUid);
      }

      const normalTexture = materialJson.normalTexture;
      if (normalTexture != null) {
        const texture = normalTexture.texture;
        const image = texture.image.image;
        const rnTexture = new Texture();
        rnTexture.generateTextureFromImage(image);
        rnTexture.name = image.name;
        // material.normalTexture = rnTexture;
        material.setTextureParameter(ShaderSemantics.NormalTexture, rnTexture.texture3DAPIResourseUid);
      }

      const occlusionTexture = materialJson.occlusionTexture;
      if (occlusionTexture != null) {
        const texture = occlusionTexture.texture;
        const image = texture.image.image;
        const rnTexture = new Texture();
        rnTexture.generateTextureFromImage(image);
        rnTexture.name = image.name;
        // material.occlusionTexture = rnTexture;
        material.setTextureParameter(ShaderSemantics.OcclusionTexture, rnTexture.texture3DAPIResourseUid);
      }

      let metallicFactor = pbrMetallicRoughness.metallicFactor;
      metallicFactor = (metallicFactor != null) ? metallicFactor : 1;
      let roughnessFactor = pbrMetallicRoughness.roughnessFactor;
      roughnessFactor = (roughnessFactor != null) ? roughnessFactor : 1;
      material.setParameter(ShaderSemantics.MetallicRoughnessFactor, new Vector2(metallicFactor, roughnessFactor));

      const metallicRoughnessTexture = pbrMetallicRoughness.metallicRoughnessTexture;
      if (metallicRoughnessTexture != null) {
        const texture = metallicRoughnessTexture.texture;
        const image = texture.image.image;
        const rnTexture = new Texture();
        rnTexture.generateTextureFromImage(image);
        rnTexture.name = image.name;
        // material.metallicRoughnessTexture = rnTexture;
        material.setTextureParameter(ShaderSemantics.MetallicRoughnessTexture, rnTexture.texture3DAPIResourseUid);
      }

      const alphaMode = materialJson.alphaMode;
      if (alphaMode != null) {
        material.alphaMode = AlphaMode.fromString(alphaMode);
      }
    } else {
      material = MaterialHelper.createClassicUberMaterial();
      let param: Index = ShadingModel.Phong.index;
      if (materialJson.extras && materialJson.extras.technique) {
        switch (materialJson.extras.technique) {
          case ShadingModel.Constant.str: param = ShadingModel.Constant.index; break;
          case ShadingModel.Lambert.str: param = ShadingModel.Lambert.index; break;
          case ShadingModel.BlinnPhong.str: param = ShadingModel.BlinnPhong.index; break;
          case ShadingModel.Phong.str: param = ShadingModel.Phong.index; break;
        }
        material.setParameter(ShaderSemantics.ShadingModel, param);
      }
    }

    const diffuseColorTexture = materialJson.diffuseColorTexture;
    if (diffuseColorTexture != null) {
      const texture = diffuseColorTexture.texture;
      const image = texture.image.image;
      const rnTexture = new Texture();
      rnTexture.generateTextureFromImage(image);
      rnTexture.name = image.name;
      // material.emissiveTexture = rnTexture;
      material.setTextureParameter(ShaderSemantics.DiffuseColorTexture, rnTexture.texture3DAPIResourseUid);
    }

    const emissiveTexture = materialJson.emissiveTexture;
    if (emissiveTexture != null) {
      const texture = emissiveTexture.texture;
      const image = texture.image.image;
      const rnTexture = new Texture();
      rnTexture.generateTextureFromImage(image);
      rnTexture.name = image.name;
      // material.emissiveTexture = rnTexture;
      material.setTextureParameter(ShaderSemantics.EmissiveTexture, rnTexture.texture3DAPIResourseUid);
    }

    const diffuseColorFactor = materialJson.diffuseColorFactor;
    if (diffuseColorFactor != null) {
      material.setParameter(ShaderSemantics.DiffuseColorFactor, new Vector4(diffuseColorFactor));
    }



    return material;
  }

  _adjustByteAlign(typedArrayClass: any, arrayBuffer: ArrayBuffer, alignSize: Size, byteOffset: Byte, length: Size) {
    if ((byteOffset % alignSize) != 0) {
      return new typedArrayClass(arrayBuffer.slice(byteOffset), 0, length);
    } else {
      return new typedArrayClass(arrayBuffer, byteOffset, length);
    }
  }

  _checkBytesPerComponent(accessor: any) {

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

  _checkComponentNumber(accessor: any) {

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

  _checkDataViewMethod(accessor: any) {
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

  _accessBinaryWithAccessor(accessor: any) {
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

    var typedDataArray: any = [];

    if (accessor.extras && accessor.extras.toGetAsTypedArray) {
      if (ModelConverter._isSystemLittleEndian()) {
        if (dataViewMethod === 'getFloat32') {
          typedDataArray = this._adjustByteAlign(Float32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt8') {
          typedDataArray = new Int8Array(arrayBuffer, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint8') {
          typedDataArray = new Uint8Array(arrayBuffer, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt16') {
          typedDataArray = this._adjustByteAlign(Int16Array, arrayBuffer, 2, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint16') {
          typedDataArray = this._adjustByteAlign(Uint16Array, arrayBuffer, 2, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt32') {
          typedDataArray = this._adjustByteAlign(Int32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint32') {
          typedDataArray = this._adjustByteAlign(Uint32Array, arrayBuffer, 4, byteOffset, byteLength / componentBytes);
        }

      } else {
        let dataView: any = new DataView(arrayBuffer, byteOffset, byteLength);
        let byteDelta = componentBytes * componentN;
        let littleEndian = true;
        for (let pos = 0; pos < byteLength; pos += byteDelta) {
          switch (accessor.type) {
            case 'SCALAR':
              typedDataArray.push(dataView[dataViewMethod](pos, littleEndian));
              break;
            case 'VEC2':
              typedDataArray.push(dataView[dataViewMethod](pos, littleEndian));
              typedDataArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
              break;
            case 'VEC3':
              typedDataArray.push(dataView[dataViewMethod](pos, littleEndian));
              typedDataArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
              typedDataArray.push(dataView[dataViewMethod](pos + componentBytes * 2, littleEndian));
              break;
            case 'VEC4':
              typedDataArray.push(dataView[dataViewMethod](pos, littleEndian));
              typedDataArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
              typedDataArray.push(dataView[dataViewMethod](pos + componentBytes * 2, littleEndian));
              typedDataArray.push(dataView[dataViewMethod](pos + componentBytes * 3, littleEndian));
              break;
          }
        }
        if (dataViewMethod === 'getInt8') {
          typedDataArray = new Int8Array(typedDataArray);
        } else if (dataViewMethod === 'getUint8') {
          typedDataArray = new Uint8Array(typedDataArray);
        } else if (dataViewMethod === 'getInt16') {
          typedDataArray = new Int16Array(typedDataArray);
        } else if (dataViewMethod === 'getUint16') {
          typedDataArray = new Uint16Array(typedDataArray);
        } else if (dataViewMethod === 'getInt32') {
          typedDataArray = new Int32Array(typedDataArray);
        } else if (dataViewMethod === 'getUint32') {
          typedDataArray = new Uint32Array(typedDataArray);
        } else if (dataViewMethod === 'getFloat32') {
          typedDataArray = new Float32Array(typedDataArray);
        }
      }
    } else {
      let dataView: any = new DataView(arrayBuffer, byteOffset, byteLength);
      let byteDelta = componentBytes * componentN;
      if (accessor.extras && accessor.extras.weightCount) {
        byteDelta = componentBytes * componentN * accessor.extras.weightCount;
      }
      let littleEndian = true;
      for (let pos = 0; pos < byteLength; pos += byteDelta) {

        switch (accessor.type) {
          case 'SCALAR':
            if (accessor.extras && accessor.extras.weightCount) {
              const array = [];
              for (let i = 0; i < accessor.extras.weightCount; i++) {
                array.push(dataView[dataViewMethod](pos + componentBytes * i, littleEndian));
              }
              typedDataArray.push(array);
            } else {
              typedDataArray.push(dataView[dataViewMethod](pos, littleEndian));
            }
            break;
          case 'VEC2':
            typedDataArray.push(new Vector2(
              dataView[dataViewMethod](pos, littleEndian),
              dataView[dataViewMethod](pos + componentBytes, littleEndian)
            ));
            break;
          case 'VEC3':
            typedDataArray.push(new Vector3(
              dataView[dataViewMethod](pos, littleEndian),
              dataView[dataViewMethod](pos + componentBytes, littleEndian),
              dataView[dataViewMethod](pos + componentBytes * 2, littleEndian)
            ));
            break;
          case 'VEC4':
            if (accessor.extras && accessor.extras.quaternionIfVec4) {
              typedDataArray.push(new Quaternion(
                dataView[dataViewMethod](pos, littleEndian),
                dataView[dataViewMethod](pos + componentBytes, littleEndian),
                dataView[dataViewMethod](pos + componentBytes * 2, littleEndian),
                dataView[dataViewMethod](pos + componentBytes * 3, littleEndian)
              ));
            } else {
              typedDataArray.push(new Vector4(
                dataView[dataViewMethod](pos, littleEndian),
                dataView[dataViewMethod](pos + componentBytes, littleEndian),
                dataView[dataViewMethod](pos + componentBytes * 2, littleEndian),
                dataView[dataViewMethod](pos + componentBytes * 3, littleEndian)
              ));
            }
            break;
          case 'MAT4':
            let matrixComponents = [];
            for (let i = 0; i < 16; i++) {
              matrixComponents[i] = dataView[dataViewMethod](pos + componentBytes * i, littleEndian);
            }
            typedDataArray.push(new Matrix44(matrixComponents, true));
            break;
        }

      }
    }

    accessor.extras.typedDataArray = typedDataArray;

    return typedDataArray;
  }

  private __addOffsetToIndices(meshComponent: MeshComponent) {
    const primitiveNumber = meshComponent.getPrimitiveNumber();
    let offsetSum = 0;
    for (let i = 0; i < primitiveNumber; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);
      const indicesAccessor = primitive.indicesAccessor;
      if (indicesAccessor) {
        const elementNumber = indicesAccessor.elementCount;
        for (let j = 0; j < elementNumber; j++) {
          const index = indicesAccessor.getScalar(j, {});
          indicesAccessor.setScalar(j, index + offsetSum, {});
        }
        offsetSum += elementNumber;
      }
    }
  }

  private __getRnAccessor(accessor: any, rnBuffer: Buffer) {
    const bufferView = accessor.bufferView;
    const rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
      byteLengthToNeed: bufferView.byteLength,
      byteStride: (bufferView.byteStride != null) ? bufferView.byteStride : 0,
      byteOffset: (bufferView.byteOffset != null) ? bufferView.byteOffset : 0,
      isAoS: false
    });

    let rnAccessor;
    if (accessor.byteStride != null) {
      rnAccessor = rnBufferView.takeFlexibleAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: accessor.count,
        byteStride: accessor.byteStride,
        byteOffset: (accessor.byteOffset != null) ? accessor.byteOffset : 0,
        max: accessor.max,
        min: accessor.min
      });
    } else {
      rnAccessor = rnBufferView.takeAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: accessor.count,
        byteOffset: (accessor.byteOffset != null) ? accessor.byteOffset : 0,
        max: accessor.max,
        min: accessor.min
      });
    }

    return rnAccessor;
  }

  private __createRnAccessor(accessor: any, numOfAttributes: Count, compositionNum: Count, rnBuffer: Buffer) {
    const rnBufferView = rnBuffer.takeBufferView({
      byteLengthToNeed: numOfAttributes * compositionNum * 4,
      byteStride: 0,
      isAoS: false
    });

    let rnAccessor;
    if (accessor.byteStride != null) {
      rnAccessor = rnBufferView.takeFlexibleAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: numOfAttributes,
        byteStride: accessor.byteStride,
        byteOffset: (accessor.byteOffset != null) ? accessor.byteOffset : 0,
        max: accessor.max,
        min: accessor.min
      });
    } else {
      rnAccessor = rnBufferView.takeAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: numOfAttributes,
        byteOffset: (accessor.byteOffset != null) ? accessor.byteOffset : 0,
        max: accessor.max,
        min: accessor.min
      });
    }

    return rnAccessor;
  }



  private __getRnBufferView(bufferView: any, rnBuffer: Buffer) {
    const rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
      byteLengthToNeed: bufferView.byteLength,
      byteStride: (bufferView.byteStride != null) ? bufferView.byteStride : 0,
      byteOffset: (bufferView.byteOffset != null) ? bufferView.byteOffset : 0,
      isAoS: false
    });

    return rnBufferView;
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
    } else if (geometryType == draco.POINT_CLOUD) {
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

  __getIndicesFromDraco(draco: any, decoder: any, dracoGeometry: any, triangleStripDrawMode: boolean) {
    // For mesh, we need to generate the faces.
    const geometryType = dracoGeometry.geometryType;
    if (geometryType !== draco.TRIANGULAR_MESH) {
      return void 0;
    }

    let indices;

    if (triangleStripDrawMode) {
      const stripsArray = new draco.DracoInt32Array();
      decoder.GetTriangleStripsFromMesh(dracoGeometry, stripsArray);
      indices = new Uint32Array(stripsArray.size());
      for (var i = 0; i < stripsArray.size(); ++i) {
        indices[i] = stripsArray.GetValue(i);
      }
      draco.destroy(stripsArray);
    } else { // TRIANGLES
      const numFaces = dracoGeometry.num_faces();
      const numIndices = numFaces * 3;
      indices = new Uint32Array(numIndices);
      const ia = new draco.DracoInt32Array();
      for (let i = 0; i < numFaces; ++i) {
        decoder.GetFaceFromMesh(dracoGeometry, i, ia);
        var index = i * 3;
        indices[index] = ia.GetValue(0);
        indices[index + 1] = ia.GetValue(1);
        indices[index + 2] = ia.GetValue(2);
      }
      draco.destroy(ia);
    }
    return indices;
  }

  private __decodeDraco(primitive: any, rnBuffer: Buffer, gltfModel: glTF2, map: Map<VertexAttributeEnum, Accessor>) {
    const bufferView = gltfModel.bufferViews[primitive.extensions.KHR_draco_mesh_compression.bufferView];
    const rnBufferView = this.__getRnBufferView(bufferView, rnBuffer);
    const arraybufferOfBufferView = new Uint8Array(rnBufferView.getUint8Array()).buffer;

    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.__getGeometryFromDracoBuffer(draco, decoder, arraybufferOfBufferView);
    if (dracoGeometry == null) {
      draco.destroy(dracoGeometry);
      draco.destroy(decoder);
      return void 0;
    }
    const numPoints = dracoGeometry.num_points();

    const posAttId = decoder.GetAttributeId(dracoGeometry, draco.POSITION);
    if (posAttId == -1) {
      const errorMsg = 'Position attribute not found in draco.';
      console.error(errorMsg);
      draco.destroy(dracoGeometry);
      draco.destroy(decoder);
      return void 0;
    }

    let lengthOfRnBufferForDraco = 0;
    if (primitive.indices) {
      const count = primitive.indices.count;
      lengthOfRnBufferForDraco += count * 4;
    }
    for (let attributeName in primitive.attributes) {
      const accessor = primitive.attributes[attributeName];
      const compositionNum = CompositionType.fromString(accessor.type).getNumberOfComponents();
      const attributeByteLength = numPoints * compositionNum * 4;
      lengthOfRnBufferForDraco += attributeByteLength;
    }

    const rnDracoBuffer = new Buffer({
      byteLength: lengthOfRnBufferForDraco,
      arrayBuffer: new ArrayBuffer(lengthOfRnBufferForDraco),
      name: 'Draco'
    });

    const primitiveMode = PrimitiveMode.from(primitive.mode);
    let isTriangleStrip = false;
    if (primitiveMode === PrimitiveMode.TriangleStrip) {
      isTriangleStrip = true;
    }

    const indices = this.__getIndicesFromDraco(draco, decoder, dracoGeometry, isTriangleStrip)!;
    const indicesDracoAccessor = this.__createRnAccessor(primitive.indices, indices.length, 1, rnDracoBuffer);
    for (let i = 0; i < indices.length; i++) {
      indicesDracoAccessor.setScalar(i, indices[i], {});
    }

    for (let attributeName in primitive.attributes) {
      const attributeAccessor = primitive.attributes[attributeName];

      const compositionNum = CompositionType.fromString(attributeAccessor.type).getNumberOfComponents();
      const attributeRnDracoAccessor = this.__createRnAccessor(attributeAccessor, numPoints, compositionNum, rnDracoBuffer);

      let dracoAttributeName = attributeName;
      if (attributeName === 'TEXCOORD_0') {
        dracoAttributeName = 'TEX_COORD';
      }

      const attId = decoder.GetAttributeId(dracoGeometry, draco[dracoAttributeName]);
      if (attId === -1) {
        const errorMsg = attributeName + 'attribute not found in draco.';
        console.error(errorMsg);
        continue;
      }

      const attribute = decoder.GetAttribute(dracoGeometry, attId);
      const attributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, attributeData);

      for (let i = 0; i < numPoints; i++) {
        if (compositionNum === 1) {
          attributeRnDracoAccessor.setScalar(i, attributeData.GetValue(i * compositionNum), {});
        } else if (compositionNum === 2) {
          attributeRnDracoAccessor.setVec2(i, attributeData.GetValue(i * compositionNum), attributeData.GetValue(i * compositionNum + 1), {});
        } else if (compositionNum === 3) {
          attributeRnDracoAccessor.setVec3(i, attributeData.GetValue(i * compositionNum), attributeData.GetValue(i * compositionNum + 1), attributeData.GetValue(i * compositionNum + 2), {});
        } else if (compositionNum === 4) {
          attributeRnDracoAccessor.setVec4(i, attributeData.GetValue(i * compositionNum), attributeData.GetValue(i * compositionNum + 1), attributeData.GetValue(i * compositionNum + 2), attributeData.GetValue(i * compositionNum + 3), {});
        }
      }

      draco.destroy(attributeData);
      map.set(VertexAttribute.fromString(attributeAccessor.extras.attributeName), attributeRnDracoAccessor);
    }
    draco.destroy(dracoGeometry);
    draco.destroy(decoder);

    return indicesDracoAccessor;
  }
}

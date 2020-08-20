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
import { VertexAttribute, VertexAttributeEnum } from "../definitions/VertexAttribute";
import CameraComponent from "../components/CameraComponent";
import { CameraType } from "../definitions/CameraType";
import Texture from "../textures/Texture";
import Vector4 from "../math/Vector4";
import AnimationComponent from "../components/AnimationComponent";
import { AnimationInterpolation } from "../definitions/AnimationInterpolation";
import { MathUtil } from "../math/MathUtil";
import SkeletalComponent from "../components/SkeletalComponent";
import { AlphaMode } from "../definitions/AlphaMode";
import MaterialHelper from "../helpers/MaterialHelper";
import { ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import Vector2 from "../math/Vector2";
import Material from "../materials/core/Material";
import { ShadingModel } from "../definitions/ShadingModel";
import Component from "../core/Component";
import Accessor from "../memory/Accessor";
import Mesh from "../geometry/Mesh";
import MutableVector4 from "../math/MutableVector4";
import LightComponent from "../components/LightComponent";
import { LightType } from "../definitions/LightType";
import { Count, Byte, Size, Index } from "../../commontypes/CommonTypes";
import { GltfLoadOption, glTF2, Gltf2Node, Gltf2Accessor, Gltf2BufferView, Gltf2Primitive, Gltf2Material } from "../../commontypes/glTF";
import Config from "../core/Config";
import { BufferUse } from "../definitions/BufferUse";
import MemoryManager from "../core/MemoryManager";
import ILoaderExtension from "./ILoaderExtension";
import BlendShapeComponent from "../components/BlendShapeComponent";
import GlobalDataRepository from "../core/GlobalDataRepository";
import PbrShadingSingleMaterialNode from "../materials/singles/PbrShadingSingleMaterialNode";
import Scalar from "../math/Scalar";
import { TextureParameter } from "../definitions/TextureParameter";
import FlexibleAccessor from "../memory/FlexibleAccessor";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";

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

  _getDefaultShader(options: GltfLoadOption) {
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
    entity.tryToSetTag({ tag: 'SourceType', value: gltfModel.asset.extras!.fileType! });
    entity.tryToSetTag({ tag: 'SourceTypeVersion', value: gltfModel.asset.extras!.version! });

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

  private __generateLightEntity(gltfModel: glTF2): Entity {
    const entity = this.__generateEntity([TransformComponent, SceneGraphComponent, LightComponent], gltfModel);
    return entity;
  }

  convertToRhodoniteObject(gltfModel: glTF2) {

    (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx = [];

    const rnBuffers = this.createRnBuffer(gltfModel);
    gltfModel.asset.extras!.rnMaterials = [];

    // Mesh, Camera, Group, ...
    const { rnEntities, rnEntitiesByNames } = this.__setupObjects(gltfModel, rnBuffers);
    gltfModel.asset.extras!.rnEntities = rnEntities;

    // Transform
    this._setupTransform(gltfModel, rnEntities);

    // Skeleton
    this._setupSkeleton(gltfModel, rnEntities);

    // Hierarchy
    this._setupHierarchy(gltfModel, rnEntities);

    // Camera
    //this._setupCamera(gltfModel, groups);

    // Animation
    this._setupAnimation(gltfModel, rnEntities);

    // Root Group
    const rootGroup = this.__generateGroupEntity(gltfModel);
    rootGroup.tryToSetUniqueName('FileRoot', true);
    rootGroup.tryToSetTag({ tag: 'ObjectType', value: 'top' });
    if (gltfModel.scenes[0].nodesIndices) {
      for (let nodesIndex of gltfModel.scenes[0].nodesIndices) {
        rootGroup.getSceneGraph().addChild(rnEntities[nodesIndex].getSceneGraph());
      }
    }

    rootGroup.tryToSetTag({ tag: 'rnEntities', value: rnEntities })
    rootGroup.tryToSetTag({ tag: 'rnEntitiesByNames', value: rnEntitiesByNames })
    rootGroup.tryToSetTag({ tag: 'gltfModel', value: gltfModel })

    return rootGroup;
  }

  _setupCamera(gltfModel: glTF2) {

  }

  private createRnBuffer(gltfModel: glTF2): Buffer[] {
    const rnBuffers = [];
    for (let buffer of gltfModel.buffers) {
      const rnBuffer = new Buffer({
        byteLength: buffer.byteLength,
        buffer: buffer.buffer!,
        name: `gltf2Buffer_0_(${buffer.uri})`
      });
      rnBuffers.push(rnBuffer);
    }
    return rnBuffers;
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

  /**
   * @private
   */
  _setupAnimation(gltfModel: glTF2, rnEntities: Entity[]) {
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
          const interpolation = channel.sampler.interpolation ?? 'LINEAR';

          let animationAttributeName = '';
          if (channel.target.path === 'translation') {
            animationAttributeName = 'translate';
          } else if (channel.target.path === 'rotation') {
            animationAttributeName = 'quaternion';
          } else {
            animationAttributeName = channel.target.path;
          }

          let rnEntity = rnEntities[channel.target.nodeIndex!];
          if (rnEntity) {
            entityRepository.addComponentsToEntity([AnimationComponent], rnEntity.entityUID);
            const animationComponent = rnEntity.getComponent(AnimationComponent) as AnimationComponent;
            if (animationComponent) {
              animationComponent.setAnimation(animationAttributeName, animInputArray, animOutputArray, AnimationInterpolation.fromString(interpolation));
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

    const globalDataRepository = GlobalDataRepository.getInstance();
    const entityRepository = EntityRepository.getInstance();
    for (let skin of gltfModel.skins) {
      // globalDataRepository.takeOne(ShaderSemantics.BoneQuaternion);
      // globalDataRepository.takeOne(ShaderSemantics.BoneTranslateScale);

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
          skeletalComponent._bindShapeMatrix = new Matrix44(node.skin.bindShapeMatrix, true);
        }
      }

      if (node.skin?.skeleton) {
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
          if (node.skin.skeletonIndex != null) {
            skeletalComponent!.jointsHierarchy = rnEntities[node.skin.skeletonIndex].getSceneGraph();
          } else {
            skeletalComponent!.jointsHierarchy = joints[0];
          }
        }
      }

      if (node.skin?.joints) {
        for (let joint_i of node.skin.jointsIndices) {
          let sg = rnEntities[joint_i].getSceneGraph();
          sg.jointIndex = joint_i;
        }
      }
      if (node.skin?.inverseBindMatrices != null) {
        skeletalComponent!._inverseBindMatrices = node.skin.inverseBindMatrices.extras.typedDataArray;
      }
    }
  }


  __setupObjects(gltfModel: glTF2, rnBuffers: Buffer[]) {
    const rnEntities: Entity[] = [];
    const rnEntitiesByNames: Map<String, Entity> = new Map();

    for (let node_i in gltfModel.nodes) {
      let node = gltfModel.nodes[parseInt(node_i)] as Gltf2Node;
      let entity;
      if (node.mesh != null) {
        let meshIdxOrName: any = node.meshIndex;
        if (meshIdxOrName == null) {
          meshIdxOrName = node.meshNames![0];
        }
        const meshEntity = this.__setupMesh(node, node.mesh, meshIdxOrName, rnBuffers, gltfModel);
        if (node.name) {
          meshEntity.tryToSetUniqueName(node.name, true);
        }
        if (node.mesh.name) {
          const meshComponent = meshEntity.getComponent(MeshComponent)!;
          meshComponent.tryToSetUniqueName(node.mesh.name, true);
        }
        entity = meshEntity;
      } else if (node.camera != null) {
        const cameraEntity = this.__setupCamera(node.camera, gltfModel);
        if (node.name) {
          cameraEntity.tryToSetUniqueName(node.name, true);
        }
        entity = cameraEntity;
      } else if (node.extensions?.KHR_lights_punctual) {
        const lightEntity = this.__setupLight(node.extensions.KHR_lights_punctual.light, gltfModel);
        entity = lightEntity;
      } else {
        const group = this.__generateGroupEntity(gltfModel);
        if (node.name) {
          group.tryToSetUniqueName(node.name, true);
        }
        entity = group;
      }

      entity.tryToSetTag({ tag: 'gltf_node_index', value: '' + node_i });

      rnEntities.push(entity);
      rnEntitiesByNames.set(node.name!, entity);

      if (this.__isMorphing(node, gltfModel)) {
        let weights: number[];
        if (node.weights) {
          weights = node.weights;
        } else if (node.mesh.weights) {
          weights = node.mesh.weights;
        } else {
          weights = new Array(node.mesh.primitives[0].targets.length);
          for (let i = 0; i < weights.length; i++) {
            weights[i] = 0;
          }
        }
        const entityRepository = EntityRepository.getInstance();
        entityRepository.addComponentsToEntity([BlendShapeComponent], entity.entityUID);
        const blendShapeComponent = entity.getComponent(BlendShapeComponent) as BlendShapeComponent;
        blendShapeComponent.weights = weights;
        if (node.mesh.primitives[0].extras?.targetNames) {
          blendShapeComponent.targetNames = node.mesh.primitives[0].extras.targetNames;
        }

      }
    }

    return { rnEntities, rnEntitiesByNames };
  }

  private __isMorphing(node: any, gltfModel: glTF2) {
    const argument = gltfModel?.asset?.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray[0];
    if (argument?.isMorphing === false) {
      return false;
    } else {
      return node.mesh != null && node.mesh.primitives[0].targets != null;
    }
  }

  private __setupLight(light: any, gltfModel: glTF2) {
    const lightEntity = this.__generateLightEntity(gltfModel);
    const lightComponent = lightEntity.getComponent(LightComponent)! as LightComponent;
    if (light.name != null) {
      lightComponent.tryToSetUniqueName(light.name, true);
      lightComponent.type = LightType.fromString(light.type);
      let color = new Vector3(1, 1, 1);
      let intensity = 1;
      if (light.color != null) {
        color = new Vector3(light.color);
      }
      if (light.intensity != null) {
        intensity = light.intensity;
      }
      lightComponent.intensity = Vector3.multiply(color, intensity);
      if (light.range != null) {
        lightComponent.range = light.range;
      }
    }
    return lightEntity;
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
      cameraComponent.setFovyAndChangeFocalLength(MathUtil.radianToDegree(camera.perspective.yfov));
      cameraComponent.zNear = camera.perspective.znear;
      cameraComponent.zFar = camera.perspective.zfar ? camera.perspective.zfar : 100000;
    } else if (cameraComponent.type === CameraType.Orthographic) {
      cameraComponent.xMag = camera.orthographic.zmag;
      cameraComponent.yMag = camera.orthographic.ymag;
      cameraComponent.zNear = camera.orthographic.znear;
      cameraComponent.zFar = camera.orthographic.zfar;
    }
    return cameraEntity;
  }

  private __setupMesh(node: any, mesh: any, meshIndex: Index, rnBuffers: Buffer[], gltfModel: glTF2) {
    const meshEntity = this.__generateMeshEntity(gltfModel);
    const existingRnMesh = (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx[meshIndex];
    let rnPrimitiveMode = PrimitiveMode.Triangles;
    const meshComponent = meshEntity.getMesh();
    const rnMesh = new Mesh();

    const rnLoaderOptions = gltfModel.asset.extras!.rnLoaderOptions;
    if (rnLoaderOptions?.tangentCalculationMode != null) {
      rnMesh.tangentCalculationMode = rnLoaderOptions.tangentCalculationMode;
    }
    if (rnLoaderOptions?.isPreComputeForRayCastPickingEnable != null) {
      rnMesh.isPreComputeForRayCastPickingEnable = rnLoaderOptions.isPreComputeForRayCastPickingEnable;
    }

    let originalRnMesh = rnMesh;
    if (existingRnMesh != null) {
      rnMesh.setOriginalMesh(existingRnMesh);
      originalRnMesh = existingRnMesh;
    } else {
      for (let i in mesh.primitives) {
        let primitive = mesh.primitives[i];
        if (primitive.mode != null) {
          rnPrimitiveMode = PrimitiveMode.from(primitive.mode)!;
        }

        const rnPrimitive = new Primitive();
        const material = this.__setupMaterial(rnPrimitive, node, gltfModel, primitive, primitive.material);

        if (material.isEmptyMaterial() === false) {
          ModelConverter.setDefaultTextures(material, gltfModel);
        }

        // indices
        let indicesRnAccessor;
        const map: Map<VertexAttributeEnum, Accessor> = new Map();
        if (primitive.extensions?.KHR_draco_mesh_compression) {
          indicesRnAccessor = this.__decodeDraco(primitive, rnBuffers, gltfModel, map);

          if (indicesRnAccessor == null) {
            break;
          }
        } else {
          // attributes
          if (primitive.indices) {
            indicesRnAccessor = this.__getRnAccessor(primitive.indices, rnBuffers[((primitive.indices as Gltf2Accessor).bufferView as Gltf2BufferView).bufferIndex!]);
          }

          for (let attributeName in primitive.attributes) {
            const attributeAccessor = primitive.attributes[attributeName] as Gltf2Accessor;
            const attributeRnAccessor = this.__getRnAccessor(attributeAccessor, rnBuffers[(attributeAccessor.bufferView as Gltf2BufferView).bufferIndex!]);

            if (attributeAccessor.sparse) {
              this.setSparseAccessor(attributeAccessor, attributeRnAccessor);
            }

            map.set(VertexAttribute.fromString(attributeAccessor.extras.attributeName), attributeRnAccessor);
          }
        }

        rnPrimitive.setData(map, rnPrimitiveMode, material, indicesRnAccessor);

        // morph targets
        if (primitive.targets != null) {

          // set default number
          let maxMorphTargetNumber = 4;
          if (rnLoaderOptions?.maxMorphTargetNumber != null) {
            maxMorphTargetNumber = rnLoaderOptions.maxMorphTargetNumber;
          }

          const targets: Array<Map<VertexAttributeEnum, Accessor>> = [];
          for (let i = 0; i < primitive.targets.length; i++) {
            if (i >= maxMorphTargetNumber) {
              break;
            }

            const target = primitive.targets[i];
            const targetMap: Map<VertexAttributeEnum, Accessor> = new Map();
            for (let attributeName in target) {
              let attributeAccessor = target[attributeName] as Gltf2Accessor;
              const attributeRnAccessor = this.__getRnAccessor(attributeAccessor, rnBuffers[(attributeAccessor.bufferView as Gltf2BufferView).bufferIndex!]);
              const attributeRnAccessorInGPUVertexData = this.__copyRnAccessorAndBufferView(attributeRnAccessor);
              targetMap.set(VertexAttribute.fromString(attributeName), attributeRnAccessorInGPUVertexData);
            }
            targets.push(targetMap);
          }

          rnPrimitive.setTargets(targets);
        }

        rnMesh.addPrimitive(rnPrimitive);
      }

      if (mesh.weights) {
        rnMesh.weights = mesh.weights;
      }
    }

    meshComponent.setMesh(rnMesh);

    (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx[meshIndex] = originalRnMesh;

    return meshEntity;
  }

  setSparseAccessor(accessor: any, rnAccessor: Accessor | FlexibleAccessor) {
    const uint8Array: Uint8Array = accessor.bufferView.buffer.buffer;
    const count = accessor.sparse.count;

    // indices
    const accessorIndices = accessor.sparse.indices;
    const bufferViewIndices = accessorIndices.bufferView;
    const byteOffsetIndices: number = (bufferViewIndices.byteOffset ?? 0) + (accessorIndices.byteOffset ?? 0);

    const componentBytesIndices = this._checkBytesPerComponent(accessorIndices);
    const byteLengthIndices = componentBytesIndices * count; // index is scalar
    const dataViewIndices: any = new DataView(uint8Array.buffer, byteOffsetIndices + uint8Array.byteOffset, byteLengthIndices);

    const dataViewMethodIndices = this._checkDataViewMethod(accessorIndices);

    // sparse values
    const accessorValues = accessor.sparse.values;
    const bufferViewValues = accessorValues.bufferView;
    const byteOffsetValues: number = (bufferViewValues.byteOffset ?? 0) + (accessorValues.byteOffset ?? 0);

    const componentBytesValues = this._checkBytesPerComponent(accessor);
    const componentNValues = this._checkComponentNumber(accessor);
    const byteLengthValues = componentBytesValues * componentNValues * count;
    const dataViewValues: any = new DataView(uint8Array.buffer, byteOffsetValues + uint8Array.byteOffset, byteLengthValues);
    const dataViewMethodValues = this._checkDataViewMethod(accessor);

    // set sparse values
    const typedArray = rnAccessor.getTypedArray();
    const littleEndian = true;
    for (let i = 0; i < count; i++) {
      const index = dataViewIndices[dataViewMethodIndices](componentBytesIndices * i, littleEndian);
      for (let j = 0; j < componentNValues; j++) {
        const value = dataViewValues[dataViewMethodValues](componentBytesValues * componentNValues * i + componentBytesValues * j, littleEndian);
        typedArray[index * componentNValues + j] = value;
      }
    }
  }

  static setDefaultTextures(material: Material, gltfModel: glTF2): void {
    if (gltfModel.asset.extras?.rnLoaderOptions?.defaultTextures == null) {
      return;
    }

    const options = gltfModel.asset.extras.rnLoaderOptions;

    const defaultTextures = gltfModel.asset.extras.rnLoaderOptions.defaultTextures;
    const basePath = defaultTextures.basePath;
    const textureInfos = defaultTextures.textureInfos;

    for (let textureInfo of textureInfos) {
      const rnTexture = new Texture();

      //options
      rnTexture.autoDetectTransparency = options.autoDetectTextureTransparency === true;
      rnTexture.autoResize = options.autoResizeTexture === true;

      const textureOption = {
        magFilter: TextureParameter.from(textureInfo.sampler?.magFilter) ?? TextureParameter.Linear,
        minFilter: TextureParameter.from(textureInfo.sampler?.minFilter) ?? TextureParameter.Linear,
        wrapS: TextureParameter.from(textureInfo.sampler?.wrapS) ?? TextureParameter.Repeat,
        wrapT: TextureParameter.from(textureInfo.sampler?.wrapT) ?? TextureParameter.Repeat
      };

      const fileName = textureInfo.fileName;
      const uri = basePath + fileName;
      rnTexture.name = uri;

      const image = textureInfo.image;
      if (image?.image) {
        const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
        const isWebGL1 = !webglResourceRepository.currentWebGLContextWrapper?.isWebGL2;

        if (isWebGL1 && !this.__sizeIsPowerOfTwo(image.image)) {
          textureOption.wrapS = TextureParameter.ClampToEdge;
          textureOption.wrapT = TextureParameter.ClampToEdge;
        }

        rnTexture.generateTextureFromImage(image.image, textureOption);
      } else if (image?.basis) {
        rnTexture.generateTextureFromBasis(image.basis, textureOption);
      } else {
        console.warn("default image not found");
        continue;
      }

      const shaderSemantics = textureInfo.shaderSemantics;
      material.setTextureParameter(shaderSemantics, rnTexture);
    }
  }

  private __setMorphingAndSkinningArgument(node: any, argumentOfMaterialHelper: any, isMorphingOriginal: boolean, isSkinningOriginal: boolean, gltfModel: glTF2): void {
    if (isMorphingOriginal) {
      argumentOfMaterialHelper.isMorphing = this.__isMorphing(node, gltfModel);
    }

    if (isSkinningOriginal) {
      const existSkin = node.skin != null;
      argumentOfMaterialHelper.isSkinning = existSkin;
      argumentOfMaterialHelper.additionalName = existSkin ? `skin${(node.skinIndex ?? node.skinName)}` : "";
    }
  }

  private __setVRMMaterial(rnPrimitive: Primitive, node: any, gltfModel: glTF2, primitive: any, argumentArray: any): Material | undefined {
    const VRMProperties = gltfModel.extensions.VRM;

    const shaderName = VRMProperties.materialProperties[primitive.materialIndex].shader;
    if (shaderName === "VRM/MToon") {
      // argument
      const argumentOfMaterialHelper = argumentArray[0];
      const rnExtension = VRMProperties.rnExtension;

      const isMorphingOriginal = argumentOfMaterialHelper.isMorphing;
      const isSkinningOriginal = argumentOfMaterialHelper.isSkinning;

      this.__setMorphingAndSkinningArgument(node, argumentOfMaterialHelper, isMorphingOriginal, isSkinningOriginal, gltfModel);

      const materialProperties = gltfModel.extensions.VRM.materialProperties[primitive.materialIndex];
      argumentOfMaterialHelper.materialProperties = materialProperties;

      // outline
      let renderPassOutline;
      if (rnExtension) {
        renderPassOutline = rnExtension.renderPassOutline;
      }

      //exist outline
      if (renderPassOutline != null) {
        let outlineMaterial: Material;
        if (materialProperties.floatProperties._OutlineWidthMode !== 0) {
          argumentOfMaterialHelper.isOutline = true;
          outlineMaterial = MaterialHelper.createMToonMaterial(argumentOfMaterialHelper);
          argumentOfMaterialHelper.isOutline = false;
        } else {
          outlineMaterial = MaterialHelper.createEmptyMaterial();
        }

        renderPassOutline.setMaterialForPrimitive(outlineMaterial, rnPrimitive);
      }

      const material = MaterialHelper.createMToonMaterial(argumentOfMaterialHelper);

      argumentOfMaterialHelper.isMorphing = isMorphingOriginal;
      argumentOfMaterialHelper.isSkinning = isSkinningOriginal;

      return material;

    } else if (argumentArray[0].isOutline) {
      return MaterialHelper.createEmptyMaterial();;
    }

    // use another material
    return undefined;
  }

  private __generateAppropriateMaterial(rnPrimitive: Primitive, node: any, gltfModel: glTF2, primitive: Gltf2Primitive, materialJson: Gltf2Material): Material {

    if (gltfModel.asset.extras?.rnLoaderOptions != null) {
      const rnLoaderOptions = gltfModel.asset.extras.rnLoaderOptions;

      if (rnLoaderOptions.loaderExtension?.isNeededToUseThisMaterial(gltfModel)) {
        const loaderExtension = gltfModel.asset.extras!.rnLoaderOptions!.loaderExtension;
        return loaderExtension.generateMaterial();
      }

      const argumentArray = rnLoaderOptions.defaultMaterialHelperArgumentArray;

      if (rnLoaderOptions.isImportVRM) {
        const material = this.__setVRMMaterial(rnPrimitive, node, gltfModel, primitive, argumentArray);
        if (material != null) return material;
      }

      const materialHelperName = rnLoaderOptions.defaultMaterialHelperName;
      if (materialHelperName != null) {
        return (MaterialHelper as any)[materialHelperName](...argumentArray);
      }
    }

    let maxMaterialInstanceNumber: number = Config.maxMaterialInstanceForEachType
    if (gltfModel.meshes.length > Config.maxMaterialInstanceForEachType) {
      maxMaterialInstanceNumber = gltfModel.meshes.length + Config.maxMaterialInstanceForEachType / 2;
    }

    const isMorphing = this.__isMorphing(node, gltfModel);
    const isSkinning = this.__isSkinning(node, gltfModel);
    const isLighting = this.__isLighting(gltfModel, materialJson);
    const isAlphaMasking = this.__isAlphaMasking(materialJson);
    const additionalName = (node.skin != null) ? `skin${(node.skinIndex ?? node.skinName)}` : void 0;
    if (parseFloat(gltfModel.asset?.version!) >= 2) {
      return MaterialHelper.createPbrUberMaterial({
        isMorphing: isMorphing, isSkinning: isSkinning, isLighting: isLighting,
        isAlphaMasking: isAlphaMasking, additionalName: additionalName, maxInstancesNumber: maxMaterialInstanceNumber
      });
    } else {
      return MaterialHelper.createClassicUberMaterial({
        isSkinning: isSkinning, isLighting: isLighting,
        isAlphaMasking: isAlphaMasking, additionalName: additionalName, maxInstancesNumber: maxMaterialInstanceNumber
      });
    }
  }

  private __isLighting(gltfModel: glTF2, materialJson?: Gltf2Material) {
    const argument = gltfModel?.asset?.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray[0];
    if (argument?.isLighting != null) {
      return argument.isLighting as boolean;
    } else {
      return (materialJson?.extensions?.KHR_materials_unlit != null) ? false : true;
    }
  }

  private __isAlphaMasking(materialJson?: Gltf2Material) {
    if (materialJson?.alphaMode === AlphaMode.Mask.str) {
      return true;
    } else {
      return false;
    }
  }

  private __isSkinning(node: Gltf2Node, gltfModel: glTF2) {
    const argument = gltfModel?.asset?.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray[0];
    if (argument?.isSkinning === false) {
      return false;
    } else {
      return (node.skin != null) ? true : false;
    }
  }

  private __setupMaterial(rnPrimitive: Primitive, node: any, gltfModel: glTF2, primitive: Gltf2Primitive, materialJson: any): Material {
    let material = gltfModel.asset.extras?.rnMaterials![primitive.materialIndex!];
    if (material?.isSkinning === this.__isSkinning(node, gltfModel) && material.isMorphing === this.__isMorphing(node, gltfModel)) {
      return material;
    } else {
      const newMaterial: Material = this.__generateAppropriateMaterial(rnPrimitive, node, gltfModel, primitive, materialJson);
      gltfModel.asset.extras!.rnMaterials![primitive.materialIndex!] = newMaterial;
      material = newMaterial;
    }

    // avoid unexpected initialization
    if (!this.__needParameterInitialization(materialJson, material.materialTypeName)) return material;

    const pbrMetallicRoughness = materialJson.pbrMetallicRoughness;
    if (pbrMetallicRoughness != null) {

      const baseColorFactor = pbrMetallicRoughness.baseColorFactor;
      if (baseColorFactor != null) {
        material.setParameter(ShaderSemantics.BaseColorFactor, new Vector4(baseColorFactor));
      }

      const baseColorTexture = pbrMetallicRoughness.baseColorTexture;
      if (baseColorTexture != null) {
        const rnTexture = ModelConverter._createTexture(baseColorTexture, gltfModel)
        material.setTextureParameter(ShaderSemantics.BaseColorTexture, rnTexture);
      }
      ModelConverter._setupTextureTransform(baseColorTexture, material, PbrShadingSingleMaterialNode.baseColorTextureTransform, PbrShadingSingleMaterialNode.baseColorTextureRotation);

      const occlusionTexture = materialJson.occlusionTexture;
      if (occlusionTexture != null) {
        const rnTexture = ModelConverter._createTexture(occlusionTexture, gltfModel)
        material.setTextureParameter(ShaderSemantics.OcclusionTexture, rnTexture);
      }

      let metallicFactor = pbrMetallicRoughness.metallicFactor;
      metallicFactor = metallicFactor ?? 1;
      let roughnessFactor = pbrMetallicRoughness.roughnessFactor;
      roughnessFactor = roughnessFactor ?? 1;
      material.setParameter(ShaderSemantics.MetallicRoughnessFactor, new Vector2(metallicFactor, roughnessFactor));

      const metallicRoughnessTexture = pbrMetallicRoughness.metallicRoughnessTexture;
      if (metallicRoughnessTexture != null) {
        const rnTexture = ModelConverter._createTexture(metallicRoughnessTexture, gltfModel)
        material.setTextureParameter(ShaderSemantics.MetallicRoughnessTexture, rnTexture);
      }
      ModelConverter._setupTextureTransform(metallicRoughnessTexture, material, PbrShadingSingleMaterialNode.metallicRoughnessTextureTransform, PbrShadingSingleMaterialNode.metallicRoughnessTextureRotation);

    } else {
      let param: Index = ShadingModel.Phong.index;
      if (materialJson.extras?.technique) {
        switch (materialJson.extras.technique) {
          case ShadingModel.Constant.str: param = ShadingModel.Constant.index; break;
          case ShadingModel.Lambert.str: param = ShadingModel.Lambert.index; break;
          case ShadingModel.BlinnPhong.str: param = ShadingModel.BlinnPhong.index; break;
          case ShadingModel.Phong.str: param = ShadingModel.Phong.index; break;
        }
        material.setParameter(ShaderSemantics.ShadingModel, new Scalar(param));
      }
    }

    const emissiveTexture = materialJson.emissiveTexture;
    if (emissiveTexture != null) {
      const rnTexture = ModelConverter._createTexture(emissiveTexture, gltfModel)
      material.setTextureParameter(ShaderSemantics.EmissiveTexture, rnTexture);
    }

    const options = gltfModel.asset.extras!.rnLoaderOptions;
    let alphaMode = materialJson.alphaMode;
    if (options?.alphaMode) {
      alphaMode = options.alphaMode;
    }
    if (alphaMode != null) {
      material.alphaMode = AlphaMode.fromString(alphaMode)!;

      // set alpha threshold except for VRM
      if (material.alphaMode === AlphaMode.Mask
        && !gltfModel.asset.extras?.rnLoaderOptions?.isImportVRM) {
        material.setParameter(ShaderSemantics.AlphaCutoff, new Scalar(materialJson.alphaCutoff ?? 0.5));
      }
    }

    const doubleSided = materialJson.doubleSided;
    if (doubleSided != null) {
      material.cullFace = !doubleSided;
    }

    // For glTF1.0
    const diffuseColorTexture = materialJson.diffuseColorTexture;
    if (diffuseColorTexture != null) {
      const rnTexture = ModelConverter._createTexture(diffuseColorTexture, gltfModel)
      material.setTextureParameter(ShaderSemantics.DiffuseColorTexture, rnTexture);

      if (this._checkRnGltfLoaderOptionsExist(gltfModel) && gltfModel.asset.extras?.rnLoaderOptions?.loaderExtension) {
        const loaderExtension = gltfModel.asset.extras!.rnLoaderOptions!.loaderExtension as ILoaderExtension;
        if (loaderExtension.setUVTransformToTexture) {
          loaderExtension.setUVTransformToTexture(material, diffuseColorTexture.texture.sampler);
        }
      }
    }
    const diffuseColorFactor = materialJson.diffuseColorFactor;
    if (diffuseColorFactor != null) {
      material.setParameter(ShaderSemantics.DiffuseColorFactor, new Vector4(diffuseColorFactor));
    }

    const normalTexture = materialJson.normalTexture;
    if (normalTexture != null) {
      const rnTexture = ModelConverter._createTexture(normalTexture, gltfModel)
      material.setTextureParameter(ShaderSemantics.NormalTexture, rnTexture);
    }
    ModelConverter._setupTextureTransform(normalTexture, material, PbrShadingSingleMaterialNode.normalTextureTransform, PbrShadingSingleMaterialNode.normalTextureRotation);


    // ModelConverter._setupTextureTransform(normalTexture, material, 'normalTextureTransform', 'normalTextureRotation')

    // For Extension
    if (this._checkRnGltfLoaderOptionsExist(gltfModel) && gltfModel.asset.extras?.rnLoaderOptions?.loaderExtension) {
      const loaderExtension = gltfModel.asset.extras.rnLoaderOptions.loaderExtension;
      loaderExtension.setupMaterial(gltfModel, materialJson, material);
    }

    return material;
  }

  static _createTexture(textureType: any, gltfModel: glTF2) {
    const options = gltfModel.asset.extras?.rnLoaderOptions;

    const rnTexture = new Texture();
    rnTexture.autoDetectTransparency = (options?.autoDetectTextureTransparency === true) ? true : false;
    rnTexture.autoResize = (options?.autoResizeTexture === true) ? true : false;
    const texture = textureType.texture;

    const textureOption = {
      magFilter: TextureParameter.from(texture.sampler?.magFilter) ?? TextureParameter.Linear,
      minFilter: TextureParameter.from(texture.sampler?.minFilter) ?? TextureParameter.Linear,
      wrapS: TextureParameter.from(texture.sampler?.wrapS) ?? TextureParameter.Repeat,
      wrapT: TextureParameter.from(texture.sampler?.wrapT) ?? TextureParameter.Repeat
    };

    if (texture.image.image) {
      const image = texture.image.image as HTMLImageElement;
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      const isWebGL1 = !webglResourceRepository.currentWebGLContextWrapper?.isWebGL2;

      if (isWebGL1 && !this.__sizeIsPowerOfTwo(image)) {
        textureOption.wrapS = TextureParameter.ClampToEdge;
        textureOption.wrapT = TextureParameter.ClampToEdge;
      }

      rnTexture.generateTextureFromImage(image, textureOption);
      if (texture.image.uri) {
        rnTexture.name = texture.image.url;
      } else {
        const ext = texture.image.mimeType.split('/')[1];
        rnTexture.name = texture.image.name + `.${ext}`;
      }
    } else if (texture.image.basis) {
      rnTexture.generateTextureFromBasis(texture.image.basis, textureOption);
      if (texture.image.uri) {
        rnTexture.name = texture.image.url;
      } else {
        const ext = texture.image.mimeType.split('/')[1];
        rnTexture.name = texture.image.name + `.${ext}`;
      }
    }

    return rnTexture;
  }

  private static __sizeIsPowerOfTwo(image: HTMLImageElement) {
    const width = image.width;
    const height = image.height;

    if ((width & width - 1) == 0 && (height & height - 1) == 0) {
      return true;
    } else {
      return false;
    }
  }


  private __needParameterInitialization(materialJson: any, materialTypeName: string): boolean {
    if (materialJson == null) return false;

    if (
      materialTypeName.match(/PbrUber/) != null ||
      materialTypeName.match(/ClassicUber/) != null
    ) {
      return true;
    } else {
      return false;
    }

  }

  private _checkRnGltfLoaderOptionsExist(gltfModel: glTF2) {
    if (gltfModel.asset.extras?.rnLoaderOptions) {
      return true;
    } else {
      return false;
    }
  }

  _adjustByteAlign(typedArrayClass: any, uint8Array: Uint8Array, alignSize: Size, byteOffset: Byte, length: Size) {
    if ((byteOffset % alignSize) != 0) {
      return new typedArrayClass(uint8Array.buffer.slice(byteOffset + uint8Array.byteOffset), 0, length);
    } else {
      return new typedArrayClass(uint8Array.buffer, byteOffset + uint8Array.byteOffset, length);
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
    const bufferView = accessor.bufferView;
    const byteOffset: number = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const buffer = bufferView.buffer;
    const uint8Array: Uint8Array = buffer.buffer;

    const componentN = this._checkComponentNumber(accessor);
    const componentBytes = this._checkBytesPerComponent(accessor);
    const dataViewMethod = this._checkDataViewMethod(accessor);
    if (accessor.extras === void 0) {
      accessor.extras = {};
    }

    accessor.extras.componentN = componentN;
    accessor.extras.componentBytes = componentBytes;
    accessor.extras.dataViewMethod = dataViewMethod;

    const byteLength = componentBytes * componentN * accessor.count;

    let typedDataArray: any = [];

    if (accessor.extras?.toGetAsTypedArray) {
      if (ModelConverter._isSystemLittleEndian()) {
        if (dataViewMethod === 'getFloat32') {
          typedDataArray = this._adjustByteAlign(Float32Array, uint8Array, 4, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt8') {
          typedDataArray = new Int8Array(uint8Array, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint8') {
          typedDataArray = new Uint8Array(uint8Array, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt16') {
          typedDataArray = this._adjustByteAlign(Int16Array, uint8Array, 2, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint16') {
          typedDataArray = this._adjustByteAlign(Uint16Array, uint8Array, 2, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getInt32') {
          typedDataArray = this._adjustByteAlign(Int32Array, uint8Array, 4, byteOffset, byteLength / componentBytes);
        } else if (dataViewMethod === 'getUint32') {
          typedDataArray = this._adjustByteAlign(Uint32Array, uint8Array, 4, byteOffset, byteLength / componentBytes);
        }

      } else {
        const dataView: any = new DataView(uint8Array.buffer, byteOffset + uint8Array.byteOffset, byteLength);
        const byteDelta = componentBytes * componentN;
        const littleEndian = true;
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
      const dataView: any = new DataView(uint8Array.buffer, byteOffset + uint8Array.byteOffset, byteLength);
      let byteDelta = componentBytes * componentN;
      if (accessor.extras?.weightCount) {
        byteDelta = componentBytes * componentN * accessor.extras.weightCount;
      }
      const littleEndian = true;
      for (let pos = 0; pos < byteLength; pos += byteDelta) {

        switch (accessor.type) {
          case 'SCALAR':
            if (accessor.extras?.weightCount) {
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
            if (accessor.extras?.quaternionIfVec4) {
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
            const matrixComponents = [];
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
    const primitiveNumber = meshComponent.mesh!.getPrimitiveNumber();
    let offsetSum = 0;
    for (let i = 0; i < primitiveNumber; i++) {
      const primitive = meshComponent.mesh!.getPrimitiveAt(i);
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
      byteStride: bufferView.byteStride ?? 0,
      byteOffset: bufferView.byteOffset ?? 0,
      isAoS: false
    });

    let rnAccessor;
    if (accessor.byteStride != null) {
      rnAccessor = rnBufferView.takeFlexibleAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: accessor.count,
        byteStride: accessor.byteStride,
        byteOffset: accessor.byteOffset ?? 0,
        max: accessor.max,
        min: accessor.min
      });
    } else {
      rnAccessor = rnBufferView.takeAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: accessor.count,
        byteOffset: accessor.byteOffset ?? 0,
        max: accessor.max,
        min: accessor.min
      });
    }

    return rnAccessor;
  }

  private __copyRnAccessorAndBufferView(srcRnAccessor: Accessor) {
    const byteSize = srcRnAccessor.elementCount * 4 /* vec4 */ * 4 /* bytes */;
    const dstRnBuffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.GPUVertexData);
    const dstRnBufferView = dstRnBuffer.takeBufferView({
      byteLengthToNeed: byteSize,
      byteStride: 4 /* vec4 */ * 4 /* bytes */,
      isAoS: false
    });

    const dstRnAccessor = dstRnBufferView.takeAccessor({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      count: srcRnAccessor.elementCount,
      max: srcRnAccessor.max,
      min: srcRnAccessor.min
    });
    for (let i = 0; i < srcRnAccessor.elementCount; i++) {
      dstRnAccessor.setElementFromAccessor(i, srcRnAccessor);
    }

    return dstRnAccessor;
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
        byteOffset: accessor.byteOffset ?? 0,
        max: accessor.max,
        min: accessor.min
      });
    } else {
      rnAccessor = rnBufferView.takeAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: numOfAttributes,
        byteOffset: accessor.byteOffset ?? 0,
        max: accessor.max,
        min: accessor.min
      });
    }

    return rnAccessor;
  }



  private __getRnBufferView(bufferView: any, rnBuffer: Buffer) {
    const rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
      byteLengthToNeed: bufferView.byteLength,
      byteStride: bufferView.byteStride ?? 0,
      byteOffset: bufferView.byteOffset ?? 0,
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

  private __decodeDraco(primitive: any, rnBuffers: Buffer[], gltfModel: glTF2, map: Map<VertexAttributeEnum, Accessor>) {
    const bufferView = gltfModel.bufferViews[primitive.extensions.KHR_draco_mesh_compression.bufferView];
    const rnBufferView = this.__getRnBufferView(bufferView, rnBuffers[bufferView.bufferIndex!]);
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
    const rnBufferForDraco = this.__createBufferForDecompressedData(primitive, numPoints);

    // decode indices
    const primitiveMode = PrimitiveMode.from(primitive.mode);
    let isTriangleStrip = false;
    if (primitiveMode === PrimitiveMode.TriangleStrip) {
      isTriangleStrip = true;
    }

    const indices = this.__getIndicesFromDraco(draco, decoder, dracoGeometry, isTriangleStrip)!;
    const indicesRnAccessor = this.__createRnAccessor(primitive.indices, indices.length, 1, rnBufferForDraco);
    for (let i = 0; i < indices.length; i++) {
      indicesRnAccessor.setScalar(i, indices[i], {});
    }

    // decode attributes
    for (let attributeName in primitive.attributes) {
      const dracoAttributeId = primitive.extensions.KHR_draco_mesh_compression.attributes[attributeName];

      const attributeGltf2Accessor = primitive.attributes[attributeName] as Gltf2Accessor;
      let attributeRnAccessor;

      if (dracoAttributeId == null) {
        // non-encoded data

        attributeRnAccessor = this.__getRnAccessor(attributeGltf2Accessor, rnBuffers[(attributeGltf2Accessor.bufferView as Gltf2BufferView).bufferIndex!]);
      } else {
        // encoded data

        const compositionNum = CompositionType.fromString(attributeGltf2Accessor.type).getNumberOfComponents();
        attributeRnAccessor = this.__createRnAccessor(attributeGltf2Accessor, numPoints, compositionNum, rnBufferForDraco);

        const dracoAttributePointer = decoder.GetAttributeByUniqueId(dracoGeometry, dracoAttributeId);
        const decompressedAttributeData = new draco.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints(dracoGeometry, dracoAttributePointer, decompressedAttributeData);

        for (let i = 0; i < numPoints; i++) {
          if (compositionNum === 1) {
            attributeRnAccessor.setScalar(i, decompressedAttributeData.GetValue(i * compositionNum), {});
          } else if (compositionNum === 2) {
            attributeRnAccessor.setVec2(i, decompressedAttributeData.GetValue(i * compositionNum), decompressedAttributeData.GetValue(i * compositionNum + 1), {});
          } else if (compositionNum === 3) {
            attributeRnAccessor.setVec3(i, decompressedAttributeData.GetValue(i * compositionNum), decompressedAttributeData.GetValue(i * compositionNum + 1), decompressedAttributeData.GetValue(i * compositionNum + 2), {});
          } else if (compositionNum === 4) {
            attributeRnAccessor.setVec4(i, decompressedAttributeData.GetValue(i * compositionNum), decompressedAttributeData.GetValue(i * compositionNum + 1), decompressedAttributeData.GetValue(i * compositionNum + 2), decompressedAttributeData.GetValue(i * compositionNum + 3), {});
          }
        }

        draco.destroy(decompressedAttributeData);
      }

      if (attributeGltf2Accessor.sparse) {
        this.setSparseAccessor(attributeGltf2Accessor, attributeRnAccessor);
      }

      map.set(VertexAttribute.fromString(attributeGltf2Accessor.extras.attributeName), attributeRnAccessor);
    }

    draco.destroy(dracoGeometry);
    draco.destroy(decoder);

    return indicesRnAccessor;
  }

  static _setupTextureTransform(textureJson: any, rnMaterial: Material, textureTransformShaderSemantic: ShaderSemanticsEnum, textureRotationShaderSemantic: ShaderSemanticsEnum) {
    if (textureJson?.extensions?.KHR_texture_transform) {
      const transform = new MutableVector4(1.0, 1.0, 0.0, 0.0);
      let rotation = 0;

      const transformJson = textureJson.extensions.KHR_texture_transform;
      if (transformJson.scale != null) {
        transform.x = transformJson.scale[0];
        transform.y = transformJson.scale[1];
      }
      if (transformJson.offset != null) {
        transform.z = transformJson.offset[0];
        transform.w = transformJson.offset[1];
      }
      if (transformJson.rotation != null) {
        rotation = transformJson.rotation;
      }

      rnMaterial.setParameter(textureTransformShaderSemantic, transform);
      rnMaterial.setParameter(textureRotationShaderSemantic, rotation);
    }
  }

  private __createBufferForDecompressedData(primitive: any, numPoints: number): Buffer {
    let byteLengthOfBufferForDraco = 0;

    if (primitive.indices) {
      const count = primitive.indices.count;
      byteLengthOfBufferForDraco += count * 4;
    }

    const drcAttributes = primitive.extensions.KHR_draco_mesh_compression.attributes;
    for (let attributeName in primitive.attributes) {

      if (drcAttributes[attributeName] == null) {
        // non-encoded data

        continue;
      }

      const accessor = primitive.attributes[attributeName];
      const compositionNum = CompositionType.fromString(accessor.type).getNumberOfComponents();
      const attributeByteLength = numPoints * compositionNum * 4;
      byteLengthOfBufferForDraco += attributeByteLength;
    }

    return new Buffer({
      byteLength: byteLengthOfBufferForDraco,
      buffer: new ArrayBuffer(byteLengthOfBufferForDraco),
      name: 'Draco'
    });
  }
}

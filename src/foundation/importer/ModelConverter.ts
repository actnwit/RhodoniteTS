import {EntityRepository} from '../core/EntityRepository';
import {MeshComponent} from '../components/Mesh/MeshComponent';
import {IEntity} from '../core/Entity';
import {Vector3} from '../math/Vector3';
import {Quaternion} from '../math/Quaternion';
import {Matrix44} from '../math/Matrix44';
import {Primitive} from '../geometry/Primitive';
import {Buffer} from '../memory/Buffer';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {CompositionType} from '../definitions/CompositionType';
import {ComponentType} from '../definitions/ComponentType';
import {
  VertexAttribute,
  VertexAttributeSemanticsJoinedString,
} from '../definitions/VertexAttribute';
import {CameraType} from '../definitions/CameraType';
import {Texture} from '../textures/Texture';
import {Vector4} from '../math/Vector4';
import {AnimationComponent} from '../components/Animation/AnimationComponent';
import {AnimationInterpolation} from '../definitions/AnimationInterpolation';
import {MathUtil} from '../math/MathUtil';
import {SkeletalComponent} from '../components/Skeletal/SkeletalComponent';
import {AlphaMode} from '../definitions/AlphaMode';
import {MaterialHelper} from '../helpers/MaterialHelper';
import {
  ShaderSemantics,
  ShaderSemanticsEnum,
} from '../definitions/ShaderSemantics';
import {Vector2} from '../math/Vector2';
import {Material} from '../materials/core/Material';
import {ShadingModel} from '../definitions/ShadingModel';
import {Accessor} from '../memory/Accessor';
import {Mesh} from '../geometry/Mesh';
import {MutableVector4} from '../math/MutableVector4';
import {LightType} from '../definitions/LightType';
import {
  Count,
  Byte,
  Size,
  Index,
  TypedArray,
  TypedArrayConstructor,
  Array4,
  VectorComponentN,
} from '../../types/CommonTypes';
import {
  RnM2,
  RnM2Node,
  RnM2Accessor,
  RnM2BufferView,
  RnM2Primitive,
  RnM2Material,
  RnM2Image,
  RnM2Camera,
  RnM2Texture,
  RnM2Mesh,
  RnM2TextureInfo,
  RnM2SparseIndices,
  RnM2PbrMetallicRoughness,
} from '../../types/RnM2';
import {Config} from '../core/Config';
import {BufferUse} from '../definitions/BufferUse';
import {MemoryManager} from '../core/MemoryManager';
import {ILoaderExtension} from './ILoaderExtension';
import {PbrShadingMaterialContent} from '../materials/contents/PbrShadingMaterialContent';
import {Scalar} from '../math/Scalar';
import {TextureParameter} from '../definitions/TextureParameter';
import {CGAPIResourceRepository} from '../renderer/CGAPIResourceRepository';
import {Is} from '../misc/Is';
import {DataUtil} from '../misc/DataUtil';
import {AnimationPathName} from '../../types/AnimationTypes';
import {
  GltfLoadOption,
  KHR_lights_punctual_Light,
  TagGltf2NodeIndex,
} from '../../types/glTF2';
import {
  EntityHelper,
  IAnimationEntity,
  ICameraEntity,
  ISceneGraphEntity,
  ILightEntity,
  IMeshEntity,
} from '../helpers/EntityHelper';
import {BlendShapeComponent} from '../components/BlendShape/BlendShapeComponent';
import {LightComponent} from '../components/Light/LightComponent';
import {IBlendShapeEntityMethods} from '../components/BlendShape/IBlendShapeEntity';
import {BufferView} from '../memory/BufferView';
import {RhodoniteImportExtension} from './RhodoniteImportExtension';

declare let DracoDecoderModule: any;

/**
 * A converter class from glTF2 model to Rhodonite Native data
 */
export class ModelConverter {
  private constructor() {}

  static _getDefaultShader(options: GltfLoadOption) {
    const defaultShader = null;

    // if (options && typeof options.defaultShaderClass !== "undefined") {
    //   if (typeof options.defaultShaderClass === "string") {
    //     defaultShader = GLBoost[options.defaultShaderClass];
    //   } else {
    //     defaultShader = options.defaultShaderClass;
    //   }
    // }

    return defaultShader;
  }

  private static __generateGroupEntity(gltfModel: RnM2): ISceneGraphEntity {
    const entity = EntityHelper.createGroupEntity();
    this.addTags(entity, gltfModel);
    return entity;
  }

  private static addTags(entity: ISceneGraphEntity, gltfModel: RnM2) {
    entity.tryToSetTag({
      tag: 'SourceType',
      value: gltfModel.asset.extras!.fileType!,
    });
    entity.tryToSetTag({
      tag: 'SourceTypeVersion',
      value: gltfModel.asset.extras!.version!,
    });
  }

  private static __generateMeshEntity(gltfModel: RnM2): IMeshEntity {
    const entity = EntityHelper.createMeshEntity();
    this.addTags(entity, gltfModel);
    return entity;
  }

  private static __generateCameraEntity(gltfModel: RnM2): ICameraEntity {
    const entity = EntityHelper.createCameraEntity();
    this.addTags(entity, gltfModel);
    return entity;
  }

  private static __generateLightEntity(gltfModel: RnM2): ILightEntity {
    const entity = EntityHelper.createLightEntity();
    this.addTags(entity, gltfModel);
    return entity;
  }

  static convertToRhodoniteObject(gltfModel: RnM2) {
    (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx = [];

    const rnBuffers = this.createRnBuffer(gltfModel);
    gltfModel.asset.extras!.rnMaterials = {};

    // Mesh, Camera, Group, ...
    const {rnEntities, rnEntitiesByNames} = this.__setupObjects(
      gltfModel,
      rnBuffers
    );
    gltfModel.asset.extras!.rnEntities = rnEntities;

    // Transform
    this._setupTransform(gltfModel, rnEntities);

    // Skeleton
    this._setupSkeleton(gltfModel, rnEntities, rnBuffers);

    // Hierarchy
    this._setupHierarchy(gltfModel, rnEntities);

    // Camera
    //this._setupCamera(gltfModel, groups);

    // Animation
    this._setupAnimation(gltfModel, rnEntities);

    // Root Group
    const rootGroup = this.__generateGroupEntity(gltfModel);
    rootGroup.tryToSetUniqueName('FileRoot', true);
    rootGroup.tryToSetTag({tag: 'ObjectType', value: 'top'});
    if (gltfModel.scenes[0].nodes) {
      for (const nodesIndex of gltfModel.scenes[0].nodes) {
        const sg = rnEntities[nodesIndex].getSceneGraph();
        rootGroup.getSceneGraph().addChild(sg);
      }
    }

    if (gltfModel.asset.extras && gltfModel.asset.extras.rnLoaderOptions) {
      const options = gltfModel.asset.extras!.rnLoaderOptions;
      if (
        options &&
        options.loaderExtension &&
        options?.loaderExtension?.loadExtensionInfoAndSetToRootGroup
      ) {
        options.loaderExtension.loadExtensionInfoAndSetToRootGroup(
          rootGroup,
          gltfModel
        );
      }
    }

    // rootGroup.allMeshes = rootGroup.searchElementsByType(M_Mesh);
    rootGroup.tryToSetTag({tag: 'rnEntities', value: rnEntities});
    rootGroup.tryToSetTag({tag: 'rnEntitiesByNames', value: rnEntitiesByNames});
    rootGroup.tryToSetTag({tag: 'gltfModel', value: gltfModel});

    // Effekseer
    RhodoniteImportExtension.importEffect(gltfModel, rootGroup);

    return rootGroup;
  }

  static _setupCamera(gltfModel: RnM2) {}

  private static createRnBuffer(gltfModel: RnM2): Buffer[] {
    const rnBuffers = [];
    for (const buffer of gltfModel.buffers) {
      const rnBuffer = new Buffer({
        byteLength: buffer.byteLength,
        buffer: buffer.buffer!,
        name: `gltf2Buffer_0_(${buffer.uri})`,
        byteAlign: 4,
      });
      rnBuffers.push(rnBuffer);
    }
    return rnBuffers;
  }

  static _setupTransform(gltfModel: RnM2, groups: ISceneGraphEntity[]) {
    for (const node_i in gltfModel.nodes) {
      const group = groups[node_i];
      const nodeJson = gltfModel.nodes[node_i];
      const groupTransform = group.getTransform()!;
      if (nodeJson.translation) {
        groupTransform.translate = Vector3.fromCopyArray([
          nodeJson.translation[0],
          nodeJson.translation[1],
          nodeJson.translation[2],
        ]);
      }
      if (nodeJson.scale) {
        groupTransform.scale = Vector3.fromCopyArray([
          nodeJson.scale[0],
          nodeJson.scale[1],
          nodeJson.scale[2],
        ]);
      }
      if (nodeJson.rotation) {
        groupTransform.quaternion = Quaternion.fromCopy4(
          nodeJson.rotation[0],
          nodeJson.rotation[1],
          nodeJson.rotation[2],
          nodeJson.rotation[3]
        );
      }
      if (nodeJson.matrix) {
        groupTransform.matrix = Matrix44.fromCopyArrayColumnMajor(
          nodeJson.matrix
        );
      }
    }
  }

  static _setupHierarchy(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]) {
    const groupSceneComponents = rnEntities.map(group => {
      return group.getSceneGraph()!;
    });

    for (const node_i in gltfModel.nodes) {
      const parentNode_i = parseInt(node_i);
      const glTF2ParentNode = gltfModel.nodes[parentNode_i];
      if (Is.exist(glTF2ParentNode.children)) {
        const rnParentSceneGraphComponent = groupSceneComponents[parentNode_i];
        for (const childNode_i of glTF2ParentNode.children) {
          const rnChildSceneGraphComponent = groupSceneComponents[childNode_i];
          rnParentSceneGraphComponent.addChild(rnChildSceneGraphComponent);
        }
      }
    }
  }

  /**
   * @private
   */
  static _setupAnimation(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]) {
    if (gltfModel.animations) {
      for (const animation of gltfModel.animations) {
        for (const sampler of animation.samplers) {
          this._readBinaryFromAccessorAndSetItToAccessorExtras(
            sampler.inputObject!
          );
          this._readBinaryFromAccessorAndSetItToAccessorExtras(
            sampler.outputObject!
          );
        }
      }
    }

    if (Is.exist(gltfModel.animations) && gltfModel.animations.length > 0) {
      for (const animation of gltfModel.animations) {
        for (const channel of animation.channels) {
          if (Is.exist(channel.samplerObject)) {
            const animInputArray =
              channel.samplerObject.inputObject!.extras!.typedDataArray!;
            const animOutputArray =
              channel.samplerObject.outputObject!.extras!.typedDataArray!;
            const interpolation =
              channel.samplerObject.interpolation ?? 'LINEAR';

            let animationAttributeType: AnimationPathName = 'undefined';
            if (channel.target!.path === 'translation') {
              animationAttributeType = 'translate';
            } else if (channel.target!.path === 'rotation') {
              animationAttributeType = 'quaternion';
            } else {
              animationAttributeType = channel.target!
                .path as AnimationPathName;
            }

            const rnEntity = rnEntities[
              channel.target.node!
            ] as IAnimationEntity;
            if (Is.exist(rnEntity)) {
              let animationComponent = rnEntity.tryToGetAnimation();
              if (Is.not.exist(animationComponent)) {
                const newRnEntity = EntityRepository.addComponentToEntity(
                  AnimationComponent,
                  rnEntity
                );
                animationComponent = newRnEntity.getAnimation();
              }
              if (Is.exist(animationComponent)) {
                const outputComponentN =
                  channel.samplerObject.outputObject!.extras!.componentN!;
                animationComponent.setAnimation(
                  Is.exist(animation.name)
                    ? animation.name
                    : 'Untitled_Animation',
                  animationAttributeType,
                  animInputArray,
                  animOutputArray,
                  outputComponentN as VectorComponentN,
                  AnimationInterpolation.fromString(interpolation)
                );
              }
            }
          }
        }
      }
    }
  }

  static _setupSkeleton(
    gltfModel: RnM2,
    rnEntities: ISceneGraphEntity[],
    rnBuffers: Buffer[]
  ) {
    if (gltfModel.skins == null) {
      return;
    }

    for (const node_i in gltfModel.nodes) {
      const node = gltfModel.nodes[node_i];
      const sg = rnEntities[node_i].getSceneGraph()!;
      let skeletalComponent: SkeletalComponent;
      if (Is.exist(node.skinObject)) {
        const rnEntity = rnEntities[node_i];
        const newRnEntity = EntityRepository.addComponentToEntity(
          SkeletalComponent,
          rnEntity
        );
        skeletalComponent = newRnEntity.getSkeletal();
        skeletalComponent._jointIndices = node.skinObject.joints;
        if (Is.exist(node.skinObject.bindShapeMatrix)) {
          skeletalComponent._bindShapeMatrix =
            Matrix44.fromCopyArrayColumnMajor(node.skinObject.bindShapeMatrix);
        }
        if (Is.exist(node.skinObject.skeleton)) {
          sg.isRootJoint = true;
          if (Is.exist(node.mesh)) {
            const joints = [];
            for (const i of node.skinObject.joints) {
              joints.push(rnEntities[i].getSceneGraph()!);
            }
            skeletalComponent!.setJoints(joints);
            if (Is.exist(node.skinObject.skeleton)) {
              skeletalComponent!.topOfJointsHierarchy =
                rnEntities[node.skinObject.skeleton].getSceneGraph();
            } else {
              skeletalComponent!.topOfJointsHierarchy = joints[0];
            }
          }
        }
        for (const joint_i of node.skinObject.joints) {
          const sg = rnEntities[joint_i].getSceneGraph()!;
          sg.jointIndex = joint_i;
        }

        const inverseBindMatAccessor =
          node.skinObject.inverseBindMatricesObject;
        if (Is.exist(inverseBindMatAccessor)) {
          const rnBufferOfInverseBindMatAccessor =
            this.__getRnBufferViewAndRnAccessor(
              inverseBindMatAccessor,
              rnBuffers[inverseBindMatAccessor.bufferViewObject!.buffer!]
            );
          skeletalComponent!.setInverseBindMatricesAccessor(
            rnBufferOfInverseBindMatAccessor
          );
        }
      }
    }
  }

  private static __setupObjects(gltfModel: RnM2, rnBuffers: Buffer[]) {
    const rnEntities: ISceneGraphEntity[] = [];
    const rnEntitiesByNames: Map<String, IEntity> = new Map();

    for (const node_i in gltfModel.nodes) {
      const node = gltfModel.nodes[parseInt(node_i)] as RnM2Node;
      let entity: ISceneGraphEntity;
      if (node.mesh != null) {
        const meshIdx = node.mesh;
        const meshEntity = this.__setupMesh(
          node,
          node.meshObject!,
          meshIdx,
          rnBuffers,
          gltfModel
        );
        if (node.name) {
          meshEntity.tryToSetUniqueName(node.name, true);
        }
        if (node.meshObject?.name) {
          const meshComponent = meshEntity.getComponent(MeshComponent)!;
          meshComponent.tryToSetUniqueName(node.meshObject.name, true);
        }
        entity = meshEntity;
      } else if (node.cameraObject != null) {
        const cameraEntity = this.__setupCamera(node.cameraObject, gltfModel);
        if (node.name) {
          cameraEntity.tryToSetUniqueName(node.name, true);
        }
        entity = cameraEntity;
      } else if (node.extensions?.KHR_lights_punctual) {
        const lightEntity = this.__setupLight(
          node.extensions.KHR_lights_punctual.light,
          gltfModel
        );
        entity = lightEntity;
      } else {
        const group = this.__generateGroupEntity(gltfModel);
        if (node.name) {
          group.tryToSetUniqueName(node.name, true);
        }
        entity = group;
      }

      if (this.__isMorphing(node, gltfModel)) {
        let weights: number[] = [];
        if (node.weights) {
          weights = node.weights;
        } else if (node.meshObject?.weights) {
          weights = node.meshObject.weights;
        }
        entity = EntityRepository.addComponentToEntity(
          BlendShapeComponent,
          entity
        );
        const blendShapeComponent = (
          entity as unknown as IBlendShapeEntityMethods
        ).getBlendShape();
        blendShapeComponent.weights = weights;
        if (node.meshObject?.primitives[0].extras?.targetNames) {
          blendShapeComponent.targetNames =
            node.meshObject.primitives[0].extras.targetNames;
        }
      }
      entity.tryToSetTag({tag: TagGltf2NodeIndex, value: node_i});

      rnEntities.push(entity);
      rnEntitiesByNames.set(node.name!, entity);
    }

    return {rnEntities, rnEntitiesByNames};
  }

  private static __isMorphing(node: RnM2Node, gltfModel: RnM2) {
    const argument =
      gltfModel.asset.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray![0];
    if (argument?.isMorphing === false) {
      return false;
    } else {
      return node.meshObject?.primitives[0].targets != null;
    }
  }

  private static __setupLight(
    light: KHR_lights_punctual_Light,
    gltfModel: RnM2
  ): ILightEntity {
    const lightEntity = this.__generateLightEntity(gltfModel);
    const lightComponent = lightEntity.getComponent(
      LightComponent
    )! as LightComponent;
    if (light.name != null) {
      lightComponent.tryToSetUniqueName(light.name, true);
      lightComponent.type = LightType.fromString(light.type);
      let color = Vector3.fromCopyArray3([1, 1, 1]);
      let intensity = 1;
      if (light.color != null) {
        color = Vector3.fromCopyArray3(light.color);
      }
      if (light.intensity != null) {
        intensity = light.intensity;
      }
      lightComponent.intensity = Vector3.multiply(color, intensity);
      if (light.range != null) {
        lightComponent.range = light.range;
      }
    }
    return lightEntity as ILightEntity;
  }

  private static __setupCamera(
    camera: RnM2Camera,
    gltfModel: RnM2
  ): ICameraEntity {
    const cameraEntity = this.__generateCameraEntity(gltfModel);
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.direction = Vector3.fromCopyArray([0, 0, -1]);
    if (
      gltfModel.asset &&
      (gltfModel.asset as any).LastSaved_ApplicationVendor
    ) {
      // For an old exporter compatibility
      cameraComponent.direction = Vector3.fromCopyArray([1, 0, 0]);
      cameraComponent.directionInner = Vector3.fromCopyArray([1, 0, 0]);
    }
    cameraComponent.up = Vector3.fromCopyArray([0, 1, 0]);
    cameraComponent.type = CameraType.fromString(camera.type);
    if (cameraComponent.type === CameraType.Perspective) {
      cameraComponent.aspect = camera.perspective!.aspectRatio
        ? camera.perspective!.aspectRatio
        : 1;
      cameraComponent.setFovyAndChangeFocalLength(
        MathUtil.radianToDegree(camera.perspective!.yfov)
      );
      cameraComponent.zNear = camera.perspective!.znear;
      cameraComponent.zFar = camera.perspective!.zfar
        ? camera.perspective!.zfar
        : 100000;
    } else if (cameraComponent.type === CameraType.Orthographic) {
      cameraComponent.xMag = camera.orthographic!.xmag;
      cameraComponent.yMag = camera.orthographic!.ymag;
      cameraComponent.zNear = camera.orthographic!.znear;
      cameraComponent.zFar = camera.orthographic!.zfar;
    }
    return cameraEntity as ICameraEntity;
  }

  private static __setupMesh(
    node: RnM2Node,
    mesh: RnM2Mesh,
    meshIndex: Index,
    rnBuffers: Buffer[],
    gltfModel: RnM2
  ) {
    const meshEntity = this.__generateMeshEntity(gltfModel);
    const existingRnMesh = (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx[
      meshIndex
    ];
    let rnPrimitiveMode = PrimitiveMode.Triangles;
    const meshComponent = meshEntity.getMesh();
    const rnMesh = new Mesh();

    // set flag to rnMesh with options
    const rnLoaderOptions = gltfModel.asset.extras!.rnLoaderOptions;
    if (rnLoaderOptions?.tangentCalculationMode != null) {
      rnMesh.tangentCalculationMode = rnLoaderOptions.tangentCalculationMode;
    }

    let originalRnMesh = rnMesh;
    if (existingRnMesh != null) {
      rnMesh.setOriginalMesh(existingRnMesh);
      originalRnMesh = existingRnMesh;
    } else {
      for (const i in mesh.primitives) {
        const primitive = mesh.primitives[i] as RnM2Primitive;
        if (primitive.mode != null) {
          rnPrimitiveMode = PrimitiveMode.from(primitive.mode)!;
        }

        const rnPrimitive = new Primitive();
        const material = this.__setupMaterial(
          rnPrimitive,
          node,
          gltfModel,
          primitive,
          primitive.materialObject!
        );

        if (material.isEmptyMaterial() === false) {
          ModelConverter.setDefaultTextures(material, gltfModel);
        }

        // indices
        let indicesRnAccessor;
        const map: Map<VertexAttributeSemanticsJoinedString, Accessor> =
          new Map();
        if (primitive.extensions?.KHR_draco_mesh_compression) {
          indicesRnAccessor = this.__decodeDraco(
            primitive,
            rnBuffers,
            gltfModel,
            map
          );

          if (Is.not.exist(indicesRnAccessor)) {
            break;
          }
        } else {
          // attributes
          if (Is.exist(primitive.indices)) {
            indicesRnAccessor = this.__getRnBufferViewAndRnAccessor(
              primitive.indicesObject!,
              rnBuffers[primitive.indicesObject!.bufferViewObject!.buffer!]
            );
          }

          const rnBufferViewMap: Map<number, BufferView> = new Map();
          for (const attributeName in primitive.attributesObjects!) {
            const rnm2attribute = primitive.attributesObjects[attributeName]!;
            const rnBuffer = rnBuffers[rnm2attribute.bufferViewObject!.buffer!];
            let rnBufferView: BufferView | undefined;
            if (Is.exist(rnm2attribute.bufferView)) {
              rnBufferView = rnBufferViewMap.get(rnm2attribute.bufferView);
              if (Is.not.exist(rnBufferView)) {
                rnBufferView = this.__getRnBufferView(
                  rnm2attribute.bufferViewObject!,
                  rnBuffer
                );
                rnBufferViewMap.set(rnm2attribute.bufferView, rnBufferView);
              }
            } else {
              rnBufferView = rnBuffer
                .takeBufferView({
                  byteLengthToNeed: 0,
                  byteStride: 0,
                })
                .unwrapForce();
            }
            const attributeRnAccessor = this.__getRnAccessor(
              rnm2attribute,
              rnBufferView
            ).unwrapForce();
            if (Is.exist(rnm2attribute.sparse)) {
              this.setSparseAccessor(rnm2attribute, attributeRnAccessor);
            }

            const joinedString =
              VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
                VertexAttribute.fromString(rnm2attribute.extras!.attributeName)
              );
            map.set(joinedString, attributeRnAccessor);
          }
        }

        rnPrimitive.setData(map, rnPrimitiveMode, material, indicesRnAccessor);

        // morph targets
        if (primitive.targets != null) {
          // set default number
          let maxMorphTargetNumber = Config.maxMorphTargetNumber;
          if (rnLoaderOptions?.maxMorphTargetNumber != null) {
            maxMorphTargetNumber = rnLoaderOptions.maxMorphTargetNumber;
          }

          const targets: Array<
            Map<VertexAttributeSemanticsJoinedString, Accessor>
          > = [];
          for (let i = 0; i < primitive.targetsObjects!.length; i++) {
            if (i >= maxMorphTargetNumber) {
              break;
            }

            const target = primitive.targetsObjects![i];
            const targetMap: Map<
              VertexAttributeSemanticsJoinedString,
              Accessor
            > = new Map();
            for (const attributeName in target) {
              const attributeAccessor = target[attributeName];
              const attributeRnAccessor = this.__getRnBufferViewAndRnAccessor(
                attributeAccessor,
                rnBuffers[attributeAccessor.bufferViewObject!.buffer!]
              );
              const attributeRnAccessorInGPUVertexData =
                this.__copyRnAccessorAndBufferView(attributeRnAccessor);
              const vertexAttribute = VertexAttribute.fromString(attributeName);
              const joinedString =
                VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
                  vertexAttribute
                );
              targetMap.set(joinedString, attributeRnAccessorInGPUVertexData);
            }
            targets.push(targetMap);
          }

          rnPrimitive.setBlendShapeTargets(targets);
        }
        rnMesh.addPrimitive(rnPrimitive);
      }

      if (mesh.weights) {
        rnMesh.weights = mesh.weights;
      }
    }

    meshComponent.setMesh(rnMesh);

    (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx[meshIndex] =
      originalRnMesh;

    return meshEntity;
  }

  static setSparseAccessor(accessor: RnM2Accessor, rnAccessor: Accessor) {
    const uint8Array: Uint8Array =
      accessor.bufferViewObject!.bufferObject!.buffer!;
    const count = accessor.sparse!.count;

    // indices
    const accessorIndices = accessor.sparse!.indices!;
    const bufferViewIndices = accessorIndices.bufferViewObject;
    const byteOffsetIndices: number =
      (bufferViewIndices.byteOffset ?? 0) + (accessorIndices.byteOffset ?? 0);

    const componentBytesIndices = this._checkBytesPerComponent(accessorIndices);
    const byteLengthIndices = componentBytesIndices * count; // index is scalar
    const dataViewIndices: any = new DataView(
      uint8Array.buffer,
      byteOffsetIndices + uint8Array.byteOffset,
      byteLengthIndices
    );

    const dataViewMethodIndices = this._checkDataViewMethod(accessorIndices);

    // sparse values
    const accessorValues = accessor.sparse!.values!;
    const bufferViewValues = accessorValues.bufferViewObject;
    const byteOffsetValues: number =
      (bufferViewValues.byteOffset ?? 0) + (accessorValues.byteOffset ?? 0);

    const componentBytesValues = this._checkBytesPerComponent(accessor);
    const componentNValues = this._checkComponentNumber(accessor);
    const byteLengthValues = componentBytesValues * componentNValues * count;
    const dataViewValues: any = new DataView(
      uint8Array.buffer,
      byteOffsetValues + uint8Array.byteOffset,
      byteLengthValues
    );
    const dataViewMethodValues = this._checkDataViewMethod(accessor);

    // set sparse values
    const typedArray = rnAccessor.getTypedArray();
    const littleEndian = true;
    for (let i = 0; i < count; i++) {
      const index = dataViewIndices[dataViewMethodIndices](
        componentBytesIndices * i,
        littleEndian
      );
      for (let j = 0; j < componentNValues; j++) {
        const value = dataViewValues[dataViewMethodValues](
          componentBytesValues * componentNValues * i +
            componentBytesValues * j,
          littleEndian
        );
        typedArray[index * componentNValues + j] = value;
      }
    }
  }

  static setDefaultTextures(material: Material, gltfModel: RnM2): void {
    if (gltfModel.asset.extras?.rnLoaderOptions?.defaultTextures == null) {
      return;
    }

    const options = gltfModel.asset.extras.rnLoaderOptions;

    const defaultTextures =
      gltfModel.asset.extras.rnLoaderOptions.defaultTextures;
    const basePath = defaultTextures.basePath;
    const textureInfos = defaultTextures.textureInfos;

    for (const textureInfo of textureInfos) {
      const rnTexture = new Texture();

      //options
      if (
        textureInfo.shaderSemantics === ShaderSemantics.BaseColorTexture ||
        textureInfo.shaderSemantics === ShaderSemantics.DiffuseColorTexture
      ) {
        rnTexture.autoDetectTransparency =
          options.autoDetectTextureTransparency === true;
      }

      rnTexture.autoResize = options.autoResizeTexture === true;

      const textureOption = {
        magFilter: Is.exist(textureInfo.sampler?.magFilter)
          ? TextureParameter.from(textureInfo.sampler!.magFilter)
          : TextureParameter.Linear,
        minFilter: Is.exist(textureInfo.sampler?.minFilter)
          ? TextureParameter.from(textureInfo.sampler!.minFilter)
          : TextureParameter.Linear,
        wrapS: Is.exist(textureInfo.sampler?.wrapS)
          ? TextureParameter.from(textureInfo.sampler!.wrapS)
          : TextureParameter.Repeat,
        wrapT: Is.exist(textureInfo.sampler?.wrapT)
          ? TextureParameter.from(textureInfo.sampler!.wrapT)
          : TextureParameter.Repeat,
      };

      const fileName = textureInfo.fileName;
      const uri = basePath + fileName;
      rnTexture.name = uri;

      const image = textureInfo.image;
      if (image?.image != null) {
        const webglResourceRepository =
          CGAPIResourceRepository.getWebGLResourceRepository();
        const isWebGL1 =
          !webglResourceRepository.currentWebGLContextWrapper?.isWebGL2;

        if (
          isWebGL1 &&
          !this.__sizeIsPowerOfTwo(image.image) &&
          this.__needResizeToPowerOfTwoOnWebGl1(textureOption)
        ) {
          rnTexture.autoResize = true;
        }

        rnTexture.generateTextureFromImage(image.image, textureOption);
      } else if (image?.basis != null) {
        rnTexture.generateTextureFromBasis(image.basis, textureOption);
      } else if (image?.ktx2 != null) {
        rnTexture.generateTextureFromKTX2(image.ktx2, textureOption);
      } else {
        console.warn('default image not found');
        continue;
      }

      const shaderSemantics = textureInfo.shaderSemantics;
      material.setTextureParameter(shaderSemantics, rnTexture);
    }
  }

  private static __setVRMMaterial(
    rnPrimitive: Primitive,
    node: RnM2Node,
    gltfModel: RnM2,
    primitive: RnM2Primitive,
    materialJson: RnM2Material,
    rnLoaderOptions: GltfLoadOption
  ): Material | undefined {
    const VRMProperties = gltfModel.extensions.VRM;

    const materialProperties =
      gltfModel.extensions.VRM.materialProperties[primitive.material!];
    const shaderName = materialProperties.shader;
    if (shaderName === 'VRM/MToon') {
      // argument
      const defaultMaterialHelperArgument =
        rnLoaderOptions.defaultMaterialHelperArgumentArray![0];

      const additionalName = defaultMaterialHelperArgument.additionalName;
      const isMorphing = this.__isMorphing(node, gltfModel);
      const isSkinning = this.__isSkinning(node, gltfModel);
      const isLighting = this.__isLighting(gltfModel, materialJson);
      const useTangentAttribute = this.__useTangentAttribute(
        gltfModel,
        primitive
      );
      const textures = defaultMaterialHelperArgument.textures;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber =
        defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this.__makeOutputSrgb(gltfModel);

      // outline
      let renderPassOutline;
      const rnExtension = VRMProperties.rnExtension;
      if (Is.exist(rnExtension)) {
        renderPassOutline = rnExtension.renderPassOutline;
        renderPassOutline.isVrRendering = true;
      }

      //exist outline
      if (renderPassOutline != null) {
        let outlineMaterial: Material;
        if (materialProperties.floatProperties._OutlineWidthMode !== 0) {
          outlineMaterial = MaterialHelper.createMToonMaterial({
            additionalName,
            isMorphing,
            isSkinning,
            isLighting,
            useTangentAttribute,
            isOutline: true,
            materialProperties,
            textures,
            debugMode,
            maxInstancesNumber,
            makeOutputSrgb,
          });
        } else {
          outlineMaterial = MaterialHelper.createEmptyMaterial();
        }

        renderPassOutline.setMaterialForPrimitive(outlineMaterial, rnPrimitive);
      }

      const material = MaterialHelper.createMToonMaterial({
        additionalName,
        isMorphing,
        isSkinning,
        isLighting,
        useTangentAttribute,
        isOutline: false,
        materialProperties,
        textures,
        debugMode,
        maxInstancesNumber,
        makeOutputSrgb,
      });

      return material;
    } else if (
      rnLoaderOptions.defaultMaterialHelperArgumentArray![0].isOutline
    ) {
      return MaterialHelper.createEmptyMaterial();
    }

    // use another material
    return undefined;
  }

  private static __generateAppropriateMaterial(
    rnPrimitive: Primitive,
    node: RnM2Node,
    gltfModel: RnM2,
    primitive: RnM2Primitive,
    materialJson: RnM2Material
  ): Material {
    if (gltfModel.asset.extras?.rnLoaderOptions != null) {
      const rnLoaderOptions = gltfModel.asset.extras.rnLoaderOptions;

      if (
        rnLoaderOptions?.loaderExtension?.isNeededToUseThisMaterial != null &&
        rnLoaderOptions.loaderExtension.isNeededToUseThisMaterial(gltfModel)
      ) {
        const loaderExtension =
          gltfModel.asset.extras?.rnLoaderOptions?.loaderExtension;
        if (loaderExtension?.generateMaterial != null) {
          return loaderExtension.generateMaterial(materialJson);
        }
      }

      if (rnLoaderOptions.isImportVRM) {
        const material = this.__setVRMMaterial(
          rnPrimitive,
          node,
          gltfModel,
          primitive,
          materialJson,
          rnLoaderOptions
        );
        if (material != null) return material;
      }

      const materialHelperName = rnLoaderOptions.defaultMaterialHelperName;
      if (materialHelperName != null) {
        return (MaterialHelper as any)[materialHelperName](
          ...rnLoaderOptions.defaultMaterialHelperArgumentArray!
        );
      }
    }

    let maxMaterialInstanceNumber: number =
      Config.maxMaterialInstanceForEachType;
    if (gltfModel.meshes.length > Config.maxMaterialInstanceForEachType) {
      maxMaterialInstanceNumber =
        gltfModel.meshes.length +
        Math.floor(Config.maxMaterialInstanceForEachType / 2);
    }

    const isMorphing = this.__isMorphing(node, gltfModel);
    const isSkinning = this.__isSkinning(node, gltfModel);
    const isLighting = this.__isLighting(gltfModel, materialJson);
    const alphaMode = AlphaMode.fromGlTFString(
      materialJson?.alphaMode || 'OPAQUE'
    );
    const additionalName =
      node.skin != null ? `skin${node.skin ?? node.skinName ?? ''}` : void 0;
    if (parseFloat(gltfModel.asset?.version) >= 2) {
      const useTangentAttribute = this.__useTangentAttribute(
        gltfModel,
        primitive
      );
      const useNormalTexture = this.__useNormalTexture(gltfModel);
      const makeOutputSrgb = this.__makeOutputSrgb(gltfModel);
      return MaterialHelper.createPbrUberMaterial({
        isMorphing,
        isSkinning,
        isLighting,
        alphaMode,
        useTangentAttribute,
        useNormalTexture,
        additionalName: additionalName,
        maxInstancesNumber: maxMaterialInstanceNumber,
        makeOutputSrgb,
      });
    } else {
      return MaterialHelper.createClassicUberMaterial({
        isSkinning,
        isLighting,
        alphaMode,
        additionalName: additionalName,
        maxInstancesNumber: maxMaterialInstanceNumber,
      });
    }
  }

  private static __isLighting(gltfModel: RnM2, materialJson?: RnM2Material) {
    const argument =
      gltfModel?.asset?.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray![0];
    if (argument?.isLighting != null) {
      return argument.isLighting as boolean;
    } else {
      return materialJson?.extensions?.KHR_materials_unlit != null
        ? false
        : true;
    }
  }

  private static __isSkinning(node: RnM2Node, gltfModel: RnM2) {
    const argument =
      gltfModel?.asset?.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray![0];
    if (argument?.isSkinning === false) {
      return false;
    } else {
      return node.skin != null;
    }
  }

  private static __useTangentAttribute(
    gltfModel: RnM2,
    primitive: RnM2Primitive
  ) {
    const tangentCalculationMode =
      gltfModel?.asset?.extras?.rnLoaderOptions?.tangentCalculationMode;

    switch (tangentCalculationMode) {
      case 0: // do not use normal map
        return false;
      case 1: // tangent attribute + calculated tangent in shader
        break;
      case 2: // tangent attribute + pre-calculated tangent
        return true;
      case 3: // force calc in shader
        return false;
      case 4: // force pre-calc
        return true;
      default:
    }

    for (const attribute in primitive.attributes) {
      if (attribute === 'TANGENT') {
        return true;
      }
    }
    return false;
  }

  private static __useNormalTexture(gltfModel: RnM2) {
    const argument =
      gltfModel?.asset?.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray![0];
    if (argument?.useNormalTexture === false) {
      return false;
    } else {
      return (
        gltfModel?.asset?.extras?.rnLoaderOptions?.tangentCalculationMode !== 0
      );
    }
  }

  private static __makeOutputSrgb(gltfModel: RnM2) {
    const argument =
      gltfModel?.asset?.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray![0];
    return argument?.makeOutputSrgb as boolean | undefined;
  }

  private static __getMaterialHash(
    node: RnM2Node,
    gltfModel: RnM2,
    primitive: RnM2Primitive,
    materialJson: RnM2Material
  ) {
    return (
      primitive.material! +
      '_isSkinning_' +
      this.__isSkinning(node, gltfModel) +
      '_isMorphing_' +
      this.__isMorphing(node, gltfModel) +
      '_isLighting_' +
      this.__isLighting(gltfModel, materialJson) +
      '_useTangentAttribute_' +
      this.__useTangentAttribute(gltfModel, primitive)
    );
  }

  private static __setupMaterial(
    rnPrimitive: Primitive,
    node: RnM2Node,
    gltfModel: RnM2,
    primitive: RnM2Primitive,
    materialJson: RnM2Material
  ): Material {
    const materialHash = this.__getMaterialHash(
      node,
      gltfModel,
      primitive,
      materialJson
    );
    let material = gltfModel.asset.extras?.rnMaterials![materialHash];
    if (material != null) {
      return material;
    } else {
      const newMaterial: Material = this.__generateAppropriateMaterial(
        rnPrimitive,
        node,
        gltfModel,
        primitive,
        materialJson
      );
      gltfModel.asset.extras!.rnMaterials![materialHash] = newMaterial;
      material = newMaterial;
    }

    // avoid unexpected initialization
    if (
      !this.__needParameterInitialization(
        materialJson,
        material.materialTypeName
      )
    )
      return material;

    const options = gltfModel.asset.extras!.rnLoaderOptions;
    const pbrMetallicRoughness = materialJson.pbrMetallicRoughness;
    if (pbrMetallicRoughness != null) {
      // BaseColor Factor
      setupPbrMetallicRoughness(
        pbrMetallicRoughness,
        material,
        gltfModel,
        options,
        materialJson
      );
    } else {
      let param: Index = ShadingModel.Phong.index;
      if (materialJson.extras?.technique) {
        switch (materialJson.extras.technique) {
          case ShadingModel.Constant.str:
            param = ShadingModel.Constant.index;
            break;
          case ShadingModel.Lambert.str:
            param = ShadingModel.Lambert.index;
            break;
          case ShadingModel.BlinnPhong.str:
            param = ShadingModel.BlinnPhong.index;
            break;
          case ShadingModel.Phong.str:
            param = ShadingModel.Phong.index;
            break;
        }
        material.setParameter(
          ShaderSemantics.ShadingModel,
          Scalar.fromCopyNumber(param)
        );
      }
    }

    const emissiveTexture = materialJson.emissiveTexture;
    if (emissiveTexture != null) {
      const rnTexture = ModelConverter._createTexture(
        emissiveTexture.texture!,
        gltfModel
      );
      material.setTextureParameter(ShaderSemantics.EmissiveTexture, rnTexture);
      if (
        parseFloat(gltfModel.asset?.version) >= 2 &&
        emissiveTexture.texCoord != null
      ) {
        material.setParameter(
          PbrShadingMaterialContent.EmissiveTexcoordIndex,
          emissiveTexture.texCoord
        );
      }
    }

    let alphaMode = materialJson.alphaMode;
    if (options?.alphaMode) {
      alphaMode = options.alphaMode;
    }
    if (alphaMode != null) {
      material.alphaMode = AlphaMode.fromGlTFString(alphaMode)!;

      // set alpha threshold except for VRM
      if (
        material.alphaMode === AlphaMode.Mask &&
        !gltfModel.asset.extras?.rnLoaderOptions?.isImportVRM
      ) {
        material.setParameter(
          ShaderSemantics.AlphaCutoff,
          Scalar.fromCopyNumber(materialJson.alphaCutoff ?? 0.5)
        );
      }
    }

    const doubleSided = materialJson.doubleSided;
    if (doubleSided != null) {
      material.cullFace = !doubleSided;
    }

    // For glTF1.0
    if (Is.exist((materialJson as any).diffuseColorTexture)) {
      const diffuseColorTexture = (materialJson as any)
        .diffuseColorTexture as RnM2Texture;
      const rnTexture = ModelConverter._createTexture(
        diffuseColorTexture,
        gltfModel,
        {
          autoDetectTransparency: options?.autoDetectTextureTransparency,
        }
      );
      material.setTextureParameter(
        ShaderSemantics.DiffuseColorTexture,
        rnTexture
      );

      if (
        this._checkRnGltfLoaderOptionsExist(gltfModel) &&
        gltfModel.asset.extras?.rnLoaderOptions?.loaderExtension
      ) {
        const loaderExtension = gltfModel.asset.extras!.rnLoaderOptions!
          .loaderExtension as ILoaderExtension;
        if (loaderExtension.setUVTransformToTexture) {
          loaderExtension.setUVTransformToTexture(
            material,
            diffuseColorTexture.samplerObject!
          );
        }
      }
    }
    if (Is.exist(materialJson.diffuseColorFactor)) {
      const diffuseColorFactor =
        materialJson.diffuseColorFactor as Array4<number>;
      material.setParameter(
        ShaderSemantics.DiffuseColorFactor,
        Vector4.fromCopyArray4(diffuseColorFactor)
      );
    }

    const normalTexture = materialJson.normalTexture;
    if (normalTexture != null) {
      const rnTexture = ModelConverter._createTexture(
        normalTexture.texture!,
        gltfModel
      );
      material.setTextureParameter(ShaderSemantics.NormalTexture, rnTexture);
      if (parseFloat(gltfModel.asset?.version) >= 2) {
        if (normalTexture.texCoord != null) {
          material.setParameter(
            PbrShadingMaterialContent.NormalTexcoordIndex,
            normalTexture.texCoord
          );
        }

        if (normalTexture.scale != null) {
          material.setParameter(
            PbrShadingMaterialContent.NormalScale,
            normalTexture.scale
          );
        }
      }
    }
    ModelConverter._setupTextureTransform(
      normalTexture!,
      material,
      PbrShadingMaterialContent.NormalTextureTransform,
      PbrShadingMaterialContent.NormalTextureRotation
    );

    // ModelConverter._setupTextureTransform(normalTexture, material, 'normalTextureTransform', 'normalTextureRotation')

    // For Extension
    if (this._checkRnGltfLoaderOptionsExist(gltfModel)) {
      const loaderExtension =
        gltfModel.asset.extras?.rnLoaderOptions?.loaderExtension;
      if (loaderExtension?.setupMaterial != null) {
        loaderExtension.setupMaterial(gltfModel, materialJson, material);
      }
    }

    return material;
  }

  static _createTexture(
    texture: RnM2Texture,
    gltfModel: RnM2,
    {autoDetectTransparency = false} = {}
  ) {
    const options = gltfModel.asset.extras?.rnLoaderOptions;

    const rnTexture = new Texture();
    rnTexture.autoDetectTransparency = autoDetectTransparency;
    rnTexture.autoResize = options?.autoResizeTexture === true;

    const textureOption = {
      magFilter: Is.exist(texture.samplerObject?.magFilter)
        ? TextureParameter.from(texture.samplerObject!.magFilter)
        : TextureParameter.Linear,
      minFilter: Is.exist(texture.samplerObject?.minFilter)
        ? TextureParameter.from(texture.samplerObject!.minFilter)
        : TextureParameter.Linear,
      wrapS: Is.exist(texture.samplerObject?.wrapS)
        ? TextureParameter.from(texture.samplerObject!.wrapS)
        : TextureParameter.Repeat,
      wrapT: Is.exist(texture.samplerObject?.wrapT)
        ? TextureParameter.from(texture.samplerObject!.wrapT)
        : TextureParameter.Repeat,
    };

    const image = texture.image as RnM2Image;
    if (image.image) {
      const imageElem = image.image as HTMLImageElement;
      const webglResourceRepository =
        CGAPIResourceRepository.getWebGLResourceRepository();
      const isWebGL1 =
        !webglResourceRepository.currentWebGLContextWrapper?.isWebGL2;

      if (
        isWebGL1 &&
        !this.__sizeIsPowerOfTwo(imageElem) &&
        this.__needResizeToPowerOfTwoOnWebGl1(textureOption)
      ) {
        rnTexture.autoResize = true;
      }

      rnTexture.generateTextureFromImage(imageElem, textureOption);
    } else if (image.basis) {
      rnTexture.generateTextureFromBasis(image.basis, textureOption);
    } else if (image.ktx2) {
      rnTexture.generateTextureFromKTX2(image.ktx2, textureOption);
    }

    if (image.uri) {
      rnTexture.name = image.uri;
    } else {
      const ext = image.mimeType?.split('/')[1];
      rnTexture.name = image.name + `.${ext}`;
    }

    return rnTexture;
  }

  private static __needResizeToPowerOfTwoOnWebGl1(textureOption: any) {
    if (
      textureOption.wrapS !== TextureParameter.ClampToEdge ||
      textureOption.wrapT !== TextureParameter.ClampToEdge ||
      (textureOption.minFilter !== TextureParameter.Linear &&
        textureOption.minFilter !== TextureParameter.Nearest)
    ) {
      return true;
    }

    return false;
  }

  private static __sizeIsPowerOfTwo(image: HTMLImageElement) {
    const width = image.width;
    const height = image.height;

    if ((width & (width - 1)) === 0 && (height & (height - 1)) === 0) {
      return true;
    } else {
      return false;
    }
  }

  private static __needParameterInitialization(
    materialJson: RnM2Material,
    materialTypeName: string
  ): boolean {
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

  private static _checkRnGltfLoaderOptionsExist(gltfModel: RnM2) {
    if (gltfModel.asset.extras?.rnLoaderOptions) {
      return true;
    } else {
      return false;
    }
  }

  private static __rewrapWithTypedArray(
    typedArrayClass: TypedArrayConstructor,
    uint8Array: Uint8Array,
    byteOffset: Byte,
    length: Size
  ) {
    return new typedArrayClass(
      uint8Array.buffer,
      byteOffset + uint8Array.byteOffset,
      length
    );
  }

  static _checkBytesPerComponent(accessor: RnM2Accessor | RnM2SparseIndices) {
    let bytesPerComponent = 0;
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

  static _checkComponentNumber(accessor: RnM2Accessor) {
    let componentN = 0;
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

  static _checkDataViewMethod(accessor: RnM2Accessor | RnM2SparseIndices) {
    let dataViewMethod = '';
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
    return !!new Uint8Array(new Uint16Array([0x00ff]).buffer)[0];
  }

  static _readBinaryFromAccessorAndSetItToAccessorExtras(
    accessor: RnM2Accessor
  ): Float32Array {
    const bufferView = accessor.bufferViewObject!;
    const byteOffsetFromBuffer: number =
      (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const buffer = bufferView.bufferObject!;
    const uint8Array: Uint8Array = buffer.buffer!;

    const componentN = this._checkComponentNumber(accessor);
    const componentBytes = this._checkBytesPerComponent(accessor);
    const dataViewMethod = this._checkDataViewMethod(accessor);
    if (Is.not.exist(accessor.extras)) {
      accessor.extras = {
        attributeName: '',
        toGetAsTypedArray: true,
        typedDataArray: new Float32Array(),
        componentN: 0,
        componentBytes: 4,
        dataViewMethod: '',
      };
    }

    // for weights animation accessor, set componentN as weightsArrayLength
    accessor.extras.componentN = Is.exist(accessor.extras?.weightsArrayLength)
      ? accessor.extras!.weightsArrayLength
      : componentN;
    accessor.extras.componentBytes = componentBytes;
    accessor.extras.dataViewMethod = dataViewMethod;

    const byteLength = componentBytes * componentN * accessor.count;

    let float32Array = new Float32Array();
    const numberArray: number[] = [];

    if (ModelConverter._isSystemLittleEndian()) {
      // If this platform is Little Endian System,
      //   the uint8array can
      let typedDataArray: TypedArray = new Float32Array();
      if (dataViewMethod === 'getFloat32') {
        typedDataArray = this.__rewrapWithTypedArray(
          Float32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === 'getInt8') {
        typedDataArray = new Int8Array(
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === 'getUint8') {
        typedDataArray = new Uint8Array(
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === 'getInt16') {
        typedDataArray = this.__rewrapWithTypedArray(
          Int16Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === 'getUint16') {
        typedDataArray = this.__rewrapWithTypedArray(
          Uint16Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === 'getInt32') {
        typedDataArray = this.__rewrapWithTypedArray(
          Int32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === 'getUint32') {
        typedDataArray = this.__rewrapWithTypedArray(
          Uint32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      }
      float32Array = this.__normalizeTypedArrayToFloat32Array(
        dataViewMethod,
        typedDataArray
      );
    } else {
      // for BigEndian process
      const dataView: any = new DataView(
        uint8Array.buffer,
        byteOffsetFromBuffer + uint8Array.byteOffset,
        byteLength
      );
      const byteDelta = componentBytes * componentN;
      const littleEndian = true;
      for (let pos = 0; pos < byteLength; pos += byteDelta) {
        switch (accessor.type) {
          case 'SCALAR':
            numberArray.push(dataView[dataViewMethod](pos, littleEndian));
            break;
          case 'VEC2':
            numberArray.push(dataView[dataViewMethod](pos, littleEndian));
            numberArray.push(
              dataView[dataViewMethod](pos + componentBytes, littleEndian)
            );
            break;
          case 'VEC3':
            numberArray.push(dataView[dataViewMethod](pos, littleEndian));
            numberArray.push(
              dataView[dataViewMethod](pos + componentBytes, littleEndian)
            );
            numberArray.push(
              dataView[dataViewMethod](pos + componentBytes * 2, littleEndian)
            );
            break;
          case 'VEC4':
            for (let i = 0; i < 4; i++) {
              numberArray.push(
                dataView[dataViewMethod](pos + componentBytes * i, littleEndian)
              );
            }
            break;
          case 'MAT4':
            for (let i = 0; i < 16; i++) {
              numberArray.push(
                dataView[dataViewMethod](pos + componentBytes * i, littleEndian)
              );
            }
            break;
        }
      }
      float32Array = this.__normalizeTypedArrayToFloat32Array(
        dataViewMethod,
        numberArray
      );
    }

    accessor.extras!.typedDataArray = float32Array;

    return float32Array;
  }

  /**
   * normalize values of TypedArray to Float32Array
   * See: the last part of 3.11.Animation at https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#animations
   * @param dataViewMethod
   * @param numberArray
   * @returns
   */
  private static __normalizeTypedArrayToFloat32Array(
    dataViewMethod: string,
    numberArray: number[] | TypedArray
  ): Float32Array {
    if (dataViewMethod === 'getInt8') {
      return DataUtil.normalizedInt8ArrayToFloat32Array(
        numberArray as unknown as Int8Array
      );
    } else if (dataViewMethod === 'getUint8') {
      return DataUtil.normalizedUint8ArrayToFloat32Array(
        numberArray as unknown as Uint8Array
      );
    } else if (dataViewMethod === 'getInt16') {
      return DataUtil.normalizedInt16ArrayToFloat32Array(
        numberArray as unknown as Int16Array
      );
    } else if (dataViewMethod === 'getUint16') {
      return DataUtil.normalizedUint16ArrayToFloat32Array(
        numberArray as unknown as Uint16Array
      );
    } else if (dataViewMethod === 'getInt32') {
      // typedDataArray = new Int32Array(numberArray);
      console.error('Not considered');
      return new Float32Array();
    } else if (dataViewMethod === 'getUint32') {
      // typedDataArray = new Uint32Array(numberArray);
      console.error('Not considered');
      return new Float32Array();
    } else if (dataViewMethod === 'getFloat32') {
      return new Float32Array(numberArray);
    } else {
      console.error('Not considered');
      return new Float32Array();
    }
  }

  private static __addOffsetToIndices(meshComponent: MeshComponent) {
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

  /**
   * Take a Rn.Accessor from the Rn.Buffer
   *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
   * @param accessor
   * @param rnBuffer
   * @returns
   */
  private static __getRnAccessor(
    accessor: RnM2Accessor,
    rnBufferView: BufferView
  ) {
    const rnAccessor = rnBufferView.takeAccessorWithByteOffset({
      compositionType: CompositionType.fromString(accessor.type),
      componentType: ComponentType.from(accessor.componentType),
      count: accessor.count,
      byteOffsetInBufferView: accessor.byteOffset ?? 0,
      byteStride: accessor.byteStride,
      max: accessor.max,
      min: accessor.min,
      normalized: accessor.normalized,
    });

    return rnAccessor;
  }

  /**
   * Take a Rn.BufferView and a Rn.Accessor from the Rn.Buffer
   *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
   * @param accessor
   * @param rnBuffer
   * @returns
   */
  private static __getRnBufferViewAndRnAccessor(
    accessor: RnM2Accessor,
    rnBuffer: Buffer
  ) {
    const gltfBufferView = accessor.bufferViewObject!;
    const rnBufferView = rnBuffer
      .takeBufferViewWithByteOffset({
        byteLengthToNeed: gltfBufferView.byteLength,
        byteStride: gltfBufferView.byteStride ?? 0,
        byteOffset: gltfBufferView.byteOffset ?? 0,
      })
      .unwrapForce();

    const rnAccessor = rnBufferView
      .takeAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: accessor.count,
        byteOffsetInBufferView: accessor.byteOffset ?? 0,
        byteStride: accessor.byteStride,
        max: accessor.max,
        min: accessor.min,
        normalized: accessor.normalized,
      })
      .unwrapForce();

    return rnAccessor;
  }

  private static __copyRnAccessorAndBufferView(srcRnAccessor: Accessor) {
    const byteSize = srcRnAccessor.elementCount * 3 /* vec4 */ * 4; /* bytes */
    const dstRnBuffer = MemoryManager.getInstance().createOrGetBuffer(
      BufferUse.GPUVertexData
    );
    const dstRnBufferView = dstRnBuffer
      .takeBufferView({
        byteLengthToNeed: byteSize,
        byteStride: 3 /* vec4 */ * 4 /* bytes */,
      })
      .unwrapForce();

    const dstRnAccessor = dstRnBufferView
      .takeAccessor({
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        count: srcRnAccessor.elementCount,
        max: srcRnAccessor.max,
        min: srcRnAccessor.min,
        normalized: srcRnAccessor.normalized,
      })
      .unwrapForce();

    dstRnAccessor.copyBuffer(srcRnAccessor);

    return dstRnAccessor;
  }

  private static __takeRnBufferViewAndRnAccessorForDraco(
    accessor: RnM2Accessor,
    numOfAttributes: Count,
    compositionNum: Count,
    rnBuffer: Buffer
  ) {
    const rnBufferView = rnBuffer
      .takeBufferView({
        byteLengthToNeed: numOfAttributes * compositionNum * 4,
        byteStride: 0,
      })
      .unwrapForce();

    const rnAccessor = rnBufferView
      .takeAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: numOfAttributes,
        byteStride: accessor.byteStride,
        byteOffsetInBufferView: accessor.byteOffset ?? 0,
        max: accessor.max,
        min: accessor.min,
        normalized: accessor.normalized,
      })
      .unwrapForce();

    return rnAccessor;
  }

  private static __getRnBufferView(
    rnm2bufferView: RnM2BufferView,
    rnBuffer: Buffer
  ) {
    const rnBufferView = rnBuffer
      .takeBufferViewWithByteOffset({
        byteLengthToNeed: rnm2bufferView.byteLength,
        byteStride: rnm2bufferView.byteStride ?? 0,
        byteOffset: rnm2bufferView.byteOffset ?? 0,
      })
      .unwrapForce();

    return rnBufferView;
  }

  private static __getGeometryFromDracoBuffer(
    draco: any,
    decoder: any,
    arrayBuffer: ArrayBuffer
  ) {
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

    if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
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

  static __getIndicesFromDraco(
    draco: any,
    decoder: any,
    dracoGeometry: any,
    triangleStripDrawMode: boolean
  ) {
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
      for (let i = 0; i < stripsArray.size(); ++i) {
        indices[i] = stripsArray.GetValue(i);
      }
      draco.destroy(stripsArray);
    } else {
      // TRIANGLES
      const numFaces = dracoGeometry.num_faces();
      const numIndices = numFaces * 3;
      indices = new Uint32Array(numIndices);
      const ia = new draco.DracoInt32Array();
      for (let i = 0; i < numFaces; ++i) {
        decoder.GetFaceFromMesh(dracoGeometry, i, ia);
        const index = i * 3;
        indices[index] = ia.GetValue(0);
        indices[index + 1] = ia.GetValue(1);
        indices[index + 2] = ia.GetValue(2);
      }
      draco.destroy(ia);
    }
    return indices;
  }

  private static __decodeDraco(
    primitive: RnM2Primitive,
    rnBuffers: Buffer[],
    gltfModel: RnM2,
    map: Map<VertexAttributeSemanticsJoinedString, Accessor>
  ) {
    const bufferView =
      gltfModel.bufferViews[
        primitive.extensions.KHR_draco_mesh_compression.bufferView
      ];
    const rnBufferView = this.__getRnBufferView(
      bufferView,
      rnBuffers[bufferView.buffer!]
    );
    const arraybufferOfBufferView = new Uint8Array(rnBufferView.getUint8Array())
      .buffer;

    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.__getGeometryFromDracoBuffer(
      draco,
      decoder,
      arraybufferOfBufferView
    );
    if (dracoGeometry == null) {
      draco.destroy(dracoGeometry);
      draco.destroy(decoder);
      return void 0;
    }

    const numPoints = dracoGeometry.num_points();
    const rnBufferForDraco = this.__createBufferForDecompressedData(
      primitive,
      numPoints
    );

    // decode indices
    const primitiveMode = PrimitiveMode.from(primitive.mode!);
    let isTriangleStrip = false;
    if (primitiveMode === PrimitiveMode.TriangleStrip) {
      isTriangleStrip = true;
    }

    const indices = this.__getIndicesFromDraco(
      draco,
      decoder,
      dracoGeometry,
      isTriangleStrip
    )!;
    const indicesRnAccessor = this.__takeRnBufferViewAndRnAccessorForDraco(
      primitive.indicesObject!,
      indices.length,
      1,
      rnBufferForDraco
    );
    for (let i = 0; i < indices.length; i++) {
      indicesRnAccessor.setScalar(i, indices[i], {});
    }

    // decode attributes
    for (const attributeName in primitive.attributes) {
      const dracoAttributeId =
        primitive.extensions.KHR_draco_mesh_compression.attributes[
          attributeName
        ];

      const attributeGltf2Accessor =
        primitive.attributesObjects![attributeName];
      let attributeRnAccessor: Accessor | undefined = undefined;

      if (Is.not.exist(dracoAttributeId)) {
        // non-encoded data

        attributeRnAccessor = this.__getRnBufferViewAndRnAccessor(
          attributeGltf2Accessor!,
          rnBuffers[attributeGltf2Accessor!.bufferViewObject!.buffer!]
        );
      } else {
        // encoded data

        const compositionNum = CompositionType.fromString(
          attributeGltf2Accessor!.type
        ).getNumberOfComponents();
        attributeRnAccessor = this.__takeRnBufferViewAndRnAccessorForDraco(
          attributeGltf2Accessor!,
          numPoints,
          compositionNum,
          rnBufferForDraco
        );

        const dracoAttributePointer = decoder.GetAttributeByUniqueId(
          dracoGeometry,
          dracoAttributeId
        );
        const decompressedAttributeData = new draco.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints(
          dracoGeometry,
          dracoAttributePointer,
          decompressedAttributeData
        );

        for (let i = 0; i < numPoints; i++) {
          if (compositionNum === 1) {
            attributeRnAccessor.setScalar(
              i,
              decompressedAttributeData.GetValue(i * compositionNum),
              {}
            );
          } else if (compositionNum === 2) {
            attributeRnAccessor.setVec2(
              i,
              decompressedAttributeData.GetValue(i * compositionNum),
              decompressedAttributeData.GetValue(i * compositionNum + 1),
              {}
            );
          } else if (compositionNum === 3) {
            attributeRnAccessor.setVec3(
              i,
              decompressedAttributeData.GetValue(i * compositionNum),
              decompressedAttributeData.GetValue(i * compositionNum + 1),
              decompressedAttributeData.GetValue(i * compositionNum + 2),
              {}
            );
          } else if (compositionNum === 4) {
            attributeRnAccessor.setVec4(
              i,
              decompressedAttributeData.GetValue(i * compositionNum),
              decompressedAttributeData.GetValue(i * compositionNum + 1),
              decompressedAttributeData.GetValue(i * compositionNum + 2),
              decompressedAttributeData.GetValue(i * compositionNum + 3),
              {}
            );
          }
        }

        draco.destroy(decompressedAttributeData);
      }

      if (Is.exist(attributeGltf2Accessor!.sparse)) {
        this.setSparseAccessor(attributeGltf2Accessor!, attributeRnAccessor!);
      }

      const joinedString =
        VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
          VertexAttribute.fromString(
            attributeGltf2Accessor!.extras!.attributeName
          )
        );
      map.set(joinedString, attributeRnAccessor!);
    }

    draco.destroy(dracoGeometry);
    draco.destroy(decoder);

    return indicesRnAccessor;
  }

  static _setupTextureTransform(
    textureJson: RnM2TextureInfo,
    rnMaterial: Material,
    textureTransformShaderSemantic: ShaderSemanticsEnum,
    textureRotationShaderSemantic: ShaderSemanticsEnum
  ) {
    if (textureJson?.extensions?.KHR_texture_transform) {
      const transform = MutableVector4.fromCopyArray([1.0, 1.0, 0.0, 0.0]);
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

  private static __createBufferForDecompressedData(
    primitive: RnM2Primitive,
    numPoints: number
  ): Buffer {
    let byteLengthOfBufferForDraco = 0;

    if (Is.exist(primitive.indices)) {
      const count = primitive.indicesObject!.count;
      byteLengthOfBufferForDraco += count * 4;
    }

    const drcAttributes =
      primitive.extensions.KHR_draco_mesh_compression.attributes;
    for (const attributeName in primitive.attributes) {
      if (drcAttributes[attributeName] == null) {
        // non-encoded data

        continue;
      }

      const accessor = primitive.attributesObjects![attributeName];
      const compositionNum = CompositionType.fromString(
        accessor!.type
      ).getNumberOfComponents();
      const attributeByteLength = numPoints * compositionNum * 4;
      byteLengthOfBufferForDraco += attributeByteLength;
    }

    return new Buffer({
      byteLength: byteLengthOfBufferForDraco,
      buffer: new ArrayBuffer(byteLengthOfBufferForDraco),
      name: 'Draco',
      byteAlign: 4,
    });
  }
}
function setupPbrMetallicRoughness(
  pbrMetallicRoughness: RnM2PbrMetallicRoughness,
  material: Material,
  gltfModel: RnM2,
  options: GltfLoadOption | undefined,
  materialJson: RnM2Material
) {
  const baseColorFactor = pbrMetallicRoughness.baseColorFactor;
  if (baseColorFactor != null) {
    material.setParameter(
      ShaderSemantics.BaseColorFactor,
      Vector4.fromCopyArray4(baseColorFactor)
    );
  }

  // BaseColor Texcoord Transform
  const baseColorTexture = pbrMetallicRoughness.baseColorTexture;
  if (baseColorTexture != null) {
    const rnTexture = ModelConverter._createTexture(
      baseColorTexture.texture!,
      gltfModel,
      {
        autoDetectTransparency: options?.autoDetectTextureTransparency,
      }
    );
    material.setTextureParameter(ShaderSemantics.BaseColorTexture, rnTexture);
    if (baseColorTexture.texCoord != null) {
      material.setParameter(
        PbrShadingMaterialContent.BaseColorTexcoordIndex,
        baseColorTexture.texCoord
      );
    }
  }
  // BaseColor TexCoord Transform
  ModelConverter._setupTextureTransform(
    baseColorTexture!,
    material,
    PbrShadingMaterialContent.BaseColorTextureTransform,
    PbrShadingMaterialContent.BaseColorTextureRotation
  );

  // Ambient Occlusion Texture
  const occlusionTexture = materialJson.occlusionTexture;
  if (occlusionTexture != null) {
    const rnTexture = ModelConverter._createTexture(
      occlusionTexture.texture!,
      gltfModel
    );
    material.setTextureParameter(ShaderSemantics.OcclusionTexture, rnTexture);
    if (occlusionTexture.texCoord != null) {
      material.setParameter(
        PbrShadingMaterialContent.OcclusionTexcoordIndex,
        occlusionTexture.texCoord
      );
    }
    if (occlusionTexture.strength != null) {
      material.setParameter(
        PbrShadingMaterialContent.OcclusionStrength,
        occlusionTexture.strength
      );
    }
  }

  // Metallic Factor
  let metallicFactor = pbrMetallicRoughness.metallicFactor;
  metallicFactor = metallicFactor ?? 1;
  let roughnessFactor = pbrMetallicRoughness.roughnessFactor;
  roughnessFactor = roughnessFactor ?? 1;
  material.setParameter(
    ShaderSemantics.MetallicRoughnessFactor,
    Vector2.fromCopyArray2([metallicFactor, roughnessFactor])
  );

  // Metallic roughness texture
  const metallicRoughnessTexture =
    pbrMetallicRoughness.metallicRoughnessTexture;
  if (metallicRoughnessTexture != null) {
    const rnTexture = ModelConverter._createTexture(
      metallicRoughnessTexture.texture!,
      gltfModel
    );
    material.setTextureParameter(
      ShaderSemantics.MetallicRoughnessTexture,
      rnTexture
    );
    if (metallicRoughnessTexture.texCoord != null) {
      material.setParameter(
        PbrShadingMaterialContent.MetallicRoughnessTexcoordIndex,
        metallicRoughnessTexture.texCoord
      );
    }
  }

  // Metallic Roughness Texcoord Transform
  ModelConverter._setupTextureTransform(
    metallicRoughnessTexture!,
    material,
    PbrShadingMaterialContent.MetallicRoughnessTextureTransform,
    PbrShadingMaterialContent.MetallicRoughnessTextureRotation
  );
}

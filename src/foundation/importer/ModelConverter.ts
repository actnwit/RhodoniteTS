import { EntityRepository } from '../core/EntityRepository';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { Vector3 } from '../math/Vector3';
import { Quaternion } from '../math/Quaternion';
import { Matrix44 } from '../math/Matrix44';
import { Primitive } from '../geometry/Primitive';
import { Buffer } from '../memory/Buffer';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import {
  VertexAttribute,
  VertexAttributeSemanticsJoinedString,
} from '../definitions/VertexAttribute';
import { CameraType } from '../definitions/CameraType';
import { Texture } from '../textures/Texture';
import { Vector4 } from '../math/Vector4';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { AnimationInterpolation } from '../definitions/AnimationInterpolation';
import { MathUtil } from '../math/MathUtil';
import { SkeletalComponent } from '../components/Skeletal/SkeletalComponent';
import { AlphaMode } from '../definitions/AlphaMode';
import { MaterialHelper } from '../helpers/MaterialHelper';
import {
  ShaderSemantics,
  ShaderSemanticsEnum,
  ShaderSemanticsName,
} from '../definitions/ShaderSemantics';
import { Vector2 } from '../math/Vector2';
import { Material } from '../materials/core/Material';
import { ShadingModel } from '../definitions/ShadingModel';
import { Accessor } from '../memory/Accessor';
import { Mesh } from '../geometry/Mesh';
import { MutableVector4 } from '../math/MutableVector4';
import { LightType } from '../definitions/LightType';
import {
  Count,
  Byte,
  Size,
  Index,
  TypedArray,
  TypedArrayConstructor,
  Array4,
  VectorComponentN,
  Array3,
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
  RnM2Animation,
  RnM2AnimationChannel,
  RnM2AnimationSampler,
  RnM2TextureSampler,
} from '../../types/RnM2';
import { Config } from '../core/Config';
import { BufferUse } from '../definitions/BufferUse';
import { MemoryManager } from '../core/MemoryManager';
import { ILoaderExtension } from './ILoaderExtension';
import { Scalar } from '../math/Scalar';
import { TextureParameter } from '../definitions/TextureParameter';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { Is } from '../misc/Is';
import { DataUtil } from '../misc/DataUtil';
import { AnimationPathName, AnimationSampler, AnimationTrackName } from '../../types/AnimationTypes';
import { GltfLoadOption, KHR_lights_punctual_Light, TagGltf2NodeIndex } from '../../types/glTF2';
import {
  IAnimationEntity,
  ICameraEntity,
  ISceneGraphEntity,
  ILightEntity,
  IMeshEntity,
} from '../helpers/EntityHelper';
import { BlendShapeComponent } from '../components/BlendShape/BlendShapeComponent';
import { LightComponent } from '../components/Light/LightComponent';
import { IBlendShapeEntityMethods } from '../components/BlendShape/IBlendShapeEntity';
import { BufferView } from '../memory/BufferView';
import { RhodoniteImportExtension } from './RhodoniteImportExtension';
import { Vrm0xMaterialProperty } from '../../types/VRM0x';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { Sampler } from '../textures/Sampler';
import { AnimationStateComponent } from '../components/AnimationState/AnimationStateComponent';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { createLightEntity } from '../components/Light/createLightEntity';
import { createCameraEntity } from '../components/Camera/createCameraEntity';
import { Logger } from '../misc/Logger';
import { Vrm1_Material } from '../../types/VRM1';
import { AnimatedVector3 } from '../math/AnimatedVector3';
import { AnimatedQuaternion } from '../math/AnimatedQuaternion';
import { AnimatedScalar } from '../math/AnimatedScalar';
import { AnimatedVector4 } from '../math/AnimatedVector4';
import { IAnimatedValue } from '../math/IAnimatedValue';
import { AnimatedVector2 } from '../math/AnimatedVector2';
import { MutableVector2 } from '../math/MutableVector2';
import { AnimatedVectorN } from '../math/AnimatedVectorN';

declare let DracoDecoderModule: any;

/**
 * A converter class from glTF2 model to Rhodonite Native data
 */
export class ModelConverter {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private static __generateGroupEntity(gltfModel: RnM2): ISceneGraphEntity {
    const entity = createGroupEntity();
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
    const entity = createMeshEntity();
    this.addTags(entity, gltfModel);
    return entity;
  }

  private static __generateCameraEntity(gltfModel: RnM2): ICameraEntity {
    const entity = createCameraEntity();
    this.addTags(entity, gltfModel);
    return entity;
  }

  private static __generateLightEntity(gltfModel: RnM2): ILightEntity {
    const entity = createLightEntity();
    this.addTags(entity, gltfModel);
    return entity;
  }

  private static __setupMaterials(gltfModel: RnM2, rnTextures: Texture[], rnSamplers: Sampler[]) {
    const rnMaterials: Material[] = [];
    if (gltfModel.materials != null) {
      for (const material of gltfModel.materials) {
        const rnMaterial = this.__setupMaterial(gltfModel, rnTextures, rnSamplers, material);
        rnMaterials.push(rnMaterial);
      }
    }
    return rnMaterials;
  }

  private static __setupTextures(gltfModel: RnM2) {
    const rnTextures: Texture[] = [];
    if (gltfModel.images != null) {
      for (const image of gltfModel.images) {
        const rnTexture = this._createTexture(image, gltfModel);
        rnTextures.push(rnTexture);
      }
    }
    return rnTextures;
  }

  private static __createSamplers(gltfModel: RnM2) {
    const rnSamplers: Sampler[] = [];
    if (gltfModel.samplers != null) {
      for (const sampler of gltfModel.samplers) {
        const rnSampler = this._createSampler(sampler);
        rnSamplers.push(rnSampler);
      }
    }
    return rnSamplers;
  }

  static convertToRhodoniteObject(gltfModel: RnM2) {
    (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx = [];

    const rnBuffers = this.__createRnBuffer(gltfModel);
    gltfModel.asset.extras!.rnMaterials = {};

    const rnTextures = this.__setupTextures(gltfModel);
    const rnSamplers = this.__createSamplers(gltfModel);

    // Materials
    const rnMaterials = this.__setupMaterials(gltfModel, rnTextures, rnSamplers);

    // Mesh, Camera, Group, ...
    const { rnEntities, rnEntitiesByNames } = this.__setupObjects(
      gltfModel,
      rnBuffers,
      rnMaterials,
      rnTextures,
      rnSamplers
    );
    gltfModel.asset.extras!.rnEntities = rnEntities;

    // Transform
    this._setupTransform(gltfModel, rnEntities);

    const rootGroup = this.__generateGroupEntity(gltfModel);

    // Animation
    this._setupAnimation(gltfModel, rnEntities, rnBuffers, rootGroup, rnMaterials);

    // Skeleton
    this._setupSkeleton(gltfModel, rnEntities, rnBuffers);

    // Hierarchy
    this._setupHierarchy(gltfModel, rnEntities);

    rootGroup.tryToSetUniqueName('FileRoot', true);
    rootGroup.tryToSetTag({ tag: 'ObjectType', value: 'top' });
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
        options.loaderExtension.loadExtensionInfoAndSetToRootGroup(rootGroup, gltfModel);
      }
      if (options && options.expression) {
        options.expression.tryToSetTag({
          tag: 'gltfModel',
          value: gltfModel,
        });
      }
    }

    // rootGroup.allMeshes = rootGroup.searchElementsByType(M_Mesh);
    rootGroup.tryToSetTag({ tag: 'rnEntities', value: rnEntities });
    rootGroup.tryToSetTag({ tag: 'rnEntitiesByNames', value: rnEntitiesByNames });
    rootGroup.tryToSetTag({ tag: 'gltfModel', value: gltfModel });
    if (Is.not.exist(gltfModel.extras)) {
      (gltfModel as any).extras = {};
    }
    gltfModel.extras.rnEntities = rnEntities;
    gltfModel.extras.rnEntitiesByNames = rnEntitiesByNames;

    // Effekseer
    RhodoniteImportExtension.importEffect(gltfModel, rootGroup);

    // Billboard
    RhodoniteImportExtension.importBillboard(gltfModel, rnEntities);

    if (Is.exist(gltfModel.extensionsUsed)) {
      if (gltfModel.extensionsUsed.indexOf('VRMC_vrm') > 0) {
        // this.__generateVrmNormalizedSkeleton(gltfModel, rnEntities);
      }
    }

    return rootGroup;
  }

  private static __createRnBuffer(gltfModel: RnM2): Buffer[] {
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
        groupTransform.localPosition = Vector3.fromCopyArray([
          nodeJson.translation[0],
          nodeJson.translation[1],
          nodeJson.translation[2],
        ]);
      }
      if (nodeJson.scale) {
        groupTransform.localScale = Vector3.fromCopyArray([
          nodeJson.scale[0],
          nodeJson.scale[1],
          nodeJson.scale[2],
        ]);
      }
      if (nodeJson.rotation) {
        groupTransform.localRotation = Quaternion.fromCopy4(
          nodeJson.rotation[0],
          nodeJson.rotation[1],
          nodeJson.rotation[2],
          nodeJson.rotation[3]
        );
      }
      if (nodeJson.matrix) {
        groupTransform.localMatrix = Matrix44.fromCopyArrayColumnMajor(nodeJson.matrix);
      }
    }
  }

  static _setupHierarchy(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]) {
    const groupSceneComponents = rnEntities.map((group) => {
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
   * @internal
   */
  static _setupAnimation(
    gltfModel: RnM2,
    rnEntities: ISceneGraphEntity[],
    rnBuffers: Buffer[],
    rootGroup: ISceneGraphEntity,
    rnMaterials: Material[]
  ) {
    if (gltfModel.animations == null || gltfModel.animations.length === 0) {
      return;
    }

    const newRootGroup = EntityRepository.addComponentToEntity(AnimationStateComponent, rootGroup);

    for (const animation of gltfModel.animations) {
      for (const sampler of animation.samplers) {
        this._readBinaryFromAccessorAndSetItToAccessorExtras(sampler.inputObject!, rnBuffers);
        this._readBinaryFromAccessorAndSetItToAccessorExtras(sampler.outputObject!, rnBuffers);
      }
    }

    for (const animation of gltfModel.animations) {
      for (const channel of animation.channels) {
        if (Is.exist(channel.samplerObject)) {
          const samplerObject = channel.samplerObject;
          const animInputArray = samplerObject.inputObject!.extras!.typedDataArray!;
          const animOutputArray = samplerObject.outputObject!.extras!.typedDataArray!;
          const interpolation = samplerObject.interpolation ?? 'LINEAR';

          let animationAttributeType: AnimationPathName = 'undefined';
          if (channel.target.path === 'translation') {
            animationAttributeType = 'translate';
          } else if (channel.target.path === 'rotation') {
            animationAttributeType = 'quaternion';
          } else if (channel.target.path === 'pointer') {
            animationAttributeType = 'material';
          } else {
            animationAttributeType = channel.target.path as AnimationPathName;
          }

          if (channel.target.path === 'pointer') {
            ModelConverter.__setPointerAnimation(rnEntities, channel, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType, rnMaterials, gltfModel);
          } else {
            ModelConverter.__setNormalAnimation(rnEntities, channel, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType);
          }
        }
      }
    }
  }

  private static __setPointerAnimation(
    rnEntities: ISceneGraphEntity[],
    channel: RnM2AnimationChannel,
    samplerObject: RnM2AnimationSampler,
    animation: RnM2Animation,
    animInputArray: Float32Array,
    animOutputArray: Float32Array,
    interpolation: string,
    animationAttributeType: AnimationPathName,
    rnMaterials: Material[],
    gltfModel: RnM2
  ) {
    const pointer = channel.target.extensions!.KHR_animation_pointer.pointer as string;
    const matchNodes= pointer.match(/^\/nodes\/([0-9]+)\//);
    const matchMaterials = pointer.match(/^\/materials\/([0-9]+)\//);
    const matchLights = pointer.match(/^\/extensions\/KHR_lights_punctual\/lights\/([0-9]+)\//);
    if (matchMaterials) {
      ModelConverter.__setPointerAnimationMaterials(matchMaterials, rnMaterials, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType);
    } else if (matchNodes) {
      ModelConverter.__setPointerAnimationNodes(matchNodes, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType);
    } else if (matchLights) {
      ModelConverter.__setPointerAnimationLights(matchLights, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType, gltfModel);
    }
  }

  private static __setPointerAnimationLights(match: RegExpMatchArray, rnEntities: ISceneGraphEntity[], pointer: string, samplerObject: RnM2AnimationSampler, animation: RnM2Animation, animInputArray: Float32Array, animOutputArray: Float32Array, interpolation: string, animationAttributeType: AnimationPathName, gltfModel: RnM2) {
    const lightIndex = parseInt(match[1]);
    const nodes = gltfModel.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.extensions?.KHR_lights_punctual) {
        const lightIdx = node.extensions.KHR_lights_punctual.lightIndex;
        if (lightIdx === lightIndex) {
          const rnEntity = rnEntities[i];
          const lightComponent = rnEntity.tryToGetLight();
          if (Is.not.exist(lightComponent)) {
            throw new Error(`LightComponent not found: ${pointer}`);
          }
          const outputComponentN = samplerObject.outputObject!.extras!.componentN!;
          const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
          const trackName = Is.exist(animation.name) ? animation.name : 'Untitled_Animation';
          const animationSampler = {
            input: animInputArray,
            output: animOutputArray,
            outputComponentN: outputComponentN as VectorComponentN,
            interpolationMethod: AnimationInterpolation.fromString(interpolation),
          };
          animationSamplers.set(trackName, animationSampler);

          let animatedValue: IAnimatedValue;
          if (outputComponentN === 1) {
            animatedValue = new AnimatedScalar(animationSamplers, trackName);
          } else if (outputComponentN === 2) {
            animatedValue = new AnimatedVector2(animationSamplers, trackName);
          } else if (outputComponentN === 3) {
            animatedValue = new AnimatedVector3(animationSamplers, trackName);
          } else if (outputComponentN === 4) {
            animatedValue = new AnimatedVector4(animationSamplers, trackName);
          } else {
            throw new Error(`Unsupported component number: ${outputComponentN}`);
          }

          let animationComponent = rnEntity.tryToGetAnimation();
          if (Is.not.exist(animationComponent)) {
            const newRnEntity = EntityRepository.addComponentToEntity(
              AnimationComponent,
              rnEntity
            );
            animationComponent = newRnEntity.getAnimation();
          }

          if (pointer.includes('color')) {
            animationComponent.setAnimation('light_color', animatedValue);
          } else if (pointer.includes('intensity')) {
            animationComponent.setAnimation('light_intensity', animatedValue);
          } else if (pointer.includes('range')) {
            animationComponent.setAnimation('light_range', animatedValue);
          } else if (pointer.includes('spot/innerConeAngle')) {
            animationComponent.setAnimation('light_spot_innerConeAngle', animatedValue);
          } else if (pointer.includes('spot/outerConeAngle')) {
            animationComponent.setAnimation('light_spot_outerConeAngle', animatedValue);
          }
        }
      }
    }
  }

  private static __setPointerAnimationNodes(match: RegExpMatchArray, rnEntities: ISceneGraphEntity[], pointer: string, samplerObject: RnM2AnimationSampler, animation: RnM2Animation, animInputArray: Float32Array, animOutputArray: Float32Array, interpolation: string, animationAttributeType: AnimationPathName) {
    const nodeIndex = parseInt(match[1]);
    const rnEntity = rnEntities[nodeIndex];
    if (Is.not.exist(rnEntity)) {
      throw new Error(`Node not found: ${pointer}`);
    }
    let outputComponentN = samplerObject.outputObject!.extras!.componentN!;
    if (pointer.includes('weights')) {
      const blendShapeComponent = rnEntity.tryToGetBlendShape();
      if (Is.exist(blendShapeComponent)) {
        outputComponentN = blendShapeComponent.weights.length;
      } else {
        throw new Error(`BlendShapeComponent not found: ${pointer}`);
      }
    }
    const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
    const trackName = Is.exist(animation.name) ? animation.name : 'Untitled_Animation';
    const animationSampler = {
      input: animInputArray,
      output: animOutputArray,
      outputComponentN: outputComponentN as VectorComponentN,
      interpolationMethod: AnimationInterpolation.fromString(interpolation),
    };
    animationSamplers.set(trackName, animationSampler);

    let animatedValue: IAnimatedValue;

    if (pointer.includes('weights')) {
      animatedValue = new AnimatedVectorN(animationSamplers, trackName);
    } else if (outputComponentN === 1) {
      animatedValue = new AnimatedScalar(animationSamplers, trackName);
    } else if (outputComponentN === 2) {
      animatedValue = new AnimatedVector2(animationSamplers, trackName);
    } else if (outputComponentN === 3) {
      animatedValue = new AnimatedVector3(animationSamplers, trackName);
    } else if (outputComponentN === 4) {
      animatedValue = new AnimatedVector4(animationSamplers, trackName);
    } else {
      throw new Error(`Unsupported component number: ${outputComponentN}`);
    }
    let animationComponent = rnEntity.tryToGetAnimation();
    if (Is.not.exist(animationComponent)) {
      const newRnEntity = EntityRepository.addComponentToEntity(
        AnimationComponent,
        rnEntity
      );
      animationComponent = newRnEntity.getAnimation();
    }
    animationComponent.setAnimation(animationAttributeType, animatedValue);
    if (pointer.includes('rotation')) {
      animationComponent.setAnimation('quaternion', animatedValue);
    } else if (pointer.includes('translation')) {
      animationComponent.setAnimation('translate', animatedValue);
    } else if (pointer.includes('scale')) {
      animationComponent.setAnimation('scale', animatedValue);
    } else if (pointer.includes('weights')) {
      animationComponent.setAnimation('weights', animatedValue);
    }
  }

  private static __setPointerAnimationMaterials(match: RegExpMatchArray, rnMaterials: Material[], pointer: string, samplerObject: RnM2AnimationSampler, animation: RnM2Animation, animInputArray: Float32Array, animOutputArray: Float32Array, interpolation: string, animationAttributeType: AnimationPathName) {
    const materialIndex = parseInt(match[1]);
    const material = rnMaterials[materialIndex];
    if (Is.not.exist(material)) {
      throw new Error(`Material not found: ${pointer}`);
    }
    const outputComponentN = samplerObject.outputObject!.extras!.componentN!;
    const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
    const trackName = Is.exist(animation.name) ? animation.name : 'Untitled_Animation';
    const animationSampler = {
      input: animInputArray,
      output: animOutputArray,
      outputComponentN: outputComponentN as VectorComponentN,
      interpolationMethod: AnimationInterpolation.fromString(interpolation),
    };
    animationSamplers.set(trackName, animationSampler);

    let animatedValue: IAnimatedValue;
    if (outputComponentN === 1) {
      animatedValue = new AnimatedScalar(animationSamplers, trackName);
    } else if (outputComponentN === 2) {
      animatedValue = new AnimatedVector2(animationSamplers, trackName);
    } else if (outputComponentN === 3) {
      animatedValue = new AnimatedVector3(animationSamplers, trackName);
    } else if (outputComponentN === 4) {
      animatedValue = new AnimatedVector4(animationSamplers, trackName);
    } else {
      throw new Error(`Unsupported component number: ${outputComponentN}`);
    }
    if (pointer.includes('KHR_texture_transform')) {
      const split = pointer.split('/');
      const textureName = split[split.length - 4];
      const transformType = split[split.length - 1];
      const capitalizedTransformType = transformType.charAt(0).toUpperCase() + transformType.slice(1);
      const shaderSemanticName = `${textureName}Transform${capitalizedTransformType}`;
      material.setParameter(shaderSemanticName, animatedValue);
    } else if (pointer.includes('normalTexture/scale')) {
      material.setParameter('normalScale', animatedValue);
    } else if (pointer.includes('occlusionTexture/strength')) {
      material.setParameter('occlusionStrength', animatedValue);
    } else {
      const shaderSemanticName = pointer.split('/').pop()!;
      material.setParameter(shaderSemanticName, animatedValue);
    }

    const primitives = material.getBelongPrimitives();
    for (const primitive of primitives.values()) {
      if (Is.exist(primitive.mesh)) {
        const mesh = primitive.mesh as Mesh;
        const meshEntities = mesh.meshEntitiesInner;
        for (const rnEntity of meshEntities) {
          let animationComponent = rnEntity.tryToGetAnimation();
          if (Is.not.exist(animationComponent)) {
            const newRnEntity = EntityRepository.addComponentToEntity(
              AnimationComponent,
              rnEntity
            );
            animationComponent = newRnEntity.getAnimation();
          }
          animationComponent.setAnimation(animationAttributeType, animatedValue);
        }
      }
    }
  }

  private static __setNormalAnimation(rnEntities: ISceneGraphEntity[], channel: RnM2AnimationChannel, samplerObject: RnM2AnimationSampler, animation: RnM2Animation, animInputArray: Float32Array, animOutputArray: Float32Array, interpolation: string, animationAttributeType: AnimationPathName) {
    const rnEntity = rnEntities[channel.target.node!] as IAnimationEntity;
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
        const outputComponentN = samplerObject.outputObject!.extras!.componentN!;
        const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
        const trackName = Is.exist(animation.name) ? animation.name : 'Untitled_Animation';
        const animationSampler = {
          input: animInputArray,
          output: animOutputArray,
          outputComponentN: outputComponentN as VectorComponentN,
          interpolationMethod: AnimationInterpolation.fromString(interpolation),
        };
        animationSamplers.set(trackName, animationSampler);
        const animatedValue = animationComponent.getAnimation(animationAttributeType);
        if (Is.exist(animatedValue)) {
          animatedValue.setAnimationSampler(trackName, animationSampler);
        } else {
          if (animationAttributeType === 'translate') {
            const newAnimatedValue = new AnimatedVector3(animationSamplers, trackName);
            animationComponent.setAnimation(
              animationAttributeType,
              newAnimatedValue
            );
          } else if (animationAttributeType === 'quaternion') {
            const newAnimatedValue = new AnimatedQuaternion(animationSamplers, trackName);
            animationComponent.setAnimation(
              animationAttributeType,
              newAnimatedValue
            );
          } else if (animationAttributeType === 'scale') {
            const newAnimatedValue = new AnimatedVector3(animationSamplers, trackName);
            animationComponent.setAnimation(
              animationAttributeType,
              newAnimatedValue
            );
          } else { // weight
            const newAnimatedValue = new AnimatedVectorN(animationSamplers, trackName);
            animationComponent.setAnimation(
              animationAttributeType,
              newAnimatedValue
            );
          }
        }
      }
    }
  }

  static _setupSkeleton(gltfModel: RnM2, rnEntities: ISceneGraphEntity[], rnBuffers: Buffer[]) {
    if (gltfModel.skins == null) {
      return;
    }

    for (const node_i in gltfModel.nodes) {
      const node = gltfModel.nodes[node_i];
      const sg = rnEntities[node_i].getSceneGraph()!;
      let skeletalComponent: SkeletalComponent;
      if (Is.exist(node.skinObject)) {
        const rnEntity = rnEntities[node_i];
        const newRnEntity = EntityRepository.addComponentToEntity(SkeletalComponent, rnEntity);
        skeletalComponent = newRnEntity.getSkeletal();
        if (Is.exist(node.skinObject.bindShapeMatrix)) {
          skeletalComponent._bindShapeMatrix = Matrix44.fromCopyArrayColumnMajor(
            node.skinObject.bindShapeMatrix
          );
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

        const inverseBindMatAccessor = node.skinObject.inverseBindMatricesObject;
        if (Is.exist(inverseBindMatAccessor)) {
          const rnBufferOfInverseBindMatAccessor = this.__getRnBufferViewAndRnAccessor(
            inverseBindMatAccessor,
            rnBuffers
          );
          skeletalComponent!.setInverseBindMatricesAccessor(rnBufferOfInverseBindMatAccessor);
        }
      }
    }
  }

  private static __setupObjects(gltfModel: RnM2, rnBuffers: Buffer[], rnMaterials: Material[], rnTextures: Texture[], rnSamplers: Sampler[]) {
    const rnEntities: ISceneGraphEntity[] = [];
    const rnEntitiesByNames: Map<string, ISceneGraphEntity> = new Map();

    for (const node_i in gltfModel.nodes) {
      const node = gltfModel.nodes[parseInt(node_i)] as RnM2Node;
      let entity: ISceneGraphEntity;
      if (node.mesh != null) {
        const meshIdx = node.mesh;
        const meshEntity = this.__setupMesh(
          node.meshObject!,
          meshIdx,
          rnBuffers,
          gltfModel,
          rnMaterials,
          rnTextures,
          rnSamplers
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
        const lightEntity = this.__setupLight(node.extensions.KHR_lights_punctual.light, gltfModel);
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
        } else {
          let targetNum = 0;
          // get maximum target num
          for (const primitive of node.meshObject!.primitives) {
            if (Is.exist(primitive.targets)) {
              if (primitive.targets.length > targetNum) {
                targetNum = primitive.targets.length;
              }
            }
          }
          weights = new Array(targetNum).fill(0);
        }
        entity = EntityRepository.addComponentToEntity(BlendShapeComponent, entity);
        const blendShapeComponent = (entity as unknown as IBlendShapeEntityMethods).getBlendShape();
        blendShapeComponent.weights = weights;
        if (node.meshObject?.primitives[0].extras?.targetNames) {
          blendShapeComponent.targetNames = node.meshObject.primitives[0].extras.targetNames;
        }
      }
      entity.tryToSetTag({ tag: TagGltf2NodeIndex, value: node_i });

      rnEntities.push(entity);
      rnEntitiesByNames.set(node.name!, entity);
    }

    return { rnEntities, rnEntitiesByNames };
  }

  private static __isMorphing(node: RnM2Node, gltfModel: RnM2) {
    const argument =
      gltfModel.asset.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray![0];
    if (argument?.isMorphing === false) {
      return false;
    } else {
      return node.meshObject?.primitives[0].targets != null;
    }
  }

  private static __setupLight(light: KHR_lights_punctual_Light, gltfModel: RnM2): ILightEntity {
    const lightEntity = this.__generateLightEntity(gltfModel);
    const lightComponent = lightEntity.getComponent(LightComponent)! as LightComponent;
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
      lightComponent.color = color;
      lightComponent.intensity = intensity;
      if (light.range != null) {
        lightComponent.range = light.range;
      }
      if (light.type === 'spot') {
        if (light.spot?.innerConeAngle != null) {
          lightComponent.innerConeAngle = light.spot.innerConeAngle;
        }
        if (light.spot?.outerConeAngle != null) {
          lightComponent.outerConeAngle = light.spot.outerConeAngle;
        }
      }
    }
    return lightEntity as ILightEntity;
  }

  private static __setupCamera(camera: RnM2Camera, gltfModel: RnM2): ICameraEntity {
    const cameraEntity = this.__generateCameraEntity(gltfModel);
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.direction = Vector3.fromCopyArray([0, 0, -1]);
    if (gltfModel.asset && (gltfModel.asset as any).LastSaved_ApplicationVendor) {
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
      cameraComponent.zFar = camera.perspective!.zfar ? camera.perspective!.zfar : 100000;
      cameraComponent.tryToSetTag({
        tag: 'OriginalFovY',
        value: cameraComponent.fovy,
      });
    } else if (cameraComponent.type === CameraType.Orthographic) {
      cameraComponent.xMag = camera.orthographic!.xmag;
      cameraComponent.yMag = camera.orthographic!.ymag;
      cameraComponent.zNear = camera.orthographic!.znear;
      cameraComponent.zFar = camera.orthographic!.zfar;
      cameraComponent.tryToSetTag({
        tag: 'OriginalXMag',
        value: cameraComponent.xMag,
      });
      cameraComponent.tryToSetTag({
        tag: 'OriginalYMag',
        value: cameraComponent.yMag,
      });
    }
    cameraComponent.tryToSetTag({
      tag: 'OriginalAspect',
      value: cameraComponent.aspect,
    });
    return cameraEntity as ICameraEntity;
  }

  private static __setupMesh(
    mesh: RnM2Mesh,
    meshIndex: Index,
    rnBuffers: Buffer[],
    gltfModel: RnM2,
    rnMaterials: Material[],
    rnTextures: Texture[],
    rnSamplers: Sampler[]
  ) {
    const meshEntity = this.__generateMeshEntity(gltfModel);
    const existingRnMesh = (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx[
      meshIndex
    ]?.deref() as Mesh | undefined;
    let rnPrimitiveMode = PrimitiveMode.Triangles;
    const meshComponent = meshEntity.getMesh();

    if (existingRnMesh != null) {
      meshComponent.setMesh(existingRnMesh);
    } else {
      const rnMesh = new Mesh();
      // set flag to rnMesh with options
      const rnLoaderOptions = gltfModel.asset.extras!.rnLoaderOptions;
      if (rnLoaderOptions?.tangentCalculationMode != null) {
        rnMesh.tangentCalculationMode = rnLoaderOptions.tangentCalculationMode;
      }

      const setupMaterialVariants = (rnPrimitive: Primitive, primitive: RnM2Primitive) => {
        const materialVariants = primitive.materialVariants;
        if (Is.not.exist(materialVariants)) {
          return;
        }
        for (const materialVariant of materialVariants) {
          const material = rnMaterials[materialVariant.material];

          for (const variantName of materialVariant.variants) {
            rnPrimitive.setMaterialVariant(variantName, material);
          }
        }
      };

      for (const i in mesh.primitives) {
        const primitive = mesh.primitives[i] as RnM2Primitive;
        if (primitive.mode != null) {
          rnPrimitiveMode = PrimitiveMode.from(primitive.mode)!;
        }

        const rnPrimitive = new Primitive();

        const rnMaterial =
          primitive.material != null
            ? rnMaterials[primitive.material]
            : this.__setupMaterial(gltfModel, rnTextures, rnSamplers);
        setupMaterialVariants(rnPrimitive, primitive);

        if (rnMaterial.materialTypeName.indexOf('MToon') !== -1) {
          const VRMProperties = gltfModel.extensions.VRM;
          if (VRMProperties?.rnExtension != null) {
            const rnExtension = VRMProperties.rnExtension;
            const renderPassOutline = rnExtension.renderPassOutline;
            const outlineMaterial = primitive.materialObject?.extras?.outlineMaterial?.deref();
            if (outlineMaterial != null) {
              renderPassOutline.setMaterialForPrimitive(outlineMaterial, rnPrimitive);
              rnPrimitive.setMaterialVariant('outline', outlineMaterial); // To attach an outlineMaterial reference to the primitive
            }
          }
        }

        // indices
        let indicesRnAccessor;
        const map: Map<VertexAttributeSemanticsJoinedString, Accessor> = new Map();
        if (primitive.extensions?.KHR_draco_mesh_compression) {
          indicesRnAccessor = this.__decodeDraco(primitive, rnBuffers, gltfModel, map);

          if (Is.not.exist(indicesRnAccessor)) {
            break;
          }
        } else {
          // indices
          if (Is.exist(primitive.indices)) {
            indicesRnAccessor = this.__getRnBufferViewAndRnAccessor(
              primitive.indicesObject!,
              rnBuffers
            );
          }

          // attributes
          const rnBufferViewMap: Map<number, BufferView> = new Map();
          for (const attributeName in primitive.attributesObjects!) {
            const rnm2attribute = primitive.attributesObjects[attributeName]!;
            const rnBuffer = rnBuffers[rnm2attribute.bufferViewObject!.buffer!];
            let rnBufferView: BufferView | undefined;
            if (Is.exist(rnm2attribute.bufferView)) {
              rnBufferView = rnBufferViewMap.get(rnm2attribute.bufferView);
              if (Is.not.exist(rnBufferView)) {
                rnBufferView = this.__getRnBufferView(rnm2attribute.bufferViewObject!, rnBuffer);
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
            const attributeRnAccessor = this.__getRnAccessor(rnm2attribute, rnBufferView);

            const joinedString = VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
              VertexAttribute.fromString(rnm2attribute.extras!.attributeName)
            );
            map.set(joinedString, attributeRnAccessor);
          }
        }

        rnPrimitive.setData(map, rnPrimitiveMode, rnMaterial, indicesRnAccessor);

        // morph targets
        if (primitive.targets != null) {
          // set default number
          let maxMorphTargetNumber = Config.maxMorphTargetNumber;
          if (rnLoaderOptions?.maxMorphTargetNumber != null) {
            maxMorphTargetNumber = rnLoaderOptions.maxMorphTargetNumber;
          }

          const targets: Array<Map<VertexAttributeSemanticsJoinedString, Accessor>> = [];
          for (let i = 0; i < primitive.targetsObjects!.length; i++) {
            if (i >= maxMorphTargetNumber) {
              break;
            }

            const target = primitive.targetsObjects![i];
            const targetMap: Map<VertexAttributeSemanticsJoinedString, Accessor> = new Map();
            for (const attributeName in target) {
              const attributeAccessor = target[attributeName];
              const attributeRnAccessor = this.__getRnBufferViewAndRnAccessor(
                attributeAccessor,
                rnBuffers
              );
              const attributeRnAccessorInGPUVertexData =
                this.__copyRnAccessorAndBufferView(attributeRnAccessor);
              const vertexAttribute = VertexAttribute.fromString(attributeName);
              const joinedString =
                VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(vertexAttribute);
              targetMap.set(joinedString, attributeRnAccessorInGPUVertexData);
            }
            targets.push(targetMap);
          }

          rnPrimitive.setBlendShapeTargets(targets);
        }
        rnMesh.addPrimitive(rnPrimitive);
      }

      meshComponent.setMesh(rnMesh);
      (gltfModel.asset.extras as any).rnMeshesAtGltMeshIdx[meshIndex] = new WeakRef(rnMesh);
    }

    return meshEntity;
  }

  static setSparseAccessor(accessor: RnM2Accessor, rnAccessor: Accessor): void {
    const count = accessor.sparse!.count;

    // get sparse indices
    const sparseIndices = accessor.sparse!.indices!;
    const indicesBufferView = sparseIndices.bufferViewObject;
    let buffer: Uint8Array = sparseIndices.bufferViewObject.bufferObject!.buffer!;
    const byteOffsetBufferViewAndSparseIndices: number =
      (indicesBufferView.byteOffset ?? 0) + (sparseIndices.byteOffset ?? 0);

    const componentBytesIndices = this._checkBytesPerComponent(sparseIndices);
    const byteLengthIndices = componentBytesIndices * count; // index is scalar
    const dataViewIndices: any = new DataView(
      buffer.buffer,
      byteOffsetBufferViewAndSparseIndices + buffer.byteOffset,
      byteLengthIndices
    );

    const dataViewMethodIndices = this._checkDataViewMethod(sparseIndices);

    // get sparse values
    const sparseValues = accessor.sparse!.values!;
    const valueBufferView = sparseValues.bufferViewObject;
    buffer = sparseValues.bufferViewObject.bufferObject!.buffer!;
    const byteOffsetBufferViewAndAccessorValues: number =
      (valueBufferView.byteOffset ?? 0) + (sparseValues.byteOffset ?? 0);

    const componentBytesValues = this._checkBytesPerComponent(accessor);
    const componentNValues = this._checkComponentNumber(accessor);
    const byteLengthValues = componentBytesValues * componentNValues * count;
    const dataViewValues: any = new DataView(
      buffer.buffer,
      byteOffsetBufferViewAndAccessorValues + buffer.byteOffset,
      byteLengthValues
    );
    const dataViewMethodValues = this._checkDataViewMethod(accessor);

    // set sparse values to rnAccessor
    const typedArray = rnAccessor.getTypedArray();
    const littleEndian = true;
    for (let i = 0; i < count; i++) {
      const index = dataViewIndices[dataViewMethodIndices](componentBytesIndices * i, littleEndian);
      for (let j = 0; j < componentNValues; j++) {
        const value = dataViewValues[dataViewMethodValues](
          componentBytesValues * componentNValues * i + componentBytesValues * j,
          littleEndian
        );
        typedArray[index * componentNValues + j] = value;
      }
    }
  }

  private static __setVRM1Material(
    gltfModel: RnM2,
    materialJson: Vrm1_Material,
    rnLoaderOptions: GltfLoadOption
  ): Material | undefined {
    const VRMProperties = gltfModel.extensions.VRM;

    const VRMC_materials_mtoon = materialJson.extensions?.VRMC_materials_mtoon;
    if (VRMC_materials_mtoon != null) {
      // argument
      const defaultMaterialHelperArgument = rnLoaderOptions.defaultMaterialHelperArgumentArray![0];

      const additionalName = defaultMaterialHelperArgument.additionalName;
      const isMorphing = true; //this.__isMorphing(node, gltfModel);
      const isSkinning = true; // this.__isSkinning(node, gltfModel);
      const isLighting = this.__isLighting(gltfModel, materialJson);
      const useTangentAttribute = true; // this.__useTangentAttribute(gltfModel, primitive);
      const textures = defaultMaterialHelperArgument.textures;
      const samplers = defaultMaterialHelperArgument.samplers;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber = defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this.__makeOutputSrgb(gltfModel);

      // outline
      let renderPassOutline;
      if (Is.exist(VRMProperties?.rnExtension)) {
        const rnExtension = VRMProperties.rnExtension;
        renderPassOutline = rnExtension.renderPassOutline;
        renderPassOutline.isVrRendering = true;
        renderPassOutline.tryToSetUniqueName('VRM Outline RenderPass', true);
      }

      //exist outline
      if (renderPassOutline != null) {
        let outlineMaterial: Material | undefined;
        if (VRMC_materials_mtoon.outlineWidthMode !== 'none') {
          outlineMaterial = MaterialHelper.createMToon1Material({
            additionalName,
            isMorphing,
            isSkinning,
            isLighting,
            useTangentAttribute,
            isOutline: true,
            materialJson,
            textures,
            samplers,
            debugMode,
            maxInstancesNumber,
            makeOutputSrgb,
          });
        }

        if (Is.exist(outlineMaterial)) {
          materialJson.extras!.outlineMaterial = new WeakRef(outlineMaterial);
        }
      }

      const material = MaterialHelper.createMToon1Material({
        additionalName,
        isMorphing,
        isSkinning,
        isLighting,
        useTangentAttribute,
        isOutline: false,
        materialJson,
        textures,
        samplers,
        debugMode,
        maxInstancesNumber,
        makeOutputSrgb,
      });

      // ModelConverter.setMToonTextures(textures, materialProperties, material, samplers);

      // disable unlit
      (materialJson.extensions as any).KHR_materials_unlit = undefined;

      return material;
    }

    // use another material
    return undefined;
  }

  private static setMToonTextures(
    textures: any,
    materialProperties: Vrm0xMaterialProperty,
    material: Material,
    samplers: any
  ) {
    const litColorTexture = textures[materialProperties.textureProperties._MainTex];
    if (litColorTexture != null) {
      material.setTextureParameter(
        'litColorTexture',
        litColorTexture,
        samplers[materialProperties.textureProperties._MainTex]
      );
    }
    const shadeColorTexture = textures[materialProperties.textureProperties._ShadeTexture];
    if (shadeColorTexture != null) {
      material.setTextureParameter(
        'shadeColorTexture',
        shadeColorTexture,
        samplers[materialProperties.textureProperties._ShadeTexture]
      );
    }
    const receiveShadowTexture =
      textures[materialProperties.textureProperties._ReceiveShadowTexture];
    if (receiveShadowTexture != null) {
      material.setTextureParameter(
        'receiveShadowTexture',
        receiveShadowTexture,
        samplers[materialProperties.textureProperties._ReceiveShadowTexture]
      );
    }
    const shadingGradeTexture = textures[materialProperties.textureProperties._ShadingGradeTexture];
    if (shadingGradeTexture != null) {
      material.setTextureParameter(
        'shadingGradeTexture',
        shadingGradeTexture,
        samplers[materialProperties.textureProperties._ShadingGradeTexture]
      );
    }
    const rimTexture = textures[materialProperties.textureProperties._RimTexture];
    if (rimTexture != null) {
      material.setTextureParameter(
        'rimTexture',
        rimTexture,
        samplers[materialProperties.textureProperties._RimTexture]
      );
    }
    const matCapTexture = textures[materialProperties.textureProperties._SphereAdd];
    if (matCapTexture != null) {
      material.setTextureParameter(
        'matCapTexture',
        matCapTexture,
        samplers[materialProperties.textureProperties._SphereAdd]
      );
    }
    const emissionTexture = textures[materialProperties.textureProperties._EmissionMap];
    if (emissionTexture != null) {
      material.setTextureParameter(
        'emissionTexture',
        emissionTexture,
        samplers[materialProperties.textureProperties._EmissionMap]
      );
    }
    const normalTexture = textures[materialProperties.textureProperties._BumpMap];
    if (normalTexture != null) {
      material.setTextureParameter(
        'normalTexture',
        normalTexture,
        samplers[materialProperties.textureProperties._BumpMap]
      );
    }
    const outlineWidthTexture = textures[materialProperties.textureProperties._OutlineWidthTexture];
    if (outlineWidthTexture != null) {
      material.setTextureParameter(
        'outlineWidthTexture',
        outlineWidthTexture,
        samplers[materialProperties.textureProperties._OutlineWidthTexture]
      );
    }
    const uvAnimationMaskTexture =
      textures[materialProperties.textureProperties._UvAnimMaskTexture];
    if (uvAnimationMaskTexture != null) {
      material.setTextureParameter(
        'uvAnimationMaskTexture',
        uvAnimationMaskTexture,
        samplers[materialProperties.textureProperties._UvAnimMaskTexture]
      );
    }
  }

  private static __setVRM0xMaterial(
    gltfModel: RnM2,
    // primitive: RnM2Primitive,
    materialJson: RnM2Material,
    rnLoaderOptions: GltfLoadOption
  ): Material | undefined {
    const VRMProperties = gltfModel.extensions.VRM;

    const materialProperties = materialJson.extras!.vrm0xMaterialProperty as Vrm0xMaterialProperty;
    const shaderName = materialProperties.shader;
    if (shaderName === 'VRM/MToon') {
      // argument
      const defaultMaterialHelperArgument = rnLoaderOptions.defaultMaterialHelperArgumentArray![0];

      const additionalName = defaultMaterialHelperArgument.additionalName;
      const isMorphing = true; //this.__isMorphing(node, gltfModel);
      const isSkinning = true; //this.__isSkinning(node, gltfModel);
      const isLighting = this.__isLighting(gltfModel, materialJson);
      const useTangentAttribute = true;
      const textures = defaultMaterialHelperArgument.textures;
      const samplers = defaultMaterialHelperArgument.samplers;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber = defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this.__makeOutputSrgb(gltfModel);

      // outline
      let renderPassOutline;
      if (Is.exist(VRMProperties?.rnExtension)) {
        const rnExtension = VRMProperties.rnExtension;
        renderPassOutline = rnExtension.renderPassOutline;
        renderPassOutline.isVrRendering = true;
        renderPassOutline.tryToSetUniqueName('VRM Outline RenderPass', true);
      }

      //exist outline
      if (renderPassOutline != null) {
        let outlineMaterial: Material | undefined;
        if (materialProperties.floatProperties._OutlineWidthMode !== 0) {
          outlineMaterial = MaterialHelper.createMToon0xMaterial({
            additionalName,
            isMorphing,
            isSkinning,
            isLighting,
            useTangentAttribute,
            isOutline: true,
            materialProperties,
            textures,
            samplers,
            debugMode,
            maxInstancesNumber,
            makeOutputSrgb,
          });
        }

        if (Is.exist(outlineMaterial)) {
          ModelConverter.setMToonTextures(textures, materialProperties, outlineMaterial, samplers);
          materialJson.extras!.outlineMaterial = new WeakRef(outlineMaterial);
        }
      }

      const material = MaterialHelper.createMToon0xMaterial({
        additionalName,
        isMorphing,
        isSkinning,
        isLighting,
        useTangentAttribute,
        isOutline: false,
        materialProperties,
        textures,
        samplers,
        debugMode,
        maxInstancesNumber,
        makeOutputSrgb,
      });

      ModelConverter.setMToonTextures(textures, materialProperties, material, samplers);

      return material;
    }

    // use another material
    return undefined;
  }

  private static __generateAppropriateMaterial(
    gltfModel: RnM2,
    materialJson?: RnM2Material
  ): Material {
    const isTranslucent = Is.exist(materialJson?.extensions?.KHR_materials_transmission);
    // if rnLoaderOptions is set something, do special deal
    if (gltfModel.asset.extras?.rnLoaderOptions != null) {
      const rnLoaderOptions = gltfModel.asset.extras.rnLoaderOptions;

      // For specified loader extension
      if (
        rnLoaderOptions.loaderExtension?.isNeededToUseThisMaterial != null &&
        rnLoaderOptions.loaderExtension.isNeededToUseThisMaterial(gltfModel)
      ) {
        const loaderExtension = gltfModel.asset.extras?.rnLoaderOptions?.loaderExtension;
        if (loaderExtension?.generateMaterial != null) {
          return loaderExtension.generateMaterial(materialJson!);
        }
      }

      // For VRM0x
      if (rnLoaderOptions.__isImportVRM0x) {
        const material = this.__setVRM0xMaterial(gltfModel, materialJson!, rnLoaderOptions);
        if (Is.exist(material)) {
          material.isTranslucent = isTranslucent;
          return material;
        }
      }

      // For specified default material helper
      const materialHelperName = rnLoaderOptions.defaultMaterialHelperName;
      if (materialHelperName != null) {
        return (MaterialHelper as any)[materialHelperName](
          ...rnLoaderOptions.defaultMaterialHelperArgumentArray!
        );
      }
    }

    // pre data
    const isMorphing = true; // this.__isMorphing(node, gltfModel);
    const isSkinning = true; //this.__isSkinning(node, gltfModel);
    const isLighting = this.__isLighting(gltfModel, materialJson);
    const additionalName = '';

    if (Is.exist(materialJson)) {
      if (materialJson.extensions?.VRMC_materials_mtoon != null) {
        const rnLoaderOptions = gltfModel.asset.extras!.rnLoaderOptions!;
        const material = this.__setVRM1Material(
          gltfModel,
          materialJson as Vrm1_Material,
          rnLoaderOptions
        );
        if (Is.exist(material)) {
          material.isTranslucent = isTranslucent;
          return material;
        }
      }
    }

    const maxMaterialInstanceNumber: number = Config.maxMaterialInstanceForEachType;
    if (parseFloat(gltfModel.asset?.version) >= 2) {
      const rnLoaderOptions = gltfModel.asset.extras?.rnLoaderOptions ?? {};
      // For glTF 2
      const useTangentAttribute = true; //this.__useTangentAttribute(gltfModel, primitive);
      const useNormalTexture = this.__useNormalTexture(gltfModel);
      const material = MaterialHelper.createPbrUberMaterial({
        isMorphing,
        isSkinning,
        isLighting,
        isClearCoat: Is.exist(materialJson?.extensions?.KHR_materials_clearcoat),
        isTransmission: Is.exist(materialJson?.extensions?.KHR_materials_transmission),
        isVolume: Is.exist(materialJson?.extensions?.KHR_materials_volume),
        isSheen: Is.exist(materialJson?.extensions?.KHR_materials_sheen),
        isSpecular: Is.exist(materialJson?.extensions?.KHR_materials_specular),
        isIridescence: Is.exist(materialJson?.extensions?.KHR_materials_iridescence),
        isAnisotropy: Is.exist(materialJson?.extensions?.KHR_materials_anisotropy),
        isDispersion: Is.exist(materialJson?.extensions?.KHR_materials_dispersion),
        isEmissiveStrength: Is.exist(materialJson?.extensions?.KHR_materials_emissive_strength),
        isDiffuseTransmission: Is.exist(materialJson?.extensions?.KHR_materials_diffuse_transmission),
        isShadow: rnLoaderOptions.shadow ? true : false,
        useTangentAttribute,
        useNormalTexture,
        additionalName: additionalName,
        maxInstancesNumber: maxMaterialInstanceNumber,
      });
      const makeOutputSrgb = this.__makeOutputSrgb(gltfModel);
      if (Is.exist(makeOutputSrgb)) {
        material.setParameter('makeOutputSrgb', makeOutputSrgb);
      }
      material.isTranslucent = isTranslucent;
      return material;
    } else {
      // For glTF 1
      const material = MaterialHelper.createClassicUberMaterial({
        isSkinning,
        isLighting,
        additionalName: additionalName,
        maxInstancesNumber: maxMaterialInstanceNumber,
      });
      material.isTranslucent = isTranslucent;
      return material;
    }
  }

  private static __isLighting(gltfModel: RnM2, materialJson?: RnM2Material) {
    const argument =
      gltfModel?.asset?.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray![0];
    if (argument?.isLighting != null) {
      return argument.isLighting as boolean;
    } else {
      return materialJson?.extensions?.KHR_materials_unlit != null ? false : true;
    }
  }

  // private static __isSkinning(node: RnM2Node, gltfModel: RnM2) {
  //   const argument =
  //     gltfModel?.asset?.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray![0];
  //   if (argument?.isSkinning === false) {
  //     return false;
  //   } else {
  //     return node.skin != null;
  //   }
  // }

  private static __useTangentAttribute(gltfModel: RnM2, primitive: RnM2Primitive) {
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
      gltfModel?.asset?.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray![0];
    if (argument?.useNormalTexture === false) {
      return false;
    } else {
      return gltfModel?.asset?.extras?.rnLoaderOptions?.tangentCalculationMode !== 0;
    }
  }

  private static __makeOutputSrgb(gltfModel: RnM2) {
    const argument =
      gltfModel?.asset?.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray![0];
    return argument?.makeOutputSrgb as boolean | undefined;
  }

  private static __setupMaterial(gltfModel: RnM2, rnTextures: Texture[], rnSamplers: Sampler[], materialJson?: RnM2Material): Material {
    const material: Material = this.__generateAppropriateMaterial(gltfModel, materialJson);
    if (materialJson == null) return material;

    ModelConverter.setParametersToMaterial(materialJson, gltfModel, material, rnTextures, rnSamplers, false);

    if (materialJson.extras?.outlineMaterial != null) {
      ModelConverter.setParametersToMaterial(
        materialJson,
        gltfModel,
        materialJson.extras.outlineMaterial.deref(),
        rnTextures,
        rnSamplers,
        true
      );
    }

    return material;
  }

  private static setParametersToMaterial(
    materialJson: RnM2Material,
    gltfModel: RnM2,
    material: Material,
    rnTextures: Texture[],
    rnSamplers: Sampler[],
    isOutline: boolean
  ) {
    const isUnlit = materialJson.extensions?.KHR_materials_unlit != null;
    const options = gltfModel.asset.extras!.rnLoaderOptions;
    const pbrMetallicRoughness = materialJson.pbrMetallicRoughness;
    if (pbrMetallicRoughness != null) {
      // BaseColor Factor
      setupPbrMetallicRoughness(pbrMetallicRoughness, material, gltfModel, options, materialJson, rnTextures, rnSamplers);
    } else {
      let param: Index = ShadingModel.Phong.index;
      if (materialJson?.extras?.technique) {
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
        material.setParameter('shadingModel', Scalar.fromCopyNumber(param));
      }
    }

    const emissiveFactor = isUnlit ? ([0, 0, 0] as Array3<number>) : materialJson.emissiveFactor;
    if (emissiveFactor != null) {
      material.setParameter('emissiveFactor', Vector3.fromCopyArray3(emissiveFactor));
    }

    const emissiveTexture = materialJson.emissiveTexture;
    if (emissiveTexture != null && Is.falsy(isUnlit)) {
      const rnTexture = rnTextures[emissiveTexture.texture!.source!];
      const rnSampler = rnSamplers[emissiveTexture.texture!.sampler!];
      material.setTextureParameter('emissiveTexture', rnTexture, rnSampler);
      if (parseFloat(gltfModel.asset?.version) >= 2 && emissiveTexture.texCoord != null) {
        material.setParameter('emissiveTexcoordIndex', emissiveTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        emissiveTexture!,
        material,
        'emissiveTextureTransformScale',
        'emissiveTextureTransformOffset',
        'emissiveTextureTransformRotation'
      );
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
        !gltfModel.asset.extras?.rnLoaderOptions?.__isImportVRM0x
      ) {
        material.setParameter(
          'alphaCutoff',
          Scalar.fromCopyNumber(materialJson.alphaCutoff ?? 0.5)
        );
      }
    }
    material.isTranslucent = Is.exist(materialJson.extensions?.KHR_materials_transmission);

    const doubleSided = materialJson.doubleSided;
    if (doubleSided != null && !isOutline) {
      material.cullFace = !doubleSided;
    }

    const normalTexture = materialJson.normalTexture;
    if (normalTexture != null && Is.falsy(isUnlit)) {
      const rnTexture = rnTextures[normalTexture.texture!.source!];
      const rnSampler = rnSamplers[normalTexture.texture!.sampler!];
      material.setTextureParameter('normalTexture', rnTexture, rnSampler);
      if (parseFloat(gltfModel.asset?.version) >= 2) {
        if (normalTexture.texCoord != null) {
          material.setParameter('normalTexcoordIndex', normalTexture.texCoord);
        }

        if (normalTexture.scale != null) {
          material.setParameter('normalScale', normalTexture.scale);
        }
      }
    }
    ModelConverter._setupTextureTransform(
      normalTexture!,
      material,
      'normalTextureTransformScale',
      'normalTextureTransformOffset',
      'normalTextureTransformRotation'
    );

    // For Extension
    if (this._checkRnGltfLoaderOptionsExist(gltfModel)) {
      const loaderExtension = gltfModel.asset.extras?.rnLoaderOptions?.loaderExtension;
      if (loaderExtension?.setupMaterial != null) {
        loaderExtension.setupMaterial(gltfModel, materialJson, material);
      }
    }

    if (materialJson.extensions?.VRMC_materials_mtoon != null) {
      setupMToon1(material, gltfModel, materialJson as Vrm1_Material, rnTextures, rnSamplers);
    }
  }

  static _createSampler(sampler: RnM2TextureSampler) {
    const rnSampler = new Sampler({
      magFilter: Is.exist(sampler.magFilter)
        ? TextureParameter.from(sampler.magFilter)
        : TextureParameter.Linear,
      minFilter: Is.exist(sampler.minFilter)
        ? TextureParameter.from(sampler.minFilter)
        : TextureParameter.Linear,
      wrapS: Is.exist(sampler.wrapS)
        ? TextureParameter.from(sampler.wrapS)
        : TextureParameter.Repeat,
      wrapT: Is.exist(sampler.wrapT)
        ? TextureParameter.from(sampler.wrapT)
        : TextureParameter.Repeat,
    });
    rnSampler.create();

    return rnSampler;
  }

  static _createTexture(
    image: RnM2Image,
    gltfModel: RnM2,
    { autoDetectTransparency = false } = {}
  ) {
    const options = gltfModel.asset.extras?.rnLoaderOptions;

    const rnTexture = new Texture();
    rnTexture.autoDetectTransparency = autoDetectTransparency;
    rnTexture.autoResize = options?.autoResizeTexture === true;

    if (image.image) {
      const imageElem = image.image as HTMLImageElement;
      rnTexture.generateTextureFromImage(imageElem);
      rnTexture.loadFromImgLazy();
    } else if (image.basis) {
      rnTexture.generateTextureFromBasis(image.basis, {});
    } else if (image.ktx2) {
      rnTexture.generateTextureFromKTX2(image.ktx2);
    }

    if (image.uri) {
      rnTexture.name = image.uri;
    } else {
      const ext = image.mimeType?.split('/')[1];
      rnTexture.name = image.name ?? 'Untitled' + `.${ext}`;
    }
    rnTexture.tryToSetUniqueName(rnTexture.name, true);

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

    return true;
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
    return new typedArrayClass(uint8Array.buffer, byteOffset + uint8Array.byteOffset, length);
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
    accessor: RnM2Accessor,
    rnBuffers?: Buffer[]
  ): Float32Array {
    const bufferView = accessor.bufferViewObject!;
    let byteOffsetFromBuffer: number = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const buffer = bufferView.bufferObject!;
    let uint8Array: Uint8Array = buffer.buffer!;

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

    if (Is.exist(rnBuffers)) {
      const rnBuffer = rnBuffers[accessor.bufferViewObject!.buffer!];
      const rnBufferView = this.__getRnBufferView(bufferView, rnBuffer);
      const rnAccessor = this.__getRnAccessor(accessor, rnBufferView);
      uint8Array = rnAccessor.getUint8Array();
      byteOffsetFromBuffer = 0;
    }

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
      float32Array = this.__normalizeTypedArrayToFloat32Array(dataViewMethod, typedDataArray);
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
            numberArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
            break;
          case 'VEC3':
            numberArray.push(dataView[dataViewMethod](pos, littleEndian));
            numberArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
            numberArray.push(dataView[dataViewMethod](pos + componentBytes * 2, littleEndian));
            break;
          case 'VEC4':
            for (let i = 0; i < 4; i++) {
              numberArray.push(dataView[dataViewMethod](pos + componentBytes * i, littleEndian));
            }
            break;
          case 'MAT4':
            for (let i = 0; i < 16; i++) {
              numberArray.push(dataView[dataViewMethod](pos + componentBytes * i, littleEndian));
            }
            break;
        }
      }
      float32Array = this.__normalizeTypedArrayToFloat32Array(dataViewMethod, numberArray);
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
      return DataUtil.normalizedInt8ArrayToFloat32Array(numberArray as unknown as Int8Array);
    } else if (dataViewMethod === 'getUint8') {
      return DataUtil.normalizedUint8ArrayToFloat32Array(numberArray as unknown as Uint8Array);
    } else if (dataViewMethod === 'getInt16') {
      return DataUtil.normalizedInt16ArrayToFloat32Array(numberArray as unknown as Int16Array);
    } else if (dataViewMethod === 'getUint16') {
      return DataUtil.normalizedUint16ArrayToFloat32Array(numberArray as unknown as Uint16Array);
    } else if (dataViewMethod === 'getInt32') {
      // typedDataArray = new Int32Array(numberArray);
      Logger.error('Not considered');
      return new Float32Array();
    } else if (dataViewMethod === 'getUint32') {
      // typedDataArray = new Uint32Array(numberArray);
      Logger.error('Not considered');
      return new Float32Array();
    } else if (dataViewMethod === 'getFloat32') {
      return new Float32Array(numberArray);
    } else {
      Logger.error('Not considered');
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
  private static __getRnAccessor(accessor: RnM2Accessor, rnBufferView?: BufferView) {
    let rnAccessor: Accessor;
    if (rnBufferView != null) {
      rnAccessor = rnBufferView
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
    } else {
      // if accessor.bufferView is not defined, the accessor MUST be initialized with zeros.
      // See: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_accessor_bufferview
      const rnBuffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.GPUVertexData);

      const compositionType = CompositionType.fromString(accessor.type);
      const componentType = ComponentType.from(accessor.componentType);

      const rnBufferView = rnBuffer
        .takeBufferView({
          byteLengthToNeed:
            accessor.count *
            compositionType.getNumberOfComponents() *
            componentType.getSizeInBytes(),
          byteStride: compositionType.getNumberOfComponents() * componentType.getSizeInBytes(),
        })
        .unwrapForce();

      rnAccessor = rnBufferView
        .takeAccessor({
          compositionType: compositionType,
          componentType: componentType,
          count: accessor.count,
          max: accessor.max,
          min: accessor.min,
          normalized: accessor.normalized,
        })
        .unwrapForce();
    }

    if (Is.exist(accessor.sparse)) {
      this.setSparseAccessor(accessor, rnAccessor);
    }
    return rnAccessor;
  }

  /**
   * Take a Rn.BufferView and a Rn.Accessor from the Rn.Buffer
   *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
   * @param accessor
   * @param rnBuffer
   * @returns
   */
  private static __getRnBufferViewAndRnAccessor(accessor: RnM2Accessor, rnBuffers: Buffer[]) {
    const gltfBufferView = accessor.bufferViewObject;
    let rnBufferView: BufferView | undefined;
    if (gltfBufferView != null) {
      const rnBuffer = rnBuffers[gltfBufferView.buffer!];
      rnBufferView = this.__getRnBufferView(gltfBufferView, rnBuffer);
    }
    const rnAccessor = this.__getRnAccessor(accessor, rnBufferView);
    return rnAccessor;
  }

  private static __copyRnAccessorAndBufferView(srcRnAccessor: Accessor) {
    const byteSize = srcRnAccessor.elementCount * 3 /* vec4 */ * 4; /* bytes */
    const dstRnBuffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.GPUVertexData);
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
    compositionNum: Count,
    rnBuffer: Buffer
  ) {
    const rnBufferView = rnBuffer
      .takeBufferView({
        byteLengthToNeed: accessor.count * compositionNum * 4,
        byteStride: 0,
      })
      .unwrapForce();

    const rnAccessor = this.__getRnAccessor(accessor, rnBufferView);
    return rnAccessor;
  }

  private static __getRnBufferView(rnm2bufferView: RnM2BufferView, rnBuffer: Buffer) {
    const rnBufferView = rnBuffer
      .takeBufferViewWithByteOffset({
        byteLengthToNeed: rnm2bufferView.byteLength,
        byteStride: rnm2bufferView.byteStride ?? 0,
        byteOffset: rnm2bufferView.byteOffset ?? 0,
      })
      .unwrapForce();

    return rnBufferView;
  }

  private static __getGeometryFromDracoBuffer(draco: any, decoder: any, arrayBuffer: ArrayBuffer) {
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
      Logger.error(errorMsg);
    }

    dracoGeometry.geometryType = geometryType; // store

    if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
      let errorMsg = 'Decoding failed: ';
      errorMsg += decodingStatus.error_msg();
      Logger.error(errorMsg);
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
      gltfModel.bufferViews[primitive.extensions.KHR_draco_mesh_compression.bufferView];
    const rnBufferView = this.__getRnBufferView(bufferView, rnBuffers[bufferView.buffer!]);
    const arraybufferOfBufferView = new Uint8Array(rnBufferView.getUint8Array()).buffer;

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
    const rnBufferForDraco = this.__createBufferForDecompressedData(primitive, numPoints);

    // decode indices
    const primitiveMode = PrimitiveMode.from(primitive.mode!);
    let isTriangleStrip = false;
    if (primitiveMode === PrimitiveMode.TriangleStrip) {
      isTriangleStrip = true;
    }

    const indices = this.__getIndicesFromDraco(draco, decoder, dracoGeometry, isTriangleStrip)!;
    const indicesRnAccessor = this.__takeRnBufferViewAndRnAccessorForDraco(
      primitive.indicesObject!,
      1,
      rnBufferForDraco
    );
    for (let i = 0; i < indices.length; i++) {
      indicesRnAccessor.setScalar(i, indices[i], {});
    }

    // decode attributes
    for (const attributeName in primitive.attributes) {
      const dracoAttributeId =
        primitive.extensions.KHR_draco_mesh_compression.attributes[attributeName];

      const attributeGltf2Accessor = primitive.attributesObjects![attributeName];
      let attributeRnAccessor: Accessor | undefined = undefined;

      if (Is.not.exist(dracoAttributeId)) {
        // non-encoded data

        attributeRnAccessor = this.__getRnBufferViewAndRnAccessor(
          attributeGltf2Accessor!,
          rnBuffers
        );
      } else {
        // encoded data

        const compositionNum = CompositionType.fromString(
          attributeGltf2Accessor!.type
        ).getNumberOfComponents();
        attributeRnAccessor = this.__takeRnBufferViewAndRnAccessorForDraco(
          attributeGltf2Accessor!,
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

      const joinedString = VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
        VertexAttribute.fromString(attributeGltf2Accessor!.extras!.attributeName)
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
    textureTransformScaleShaderSemantic: ShaderSemanticsName,
    textureTransformOffsetShaderSemantic: ShaderSemanticsName,
    textureTransformRotationShaderSemantic: ShaderSemanticsName
  ) {
    if (textureJson?.extensions?.KHR_texture_transform) {
      const transformScale = MutableVector2.fromCopyArray([1.0, 1.0]);
      const transformOffset = MutableVector2.fromCopyArray([0.0, 0.0]);
      let rotation = 0;

      const transformJson = textureJson.extensions.KHR_texture_transform;
      if (transformJson.scale != null) {
        transformScale.x = transformJson.scale[0];
        transformScale.y = transformJson.scale[1];
      }
      if (transformJson.offset != null) {
        transformOffset.x = transformJson.offset[0];
        transformOffset.y = transformJson.offset[1];
      }
      if (transformJson.rotation != null) {
        rotation = transformJson.rotation;
      }

      rnMaterial.setParameter(textureTransformScaleShaderSemantic, transformScale);
      rnMaterial.setParameter(textureTransformOffsetShaderSemantic, transformOffset);
      rnMaterial.setParameter(textureTransformRotationShaderSemantic, rotation);
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

    const drcAttributes = primitive.extensions.KHR_draco_mesh_compression.attributes;
    for (const attributeName in primitive.attributes) {
      if (drcAttributes[attributeName] == null) {
        // non-encoded data

        continue;
      }

      const accessor = primitive.attributesObjects![attributeName];
      const compositionNum = CompositionType.fromString(accessor!.type).getNumberOfComponents();
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

function setupMToon1(material: Material, gltfModel: RnM2, materialJson: Vrm1_Material, rnTextures: Texture[], rnSamplers: Sampler[]) {
  const mToon = materialJson.extensions.VRMC_materials_mtoon;

  {
    const shadeColorFactor = mToon.shadeColorFactor;
    material.setParameter('shadeColorFactor', Vector3.fromCopyArray3(shadeColorFactor));
  }

  {
    const shadeMultiplyTexture = mToon.shadeMultiplyTexture;
    if (shadeMultiplyTexture != null) {
      const rnTexture = rnTextures[shadeMultiplyTexture.texture!.source!];
      const rnSampler = rnSamplers[shadeMultiplyTexture.texture!.sampler!];
      material.setTextureParameter('shadeMultiplyTexture', rnTexture, rnSampler);
      if (shadeMultiplyTexture.texCoord != null) {
        material.setParameter('shadeMultiplyTexcoordIndex', shadeMultiplyTexture.texCoord);
      }
    }
  }

  {
    const shadingShiftFactor = mToon.shadingShiftFactor;
    if (shadingShiftFactor != null) {
      material.setParameter('shadingShiftFactor', shadingShiftFactor);
    }
  }
  {
    const shadingShiftTexture = mToon.shadingShiftTexture;
    if (shadingShiftTexture != null) {
      const rnTexture = rnTextures[shadingShiftTexture.texture!.source!];
      const rnSampler = rnSamplers[shadingShiftTexture.texture!.sampler!];
      material.setTextureParameter('shadingShiftTexture', rnTexture, rnSampler);
      if (shadingShiftTexture.texCoord != null) {
        material.setParameter('shadingShiftTexcoordIndex', shadingShiftTexture.texCoord);
      }
      const shadingShiftTextureScale = shadingShiftTexture.scale;
      if (shadingShiftTextureScale != null) {
        material.setParameter('shadingShiftTextureScale', shadingShiftTextureScale);
      }
    }
  }
  {
    const shadingToonyFactor = mToon.shadingToonyFactor;
    if (shadingToonyFactor != null) {
      material.setParameter('shadingToonyFactor', shadingToonyFactor);
    }
  }
  {
    const giEqualizationFactor = mToon.giEqualizationFactor;
    if (giEqualizationFactor != null) {
      material.setParameter('giEqualizationFactor', giEqualizationFactor);
    }
  }
  {
    const matcapTexture = mToon.matcapTexture;
    if (matcapTexture != null) {
      const rnTexture = rnTextures[matcapTexture.texture!.source!];
      const rnSampler = rnSamplers[matcapTexture.texture!.sampler!];
      material.setTextureParameter('matcapTexture', rnTexture, rnSampler);
      if (matcapTexture.texCoord != null) {
        material.setParameter('matcapTexcoordIndex', matcapTexture.texCoord);
      }
    }
  }
  {
    const matcapFactor = mToon.matcapFactor;
    if (matcapFactor != null) {
      material.setParameter('matcapFactor', Vector3.fromCopyArray3(matcapFactor));
    }
  }
  {
    const parametricRimColorFactor = mToon.parametricRimColorFactor;
    if (parametricRimColorFactor != null) {
      material.setParameter(
        'parametricRimColorFactor',
        Vector3.fromCopyArray3(parametricRimColorFactor)
      );
    }
  }
  {
    const parametricRimFresnelPowerFactor = mToon.parametricRimFresnelPowerFactor;
    if (parametricRimFresnelPowerFactor != null) {
      material.setParameter('parametricRimFresnelPowerFactor', parametricRimFresnelPowerFactor);
    }
  }
  {
    const parametricRimLiftFactor = mToon.parametricRimLiftFactor;
    if (parametricRimLiftFactor != null) {
      material.setParameter('parametricRimLiftFactor', parametricRimLiftFactor);
    }
  }
  {
    const rimMultiplyTexture = mToon.rimMultiplyTexture;
    if (rimMultiplyTexture != null) {
      const rnTexture = rnTextures[rimMultiplyTexture.texture!.source!];
      const rnSampler = rnSamplers[rimMultiplyTexture.texture!.sampler!];
      material.setTextureParameter('rimMultiplyTexture', rnTexture, rnSampler);
      if (rimMultiplyTexture.texCoord != null) {
        material.setParameter('rimMultiplyTexcoordIndex', rimMultiplyTexture.texCoord);
      }
    }
  }
  {
    const rimLightingMixFactor = mToon.rimLightingMixFactor;
    if (rimLightingMixFactor != null) {
      material.setParameter('rimLightingMixFactor', rimLightingMixFactor);
    }
  }
  {
    const outlineWidthMode = mToon.outlineWidthMode;
    if (outlineWidthMode != null) {
      if (outlineWidthMode === 'none') {
        material.setParameter('outlineWidthMode', 0);
      } else if (outlineWidthMode === 'worldCoordinates') {
        material.setParameter('outlineWidthMode', 1);
      } else if (outlineWidthMode === 'screenCoordinates') {
        material.setParameter('outlineWidthMode', 2);
      }
    }
  }
  {
    const outlineWidthFactor = mToon.outlineWidthFactor;
    if (outlineWidthFactor != null) {
      material.setParameter('outlineWidthFactor', outlineWidthFactor);
    }
  }
  {
    const outlineWidthMultiplyTexture = mToon.outlineWidthMultiplyTexture;
    if (outlineWidthMultiplyTexture != null) {
      const rnTexture = rnTextures[outlineWidthMultiplyTexture.texture!.source!];
      const rnSampler = rnSamplers[outlineWidthMultiplyTexture.texture!.sampler!];
      material.setTextureParameter('outlineWidthMultiplyTexture', rnTexture, rnSampler);
    }
  }
  {
    const outlineColorFactor = mToon.outlineColorFactor;
    if (outlineColorFactor != null) {
      material.setParameter('outlineColorFactor', Vector3.fromCopyArray3(outlineColorFactor));
    }
  }
  {
    const outlineLightingMixFactor = mToon.outlineLightingMixFactor;
    if (outlineLightingMixFactor != null) {
      material.setParameter('outlineLightingMixFactor', outlineLightingMixFactor);
    }
  }
  {
    const uvAnimationMaskTexture = mToon.uvAnimationMaskTexture;
    if (uvAnimationMaskTexture != null) {
      const rnTexture = rnTextures[uvAnimationMaskTexture.texture!.source!];
      const rnSampler = rnSamplers[uvAnimationMaskTexture.texture!.sampler!];
      material.setTextureParameter('uvAnimationMaskTexture', rnTexture, rnSampler);
      if (uvAnimationMaskTexture.texCoord != null) {
        material.setParameter('uvAnimationMaskTexcoordIndex', uvAnimationMaskTexture.texCoord);
      }
    }
  }
  {
    const uvAnimationScrollXSpeedFactor = mToon.uvAnimationScrollXSpeedFactor;
    if (uvAnimationScrollXSpeedFactor != null) {
      material.setParameter('uvAnimationScrollXSpeedFactor', uvAnimationScrollXSpeedFactor);
    }
  }
  {
    const uvAnimationScrollYSpeedFactor = mToon.uvAnimationScrollYSpeedFactor;
    if (uvAnimationScrollYSpeedFactor != null) {
      material.setParameter('uvAnimationScrollYSpeedFactor', uvAnimationScrollYSpeedFactor);
    }
  }
  {
    const uvAnimationRotationSpeedFactor = mToon.uvAnimationRotationSpeedFactor;
    if (uvAnimationRotationSpeedFactor != null) {
      material.setParameter('uvAnimationRotationSpeedFactor', uvAnimationRotationSpeedFactor);
    }
  }
}

function setupPbrMetallicRoughness(
  pbrMetallicRoughness: RnM2PbrMetallicRoughness,
  material: Material,
  gltfModel: RnM2,
  options: GltfLoadOption | undefined,
  materialJson: RnM2Material,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
) {
  const isUnlit = materialJson.extensions?.KHR_materials_unlit != null;

  const baseColorFactor = pbrMetallicRoughness.baseColorFactor;
  if (baseColorFactor != null) {
    material.setParameter('baseColorFactor', Vector4.fromCopyArray4(baseColorFactor));
  }

  // BaseColor Texture
  const baseColorTexture = pbrMetallicRoughness.baseColorTexture;
  if (baseColorTexture != null) {
    const rnTexture = rnTextures[baseColorTexture.texture!.source!];
    const rnSampler = rnSamplers[baseColorTexture.texture!.sampler!];
    material.setTextureParameter('baseColorTexture', rnTexture, rnSampler);
    if (baseColorTexture.texCoord != null) {
      material.setParameter('baseColorTexcoordIndex', baseColorTexture.texCoord);
    }
    ModelConverter._setupTextureTransform(
      baseColorTexture!,
      material,
      'baseColorTextureTransformScale',
      'baseColorTextureTransformOffset',
      'baseColorTextureTransformRotation'
    );
  }

  // Ambient Occlusion Texture
  const occlusionTexture = materialJson.occlusionTexture;
  if (occlusionTexture != null && Is.falsy(isUnlit)) {
    const rnTexture = rnTextures[occlusionTexture.texture!.source!];
    const rnSampler = rnSamplers[occlusionTexture.texture!.sampler!];
    material.setTextureParameter('occlusionTexture', rnTexture, rnSampler);
    if (occlusionTexture.texCoord != null) {
      material.setParameter('occlusionTexcoordIndex', occlusionTexture.texCoord);
    }
    if (occlusionTexture.strength != null) {
      material.setParameter('occlusionStrength', occlusionTexture.strength);
    }
    ModelConverter._setupTextureTransform(
      occlusionTexture,
      material,
      'occlusionTextureTransformScale',
      'occlusionTextureTransformOffset',
      'occlusionTextureTransformRotation'
    );
  }

  // Metallic Factor
  let metallicFactor = pbrMetallicRoughness.metallicFactor;
  metallicFactor = isUnlit ? 0 : metallicFactor ?? 1;
  let roughnessFactor = pbrMetallicRoughness.roughnessFactor;
  roughnessFactor = isUnlit ? 1 : roughnessFactor ?? 1;
  material.setParameter('metallicFactor', metallicFactor);
  material.setParameter('roughnessFactor', roughnessFactor);

  // Metallic roughness texture
  const metallicRoughnessTexture = pbrMetallicRoughness.metallicRoughnessTexture;
  if (metallicRoughnessTexture != null && Is.falsy(isUnlit)) {
    const rnTexture = rnTextures[metallicRoughnessTexture.texture!.source!];
    const rnSampler = rnSamplers[metallicRoughnessTexture.texture!.sampler!];
    material.setTextureParameter('metallicRoughnessTexture', rnTexture, rnSampler);
    if (metallicRoughnessTexture.texCoord != null) {
      material.setParameter('metallicRoughnessTexcoordIndex', metallicRoughnessTexture.texCoord);
    }
    ModelConverter._setupTextureTransform(
      metallicRoughnessTexture!,
      material,
      'metallicRoughnessTextureTransformScale',
      'metallicRoughnessTextureTransformOffset',
      'metallicRoughnessTextureTransformRotation'
    );
  }

  // if (Is.exist(metallicRoughnessTexture?.texture?.image?.image)) {
  //   const image = metallicRoughnessTexture!.texture!.image!.image;
  //   const width = image.width;
  //   const height = image.height;

  //   const metallicRoughnessCanvas = convertHTMLImageElementToCanvas(image, width, height);
  // }

  // ClearCoat
  setup_KHR_materials_clearcoat(materialJson, material, gltfModel, rnTextures, rnSamplers);

  // Transmission
  const transmission = setup_KHR_materials_transmission(materialJson, material, gltfModel, rnTextures, rnSamplers);
  if (!options!.transmission) {
    options!.transmission = transmission;
  }

  setup_KHR_materials_volume(materialJson, material, gltfModel, rnTextures, rnSamplers);

  setup_KHR_materials_sheen(materialJson, material, gltfModel, rnTextures, rnSamplers);

  setup_KHR_materials_specular(materialJson, material, gltfModel, rnTextures, rnSamplers);

  setup_KHR_materials_ior(materialJson, material, gltfModel);

  setup_KHR_materials_iridescence(materialJson, material, gltfModel, rnTextures, rnSamplers);

  setup_KHR_materials_anisotropy(materialJson, material, gltfModel, rnTextures, rnSamplers);

  setup_KHR_materials_emissive_strength(materialJson, material, gltfModel);

  setup_KHR_materials_dispersion(materialJson, material, gltfModel);

  setup_KHR_materials_diffuse_transmission(materialJson, material, gltfModel, rnTextures, rnSamplers);
}

function setup_KHR_materials_transmission(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
) {
  const KHR_materials_transmission = materialJson.extensions?.KHR_materials_transmission;
  if (Is.exist(KHR_materials_transmission)) {
    const transmissionFactor = Is.exist(KHR_materials_transmission.transmissionFactor)
      ? KHR_materials_transmission.transmissionFactor
      : 0.0;
    material.setParameter('transmissionFactor', transmissionFactor);

    const transmissionTexture = KHR_materials_transmission.transmissionTexture;
    if (Is.exist(transmissionTexture)) {
      const rnTransmissionTexture = rnTextures[transmissionTexture.texture!.source!];
      const rnSampler = rnSamplers[transmissionTexture.texture!.sampler!];
      material.setTextureParameter('transmissionTexture', rnTransmissionTexture, rnSampler);
      if (transmissionTexture.texCoord != null) {
        material.setParameter('transmissionTexcoordIndex', transmissionTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        transmissionTexture,
        material,
        'transmissionTextureTransformScale',
        'transmissionTextureTransformOffset',
        'transmissionTextureTransformRotation'
      );
    }
    return true;
  }
  return false;
}

function setup_KHR_materials_clearcoat(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
) {
  const KHR_materials_clearcoat = materialJson?.extensions?.KHR_materials_clearcoat;
  if (Is.exist(KHR_materials_clearcoat)) {
    // ClearCoat Factor
    const clearcoatFactor = Is.exist(KHR_materials_clearcoat.clearcoatFactor)
      ? KHR_materials_clearcoat.clearcoatFactor
      : 0.0;
    material.setParameter('clearcoatFactor', clearcoatFactor);
    // ClearCoat Texture
    const clearcoatTexture = KHR_materials_clearcoat.clearcoatTexture;
    if (clearcoatTexture != null) {
      const rnClearCoatTexture = rnTextures[clearcoatTexture.texture!.source!];
      const rnSampler = rnSamplers[clearcoatTexture.texture!.sampler!];
      material.setTextureParameter('clearcoatTexture', rnClearCoatTexture, rnSampler);
      if (clearcoatTexture.texCoord != null) {
        material.setParameter('clearcoatTexcoordIndex', clearcoatTexture.texCoord);
      }
      // ClearCoat Texture Transform
      ModelConverter._setupTextureTransform(
        clearcoatTexture,
        material,
        'clearcoatTextureTransformScale',
        'clearcoatTextureTransformOffset',
        'clearcoatTextureTransformRotation'
      );
    }
    // ClearCoat Roughness Factor
    const clearcoatRoughnessFactor = Is.exist(KHR_materials_clearcoat.clearcoatRoughnessFactor)
      ? KHR_materials_clearcoat.clearcoatRoughnessFactor
      : 0.0;
    material.setParameter('clearcoatRoughnessFactor', clearcoatRoughnessFactor);
    // ClearCoat Roughness Texture
    const clearcoatRoughnessTexture = KHR_materials_clearcoat.clearcoatRoughnessTexture;
    if (clearcoatRoughnessTexture != null) {
      const rnClearCoatRoughnessTexture = rnTextures[clearcoatRoughnessTexture.texture!.source!];
      const rnSampler = rnSamplers[clearcoatRoughnessTexture.texture!.sampler!];
      material.setTextureParameter(
        'clearcoatRoughnessTexture',
        rnClearCoatRoughnessTexture,
        rnSampler
      );
      if (clearcoatRoughnessTexture.texCoord != null) {
        material.setParameter(
          'clearcoatRoughnessTexcoordIndex',
          clearcoatRoughnessTexture.texCoord
        );
      }
      // ClearCoat Roughness Texture Transform
      ModelConverter._setupTextureTransform(
        clearcoatRoughnessTexture,
        material,
        'clearcoatRoughnessTextureTransformScale',
        'clearcoatRoughnessTextureTransformOffset',
        'clearcoatRoughnessTextureTransformRotation'
      );
    }
    // ClearCoat Normal Texture
    const clearcoatNormalTexture = KHR_materials_clearcoat.clearcoatNormalTexture;
    if (clearcoatNormalTexture != null) {
      const rnClearCoatNormalTexture = rnTextures[clearcoatNormalTexture.texture!.source!];
      const rnSampler = rnSamplers[clearcoatNormalTexture.texture!.sampler!];
      material.setTextureParameter('clearcoatNormalTexture', rnClearCoatNormalTexture, rnSampler);
      if (clearcoatNormalTexture.texCoord != null) {
        material.setParameter('clearcoatNormalTexcoordIndex', clearcoatNormalTexture.texCoord);
      }
      // ClearCoat Normal Texture Transform
      ModelConverter._setupTextureTransform(
        clearcoatNormalTexture,
        material,
        'clearcoatNormalTextureTransformScale',
        'clearcoatNormalTextureTransformOffset',
        'clearcoatNormalTextureTransformRotation'
      );
    }
  }
}

function setup_KHR_materials_volume(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
): void {
  const KHR_materials_volume = materialJson?.extensions?.KHR_materials_volume;
  if (Is.exist(KHR_materials_volume)) {
    const thicknessFactor = KHR_materials_volume.thicknessFactor
      ? KHR_materials_volume.thicknessFactor
      : 0.0;
    if (thicknessFactor != null) {
      material.setParameter('thicknessFactor', thicknessFactor);
    }
    const thicknessTexture = KHR_materials_volume.thicknessTexture;
    if (thicknessTexture != null) {
      const rnThicknessTexture = rnTextures[thicknessTexture.texture!.source!];
      const rnSampler = rnSamplers[thicknessTexture.texture!.sampler!];
      material.setTextureParameter('thicknessTexture', rnThicknessTexture, rnSampler);
      if (thicknessTexture.texCoord != null) {
        material.setParameter('thicknessTexcoordIndex', thicknessTexture.texCoord);
      }
      // Thickness Texture Transform
      ModelConverter._setupTextureTransform(
        thicknessTexture,
        material,
        'thicknessTextureTransformScale',
        'thicknessTextureTransformOffset',
        'thicknessTextureTransformRotation'
      );
    }
    const attenuationDistance = KHR_materials_volume.attenuationDistance
      ? KHR_materials_volume.attenuationDistance
      : 0.0;
    if (attenuationDistance != null) {
      material.setParameter('attenuationDistance', attenuationDistance);
    }
    const attenuationColor = KHR_materials_volume.attenuationColor
      ? Vector3.fromCopyArray3(KHR_materials_volume.attenuationColor)
      : Vector3.fromCopy3(1.0, 1.0, 1.0);
    if (attenuationColor != null) {
      material.setParameter('attenuationColor', attenuationColor);
    }
  }
}

function setup_KHR_materials_sheen(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
) {
  const KHR_materials_sheen = materialJson?.extensions?.KHR_materials_sheen;
  if (Is.exist(KHR_materials_sheen)) {
    const sheenColorFactor = Is.exist(KHR_materials_sheen.sheenColorFactor)
      ? KHR_materials_sheen.sheenColorFactor
      : [0.0, 0.0, 0.0];
    material.setParameter('sheenColorFactor', Vector3.fromCopyArray3(sheenColorFactor));
    const sheenColorTexture = KHR_materials_sheen.sheenColorTexture;
    if (sheenColorTexture != null) {
      const rnSheenColorTexture = rnTextures[sheenColorTexture.texture!.source!];
      const rnSampler = rnSamplers[sheenColorTexture.texture!.sampler!];
      material.setTextureParameter('sheenColorTexture', rnSheenColorTexture, rnSampler);
      if (sheenColorTexture.texCoord != null) {
        material.setParameter('sheenColorTexcoordIndex', sheenColorTexture.texCoord);
      }
      // Sheen Color Texture Transform
      ModelConverter._setupTextureTransform(
        sheenColorTexture,
        material,
        'sheenColorTextureTransformScale',
        'sheenColorTextureTransformOffset',
        'sheenColorTextureTransformRotation'
      );
    }
    const sheenRoughnessFactor = Is.exist(KHR_materials_sheen.sheenRoughnessFactor)
      ? KHR_materials_sheen.sheenRoughnessFactor
      : 0.0;
    material.setParameter('sheenRoughnessFactor', sheenRoughnessFactor);
    const sheenRoughnessTexture = KHR_materials_sheen.sheenRoughnessTexture;
    if (sheenRoughnessTexture != null) {
      const rnSheenRoughnessTexture = rnTextures[sheenRoughnessTexture.texture!.source!];
      const rnSampler = rnSamplers[sheenRoughnessTexture.texture!.sampler!];
      material.setTextureParameter('sheenRoughnessTexture', rnSheenRoughnessTexture, rnSampler);
      if (sheenRoughnessTexture.texCoord != null) {
        material.setParameter('sheenRoughnessTexcoordIndex', sheenRoughnessTexture.texCoord);
      }
      // Sheen Roughness Texture Transform
      ModelConverter._setupTextureTransform(
        sheenRoughnessTexture,
        material,
        'sheenRoughnessTextureTransformScale',
        'sheenRoughnessTextureTransformOffset',
        'sheenRoughnessTextureTransformRotation'
      );
    }
  }
}

function setup_KHR_materials_specular(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
) {
  const KHR_materials_specular = materialJson?.extensions?.KHR_materials_specular;
  if (Is.exist(KHR_materials_specular)) {
    const specularFactor = Is.exist(KHR_materials_specular.specularFactor)
      ? KHR_materials_specular.specularFactor
      : 1.0;
    material.setParameter('specularFactor', specularFactor);
    const specularTexture = KHR_materials_specular.specularTexture;
    if (specularTexture != null) {
      const rnSpecularTexture = rnTextures[specularTexture.texture!.source!];
      const rnSampler = rnSamplers[specularTexture.texture!.sampler!];
      material.setTextureParameter('specularTexture', rnSpecularTexture, rnSampler);
      if (specularTexture.texCoord != null) {
        material.setParameter('specularTexcoordIndex', specularTexture.texCoord);
      }
      // Specular Texture Transform
      ModelConverter._setupTextureTransform(
        specularTexture,
        material,
        'specularTextureTransformScale',
        'specularTextureTransformOffset',
        'specularTextureTransformRotation'
      );
    }
    const specularColorFactor = Is.exist(KHR_materials_specular.specularColorFactor)
      ? KHR_materials_specular.specularColorFactor
      : [1.0, 1.0, 1.0];
    material.setParameter('specularColorFactor', Vector3.fromCopyArray3(specularColorFactor));
    const specularColorTexture = KHR_materials_specular.specularColorTexture;
    if (specularColorTexture != null) {
      const rnSpecularColorTexture = rnTextures[specularColorTexture.texture!.source!];
      const rnSampler = rnSamplers[specularColorTexture.texture!.sampler!];
      material.setTextureParameter('specularColorTexture', rnSpecularColorTexture, rnSampler);
      if (specularColorTexture.texCoord != null) {
        material.setParameter('specularColorTexcoordIndex', specularColorTexture.texCoord);
      }
      // Specular Color Texture Transform
      ModelConverter._setupTextureTransform(
        specularColorTexture,
        material,
        'specularColorTextureTransformScale',
        'specularColorTextureTransformOffset',
        'specularColorTextureTransformRotation'
      );
    }
  }
}

function setup_KHR_materials_ior(materialJson: RnM2Material, material: Material, gltfModel: RnM2) {
  const KHR_materials_ior = materialJson?.extensions?.KHR_materials_ior;
  if (Is.exist(KHR_materials_ior)) {
    const ior = Is.exist(KHR_materials_ior.ior) ? KHR_materials_ior.ior : 1.5;
    material.setParameter('ior', ior);
  }
}

function setup_KHR_materials_iridescence(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
) {
  const KHR_materials_iridescence = materialJson?.extensions?.KHR_materials_iridescence;
  if (Is.exist(KHR_materials_iridescence)) {
    const iridescenceFactor = Is.exist(KHR_materials_iridescence.iridescenceFactor)
      ? KHR_materials_iridescence.iridescenceFactor
      : 0.0;
    material.setParameter('iridescenceFactor', iridescenceFactor);
    const iridescenceTexture = KHR_materials_iridescence.iridescenceTexture;
    if (iridescenceTexture != null) {
      const rnIridescenceTexture = rnTextures[iridescenceTexture.texture!.source!];
      const rnSampler = rnSamplers[iridescenceTexture.texture!.sampler!];
      material.setTextureParameter('iridescenceTexture', rnIridescenceTexture, rnSampler);
      if (iridescenceTexture.texCoord != null) {
        material.setParameter('iridescenceTexcoordIndex', iridescenceTexture.texCoord);
      }
      // Iridescence Texture Transform
      ModelConverter._setupTextureTransform(
        iridescenceTexture,
        material,
        'iridescenceTextureTransformScale',
        'iridescenceTextureTransformOffset',
        'iridescenceTextureTransformRotation'
      );
    }
    const iridescenceIor = Is.exist(KHR_materials_iridescence.iridescenceIor)
      ? KHR_materials_iridescence.iridescenceIor
      : 1.3;
    material.setParameter('iridescenceIor', iridescenceIor);

    const iridescenceThicknessMinimum = Is.exist(
      KHR_materials_iridescence.iridescenceThicknessMinimum
    )
      ? KHR_materials_iridescence.iridescenceThicknessMinimum
      : 100.0;
    material.setParameter('iridescenceThicknessMinimum', iridescenceThicknessMinimum);

    const iridescenceThicknessMaximum = Is.exist(
      KHR_materials_iridescence.iridescenceThicknessMaximum
    )
      ? KHR_materials_iridescence.iridescenceThicknessMaximum
      : 400.0;
    material.setParameter('iridescenceThicknessMaximum', iridescenceThicknessMaximum);

    const iridescenceThicknessTexture = KHR_materials_iridescence.iridescenceThicknessTexture;
    if (iridescenceThicknessTexture != null) {
      const rnIridescenceThicknessTexture = rnTextures[iridescenceThicknessTexture.texture!.source!];
      const rnSampler = rnSamplers[iridescenceThicknessTexture.texture!.sampler!];
      material.setTextureParameter(
        'iridescenceThicknessTexture',
        rnIridescenceThicknessTexture,
        rnSampler
      );
      if (iridescenceThicknessTexture.texCoord != null) {
        material.setParameter(
          'iridescenceThicknessTexcoordIndex',
          iridescenceThicknessTexture.texCoord
        );
      }
      // Iridescence Thickness Texture Transform
      ModelConverter._setupTextureTransform(
        iridescenceThicknessTexture,
        material,
        'iridescenceThicknessTextureTransformScale',
        'iridescenceThicknessTextureTransformOffset',
        'iridescenceThicknessTextureTransformRotation'
      );
    }
  }
}

function setup_KHR_materials_anisotropy(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
) {
  const KHR_materials_anisotropy = materialJson?.extensions?.KHR_materials_anisotropy;
  if (Is.exist(KHR_materials_anisotropy)) {
    const anisotropyStrength = Is.exist(KHR_materials_anisotropy.anisotropyStrength)
      ? KHR_materials_anisotropy.anisotropyStrength
      : 0.0;
    material.setParameter('anisotropyStrength', anisotropyStrength);
    const anisotropyRotation = Is.exist(KHR_materials_anisotropy.anisotropyRotation)
      ? KHR_materials_anisotropy.anisotropyRotation
      : 0.0;
    material.setParameter(
      'anisotropyRotation',
      Vector2.fromCopy2(Math.cos(anisotropyRotation), Math.sin(anisotropyRotation))
    );

    const anisotropyTexture = KHR_materials_anisotropy.anisotropyTexture;
    if (anisotropyTexture != null) {
      const rnAnisotropyTexture = rnTextures[anisotropyTexture.texture!.source!];
      const rnSampler = rnSamplers[anisotropyTexture.texture!.sampler!];
      material.setTextureParameter('anisotropyTexture', rnAnisotropyTexture, rnSampler);
      if (anisotropyTexture.texCoord != null) {
        material.setParameter('anisotropyTexcoordIndex', anisotropyTexture.texCoord);
      }
      // Anisotropy Texture Transform
      ModelConverter._setupTextureTransform(
        anisotropyTexture,
        material,
        'anisotropyTextureTransformScale',
        'anisotropyTextureTransformOffset',
        'anisotropyTextureTransformRotation'
      );
    }
  }
}

function setup_KHR_materials_emissive_strength(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2
) {
  const KHR_materials_emissive_strength = materialJson?.extensions?.KHR_materials_emissive_strength;
  if (Is.exist(KHR_materials_emissive_strength)) {
    const emissiveStrength = Is.exist(KHR_materials_emissive_strength.emissiveStrength)
      ? KHR_materials_emissive_strength.emissiveStrength
      : 1.0;
    material.setParameter('emissiveStrength', emissiveStrength);
  }
}

function setup_KHR_materials_dispersion(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2
) {
  const KHR_materials_dispersion = materialJson?.extensions?.KHR_materials_dispersion;
  if (Is.exist(KHR_materials_dispersion)) {
    const dispersion = Is.exist(KHR_materials_dispersion.dispersion)
      ? KHR_materials_dispersion.dispersion
      : 0.0;
    material.setParameter('dispersion', dispersion);
  }
}

function setup_KHR_materials_diffuse_transmission(
  materialJson: RnM2Material,
  material: Material,
  gltfModel: RnM2,
  rnTextures: Texture[],
  rnSamplers: Sampler[]
) {
  const KHR_materials_diffuse_transmission = materialJson?.extensions?.KHR_materials_diffuse_transmission;
  if (Is.exist(KHR_materials_diffuse_transmission)) {
    const diffuseTransmissionFactor = Is.exist(KHR_materials_diffuse_transmission.diffuseTransmissionFactor)
      ? KHR_materials_diffuse_transmission.diffuseTransmissionFactor
      : 0.0;
    material.setParameter('diffuseTransmissionFactor', diffuseTransmissionFactor);
    const diffuseTransmissionTexture = KHR_materials_diffuse_transmission.diffuseTransmissionTexture;
    if (diffuseTransmissionTexture != null) {
      const rnDiffuseTransmissionTexture = rnTextures[diffuseTransmissionTexture.texture!.source!];
      const rnSampler = rnSamplers[diffuseTransmissionTexture.texture!.sampler!];
      material.setTextureParameter('diffuseTransmissionTexture', rnDiffuseTransmissionTexture, rnSampler);
      if (diffuseTransmissionTexture.texCoord != null) {
        material.setParameter('diffuseTransmissionTexcoordIndex', diffuseTransmissionTexture.texCoord);
      }
      // Diffuse Transmission Texture Transform
      ModelConverter._setupTextureTransform(
        diffuseTransmissionTexture,
        material,
        'diffuseTransmissionTextureTransformScale',
        'diffuseTransmissionTextureTransformOffset',
        'diffuseTransmissionTextureTransformRotation'
      );
    }
    const diffuseTransmissionColorFactor = Is.exist(KHR_materials_diffuse_transmission.diffuseTransmissionColorFactor)
      ? KHR_materials_diffuse_transmission.diffuseTransmissionColorFactor
      : [1.0, 1.0, 1.0];
    material.setParameter('diffuseTransmissionColorFactor', Vector3.fromCopyArray3(diffuseTransmissionColorFactor));
    const diffuseTransmissionColorTexture = KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture;
    if (diffuseTransmissionColorTexture != null) {
      const rnDiffuseTransmissionColorTexture = rnTextures[diffuseTransmissionColorTexture.texture!.source!];
      const rnSampler = rnSamplers[diffuseTransmissionColorTexture.texture!.sampler!];
      material.setTextureParameter('diffuseTransmissionColorTexture', rnDiffuseTransmissionColorTexture, rnSampler);
      if (diffuseTransmissionColorTexture.texCoord != null) {
        material.setParameter('diffuseTransmissionColorTexcoordIndex', diffuseTransmissionColorTexture.texCoord);
      }
      // Diffuse Transmission Color Texture Transform
      ModelConverter._setupTextureTransform(
        diffuseTransmissionColorTexture,
        material,
        'diffuseTransmissionColorTextureTransformScale',
        'diffuseTransmissionColorTextureTransformOffset',
        'diffuseTransmissionColorTextureTransformRotation'
      );
    }
  }
}

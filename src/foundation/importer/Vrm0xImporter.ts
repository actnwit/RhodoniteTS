import {Gltf2Importer} from './Gltf2Importer';
import {ModelConverter} from './ModelConverter';
import {Is} from '../misc/Is';
import {VRM} from '../../types/VRM';
import {ISceneGraphEntity} from '../helpers/EntityHelper';
import {GltfLoadOption, RnM2} from '../../types';
import {RenderPass} from '../renderer/RenderPass';
import {Texture} from '../textures/Texture';
import {EntityRepository} from '../core/EntityRepository';
import {VRMSpringBonePhysicsStrategy} from '../physics/VRMSpringBonePhysicsStrategy';
import {PhysicsComponent} from '../components/Physics/PhysicsComponent';
import {SceneGraphComponent} from '../components/SceneGraph/SceneGraphComponent';
import {SphereCollider} from '../physics/SphereCollider';
import {Vector3} from '../math/Vector3';
import {VRMColliderGroup} from '../physics/VRMColliderGroup';
import {VRMSpringBoneGroup} from '../physics/VRMSpringBoneGroup';
import {Err, IResult, Ok} from '../misc/Result';

/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
export class Vrm0xImporter {
  private constructor() {}

  /**
   * Import VRM file.
   */
  public static async importFromUri(
    uri: string,
    options?: GltfLoadOption
  ): Promise<IResult<ISceneGraphEntity[], Err<RnM2, undefined>>> {
    options = this._getOptions(options);

    const result = await Gltf2Importer.importFromUri(uri, options);
    if (result.isErr()) {
      return new Err({
        message: 'Failed to import VRM file.',
        error: result,
      });
    }

    const gltfModel = result.unwrapForce();
    const textures = Vrm0xImporter._createTextures(gltfModel);
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray;
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = textures;
    }

    Vrm0xImporter._initializeMaterialProperties(gltfModel, textures.length);

    // setup rootGroup
    let rootGroups;
    const rootGroupMain = ModelConverter.convertToRhodoniteObject(gltfModel!);

    const existOutline = Vrm0xImporter._existOutlineMaterial(
      gltfModel.extensions.VRM
    );
    if (existOutline) {
      if (Is.exist(defaultMaterialHelperArgumentArray)) {
        defaultMaterialHelperArgumentArray[0].isOutline = true;
      }
      const rootGroupOutline =
        ModelConverter.convertToRhodoniteObject(gltfModel);

      rootGroups = [rootGroupMain, rootGroupOutline];
    } else {
      rootGroups = [rootGroupMain];
    }
    Vrm0xImporter._readSpringBone(rootGroupMain, gltfModel as VRM);
    Vrm0xImporter._readVRMHumanoidInfo(gltfModel as VRM, rootGroupMain);

    return new Ok(rootGroups);
  }

  /**
   * For VRM file only
   * Generate JSON.
   */
  static async importJsonOfVRM(
    uri: string,
    options?: GltfLoadOption
  ): Promise<IResult<VRM, Err<RnM2, undefined>>> {
    options = this._getOptions(options);

    const result = await Gltf2Importer.importFromUri(uri, options);
    if (result.isErr()) {
      return new Err({
        message: 'Failed to import VRM file.',
        error: result,
      });
    }

    const gltfJson = result.unwrapForce();
    Vrm0xImporter._readVRMHumanoidInfo(gltfJson as VRM);

    return new Ok(gltfJson as VRM);
  }

  static async __importVRM0x(
    gltfModel: RnM2,
    renderPasses: RenderPass[]
  ): Promise<void> {
    // process defaultMaterialHelperArgumentArray
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray;
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures =
        defaultMaterialHelperArgumentArray[0].textures ??
        this._createTextures(gltfModel);
      defaultMaterialHelperArgumentArray[0].isLighting =
        defaultMaterialHelperArgumentArray[0].isLighting ?? true;

      this._initializeMaterialProperties(
        gltfModel,
        defaultMaterialHelperArgumentArray[0].textures.length
      );
    }

    // get rootGroup
    let rootGroup;
    const existOutline = this._existOutlineMaterial(gltfModel.extensions.VRM);
    if (existOutline) {
      renderPasses[1] = renderPasses[1] ?? new RenderPass();
      const renderPassOutline = renderPasses[1];
      renderPassOutline.toClearColorBuffer = false;
      renderPassOutline.toClearDepthBuffer = false;
      gltfModel.extensions.VRM.rnExtension = {
        renderPassOutline: renderPassOutline,
      };

      rootGroup = ModelConverter.convertToRhodoniteObject(gltfModel);
      renderPassOutline.addEntities([rootGroup]);
    } else {
      rootGroup = ModelConverter.convertToRhodoniteObject(gltfModel);
    }

    const renderPassMain = renderPasses[0];
    renderPassMain.addEntities([rootGroup]);

    this._readSpringBone(rootGroup, gltfModel as VRM);
    this._readVRMHumanoidInfo(gltfModel as VRM, rootGroup);
  }

  static _readVRMHumanoidInfo(
    gltfModel: VRM,
    rootEntity?: ISceneGraphEntity
  ): void {
    const humanBones = gltfModel.extensions.VRM.humanoid.humanBones;
    const mapNameNodeId: Map<string, number> = new Map();
    // const mapNameNodeName: Map<string, string> = new Map();
    for (const bone of humanBones) {
      mapNameNodeId.set(bone.bone, bone.node);
      const boneNode = gltfModel.nodes[bone.node];
      bone.name = boneNode.name;
    }
    if (rootEntity != null) {
      rootEntity.tryToSetTag({
        tag: 'humanoid_map_name_nodeId',
        value: mapNameNodeId,
      });
    }
    // rootEntity.tryToSetTag({
    //   tag: 'humanoid_map_name_nodeName',
    //   value: mapNameNodeName
    // });
  }

  static _readSpringBone(rootEntity: ISceneGraphEntity, gltfModel: VRM): void {
    const boneGroups: VRMSpringBoneGroup[] = [];
    for (const boneGroup of gltfModel.extensions.VRM.secondaryAnimation
      .boneGroups) {
      const vrmSpringBoneGroup = new VRMSpringBoneGroup();
      vrmSpringBoneGroup.tryToSetUniqueName(boneGroup.comment, true);
      vrmSpringBoneGroup.dragForce = boneGroup.dragForce;
      vrmSpringBoneGroup.stiffnessForce = boneGroup.stiffiness;
      vrmSpringBoneGroup.gravityPower = boneGroup.gravityPower;
      vrmSpringBoneGroup.gravityDir = Vector3.fromCopyArray([
        boneGroup.gravityDir.x,
        boneGroup.gravityDir.y,
        boneGroup.gravityDir.z,
      ]);
      vrmSpringBoneGroup.colliderGroupIndices = boneGroup.colliderGroups;
      vrmSpringBoneGroup.hitRadius = boneGroup.hitRadius;
      for (const idxOfArray in boneGroup.bones) {
        const boneNodeIndex = boneGroup.bones[idxOfArray];
        const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        vrmSpringBoneGroup.rootBones.push(entity.getSceneGraph()!);
        // const boneNodeIndex = boneGroup.bones[idxOfArray];
        // const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        // entityRepository.addComponentToEntity(PhysicsComponent, entity.entityUID);
      }
      boneGroups.push(vrmSpringBoneGroup);
    }

    VRMSpringBonePhysicsStrategy.setBoneGroups(boneGroups);
    for (const boneGroup of boneGroups) {
      for (const sg of boneGroup.rootBones) {
        this.__addPhysicsComponentRecursively(EntityRepository, sg);
      }
    }

    const colliderGroups: VRMColliderGroup[] = [];
    for (const colliderGroupIdx in gltfModel.extensions.VRM.secondaryAnimation
      .colliderGroups) {
      const colliderGroup =
        gltfModel.extensions.VRM.secondaryAnimation.colliderGroups[
          colliderGroupIdx
        ];
      const vrmColliderGroup = new VRMColliderGroup();
      colliderGroups.push(vrmColliderGroup);
      const colliders: SphereCollider[] = [];
      for (const collider of colliderGroup.colliders) {
        const sphereCollider = new SphereCollider();
        sphereCollider.position = Vector3.fromCopyArray([
          collider.offset.x,
          collider.offset.y,
          collider.offset.z,
        ]);
        sphereCollider.radius = collider.radius;
        colliders.push(sphereCollider);
      }
      vrmColliderGroup.colliders = colliders;
      const baseSg =
        gltfModel.asset.extras!.rnEntities![colliderGroup.node].getSceneGraph();
      vrmColliderGroup.baseSceneGraph = baseSg;
      VRMSpringBonePhysicsStrategy.addColliderGroup(
        parseInt(colliderGroupIdx),
        vrmColliderGroup
      );
    }
  }

  private static __addPhysicsComponentRecursively(
    entityRepository: EntityRepository,
    sg: SceneGraphComponent
  ): void {
    const entity = sg.entity;
    EntityRepository.addComponentToEntity(PhysicsComponent, entity);
    VRMSpringBonePhysicsStrategy.initialize(sg);
    if (sg.children.length > 0) {
      for (const child of sg.children) {
        this.__addPhysicsComponentRecursively(entityRepository, child);
      }
    }
  }

  static _createTextures(gltfModel: RnM2): Texture[] {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnTextures: Texture[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = ModelConverter._createTexture(
        gltfTextures[i],
        gltfModel
      );
      rnTextures[i] = rnTexture;
    }

    const dummyWhiteTexture = new Texture();
    dummyWhiteTexture.generate1x1TextureFrom();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture();
    dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
    rnTextures.push(dummyBlackTexture);

    return rnTextures;
  }

  static _existOutlineMaterial(extensionsVRM: any): boolean {
    const materialProperties = extensionsVRM.materialProperties;
    if (materialProperties != null) {
      for (const materialProperty of materialProperties) {
        if (materialProperty.floatProperties._OutlineWidthMode !== 0) {
          return true;
        }
      }
    }

    return false;
  }

  static _initializeMaterialProperties(
    gltfModel: RnM2,
    texturesLength: number
  ): void {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;

    for (const materialProperty of materialProperties) {
      if (materialProperty.shader === 'VRM/MToon') {
        this.__initializeMToonMaterialProperties(gltfModel, texturesLength);
        break;
      }
    }
  }

  private static __initializeMToonMaterialProperties(
    gltfModel: RnM2,
    texturesLength: number
  ): void {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;

    const dummyWhiteTextureNumber = texturesLength - 2;
    const dummyBlackTextureNumber = texturesLength - 1;

    for (let i = 0; i < materialProperties.length; i++) {
      const floatProperties = materialProperties[i].floatProperties;
      this.__initializeForUndefinedProperty(floatProperties, '_BlendMode', 0.0);
      this.__initializeForUndefinedProperty(floatProperties, '_BumpScale', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_CullMode', 2.0);
      this.__initializeForUndefinedProperty(floatProperties, '_Cutoff', 0.5);
      this.__initializeForUndefinedProperty(floatProperties, '_DebugMode', 0.0);
      this.__initializeForUndefinedProperty(floatProperties, '_DstBlend', 0.0);
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_IndirectLightIntensity',
        0.1
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_LightColorAttenuation',
        0.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_OutlineColorMode',
        0.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_OutlineCullMode',
        1.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_OutlineLightingMix',
        1.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_OutlineScaledMaxDistance',
        1.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_OutlineWidth',
        0.5
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_OutlineWidthMode',
        0.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_ReceiveShadowRate',
        1.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_RimFresnelPower',
        1.0
      );
      this.__initializeForUndefinedProperty(floatProperties, '_RimLift', 0.0);
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_RimLightingMix',
        0.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_ShadeShift',
        0.0
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_ShadeToony',
        0.9
      );
      this.__initializeForUndefinedProperty(
        floatProperties,
        '_ShadingGradeRate',
        1.0
      );
      this.__initializeForUndefinedProperty(floatProperties, '_SrcBlend', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_ZWrite', 1.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimScrollX", 0.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimScrollY", 0.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimRotation", 0.0);

      const vectorProperties = materialProperties[i].vectorProperties;
      this.__initializeForUndefinedProperty(
        vectorProperties,
        '_Color',
        [1, 1, 1, 1]
      );
      this.__initializeForUndefinedProperty(
        vectorProperties,
        '_EmissionColor',
        [0, 0, 0]
      );
      this.__initializeForUndefinedProperty(
        vectorProperties,
        '_OutlineColor',
        [0, 0, 0, 1]
      );
      this.__initializeForUndefinedProperty(
        vectorProperties,
        '_ShadeColor',
        [0.97, 0.81, 0.86, 1]
      );
      this.__initializeForUndefinedProperty(
        vectorProperties,
        '_RimColor',
        [0, 0, 0]
      );
      // this.__initializeForUndefinedProperty(vectorProperties, "_BumpMap", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_EmissionMap", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_MainTex", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_OutlineWidthTexture", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_ReceiveShadowTexture", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_ShadeTexture", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_ShadingGradeTexture", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_SphereAdd", [0, 0, 1, 1]);

      // set num of texture array
      const textureProperties = materialProperties[i].textureProperties;
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_BumpMap',
        dummyWhiteTextureNumber
      );
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_EmissionMap',
        dummyBlackTextureNumber
      );
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_MainTex',
        dummyWhiteTextureNumber
      );
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_OutlineWidthTexture',
        dummyWhiteTextureNumber
      );
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_ReceiveShadowTexture',
        dummyWhiteTextureNumber
      );
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_RimTexture',
        dummyBlackTextureNumber
      );
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_ShadeTexture',
        dummyWhiteTextureNumber
      );
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_ShadingGradeTexture',
        dummyWhiteTextureNumber
      );
      this.__initializeForUndefinedProperty(
        textureProperties,
        '_SphereAdd',
        dummyBlackTextureNumber
      );
      // this.__initializeForUndefinedProperty(textureProperties, "_UvAnimMaskTexture", dummyWhiteTextureNumber);
    }
  }

  private static __initializeForUndefinedProperty(
    object: any,
    propertyName: string,
    initialValue: any
  ): void {
    if (object[propertyName] == null) object[propertyName] = initialValue;
  }

  static _getOptions(options?: GltfLoadOption): GltfLoadOption {
    if (options != null) {
      for (const file in options.files) {
        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[fileName + '.glb'] = arraybuffer;
          delete options.files[file];
        }
      }

      //set default values
      options.__isImportVRM = true;
      if (options.defaultMaterialHelperArgumentArray == null) {
        options.defaultMaterialHelperArgumentArray = [{}];
      }

      if (!options.defaultMaterialHelperArgumentArray[0].isMorphing) {
        options.maxMorphTargetNumber = 0;
      }
    } else {
      options = {
        files: {},
        loaderExtension: undefined,
        defaultMaterialHelperName: undefined,
        defaultMaterialHelperArgumentArray: [
          {isLighting: true, isMorphing: true, isSkinning: true},
        ],
        statesOfElements: [
          {
            targets: [],
            states: {
              enable: [],
              functions: {},
            },
            isTransparent: true,
            opacity: 1.0,
            isTextureImageToLoadPreMultipliedAlpha: false,
          },
        ],
        __isImportVRM: true,
      };
    }

    return options;
  }
}

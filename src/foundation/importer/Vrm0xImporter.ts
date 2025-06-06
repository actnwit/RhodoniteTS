import { Gltf2Importer } from './Gltf2Importer';
import { ModelConverter } from './ModelConverter';
import { Is } from '../misc/Is';
import type { Vrm0x, Vrm0xBoneGroup } from '../../types/VRM0x';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { GltfLoadOption, RnM2 } from '../../types';
import { RenderPass } from '../renderer/RenderPass';
import { Texture } from '../textures/Texture';
import { EntityRepository } from '../core/EntityRepository';
import { VRMSpringBonePhysicsStrategy } from '../physics/VRMSpring/VRMSpringBonePhysicsStrategy';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import type { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { SphereCollider } from '../physics/VRMSpring/SphereCollider';
import { Vector3 } from '../math/Vector3';
import { VRMColliderGroup } from '../physics/VRMSpring/VRMColliderGroup';
import { VRMSpring } from '../physics/VRMSpring/VRMSpring';
import { assertIsOk, type Err, type Result, Ok } from '../misc/Result';
import { VrmComponent, type VrmExpression } from '../components/Vrm/VrmComponent';
import { Sampler } from '../textures/Sampler';
import { VRMSpringBone } from '../physics/VRMSpring/VRMSpringBone';
import { TextureParameter } from '../definitions';

/**
 * The VRM 0.x format importer class.
 * This class provides functionality to import and process VRM 0.x files,
 * including humanoid bone mapping, spring bone physics, and expression blending.
 * It extends the GLTF2 importer with VRM-specific features.
 */
export class Vrm0xImporter {
  private constructor() {}

  /**
   * Imports a VRM file from the specified URL and converts it to Rhodonite scene graph entities.
   * This method handles the complete VRM import pipeline including textures, materials,
   * spring bone physics, humanoid mapping, and expression setup.
   *
   * @param url - The URL of the VRM file to import
   * @param options - Optional loading configuration including material helpers and render states
   * @returns A promise that resolves to an array of scene graph entities (main + optional outline)
   */
  public static async importFromUrl(
    url: string,
    options?: GltfLoadOption
  ): Promise<Result<ISceneGraphEntity[], Err<RnM2, undefined>>> {
    options = this._getOptions(options);

    const result = await Gltf2Importer.importFromUrl(url, options);

    const gltfModel = result;
    const textures = await Vrm0xImporter._createTextures(gltfModel);
    const samplers = Vrm0xImporter._createSamplers(gltfModel);
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray;
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = textures;
      defaultMaterialHelperArgumentArray[0].samplers = samplers;
    }

    Vrm0xImporter._initializeMaterialProperties(gltfModel, textures.length);

    // setup rootGroup
    let rootGroups;
    const rootGroupMain = await ModelConverter.convertToRhodoniteObject(gltfModel!);

    const existOutline = Vrm0xImporter._existOutlineMaterial(gltfModel.extensions.VRM);
    if (existOutline) {
      if (Is.exist(defaultMaterialHelperArgumentArray)) {
        defaultMaterialHelperArgumentArray[0].isOutline = true;
      }
      const rootGroupOutline = await ModelConverter.convertToRhodoniteObject(gltfModel);

      rootGroups = [rootGroupMain, rootGroupOutline];
    } else {
      rootGroups = [rootGroupMain];
    }
    Vrm0xImporter._readSpringBone(gltfModel as Vrm0x);
    Vrm0xImporter._readVRMHumanoidInfo(gltfModel as Vrm0x, rootGroupMain);

    return new Ok(rootGroups);
  }

  /**
   * Imports only the JSON data from a VRM file without creating scene graph entities.
   * This is useful for extracting VRM metadata, humanoid bone mappings, and other
   * configuration data without the overhead of full scene construction.
   *
   * @param uri - The URI of the VRM file to import
   * @param options - Optional loading configuration
   * @returns A promise that resolves to the VRM JSON data structure
   */
  static async importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<Vrm0x> {
    const promise = new Promise<Vrm0x>(async (resolve, reject) => {
      options = this._getOptions(options);

      try {
        const result = await Gltf2Importer.importFromUrl(uri, options);
        Vrm0xImporter._readVRMHumanoidInfo(result as Vrm0x);
        resolve(result as Vrm0x);
      } catch (error) {
        reject(error);
      }
    });

    return promise;
  }

  /**
   * Internal method for importing VRM 0.x data into existing render passes.
   * This method handles the complete VRM processing pipeline including material setup,
   * outline rendering, spring bone physics, and humanoid configuration.
   *
   * @param gltfModel - The loaded GLTF model data with VRM extensions
   * @param renderPasses - Array of render passes to add the VRM entities to
   */
  static async __importVRM0x(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void> {
    // process defaultMaterialHelperArgumentArray
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray;
    const textures = await this._createTextures(gltfModel);
    const samplers = this._createSamplers(gltfModel);
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = defaultMaterialHelperArgumentArray[0].textures ?? textures;
      defaultMaterialHelperArgumentArray[0].samplers = defaultMaterialHelperArgumentArray[0].samplers ?? samplers;
      defaultMaterialHelperArgumentArray[0].isLighting = defaultMaterialHelperArgumentArray[0].isLighting ?? true;
    }
    this._initializeMaterialProperties(gltfModel, textures.length);

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

      rootGroup = await ModelConverter.convertToRhodoniteObject(gltfModel);
      renderPassOutline.addEntities([rootGroup]);
    } else {
      rootGroup = await ModelConverter.convertToRhodoniteObject(gltfModel);
    }

    const renderPassMain = renderPasses[0];
    renderPassMain.tryToSetUniqueName('VRM Main RenderPass', true);
    renderPassMain.addEntities([rootGroup]);

    this._readSpringBone(gltfModel as Vrm0x);
    this._readVRMHumanoidInfo(gltfModel as Vrm0x, rootGroup);
    this._readBlendShapeGroup(gltfModel as Vrm0x, rootGroup);

    rootGroup.localEulerAngles = Vector3.fromCopyArray([0, Math.PI, 0.0]);
  }

  /**
   * Processes VRM blend shape groups and converts them to Rhodonite VRM expressions.
   * This method extracts facial expressions, eye blinks, and other morph target animations
   * from the VRM blend shape master and creates the corresponding VRM component.
   *
   * @param gltfModel - The VRM model data containing blend shape information
   * @param rootEntity - The root entity to attach the VRM component to
   */
  static _readBlendShapeGroup(gltfModel: Vrm0x, rootEntity: ISceneGraphEntity): void {
    const vrmExpressions: VrmExpression[] = [];

    const blendShapeGroups = gltfModel.extensions.VRM.blendShapeMaster.blendShapeGroups;
    for (const blendShapeGroup of blendShapeGroups) {
      const vrmExpression: VrmExpression = {
        name: blendShapeGroup.presetName,
        isBinary: blendShapeGroup.isBinary,
        binds: blendShapeGroup.binds.map(bind => {
          for (let i = 0; i < gltfModel.nodes.length; i++) {
            const node = gltfModel.nodes[i];
            if (node.mesh === bind.mesh) {
              const rnEntity = gltfModel.extras.rnEntities[i];
              return {
                entityIdx: rnEntity.entityUID,
                blendShapeIdx: bind.index,
                weight: bind.weight / 100,
              };
            }
          }
          throw new Error('Not Found node in blendShapeGroup Process');
        }),
      };
      vrmExpressions.push(vrmExpression);
    }
    const vrmEntity = EntityRepository.addComponentToEntity(VrmComponent, rootEntity);
    vrmEntity.getVrm().setVrmExpressions(vrmExpressions);
    vrmEntity.getVrm()._version = '0.x';
  }

  /**
   * Extracts and processes VRM humanoid bone mapping information.
   * This method creates a mapping between VRM standard bone names and the actual
   * scene graph nodes, which is essential for animation retargeting and IK.
   *
   * @param gltfModel - The VRM model data containing humanoid bone definitions
   * @param rootEntity - Optional root entity to attach the bone mapping metadata to
   */
  static _readVRMHumanoidInfo(gltfModel: Vrm0x, rootEntity?: ISceneGraphEntity): void {
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
  }

  /**
   * Processes VRM spring bone physics configuration and creates the physics simulation setup.
   * This method handles collider groups, spring bone chains, and physics parameters
   * to enable realistic secondary motion for hair, clothing, and accessories.
   *
   * @param gltfModel - The VRM model data containing spring bone and collider definitions
   */
  static _readSpringBone(gltfModel: Vrm0x): void {
    const colliderGroups: VRMColliderGroup[] = [];
    for (const colliderGroupIdx in gltfModel.extensions.VRM.secondaryAnimation.colliderGroups) {
      const colliderGroup = gltfModel.extensions.VRM.secondaryAnimation.colliderGroups[colliderGroupIdx];
      const vrmColliderGroup = new VRMColliderGroup();
      colliderGroups.push(vrmColliderGroup);
      const colliders: SphereCollider[] = [];
      const baseSg = gltfModel.asset.extras!.rnEntities![colliderGroup.node].getSceneGraph();
      for (const collider of colliderGroup.colliders) {
        const sphereCollider = new SphereCollider();
        sphereCollider.baseSceneGraph = baseSg;
        sphereCollider.position = Vector3.fromCopyArray([
          collider.offset.x,
          collider.offset.y,
          -collider.offset.z, // z is opposite in VRM0.x
        ]);
        sphereCollider.radius = collider.radius;
        colliders.push(sphereCollider);
      }
      vrmColliderGroup.sphereColliders = colliders;
    }

    const boneGroups: VRMSpring[] = [];
    for (const boneGroup of gltfModel.extensions.VRM.secondaryAnimation.boneGroups) {
      if (boneGroup.bones == null || boneGroup.bones.length === 0) continue;
      const jointRootIndex = boneGroup.bones[0];
      const jointRootEntity = gltfModel.asset.extras!.rnEntities![jointRootIndex];
      const vrmSpringBoneGroup = new VRMSpring(jointRootEntity.getSceneGraph());

      vrmSpringBoneGroup.tryToSetUniqueName(boneGroup.comment, true);
      vrmSpringBoneGroup.colliderGroups = boneGroup.colliderGroups.map(colliderGroupIndex => {
        return colliderGroups[colliderGroupIndex];
      });

      const addedEntities: ISceneGraphEntity[] = [];
      for (const idxOfArray in boneGroup.bones) {
        const boneNodeIndex = boneGroup.bones[idxOfArray];
        const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];

        // Find and add the missing joints from spring.joints.
        this.__addSpringBoneRecursively(vrmSpringBoneGroup, entity, boneGroup, addedEntities);
      }

      if (boneGroup.center != null && boneGroup.center !== -1) {
        vrmSpringBoneGroup.center = gltfModel.asset.extras!.rnEntities![boneGroup.center].getSceneGraph();
      }

      boneGroups.push(vrmSpringBoneGroup);
    }

    for (const boneGroup of boneGroups) {
      this.__addPhysicsComponent(boneGroup, boneGroup.rootBone);
    }
  }

  /**
   * Recursively adds spring bone physics to a bone chain and its children.
   * This method traverses the bone hierarchy and applies spring physics parameters
   * to create natural secondary motion effects.
   *
   * @param vrmSpring - The VRM spring bone group to add bones to
   * @param entity - The current entity in the bone hierarchy
   * @param boneGroup - The VRM bone group configuration data
   * @param addedEntities - Array to track already processed entities to avoid duplicates
   */
  private static __addSpringBoneRecursively(
    vrmSpring: VRMSpring,
    entity: ISceneGraphEntity,
    boneGroup: Vrm0xBoneGroup,
    addedEntities: ISceneGraphEntity[]
  ): void {
    const sg = entity.getSceneGraph();
    const children = sg.children;

    if (!addedEntities.includes(entity)) {
      const springBone = new VRMSpringBone(entity);
      springBone.dragForce = boneGroup.dragForce;
      springBone.stiffnessForce = boneGroup.stiffiness;
      springBone.gravityPower = boneGroup.gravityPower;
      springBone.gravityDir = Vector3.fromCopyArray([
        boneGroup.gravityDir.x,
        boneGroup.gravityDir.y,
        boneGroup.gravityDir.z,
      ]);
      springBone.hitRadius = boneGroup.hitRadius;
      vrmSpring.bones.push(springBone);
      addedEntities.push(entity);
    }

    for (const child of children) {
      this.__addSpringBoneRecursively(vrmSpring, child.entity, boneGroup, addedEntities);
    }
  }

  /**
   * Adds a physics component with VRM spring bone strategy to an entity.
   * This method sets up the physics simulation for spring bone motion,
   * attaching the appropriate strategy and configuration.
   *
   * @param boneGroup - The VRM spring bone group containing physics parameters
   * @param sg - The scene graph component to attach physics to
   */
  private static __addPhysicsComponent(boneGroup: VRMSpring, sg: SceneGraphComponent): void {
    const entity = sg.entity;
    const newEntity = EntityRepository.addComponentToEntity(PhysicsComponent, entity);
    const physicsComponent = newEntity.getPhysics();
    const strategy = new VRMSpringBonePhysicsStrategy();
    strategy.setSpring(boneGroup);
    physicsComponent.setStrategy(strategy);
  }

  /**
   * Creates Rhodonite texture objects from GLTF texture data.
   * This method processes all textures in the GLTF model and creates additional
   * dummy textures (white and black) commonly used in VRM materials.
   *
   * @param gltfModel - The GLTF model containing texture definitions
   * @returns A promise that resolves to an array of created textures
   */
  static async _createTextures(gltfModel: RnM2): Promise<Texture[]> {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnTextures: Texture[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = await ModelConverter._createTexture(gltfTextures[i].sourceObject!, gltfModel);
      rnTextures[i] = rnTexture;
    }

    const dummyWhiteTexture = new Texture();
    await dummyWhiteTexture.generate1x1TextureFrom();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture();
    await dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
    rnTextures.push(dummyBlackTexture);

    return rnTextures;
  }

  /**
   * Creates Rhodonite sampler objects from GLTF sampler data.
   * This method processes texture sampling configuration and creates additional
   * dummy samplers for textures that don't specify sampling parameters.
   *
   * @param gltfModel - The GLTF model containing sampler definitions
   * @returns An array of created sampler objects
   */
  static _createSamplers(gltfModel: RnM2): Sampler[] {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnSamplers: Sampler[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnSampler = ModelConverter._createSampler(gltfTextures[i].samplerObject!);
      rnSamplers[i] = rnSampler;
    }

    const dummySampler = new Sampler({
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
    });
    dummySampler.create();
    rnSamplers.push(dummySampler);
    rnSamplers.push(dummySampler);

    return rnSamplers;
  }

  /**
   * Checks if any materials in the VRM have outline rendering enabled.
   * This method examines material properties to determine if a separate
   * outline render pass is needed for toon-style rendering effects.
   *
   * @param extensionsVRM - The VRM extension data containing material properties
   * @returns True if outline materials are present, false otherwise
   */
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

  /**
   * Initializes VRM material properties with default values for missing parameters.
   * This method ensures all VRM materials have complete property sets,
   * particularly for MToon shader materials commonly used in VRM models.
   *
   * @param gltfModel - The GLTF model to process materials for
   * @param texturesLength - The total number of textures for dummy texture indexing
   */
  static _initializeMaterialProperties(gltfModel: RnM2, texturesLength: number): void {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;

    for (const materialProperty of materialProperties) {
      if (materialProperty.shader === 'VRM/MToon') {
        this.__initializeMToonMaterialProperties(gltfModel, texturesLength);
        break;
      }
    }
  }

  /**
   * Initializes MToon material properties with comprehensive default values.
   * MToon is the standard toon shader for VRM, and this method ensures all
   * required properties are set with appropriate defaults for proper rendering.
   *
   * @param gltfModel - The GLTF model containing MToon materials
   * @param texturesLength - The total number of textures for dummy texture assignment
   */
  private static __initializeMToonMaterialProperties(gltfModel: RnM2, texturesLength: number): void {
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
      this.__initializeForUndefinedProperty(floatProperties, '_IndirectLightIntensity', 0.1);
      this.__initializeForUndefinedProperty(floatProperties, '_LightColorAttenuation', 0.0);
      this.__initializeForUndefinedProperty(floatProperties, '_OutlineColorMode', 0.0);
      this.__initializeForUndefinedProperty(floatProperties, '_OutlineCullMode', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_OutlineLightingMix', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_OutlineScaledMaxDistance', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_OutlineWidth', 0.5);
      this.__initializeForUndefinedProperty(floatProperties, '_OutlineWidthMode', 0.0);
      this.__initializeForUndefinedProperty(floatProperties, '_ReceiveShadowRate', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_RimFresnelPower', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_RimLift', 0.0);
      this.__initializeForUndefinedProperty(floatProperties, '_RimLightingMix', 0.0);
      this.__initializeForUndefinedProperty(floatProperties, '_ShadeShift', 0.0);
      this.__initializeForUndefinedProperty(floatProperties, '_ShadeToony', 0.9);
      this.__initializeForUndefinedProperty(floatProperties, '_ShadingGradeRate', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_SrcBlend', 1.0);
      this.__initializeForUndefinedProperty(floatProperties, '_ZWrite', 1.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimScrollX", 0.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimScrollY", 0.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimRotation", 0.0);

      const vectorProperties = materialProperties[i].vectorProperties;
      this.__initializeForUndefinedProperty(vectorProperties, '_Color', [1, 1, 1, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, '_EmissionColor', [0, 0, 0]);
      this.__initializeForUndefinedProperty(vectorProperties, '_OutlineColor', [0, 0, 0, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, '_ShadeColor', [0.97, 0.81, 0.86, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, '_RimColor', [0, 0, 0]);
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
      this.__initializeForUndefinedProperty(textureProperties, '_BumpMap', dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, '_EmissionMap', dummyBlackTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, '_MainTex', dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, '_OutlineWidthTexture', dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, '_ReceiveShadowTexture', dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, '_RimTexture', dummyBlackTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, '_ShadeTexture', dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, '_ShadingGradeTexture', dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, '_SphereAdd', dummyBlackTextureNumber);
      // this.__initializeForUndefinedProperty(textureProperties, "_UvAnimMaskTexture", dummyWhiteTextureNumber);
    }

    for (let i = 0; i < gltfModel.materials.length; i++) {
      const material = gltfModel.materials[i];
      if (material.extras == null) {
        material.extras = {};
      }
      material.extras.vrm0xMaterialProperty = materialProperties[i];
    }
  }

  /**
   * Sets a default value for an object property if it's currently undefined.
   * This utility method is used throughout material initialization to ensure
   * all required properties have valid values.
   *
   * @param object - The object to check and potentially modify
   * @param propertyName - The name of the property to check
   * @param initialValue - The default value to set if the property is undefined
   */
  private static __initializeForUndefinedProperty(object: any, propertyName: string, initialValue: any): void {
    if (object[propertyName] == null) object[propertyName] = initialValue;
  }

  /**
   * Processes and validates GLTF load options for VRM import.
   * This method handles file extension conversion (.vrm to .glb), sets up
   * default material helpers, and configures VRM-specific import flags.
   *
   * @param options - The input load options to process
   * @returns Processed and validated load options with VRM-specific defaults
   */
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
      options.__isImportVRM0x = true;
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
        defaultMaterialHelperArgumentArray: [{ isLighting: true, isMorphing: true, isSkinning: true }],
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
        __isImportVRM0x: true,
        __importedType: 'vrm0x',
      };
    }

    return options;
  }
}

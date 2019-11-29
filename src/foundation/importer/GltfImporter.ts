import Entity from "../core/Entity";
import EntityRepository from "../core/EntityRepository";
import detectFormat from "./FormatDetector";
import Gltf2Importer from "./Gltf2Importer";
import { GltfLoadOption, glTF2 } from "../../types/glTF";
import ModelConverter from "./ModelConverter";
import PhysicsComponent from "../components/PhysicsComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import SphereCollider from "../physics/SphereCollider";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import VRMColliderGroup from "../physics/VRMColliderGroup";
import VRMSpringBoneGroup from "../physics/VRMSpringBoneGroup";
import VRMSpringBonePhysicsStrategy from "../physics/VRMSpringBonePhysicsStrategy";
import Gltf1Importer from "./Gltf1Importer";
import DrcPointCloudImporter from "./DrcPointCloudImporter";
import Expression from "../renderer/Expression";
import RenderPass from "../renderer/RenderPass";
import { VRM } from "../../types/VRM";

/**
 * Importer class which can import GLTF and VRM.
 */
export default class GltfImporter {
  private static __instance: GltfImporter;

  private constructor() { }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new GltfImporter();
    }
    return this.__instance;
  }

  /**
   * For VRM file only
   * Generate JSON.
   */
  async importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<VRM> {
    options = this.__getOptions(options);

    const gltf2Importer = Gltf2Importer.getInstance();
    return gltf2Importer.import(uri, options);
  }

  /**
   * Import GLTF or VRM file.
   */
  async import(uri: string, options?: GltfLoadOption): Promise<Expression> {

    const renderPasses: RenderPass[] = await this.__importModel(uri, options);

    if (options && options.cameraComponent) {
      for (let renderPass of renderPasses) {
        renderPass.cameraComponent = options.cameraComponent;
      }
    }

    const expression = new Expression();
    expression.addRenderPasses(renderPasses);
    return expression;

  }

  private async __importModel(uri: string, options?: GltfLoadOption): Promise<RenderPass[]> {

    let fileType: string;
    if (options != null && options.files != null) {
      fileType = await detectFormat(uri, options.files) as string;
    } else {
      fileType = await detectFormat(uri) as string;
    }

    let importer: any, gltfModel: any, renderPasses: RenderPass[];
    switch (fileType) {
      case 'glTF1':
        importer = Gltf1Importer.getInstance();
        gltfModel = await importer.import(uri, options);
        renderPasses = this.__setupRenderPasses(gltfModel);
        break;
      case 'glTF2':
        importer = Gltf2Importer.getInstance();
        gltfModel = await importer.import(uri, options);
        renderPasses = this.__setupRenderPasses(gltfModel);
        break;
      case 'Draco':
        importer = DrcPointCloudImporter.getInstance();
        gltfModel = await importer.importPointCloud(uri, options);
        renderPasses = this.__setupRenderPasses(gltfModel);
        break;
      case 'VRM':
        renderPasses = await this.__importVRM(uri, options);
        break;
      default:
        renderPasses = [];
        console.error('detect invalid format');
    }

    return renderPasses;
  }

  private __setupRenderPasses(gltfModel: any): RenderPass[] {
    const modelConverter = ModelConverter.getInstance();
    const rootGroup = modelConverter.convertToRhodoniteObject(gltfModel);

    const renderPass = new RenderPass();
    renderPass.addEntities([rootGroup]);

    return [renderPass];
  }

  private async __importVRM(uri: string, options?: GltfLoadOption): Promise<RenderPass[]> {
    options = this.__getOptions(options)
    const gltf2Importer = Gltf2Importer.getInstance();
    const gltfModel = await gltf2Importer.import(uri, options);

    const textures = this.__createTextures(gltfModel);
    const defaultMaterialHelperArgumentArray = gltfModel.asset.extras.rnLoaderOptions.defaultMaterialHelperArgumentArray;
    defaultMaterialHelperArgumentArray[0].textures = textures;

    this.__initializeMaterialProperties(gltfModel, textures.length);

    const renderPassMain = new RenderPass();

    // setup renderPasses and rootGroup
    let renderPasses;
    let rootGroup;
    const modelConverter = ModelConverter.getInstance();
    const existOutline = this.__existOutlineMaterial(gltfModel.extensions.VRM);
    if (!existOutline) {
      rootGroup = modelConverter.convertToRhodoniteObject(gltfModel);
      renderPasses = [renderPassMain];
    } else {
      const renderPassOutline = new RenderPass();
      renderPassOutline.toClearColorBuffer = false;
      renderPassOutline.toClearDepthBuffer = false;
      gltfModel.extensions.VRM.rnExtension = { renderPassOutline: renderPassOutline };

      rootGroup = modelConverter.convertToRhodoniteObject(gltfModel);
      renderPassOutline.addEntities([rootGroup]);

      renderPasses = [renderPassMain, renderPassOutline];
    }

    renderPassMain.addEntities([rootGroup]);

    this.readSpringBone(rootGroup, gltfModel);
    this.readVRMHumanoidInfo(rootGroup, gltfModel);

    return renderPasses;
  }

  private __getOptions(options: GltfLoadOption | undefined): GltfLoadOption {
    if (options != null) {
      for (let file in options.files) {
        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[fileName + '.glb'] = arraybuffer;
          delete options.files[file];
        }
      }

      //set default values
      options.isImportVRM = true;
      if (options.defaultMaterialHelperArgumentArray == null) {
        options.defaultMaterialHelperArgumentArray = [{}];
      }

      if (!options.defaultMaterialHelperArgumentArray[0].isMorphing) {
        options.maxMorphTargetNumber = 0;
      }

    } else {
      options = {
        files: {},
        loaderExtension: null,
        defaultMaterialHelperName: null,
        defaultMaterialHelperArgumentArray: [{ isLighting: true, isMorphing: true, isSkinning: true }],
        statesOfElements: [
          {
            targets: [],
            states: {
              enable: [],
              functions: {}
            },
            isTransparent: true,
            opacity: 1.0,
            isTextureImageToLoadPreMultipliedAlpha: false,
          }
        ],
        isImportVRM: true,
      };
    }

    return options;
  }

  private readVRMHumanoidInfo(rootEntity: Entity, gltfModel: VRM): void {
    const humanBones = gltfModel.extensions.VRM.humanoid.humanBones;
    const mapNameNodeId: Map<string, number> = new Map();
    for (let bone of humanBones) {
      mapNameNodeId.set(bone.bone, bone.node);
    }
    rootEntity.tryToSetTag({
      tag: 'humanoid_map_name_nodeId',
      value: mapNameNodeId
    });
  }

  private readSpringBone(rootEntity: Entity, gltfModel: VRM): void {
    const entityRepository = EntityRepository.getInstance();
    const boneGroups: VRMSpringBoneGroup[] = [];
    for (let boneGroup of gltfModel.extensions.VRM.secondaryAnimation.boneGroups) {
      const vrmSpringBoneGroup = new VRMSpringBoneGroup();
      vrmSpringBoneGroup.tryToSetUniqueName(boneGroup.comment, true);
      vrmSpringBoneGroup.dragForce = boneGroup.dragForce;
      vrmSpringBoneGroup.stiffnessForce = boneGroup.stiffness;
      vrmSpringBoneGroup.gravityPower = boneGroup.gravityPower;
      vrmSpringBoneGroup.gravityDir = new Vector3(boneGroup.gravityDir.x, boneGroup.gravityDir.y, boneGroup.gravityDir.z);
      vrmSpringBoneGroup.colliderGroupIndices = boneGroup.colliderGroups;
      vrmSpringBoneGroup.hitRadius = boneGroup.hitRadius;
      for (let idxOfArray in boneGroup.bones) {
        const boneNodeIndex = boneGroup.bones[idxOfArray];
        const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        vrmSpringBoneGroup.rootBones.push(entity.getSceneGraph());
        // const boneNodeIndex = boneGroup.bones[idxOfArray];
        // const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        // entityRepository.addComponentsToEntity([PhysicsComponent], entity.entityUID);
      }
      boneGroups.push(vrmSpringBoneGroup);
    }

    VRMSpringBonePhysicsStrategy.setBoneGroups(boneGroups)
    for (let boneGroup of boneGroups) {
      for (let sg of boneGroup.rootBones) {
        this.addPhysicsComponentRecursively(entityRepository, sg);
      }
    }

    const colliderGroups: VRMColliderGroup[] = [];
    for (let colliderGroupIdx in gltfModel.extensions.VRM.secondaryAnimation.colliderGroups) {
      const colliderGroup = gltfModel.extensions.VRM.secondaryAnimation.colliderGroups[colliderGroupIdx]
      const vrmColliderGroup = new VRMColliderGroup();
      colliderGroups.push(vrmColliderGroup);
      const colliders: SphereCollider[] = [];
      for (let collider of colliderGroup.colliders) {
        const sphereCollider = new SphereCollider();
        sphereCollider.position = new Vector3(collider.offset.x, collider.offset.y, collider.offset.z);
        sphereCollider.radius = collider.radius;
        colliders.push(sphereCollider);
      }
      vrmColliderGroup.colliders = colliders;
      const baseSg = gltfModel.asset.extras!.rnEntities![colliderGroup.node].getSceneGraph();
      vrmColliderGroup.baseSceneGraph = baseSg;
      VRMSpringBonePhysicsStrategy.addColliderGroup(parseInt(colliderGroupIdx), vrmColliderGroup);
    }

  }

  private addPhysicsComponentRecursively(entityRepository: EntityRepository, sg: SceneGraphComponent): void {
    const entity = sg.entity;
    entityRepository.addComponentsToEntity([PhysicsComponent], entity.entityUID);
    VRMSpringBonePhysicsStrategy.initialize(sg);
    if (sg.children.length > 0) {
      for (let child of sg.children) {
        this.addPhysicsComponentRecursively(entityRepository, child);
      }
    }
  }

  private __createTextures(gltfModel: glTF2): Texture[] {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnTextures: Texture[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = ModelConverter._createTexture({ texture: gltfTextures[i] }, gltfModel);
      rnTextures[i] = rnTexture;
    }

    const dummyWhiteTexture = new Texture();
    dummyWhiteTexture.generate1x1TextureFrom();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture();
    dummyBlackTexture.generate1x1TextureFrom("rgba(0, 0, 0, 1)");
    rnTextures.push(dummyBlackTexture);

    return rnTextures;
  }

  private __existOutlineMaterial(extensionsVRM: any): boolean {
    const materialProperties = extensionsVRM.materialProperties;
    if (materialProperties != null) {
      for (let materialProperty of materialProperties) {
        if (materialProperty.floatProperties._OutlineWidthMode !== 0) {
          return true;
        }
      }
    }

    return false;
  }

  private __initializeMaterialProperties(gltfModel: glTF2, texturesLength: number): void {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;

    for (let materialProperty of materialProperties) {
      if (materialProperty.shader === "VRM/MToon") {
        this.__initializeMToonMaterialProperties(gltfModel, texturesLength);
        break;
      }
    }

  }

  private __initializeMToonMaterialProperties(gltfModel: glTF2, texturesLength: number): void {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;

    const dummyWhiteTextureNumber = texturesLength - 2;
    const dummyBlackTextureNumber = texturesLength - 1;

    for (let i = 0; i < materialProperties.length; i++) {
      const floatProperties = materialProperties[i].floatProperties;
      this.__initializeForUndefinedProperty(floatProperties, "_BlendMode", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_BumpScale", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_CullMode", 2.0);
      this.__initializeForUndefinedProperty(floatProperties, "_Cutoff", 0.5);
      this.__initializeForUndefinedProperty(floatProperties, "_DebugMode", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_DstBlend", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_IndirectLightIntensity", 0.1);
      this.__initializeForUndefinedProperty(floatProperties, "_LightColorAttenuation", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineColorMode", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineCullMode", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineLightingMix", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineScaledMaxDistance", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineWidth", 0.5);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineWidthMode", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_ReceiveShadowRate", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_RimFresnelPower", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_RimLift", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_RimLightingMix", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadeShift", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadeToony", 0.9);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadingGradeRate", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_SrcBlend", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_ZWrite", 1.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimScrollX", 0.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimScrollY", 0.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimRotation", 0.0);

      const vectorProperties = materialProperties[i].vectorProperties;
      this.__initializeForUndefinedProperty(vectorProperties, "_Color", [1, 1, 1, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_EmissionColor", [0, 0, 0]);
      this.__initializeForUndefinedProperty(vectorProperties, "_OutlineColor", [0, 0, 0, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_ShadeColor", [0.97, 0.81, 0.86, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_RimColor", [0, 0, 0]);
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
      this.__initializeForUndefinedProperty(textureProperties, "_BumpMap", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_EmissionMap", dummyBlackTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_MainTex", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_OutlineWidthTexture", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_ReceiveShadowTexture", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_RimTexture", dummyBlackTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_ShadeTexture", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_ShadingGradeTexture", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_SphereAdd", dummyBlackTextureNumber);
      // this.__initializeForUndefinedProperty(textureProperties, "_UvAnimMaskTexture", dummyWhiteTextureNumber);
    }
  }

  private __initializeForUndefinedProperty(object: any, propertyName: string, initialValue: any): void {
    if (object[propertyName] == null) object[propertyName] = initialValue;
  }

}
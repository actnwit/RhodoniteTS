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
import TransformComponent from "../components/TransformComponent";
import CameraComponent from "../components/CameraComponent";
import Expression from "../renderer/Expression";
import RenderPass from "../renderer/RenderPass";
import CameraControllerComponent from "../components/CameraControllerComponent";
import OrbitCameraController from "../cameras/OrbitCameraController";
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

    const defaultMaterialHelperArgumentArray = gltfModel.asset.extras.rnLoaderOptions.defaultMaterialHelperArgumentArray;
    gltfModel.extensions.VRM.rnExtension = {
      defaultMorphingIsTrue: defaultMaterialHelperArgumentArray[0].isMorphing === true,
      defaultSkinningIsTrue: defaultMaterialHelperArgumentArray[0].isSkinning === true
    };

    const textures = this.__createTextures(gltfModel);
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
      gltfModel.extensions.VRM.rnExtension.renderPassOutline = renderPassOutline;

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

      if (options.defaultMaterialHelperArgumentArray[0].isLighting == null) {
        options.defaultMaterialHelperArgumentArray[0].isLighting = true;
      }
      if (options.defaultMaterialHelperArgumentArray[0].isMorphing == null) {
        options.defaultMaterialHelperArgumentArray[0].isMorphing = true;
      }
      if (options.defaultMaterialHelperArgumentArray[0].isSkinning == null) {
        options.defaultMaterialHelperArgumentArray[0].isSkinning = true;
      }

      if (options.defaultMaterialHelperArgumentArray[0].isMorphing === false) {
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
      vrmSpringBoneGroup.stiffnessForce = boneGroup.stiffiness;
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

    const utsMaterialPropertiesArray = extensionsVRM.rnExtension.utsMaterialPropertiesArray;
    if (utsMaterialPropertiesArray != null) {
      for (let materialProperties of utsMaterialPropertiesArray) {
        if (materialProperties[0][71] !== 0) {
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

    //TODO: do not attach materialPropertiesArray for uts shader
    let utsMaterialPropertiesArray = null;
    for (let materialProperty of materialProperties) {
      if (materialProperty.shader.indexOf("UnityChanToonShader") >= 0) {
        utsMaterialPropertiesArray = this.__createUTSMaterialPropertiesArray(gltfModel, texturesLength);
        break;
      }
    }

    gltfModel.extensions.VRM.rnExtension.utsMaterialPropertiesArray = utsMaterialPropertiesArray;
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

  private __createUTSMaterialPropertiesArray(gltfModel: glTF2, texturesLength: number) {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;
    const materialPropertiesArray: any = [];

    const dummyWhiteTextureNumber = texturesLength - 2;
    const dummyBlackTextureNumber = texturesLength - 1;

    for (let i = 0; i < materialProperties.length; i++) {
      // ----------------------------------------------------------------------------------
      const floatProperties = materialProperties[i].floatProperties;
      const floatPropertiesArray: number[] = [];
      console.log("before " + floatProperties["_Use_BaseAs1st"]);

      floatPropertiesArray[0] = (floatProperties["_IsBaseMapAlphaAsClippingMask"] != null ? floatProperties["_IsBaseMapAlphaAsClippingMask"] : 0.0);
      floatPropertiesArray[1] = (floatProperties["_Inverse_Clipping"] != null ? floatProperties["_Inverse_Clipping"] : 0.0);
      floatPropertiesArray[2] = (floatProperties["_Is_LightColor_Base"] != null ? floatProperties["_Is_LightColor_Base"] : 1.0);

      floatPropertiesArray[3] = (floatProperties["_Use_BaseAs1st"] != null ? floatProperties["_Use_BaseAs1st"] : 0.0);
      floatPropertiesArray[4] = (floatProperties["_Is_LightColor_1st_Shade"] != null ? floatProperties["_Is_LightColor_1st_Shade"] : 1.0);
      floatPropertiesArray[5] = (floatProperties["_Use_1stAs2nd"] != null ? floatProperties["_Use_1stAs2nd"] : 0.0);
      floatPropertiesArray[6] = (floatProperties["_Is_LightColor_2nd_Shade"] != null ? floatProperties["_Is_LightColor_2nd_Shade"] : 1.0);

      floatPropertiesArray[7] = (floatProperties["_Is_NormalMapToBase"] != null ? floatProperties["_Is_NormalMapToBase"] : 0.0);

      floatPropertiesArray[8] = (floatProperties["_Set_SystemShadowsToBase"] != null ? floatProperties["_Set_SystemShadowsToBase"] : 1.0);
      floatPropertiesArray[9] = (floatProperties["_Is_Filter_HiCutPointLightColor"] != null ? floatProperties["_Is_Filter_HiCutPointLightColor"] : 1.0);
      floatPropertiesArray[10] = (floatProperties["_Is_LightColor_HighColor"] != null ? floatProperties["_Is_LightColor_HighColor"] : 1.0);
      floatPropertiesArray[11] = (floatProperties["_Is_NormalMapToHighColor"] != null ? floatProperties["_Is_NormalMapToHighColor"] : 0.0);
      floatPropertiesArray[12] = (floatProperties["_Is_SpecularToHighColor"] != null ? floatProperties["_Is_SpecularToHighColor"] : 0.0);
      // -------------------------------------------------------------- 
      // FIXME: enable this line cause RangeError on some model
      // floatPropertiesArray[13] = (floatProperties["_Is_BlendAddToHiColor"]           != null ? floatProperties["_Is_BlendAddToHiColor"]        : 0.0);
      // -------------------------------------------------------------- 
      // Buffer.ts:36 Uncaught (in promise) RangeError: Invalid typed array length: 227312
      //   at new Uint8Array (<anonymous>)
      //   at Buffer.takeBufferView (Buffer.ts:36)
      //   at ModelConverter.__copyRnAccessorAndBufferView (ModelConverter.ts:935)
      //   at ModelConverter.__setupMesh (ModelConverter.ts:466)
      //   at ModelConverter.__setupObjects (ModelConverter.ts:311)
      //   at ModelConverter.convertToRhodoniteObject (ModelConverter.ts:131)
      //   at VRMImporter.eval (ToonVRMImporter.ts:105)
      //   at Generator.next (<anonymous>)
      //   at fulfilled (ToonVRMImporter.ts:16)
      floatPropertiesArray[13] = 0.0;
      floatPropertiesArray[14] = (floatProperties["_Is_UseTweakHighColorOnShadow"] != null ? floatProperties["_Is_UseTweakHighColorOnShadow"] : 0.0);

      floatPropertiesArray[15] = (floatProperties["_Is_LightColor_RimLight"] != null ? floatProperties["_Is_LightColor_RimLight"] : 1.0);
      floatPropertiesArray[16] = (floatProperties["_Is_NormalMapToRimLight"] != null ? floatProperties["_Is_NormalMapToRimLight"] : 0.0);
      floatPropertiesArray[17] = (floatProperties["_Is_LightColor_Ap_RimLight"] != null ? floatProperties["_Is_LightColor_Ap_RimLight"] : 1.0);
      floatPropertiesArray[18] = (floatProperties["_Is_LightColor_MatCap"] != null ? floatProperties["_Is_LightColor_MatCap"] : 1.0);
      floatPropertiesArray[19] = (floatProperties["_Is_BlendAddToMatCap"] != null ? floatProperties["_Is_BlendAddToMatCap"] : 1.0);

      floatPropertiesArray[20] = (floatProperties["_CameraRolling_Stabilizer"] != null ? floatProperties["_CameraRolling_Stabilizer"] : 0.0);
      floatPropertiesArray[21] = (floatProperties["_Is_NormalMapForMatCap"] != null ? floatProperties["_Is_NormalMapForMatCap"] : 0.0);
      floatPropertiesArray[22] = (floatProperties["_Is_UseTweakMatCapOnShadow"] != null ? floatProperties["_Is_UseTweakMatCapOnShadow"] : 0.0);
      floatPropertiesArray[23] = (floatProperties["_Is_Ortho"] != null ? floatProperties["_Is_Ortho"] : 0.0);
      floatPropertiesArray[24] = (floatProperties["_Is_PingPong_Base"] != null ? floatProperties["_Is_PingPong_Base"] : 0.0);
      floatPropertiesArray[25] = (floatProperties["_Is_ColorShift"] != null ? floatProperties["_Is_ColorShift"] : 0.0);
      floatPropertiesArray[26] = (floatProperties["_Is_ViewShift"] != null ? floatProperties["_Is_ViewShift"] : 0.0);
      floatPropertiesArray[27] = (floatProperties["_Is_ViewCoord_Scroll"] != null ? floatProperties["_Is_ViewCoord_Scroll"] : 0.0);

      floatPropertiesArray[28] = (floatProperties["_RimLight"] != null ? floatProperties["_RimLight"] : 0.0);
      floatPropertiesArray[29] = (floatProperties["_RimLight_FeatherOff"] != null ? floatProperties["_RimLight_FeatherOff"] : 0.0);
      floatPropertiesArray[30] = (floatProperties["_LightDirection_MaskOn"] != null ? floatProperties["_LightDirection_MaskOn"] : 0.0);
      floatPropertiesArray[31] = (floatProperties["_Add_Antipodean_RimLight"] != null ? floatProperties["_Add_Antipodean_RimLight"] : 0.0);
      floatPropertiesArray[32] = (floatProperties["_Ap_RimLight_FeatherOff"] != null ? floatProperties["_Ap_RimLight_FeatherOff"] : 0.0);
      floatPropertiesArray[33] = (floatProperties["_MatCap"] != null ? floatProperties["_MatCap"] : 0.0);
      floatPropertiesArray[34] = (floatProperties["_Inverse_MatcapMask"] != null ? floatProperties["_Inverse_MatcapMask"] : 0.0);
      floatPropertiesArray[35] = (floatProperties["_Is_BlendBaseColor"] != null ? floatProperties["_Is_BlendBaseColor"] : 0.0);
      floatPropertiesArray[36] = (floatProperties["_Is_LightColor_Outline"] != null ? floatProperties["_Is_LightColor_Outline"] : 1.0);
      floatPropertiesArray[37] = (floatProperties["_Is_OutlineTex"] != null ? floatProperties["_Is_OutlineTex"] : 0.0);
      floatPropertiesArray[38] = (floatProperties["_Is_BakedNormal"] != null ? floatProperties["_Is_BakedNormal"] : 0.0);
      floatPropertiesArray[39] = (floatProperties["_Is_Filter_LightColor"] != null ? floatProperties["_Is_Filter_LightColor"] : 0.0);

      floatPropertiesArray[40] = (floatProperties["_Clipping_Level"] != null ? floatProperties["_Clipping_Level"] : 0.0);
      floatPropertiesArray[41] = (floatProperties["_BumpScale"] != null ? floatProperties["_BumpScale"] : 1.0);
      floatPropertiesArray[42] = (floatProperties["_Tweak_SystemShadowsLevel"] != null ? floatProperties["_Tweak_SystemShadowsLevel"] : 0.0);

      floatPropertiesArray[43] = (floatProperties["_1st_ShadeColor_Step"] != null ? floatProperties["_1st_ShadeColor_Step"] : 0.5);
      floatPropertiesArray[44] = (floatProperties["_1st_ShadeColor_Feather"] != null ? floatProperties["_1st_ShadeColor_Feather"] : 0.0001);
      floatPropertiesArray[45] = (floatProperties["_2nd_ShadeColor_Step"] != null ? floatProperties["_2nd_ShadeColor_Step"] : 0.0);
      floatPropertiesArray[46] = (floatProperties["_2nd_ShadeColor_Feather"] != null ? floatProperties["_2nd_ShadeColor_Feather"] : 0.0001);
      floatPropertiesArray[47] = (floatProperties["_StepOffset"] != null ? floatProperties["_StepOffset"] : 0.0);
      floatPropertiesArray[48] = (floatProperties["_Tweak_ShadingGradeMapLevel"] != null ? floatProperties["_Tweak_ShadingGradeMapLevel"] : 0.0);
      floatPropertiesArray[49] = (floatProperties["_BlurLevelSGM"] != null ? floatProperties["_BlurLevelSGM"] : 0.0);
      floatPropertiesArray[50] = (floatProperties["_HighColor_Power"] != null ? floatProperties["_HighColor_Power"] : 0.0);

      floatPropertiesArray[51] = (floatProperties["_TweakHighColorOnShadow"] != null ? floatProperties["_TweakHighColorOnShadow"] : 0.0);
      floatPropertiesArray[52] = (floatProperties["_Tweak_HighColorMaskLevel"] != null ? floatProperties["_Tweak_HighColorMaskLevel"] : 0.0);
      floatPropertiesArray[53] = (floatProperties["_RimLight_Power"] != null ? floatProperties["_RimLight_Power"] : 0.1);
      floatPropertiesArray[54] = (floatProperties["_RimLight_InsideMask"] != null ? floatProperties["_RimLight_InsideMask"] : 0.0001);
      floatPropertiesArray[55] = (floatProperties["_Tweak_LightDirection_MaskLevel"] != null ? floatProperties["_Tweak_LightDirection_MaskLevel"] : 0.0);
      floatPropertiesArray[56] = (floatProperties["_Ap_RimLight_Power"] != null ? floatProperties["_Ap_RimLight_Power"] : 0.1);
      floatPropertiesArray[57] = (floatProperties["_Tweak_RimLightMaskLevel"] != null ? floatProperties["_Tweak_RimLightMaskLevel"] : 0.0);
      floatPropertiesArray[58] = (floatProperties["_BlurLevelMatcap"] != null ? floatProperties["_BlurLevelMatcap"] : 0.0);
      floatPropertiesArray[59] = (floatProperties["_Tweak_MatCapUV"] != null ? floatProperties["_Tweak_MatCapUV"] : 0.0);
      floatPropertiesArray[60] = (floatProperties["_Rotate_MatCapUV"] != null ? floatProperties["_Rotate_MatCapUV"] : 0.0);
      floatPropertiesArray[61] = (floatProperties["_BumpScaleMatcap"] != null ? floatProperties["_BumpScaleMatcap"] : 1.0);
      floatPropertiesArray[62] = (floatProperties["_Rotate_NormalMapForMatCapUV"] != null ? floatProperties["_Rotate_NormalMapForMatCapUV"] : 0.0);
      floatPropertiesArray[63] = (floatProperties["_TweakMatCapOnShadow"] != null ? floatProperties["_TweakMatCapOnShadow"] : 0.0);
      floatPropertiesArray[64] = (floatProperties["_Tweak_MatcapMaskLevel"] != null ? floatProperties["_Tweak_MatcapMaskLevel"] : 0.0);
      floatPropertiesArray[65] = (floatProperties["_Base_Speed"] != null ? floatProperties["_Base_Speed"] : 0.0);
      floatPropertiesArray[66] = (floatProperties["_Scroll_EmissiveU"] != null ? floatProperties["_Scroll_EmissiveU"] : 0.0);
      floatPropertiesArray[67] = (floatProperties["_Scroll_EmissiveV"] != null ? floatProperties["_Scroll_EmissiveV"] : 0.0);
      floatPropertiesArray[68] = (floatProperties["_Rotate_EmissiveUV"] != null ? floatProperties["_Rotate_EmissiveUV"] : 0.0);
      floatPropertiesArray[69] = (floatProperties["_ColorShift_Speed"] != null ? floatProperties["_ColorShift_Speed"] : 0.0);
      floatPropertiesArray[70] = (floatProperties["_Tweak_transparency"] != null ? floatProperties["_Tweak_transparency"] : 0.0);  // range(-1, 1)

      floatPropertiesArray[71] = (floatProperties["_Outline_Width"] != null ? floatProperties["_Outline_Width"] : 0.0);

      // ----------------------------------------------------------------------------------
      const vectorProperties = materialProperties[i].vectorProperties;
      const vectorPropertiesArray: any[] = [];
      vectorPropertiesArray[0] = (vectorProperties["_Color"] != null ? vectorProperties["_Color"] : [1, 1, 1, 1]);
      vectorPropertiesArray[1] = (vectorProperties["_BaseColor"] != null ? vectorProperties["_BaseColor"] : [1, 1, 1, 1]);
      vectorPropertiesArray[2] = (vectorProperties["_1st_ShadeColor"] != null ? vectorProperties["_1st_ShadeColor"] : [1, 1, 1, 1]);
      vectorPropertiesArray[3] = (vectorProperties["_2nd_ShadeColor"] != null ? vectorProperties["_2nd_ShadeColor"] : [1, 1, 1, 1]);
      vectorPropertiesArray[4] = (vectorProperties["_HighColor"] != null ? vectorProperties["_HighColor"] : [0, 0, 0, 1]);

      vectorPropertiesArray[5] = (vectorProperties["_RimLightColor"] != null ? vectorProperties["_RimLightColor"] : [1, 1, 1, 1]);
      vectorPropertiesArray[6] = (vectorProperties["_Ap_RimLightColor"] != null ? vectorProperties["_Ap_RimLightColor"] : [1, 1, 1, 1]);
      vectorPropertiesArray[7] = (vectorProperties["_MatCapColor"] != null ? vectorProperties["_MatCapColor"] : [1, 1, 1, 1]);
      vectorPropertiesArray[8] = (vectorProperties["_Emissive_Color"] != null ? vectorProperties["_Emissive_Color"] : [0, 0, 0, 1]);
      vectorPropertiesArray[9] = (vectorProperties["_ColorShift"] != null ? vectorProperties["_ColorShift"] : [0, 0, 0, 1]);
      vectorPropertiesArray[10] = (vectorProperties["_ViewShift"] != null ? vectorProperties["_ViewShift"] : [0, 0, 0, 1]);
      vectorPropertiesArray[11] = (vectorProperties["_Outline_Color"] != null ? vectorProperties["_Outline_Color"] : [0.5, 0.5, 0.5, 1]);

      // ----------------------------------------------------------------------------------
      // do not set initial value

      const textureProperties = materialProperties[i].textureProperties;
      const texturePropertiesArray: any[] = [];

      texturePropertiesArray[0] = (textureProperties["_MainTex"] != null ? textureProperties["_MainTex"] : dummyWhiteTextureNumber);
      texturePropertiesArray[1] = (textureProperties["_1st_ShadeMap"] != null ? textureProperties["_1st_ShadeMap"] : dummyWhiteTextureNumber);
      texturePropertiesArray[2] = (textureProperties["_2nd_ShadeMap"] != null ? textureProperties["_2nd_ShadeMap"] : dummyWhiteTextureNumber);

      texturePropertiesArray[3] = (textureProperties["_ShadingGradeMap"] != null ? textureProperties["_ShadingGradeMap"] : dummyWhiteTextureNumber);

      texturePropertiesArray[4] = (textureProperties["_ClippingMask"] != null ? textureProperties["_ClippingMask"] : dummyWhiteTextureNumber);
      texturePropertiesArray[5] = (textureProperties["_NormalMap"] != null ? textureProperties["_NormalMap"] : dummyBlackTextureNumber);
      texturePropertiesArray[6] = (textureProperties["_HighColor_Tex"] != null ? textureProperties["_HighColor_Tex"] : dummyBlackTextureNumber);

      texturePropertiesArray[7] = (textureProperties["_Set_HighColorMask"] != null ? textureProperties["_Set_HighColorMask"] : dummyBlackTextureNumber);
      texturePropertiesArray[8] = (textureProperties["_Set_RimLightMask"] != null ? textureProperties["_Set_RimLightMask"] : dummyBlackTextureNumber);
      texturePropertiesArray[9] = (textureProperties["_MatCap_Sampler"] != null ? textureProperties["_MatCap_Sampler"] : dummyBlackTextureNumber);
      texturePropertiesArray[10] = (textureProperties["_NormalMapForMatCap"] != null ? textureProperties["_NormalMapForMatCap"] : dummyBlackTextureNumber);
      texturePropertiesArray[11] = (textureProperties["_Set_MatcapMask"] != null ? textureProperties["_Set_MatcapMask"] : dummyBlackTextureNumber);
      texturePropertiesArray[12] = (textureProperties["_Emissive_Tex"] != null ? textureProperties["_Emissive_Tex"] : dummyBlackTextureNumber);
      texturePropertiesArray[13] = (textureProperties["_Outline_Sampler"] != null ? textureProperties["_Outline_Sampler"] : dummyBlackTextureNumber);
      texturePropertiesArray[14] = (textureProperties["_OutlineTex"] != null ? textureProperties["_OutlineTex"] : dummyBlackTextureNumber);
      texturePropertiesArray[15] = (textureProperties["_BakedNormal"] != null ? textureProperties["_BakedNormal"] : dummyBlackTextureNumber);

      materialPropertiesArray.push([floatPropertiesArray, vectorPropertiesArray, texturePropertiesArray]);
      console.log("res " + floatPropertiesArray[3]);

    }

    return materialPropertiesArray;
  }

}
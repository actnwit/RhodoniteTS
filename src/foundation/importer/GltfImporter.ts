import Entity from "../core/Entity";
import EntityRepository from "../core/EntityRepository";
import detectFormat from "./FormatDetector";
import Gltf2Importer from "./Gltf2Importer";
import { GltfLoadOption, glTF2 } from "../../commontypes/glTF";
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
import { VRM } from "../../commontypes/VRM";
import DataUtil from "../misc/DataUtil";

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
    options = this._getOptions(options);

    const gltf2Importer = Gltf2Importer.getInstance();
    const gltfModel = await gltf2Importer.import(uri, options);
    this._readVRMHumanoidInfo(gltfModel);
    return gltfModel;
  }

  /**
   * Import GLTF or VRM file.
   * @param uris uri or array of uri of glTF file
   * @param options options for loading process where if you use files option, key name of files must be uri of the value array buffer
   * @returns gltf expression where:
   *            renderPasses[0]: model entities
   *            renderPasses[1]: model outlines
   */
  async import(uris: string | string[], options?: GltfLoadOption): Promise<Expression> {
    if (!Array.isArray(uris)) {
      uris = [uris];
    }
    options = this.__initOptions(options);

    const renderPasses: RenderPass[] = await this.__importMultipleModels(uris, options);

    if (options && options.cameraComponent) {
      for (let renderPass of renderPasses) {
        renderPass.cameraComponent = options.cameraComponent;
      }
    }

    return this.__setRenderPassesToExpression(renderPasses, options);
  }

  private __initOptions(options?: GltfLoadOption): GltfLoadOption {
    if (options == null) {
      options = DataUtil.createDefaultGltfOptions();
    } else {
      if (options.files == null) {
        options.files = {}
      }

      for (let file in options.files) {
        if (file.match(/.*\.vrm$/) == null) {
          continue;
        }

        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[fileName + '.glb'] = arraybuffer;
          delete options.files[file];
        }
      }

      if (Array.isArray(options.defaultMaterialHelperArgumentArray) === false) {
        options.defaultMaterialHelperArgumentArray = [{}];
      } else {
        // avoid needless processing
        if (options.defaultMaterialHelperArgumentArray[0]?.isMorphing === false) {
          options.maxMorphTargetNumber = 0;
        }
      }

    }


    return options
  }

  private __setRenderPassesToExpression(renderPasses: RenderPass[], options: GltfLoadOption) {
    const expression = options.expression ?? new Expression();

    if (expression.renderPasses !== renderPasses) {
      expression.clearRenderPasses();
      expression.addRenderPasses(renderPasses);
    }

    return expression;
  }

  private __importMultipleModels(uris: string[], options: GltfLoadOption): Promise<RenderPass[]> {
    const importPromises = [];
    const renderPasses = options.expression?.renderPasses || [];
    if (renderPasses.length === 0) {
      renderPasses.push(new RenderPass());
    }

    for (let fileName in options.files) { // filename is uri
      const fileExtension = DataUtil.getExtension(fileName);
      if (this.__isValidExtension(fileExtension)) {
        importPromises.push(this.__importToRenderPassesFromArrayBufferPromise(fileName, renderPasses, options, fileName));
      }
    }

    for (let uri of uris) {
      if (uri.length === 0 || options.files[uri] != null) {
        // import from uri where the file is not fetched yet
        continue;
      }

      importPromises.push(this.__importToRenderPassesFromUriPromise(uri, renderPasses, options));
    }

    return Promise.all(importPromises).then(() => {
      return renderPasses;
    });
  }

  private __isValidExtension(fileExtension: string) {
    if (
      fileExtension === 'gltf' || fileExtension === 'glb' ||
      fileExtension === 'vrm' || fileExtension === 'drc'
    ) {
      return true;
    } else {
      return false;
    }
  }

  private __importToRenderPassesFromUriPromise(uri: string, renderPasses: RenderPass[], options: GltfLoadOption) {
    return DataUtil.fetchArrayBuffer(uri).then((arrayBuffer) => {
      options.files[uri] = arrayBuffer;
      return this.__importToRenderPassesFromArrayBufferPromise(uri, renderPasses, options, uri)
    })
  }

  private __importToRenderPassesFromArrayBufferPromise(fileName: string, renderPasses: RenderPass[], options: GltfLoadOption, uri: string) {
    const optionalFileType = options.fileType;

    return this.__getFileTypeFromFilePromise(fileName, options, optionalFileType).then((fileType) => {

      return new Promise((resolve, reject) => {
        let importer;
        const modelConverter = ModelConverter.getInstance();

        const file = options.files[fileName];
        options.isImportVRM = false;
        switch (fileType) {
          case 'glTF1':
            importer = Gltf1Importer.getInstance() as Gltf1Importer;
            importer.importArrayBuffer(uri, file, options).then((gltfModel) => {
              const rootGroup = modelConverter.convertToRhodoniteObject(gltfModel);
              renderPasses[0].addEntities([rootGroup]);
              resolve();
            });
            break;
          case 'glTF2':
            importer = Gltf2Importer.getInstance() as Gltf2Importer;
            importer.importArrayBuffer(uri, file, options).then((gltfModel) => {
              const rootGroup = modelConverter.convertToRhodoniteObject(gltfModel);
              renderPasses[0].addEntities([rootGroup]);
              resolve();
            });
            break;
          case 'Draco':
            importer = DrcPointCloudImporter.getInstance() as DrcPointCloudImporter;
            importer.importArrayBuffer(uri, file, options).then((gltfModel) => {
              if (gltfModel == null) {
                console.error('importArrayBuffer error is occurred');
                reject();
              } else {
                const rootGroup = modelConverter.convertToRhodoniteObject(gltfModel);
                renderPasses[0].addEntities([rootGroup]);
                resolve();
              }
            });
            break;
          case 'VRM':
            options.isImportVRM = true;
            this.__importVRM(uri, file, renderPasses, options).then(() => {
              resolve();
            });
            break;
          default:
            console.error('detect invalid format');
            reject();
        }
      });
    })
  }

  private __getFileTypeFromFilePromise(fileName: string, options: GltfLoadOption, optionalFileType?: string) {
    return new Promise((resolve) => {
      if (optionalFileType != null) {
        resolve(optionalFileType);
      } else {
        detectFormat('', { [fileName]: options.files[fileName] }).then((fileType: string) => {
          resolve(fileType);
        });
      }
    });
  }

  private __importVRM(uri: string, file: ArrayBuffer, renderPasses: RenderPass[], options: GltfLoadOption): Promise<void> {
    const gltf2Importer = Gltf2Importer.getInstance();
    return gltf2Importer.importArrayBuffer(uri, file, options).then((gltfModel) => {

      const textures = this._createTextures(gltfModel);
      const defaultMaterialHelperArgumentArray = gltfModel.asset.extras.rnLoaderOptions.defaultMaterialHelperArgumentArray;
      defaultMaterialHelperArgumentArray[0].textures = textures;

      this._initializeMaterialProperties(gltfModel, textures.length);

      let rootGroup;
      const modelConverter = ModelConverter.getInstance();
      const existOutline = this._existOutlineMaterial(gltfModel.extensions.VRM);
      if (existOutline) {
        renderPasses[1] = renderPasses[1] ?? new RenderPass();
        const renderPassOutline = renderPasses[1];
        renderPassOutline.toClearColorBuffer = false;
        renderPassOutline.toClearDepthBuffer = false;
        gltfModel.extensions.VRM.rnExtension = { renderPassOutline: renderPassOutline };

        rootGroup = modelConverter.convertToRhodoniteObject(gltfModel);
        renderPassOutline.addEntities([rootGroup]);
      } else {
        rootGroup = modelConverter.convertToRhodoniteObject(gltfModel);
      }

      const renderPassMain = renderPasses[0];
      renderPassMain.addEntities([rootGroup]);

      this._readSpringBone(rootGroup, gltfModel);
      this._readVRMHumanoidInfo(gltfModel, rootGroup);

    });
  }

  _getOptions(options?: GltfLoadOption): GltfLoadOption {
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
        loaderExtension: undefined,
        defaultMaterialHelperName: undefined,
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

  _readVRMHumanoidInfo(gltfModel: VRM, rootEntity?: Entity): void {
    const humanBones = gltfModel.extensions.VRM.humanoid.humanBones;
    const mapNameNodeId: Map<string, number> = new Map();
    // const mapNameNodeName: Map<string, string> = new Map();
    for (let bone of humanBones) {
      mapNameNodeId.set(bone.bone, bone.node);
      const boneNode = gltfModel.nodes[bone.node];
      bone.name = boneNode.name;
    }
    if (rootEntity != null) {
      rootEntity.tryToSetTag({
        tag: 'humanoid_map_name_nodeId',
        value: mapNameNodeId
      });
    }
    // rootEntity.tryToSetTag({
    //   tag: 'humanoid_map_name_nodeName',
    //   value: mapNameNodeName
    // });
  }

  _readSpringBone(rootEntity: Entity, gltfModel: VRM): void {
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

  _createTextures(gltfModel: glTF2): Texture[] {
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

  _existOutlineMaterial(extensionsVRM: any): boolean {
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

  _initializeMaterialProperties(gltfModel: glTF2, texturesLength: number): void {
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
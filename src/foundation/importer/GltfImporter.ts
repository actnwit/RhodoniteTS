import Entity, {IEntity} from '../core/Entity';
import { EntityRepository } from '../core/EntityRepository';
import {detectFormatByArrayBuffers} from './FormatDetector';
import Gltf2Importer from './Gltf2Importer';
import {GltfLoadOption, RnM2, GltfFileBuffers} from '../../types/RnM2';
import ModelConverter from './ModelConverter';
import PhysicsComponent from '../components/Physics/PhysicsComponent';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';
import SphereCollider from '../physics/SphereCollider';
import Texture from '../textures/Texture';
import Vector3 from '../math/Vector3';
import VRMColliderGroup from '../physics/VRMColliderGroup';
import VRMSpringBoneGroup from '../physics/VRMSpringBoneGroup';
import VRMSpringBonePhysicsStrategy from '../physics/VRMSpringBonePhysicsStrategy';
import Gltf1Importer from './Gltf1Importer';
import DrcPointCloudImporter from './DrcPointCloudImporter';
import Expression from '../renderer/Expression';
import RenderPass from '../renderer/RenderPass';
import {VRM} from '../../types/VRM';
import DataUtil from '../misc/DataUtil';
import {FileType} from '../definitions/FileType';
import {Is} from '../misc/Is';
import {glTF1} from '../../types/glTF1';
import {ISceneGraphEntity} from '../helpers/EntityHelper';

/**
 * Importer class which can import GLTF and VRM.
 */
export default class GltfImporter {
  private constructor() {}

  /**
   * For VRM file only
   * Generate JSON.
   */
  static async importJsonOfVRM(
    uri: string,
    options?: GltfLoadOption
  ): Promise<VRM | undefined> {
    options = this._getOptions(options);

    const gltfModel = await Gltf2Importer.import(uri, options);
    if (Is.not.exist(gltfModel)) {
      return undefined;
    }
    this._readVRMHumanoidInfo(gltfModel as VRM);
    return gltfModel as VRM;
  }

  /**
   * Import GLTF or VRM file.
   * @param uris uri or array of uri of glTF file
   * @param options options for loading process where the files property is ignored
   * @returns gltf expression where:
   *            renderPasses[0]: model entities
   *            renderPasses[1]: model outlines
   */
  static async import(
    uris: string | string[],
    options?: GltfLoadOption
  ): Promise<Expression> {
    if (!Array.isArray(uris)) {
      uris = typeof uris === 'string' ? [uris] : [];
    }
    options = this.__initOptions(options);

    const renderPasses: RenderPass[] = await this.__importMultipleModelsFromUri(
      uris,
      options
    );

    if (options && options.cameraComponent) {
      for (const renderPass of renderPasses) {
        renderPass.cameraComponent = options.cameraComponent;
      }
    }

    const expression = this.__setRenderPassesToExpression(
      renderPasses,
      options
    );
    return expression;
  }

  /**
   * Import GLTF or VRM file.
   * @param uris uri or array of uri of glTF file
   * @param options options for loading process where if you use files option, key name of files must be uri of the value array buffer
   * @returns gltf expression where:
   *            renderPasses[0]: model entities
   *            renderPasses[1]: model outlines
   */
  static async importFromArrayBuffers(
    files: GltfFileBuffers,
    options?: GltfLoadOption
  ): Promise<Expression> {
    options = this.__initOptions(options);

    const renderPasses: RenderPass[] =
      await this.__importMultipleModelsFromArrayBuffers(files, options);

    if (options && options.cameraComponent) {
      for (const renderPass of renderPasses) {
        renderPass.cameraComponent = options.cameraComponent;
      }
    }

    return this.__setRenderPassesToExpression(renderPasses, options);
  }

  private static __initOptions(options?: GltfLoadOption): GltfLoadOption {
    if (options == null) {
      options = DataUtil.createDefaultGltfOptions();
    } else {
      if (options.files == null) {
        options.files = {};
      }

      for (const file in options.files) {
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
        if (
          options.defaultMaterialHelperArgumentArray![0].isMorphing === false
        ) {
          options.maxMorphTargetNumber = 0;
        }
      }
    }

    return options;
  }

  private static __setRenderPassesToExpression(
    renderPasses: RenderPass[],
    options: GltfLoadOption
  ) {
    const expression = options.expression ?? new Expression();

    if (expression.renderPasses !== renderPasses) {
      expression.clearRenderPasses();
      expression.addRenderPasses(renderPasses);
    }

    return expression;
  }

  private static __importMultipleModelsFromUri(
    uris: string[],
    options: GltfLoadOption
  ): Promise<RenderPass[]> {
    const importPromises = [];
    const renderPasses = options.expression?.renderPasses || [];
    if (renderPasses.length === 0) {
      renderPasses.push(new RenderPass());
    }

    for (const uri of uris) {
      // import the glTF file from uri of uris array
      if (uri !== '' && options.files![uri] == null) {
        importPromises.push(
          this.__importToRenderPassesFromUriPromise(uri, renderPasses, options)
        );
      }
    }

    return Promise.all(importPromises).then(() => {
      return renderPasses;
    });
  }

  private static __importMultipleModelsFromArrayBuffers(
    files: GltfFileBuffers,
    options: GltfLoadOption
  ): Promise<RenderPass[]> {
    const importPromises = [];
    const renderPasses = options.expression?.renderPasses || [];
    if (renderPasses.length === 0) {
      renderPasses.push(new RenderPass());
    }

    for (const fileName in files) {
      // filename is uri
      const fileExtension = DataUtil.getExtension(fileName);
      if (this.__isValidExtension(fileExtension)) {
        importPromises.push(
          this.__importToRenderPassesFromArrayBufferPromise(
            fileName,
            renderPasses,
            options,
            fileName
          )
        );
      }
    }

    return Promise.all(importPromises).then(() => {
      return renderPasses;
    });
  }

  private static __isValidExtension(fileExtension: string) {
    if (
      fileExtension === 'gltf' ||
      fileExtension === 'glb' ||
      fileExtension === 'vrm' ||
      fileExtension === 'drc'
    ) {
      return true;
    } else {
      return false;
    }
  }

  private static __importToRenderPassesFromUriPromise(
    uri: string,
    renderPasses: RenderPass[],
    options: GltfLoadOption
  ) {
    return DataUtil.fetchArrayBuffer(uri).then(arrayBuffer => {
      options.files![uri] = arrayBuffer;
      return this.__importToRenderPassesFromArrayBufferPromise(
        uri,
        renderPasses,
        options,
        uri
      );
    });
  }

  private static __isGlb(arrayBuffer: ArrayBuffer) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const isLittleEndian = true;
    // Magic field
    const magic = dataView.getUint32(0, isLittleEndian);
    let result;
    // The 0x46546C67 means 'glTF' string in glb files.
    if (magic === 0x46546c67) {
      return true;
    } else {
      return false;
    }
  }

  private static __getGlbVersion(glbArrayBuffer: ArrayBuffer) {
    const dataView = new DataView(glbArrayBuffer, 0, 20);
    const isLittleEndian = true;
    const glbVer = dataView.getUint32(4, isLittleEndian);
    return glbVer;
  }

  private static __getGltfVersion(gltfJson: glTF1 | RnM2) {
    if ((gltfJson as RnM2).asset?.version?.charAt(0) === '2') {
      return 2;
    } else {
      return 1;
    }
  }

  private static __importToRenderPassesFromArrayBufferPromise(
    fileName: string,
    renderPasses: RenderPass[],
    options: GltfLoadOption,
    uri: string
  ) {
    const optionalFileType = options.fileType;

    const fileType = this.__getFileTypeFromFilePromise(
      fileName,
      options,
      optionalFileType
    );

    return new Promise((resolve, reject) => {
      const fileArrayBuffer = options.files![fileName];
      options.isImportVRM = false;
      let glTFVer = 0; // 0: not glTF, 1: glTF1, 2: glTF2
      switch (fileType) {
        case FileType.Gltf:
          {
            const gotText = DataUtil.arrayBufferToString(fileArrayBuffer);
            const json = JSON.parse(gotText);
            glTFVer = this.__getGltfVersion(json);
            let importer;
            if (glTFVer === 1) {
              importer = Gltf1Importer;
            } else {
              importer = Gltf2Importer;
            }
            importer
              .importGltf(json, options.files!, options, fileName)
              .then(gltfModel => {
                const rootGroup =
                  ModelConverter.convertToRhodoniteObject(gltfModel);
                renderPasses[0].addEntities([rootGroup]);
                resolve();
              });
          }
          break;
        case FileType.GltfBinary:
          {
            glTFVer = this.__getGlbVersion(fileArrayBuffer);
            let importer;
            if (glTFVer === 1) {
              importer = Gltf1Importer;
            } else {
              importer = Gltf2Importer;
            }
            importer
              .importGlb(fileArrayBuffer, options.files!, options)
              .then(gltfModel => {
                const rootGroup =
                  ModelConverter.convertToRhodoniteObject(gltfModel);
                renderPasses[0].addEntities([rootGroup]);
                resolve();
              });
          }
          break;
        case FileType.Draco:
          {
            const importer =
              DrcPointCloudImporter.getInstance() as DrcPointCloudImporter;
            importer
              .importArrayBuffer(uri, fileArrayBuffer, options)
              .then(gltfModel => {
                if (gltfModel == null) {
                  console.error('importArrayBuffer error is occurred');
                  reject();
                } else {
                  const rootGroup =
                    ModelConverter.convertToRhodoniteObject(gltfModel);
                  renderPasses[0].addEntities([rootGroup]);
                  resolve();
                }
              });
          }
          break;
        case FileType.VRM:
          options.isImportVRM = true;
          this.__importVRM(uri, fileArrayBuffer, renderPasses, options).then(
            () => {
              resolve();
            }
          );
          break;
        default:
          console.error('detect invalid format');
          reject();
      }
    }) as Promise<void>;
  }

  private static __getFileTypeFromFilePromise(
    fileName: string,
    options: GltfLoadOption,
    optionalFileType?: string
  ) {
    if (optionalFileType != null) {
      return FileType.fromString(optionalFileType);
    } else {
      const fileType = detectFormatByArrayBuffers({
        [fileName]: options.files![fileName],
      });
      return fileType;
    }
  }

  private static __importVRM(
    uri: string,
    file: ArrayBuffer,
    renderPasses: RenderPass[],
    options: GltfLoadOption
  ): Promise<void> {
    return Gltf2Importer.importGltfOrGlbFromArrayBuffers(
      file,
      options.files!,
      options
    ).then(gltfModel_ => {
      const gltfModel = gltfModel_!;
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
    });
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
        isImportVRM: true,
      };
    }

    return options;
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
        this.addPhysicsComponentRecursively(EntityRepository, sg);
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

  private static addPhysicsComponentRecursively(
    entityRepository: EntityRepository,
    sg: SceneGraphComponent
  ): void {
    const entity = sg.entity;
    EntityRepository.addComponentToEntity(PhysicsComponent, entity);
    VRMSpringBonePhysicsStrategy.initialize(sg);
    if (sg.children.length > 0) {
      for (const child of sg.children) {
        this.addPhysicsComponentRecursively(entityRepository, child);
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
}

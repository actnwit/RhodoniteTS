import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import AbstractMaterialNode from './../core/AbstractMaterialNode';
import {CompositionType} from '../../definitions/CompositionType';
import { Vector2 } from '../../math/Vector2';
import {ComponentType} from '../../definitions/ComponentType';
import CGAPIResourceRepository from '../../renderer/CGAPIResourceRepository';
import Vector4 from '../../math/Vector4';
import Vector3 from '../../math/Vector3';
import {ShaderType} from '../../definitions/ShaderType';
import {CGAPIResourceHandle} from '../../../types/CommonTypes';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import { Scalar } from '../../math/Scalar';
import { ComponentRepository } from '../../core/ComponentRepository';
import CameraComponent from '../../components/Camera/CameraComponent';
import { MeshRendererComponent } from '../../components/MeshRenderer/MeshRendererComponent';
import {HdriFormat} from '../../definitions/HdriFormat';
import SkeletalComponent from '../../components/Skeletal/SkeletalComponent';
import Material from './../core/Material';
import PBRExtendedShaderVertex from '../../../webgl/shaderity_shaders/PBRExtendedShader/PBRExtendedShader.vert';
import PBRExtendedShaderFragment from '../../../webgl/shaderity_shaders/PBRExtendedShader/PBRExtendedShader.frag';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { Is } from '../../misc/Is';

export default class PbrExtendedShadingSingleMaterialNode extends AbstractMaterialNode {
  static detailNormalTexture = new ShaderSemanticsClass({
    str: 'detailNormalTexture',
  });
  static detailColorTexture = new ShaderSemanticsClass({
    str: 'detailColorTexture',
  });
  static diffuseTextureTransform = new ShaderSemanticsClass({
    str: 'diffuseTextureTransform',
  });
  static diffuseTextureRotation = new ShaderSemanticsClass({
    str: 'diffuseTextureRotation',
  });
  static normalTextureTransform = new ShaderSemanticsClass({
    str: 'normalTextureTransform',
  });
  static normalTextureRotation = new ShaderSemanticsClass({
    str: 'normalTextureRotation',
  });
  static detailColorTextureTransform = new ShaderSemanticsClass({
    str: 'detailColorTextureTransform',
  });
  static detailColorTextureRotation = new ShaderSemanticsClass({
    str: 'detailColorTextureRotation',
  });
  static detailNormalTextureTransform = new ShaderSemanticsClass({
    str: 'detailNormalTextureTransform',
  });
  static detailNormalTextureRotation = new ShaderSemanticsClass({
    str: 'detailNormalTextureRotation',
  });
  static debugDisplay = new ShaderSemanticsClass({str: 'debugDisplay'});

  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;

  constructor({
    isMorphing,
    isSkinning,
    isLighting,
  }: {
    isMorphing: boolean;
    isSkinning: boolean;
    isLighting: boolean;
  }) {
    super(
      null,
      'PbrExtendedShading' +
        (isMorphing ? '+morphing' : '') +
        (isSkinning ? '+skinning' : '') +
        (isLighting ? '' : '-lighting'),
      {isMorphing, isSkinning, isLighting},
      PBRExtendedShaderVertex,
      PBRExtendedShaderFragment
    );
    AbstractMaterialNode.initDefaultTextures();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isSystem: false,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: false,
        initialValue: [0, AbstractMaterialNode.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.SpecularGlossinessFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isSystem: false,
        initialValue: Vector4.fromCopyArray([0.0, 0.0, 0.0, 0.0]),
      },
      {
        semantic: ShaderSemantics.SpecularGlossinessTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: false,
        initialValue: [1, AbstractMaterialNode.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.NormalTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: false,
        initialValue: [2, AbstractMaterialNode.__dummyBlueTexture],
      },
      {
        semantic: ShaderSemantics.Wireframe,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 10,
        isSystem: false,
        initialValue: Vector3.fromCopyArray([0, 0, 1]),
      },
      {
        semantic: ShaderSemantics.Anisotropy,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -1,
        max: 1,
        isSystem: false,
        initialValue: Vector2.fromCopyArray2([0, 0]),
      },
      {
        semantic: ShaderSemantics.ClearCoatParameter,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isSystem: false,
        initialValue: Vector2.fromCopyArray2([0.0, 0.5]),
      },
      {
        semantic: ShaderSemantics.SheenParameter,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isSystem: false,
        initialValue: Vector3.fromCopyArray([0.0, 0.0, 0.0]),
      },
      {
        semantic: PbrExtendedShadingSingleMaterialNode.detailNormalTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 10,
        isSystem: false,
        initialValue: [3, AbstractMaterialNode.__dummyBlueTexture],
      },
      {
        semantic: PbrExtendedShadingSingleMaterialNode.detailColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 10,
        isSystem: false,
        initialValue: [4, AbstractMaterialNode.__dummySRGBGrayTexture],
      },
      {
        semantic: PbrExtendedShadingSingleMaterialNode.diffuseTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isSystem: false,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic: PbrExtendedShadingSingleMaterialNode.diffuseTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isSystem: false,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic: PbrExtendedShadingSingleMaterialNode.normalTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isSystem: false,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic: PbrExtendedShadingSingleMaterialNode.normalTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isSystem: false,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic:
          PbrExtendedShadingSingleMaterialNode.detailColorTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isSystem: false,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic:
          PbrExtendedShadingSingleMaterialNode.detailColorTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isSystem: false,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic:
          PbrExtendedShadingSingleMaterialNode.detailNormalTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isSystem: false,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic:
          PbrExtendedShadingSingleMaterialNode.detailNormalTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isSystem: false,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic: PbrExtendedShadingSingleMaterialNode.debugDisplay,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 20,
        isSystem: false,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic: ShaderSemantics.IBLParameter,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
      },
      {
        semantic: ShaderSemantics.HDRIFormat,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 5,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: Vector2.fromCopyArray2([0, 0]),
      },
      // {
      //   semantic: ShaderSemantics.BrdfLutTexture,
      //   compositionType: CompositionType.Texture2D,
      //   componentType: ComponentType.Int,
      //   stage: ShaderType.PixelShader,
      //   min: 0,
      //   max: Number.MAX_SAFE_INTEGER,
      //   isSystem: true,
      //   updateInterval: ShaderVariableUpdateInterval.EveryTime,
      //   initialValue: [5, AbstractMaterialNode.__dummyWhiteTexture],
      // },
      // {
      //   semantic: ShaderSemantics.LightNumber,
      //   compositionType: CompositionType.Scalar,
      //   componentType: ComponentType.Int,
      //   stage: ShaderType.PixelShader,
      //   min: 0,
      //   max: Number.MAX_SAFE_INTEGER,
      //   isSystem: true,
      //   updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      //   initialValue: Scalar.fromCopyNumber(0),
      //   soloDatum: true,
      // },
      // {
      //   semantic: ShaderSemantics.ViewPosition,
      //   compositionType: CompositionType.Vec3,
      //   componentType: ComponentType.Float,
      //   stage: ShaderType.PixelShader,
      //   min: -Number.MAX_VALUE,
      //   max: Number.MAX_VALUE,
      //   isSystem: true,
      //   updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      //   initialValue: Vector3.fromCopyArray([0, 0.0]),
      //   soloDatum: true,
      // },
      {
        semantic: ShaderSemantics.DiffuseEnvTexture,
        compositionType: CompositionType.TextureCube,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [5, AbstractMaterialNode.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.SpecularEnvTexture,
        compositionType: CompositionType.TextureCube,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [6, AbstractMaterialNode.__dummyWhiteTexture],
      },
    ];

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
      // const lights: ShaderSemanticsInfo[] = [];
      // for (let i = 0; i < Config.maxLightNumberInShader; i++) {
      //   (function (idx) {
      //     lights.push(
      //       {
      //         semantic: ShaderSemantics.LightPosition,
      //         compositionType: CompositionType.Vec4,
      //         componentType: ComponentType.Float,
      //         stage: ShaderType.PixelShader,
      //         min: -Number.MAX_VALUE,
      //         max: Number.MAX_VALUE,
      //         index: idx,
      //         maxIndex: 4,
      //         isSystem: true,
      //         updateInterval: ShaderVariableUpdateInterval.EveryTime,
      //         initialValue: Vector4.fromCopyArray([0, 0, 0, 1]),
      //         soloDatum: true,
      //       });
      //     lights.push(
      //       {
      //         semantic: ShaderSemantics.LightDirection,
      //         compositionType: CompositionType.Vec4,
      //         componentType: ComponentType.Float,
      //         stage: ShaderType.PixelShader,
      //         min: -1,
      //         max: 1,
      //         index: idx,
      //         maxIndex: 4,
      //         isSystem: true,
      //         initialValue: Vector4.fromCopyArray([0, 1, 0, 1]),
      //         updateInterval: ShaderVariableUpdateInterval.EveryTime,
      //         soloDatum: true,
      //       });
      //     lights.push(
      //       {
      //         semantic: ShaderSemantics.LightIntensity,
      //         compositionType: CompositionType.Vec4,
      //         componentType: ComponentType.Float,
      //         stage: ShaderType.PixelShader,
      //         min: 0,
      //         max: 10,
      //         index: idx,
      //         maxIndex: 4,
      //         isSystem: true,
      //         initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
      //         updateInterval: ShaderVariableUpdateInterval.EveryTime,
      //         soloDatum: true,
      //       });
      //   })(i);
      // }
      // shaderSemanticsInfoArray = shaderSemanticsInfoArray.concat(lights);
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';

      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      // stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime });
      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneCompressedChank, compositionType: CompositionType.Vec4Array, maxIndex: 250, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true });
      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneCompressedInfo, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, soloDatum: true,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, initialValue: MutableVector4.zero() });
      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
      //   stage: ShaderType.VertexShader, min: 0, max: 1, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, initialValue: Scalar.fromCopyNumber(0) });
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  static async initDefaultTextures() {
    // const pbrCookTorranceBrdfLutDataUrl = ModuleManager.getInstance().getModule('pbr').pbrCookTorranceBrdfLutDataUrl;
    // AbstractMaterialNode.__pbrCookTorranceBrdfLutDataUrlUid = await AbstractMaterialNode.__webglResourceRepository!.createTextureFromDataUri(pbrCookTorranceBrdfLutDataUrl,
    //   {
    //     level: 0, internalFormat: TextureParameter.RGBA8,
    //     border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Linear, minFilter: TextureParameter.Linear,
    //     wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false
    //   }
    // );
  }

  setParametersForGPU({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArg;
  }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.main
      ) as CameraComponent;
    }
    if (cameraComponent) {
      this.setViewInfo(
        shaderProgram,
        cameraComponent,
        args.isVr,
        args.displayIdx
      );
      this.setProjection(
        shaderProgram,
        cameraComponent,
        args.isVr,
        args.displayIdx
      );
    }

    /// Skinning
    const skeletalComponent = args.entity.tryToGetSkeletal();
    this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);

    // Env map
    this.__webglResourceRepository.setUniformValue(
      shaderProgram,
      ShaderSemantics.DiffuseEnvTexture.str,
      firstTime,
      [5, -1]
    );
    if (args.diffuseCube && args.diffuseCube.isTextureReady) {
      const texture = this.__webglResourceRepository.getWebGLResource(
        args.diffuseCube.cgApiResourceUid!
      ) as WebGLTexture;
      args.glw.bindTextureCube(5, texture);
    } else {
      const texture = this.__webglResourceRepository.getWebGLResource(
        AbstractMaterialNode.__dummyBlackCubeTexture.cgApiResourceUid
      ) as WebGLTexture;
      args.glw.bindTextureCube(5, texture);
    }
    this.__webglResourceRepository.setUniformValue(
      shaderProgram,
      ShaderSemantics.SpecularEnvTexture.str,
      firstTime,
      [6, -1]
    );
    if (args.specularCube && args.specularCube.isTextureReady) {
      const texture = this.__webglResourceRepository.getWebGLResource(
        args.specularCube.cgApiResourceUid!
      ) as WebGLTexture;
      args.glw.bindTextureCube(6, texture);
    } else {
      const texture = this.__webglResourceRepository.getWebGLResource(
        AbstractMaterialNode.__dummyBlackCubeTexture.cgApiResourceUid
      ) as WebGLTexture;
      args.glw.bindTextureCube(6, texture);
    }

    let mipmapLevelNumber = 1;
    if (args.specularCube) {
      mipmapLevelNumber = args.specularCube.mipmapLevelNumber;
    }
    const meshRenderComponent = args.entity.getComponent(
      MeshRendererComponent
    ) as MeshRendererComponent;
    let diffuseHdriType = HdriFormat.LDR_SRGB.index;
    let specularHdriType = HdriFormat.LDR_SRGB.index;
    if (meshRenderComponent.diffuseCubeMap) {
      diffuseHdriType = meshRenderComponent.diffuseCubeMap!.hdriFormat.index;
    }
    if (meshRenderComponent.specularCubeMap) {
      specularHdriType = meshRenderComponent.specularCubeMap!.hdriFormat.index;
    }
    if (args.setUniform) {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.IBLParameter.str,
        firstTime,
        {
          x: mipmapLevelNumber,
          y: meshRenderComponent!.diffuseCubeMapContribution,
          z: meshRenderComponent!.specularCubeMapContribution,
          w: meshRenderComponent!.rotationOfCubeMap,
        }
      );
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.HDRIFormat.str,
        firstTime,
        {x: diffuseHdriType, y: specularHdriType}
      );
    } else {
      const tmp_vector4 = AbstractMaterialNode.__tmp_vector4;
      tmp_vector4.x = mipmapLevelNumber;
      tmp_vector4.y = meshRenderComponent!.diffuseCubeMapContribution;
      tmp_vector4.z = meshRenderComponent!.specularCubeMapContribution;
      tmp_vector4.w = meshRenderComponent!.rotationOfCubeMap;
      material.setParameter(ShaderSemantics.IBLParameter, tmp_vector4);
      const tmp_vector2 = AbstractMaterialNode.__tmp_vector2;
      tmp_vector2.x = diffuseHdriType;
      tmp_vector2.y = specularHdriType;
      material.setParameter(ShaderSemantics.IBLParameter, tmp_vector2);
    }

    // BRDF LUT
    // updated = this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.BrdfLutTexture.str, firstTime, [5, -1]);
    // if (updated) {
    //   if (this.__pbrCookTorranceBrdfLutDataUrlUid != null) {
    //     const texture = this.__webglResourceRepository.getWebGLResource(this.__pbrCookTorranceBrdfLutDataUrlUid!) as WebGLTexture;
    //     glw.bindTexture2D(5, texture);
    //   } else {
    //     const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyWhiteTexture!) as WebGLTexture;
    //     glw.bindTexture2D(5, texture);
    //   }
    // }

    // Lights
    this.setLightsInfo(
      shaderProgram,
      args.lightComponents,
      material,
      args.setUniform
    );
  }
}

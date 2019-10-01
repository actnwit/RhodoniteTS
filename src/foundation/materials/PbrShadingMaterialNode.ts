import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum, ShaderSemanticsClass } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import Vector2 from "../math/Vector2";
import { ComponentType } from "../definitions/ComponentType";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import ModuleManager from "../system/ModuleManager";
import { PixelFormat } from "../definitions/PixelFormat";
import { TextureParameter } from "../definitions/TextureParameter";
import Vector4 from "../math/Vector4";
import Vector3 from "../math/Vector3";
import AbstractTexture from "../textures/AbstractTexture";
import PBRShader from "../../webgl/shaders/PBRShader";
import { ShaderType } from "../definitions/ShaderType";
import { CGAPIResourceHandle } from "../../types/CommonTypes";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import ComponentRepository from "../core/ComponentRepository";
import CameraComponent from "../components/CameraComponent";
import Material from "./Material";
import MeshRendererComponent from "../components/MeshRendererComponent";
import { HdriFormat } from "../definitions/HdriFormat";
import Scalar from "../math/Scalar";
import Config from "../core/Config";
import SkeletalComponent from "../components/SkeletalComponent";
import MutableVector4 from "../math/MutableVector4";
import VectorN from "../math/VectorN";
import MeshComponent from "../components/MeshComponent";
import BlendShapeComponent from "../components/BlendShapeComponent";
import MutableMatrix44 from "../math/MutableMatrix44";

export default class PbrShadingMaterialNode extends AbstractMaterialNode {
  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static readonly IsOutputHDR = new ShaderSemanticsClass({ str: 'isOutputHDR' })
  static baseColorTextureTransform = new ShaderSemanticsClass({ str: 'baseColorTextureTransform' });
  static baseColorTextureRotation = new ShaderSemanticsClass({ str: 'baseColorTextureRotation' });
  static normalTextureTransform = new ShaderSemanticsClass({ str: 'normalTextureTransform' });
  static normalTextureRotation = new ShaderSemanticsClass({ str: 'normalTextureRotation' });
  static metallicRoughnessTextureTransform = new ShaderSemanticsClass({ str: 'metallicRoughnessTextureTransform' });
  static metallicRoughnessTextureRotation = new ShaderSemanticsClass({ str: 'metallicRoughnessTextureRotation' });

  constructor({ isMorphing, isSkinning, isLighting }: { isMorphing: boolean, isSkinning: boolean, isLighting: boolean }) {
    super(PBRShader.getInstance(), 'pbrShading'
      + (isMorphing ? '+morphing' : '')
      + (isSkinning ? '+skinning' : '')
      + (isLighting ? '' : '-lighting'),
      { isMorphing, isSkinning, isLighting }
    );


    PbrShadingMaterialNode.initDefaultTextures();

    let shaderSemanticsInfoArray: ShaderSemanticsInfo[] =
      [
        //  {semantic: ShaderSemantics.ViewMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
        //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, initialValue: MutableMatrix44.identity()},
        //   {semantic: ShaderSemantics.ProjectionMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
        //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, initialValue: MutableMatrix44.identity()},
        //   {semantic: ShaderSemantics.ViewPosition, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        //   stage: ShaderType.VertexAndPixelShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector3(0, 0, 1), soloDatum: true},
        {
          semantic: ShaderSemantics.BaseColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 2, isSystem: false, initialValue: new Vector4(1, 1, 1, 1)
        },
        {
          semantic: ShaderSemantics.BaseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, initialValue: [0, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: ShaderSemantics.MetallicRoughnessFactor, compositionType: CompositionType.Vec2, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 2, isSystem: false, initialValue: new Vector2(1, 1)
        },
        {
          semantic: ShaderSemantics.MetallicRoughnessTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, initialValue: [1, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: ShaderSemantics.NormalTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, initialValue: [2, AbstractMaterialNode.__dummyBlueTexture]
        },
        {
          semantic: ShaderSemantics.OcclusionTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, initialValue: [3, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: ShaderSemantics.EmissiveTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, initialValue: [4, AbstractMaterialNode.__dummyBlackTexture]
        },
        {
          semantic: ShaderSemantics.Wireframe, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 10, isSystem: false, initialValue: new Vector3(0, 0, 1)
        },
        {
          semantic: PbrShadingMaterialNode.IsOutputHDR, compositionType: CompositionType.Scalar, componentType: ComponentType.Bool,
          stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: false, initialValue: new Scalar(0)
        },
        // {
        //   semantic: ShaderSemantics.ViewPosition,
        //   compositionType: CompositionType.Vec3,
        //   componentType: ComponentType.Float,
        //   stage: ShaderType.VertexAndPixelShader,
        //   min: -Number.MAX_VALUE,
        //   max: Number.MAX_VALUE,
        //   isSystem: true,
        //   updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly,
        //   initialValue: new Vector3(0, 0, 0),
        //   soloDatum: true
        // },
        {
          semantic: ShaderSemantics.IBLParameter,
          compositionType: CompositionType.Vec4,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          isSystem: true,
          initialValue: new Vector4(1, 1, 1, 1),
          updateInteval: ShaderVariableUpdateInterval.EveryTime
        },
        {
          semantic: ShaderSemantics.HDRIFormat,
          compositionType: CompositionType.Vec2,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader,
          min: 0,
          max: 5,
          isSystem: true,
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          initialValue: new Vector2(0, 0)
        },
        // {
        //   semantic: ShaderSemantics.LightNumber,
        //   compositionType: CompositionType.Scalar,
        //   componentType: ComponentType.Int,
        //   stage: ShaderType.VertexAndPixelShader,
        //   min: 0,
        //   max: Number.MAX_SAFE_INTEGER,
        //   isSystem: true,
        //   updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly,
        //   initialValue: new Scalar(0),
        //   soloDatum: true
        // },
        {
          semantic: ShaderSemantics.DiffuseEnvTexture,
          compositionType: CompositionType.TextureCube,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0,
          max: Number.MAX_SAFE_INTEGER,
          isSystem: true,
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          initialValue: [5, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: ShaderSemantics.SpecularEnvTexture,
          compositionType: CompositionType.TextureCube,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          isSystem: true,
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          initialValue: [6, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: PbrShadingMaterialNode.baseColorTextureTransform, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -10, max: 10, isSystem: false, initialValue: new Vector4(1, 1, 0, 0)
        },
        {
          semantic: PbrShadingMaterialNode.baseColorTextureRotation, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -Math.PI, max: Math.PI, isSystem: false, initialValue: new Scalar(0)
        },
        {
          semantic: PbrShadingMaterialNode.normalTextureTransform, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -10, max: 10, isSystem: false, initialValue: new Vector4(1, 1, 0, 0)
        },
        {
          semantic: PbrShadingMaterialNode.normalTextureRotation, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -Math.PI, max: Math.PI, isSystem: false, initialValue: new Scalar(0)
        },
        {
          semantic: PbrShadingMaterialNode.metallicRoughnessTextureTransform, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -10, max: 10, isSystem: false, initialValue: new Vector4(1, 1, 0, 0)
        },
        {
          semantic: PbrShadingMaterialNode.metallicRoughnessTextureRotation, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -Math.PI, max: Math.PI, isSystem: false, initialValue: new Scalar(0)
        },

      ];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Scalar(100.0), min: 0, max: 100
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1
      }
    );

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
      /*
      const lights: ShaderSemanticsInfo[] = [];
      for (let i = 0; i < Config.maxLightNumberInShader; i++) {
        (function(idx){
        lights.push(
          {
            semantic: ShaderSemantics.LightPosition,
            compositionType: CompositionType.Vec4,
            componentType: ComponentType.Float,
            stage: ShaderType.PixelShader,
            min: -Number.MAX_VALUE,
            max: Number.MAX_VALUE,
            index: idx,
            maxIndex: 4,
            isSystem: true,
            updateInteval: ShaderVariableUpdateInterval.EveryTime,
            initialValue: new Vector4(0, 0, 0, 1),
            soloDatum: true
          });
        lights.push(
          {
          semantic: ShaderSemantics.LightDirection,
          compositionType: CompositionType.Vec4,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: -1,
          max: 1,
          index: idx,
          maxIndex: 4,
          isSystem: true,
          initialValue: new Vector4(0, 1, 0, 1),
          updateInteval: ShaderVariableUpdateInterval.EveryTime,
          soloDatum: true
        });
        lights.push(
          {
            semantic: ShaderSemantics.LightIntensity,
            compositionType: CompositionType.Vec4,
            componentType: ComponentType.Float,
            stage: ShaderType.PixelShader,
            min: 0,
            max: 10,
            index: idx,
            maxIndex: 4,
            isSystem: true,
            initialValue: new Vector4(1, 1, 1, 1),
            updateInteval: ShaderVariableUpdateInterval.EveryTime,
            soloDatum: true
          });
        })(i);
      }
      shaderSemanticsInfoArray = shaderSemanticsInfoArray.concat(lights);
      */
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';

      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneQuaternion, compositionType: CompositionType.Vec4Array, maxIndex: 250, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true, initialValue: new VectorN(new Float32Array(0))});
      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneTranslateScale, compositionType: CompositionType.Vec4Array, maxIndex: 250, componentType: ComponentType.Float, soloDatum: true,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, initialValue: new VectorN(new Float32Array(0))});
      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
      //   stage: ShaderType.VertexShader, min: 0, max: 1, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, initialValue: new Scalar(-1) });
    }

    if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';

      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.MorphTargetNumber, componentType: ComponentType.Int, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new Scalar(0), min: 0, max: Config.maxVertexMorphNumberInShader, needUniformInFastest: true
        },
        {
          semantic: ShaderSemantics.DataTextureMorphOffsetPosition, componentType: ComponentType.Float, compositionType: CompositionType.ScalarArray, maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)), min: -Number.MAX_VALUE, max: Number.MAX_VALUE, needUniformInFastest: true
        },
        {
          semantic: ShaderSemantics.MorphWeights, componentType: ComponentType.Float, compositionType: CompositionType.ScalarArray, maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)), min: -Number.MAX_VALUE, max: Number.MAX_VALUE, needUniformInFastest: true
        }
      );
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);

      /// Matrices
      let cameraComponent = args.renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
      }
      this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

      /// Skinning
      const skeletalComponent = args.entity.getSkeletal();
      this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);

      // Lights
      this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
    }

    // Env map
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, firstTime, [5, -1]);
    if (args.diffuseCube && args.diffuseCube.isTextureReady) {
      const texture = this.__webglResourceRepository.getWebGLResource(args.diffuseCube.cgApiResourceUid!) as WebGLTexture;
      args.glw.bindTextureCube(5, texture);
    } else {
      const texture = this.__webglResourceRepository.getWebGLResource(AbstractMaterialNode.__dummyBlackCubeTexture.cgApiResourceUid) as WebGLTexture;
      args.glw.bindTextureCube(5, texture);
    }
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, firstTime, [6, -1]);
    if (args.specularCube && args.specularCube.isTextureReady) {
      const texture = this.__webglResourceRepository.getWebGLResource(args.specularCube.cgApiResourceUid!) as WebGLTexture;
      args.glw.bindTextureCube(6, texture);
    } else {
      const texture = this.__webglResourceRepository.getWebGLResource(AbstractMaterialNode.__dummyBlackCubeTexture.cgApiResourceUid) as WebGLTexture;
      args.glw.bindTextureCube(6, texture);
    }

    let mipmapLevelNumber = 1;
    if (args.specularCube) {
      mipmapLevelNumber = args.specularCube.mipmapLevelNumber;
    }
    const meshRenderComponent = args.entity.getMeshRenderer();
    let diffuseHdriType = HdriFormat.LDR_SRGB.index;
    let specularHdriType = HdriFormat.LDR_SRGB.index;
    if (meshRenderComponent.diffuseCubeMap) {
      diffuseHdriType = meshRenderComponent.diffuseCubeMap!.hdriFormat.index;
    }
    if (meshRenderComponent.specularCubeMap) {
      specularHdriType = meshRenderComponent.specularCubeMap!.hdriFormat.index;
    }
    if (args.setUniform) {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.IBLParameter.str, firstTime,
        {
          x: mipmapLevelNumber, y: meshRenderComponent!.diffuseCubeMapContribution,
          z: meshRenderComponent!.specularCubeMapContribution, w: meshRenderComponent!.rotationOfCubeMap
        },
      );
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.HDRIFormat.str, firstTime, { x: diffuseHdriType, y: specularHdriType })
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
      material.setParameter(ShaderSemantics.HDRIFormat, tmp_vector2);
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


    // Morph
    this.setMorphInfo(shaderProgram, args.entity.getComponent(MeshComponent), args.entity.getComponent(BlendShapeComponent), args.primitive);
  }
}

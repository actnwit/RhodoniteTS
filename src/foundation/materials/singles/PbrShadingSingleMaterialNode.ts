import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import Vector2 from "../../math/Vector2";
import { ComponentType } from "../../definitions/ComponentType";
import CGAPIResourceRepository from "../../renderer/CGAPIResourceRepository";
import Vector4 from "../../math/Vector4";
import Vector3 from "../../math/Vector3";
import { ShaderType } from "../../definitions/ShaderType";
import { CGAPIResourceHandle } from "../../../commontypes/CommonTypes";
import { ShaderVariableUpdateInterval } from "../../definitions/ShaderVariableUpdateInterval";
import ComponentRepository from "../../core/ComponentRepository";
import CameraComponent from "../../components/CameraComponent";
import Material from "../core/Material";
import { HdriFormat } from "../../definitions/HdriFormat";
import Scalar from "../../math/Scalar";
import Config from "../../core/Config";
import VectorN from "../../math/VectorN";
import MeshComponent from "../../components/MeshComponent";
import BlendShapeComponent from "../../components/BlendShapeComponent";

import pbrSingleShaderVertex from "../../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.vert";
import pbrSingleShaderFragment from "../../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.frag";
import { AlphaModeEnum, AlphaMode } from "../../definitions/AlphaMode";

export default class PbrShadingSingleMaterialNode extends AbstractMaterialNode {
  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static readonly IsOutputHDR = new ShaderSemanticsClass({ str: 'isOutputHDR' })
  static readonly BaseColorTextureTransform = new ShaderSemanticsClass({ str: 'baseColorTextureTransform' });
  static readonly BaseColorTextureRotation = new ShaderSemanticsClass({ str: 'baseColorTextureRotation' });
  static readonly NormalTextureTransform = new ShaderSemanticsClass({ str: 'normalTextureTransform' });
  static readonly NormalTextureRotation = new ShaderSemanticsClass({ str: 'normalTextureRotation' });
  static readonly MetallicRoughnessTextureTransform = new ShaderSemanticsClass({ str: 'metallicRoughnessTextureTransform' });
  static readonly MetallicRoughnessTextureRotation = new ShaderSemanticsClass({ str: 'metallicRoughnessTextureRotation' });
  static readonly NormalTexcoordIndex = new ShaderSemanticsClass({ str: 'normalTexcoordIndex' });
  static readonly BaseColorTexcoordIndex = new ShaderSemanticsClass({ str: 'baseColorTexcoordIndex' });
  static readonly MetallicRoughnessTexcoordIndex = new ShaderSemanticsClass({ str: 'metallicRoughnessTexcoordIndex' });
  static readonly OcclusionTexcoordIndex = new ShaderSemanticsClass({ str: 'occlusionTexcoordIndex' });
  static readonly EmissiveTexcoordIndex = new ShaderSemanticsClass({ str: 'emissiveTexcoordIndex' });

  constructor({ isMorphing, isSkinning, isLighting, alphaMode }: { isMorphing: boolean, isSkinning: boolean, isLighting: boolean, alphaMode: AlphaModeEnum }) {
    super(null, 'pbrShading'
      + (isMorphing ? '+morphing' : '')
      + (isSkinning ? '+skinning' : '')
      + (isLighting ? '' : '-lighting')
      + ' alpha_' + alphaMode.str.toLowerCase(),
      { isMorphing, isSkinning, isLighting }, pbrSingleShaderVertex, pbrSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] =
      [
        {
          semantic: ShaderSemantics.BaseColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 2, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector4(1, 1, 1, 1)
        },
        {
          semantic: ShaderSemantics.BaseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: [0, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: ShaderSemantics.MetallicRoughnessFactor, compositionType: CompositionType.Vec2, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 2, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector2(1, 1)
        },
        {
          semantic: ShaderSemantics.MetallicRoughnessTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: [1, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: ShaderSemantics.NormalTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: [2, AbstractMaterialNode.__dummyBlueTexture]
        },
        {
          semantic: ShaderSemantics.OcclusionTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: [3, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: ShaderSemantics.EmissiveTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: [4, AbstractMaterialNode.__dummyBlackTexture]
        },
        {
          semantic: ShaderSemantics.Wireframe, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 10, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector3(0, 0, 1)
        },
        {
          semantic: PbrShadingSingleMaterialNode.IsOutputHDR, compositionType: CompositionType.Scalar, componentType: ComponentType.Bool,
          stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        },
        {
          semantic: ShaderSemantics.IBLParameter, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector4(1, 1, 1, 1),
        },
        {
          semantic: ShaderSemantics.HDRIFormat, compositionType: CompositionType.Vec2, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: 5, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector2(0, 0)
        },
        {
          semantic: ShaderSemantics.DiffuseEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: [5, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: ShaderSemantics.SpecularEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: [6, AbstractMaterialNode.__dummyWhiteTexture]
        },
        {
          semantic: PbrShadingSingleMaterialNode.BaseColorTextureTransform, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -10, max: 10, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector4(1, 1, 0, 0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.BaseColorTextureRotation, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -Math.PI, max: Math.PI, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.NormalTextureTransform, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -10, max: 10, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector4(1, 1, 0, 0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.NormalTextureRotation, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -Math.PI, max: Math.PI, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.MetallicRoughnessTextureTransform, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -10, max: 10, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Vector4(1, 1, 0, 0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.MetallicRoughnessTextureRotation, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: -Math.PI, max: Math.PI, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        },

        {
          semantic: PbrShadingSingleMaterialNode.NormalTexcoordIndex, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.BaseColorTexcoordIndex, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.MetallicRoughnessTexcoordIndex, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.OcclusionTexcoordIndex, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        },
        {
          semantic: PbrShadingSingleMaterialNode.EmissiveTexcoordIndex, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
          stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0)
        }
      ];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Scalar(30.0), min: 0, max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1,
      }
    );

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
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

    this.__definitions += '#define RN_IS_ALPHAMODE_' + alphaMode.str + '\n';
    if (alphaMode === AlphaMode.Mask) {
      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.AlphaCutoff, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.PixelShader, min: 0, max: 1.0, isSystem: false, updateInterval: ShaderVariableUpdateInterval.EveryTime, initialValue: new Scalar(0.01)
        }
      );
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);

      if (firstTime) {
        /// Matrices
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
        }
        this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
        this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

        // Lights
        this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);
      }

      /// Skinning
      const skeletalComponent = args.entity.getSkeletal();
      this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);

    }

    // Env map
    if (args.diffuseCube && args.diffuseCube.isTextureReady) {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, firstTime, [5, args.diffuseCube]);
    } else {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, firstTime, [5, AbstractMaterialNode.__dummyBlackCubeTexture]);
    }
    if (args.specularCube && args.specularCube.isTextureReady) {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, firstTime, [6, args.specularCube]);
    } else {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, firstTime, [6, AbstractMaterialNode.__dummyBlackCubeTexture]);
    }


    if (args.setUniform) {
      if (firstTime) {
        const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } = this.setupHdriParameters(args);
        this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.IBLParameter.str, firstTime,
          {
            x: mipmapLevelNumber, y: meshRenderComponent!.diffuseCubeMapContribution,
            z: meshRenderComponent!.specularCubeMapContribution, w: meshRenderComponent!.rotationOfCubeMap
          },
        );
        this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.HDRIFormat.str, firstTime, { x: diffuseHdriType, y: specularHdriType })
      }
    } else {
      const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } = this.setupHdriParameters(args);
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

    // Morph
    this.setMorphInfo(shaderProgram, args.entity.getComponent(MeshComponent), args.entity.getComponent(BlendShapeComponent), args.primitive);
  }

  private setupHdriParameters(args: any) {
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
    return { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType };
  }
}

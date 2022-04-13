import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import {CompositionType} from '../../definitions/CompositionType';
import { Vector2 } from '../../math/Vector2';
import {ComponentType} from '../../definitions/ComponentType';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { Vector4 } from '../../math/Vector4';
import { Vector3 } from '../../math/Vector3';
import {ShaderType} from '../../definitions/ShaderType';
import {CGAPIResourceHandle} from '../../../types/CommonTypes';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import { ComponentRepository } from '../../core/ComponentRepository';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { Material } from '../core/Material';
import {HdriFormat} from '../../definitions/HdriFormat';
import { Scalar } from '../../math/Scalar';
import {Config} from '../../core/Config';
import { VectorN } from '../../math/VectorN';
import { MeshComponent } from '../../components/Mesh/MeshComponent';
import { BlendShapeComponent } from '../../components/BlendShape/BlendShapeComponent';

import pbrSingleShaderVertex from '../../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.vert';
import pbrSingleShaderFragment from '../../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.frag';
import {AlphaModeEnum, AlphaMode} from '../../definitions/AlphaMode';
import { Is } from '../../misc/Is';
import { RenderingArg } from '../../../webgl/types/CommonTypes';

export class PbrShadingSingleMaterialNode extends AbstractMaterialContent {
  private static readonly IsOutputHDR = new ShaderSemanticsClass({
    str: 'isOutputHDR',
  });
  static readonly BaseColorTextureTransform = new ShaderSemanticsClass({
    str: 'baseColorTextureTransform',
  });
  static readonly BaseColorTextureRotation = new ShaderSemanticsClass({
    str: 'baseColorTextureRotation',
  });
  static readonly NormalTextureTransform = new ShaderSemanticsClass({
    str: 'normalTextureTransform',
  });
  static readonly NormalTextureRotation = new ShaderSemanticsClass({
    str: 'normalTextureRotation',
  });
  static readonly MetallicRoughnessTextureTransform = new ShaderSemanticsClass({
    str: 'metallicRoughnessTextureTransform',
  });
  static readonly MetallicRoughnessTextureRotation = new ShaderSemanticsClass({
    str: 'metallicRoughnessTextureRotation',
  });
  static readonly NormalTexcoordIndex = new ShaderSemanticsClass({
    str: 'normalTexcoordIndex',
  });
  static readonly BaseColorTexcoordIndex = new ShaderSemanticsClass({
    str: 'baseColorTexcoordIndex',
  });
  static readonly MetallicRoughnessTexcoordIndex = new ShaderSemanticsClass({
    str: 'metallicRoughnessTexcoordIndex',
  });
  static readonly OcclusionTexcoordIndex = new ShaderSemanticsClass({
    str: 'occlusionTexcoordIndex',
  });
  static readonly EmissiveTexcoordIndex = new ShaderSemanticsClass({
    str: 'emissiveTexcoordIndex',
  });
  static readonly NormalScale = new ShaderSemanticsClass({str: 'normalScale'});
  static readonly OcclusionStrength = new ShaderSemanticsClass({
    str: 'occlusionStrength',
  });

  constructor({
    isMorphing,
    isSkinning,
    isLighting,
    useTangentAttribute,
    useNormalTexture,
    alphaMode,
    makeOutputSrgb,
  }: {
    isMorphing: boolean;
    isSkinning: boolean;
    isLighting: boolean;
    useTangentAttribute: boolean;
    useNormalTexture: boolean;
    alphaMode: AlphaModeEnum;
    makeOutputSrgb: boolean;
  }) {
    super(
      null,
      'pbrShading' +
        (isMorphing ? '+morphing' : '') +
        (isSkinning ? '+skinning' : '') +
        (isLighting ? '' : '-lighting') +
        (useTangentAttribute ? '+tangentAttribute' : '') +
        ' alpha_' +
        alphaMode.str.toLowerCase(),
      {isMorphing, isSkinning, isLighting},
      pbrSingleShaderVertex,
      pbrSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.BaseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
      },
      {
        semantic: ShaderSemantics.BaseColorTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [0, AbstractMaterialContent.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.MetallicRoughnessFactor,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector2.fromCopyArray2([1, 1]),
      },
      {
        semantic: ShaderSemantics.MetallicRoughnessTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [1, AbstractMaterialContent.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.OcclusionTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [3, AbstractMaterialContent.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.EmissiveTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [4, AbstractMaterialContent.__dummyBlackTexture],
      },
      {
        semantic: ShaderSemantics.Wireframe,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 10,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector3.fromCopyArray([0, 0, 1]),
      },
      {
        semantic: PbrShadingSingleMaterialNode.IsOutputHDR,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic: ShaderSemantics.MakeOutputSrgb,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(makeOutputSrgb ? 1 : 0),
      },
      {
        semantic: ShaderSemantics.IBLParameter,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
      },
      {
        semantic: ShaderSemantics.HDRIFormat,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 5,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector2.fromCopyArray2([0, 0]),
      },
      {
        semantic: ShaderSemantics.DiffuseEnvTexture,
        compositionType: CompositionType.TextureCube,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [5, AbstractMaterialContent.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.SpecularEnvTexture,
        compositionType: CompositionType.TextureCube,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isCustomSetting: true,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [6, AbstractMaterialContent.__dummyWhiteTexture],
      },
      {
        semantic: PbrShadingSingleMaterialNode.BaseColorTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic: PbrShadingSingleMaterialNode.BaseColorTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic:
          PbrShadingSingleMaterialNode.MetallicRoughnessTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic: PbrShadingSingleMaterialNode.MetallicRoughnessTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },

      {
        semantic: PbrShadingSingleMaterialNode.BaseColorTexcoordIndex,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic: PbrShadingSingleMaterialNode.MetallicRoughnessTexcoordIndex,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic: PbrShadingSingleMaterialNode.OcclusionTexcoordIndex,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic: PbrShadingSingleMaterialNode.EmissiveTexcoordIndex,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },

      {
        semantic: PbrShadingSingleMaterialNode.OcclusionStrength,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(1),
      },
    ];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Scalar.fromCopyNumber(30.0),
        min: 0,
        max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.VertexShader,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
        min: 0,
        max: 1,
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
          semantic: ShaderSemantics.MorphTargetNumber,
          componentType: ComponentType.Int,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          isCustomSetting: true,
          soloDatum: true,
          initialValue: Scalar.fromCopyNumber(0),
          min: 0,
          max: Config.maxVertexMorphNumberInShader,
          needUniformInFastest: true,
        },
        {
          semantic: ShaderSemantics.DataTextureMorphOffsetPosition,
          componentType: ComponentType.Int,
          compositionType: CompositionType.ScalarArray,
          maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isCustomSetting: true,
          soloDatum: true,
          initialValue: new VectorN(
            new Int32Array(Config.maxVertexMorphNumberInShader)
          ),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInFastest: true,
        },
        {
          semantic: ShaderSemantics.MorphWeights,
          componentType: ComponentType.Float,
          compositionType: CompositionType.ScalarArray,
          maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isCustomSetting: true,
          soloDatum: true,
          initialValue: new VectorN(
            new Float32Array(Config.maxVertexMorphNumberInShader)
          ),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInFastest: true,
        }
      );
    }

    if (useTangentAttribute) {
      this.__definitions += '#define RN_USE_TANGENT_ATTRIBUTE\n';
    }

    if (useNormalTexture) {
      this.__definitions += '#define RN_USE_NORMAL_TEXTURE\n';

      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.NormalTexture,
          compositionType: CompositionType.Texture2D,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          isCustomSetting: false,
          updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
          initialValue: [2, AbstractMaterialContent.__dummyBlackTexture],
        },
        {
          semantic: PbrShadingSingleMaterialNode.NormalTextureTransform,
          compositionType: CompositionType.Vec4,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: -10,
          max: 10,
          isCustomSetting: false,
          updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
          initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
        },
        {
          semantic: PbrShadingSingleMaterialNode.NormalTextureRotation,
          compositionType: CompositionType.Scalar,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: -Math.PI,
          max: Math.PI,
          isCustomSetting: false,
          updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
          initialValue: Scalar.fromCopyNumber(0),
        },
        {
          semantic: PbrShadingSingleMaterialNode.NormalTexcoordIndex,
          compositionType: CompositionType.Scalar,
          componentType: ComponentType.Int,
          stage: ShaderType.PixelShader,
          min: 0,
          max: 1,
          isCustomSetting: false,
          updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
          initialValue: Scalar.fromCopyNumber(0),
        },
        {
          semantic: PbrShadingSingleMaterialNode.NormalScale,
          compositionType: CompositionType.Scalar,
          componentType: ComponentType.Float,
          stage: ShaderType.PixelShader,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          isCustomSetting: false,
          updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
          initialValue: Scalar.fromCopyNumber(1),
        }
      );
    }

    this.__definitions += '#define RN_IS_ALPHAMODE_' + alphaMode.str + '\n';
    if (alphaMode === AlphaMode.Mask) {
      shaderSemanticsInfoArray.push({
        semantic: ShaderSemantics.AlphaCutoff,
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1.0,
        isCustomSetting: false,
        updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: Scalar.fromCopyNumber(0.01),
      });
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setCustomSettingParametersToGpu({
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
    this.setupBasicInfo(
      args,
      shaderProgram,
      firstTime,
      material,
      CameraComponent
    );

    // // PBR maps
    // this.__webglResourceRepository.setUniformValue(
    //   shaderProgram,
    //   ShaderSemantics.DiffuseEnvTexture.str,
    //   firstTime,
    //   [5, args.diffuseCube]
    // );

    // IBL Env map
    this.setupIBL(args, shaderProgram, firstTime);

    // IBL Parameters
    this.setupIBLParameters(args, firstTime, shaderProgram, material);
  }

  private setupIBLParameters(args: RenderingArg, firstTime: boolean, shaderProgram: WebGLProgram, material: Material) {
    if (args.setUniform) {
      if (firstTime) {
        const {
          mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType,
        } = this.setupHdriParameters(args);
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
          { x: diffuseHdriType, y: specularHdriType }
        );
      }
    } else {
      const {
        mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType,
      } = this.setupHdriParameters(args);
      const tmp_vector4 = AbstractMaterialContent.__tmp_vector4;
      tmp_vector4.x = mipmapLevelNumber;
      tmp_vector4.y = meshRenderComponent!.diffuseCubeMapContribution;
      tmp_vector4.z = meshRenderComponent!.specularCubeMapContribution;
      tmp_vector4.w = meshRenderComponent!.rotationOfCubeMap;
      material.setParameter(ShaderSemantics.IBLParameter, tmp_vector4);
      const tmp_vector2 = AbstractMaterialContent.__tmp_vector2;
      tmp_vector2.x = diffuseHdriType;
      tmp_vector2.y = specularHdriType;
      material.setParameter(ShaderSemantics.HDRIFormat, tmp_vector2);
    }
  }

  private setupIBL(args: RenderingArg, shaderProgram: WebGLProgram, firstTime: boolean) {
    if (args.diffuseCube && args.diffuseCube.isTextureReady) {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.DiffuseEnvTexture.str,
        firstTime,
        [5, args.diffuseCube]
      );
    } else {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.DiffuseEnvTexture.str,
        firstTime,
        [5, AbstractMaterialContent.__dummyBlackCubeTexture]
      );
    }
    if (args.specularCube && args.specularCube.isTextureReady) {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.SpecularEnvTexture.str,
        firstTime,
        [6, args.specularCube]
      );
    } else {
      this.__webglResourceRepository.setUniformValue(
        shaderProgram,
        ShaderSemantics.SpecularEnvTexture.str,
        firstTime,
        [6, AbstractMaterialContent.__dummyBlackCubeTexture]
      );
    }
  }

  private setupHdriParameters(args: RenderingArg) {
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
    return {
      mipmapLevelNumber,
      meshRenderComponent,
      diffuseHdriType,
      specularHdriType,
    };
  }
}

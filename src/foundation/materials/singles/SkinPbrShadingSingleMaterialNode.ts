import {
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsClass,
} from '../../definitions/ShaderSemantics';
import AbstractMaterialNode from '../core/AbstractMaterialNode';
import {CompositionType} from '../../definitions/CompositionType';
import Vector2 from '../../math/Vector2';
import {ComponentType} from '../../definitions/ComponentType';
import CGAPIResourceRepository from '../../renderer/CGAPIResourceRepository';
import Vector4 from '../../math/Vector4';
import Vector3 from '../../math/Vector3';
import {ShaderType} from '../../definitions/ShaderType';
import {CGAPIResourceHandle} from '../../../types/CommonTypes';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import { ComponentRepository } from '../../core/ComponentRepository';
import CameraComponent from '../../components/Camera/CameraComponent';
import Material from '../core/Material';
import {HdriFormat} from '../../definitions/HdriFormat';
import Scalar from '../../math/Scalar';
import Config from '../../core/Config';
import VectorN from '../../math/VectorN';
import { MeshComponent } from '../../components/Mesh/MeshComponent';
import BlendShapeComponent from '../../components/BlendShape/BlendShapeComponent';

import PbrSingleShaderVertex from '../../../webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.vert';
import SkinPbrSingleShaderFragment from '../../../webgl/shaderity_shaders/PbrSingleShader/SkinPbrSingleShader.frag';
import { RenderingArg } from '../../../webgl/types/CommonTypes';
import { Is } from '../../misc/Is';

export default class SkinPbrShadingSingleMaterialNode extends AbstractMaterialNode {
  private static __pbrCookTorranceBrdfLutDataUrlUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static readonly IsOutputHDR = new ShaderSemanticsClass({
    str: 'isOutputHDR',
  });
  static baseColorTextureTransform = new ShaderSemanticsClass({
    str: 'baseColorTextureTransform',
  });
  static baseColorTextureRotation = new ShaderSemanticsClass({
    str: 'baseColorTextureRotation',
  });
  static normalTextureTransform = new ShaderSemanticsClass({
    str: 'normalTextureTransform',
  });
  static normalTextureRotation = new ShaderSemanticsClass({
    str: 'normalTextureRotation',
  });
  static metallicRoughnessTextureTransform = new ShaderSemanticsClass({
    str: 'metallicRoughnessTextureTransform',
  });
  static metallicRoughnessTextureRotation = new ShaderSemanticsClass({
    str: 'metallicRoughnessTextureRotation',
  });
  static pbrKelemenSzirmayKalosBrdfLutTexture = new ShaderSemanticsClass({
    str: 'brdfLutTexture',
  });

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
      'pbrShading' +
        (isMorphing ? '+morphing' : '') +
        (isSkinning ? '+skinning' : '') +
        (isLighting ? '' : '-lighting'),
      {isMorphing, isSkinning, isLighting},
      PbrSingleShaderVertex,
      SkinPbrSingleShaderFragment
    );

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      //  {semantic: ShaderSemantics.ViewMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, initialValue: MutableMatrix44.identity()},
      //   {semantic: ShaderSemantics.ProjectionMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, initialValue: MutableMatrix44.identity()},
      //   {semantic: ShaderSemantics.ViewPosition, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
      //   stage: ShaderType.VertexAndPixelShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: tirue, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: Vector3.fromCopyArray([0, 0, 1]), soloDatum: true},
      {
        semantic: ShaderSemantics.BaseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isSystem: false,
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
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [0, AbstractMaterialNode.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.MetallicRoughnessFactor,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isSystem: false,
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
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
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
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [2, AbstractMaterialNode.__dummyBlueTexture],
      },
      {
        semantic: ShaderSemantics.OcclusionTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [3, AbstractMaterialNode.__dummyWhiteTexture],
      },
      {
        semantic: ShaderSemantics.EmissiveTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [4, AbstractMaterialNode.__dummyBlackTexture],
      },
      {
        semantic:
          SkinPbrShadingSingleMaterialNode.pbrKelemenSzirmayKalosBrdfLutTexture,
        compositionType: CompositionType.Texture2D,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [
          8,
          AbstractMaterialNode.__dummyPbrKelemenSzirmayKalosBrdfLutTexture,
        ],
      },
      {
        semantic: ShaderSemantics.Wireframe,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 10,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector3.fromCopyArray([0, 0, 1]),
      },
      {
        semantic: SkinPbrShadingSingleMaterialNode.IsOutputHDR,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
      // {
      //   semantic: ShaderSemantics.ViewPosition,
      //   compositionType: CompositionType.Vec3,
      //   componentType: ComponentType.Float,
      //   stage: ShaderType.VertexAndPixelShader,
      //   min: -Number.MAX_VALUE,
      //   max: Number.MAX_VALUE,
      //   isSystem: true,
      //   updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      //   initialValue: Vector3.fromCopyArray([0, 0, 0]),
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
        initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      },
      {
        semantic: ShaderSemantics.HDRIFormat,
        compositionType: CompositionType.Vec2,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 5,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector2.fromCopyArray2([0, 0]),
      },
      // {
      //   semantic: ShaderSemantics.LightNumber,
      //   compositionType: CompositionType.Scalar,
      //   componentType: ComponentType.Int,
      //   stage: ShaderType.VertexAndPixelShader,
      //   min: 0,
      //   max: Number.MAX_SAFE_INTEGER,
      //   isSystem: true,
      //   updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      //   initialValue: Scalar.fromCopyNumber(0),
      //   soloDatum: true
      // },
      {
        semantic: ShaderSemantics.DiffuseEnvTexture,
        compositionType: CompositionType.TextureCube,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: true,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
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
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: [6, AbstractMaterialNode.__dummyWhiteTexture],
      },
      {
        semantic: SkinPbrShadingSingleMaterialNode.baseColorTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic: SkinPbrShadingSingleMaterialNode.baseColorTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic: SkinPbrShadingSingleMaterialNode.normalTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic: SkinPbrShadingSingleMaterialNode.normalTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
      {
        semantic:
          SkinPbrShadingSingleMaterialNode.metallicRoughnessTextureTransform,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -10,
        max: 10,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Vector4.fromCopyArray([1, 1, 0, 0]),
      },
      {
        semantic:
          SkinPbrShadingSingleMaterialNode.metallicRoughnessTextureRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        initialValue: Scalar.fromCopyNumber(0),
      },
    ];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Scalar.fromCopyNumber(100.0),
        min: 0,
        max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation,
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        stage: ShaderType.VertexShader,
        isSystem: false,
        updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0.0, 0.1, 0.01]),
        min: 0,
        max: 1,
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
            updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
            initialValue: Vector4.fromCopyArray([0, 0, 0, 1]),
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
          initialValue: Vector4.fromCopyArray([0, 1, 0, 1]),
          updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
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
            initialValue: Vector4.fromCopyArray([1, 1, 1, 1]),
            updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
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
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true, initialValue: new VectorN(new Float32Array(0))});
      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.BoneTranslateScale, compositionType: CompositionType.Vec4Array, maxIndex: 250, componentType: ComponentType.Float, soloDatum: true,
      //   stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new VectorN(new Float32Array(0))});
      // shaderSemanticsInfoArray.push({semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
      //   stage: ShaderType.VertexShader, min: 0, max: 1, isSystem: true, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: Scalar.fromCopyNumber(-1) });
    }

    if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';

      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.MorphTargetNumber,
          componentType: ComponentType.Int,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          isSystem: true,
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
          isSystem: true,
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
          isSystem: true,
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

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
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

      if (firstTime) {
        /// Matrices
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getComponent(
            CameraComponent,
            CameraComponent.main
          ) as CameraComponent;
        }
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

        // Lights
        this.setLightsInfo(
          shaderProgram,
          args.lightComponents,
          material,
          args.setUniform
        );
      }

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
    }

    // Env map
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
        [5, AbstractMaterialNode.__dummyBlackCubeTexture]
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
        [6, AbstractMaterialNode.__dummyBlackCubeTexture]
      );
    }

    if (args.setUniform) {
      if (firstTime) {
        const {
          mipmapLevelNumber,
          meshRenderComponent,
          diffuseHdriType,
          specularHdriType,
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
          {x: diffuseHdriType, y: specularHdriType}
        );
      }
    } else {
      const {
        mipmapLevelNumber,
        meshRenderComponent,
        diffuseHdriType,
        specularHdriType,
      } = this.setupHdriParameters(args);
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
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(
      shaderProgram,
      args.entity.getMesh(),
      args.primitive,
      blendShapeComponent
    );
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

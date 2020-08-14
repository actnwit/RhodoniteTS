import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum, ShaderSemanticsClass, } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import Vector4 from "../../math/Vector4";
import Vector3 from "../../math/Vector3";
import { ShadingModel } from "../../definitions/ShadingModel";
import ShadowMapDecodeClassicShader from "../../../webgl/shaders/ShadowMapDecodeClassicShader";
import { ShaderType } from "../../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../../definitions/ShaderVariableUpdateInterval";
import ComponentRepository from "../../core/ComponentRepository";
import CameraComponent from "../../components/CameraComponent";
import VectorN from "../../math/VectorN";
import Scalar from "../../math/Scalar";
import Config from "../../core/Config";
import Material from "../core/Material";
import SkeletalComponent from "../../components/SkeletalComponent";
import CGAPIResourceRepository from "../../renderer/CGAPIResourceRepository";
import RenderPass from "../../renderer/RenderPass";
import { Count } from "../../../commontypes/CommonTypes";
import MutableMatrix44 from "../../math/MutableMatrix44";
import MeshComponent from "../../components/MeshComponent";
import BlendShapeComponent from "../../components/BlendShapeComponent";

export default class ShadowMapDecodeClassicSingleMaterialNode extends AbstractMaterialNode {
  static ShadowColorCoefficient: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'shadowColorCoefficient' });
  static ShadowAlpha: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'shadowAlpha' });
  static NonShadowAlpha: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'nonShadowAlpha' });
  static AllowableDepthError: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'allowableDepthError' });
  static zNearInner = new ShaderSemanticsClass({ str: 'zNearInner' });
  static zFarInner = new ShaderSemanticsClass({ str: 'zFarInner' });
  static DebugColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'debugColorFactor' });

  private static __lastZNear = 0.0;
  private static __lastZFar = 0.0;

  private __encodedDepthRenderPass: RenderPass;

  constructor(
    { isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber }: { isMorphing: boolean, isSkinning: boolean, isLighting: boolean, isDebugging: boolean, colorAttachmentsNumber: Count },
    encodedDepthRenderPass: RenderPass
  ) {
    super(ShadowMapDecodeClassicShader.getInstance(), "ShadowMapDecodeClassicShading"
      + (isSkinning ? '+skinning' : '')
      + (isLighting ? '' : '-lighting'),
      { isMorphing, isSkinning, isLighting });

    this.__encodedDepthRenderPass = encodedDepthRenderPass;

    const encodedDepthFramebuffer = encodedDepthRenderPass.getFramebuffer();
    if (encodedDepthFramebuffer == null) {
      console.error('encodedDepthRenderPass does not have framebuffer');
      return;
    }
    const encodedDepthTexture = encodedDepthFramebuffer.colorAttachments[colorAttachmentsNumber];

    const viewport = encodedDepthRenderPass.getViewport();
    if (viewport != null) {
      encodedDepthRenderPass.setViewport(new Vector4(1, 1, viewport.z - 1, viewport.w - 1));
    }

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.LightViewProjectionMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: MutableMatrix44.zero(), min: -Number.MAX_VALUE, max: Number.MAX_VALUE,
      },
    );

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.ShadingModel, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(ShadingModel.Constant.index), min: 0, max: 3,
      },
      {
        semantic: ShaderSemantics.Shininess, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: 5, min: 0, max: Number.MAX_VALUE,
      },
      {
        semantic: ShadowMapDecodeClassicSingleMaterialNode.AllowableDepthError, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(0.0001), min: 0, max: 1,
      },
      {
        semantic: ShadowMapDecodeClassicSingleMaterialNode.ShadowColorCoefficient, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector4(0.5, 0.5, 0.5, 1), min: 0, max: 1,
      },
      {
        semantic: ShaderSemantics.DiffuseColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector4(1, 1, 1, 1), min: 0, max: 2,
      },
      {
        semantic: ShaderSemantics.DepthTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, encodedDepthTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
        stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [1, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShadowMapDecodeClassicSingleMaterialNode.zNearInner, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(0.1), min: 0.0001, max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: ShadowMapDecodeClassicSingleMaterialNode.zFarInner, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(10000.0), min: 0.0001, max: Number.MAX_SAFE_INTEGER
      },
    );

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

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
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

    if (isDebugging) {
      this.__definitions += '#define RN_IS_DEBUGGING\n';
      shaderSemanticsInfoArray.push(
        {
          semantic: ShadowMapDecodeClassicSingleMaterialNode.DebugColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, isSystem: false, updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
          initialValue: new Vector4(1, 0, 0, 1), min: 0, max: 2,
        }
      );

    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }


  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }

    const encodedDepthCameraComponent = this.__encodedDepthRenderPass.cameraComponent as CameraComponent;

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

      if (ShadowMapDecodeClassicSingleMaterialNode.__lastZNear !== encodedDepthCameraComponent.zNearInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zNearInner, encodedDepthCameraComponent.zNearInner);
        ShadowMapDecodeClassicSingleMaterialNode.__lastZNear = encodedDepthCameraComponent.zNearInner;
      }

      if (ShadowMapDecodeClassicSingleMaterialNode.__lastZFar !== encodedDepthCameraComponent.zFarInner) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).zFarInner, encodedDepthCameraComponent.zFarInner);
        ShadowMapDecodeClassicSingleMaterialNode.__lastZFar = encodedDepthCameraComponent.zFarInner;
      }
      const __webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      __webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightViewProjectionMatrix.str, true, this.__encodedDepthRenderPass.cameraComponent!.viewProjectionMatrix);
    } else {
      material.setParameter(ShadowMapDecodeClassicSingleMaterialNode.zNearInner, encodedDepthCameraComponent.zNearInner);
      material.setParameter(ShadowMapDecodeClassicSingleMaterialNode.zFarInner, encodedDepthCameraComponent.zFarInner);
      material.setParameter(ShaderSemantics.LightViewProjectionMatrix, this.__encodedDepthRenderPass.cameraComponent!.viewProjectionMatrix)
    }

    /// Skinning
    const skeletalComponent = args.entity.getComponent(SkeletalComponent) as SkeletalComponent;
    this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);

    // Lights
    this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);


    // Morph
    this.setMorphInfo(shaderProgram, args.entity.getComponent(MeshComponent), args.entity.getComponent(BlendShapeComponent), args.primitive);
  }
}

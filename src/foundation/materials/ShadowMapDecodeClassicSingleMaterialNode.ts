import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum, ShaderSemanticsClass, } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import Vector4 from "../math/Vector4";
import Vector3 from "../math/Vector3";
import { ShadingModel } from "../definitions/ShadingModel";
import ShadowMapDecodeClassicShader from "../../webgl/shaders/ShadowMapDecodeClassicShader";
import { ShaderType } from "../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import ComponentRepository from "../core/ComponentRepository";
import CameraComponent from "../components/CameraComponent";
import VectorN from "../math/VectorN";
import MutableVector4 from "../math/MutableVector4";
import Scalar from "../math/Scalar";
import Config from "../core/Config";
import Material from "./Material";
import SkeletalComponent from "../components/SkeletalComponent";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import RenderPass from "../renderer/RenderPass";
import { Count } from "../../types/CommonTypes";
import MutableMatrix44 from "../math/MutableMatrix44";

export default class ShadowMapDecodeClassicSingleMaterialNode extends AbstractMaterialNode {
  static ShadowColor: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'shadowColor' });
  static ShadowAlpha: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'shadowAlpha' });
  static NonShadowAlpha: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'nonShadowAlpha' });
  static AllowableDepthError: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'allowableDepthError' });

  private encodedDepthRenderPass: RenderPass;

  constructor(encodedDepthRenderPass: RenderPass, { isSkinning, isLighting, colorAttachmentsNumber }: { isSkinning: boolean, isLighting: boolean, colorAttachmentsNumber: Count }) {
    super(ShadowMapDecodeClassicShader.getInstance(), "ShadowMapDecodeClassicShading"
      + (isSkinning ? '+skinning' : '')
      + (isLighting ? '' : '-lighting'));

    this.encodedDepthRenderPass = encodedDepthRenderPass;

    const encodedDepthFramebuffer = encodedDepthRenderPass.getFramebuffer();
    if (encodedDepthFramebuffer == null) {
      console.error('encodedDepthRenderPass does not have framebuffer');
      return;
    }
    const encodedDepthTexture = encodedDepthFramebuffer.colorAttachments[colorAttachmentsNumber];

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];
    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.ViewPosition, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        stage: ShaderType.VertexAndPixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true,
        initialValue: new Vector3(0, 0, 0), min: -Number.MAX_VALUE, max: Number.MAX_VALUE
      },
    );

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.LightViewProjectionMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: MutableMatrix44.zero(), min: -Number.MAX_VALUE, max: Number.MAX_VALUE,
      },
    );

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.ShadingModel, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(ShadingModel.Constant.index), min: 0, max: 3,
      },
      {
        semantic: ShaderSemantics.LightNumber, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Scalar(0), min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.Shininess, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: 5, min: 0, max: Number.MAX_VALUE,
      },
      {
        semantic: ShadowMapDecodeClassicSingleMaterialNode.ShadowAlpha, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(0.5), min: 0, max: 1,
      },
      {
        semantic: ShadowMapDecodeClassicSingleMaterialNode.NonShadowAlpha, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(0.0), min: 0, max: 1,
      },
      {
        semantic: ShadowMapDecodeClassicSingleMaterialNode.AllowableDepthError, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Scalar(0.0001), min: 0, max: 1,
      },
      {
        semantic: ShadowMapDecodeClassicSingleMaterialNode.ShadowColor, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector3(0, 0, 0), min: 0, max: 1,
      },
      {
        semantic: ShaderSemantics.DiffuseColorFactor, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: false,
        initialValue: new Vector4(1, 1, 1, 1), min: 0, max: 2, prefix: "material.",
      },
      {
        semantic: ShaderSemantics.DepthTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, encodedDepthTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: ShaderSemantics.DiffuseColorTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [1, AbstractMaterialNode.__dummyWhiteTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
    );

    shaderSemanticsInfoArray.push(
      {
        semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Scalar(30.0), min: 0, max: 100,
      },
      {
        semantic: ShaderSemantics.PointDistanceAttenuation, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true,
        initialValue: new Vector3(0.0, 0.1, 0.01), min: 0, max: 1,
      },
    );

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';

      shaderSemanticsInfoArray.push(
        {
          semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int,
          stage: ShaderType.VertexShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Scalar(0), min: 0, max: 1,
        },
        {
          semantic: ShaderSemantics.BoneCompressedChank, compositionType: CompositionType.Vec4Array, componentType: ComponentType.Float,
          stage: ShaderType.VertexShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true,
          initialValue: new VectorN(new Float32Array(0)), min: -Number.MAX_VALUE, max: Number.MAX_VALUE,
          maxIndex: 250,
        },
        {
          semantic: ShaderSemantics.BoneCompressedInfo, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
          stage: ShaderType.VertexShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true,
          initialValue: MutableVector4.zero(), min: -Number.MAX_VALUE, max: Number.MAX_VALUE,
        },
      );
    }

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';

      for (let i = 0; i < Config.maxLightNumberInShader; i++) {
        (function (idx) {
          shaderSemanticsInfoArray.push(
            {
              semantic: ShaderSemantics.LightPosition, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
              stage: ShaderType.PixelShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true,
              initialValue: new Vector4(0, 0, 0, 1), min: -Number.MAX_VALUE, max: Number.MAX_VALUE, prefix: `lights[${idx}].`,
              maxIndex: 4, index: idx,
            },
            {
              semantic: ShaderSemantics.LightDirection, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
              stage: ShaderType.PixelShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true,
              initialValue: new Vector4(0, 1, 0, 1), min: -1, max: 1, prefix: `lights[${idx}].`,
              maxIndex: 4, index: idx,
            },
            {
              semantic: ShaderSemantics.LightIntensity, compositionType: CompositionType.Vec4, componentType: ComponentType.Float,
              stage: ShaderType.PixelShader, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true,
              initialValue: new Vector4(1, 1, 1, 1), min: 0, max: 10, prefix: `lights[${idx}].`,
              maxIndex: 4, index: idx,
            }
          );
        })(i);
      }
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }


  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {

    if (args.setUniform) {
      AbstractMaterialNode.setWorldMatrix(shaderProgram, args.worldMatrix);
      AbstractMaterialNode.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }
    AbstractMaterialNode.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
    AbstractMaterialNode.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

    /// Skinning
    const skeletalComponent = args.entity.getComponent(SkeletalComponent) as SkeletalComponent;
    AbstractMaterialNode.setSkinning(shaderProgram, skeletalComponent, args.setUniform);

    // Lights
    AbstractMaterialNode.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);

    const __webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    __webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightViewProjectionMatrix.str, true, this.encodedDepthRenderPass.cameraComponent!.viewProjectionMatrix);

  }
}

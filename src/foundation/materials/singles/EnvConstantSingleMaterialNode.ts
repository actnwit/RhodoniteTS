import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import Vector4 from "../../math/Vector4";
import EnvConstantShader from "../../../webgl/shaders/EnvConstantShader";
import { ShaderType } from "../../definitions/ShaderType";
import Scalar from "../../math/Scalar";
import ComponentRepository from "../../core/ComponentRepository";
import CameraComponent from "../../components/CameraComponent";
import Material from "../core/Material";

export default class EnvConstantSingleMaterialNode extends AbstractMaterialNode {
  static envRotation = new ShaderSemanticsClass({ str: 'envRotation' });

  constructor() {
    super(EnvConstantShader.getInstance(), "envConstantShading");

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.DiffuseColorFactor,
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 2,
        isSystem: false,
        initialValue: new Vector4(1, 1, 1, 1)
      },
      {
        semantic: ShaderSemantics.ColorEnvTexture,
        compositionType: CompositionType.TextureCube,
        componentType: ComponentType.Int,
        stage: ShaderType.PixelShader,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isSystem: false,
        initialValue: [
          0,
          AbstractMaterialNode.__dummyBlackCubeTexture
        ]
      },
      {
        semantic: EnvConstantSingleMaterialNode.envRotation,
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        stage: ShaderType.PixelShader,
        min: -Math.PI,
        max: Math.PI,
        isSystem: false,
        initialValue: new Scalar(0)
      },
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {

    if (args.setUniform) {
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
    }

    /// Matrices
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }
    if (cameraComponent) {
      this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);
    }

  }
}

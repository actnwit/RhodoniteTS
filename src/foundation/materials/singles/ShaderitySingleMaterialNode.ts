import {
  ShaderSemantics,
  ShaderSemanticsInfo,
} from '../../definitions/ShaderSemantics';
import AbstractMaterialNode from '../core/AbstractMaterialNode';
import Material from '../core/Material';
import {ShaderityObject} from 'shaderity';
import ShaderityUtility from '../core/ShaderityUtility';
import {ShaderType} from '../../definitions/ShaderType';
import ComponentRepository from '../../core/ComponentRepository';
import LightComponent from '../../components/Camera/CameraComponent';
import GlobalDataRepository from '../../core/GlobalDataRepository';
import MeshComponent from '../../components/Mesh/MeshComponent';
import BlendShapeComponent from '../../components/BlendShape/BlendShapeComponent';
import { RenderingArg } from '../../../webgl/types/CommomTypes';
import { Is } from '../../misc/Is';

// TODO: support fastest strategy (Currently, this material node can be used when the webgl strategy is uniform only)
export default class ShaderitySingleMaterialNode extends AbstractMaterialNode {
  constructor({
    name,
    vertexShaderityObj,
    pixelShaderityObj,
  }: {
    name: string;
    vertexShaderityObj: ShaderityObject;
    pixelShaderityObj: ShaderityObject;
  }) {
    super(null, name, {});

    const vertexShaderData = ShaderityUtility.getShaderDataRefection(
      vertexShaderityObj,
      AbstractMaterialNode.__semanticsMap.get(this.shaderFunctionName)
    );
    const pixelShaderData = ShaderityUtility.getShaderDataRefection(
      pixelShaderityObj,
      AbstractMaterialNode.__semanticsMap.get(this.shaderFunctionName)
    );
    this.__vertexShaderityObject = vertexShaderityObj;
    this.__pixelShaderityObject = pixelShaderityObj;

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] =
      vertexShaderData.shaderSemanticsInfoArray.concat();

    for (const pixelShaderSemanticsInfo of pixelShaderData.shaderSemanticsInfoArray) {
      const foundShaderSemanticsInfo = shaderSemanticsInfoArray.find(
        (info: ShaderSemanticsInfo) => {
          return info.semantic.str === pixelShaderSemanticsInfo.semantic.str;
        }
      );
      if (foundShaderSemanticsInfo) {
        foundShaderSemanticsInfo.stage = ShaderType.VertexAndPixelShader;
      } else {
        shaderSemanticsInfoArray.push(pixelShaderSemanticsInfo);
      }
    }

    ShaderitySingleMaterialNode.__removeUselessShaderSemantics(
      shaderSemanticsInfoArray
    );

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

      if (firstTime || args.isVr) {
        let cameraComponent = args.renderPass.cameraComponent;
        if (cameraComponent == null) {
          cameraComponent = ComponentRepository.getInstance().getComponent(
            LightComponent,
            LightComponent.main
          ) as LightComponent;
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
      }

      if (firstTime) {
        this.setLightsInfo(
          shaderProgram,
          args.lightComponents,
          material,
          args.setUniform
        );
      }

      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);
    }

    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(
      shaderProgram,
      args.entity.getMesh(),
      args.primitive,
      blendShapeComponent
    );
  }

  private static __removeUselessShaderSemantics(
    shaderSemanticsInfoArray: ShaderSemanticsInfo[]
  ) {
    const globalPropertyStructs =
      GlobalDataRepository.getInstance().getGlobalProperties();

    for (const globalPropertyStruct of globalPropertyStructs) {
      const globalShaderSemanticsInfo =
        globalPropertyStruct.shaderSemanticsInfo;

      const duplicateElemId = shaderSemanticsInfoArray.findIndex(
        shaderSemanticsInfo =>
          shaderSemanticsInfo.semantic.str ===
          globalShaderSemanticsInfo.semantic.str
      );

      if (duplicateElemId !== -1) {
        shaderSemanticsInfoArray.splice(duplicateElemId, 1);
      }
    }

    const defaultShaderSemantics = [
      ShaderSemantics.VertexAttributesExistenceArray,
      ShaderSemantics.WorldMatrix,
      ShaderSemantics.NormalMatrix,
      ShaderSemantics.PointSize,
      ShaderSemantics.PointDistanceAttenuation,
    ];

    for (const shaderSemantic of defaultShaderSemantics) {
      const duplicateElemId = shaderSemanticsInfoArray.findIndex(
        shaderSemanticsInfo =>
          shaderSemanticsInfo.semantic.str === shaderSemantic.str
      );

      if (duplicateElemId !== -1) {
        shaderSemanticsInfoArray.splice(duplicateElemId, 1);
      }
    }
  }
}

import {
  ShaderSemantics,
  ShaderSemanticsInfo,
} from '../../definitions/ShaderSemantics';
import AbstractMaterialNode from '../core/AbstractMaterialNode';
import Material from '../core/Material';
import {ShaderityObject} from 'shaderity';
import ShaderityUtility from '../core/ShaderityUtility';
import {ShaderType} from '../../definitions/ShaderType';
import GlobalDataRepository from '../../core/GlobalDataRepository';

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
    args?: any;
  }) {}

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

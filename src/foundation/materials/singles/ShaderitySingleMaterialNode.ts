import {ShaderSemanticsInfo} from '../../definitions/ShaderSemantics';
import AbstractMaterialNode from '../core/AbstractMaterialNode';
import Material from '../core/Material';
import {ShaderityObject} from 'shaderity';
import ShaderityUtility from '../core/ShaderityUtility';
import {ShaderType} from '../../definitions/ShaderType';

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
}

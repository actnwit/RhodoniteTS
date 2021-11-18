import {ShaderSemanticsInfo} from '../../definitions/ShaderSemantics';
import AbstractMaterialNode from '../core/AbstractMaterialNode';
import Material from '../core/Material';
import {ShaderityObject} from 'shaderity';

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

    this.__vertexShaderityObject = vertexShaderityObj;
    this.__pixelShaderityObject = pixelShaderityObj;

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];
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

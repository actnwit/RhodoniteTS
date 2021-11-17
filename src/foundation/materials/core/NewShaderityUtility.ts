// import Shaderity, {ShaderityObject, TemplateObject} from 'shaderity';
import MemoryManager from '../../core/MemoryManager';
import {WellKnownComponentTIDs} from '../../components/WellKnownComponentTIDs';
import Config from '../../core/Config';

export type FillArgsObject = {
  [key: string]: string;
};

export default class NewShaderityUtility {
  private static __defaultTemplate = {
    WellKnownComponentTIDs,
    widthOfDataTexture: `const int widthOfDataTexture = ${MemoryManager.bufferWidthLength};`,
    heightOfDataTexture: `const int heightOfDataTexture = ${MemoryManager.bufferHeightLength};`,
    Config,
  };

  public static fillTemplate() {}
  // public static fillTemplate(
  //   shaderityObject: ShaderityObject,
  //   args: FillArgsObject
  // ): ShaderityObject {
  //   const templateObject = Object.assign(
  //     args,
  //     this.__defaultTemplate
  //   ) as TemplateObject;

  //   return Shaderity.fillTemplate(shaderityObject, templateObject);
  // }

  public static transformWebGLVersionTo() {}
  public static getReflection() {}
  public static getShaderDataRefection() {}
}

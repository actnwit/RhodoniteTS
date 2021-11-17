// import Shaderity, {ShaderityObject, TemplateObject} from 'shaderity';
import MemoryManager from '../../core/MemoryManager';
import {WellKnownComponentTIDs} from '../../components/WellKnownComponentTIDs';
import Config from '../../core/Config';

export type FillArgsObject = {
  [key: string]: string;
};

export default class NewShaderityUtility {
  public static fillTemplate() {}
  // public static fillTemplate(
  //   shaderityObject: ShaderityObject,
  //   args: FillArgsObject
  // ): ShaderityObject {
  //   const templateObject = Object.assign(args, {
  //     WellKnownComponentTIDs,
  //     widthOfDataTexture: `const int widthOfDataTexture = ${MemoryManager.bufferWidthLength};`,
  //     heightOfDataTexture: `const int heightOfDataTexture = ${MemoryManager.bufferHeightLength};`,
  //     Config,
  //   }) as TemplateObject;

  //   return Shaderity.fillTemplate(shaderityObject, templateObject);
  // }

  public static transformWebGLVersionTo() {}
  // public static transformWebGLVersion(
  //   shaderityObject: ShaderityObject,
  //   isWebGL2: boolean
  // ): ShaderityObject {
  //   if (isWebGL2) {
  //     return Shaderity.transformToGLSLES3(shaderityObject);
  //   } else {
  //     return Shaderity.transformToGLSLES1(shaderityObject, true);
  //   }
  // }

  public static getReflection() {}
  public static getShaderDataRefection() {}
}

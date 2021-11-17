// import Shaderity, {
//   Reflection,
//   ShaderityObject,
//   TemplateObject,
// } from 'shaderity';
import {
  ComponentType,
  ComponentTypeEnum,
} from '../../definitions/ComponentType';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../../definitions/CompositionType';
import {
  VertexAttribute,
  VertexAttributeEnum,
} from '../../definitions/VertexAttribute';
import MemoryManager from '../../core/MemoryManager';
import {WellKnownComponentTIDs} from '../../components/WellKnownComponentTIDs';
import Config from '../../core/Config';

export type FillArgsObject = {
  [key: string]: string;
};

export type VertexAttributesLayout = {
  names: string[];
  semantics: VertexAttributeEnum[];
  compositions: CompositionTypeEnum[];
  components: ComponentTypeEnum[];
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
  // public static getReflection( // getAttributeReflection
  //   shaderityObject: ShaderityObject
  // ): VertexAttributesLayout {
  //   const reflection = Shaderity.createReflectionObject(shaderityObject);
  //   this.__setDefaultAttributeSemanticMap(reflection);

  //   reflection.reflect();

  //   const names = reflection.attributesNames;
  //   const semantics = reflection.attributesSemantics.map(semantic => {
  //     return VertexAttribute.fromString(semantic);
  //   });
  //   const compositions = reflection.attributesTypes.map(type => {
  //     return CompositionType.fromGlslString(type);
  //   });
  //   const components = reflection.attributesTypes.map(type => {
  //     return ComponentType.fromGlslString(type);
  //   });

  //   return {
  //     names,
  //     semantics,
  //     compositions,
  //     components,
  //   };
  // }

  // private static __setDefaultAttributeSemanticMap(reflection: Reflection) {
  //   const attributeSemanticsMap = new Map();
  //   attributeSemanticsMap.set('instanceid', 'INSTANCE');
  //   attributeSemanticsMap.set('barycentriccoord', 'BARY_CENTRIC_COORD');

  //   reflection.addAttributeSemanticsMap(attributeSemanticsMap);
  // }

  public static getShaderDataRefection() {}
}

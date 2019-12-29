import Shaderity, { ShaderityObject } from "shaderity";
import { Reflection } from "shaderity";
import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
import { VertexAttributeEnum, VertexAttribute } from "../definitions/VertexAttribute";
import { CompositionType } from "../definitions/CompositionType";
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import Config from "../core/Config";
import { ComponentType } from "../definitions/ComponentType";
import { ShaderSemantics, ShaderSemanticsClass, ShaderSemanticsInfo } from "../definitions/ShaderSemantics";
import MutableVector2 from "../math/MutableVector2";
import MutableVector3 from "../math/MutableVector3";
import MutableVector4 from "../math/MutableVector4";
import MutableScalar from "../math/MutableScalar";
import MutableMatrix33 from "../math/MutableMatrix33";
import MutableMatrix44 from "../math/MutableMatrix44";

export default class ShaderityUtility {
  static __instance: ShaderityUtility;
  private __shaderity = Shaderity.getInstance();
  private __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();

  private constructor() {
    const attributeSemanticsMap = new Map();
    attributeSemanticsMap.set('instanceid', 'INSTANCE');
    attributeSemanticsMap.set('facenormal', 'FACE_NORMAL');
    attributeSemanticsMap.set('barycentriccoord', 'BARY_CENTRIC_COORD');
    this.__shaderity.addAttributeSemanticsMap(attributeSemanticsMap);
  }

  static getInstance(): ShaderityUtility {
    if (!this.__instance) {
      this.__instance = new ShaderityUtility();
    }
    return this.__instance;
  }

  getVertexShaderBody(shaderityObject: ShaderityObject, args: any) {
    const obj = this.__shaderity.fillTemplate(shaderityObject, {
      definitions: (typeof args.definitions !== 'undefined') ? args.definitions : '',
      matricesGetters: (typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : '',
      getters: (typeof args.getters !== 'undefined') ? args.getters : '',
      WellKnownComponentTIDs: WellKnownComponentTIDs
    });

    const isWebGL2 = this.__webglResourceRepository?.currentWebGLContextWrapper?.isWebGL2;
    const code = this.__shaderity.transformTo(isWebGL2 ? 'WebGL2' : 'WebGL1', obj).code;

    return code;
  }

  getPixelShaderBody(shaderityObject: ShaderityObject, args: any) {
    const obj = this.__shaderity.fillTemplate(shaderityObject, {
      definitions: (typeof args.definitions !== 'undefined') ? args.definitions : '',
      getters: (typeof args.getters !== 'undefined') ? args.getters : '',
      Config: Config,
      WellKnownComponentTIDs: WellKnownComponentTIDs
    });
    const isWebGL2 = this.__webglResourceRepository?.currentWebGLContextWrapper?.isWebGL2;
    const code = this.__shaderity.transformTo(isWebGL2 ? 'WebGL2' : 'WebGL1', obj).code;

    return code;
  }

  getReflection(shaderityObject: ShaderityObject): {
    names: string[],
    semantics: VertexAttributeEnum[],
    compositions: CompositionTypeEnum[]
  } {
    const reflection = this.__shaderity.reflect(shaderityObject);
    const reflectionSoA: any = {};
    reflectionSoA.names = reflection.attributesNames;
    reflectionSoA.semantics = reflection.attributesSemantics.map((semantic) => { return VertexAttribute.fromString(semantic) });;
    reflectionSoA.compositions = reflection.attributesTypes.map((type) => { return CompositionType.fromGlslString(type) });;
    reflectionSoA.components = reflection.attributesTypes.map((type) => { return ComponentType.fromGlslString(type) });;

    return reflectionSoA;
  }

  getShaderDataRefection(shaderityObject: ShaderityObject): ShaderSemanticsInfo[] {

    const splitCode = shaderityObject.code.split(/\r\n|\n/);

    const shaderSemanticsInfoArray = [];
    for (let row of splitCode) {
      const reg = /\/\/[\t ]*rn_data:[\t ]*(.)+/;
      const match = row.match(reg);

      if (match) {
        const shaderSemanticsInfo: any = {};
        const rnData = match[0];
        const semantic = rnData.match(/rn_data:[\t ]*(\w+)[\t ]*:/);
        if (semantic) {
          const semanticName = semantic[1];
          const variableName = semanticName.charAt(0).toLowerCase() + semanticName.slice(1);
          const systemSemantic = ShaderSemantics.fromString(semanticName);
          shaderSemanticsInfo.semantic = systemSemantic;
          if (systemSemantic == null) {
            const semantic = new ShaderSemanticsClass({str: variableName})
            shaderSemanticsInfo.semantic = semantic;
          }
        }
        const componentType = rnData.match(/componentType[\t ]*=[\t ]*(\w+)[,\t ]*/);
        if (componentType) {
          const componentTypeText = componentType[1];
          shaderSemanticsInfo.componentType = ComponentType.fromString(componentTypeText);
        }
        const compositionType = rnData.match(/compositionType[\t ]*=[\t ]*(\w+)[,\t ]*/);
        if (compositionType) {
          const compositionTypeText = compositionType[1];
          shaderSemanticsInfo.compositionType = CompositionType.fromString(compositionTypeText);
        }
        const soloDatum = rnData.match(/soloDatum[\t ]*=[\t ]*(\w+)[,\t ]*/);
        if (soloDatum) {
          const soloDatumText = soloDatum[1];
          let bool = false;
          if (soloDatumText === 'true') {
            bool = true;
          }
          shaderSemanticsInfo.soloDatum = bool;
        }
        const initialValue = rnData.match(/initialValue[\t ]*=[\t ]*(.+)[,\t ]*/);
        if (initialValue) {
          const initialValueText = initialValue[1];
          const tuple = initialValueText.match(/\(([\d, ]+)\)/);
          if (tuple) {
            const text = tuple[1];
            const split = text.split(',');
            switch (split.length) {
              case 2:
                shaderSemanticsInfo.initialValue = new MutableVector2(parseFloat(split[0]), parseFloat(split[1]))
                break;
              case 3:
                shaderSemanticsInfo.initialValue = new MutableVector3(parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]))
                break;
              case 4:
                shaderSemanticsInfo.initialValue = new MutableVector4(parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3]))
                break;
              case 9:
                shaderSemanticsInfo.initialValue = new MutableMatrix33(
                  parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]),
                  parseFloat(split[3]), parseFloat(split[4]), parseFloat(split[5]),
                  parseFloat(split[6]), parseFloat(split[7]), parseFloat(split[8]))
                break;
              case 16:
                shaderSemanticsInfo.initialValue = new MutableMatrix44(
                  parseFloat(split[0]), parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3]),
                  parseFloat(split[4]), parseFloat(split[5]), parseFloat(split[6]), parseFloat(split[7]),
                  parseFloat(split[8]), parseFloat(split[9]), parseFloat(split[10]), parseFloat(split[11]),
                  parseFloat(split[12]), parseFloat(split[13]), parseFloat(split[14]), parseFloat(split[15]))
                break;
              default:
              console.error('Invalid format');
            }
          } else {
            shaderSemanticsInfo.initialValue = new MutableScalar(parseFloat(initialValueText));
          }
        }
        shaderSemanticsInfoArray.push(shaderSemanticsInfo)
      }
    }

    return shaderSemanticsInfoArray;
  }
}

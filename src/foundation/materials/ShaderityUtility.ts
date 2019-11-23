import Shaderity, { ShaderityObject } from "shaderity";
import { Reflection } from "shaderity";
import { VertexAttributeEnum, CompositionTypeEnum } from "../main";
import { VertexAttribute } from "../definitions/VertexAttribute";
import { CompositionType } from "../definitions/CompositionType";
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import Config from "../core/Config";

export default class ShaderityUntility {
  static __instance: ShaderityUntility;
  private __shaderity = Shaderity.getInstance();
  private __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();

  private constructor() {
    const attributeSemanticsMap = new Map();
    attributeSemanticsMap.set('instanceid', 'INSTANCE');
    attributeSemanticsMap.set('facenormal', 'FACE_NORMAL');
    attributeSemanticsMap.set('barycentriccoord', 'BARY_CENTRIC_COORD');
    this.__shaderity.addAttributeSemanticsMap(attributeSemanticsMap);
  }

  static getInstance(): ShaderityUntility{
    if (!this.__instance) {
      this.__instance = new ShaderityUntility();
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
    reflectionSoA.semantics = reflection.attributesSemantics.map((semantic)=>{return VertexAttribute.fromString(semantic)});;
    reflectionSoA.compositions = reflection.attributesTypes.map((type)=>{return CompositionType.fromString(type)});;

    return reflectionSoA;
  }

}

import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";
import { WellKnownComponentTIDs } from "../../foundation/components/WellKnownComponentTIDs";
import classicSingleShaderVertex from "../shaderity_shaders/classicSingleShader.vert";
import classicSingleShaderFragment from "../shaderity_shaders/classicSingleShader.frag";
import Shaderity from "shaderity";
import { Reflection } from "shaderity";

export type AttributeNames = Array<string>;

export default class ClassicShader extends GLSLShader implements ISingleShader {
  static __instance: ClassicShader;
  public static readonly materialElement = ShaderNode.ClassicShading;
  private __shaderity = Shaderity.getInstance();
  private __reflection: Reflection;

  private constructor() {
    super();
    const attributeSemanticsMap = new Map();
    attributeSemanticsMap.set('instanceid', 'INSTANCE');
    attributeSemanticsMap.set('facenormal', 'FACE_NORMAL');
    attributeSemanticsMap.set('barycentriccoord', 'BARY_CENTRIC_COORD');
    this.__shaderity.addAttributeSemanticsMap(attributeSemanticsMap);
    this.__reflection = this.__shaderity.reflect(classicSingleShaderVertex);
  }

  static getInstance(): ClassicShader {
    if (!this.__instance) {
      this.__instance = new ClassicShader();
    }
    return this.__instance;
  }

  getVertexShaderBody(args: any) {
    const obj = this.__shaderity.fillTemplate(classicSingleShaderVertex, {
      definitions: (typeof args.definitions !== 'undefined') ? args.definitions : '',
      matricesGetters: (typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : '',
      getters: (typeof args.getters !== 'undefined') ? args.getters : '',
      WellKnownComponentTIDs: WellKnownComponentTIDs
    });
    const isWebGL2 = this.__webglResourceRepository?.currentWebGLContextWrapper?.isWebGL2;
    const code = this.__shaderity.transformTo(isWebGL2 ? 'WebGL2' : 'WebGL1', obj).code;

    return code;
  }

  getPixelShaderBody(args: any) {
    const obj = this.__shaderity.fillTemplate(classicSingleShaderFragment, {
      definitions: (typeof args.definitions !== 'undefined') ? args.definitions : '',
      getters: (typeof args.getters !== 'undefined') ? args.getters : '',
      Config: Config,
      WellKnownComponentTIDs: WellKnownComponentTIDs
    });
    const isWebGL2 = this.__webglResourceRepository?.currentWebGLContextWrapper?.isWebGL2;
    const code = this.__shaderity.transformTo(isWebGL2 ? 'WebGL2' : 'WebGL1', obj).code;

    return code;
  }

  get attributeNames(): AttributeNames {
    return this.__reflection.attributesNames;
  }
  get attributeSemantics(): Array<VertexAttributeEnum> {
    const semantics = this.__reflection.attributesSemantics;
    return semantics.map((semantic)=>{return VertexAttribute.fromString(semantic)});
  }
  get attributeCompositions(): Array<CompositionTypeEnum> {
    const types = this.__reflection.attributesTypes;
    return types.map((type)=>{return CompositionType.fromGlslString(type)});
  }
}

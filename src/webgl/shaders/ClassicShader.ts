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

export type AttributeNames = Array<string>;

export default class ClassicShader extends GLSLShader implements ISingleShader {
  static __instance: ClassicShader;
  public static readonly materialElement = ShaderNode.ClassicShading;
  private __shaderity = Shaderity.getInstance();

  private constructor() {
    super();
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

  attributeNames: AttributeNames = [
    'a_position', 'a_color', 'a_normal',
    'a_texcoord',
    'a_joint', 'a_weight', 'a_baryCentricCoord',
    'a_instanceID'
  ];
  attributeSemantics: Array<VertexAttributeEnum> = [
    VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Normal,
    VertexAttribute.Texcoord0,
    VertexAttribute.Joints0, VertexAttribute.Weights0, VertexAttribute.BaryCentricCoord,
    VertexAttribute.Instance
  ];
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [
      CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3,
      CompositionType.Vec2,
      CompositionType.Vec4, CompositionType.Vec4, CompositionType.Vec4,
      CompositionType.Scalar
    ];
  }
}

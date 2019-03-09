import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode } from "../definitions/AlphaMode";
import { ShaderNode } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum, ShaderSemanticsInfo } from "../definitions/ShaderSemantics";
import { CompositionType } from "../definitions/CompositionType";
import MathClassUtil from "../math/MathClassUtil";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import { ComponentType } from "../definitions/ComponentType";
import Vector2 from "../math/Vector2";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";


export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];
  private __fields: Map<ShaderSemanticsEnum, any> = new Map();
  private __fieldsInfo: Map<ShaderSemanticsEnum, ShaderSemanticsInfo> = new Map();
  public _shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  public alphaMode = AlphaMode.Opaque;

  constructor(materialNodes: AbstractMaterialNode[]) {
    super();
    this.__materialNodes = materialNodes;

    this.initialize();
  }

  initialize() {
    this.__materialNodes.forEach((materialNode)=>{
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      semanticsInfoArray.forEach((semanticsInfo)=>{
        this.__fields.set(semanticsInfo.semantic!, semanticsInfo.initialValue);
        this.__fieldsInfo.set(semanticsInfo.semantic!, semanticsInfo);
      });
    });
  }

  setParameter(shaderSemantic: ShaderSemanticsEnum, value: any) {
    this.__fields.set(shaderSemantic, value);
  }

  setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: CGAPIResourceHandle) {
    const vec2 = this.__fields.get(shaderSemantic)!;
    this.__fields.set(shaderSemantic, new Vector2(vec2.x, value));
  }

  getParameter(shaderSemantic: ShaderSemanticsEnum) {
    return this.__fields.get(shaderSemantic);
  }

  setUniformLocations(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    let args: ShaderSemanticsInfo[] = [];
    this.__materialNodes.forEach((materialNode)=>{
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      args = args.concat(semanticsInfoArray);
    });
    webglResourceRepository.setupUniformLocations(shaderProgramUid, args);
  }

  setUniformValues(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const gl = webglResourceRepository.currentWebGLContextWrapper!.getRawContext();
    this.__fields.forEach((value, key)=>{
      const info = this.__fieldsInfo.get(key)!;
      let setAsMatrix = false;
      if (info.compositionType === CompositionType.Mat3 || info.compositionType === CompositionType.Mat4) {
        setAsMatrix = true;
      }
      let componentType = 'f';
      if (info.componentType === ComponentType.Int || info.componentType === ComponentType.Short || info.componentType === ComponentType.Byte) {
        componentType = 'i';
      }

      if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
        webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, info.compositionType!.getNumberOfComponents(), componentType, false, {x: value.x});
      } else if (info.compositionType !== CompositionType.Scalar) {
        webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, info.compositionType!.getNumberOfComponents(), componentType, true, {x: value.v});
      } else {
        webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, info.compositionType!.getNumberOfComponents(), componentType, false, {x: value});
      }
      if (info.compositionType === CompositionType.Texture2D) {
        webglResourceRepository.bindTexture2D(value.x, value.y);
      } else if (info.compositionType === CompositionType.TextureCube) {
        webglResourceRepository.bindTextureCube(value.x, value.y);
      }
    });
  }

  createProgram(vertexShaderMethodDefinitions_uniform: string) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    this.__materialNodes.forEach((materialNode)=>{
      const glslShader = (materialNode.constructor as any).shader;
      const glslShaderClass = glslShader.constructor;
      let vertexShader = glslShader.vertexShaderVariableDefinitions +
        vertexShaderMethodDefinitions_uniform +
        glslShader.vertexShaderBody
      let fragmentShader = glslShader.fragmentShader;

      this._shaderProgramUid = webglResourceRepository.createShaderProgram(
        {
          vertexShaderStr: vertexShader,
          fragmentShaderStr: fragmentShader,
          attributeNames: glslShaderClass.attributeNames,
          attributeSemantics: glslShaderClass.attributeSemantics
        }
      );
    });
  }

  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    } else {
      return false;
    }
  }
}

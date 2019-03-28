import RnObject from "../core/RnObject";
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
import { runInThisContext } from "vm";
import GLSLShader from "../../webgl/shaders/GLSLShader";
import GetVarsMaterialNode from "./GetVarsMaterialNode";
import { pathExists } from "fs-extra";


export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];
  private __fields: Map<ShaderSemanticsEnum, any> = new Map();
  private __fieldsInfo: Map<ShaderSemanticsEnum, ShaderSemanticsInfo> = new Map();
  public _shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  public alphaMode = AlphaMode.Opaque;
  private static __shaderMap: Map<number, CGAPIResourceHandle> = new Map();
  private __startMaterialNode?: AbstractMaterialNode;
  private __materialNodesForTest: AbstractMaterialNode[] = [];

  constructor(materialNodes: AbstractMaterialNode[]) {
    super();
    this.__materialNodes = materialNodes;

    this.initialize();
  }

  setMaterialNodes(materialNodes: AbstractMaterialNode[], startMaterialNode: AbstractMaterialNode) {
    this.__materialNodesForTest = materialNodes;
    this.__startMaterialNode = startMaterialNode;
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

  setUniformValues(shaderProgramUid: CGAPIResourceHandle, force: boolean) {
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

      let updated;
      if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
        updated = webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, info.compositionType!.getNumberOfComponents(), componentType, false, {x: value.x}, {force: force});
      } else if (info.compositionType !== CompositionType.Scalar) {
        updated = webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, info.compositionType!.getNumberOfComponents(), componentType, true, {x: value.v}, {force: force});
      } else {
        updated = webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, info.compositionType!.getNumberOfComponents(), componentType, false, {x: value}, {force: force});
      }
      if (updated) {
        if (info.compositionType === CompositionType.Texture2D) {
          webglResourceRepository.bindTexture2D(value.x, value.y);
        } else if (info.compositionType === CompositionType.TextureCube) {
          webglResourceRepository.bindTextureCube(value.x, value.y);
        }
      }
    });
  }

  createProgram(vertexShaderMethodDefinitions_uniform: string) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    this.__materialNodes.forEach((materialNode)=>{
      const glslShader = materialNode.shader;

      // Shader Construction
      let vertexShader = glslShader.glslBegin +
        vertexShaderMethodDefinitions_uniform +
        glslShader.vertexShaderDefinitions +
        glslShader.glslMainBegin +
        glslShader.vertexShaderBody +
        glslShader.glslMainEnd;
      let fragmentShader = glslShader.pixelShaderBody;

      const shaderCharCount = (vertexShader + fragmentShader).length;

      // Cache
      if (Material.__shaderMap.has(shaderCharCount)) {
        this._shaderProgramUid = Material.__shaderMap.get(shaderCharCount)!;
        return this._shaderProgramUid;
      } else {
        this._shaderProgramUid = webglResourceRepository.createShaderProgram(
          {
            vertexShaderStr: vertexShader,
            fragmentShaderStr: fragmentShader,
            attributeNames: glslShader.attributeNames,
            attributeSemantics: glslShader.attributeSemantics
          }
        );
        Material.__shaderMap.set(shaderCharCount, this._shaderProgramUid);
        return this._shaderProgramUid;
      }
    });
  }

  createProgramString() {
    const firstMaterialNode = this.__materialNodesForTest[0];
    let vertexShader = firstMaterialNode.shader.glslBegin;
    let pixelShader = firstMaterialNode.shader.glslBegin;

    // attribute variables definitions
    for (let i=0; i<this.__materialNodesForTest.length; i++) {
      const materialNode = this.__materialNodesForTest[i];
      const attributeNames = materialNode.shader.attributeNames;
      const attributeSemantics = materialNode.shader.attributeSemantics;
      const attributeCompositions = materialNode.shader.attributeCompositions;
      for (let j=0; j<attributeSemantics.length; j++) {
        const attributeName = attributeNames[j];
        const attributeComposition = attributeCompositions[j];
        vertexShader += `${attributeComposition.getGlslStr(ComponentType.Float)} ${attributeName};\n`;
      }
    }
    vertexShader += '\n';

    // uniform variables definitions
    for (let i=0; i<this.__materialNodesForTest.length; i++) {
      const materialNode = this.__materialNodesForTest[i];
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      for (let j=0; j<semanticsInfoArray.length; j++) {
        const semanticInfo = semanticsInfoArray[j];
        const attributeComposition = semanticInfo.compositionType!;
        vertexShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.singularStr};\n`;
      }
    }
    vertexShader += '\n';

    // function definitions
    for (let i=0; i<this.__materialNodesForTest.length; i++) {
      const materialNode = this.__materialNodesForTest[i];
      vertexShader += materialNode.shader.vertexShaderDefinitions;
      pixelShader += materialNode.shader.pixelShaderDefinitions;
    }

    // remove node which don't have inputConnections (except first node)
    const vertexMaterialNodes = [];
    const pixelMaterialNodes = [];
    for (let i=0; i<this.__materialNodesForTest.length; i++) {
      const materialNode = this.__materialNodesForTest[i];
      if (i === 0 || materialNode.vertexInputConnections.length > 0) {
        vertexMaterialNodes.push(materialNode);
      }
      if (i === 0 || materialNode.pixelInputConnections.length > 0) {
        pixelMaterialNodes.push(materialNode);
      }
    }

    // vertex main process (temporary variable definitions)
    {
      vertexShader += firstMaterialNode.shader.glslMainBegin;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      for (let i=0; i<vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i-1 >= 0) {
          if (varOutputNames[i-1] == null) {
            varOutputNames[i-1] = [];
          }
        }
        for (let j=0; j<materialNode.vertexInputConnections.length; j++) {
          const inputConnection = materialNode.vertexInputConnections[j];
          const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
          const outputSocketOfPrev = inputNode.getVertexOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getVertexInput(inputConnection.inputNameOfThis);
          const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNode.materialNodeUid}`;

          varInputNames[i].push(varName);
          if (i-1 >= 0) {
            varOutputNames[i-1].push(varName);
          }

          const rowStr = `${glslTypeStr} ${varName};\n`;
          vertexShader += rowStr;
        }

      }
      for (let i=0; i<vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];

          const functionName = materialNode.shaderFunctionName;

          const varNames = varInputNames[i].concat(varOutputNames[i]);
          let rowStr = `${functionName}(`;
          for (let k=0; k<varNames.length; k++) {
            const varName = varNames[k];
            if (varName == null) {
              continue;
            }
            if (k!==0) {
              rowStr += ', ';
            }
            rowStr += varNames[k];
          }
          rowStr += ');\n';
          vertexShader += rowStr;
      }

      vertexShader += firstMaterialNode.shader.glslMainEnd;
    }

    // pixel main process (temporary variable definitions)
    {
      pixelShader += firstMaterialNode.shader.glslMainBegin;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      for (let i=0; i<pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i-1 >= 0) {
          if (varOutputNames[i-1] == null) {
            varOutputNames[i-1] = [];
          }
        }

        for (let j=0; j<materialNode.pixelInputConnections.length; j++) {
          const inputConnection = materialNode.pixelInputConnections[j];
          const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
          const outputSocketOfPrev = inputNode.getPixelOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getPixelInput(inputConnection.inputNameOfThis);
          const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNode.materialNodeUid}`;

          varInputNames[i].push(varName);
          if (i-1 >= 0) {
            varOutputNames[i-1].push(varName);
          }

          const rowStr = `${glslTypeStr} ${varName};\n`;
          pixelShader += rowStr;
        }
      }

      for (let i=0; i<pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];
        const functionName = materialNode.shaderFunctionName;

        const varNames = varInputNames[i].concat(varOutputNames[i]);
        let rowStr = `${functionName}(`;
        for (let k=0; k<varNames.length; k++) {
          const varName = varNames[k];
          if (varName == null) {
            continue;
          }
          if (k!==0) {
            rowStr += ', ';
          }
          rowStr += varNames[k];
        }
        rowStr += ');\n';
        pixelShader += rowStr;
      }

      pixelShader += firstMaterialNode.shader.glslMainEnd;
    }

    return vertexShader + '\n\n\n\n' + pixelShader;
  }

  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    } else {
      return false;
    }
  }
}

import RnObject from "../core/RnObject";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode } from "../definitions/AlphaMode";
import { ShaderNode } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum, ShaderSemanticsInfo, ShaderSemanticsClass } from "../definitions/ShaderSemantics";
import { CompositionType } from "../definitions/CompositionType";
import MathClassUtil from "../math/MathClassUtil";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import { ComponentType } from "../definitions/ComponentType";
import Vector2 from "../math/Vector2";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import { runInThisContext } from "vm";
import GLSLShader, { AttributeNames } from "../../webgl/shaders/GLSLShader";
import GetVarsMaterialNode from "./GetVarsMaterialNode";
import { pathExists } from "fs-extra";
import { VertexAttributeEnum } from "../main";
import { VertexAttribute } from "../definitions/VertexAttribute";
import AbstractTexture from "../textures/AbstractTexture";


export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];
  private __fields: Map<string, any> = new Map();
  private __fieldsInfo: Map<string, ShaderSemanticsInfo> = new Map();
  public _shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  public alphaMode = AlphaMode.Opaque;
  private static __shaderMap: Map<number, CGAPIResourceHandle> = new Map();
  private static __materials: Material[] = [];

  constructor(materialNodes: AbstractMaterialNode[]) {
    super();
    this.__materialNodes = materialNodes;

    Material.__materials.push(this);
    this.initialize();
  }

  static getAllMaterials() {
    return Material.__materials;
  }

  setMaterialNodes(materialNodes: AbstractMaterialNode[]) {
    this.__materialNodes = materialNodes;
  }

  initialize() {
    this.__materialNodes.forEach((materialNode) => {
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      semanticsInfoArray.forEach((semanticsInfo)=>{
        if (semanticsInfo.semantic != null) {
          this.__fields.set(semanticsInfo.semantic.str!, semanticsInfo.initialValue);
          this.__fieldsInfo.set(semanticsInfo.semantic.str!, semanticsInfo);
        } else {
          this.__fields.set(semanticsInfo.semanticStr!, semanticsInfo.initialValue);
          this.__fieldsInfo.set(semanticsInfo.semanticStr!, semanticsInfo);
        }
      });
    });
  }

  setParameter(shaderSemantic: ShaderSemanticsEnum, value: any): void;
  setParameter(shaderSemantic: string, value: any): void;
  setParameter(shaderSemantic: any, value: any): void {
    let shaderSemanticStr: string;
    if (typeof shaderSemantic === 'string') {
      shaderSemanticStr = shaderSemantic;
    } else {
      shaderSemanticStr = shaderSemantic.str;
    }
    if (this.__fieldsInfo.has(shaderSemanticStr)) {
      this.__fields.set(shaderSemanticStr, value);
    }
  }
  setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: AbstractTexture): void;
  setTextureParameter(shaderSemantic: string, value: AbstractTexture): void;
  setTextureParameter(shaderSemantic: any, value: AbstractTexture): void {
    let shaderSemanticStr: string;
    if (typeof shaderSemantic === 'string') {
      shaderSemanticStr = shaderSemantic;
    } else {
      shaderSemanticStr = shaderSemantic.str;
    }

    if (this.__fieldsInfo.has(shaderSemanticStr)) {
      const array = this.__fields.get(shaderSemanticStr)!;
      this.__fields.set(shaderSemanticStr, [array[0], value]);
    }
  }

  getParameter(shaderSemantic: ShaderSemanticsEnum): any;
  getParameter(shaderSemantic: string): any;
  getParameter(shaderSemantic: any): any {
    if (typeof shaderSemantic === 'string') {
      return this.__fields.get(shaderSemantic);
    } else {
      return this.__fields.get(shaderSemantic.str);
    }
  }

  setUniformLocations(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    let args: ShaderSemanticsInfo[] = [];
    this.__materialNodes.forEach((materialNode) => {
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      args = args.concat(semanticsInfoArray);
    });
    webglResourceRepository.setupUniformLocations(shaderProgramUid, args);
  }

  setUniformValues(shaderProgramUid: CGAPIResourceHandle, force: boolean) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const gl = webglResourceRepository.currentWebGLContextWrapper!.getRawContext();
    this.__fields.forEach((value, key) => {
      const info = this.__fieldsInfo.get(key)!;
      let setAsMatrix = false;
      let componentNumber = info.compositionType!.getNumberOfComponents();
      if (info.compositionType === CompositionType.Mat3) {
        setAsMatrix = true;
        componentNumber = 3;
      } else if (info.compositionType === CompositionType.Mat4) {
        setAsMatrix = true;
        componentNumber = 4;
      }

      let componentType = 'f';
      if (info.componentType === ComponentType.Int || info.componentType === ComponentType.Short || info.componentType === ComponentType.Byte) {
        componentType = 'i';
      }

      let updated;
      if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
        if (value[0] != null && value[1] != null) {
          updated = webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, componentNumber, componentType, false, { x: value[0] }, { force: force });
        }
      } else if (info.compositionType !== CompositionType.Scalar) {
        updated = webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, componentNumber, componentType, true, { x: value.v }, { force: force });
      } else {
        updated = webglResourceRepository.setUniformValue(shaderProgramUid, key, setAsMatrix, componentNumber, componentType, false, { x: value }, { force: force });
      }
      if (updated && value[0] != null && value[1] != null) {
        if (info.compositionType === CompositionType.Texture2D) {
          webglResourceRepository.bindTexture2D(value[0], (value[1] instanceof AbstractTexture) ? value[1].cgApiResourceUid : value[1]);
        } else if (info.compositionType === CompositionType.TextureCube) {
          webglResourceRepository.bindTextureCube(value[0], (value[1] instanceof AbstractTexture) ? value[1].cgApiResourceUid : value[1]);
        }
      }
    });
  }

  createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform: string) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const materialNode = this.__materialNodes[0];
    const glslShader = materialNode.shader;

    // Shader Construction
    let vertexShader = glslShader.glslBegin +
      `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
` +
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
  }

  createProgramString(vertexShaderMethodDefinitions_uniform = '') {

    // Find Start Node
    let firstMaterialNodeVertex: AbstractMaterialNode;
    let firstMaterialNodePixel: AbstractMaterialNode;
    for (let i = 0; i < this.__materialNodes.length; i++) {
      const materialNode = this.__materialNodes[i];
      if (materialNode.vertexInputConnections.length === 0) {
        firstMaterialNodeVertex = materialNode;
      }
      if (materialNode.pixelInputConnections.length === 0) {
        firstMaterialNodePixel = materialNode;
      }
    }

    // Topological Sorting
    const ignoredInputUidsVertex: Index[] = [firstMaterialNodeVertex!.materialNodeUid];
    const sortedNodeArrayVertex: AbstractMaterialNode[] = [firstMaterialNodeVertex!];
    const ignoredInputUidsPixel: Index[] = [firstMaterialNodePixel!.materialNodeUid];
    const sortedNodeArrayPixel: AbstractMaterialNode[] = [firstMaterialNodePixel!];
    /// delete first nodes from existing array
    const materialNodesVertex = this.__materialNodes.concat();
    const materialNodesPixel = this.__materialNodes.concat();
    materialNodesVertex.splice(materialNodesVertex.indexOf(firstMaterialNodeVertex!), 1);
    materialNodesPixel.splice(materialNodesPixel.indexOf(firstMaterialNodePixel!), 1);
    do {
      let materialNodeWhichHasNoInputs: AbstractMaterialNode;
      materialNodesVertex.forEach((materialNode) => {
        let inputCount = 0;
        for (let inputConnection of materialNode.vertexInputConnections) {
          if (ignoredInputUidsVertex.indexOf(inputConnection.materialNodeUid) === -1) {
            inputCount++;
          }
        }
        if (inputCount === 0) {
          materialNodeWhichHasNoInputs = materialNode;
        }
      });
      sortedNodeArrayVertex.push(materialNodeWhichHasNoInputs!);
      ignoredInputUidsVertex.push(materialNodeWhichHasNoInputs!.materialNodeUid);
      materialNodesVertex.splice(materialNodesVertex.indexOf(materialNodeWhichHasNoInputs!), 1);

    } while (materialNodesVertex.length !== 0);
    do {
      let materialNodeWhichHasNoInputs: AbstractMaterialNode;
      materialNodesPixel.forEach((materialNode) => {
        let inputCount = 0;
        for (let inputConnection of materialNode.pixelInputConnections) {
          if (ignoredInputUidsPixel.indexOf(inputConnection.materialNodeUid) === -1) {
            inputCount++;
          }
        }
        if (inputCount === 0) {
          materialNodeWhichHasNoInputs = materialNode;
        }
      });
      sortedNodeArrayPixel.push(materialNodeWhichHasNoInputs!);
      ignoredInputUidsPixel.push(materialNodeWhichHasNoInputs!.materialNodeUid);
      materialNodesPixel.splice(materialNodesPixel.indexOf(materialNodeWhichHasNoInputs!), 1);
    } while (materialNodesPixel.length !== 0);

    // Get GLSL Beginning code
    let vertexShader = firstMaterialNodeVertex!.shader.glslBegin;
    let pixelShader = firstMaterialNodeVertex!.shader.glslBegin;

    // attribute variables definitions in Vertex Shader
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      const attributeNames = materialNode.shader.attributeNames;
      const attributeSemantics = materialNode.shader.attributeSemantics;
      const attributeCompositions = materialNode.shader.attributeCompositions;
      for (let j = 0; j < attributeSemantics.length; j++) {
        const attributeName = attributeNames[j];
        const attributeComposition = attributeCompositions[j];
        vertexShader += `${attributeComposition.getGlslStr(ComponentType.Float)} ${attributeName};\n`;
      }
    }
    vertexShader += '\n';

    // uniform variables definitions
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      for (let j = 0; j < semanticsInfoArray.length; j++) {
        const semanticInfo = semanticsInfoArray[j];
        const attributeComposition = semanticInfo.compositionType!;
        vertexShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.singularStr};\n`;
      }
    }
    vertexShader += '\n';
    for (let i = 0; i < sortedNodeArrayPixel.length; i++) {
      const materialNode = sortedNodeArrayPixel[i];
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      for (let j = 0; j < semanticsInfoArray.length; j++) {
        const semanticInfo = semanticsInfoArray[j];
        const attributeComposition = semanticInfo.compositionType!;
        pixelShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.singularStr};\n`;
      }
    }
    pixelShader += '\n';


    // remove node which don't have inputConnections (except first node)
    const vertexMaterialNodes = [];
    const pixelMaterialNodes = [];
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      if (i === 0 || materialNode.vertexInputConnections.length > 0) {
        vertexMaterialNodes.push(materialNode);
      }
    }
    for (let i = 0; i < sortedNodeArrayPixel.length; i++) {
      const materialNode = sortedNodeArrayPixel[i];
      if (i === 0 || materialNode.pixelInputConnections.length > 0) {
        pixelMaterialNodes.push(materialNode);
      }
    }

    // Add additional functions by system

    vertexShader += `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`
    vertexShader += vertexShaderMethodDefinitions_uniform;

    // function definitions
    const existFunctions: string[] = [];
    for (let i = 0; i < vertexMaterialNodes.length; i++) {
      const materialNode = vertexMaterialNodes[i];
      if (existFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      vertexShader += materialNode.shader.vertexShaderDefinitions;
      pixelShader += materialNode.shader.pixelShaderDefinitions;
      existFunctions.push(materialNode.shaderFunctionName);
    }

    // vertex main process
    {
      vertexShader += firstMaterialNodeVertex!.shader.glslMainBegin;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      for (let i = 1; i < vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }
        for (let j = 0; j < materialNode.vertexInputConnections.length; j++) {
          const inputConnection = materialNode.vertexInputConnections[j];
          const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
          const outputSocketOfPrev = inputNode.getVertexOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getVertexInput(inputConnection.inputNameOfThis);
          const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNode.materialNodeUid}`;
          varInputNames[i].push(varName);

          const rowStr = `${glslTypeStr} ${varName};\n`;
          vertexShader += rowStr;
        }
        for (let j = i; j < vertexMaterialNodes.length; j++) {
          const materialNodeInner = vertexMaterialNodes[j];
          const prevMaterialNodeInner = vertexMaterialNodes[i - 1];
          for (let k = 0; k < materialNodeInner.vertexInputConnections.length; k++) {
            const inputConnection = materialNodeInner.vertexInputConnections[k];
            if (prevMaterialNodeInner != null && inputConnection.materialNodeUid !== prevMaterialNodeInner.materialNodeUid) {
              continue;
            }
            const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
            const outputSocketOfPrev = inputNode.getVertexOutput(inputConnection.outputNameOfPrev);
            const inputSocketOfThis = materialNodeInner.getVertexInput(inputConnection.inputNameOfThis);
            const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
            const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNodeInner.materialNodeUid}`;

            if (i - 1 >= 0) {
              varOutputNames[i - 1].push(varName);
            }

          }
        }

      }

      for (let i = 0; i < vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];

        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        let rowStr = `${functionName}(`;
        for (let k = 0; k < varNames.length; k++) {
          const varName = varNames[k];
          if (varName == null) {
            continue;
          }
          if (k !== 0) {
            rowStr += ', ';
          }
          rowStr += varNames[k];
        }
        rowStr += ');\n';
        vertexShader += rowStr;
      }

      vertexShader += firstMaterialNodeVertex!.shader.glslMainEnd;
    }

    // pixel main process
    {
      pixelShader += firstMaterialNodePixel!.shader.glslMainBegin;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      for (let i = 1; i < pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }
        for (let j = 0; j < materialNode.pixelInputConnections.length; j++) {
          const inputConnection = materialNode.pixelInputConnections[j];
          const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
          const outputSocketOfPrev = inputNode.getPixelOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getPixelInput(inputConnection.inputNameOfThis);
          const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNode.materialNodeUid}`;
          varInputNames[i].push(varName);

          const rowStr = `${glslTypeStr} ${varName};\n`;
          pixelShader += rowStr;
        }
        for (let j = i; j < pixelMaterialNodes.length; j++) {
          const materialNodeInner = pixelMaterialNodes[j];
          const prevMaterialNodeInner = pixelMaterialNodes[i - 1];
          for (let k = 0; k < materialNodeInner.pixelInputConnections.length; k++) {
            const inputConnection = materialNodeInner.pixelInputConnections[k];
            if (prevMaterialNodeInner != null && inputConnection.materialNodeUid !== prevMaterialNodeInner.materialNodeUid) {
              continue;
            }
            const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
            const outputSocketOfPrev = inputNode.getPixelOutput(inputConnection.outputNameOfPrev);
            const inputSocketOfThis = materialNodeInner.getPixelInput(inputConnection.inputNameOfThis);
            const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
            const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNodeInner.materialNodeUid}`;

            if (i - 1 >= 0) {
              varOutputNames[i - 1].push(varName);
            }

          }
        }

      }

      for (let i = 0; i < pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];

        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        let rowStr = `${functionName}(`;
        for (let k = 0; k < varNames.length; k++) {
          const varName = varNames[k];
          if (varName == null) {
            continue;
          }
          if (k !== 0) {
            rowStr += ', ';
          }
          rowStr += varNames[k];
        }
        rowStr += ');\n';
        pixelShader += rowStr;
      }

      pixelShader += firstMaterialNodePixel!.shader.glslMainEnd;
    }


    let attributeNames: AttributeNames = [];
    let attributeSemantics: Array<VertexAttributeEnum> = [];
    for (let i = 0; i < vertexMaterialNodes.length; i++) {
      const materialNode = vertexMaterialNodes[i];
      Array.prototype.push.apply(attributeNames, materialNode.shader.attributeNames);
      Array.prototype.push.apply(attributeSemantics, materialNode.shader.attributeSemantics);
    }
    // remove duplicate values
    attributeNames = Array.from(new Set(attributeNames))
    attributeSemantics = Array.from(new Set(attributeSemantics))

    return { vertexShader, pixelShader, attributeNames, attributeSemantics };
  }

  createProgram(vertexShaderMethodDefinitions_uniform: string) {

    if (this.__materialNodes[0].isSingleOperation) {
      return this.createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform);
    } else {
      const webglResourceRepository = WebGLResourceRepository.getInstance();
      let returnValue = this.createProgramString(vertexShaderMethodDefinitions_uniform);

      const shaderCharCount = (returnValue.vertexShader + returnValue.pixelShader).length;

      // Cache
      if (Material.__shaderMap.has(shaderCharCount)) {
        this._shaderProgramUid = Material.__shaderMap.get(shaderCharCount)!;
        return this._shaderProgramUid;
      } else {
        this._shaderProgramUid = webglResourceRepository.createShaderProgram(
          {
            vertexShaderStr: returnValue.vertexShader,
            fragmentShaderStr: returnValue.pixelShader,
            attributeNames: returnValue.attributeNames,
            attributeSemantics: returnValue.attributeSemantics
          }
        );
        Material.__shaderMap.set(shaderCharCount, this._shaderProgramUid);
        return this._shaderProgramUid;
      }
    }
  }

  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    } else {
      return false;
    }
  }
}

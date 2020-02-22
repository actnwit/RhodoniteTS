import { VertexAttributeEnum, VertexAttribute } from "../../../foundation/definitions/VertexAttribute";
import GLSLShader from "../GLSLShader";
import { CompositionTypeEnum } from "../../../foundation/definitions/CompositionType";
import { ShaderSocket } from "../../../foundation/materials/core/AbstractMaterialNode";

export type AttributeNames = Array<string>;

export default class BlockEndShader extends GLSLShader {
  constructor(
    private __functionName: string,
    private __valueInputs: ShaderSocket[],
    private __valueOutputs: ShaderSocket[]
    ) {
    super();
  }

  get vertexShaderDefinitions() {
    let funcStr = `void ${this.__functionName}(`;

    for (let i=0; i<this.__valueInputs.length; i++) {
      const input = this.__valueInputs[i];
      const type = input.compositionType.getGlslStr(input.componentType);
      funcStr += `
        in ${type} value${i},`
    }

    for (let i=0; i<this.__valueOutputs.length; i++) {
      const output = this.__valueOutputs[i];
      const type = output.compositionType.getGlslStr(output.componentType);
      funcStr += `
        out ${type} outValue${i}` + ((i === this.__valueOutputs.length-1) ? '' : ',');
    }

    funcStr +=`) {\n`;
    for (let i=0; i<this.__valueOutputs.length; i++) {
      funcStr += `
      outValue${i} = value${i};\n`;
    }
    funcStr += `}`;

    return funcStr;
  };

  get pixelShaderDefinitions() {
    return this.vertexShaderDefinitions;
  }

  get attributeNames(): AttributeNames {
    return [];
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}


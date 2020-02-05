import { ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
export default class EnvConstantSingleMaterialNode extends AbstractMaterialNode {
    static envRotation: ShaderSemanticsClass;
    constructor();
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}

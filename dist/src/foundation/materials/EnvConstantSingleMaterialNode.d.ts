import { ShaderSemanticsClass } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import Material from "./Material";
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

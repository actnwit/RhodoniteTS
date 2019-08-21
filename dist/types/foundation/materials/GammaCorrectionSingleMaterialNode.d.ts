import AbstractMaterialNode from "./AbstractMaterialNode";
import Material from "./Material";
export default class GammaCorrectionSingleMaterialNode extends AbstractMaterialNode {
    constructor();
    static initDefaultTextures(): Promise<void>;
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}

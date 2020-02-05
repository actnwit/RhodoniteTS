import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
export default class EntityUIDOutputSingleMaterialNode extends AbstractMaterialNode {
    constructor();
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}

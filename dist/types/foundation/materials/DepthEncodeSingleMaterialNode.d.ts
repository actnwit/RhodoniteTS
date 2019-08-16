import AbstractMaterialNode from "./AbstractMaterialNode";
import Material from "./Material";
export default class DepthEncodeSingleMaterialNode extends AbstractMaterialNode {
    constructor({ isSkinning }: {
        isSkinning: boolean;
    });
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}

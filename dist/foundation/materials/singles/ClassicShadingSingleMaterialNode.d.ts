import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
export default class ClassicShadingSingleMaterialNode extends AbstractMaterialNode {
    constructor({ isSkinning, isLighting }: {
        isSkinning: boolean;
        isLighting: boolean;
    });
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}

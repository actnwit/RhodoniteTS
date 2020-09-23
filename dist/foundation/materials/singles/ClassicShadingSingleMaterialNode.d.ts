import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
import { AlphaModeEnum } from "../../definitions/AlphaMode";
export default class ClassicShadingSingleMaterialNode extends AbstractMaterialNode {
    constructor({ isSkinning, isLighting, alphaMode }: {
        isSkinning: boolean;
        isLighting: boolean;
        alphaMode: AlphaModeEnum;
    });
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}

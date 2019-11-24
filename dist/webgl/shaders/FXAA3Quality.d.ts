import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
import GLSLShader from "./GLSLShader";
import ISingleShader from "./ISingleShader";
import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
export declare type AttributeNames = Array<string>;
/**
 * This class contains source code provided by NVIDIA Corporation.
 * FXAA antialiasing is developed by NVIDIA.
 * The codes of this class is modified from original code to work on WebGL1 and this library.
 * The modification for GLSL 100 is referred from Three.js, https://github.com/mrdoob/three.js/blob/5ba4c25bcb74577e1b1e14906f345135610a94f3/examples/js/shaders/FXAAShader.js
 * The original FXAA code is https://github.com/NVIDIAGameWorks/GraphicsSamples/blob/80e8ba8f5e8935821513207033490735dd3279d8/samples/es3-kepler/FXAA/FXAA3_11.h
 */
export default class FXAA3QualityShader extends GLSLShader implements ISingleShader {
    static instance: FXAA3QualityShader;
    private constructor();
    static getInstance(): FXAA3QualityShader;
    getVertexShaderBody(args: any): string;
    getFragmentShader(args: any): string;
    getPixelShaderBody(args: Object): string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

import { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { VertexAttributeEnum } from '../../foundation/definitions/VertexAttribute';
import { WebGLResourceRepository } from '../WebGLResourceRepository';
import { AttributeNames } from '../types/CommonTypes';
import { ShaderAttributeOrSemanticsOrString } from '../../foundation/materials/core/AbstractShaderNode';
export declare abstract class GLSLShader {
    static __instance: GLSLShader;
    __webglResourceRepository?: WebGLResourceRepository;
    constructor();
    get glsl_fragColor(): "" | "gl_FragColor = rt0;\n";
    get glsl_textureCube(): "texture" | "textureCube";
    static get glslMainBegin(): string;
    static get glslMainEnd(): string;
    getGlslVertexShaderProperies(str?: string): string;
    get prerequisites(): string;
    get mainPrerequisites(): "\n" | "\n      ";
    static getStringFromShaderAnyDataType(data: ShaderAttributeOrSemanticsOrString): string;
    abstract get attributeNames(): AttributeNames;
    abstract get attributeSemantics(): Array<VertexAttributeEnum>;
    abstract get attributeCompositions(): Array<CompositionTypeEnum>;
}

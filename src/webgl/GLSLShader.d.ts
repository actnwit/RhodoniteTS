import { VertexAttributeEnum } from "../foundation/definitions/VertexAttribute";
export declare type AttributeNames = Array<string>;
export default class GLSLShader {
    private static __instance;
    private __webglResourceRepository?;
    private constructor();
    static getInstance(): GLSLShader;
    readonly glsl_rt0: "layout(location = 0) out vec4 rt0;\n" | "vec4 rt0;\n";
    readonly glsl_fragColor: "" | "gl_FragColor = rt0;\n";
    readonly glsl_vertex_in: "in" | "attribute";
    readonly glsl_fragment_in: "in" | "varying";
    readonly glsl_vertex_out: "out" | "varying";
    readonly glsl_texture: "texture" | "texture2D";
    readonly glsl_versionText: "" | "#version 300 es\n";
    readonly vertexShaderVariableDefinitions: string;
    vertexShaderBody: string;
    readonly fragmentShaderSimple: string;
    readonly fragmentShader: string;
    static attributeNames: AttributeNames;
    static attributeSemantics: Array<VertexAttributeEnum>;
}

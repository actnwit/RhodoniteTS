/**
 * Common GLSL chunks that ShaderHandler fills into the shader templates of every material.
 *
 * @remarks
 * The chunks are part of the webgl module, which the engine loads only for its process approach,
 * so an application bundles and downloads only the chunks of the backend it uses.
 */
export declare const glslCommonChunks: Readonly<{
    alphaProcess: string;
    enableVertexExtensions: string;
    fullscreen: string;
    glslPrecision: string;
    iblDefinition: string;
    mainPrerequisites: string;
    opticalDefinition: string;
    outputSrgb: string;
    pbrDefinition: string;
    prerequisites: string;
    processGeometry: string;
    shadow: string;
    vertexIn: string;
    vertexInOut: string;
    wireframe: string;
}>;
export type GlslCommonChunks = typeof glslCommonChunks;

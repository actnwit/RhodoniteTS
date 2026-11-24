/**
 * Common WGSL chunks that ShaderHandler fills into the shader templates of every material.
 *
 * @remarks
 * The chunks are part of the webgpu module, which the engine loads only for its process approach,
 * so an application bundles and downloads only the chunks of the backend it uses.
 */
export declare const wgslCommonChunks: Readonly<{
    alphaProcess: string;
    boneDecode: string;
    fullscreen: string;
    iblDefinition: string;
    mainPrerequisites: string;
    opticalDefinition: string;
    outputSrgb: string;
    pbrDefinition: string;
    prerequisites: string;
    processGeometry: string;
    shadow: string;
    vertexInput: string;
    vertexOutput: string;
    wireframe: string;
}>;
export type WgslCommonChunks = typeof wgslCommonChunks;

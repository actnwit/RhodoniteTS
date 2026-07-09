/**
 * Get texture and sampler variable names from a semantic name.
 * If the name ends with 'Texture', it returns the name as the texture name
 * and replaces 'Texture' with 'Sampler' for the sampler name.
 * Otherwise, it appends 'Texture' and 'Sampler' suffixes to avoid name collision.
 *
 * @param semanticName - The semantic name of the texture uniform
 * @returns An object containing textureName and samplerName
 */
export declare function getTextureAndSamplerNames(semanticName: string): {
    textureName: string;
    samplerName: string;
};

function r(e){return e.endsWith("Texture")?{textureName:e,samplerName:e.replace("Texture","Sampler")}:{textureName:`${e}Texture`,samplerName:`${e}Sampler`}}export{r as getTextureAndSamplerNames};

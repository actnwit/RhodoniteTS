var n=`reflection.x *= -1.0;
#ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
  vec4 specularTexel = textureCubeLodEXT(u_specularEnvTexture, reflection, lod);
#elif defined(GLSL_ES3)
  vec4 specularTexel = textureLod(u_specularEnvTexture, reflection, lod);
#else
  vec4 specularTexel = texture(u_specularEnvTexture, reflection);
#endif
`,l="fragment",t=!0,u={code:n,shaderStage:l,isFragmentShader:t};export{n as code,u as default,t as isFragmentShader,l as shaderStage};

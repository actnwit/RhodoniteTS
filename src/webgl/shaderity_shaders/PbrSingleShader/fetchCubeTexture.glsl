reflection.x *= -1.0;
#ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
  vec4 specularTexel = textureCubeLodEXT(u_specularEnvTexture, reflection, lod);
#elif defined(GLSL_ES3)
  vec4 specularTexel = textureLod(u_specularEnvTexture, reflection, lod);
#else
  vec4 specularTexel = textureCube(u_specularEnvTexture, reflection);
#endif

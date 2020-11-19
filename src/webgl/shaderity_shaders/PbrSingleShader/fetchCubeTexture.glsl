#ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
  vec4 specularTexel = textureCubeLodEXT(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z), lod);
#elif defined(GLSL_ES3)
  vec4 specularTexel = textureLod(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z), lod);
#else
  vec4 specularTexel = textureCube(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z));
#endif

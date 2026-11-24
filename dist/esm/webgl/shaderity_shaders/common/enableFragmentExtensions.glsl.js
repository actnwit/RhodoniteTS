var _=`#ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
#extension GL_EXT_shader_texture_lod : require
#endif

#ifdef WEBGL1_EXT_STANDARD_DERIVATIVES
#extension GL_OES_standard_derivatives : require
#endif

#ifdef WEBGL1_EXT_DRAW_BUFFERS
#extension GL_EXT_draw_buffers : require
#endif
`,r="fragment",d=!0,i={code:_,shaderStage:r,isFragmentShader:d};export{_ as code,i as default,d as isFragmentShader,r as shaderStage};

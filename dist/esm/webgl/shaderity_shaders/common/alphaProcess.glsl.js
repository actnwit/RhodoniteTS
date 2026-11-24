var n=`#ifdef RN_IS_PIXEL_SHADER
#ifdef RN_IS_ALPHA_MODE_MASK
  float alphaCutoff = get_alphaCutoff(materialSID, 0u);
  if (alpha < alphaCutoff) {
    discard;
  }
#endif
#endif

#ifdef RN_IS_ALPHA_MODE_BLEND
#else
  alpha = 1.0;
#endif
`,e="fragment",_=!0,d={code:n,shaderStage:e,isFragmentShader:_};export{n as code,d as default,_ as isFragmentShader,e as shaderStage};

#ifdef RN_IS_PIXEL_SHADER
#ifdef RN_IS_ALPHA_MODE_MASK
  let alphaCutoff = get_alphaCutoff(materialSID, 0);
  if (alpha < alphaCutoff) {
    discard;
  }
#endif
#endif

#ifdef RN_IS_ALPHA_MODE_BLEND
#else
  alpha = 1.0;
#endif

#ifdef RN_IS_ALPHA_MODE_MASK
  float alphaCutoff = get_alphaCutoff(materialSID, 0u);
  if (alpha < alphaCutoff) {
    discard;
  }
#endif

#ifdef RN_IS_ALPHA_MODE_BLEND
#else
  alpha = 1.0;
#endif

#ifdef RN_IS_ALPHA_MODE_MASK
  float alphaCutoff = get_alphaCutoff(materialSID, 0);
  if (alpha < alphaCutoff) {
    discard;
  }
#endif

#ifdef RN_IS_ALPHAMASKING
  float alphaCutoff = get_alphaCutoff(materialSID, 0);
  if (alpha < alphaCutoff) {
    discard;
  }
#endif
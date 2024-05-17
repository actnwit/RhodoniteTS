#ifdef RN_IS_ALPHAMODE_MASK
  let alphaCutoff = get_alphaCutoff(materialSID, 0);
  if (alpha < alphaCutoff) {
    discard;
  }
#endif

#ifdef RN_IS_ALPHA_MODE_MASK
  let alphaCutoff = get_alphaCutoff(materialSID, 0);
  if (baseColor.a < alphaCutoff) {
    discard;
  }
#endif

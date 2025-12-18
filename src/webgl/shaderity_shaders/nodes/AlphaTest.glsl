void alphaTest(in vec4 color, in float alphaCutoff, in bool forceCutoff, out vec4 outColor) {
  #ifdef RN_IS_PIXEL_SHADER
  #ifdef RN_IS_ALPHA_MODE_MASK
    if (color.a < alphaCutoff) {
      discard;
    }
  #endif
  #endif

  #ifdef RN_IS_PIXEL_SHADER
  if (forceCutoff) {
    if (color.a < alphaCutoff) {
      discard;
    }
  }
  #endif

  outColor = color;

  #ifdef RN_IS_ALPHA_MODE_BLEND
  #else
    outColor.a = 1.0;
  #endif
}

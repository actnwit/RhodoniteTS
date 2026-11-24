// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/AlphaTest.glsl
var code = "void alphaTest(in vec4 color, in float alphaCutoff, in bool forceCutoff, out vec4 outColor) {\n  #ifdef RN_IS_PIXEL_SHADER\n  #ifdef RN_IS_ALPHA_MODE_MASK\n    if (color.a < alphaCutoff) {\n      discard;\n    }\n  #endif\n  #endif\n\n  #ifdef RN_IS_PIXEL_SHADER\n  if (forceCutoff) {\n    if (color.a < alphaCutoff) {\n      discard;\n    }\n  }\n  #endif\n\n  outColor = color;\n\n  #ifdef RN_IS_ALPHA_MODE_BLEND\n  #else\n    outColor.a = 1.0;\n  #endif\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var AlphaTest_default = { code, shaderStage, isFragmentShader };
export {
  code,
  AlphaTest_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvQWxwaGFUZXN0Lmdsc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcInZvaWQgYWxwaGFUZXN0KGluIHZlYzQgY29sb3IsIGluIGZsb2F0IGFscGhhQ3V0b2ZmLCBpbiBib29sIGZvcmNlQ3V0b2ZmLCBvdXQgdmVjNCBvdXRDb2xvcikge1xcbiAgI2lmZGVmIFJOX0lTX1BJWEVMX1NIQURFUlxcbiAgI2lmZGVmIFJOX0lTX0FMUEhBX01PREVfTUFTS1xcbiAgICBpZiAoY29sb3IuYSA8IGFscGhhQ3V0b2ZmKSB7XFxuICAgICAgZGlzY2FyZDtcXG4gICAgfVxcbiAgI2VuZGlmXFxuICAjZW5kaWZcXG5cXG4gICNpZmRlZiBSTl9JU19QSVhFTF9TSEFERVJcXG4gIGlmIChmb3JjZUN1dG9mZikge1xcbiAgICBpZiAoY29sb3IuYSA8IGFscGhhQ3V0b2ZmKSB7XFxuICAgICAgZGlzY2FyZDtcXG4gICAgfVxcbiAgfVxcbiAgI2VuZGlmXFxuXFxuICBvdXRDb2xvciA9IGNvbG9yO1xcblxcbiAgI2lmZGVmIFJOX0lTX0FMUEhBX01PREVfQkxFTkRcXG4gICNlbHNlXFxuICAgIG91dENvbG9yLmEgPSAxLjA7XFxuICAjZW5kaWZcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQWdkLGtCQUFjO0FBQVcsdUJBQW1CO0FBQXBnQiwwQkFBQyxNQUF1ZCxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

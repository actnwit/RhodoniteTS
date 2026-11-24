// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/AlphaTest.wgsl
var code = "\nfn alphaTest(color: vec4<f32>, alphaCutoff: f32, forceCutoff: bool, outColor: ptr<function, vec4<f32>>) {\n  #ifdef RN_IS_PIXEL_SHADER\n  #ifdef RN_IS_ALPHA_MODE_MASK\n    if (color.a < alphaCutoff) {\n      discard;\n    }\n  #endif\n  #endif\n\n  #ifdef RN_IS_PIXEL_SHADER\n  if (forceCutoff) {\n    if (color.a < alphaCutoff) {\n      discard;\n    }\n  }\n  #endif\n\n  *outColor = color;\n\n  #ifdef RN_IS_ALPHA_MODE_BLEND\n  #else\n    (*outColor).a = 1.0;\n  #endif\n}\n\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var AlphaTest_default = { code, shaderStage, isFragmentShader };
export {
  code,
  AlphaTest_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL0FscGhhVGVzdC53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJcXG5mbiBhbHBoYVRlc3QoY29sb3I6IHZlYzQ8ZjMyPiwgYWxwaGFDdXRvZmY6IGYzMiwgZm9yY2VDdXRvZmY6IGJvb2wsIG91dENvbG9yOiBwdHI8ZnVuY3Rpb24sIHZlYzQ8ZjMyPj4pIHtcXG4gICNpZmRlZiBSTl9JU19QSVhFTF9TSEFERVJcXG4gICNpZmRlZiBSTl9JU19BTFBIQV9NT0RFX01BU0tcXG4gICAgaWYgKGNvbG9yLmEgPCBhbHBoYUN1dG9mZikge1xcbiAgICAgIGRpc2NhcmQ7XFxuICAgIH1cXG4gICNlbmRpZlxcbiAgI2VuZGlmXFxuXFxuICAjaWZkZWYgUk5fSVNfUElYRUxfU0hBREVSXFxuICBpZiAoZm9yY2VDdXRvZmYpIHtcXG4gICAgaWYgKGNvbG9yLmEgPCBhbHBoYUN1dG9mZikge1xcbiAgICAgIGRpc2NhcmQ7XFxuICAgIH1cXG4gIH1cXG4gICNlbmRpZlxcblxcbiAgKm91dENvbG9yID0gY29sb3I7XFxuXFxuICAjaWZkZWYgUk5fSVNfQUxQSEFfTU9ERV9CTEVORFxcbiAgI2Vsc2VcXG4gICAgKCpvdXRDb2xvcikuYSA9IDEuMDtcXG4gICNlbmRpZlxcbn1cXG5cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBb2Usa0JBQWM7QUFBVyx1QkFBbUI7QUFBeGhCLDBCQUFDLE1BQTJlLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

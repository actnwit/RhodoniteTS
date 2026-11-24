// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/SdBarY.glsl
var code = "void sdBarY(in vec3 position, in float width, out float outDistance) {\n  outDistance = length(max(abs(position.xz)-width,0.));\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdBarY_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdBarY_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvU2RCYXJZLmdsc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcInZvaWQgc2RCYXJZKGluIHZlYzMgcG9zaXRpb24sIGluIGZsb2F0IHdpZHRoLCBvdXQgZmxvYXQgb3V0RGlzdGFuY2UpIHtcXG4gIG91dERpc3RhbmNlID0gbGVuZ3RoKG1heChhYnMocG9zaXRpb24ueHopLXdpZHRoLDAuKSk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUF1SSxrQkFBYztBQUFXLHVCQUFtQjtBQUEzTCx1QkFBQyxNQUE4SSxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

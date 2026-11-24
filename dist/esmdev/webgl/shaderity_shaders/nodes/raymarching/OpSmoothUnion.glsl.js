// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/OpSmoothUnion.glsl
var code = "void opSmoothUnion(in float lhs, in float rhs, in float smoothness, out float outValue) {\n  float k = max(smoothness, 0.0001);\n  float h = clamp(0.5 + 0.5 * (rhs - lhs) / k, 0.0, 1.0);\n  outValue = mix(rhs, lhs, h) - k * h * (1.0 - h);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var OpSmoothUnion_default = { code, shaderStage, isFragmentShader };
export {
  code,
  OpSmoothUnion_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvT3BTbW9vdGhVbmlvbi5nbHNsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJ2b2lkIG9wU21vb3RoVW5pb24oaW4gZmxvYXQgbGhzLCBpbiBmbG9hdCByaHMsIGluIGZsb2F0IHNtb290aG5lc3MsIG91dCBmbG9hdCBvdXRWYWx1ZSkge1xcbiAgZmxvYXQgayA9IG1heChzbW9vdGhuZXNzLCAwLjAwMDEpO1xcbiAgZmxvYXQgaCA9IGNsYW1wKDAuNSArIDAuNSAqIChyaHMgLSBsaHMpIC8gaywgMC4wLCAxLjApO1xcbiAgb3V0VmFsdWUgPSBtaXgocmhzLCBsaHMsIGgpIC0gayAqIGggKiAoMS4wIC0gaCk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFzUCxrQkFBYztBQUFXLHVCQUFtQjtBQUExUyw4QkFBQyxNQUE2UCxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

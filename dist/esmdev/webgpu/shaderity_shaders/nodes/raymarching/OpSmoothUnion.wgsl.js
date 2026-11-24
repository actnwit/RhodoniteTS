// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/OpSmoothUnion.wgsl
var code = "fn opSmoothUnion(lhs: f32, rhs: f32, smoothness: f32, outValue: ptr<function, f32>) {\n  let k = max(smoothness, 0.0001);\n  let h = clamp(0.5 + 0.5 * (rhs - lhs) / k, 0.0, 1.0);\n  *outValue = mix(rhs, lhs, h) - k * h * (1.0 - h);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var OpSmoothUnion_default = { code, shaderStage, isFragmentShader };
export {
  code,
  OpSmoothUnion_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL09wU21vb3RoVW5pb24ud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gb3BTbW9vdGhVbmlvbihsaHM6IGYzMiwgcmhzOiBmMzIsIHNtb290aG5lc3M6IGYzMiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgbGV0IGsgPSBtYXgoc21vb3RobmVzcywgMC4wMDAxKTtcXG4gIGxldCBoID0gY2xhbXAoMC41ICsgMC41ICogKHJocyAtIGxocykgLyBrLCAwLjAsIDEuMCk7XFxuICAqb3V0VmFsdWUgPSBtaXgocmhzLCBsaHMsIGgpIC0gayAqIGggKiAoMS4wIC0gaCk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUErTyxrQkFBYztBQUFXLHVCQUFtQjtBQUFuUyw4QkFBQyxNQUFzUCxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

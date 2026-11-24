// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/OpSmoothIntersection.glsl
var code = "void opSmoothIntersection(in float lhs, in float rhs, in float smoothness, out float outValue) {\n  float k = max(smoothness, 0.0001);\n  float h = clamp(0.5 - 0.5 * (rhs - lhs) / k, 0.0, 1.0);\n  outValue = mix(rhs, lhs, h) + k * h * (1.0 - h);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var OpSmoothIntersection_default = { code, shaderStage, isFragmentShader };
export {
  code,
  OpSmoothIntersection_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvT3BTbW9vdGhJbnRlcnNlY3Rpb24uZ2xzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwidm9pZCBvcFNtb290aEludGVyc2VjdGlvbihpbiBmbG9hdCBsaHMsIGluIGZsb2F0IHJocywgaW4gZmxvYXQgc21vb3RobmVzcywgb3V0IGZsb2F0IG91dFZhbHVlKSB7XFxuICBmbG9hdCBrID0gbWF4KHNtb290aG5lc3MsIDAuMDAwMSk7XFxuICBmbG9hdCBoID0gY2xhbXAoMC41IC0gMC41ICogKHJocyAtIGxocykgLyBrLCAwLjAsIDEuMCk7XFxuICBvdXRWYWx1ZSA9IG1peChyaHMsIGxocywgaCkgKyBrICogaCAqICgxLjAgLSBoKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQTZQLGtCQUFjO0FBQVcsdUJBQW1CO0FBQWpULHFDQUFDLE1BQW9RLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

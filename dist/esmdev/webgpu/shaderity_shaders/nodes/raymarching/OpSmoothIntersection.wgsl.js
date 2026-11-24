// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/OpSmoothIntersection.wgsl
var code = "fn opSmoothIntersection(lhs: f32, rhs: f32, smoothness: f32, outValue: ptr<function, f32>) {\n  let k = max(smoothness, 0.0001);\n  let h = clamp(0.5 - 0.5 * (rhs - lhs) / k, 0.0, 1.0);\n  *outValue = mix(rhs, lhs, h) + k * h * (1.0 - h);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var OpSmoothIntersection_default = { code, shaderStage, isFragmentShader };
export {
  code,
  OpSmoothIntersection_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL09wU21vb3RoSW50ZXJzZWN0aW9uLndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImZuIG9wU21vb3RoSW50ZXJzZWN0aW9uKGxoczogZjMyLCByaHM6IGYzMiwgc21vb3RobmVzczogZjMyLCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCBmMzI+KSB7XFxuICBsZXQgayA9IG1heChzbW9vdGhuZXNzLCAwLjAwMDEpO1xcbiAgbGV0IGggPSBjbGFtcCgwLjUgLSAwLjUgKiAocmhzIC0gbGhzKSAvIGssIDAuMCwgMS4wKTtcXG4gICpvdXRWYWx1ZSA9IG1peChyaHMsIGxocywgaCkgKyBrICogaCAqICgxLjAgLSBoKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQXNQLGtCQUFjO0FBQVcsdUJBQW1CO0FBQTFTLHFDQUFDLE1BQTZQLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

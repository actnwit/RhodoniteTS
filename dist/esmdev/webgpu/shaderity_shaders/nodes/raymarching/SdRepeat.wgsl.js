// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdRepeat.wgsl
var code = "fn sdRepeat(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {\n  *outPosition = (fract(position / interval) - vec3<f32>(0.5)) * interval;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRepeat_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRepeat_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkUmVwZWF0Lndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImZuIHNkUmVwZWF0KHBvc2l0aW9uOiB2ZWMzZiwgaW50ZXJ2YWw6IGYzMiwgb3V0UG9zaXRpb246IHB0cjxmdW5jdGlvbiwgdmVjM2Y+KSB7XFxuICAqb3V0UG9zaXRpb24gPSAoZnJhY3QocG9zaXRpb24gLyBpbnRlcnZhbCkgLSB2ZWMzPGYzMj4oMC41KSkgKiBpbnRlcnZhbDtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQW9LLGtCQUFjO0FBQVcsdUJBQW1CO0FBQXhOLHlCQUFDLE1BQTJLLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

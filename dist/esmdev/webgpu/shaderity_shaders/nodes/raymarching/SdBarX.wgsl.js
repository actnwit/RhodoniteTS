// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdBarX.wgsl
var code = "fn sdBarX(position: vec3f, width: f32, outDistance: ptr<function, f32>) {\n  *outDistance = length(max(abs(position.yz)-width, vec2f(0.0)));\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdBarX_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdBarX_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkQmFyWC53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiBzZEJhclgocG9zaXRpb246IHZlYzNmLCB3aWR0aDogZjMyLCBvdXREaXN0YW5jZTogcHRyPGZ1bmN0aW9uLCBmMzI+KSB7XFxuICAqb3V0RGlzdGFuY2UgPSBsZW5ndGgobWF4KGFicyhwb3NpdGlvbi55eiktd2lkdGgsIHZlYzJmKDAuMCkpKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQW9KLGtCQUFjO0FBQVcsdUJBQW1CO0FBQXhNLHVCQUFDLE1BQTJKLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

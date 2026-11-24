// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Step.wgsl
var code = "fn _stepF32(value: f32, edge: f32, outValue: ptr<function, f32>) {\n  *outValue = step(edge, value);\n}\nfn _stepVec2f(value: vec2<f32>, edge: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = step(edge, value);\n}\nfn _stepVec3f(value: vec3<f32>, edge: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = step(edge, value);\n}\nfn _stepVec4f(value: vec4<f32>, edge: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = step(edge, value);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Step_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Step_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL1N0ZXAud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gX3N0ZXBGMzIodmFsdWU6IGYzMiwgZWRnZTogZjMyLCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCBmMzI+KSB7XFxuICAqb3V0VmFsdWUgPSBzdGVwKGVkZ2UsIHZhbHVlKTtcXG59XFxuZm4gX3N0ZXBWZWMyZih2YWx1ZTogdmVjMjxmMzI+LCBlZGdlOiB2ZWMyPGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzI8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IHN0ZXAoZWRnZSwgdmFsdWUpO1xcbn1cXG5mbiBfc3RlcFZlYzNmKHZhbHVlOiB2ZWMzPGYzMj4sIGVkZ2U6IHZlYzM8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjMzxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gc3RlcChlZGdlLCB2YWx1ZSk7XFxufVxcbmZuIF9zdGVwVmVjNGYodmFsdWU6IHZlYzQ8ZjMyPiwgZWRnZTogdmVjNDxmMzI+LCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWM0PGYzMj4+KSB7XFxuICAqb3V0VmFsdWUgPSBzdGVwKGVkZ2UsIHZhbHVlKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQW1lLGtCQUFjO0FBQVcsdUJBQW1CO0FBQXZoQixxQkFBQyxNQUEwZSxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

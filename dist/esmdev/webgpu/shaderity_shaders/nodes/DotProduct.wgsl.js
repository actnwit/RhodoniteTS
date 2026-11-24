// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/DotProduct.wgsl
var code = "fn dotProductVec2f(lfs: vec2<f32>, rhs: vec2<f32>, outValue: ptr<function, f32>) {\n  *outValue = dot(lfs, rhs);\n}\nfn dotProductVec3f(lfs: vec3<f32>, rhs: vec3<f32>, outValue: ptr<function, f32>) {\n  *outValue = dot(lfs, rhs);\n}\nfn dotProductVec4f(lfs: vec4<f32>, rhs: vec4<f32>, outValue: ptr<function, f32>) {\n  *outValue = dot(lfs, rhs);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var DotProduct_default = { code, shaderStage, isFragmentShader };
export {
  code,
  DotProduct_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL0RvdFByb2R1Y3Qud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gZG90UHJvZHVjdFZlYzJmKGxmczogdmVjMjxmMzI+LCByaHM6IHZlYzI8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgKm91dFZhbHVlID0gZG90KGxmcywgcmhzKTtcXG59XFxuZm4gZG90UHJvZHVjdFZlYzNmKGxmczogdmVjMzxmMzI+LCByaHM6IHZlYzM8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgKm91dFZhbHVlID0gZG90KGxmcywgcmhzKTtcXG59XFxuZm4gZG90UHJvZHVjdFZlYzRmKGxmczogdmVjNDxmMzI+LCByaHM6IHZlYzQ8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgKm91dFZhbHVlID0gZG90KGxmcywgcmhzKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQWtXLGtCQUFjO0FBQVcsdUJBQW1CO0FBQXRaLDJCQUFDLE1BQXlXLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

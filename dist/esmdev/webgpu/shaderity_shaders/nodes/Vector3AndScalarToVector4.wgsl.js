// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Vector3AndScalarToVector4.wgsl
var code = "fn vector3AndScalarToVector4(xyz: vec3<f32>, w: f32, outValue: ptr<function, vec4<f32>>) {\n  (*outValue).x = xyz.x;\n  (*outValue).y = xyz.y;\n  (*outValue).z = xyz.z;\n  (*outValue).w = w;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Vector3AndScalarToVector4_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Vector3AndScalarToVector4_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL1ZlY3RvcjNBbmRTY2FsYXJUb1ZlY3RvcjQud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gdmVjdG9yM0FuZFNjYWxhclRvVmVjdG9yNCh4eXo6IHZlYzM8ZjMyPiwgdzogZjMyLCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWM0PGYzMj4+KSB7XFxuICAoKm91dFZhbHVlKS54ID0geHl6Lng7XFxuICAoKm91dFZhbHVlKS55ID0geHl6Lnk7XFxuICAoKm91dFZhbHVlKS56ID0geHl6Lno7XFxuICAoKm91dFZhbHVlKS53ID0gdztcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQXNNLGtCQUFjO0FBQVcsdUJBQW1CO0FBQTFQLDBDQUFDLE1BQTZNLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

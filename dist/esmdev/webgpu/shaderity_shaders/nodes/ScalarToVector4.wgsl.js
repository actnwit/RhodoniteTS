// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/ScalarToVector4.wgsl
var code = "fn scalarToVector4(x: f32, y: f32, z: f32, w: f32, outValue: ptr<function, vec4<f32>>) {\n  (*outValue).x = x;\n  (*outValue).y = y;\n  (*outValue).z = z;\n  (*outValue).w = w;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var ScalarToVector4_default = { code, shaderStage, isFragmentShader };
export {
  code,
  ScalarToVector4_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL1NjYWxhclRvVmVjdG9yNC53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiBzY2FsYXJUb1ZlY3RvcjQoeDogZjMyLCB5OiBmMzIsIHo6IGYzMiwgdzogZjMyLCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWM0PGYzMj4+KSB7XFxuICAoKm91dFZhbHVlKS54ID0geDtcXG4gICgqb3V0VmFsdWUpLnkgPSB5O1xcbiAgKCpvdXRWYWx1ZSkueiA9IHo7XFxuICAoKm91dFZhbHVlKS53ID0gdztcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQXdMLGtCQUFjO0FBQVcsdUJBQW1CO0FBQTVPLGdDQUFDLE1BQStMLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

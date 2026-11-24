// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Add.wgsl
var code = "\nfn addF32F32(lfs: f32, rhs: f32, outValue: ptr<function, f32>) {\n  *outValue = lfs + rhs;\n}\nfn addI32I32(lfs: i32, rhs: i32, outValue: ptr<function, i32>) {\n  *outValue = lfs + rhs;\n}\nfn addVec2fVec2f(lfs: vec2<f32>, rhs: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = lfs + rhs;\n}\nfn addVec3fVec3f(lfs: vec3<f32>, rhs: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = lfs + rhs;\n}\nfn addVec4fVec4f(lfs: vec4<f32>, rhs: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = lfs + rhs;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Add_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Add_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL0FkZC53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJcXG5mbiBhZGRGMzJGMzIobGZzOiBmMzIsIHJoczogZjMyLCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCBmMzI+KSB7XFxuICAqb3V0VmFsdWUgPSBsZnMgKyByaHM7XFxufVxcbmZuIGFkZEkzMkkzMihsZnM6IGkzMiwgcmhzOiBpMzIsIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIGkzMj4pIHtcXG4gICpvdXRWYWx1ZSA9IGxmcyArIHJocztcXG59XFxuZm4gYWRkVmVjMmZWZWMyZihsZnM6IHZlYzI8ZjMyPiwgcmhzOiB2ZWMyPGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzI8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IGxmcyArIHJocztcXG59XFxuZm4gYWRkVmVjM2ZWZWMzZihsZnM6IHZlYzM8ZjMyPiwgcmhzOiB2ZWMzPGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzM8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IGxmcyArIHJocztcXG59XFxuZm4gYWRkVmVjNGZWZWM0ZihsZnM6IHZlYzQ8ZjMyPiwgcmhzOiB2ZWM0PGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzQ8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IGxmcyArIHJocztcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQWtpQixrQkFBYztBQUFXLHVCQUFtQjtBQUF0bEIsb0JBQUMsTUFBeWlCLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

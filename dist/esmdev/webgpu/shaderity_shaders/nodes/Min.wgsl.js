// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Min.wgsl
var code = "\nfn min_F32F32(lhs: f32, rhs: f32, outValue: ptr<function, f32>) {\n  *outValue = min(lhs, rhs);\n}\nfn min_I32I32(lhs: i32, rhs: i32, outValue: ptr<function, i32>) {\n  *outValue = min(lhs, rhs);\n}\nfn min_Vec2fVec2f(lhs: vec2<f32>, rhs: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = min(lhs, rhs);\n}\nfn min_Vec3fVec3f(lhs: vec3<f32>, rhs: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = min(lhs, rhs);\n}\nfn min_Vec4fVec4f(lhs: vec4<f32>, rhs: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = min(lhs, rhs);\n}\n\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Min_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Min_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL01pbi53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJcXG5mbiBtaW5fRjMyRjMyKGxoczogZjMyLCByaHM6IGYzMiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgKm91dFZhbHVlID0gbWluKGxocywgcmhzKTtcXG59XFxuZm4gbWluX0kzMkkzMihsaHM6IGkzMiwgcmhzOiBpMzIsIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIGkzMj4pIHtcXG4gICpvdXRWYWx1ZSA9IG1pbihsaHMsIHJocyk7XFxufVxcbmZuIG1pbl9WZWMyZlZlYzJmKGxoczogdmVjMjxmMzI+LCByaHM6IHZlYzI8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjMjxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gbWluKGxocywgcmhzKTtcXG59XFxuZm4gbWluX1ZlYzNmVmVjM2YobGhzOiB2ZWMzPGYzMj4sIHJoczogdmVjMzxmMzI+LCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWMzPGYzMj4+KSB7XFxuICAqb3V0VmFsdWUgPSBtaW4obGhzLCByaHMpO1xcbn1cXG5mbiBtaW5fVmVjNGZWZWM0ZihsaHM6IHZlYzQ8ZjMyPiwgcmhzOiB2ZWM0PGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzQ8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IG1pbihsaHMsIHJocyk7XFxufVxcblxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUE2akIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBam5CLG9CQUFDLE1BQW9rQixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

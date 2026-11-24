// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Abs.wgsl
var code = "fn _absF32(value: f32, outValue: ptr<function, f32>) {\n  *outValue = abs(value);\n}\nfn _absVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = abs(value);\n}\nfn _absVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = abs(value);\n}\nfn _absVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = abs(value);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Abs_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Abs_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL0Ficy53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiBfYWJzRjMyKHZhbHVlOiBmMzIsIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIGYzMj4pIHtcXG4gICpvdXRWYWx1ZSA9IGFicyh2YWx1ZSk7XFxufVxcbmZuIF9hYnNWZWMyZih2YWx1ZTogdmVjMjxmMzI+LCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWMyPGYzMj4+KSB7XFxuICAqb3V0VmFsdWUgPSBhYnModmFsdWUpO1xcbn1cXG5mbiBfYWJzVmVjM2YodmFsdWU6IHZlYzM8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjMzxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gYWJzKHZhbHVlKTtcXG59XFxuZm4gX2Fic1ZlYzRmKHZhbHVlOiB2ZWM0PGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzQ8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IGFicyh2YWx1ZSk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFxWSxrQkFBYztBQUFXLHVCQUFtQjtBQUF6YixvQkFBQyxNQUE0WSxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

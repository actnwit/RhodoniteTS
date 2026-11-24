// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Atan2.wgsl
var code = "fn _atan2F32(y: f32, x: f32, outValue: ptr<function, f32>) {\n  *outValue = atan2(y, x);\n}\nfn _atan2Vec2f(y: vec2<f32>, x: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = atan2(y, x);\n}\nfn _atan2Vec3f(y: vec3<f32>, x: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = atan2(y, x);\n}\nfn _atan2Vec4f(y: vec4<f32>, x: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = atan2(y, x);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Atan2_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Atan2_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL0F0YW4yLndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImZuIF9hdGFuMkYzMih5OiBmMzIsIHg6IGYzMiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgKm91dFZhbHVlID0gYXRhbjIoeSwgeCk7XFxufVxcbmZuIF9hdGFuMlZlYzJmKHk6IHZlYzI8ZjMyPiwgeDogdmVjMjxmMzI+LCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWMyPGYzMj4+KSB7XFxuICAqb3V0VmFsdWUgPSBhdGFuMih5LCB4KTtcXG59XFxuZm4gX2F0YW4yVmVjM2YoeTogdmVjMzxmMzI+LCB4OiB2ZWMzPGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzM8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IGF0YW4yKHksIHgpO1xcbn1cXG5mbiBfYXRhbjJWZWM0Zih5OiB2ZWM0PGYzMj4sIHg6IHZlYzQ8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjNDxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gYXRhbjIoeSwgeCk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFtYixrQkFBYztBQUFXLHVCQUFtQjtBQUF2ZSxzQkFBQyxNQUEwYixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

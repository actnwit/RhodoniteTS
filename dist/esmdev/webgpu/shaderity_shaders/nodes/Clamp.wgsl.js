// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Clamp.wgsl
var code = "fn _clampF32(value: f32, min: f32, max: f32, outValue: ptr<function, f32>) {\n  *outValue = clamp(value, min, max);\n}\nfn _clampVec2f(value: vec2<f32>, min: vec2<f32>, max: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = clamp(value, min, max);\n}\nfn _clampVec3f(value: vec3<f32>, min: vec3<f32>, max: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = clamp(value, min, max);\n}\nfn _clampVec4f(value: vec4<f32>, min: vec4<f32>, max: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = clamp(value, min, max);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Clamp_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Clamp_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL0NsYW1wLndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImZuIF9jbGFtcEYzMih2YWx1ZTogZjMyLCBtaW46IGYzMiwgbWF4OiBmMzIsIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIGYzMj4pIHtcXG4gICpvdXRWYWx1ZSA9IGNsYW1wKHZhbHVlLCBtaW4sIG1heCk7XFxufVxcbmZuIF9jbGFtcFZlYzJmKHZhbHVlOiB2ZWMyPGYzMj4sIG1pbjogdmVjMjxmMzI+LCBtYXg6IHZlYzI8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjMjxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gY2xhbXAodmFsdWUsIG1pbiwgbWF4KTtcXG59XFxuZm4gX2NsYW1wVmVjM2YodmFsdWU6IHZlYzM8ZjMyPiwgbWluOiB2ZWMzPGYzMj4sIG1heDogdmVjMzxmMzI+LCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWMzPGYzMj4+KSB7XFxuICAqb3V0VmFsdWUgPSBjbGFtcCh2YWx1ZSwgbWluLCBtYXgpO1xcbn1cXG5mbiBfY2xhbXBWZWM0Zih2YWx1ZTogdmVjNDxmMzI+LCBtaW46IHZlYzQ8ZjMyPiwgbWF4OiB2ZWM0PGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzQ8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IGNsYW1wKHZhbHVlLCBtaW4sIG1heCk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFpakIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBcm1CLHNCQUFDLE1BQXdqQixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

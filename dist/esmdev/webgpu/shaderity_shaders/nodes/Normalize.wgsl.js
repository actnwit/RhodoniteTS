// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Normalize.wgsl
var code = "\nfn _normalizeVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = normalize(value);\n}\n\nfn _normalizeVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = normalize(value);\n}\n\nfn _normalizeVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = normalize(value);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Normalize_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Normalize_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL05vcm1hbGl6ZS53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJcXG5mbiBfbm9ybWFsaXplVmVjMmYodmFsdWU6IHZlYzI8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjMjxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gbm9ybWFsaXplKHZhbHVlKTtcXG59XFxuXFxuZm4gX25vcm1hbGl6ZVZlYzNmKHZhbHVlOiB2ZWMzPGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzM8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IG5vcm1hbGl6ZSh2YWx1ZSk7XFxufVxcblxcbmZuIF9ub3JtYWxpemVWZWM0Zih2YWx1ZTogdmVjNDxmMzI+LCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWM0PGYzMj4+KSB7XFxuICAqb3V0VmFsdWUgPSBub3JtYWxpemUodmFsdWUpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBeVYsa0JBQWM7QUFBVyx1QkFBbUI7QUFBN1ksMEJBQUMsTUFBZ1csYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=

// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Transform.wgsl
var code = "fn transformMat2x2fVec2f(lfs: mat2x2<f32>, rhs: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = lfs * rhs;\n}\nfn transformMat3x3fVec3f(lfs: mat3x3<f32>, rhs: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = lfs * rhs;\n}\nfn transformMat4x4fVec4f(lfs: mat4x4<f32>, rhs: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = lfs * rhs;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Transform_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Transform_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL1RyYW5zZm9ybS53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiB0cmFuc2Zvcm1NYXQyeDJmVmVjMmYobGZzOiBtYXQyeDI8ZjMyPiwgcmhzOiB2ZWMyPGYzMj4sIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIHZlYzI8ZjMyPj4pIHtcXG4gICpvdXRWYWx1ZSA9IGxmcyAqIHJocztcXG59XFxuZm4gdHJhbnNmb3JtTWF0M3gzZlZlYzNmKGxmczogbWF0M3gzPGYzMj4sIHJoczogdmVjMzxmMzI+LCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWMzPGYzMj4+KSB7XFxuICAqb3V0VmFsdWUgPSBsZnMgKiByaHM7XFxufVxcbmZuIHRyYW5zZm9ybU1hdDR4NGZWZWM0ZihsZnM6IG1hdDR4NDxmMzI+LCByaHM6IHZlYzQ8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjNDxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gbGZzICogcmhzO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBZ1ksa0JBQWM7QUFBVyx1QkFBbUI7QUFBcGIsMEJBQUMsTUFBdVksYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=

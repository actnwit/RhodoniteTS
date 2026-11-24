// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/Transform.glsl
var code = "void transform(in mat2 lfs, in vec2 rhs, out vec2 outValue) {\n  outValue = lfs * rhs;\n}\nvoid transform(in mat3 lfs, in vec3 rhs, out vec3 outValue) {\n  outValue = lfs * rhs;\n}\nvoid transform(in mat4 lfs, in vec4 rhs, out vec4 outValue) {\n  outValue = lfs * rhs;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Transform_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Transform_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvVHJhbnNmb3JtLmdsc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcInZvaWQgdHJhbnNmb3JtKGluIG1hdDIgbGZzLCBpbiB2ZWMyIHJocywgb3V0IHZlYzIgb3V0VmFsdWUpIHtcXG4gIG91dFZhbHVlID0gbGZzICogcmhzO1xcbn1cXG52b2lkIHRyYW5zZm9ybShpbiBtYXQzIGxmcywgaW4gdmVjMyByaHMsIG91dCB2ZWMzIG91dFZhbHVlKSB7XFxuICBvdXRWYWx1ZSA9IGxmcyAqIHJocztcXG59XFxudm9pZCB0cmFuc2Zvcm0oaW4gbWF0NCBsZnMsIGluIHZlYzQgcmhzLCBvdXQgdmVjNCBvdXRWYWx1ZSkge1xcbiAgb3V0VmFsdWUgPSBsZnMgKiByaHM7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFvUixrQkFBYztBQUFXLHVCQUFtQjtBQUF4VSwwQkFBQyxNQUEyUixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/OutUnion.wgsl
var code = "fn outUnion(value: f32, objectId: f32) {\n  if (value < g_distance) {\n    g_distance = value;\n    g_hitObjectId = objectId;\n  }\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var OutUnion_default = { code, shaderStage, isFragmentShader };
export {
  code,
  OutUnion_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL091dFVuaW9uLndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImZuIG91dFVuaW9uKHZhbHVlOiBmMzIsIG9iamVjdElkOiBmMzIpIHtcXG4gIGlmICh2YWx1ZSA8IGdfZGlzdGFuY2UpIHtcXG4gICAgZ19kaXN0YW5jZSA9IHZhbHVlO1xcbiAgICBnX2hpdE9iamVjdElkID0gb2JqZWN0SWQ7XFxuICB9XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUEwSSxrQkFBYztBQUFXLHVCQUFtQjtBQUE5TCx5QkFBQyxNQUFpSixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

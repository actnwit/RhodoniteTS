// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdSphere.wgsl
var code = "fn sdSphere(position: vec3f, radius: f32, outDistance: ptr<function, f32>) {\n  *outDistance = length(position) - radius;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdSphere_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdSphere_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkU3BoZXJlLndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImZuIHNkU3BoZXJlKHBvc2l0aW9uOiB2ZWMzZiwgcmFkaXVzOiBmMzIsIG91dERpc3RhbmNlOiBwdHI8ZnVuY3Rpb24sIGYzMj4pIHtcXG4gICpvdXREaXN0YW5jZSA9IGxlbmd0aChwb3NpdGlvbikgLSByYWRpdXM7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFpSSxrQkFBYztBQUFXLHVCQUFtQjtBQUFyTCx5QkFBQyxNQUF3SSxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

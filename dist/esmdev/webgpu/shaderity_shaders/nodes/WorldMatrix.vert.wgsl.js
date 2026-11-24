// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/WorldMatrix.vert.wgsl
var code = "\nfn worldMatrix(outValue: ptr<function, mat4x4<f32>>) {\n  *outValue = get_worldMatrix(u32(a_instanceIds.x));\n}\n";
var shaderStage = "vertex";
var isFragmentShader = false;
var WorldMatrix_vert_default = { code, shaderStage, isFragmentShader };
export {
  code,
  WorldMatrix_vert_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL1dvcmxkTWF0cml4LnZlcnQud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiXFxuZm4gd29ybGRNYXRyaXgob3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgbWF0NHg0PGYzMj4+KSB7XFxuICAqb3V0VmFsdWUgPSBnZXRfd29ybGRNYXRyaXgodTMyKGFfaW5zdGFuY2VJZHMueCkpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJ2ZXJ0ZXhcIixcImlzRnJhZ21lbnRTaGFkZXJcIjpmYWxzZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFzSCxrQkFBYztBQUFTLHVCQUFtQjtBQUF4SyxpQ0FBQyxNQUE2SCxhQUF1QixpQkFBd0I7IiwKICAibmFtZXMiOiBbXQp9Cg==

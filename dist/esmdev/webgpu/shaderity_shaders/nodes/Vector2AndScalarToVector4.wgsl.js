// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Vector2AndScalarToVector4.wgsl
var code = "\nfn vector2AndScalarToVector4(xy: vec2<f32>, z: f32, w: f32, outValue: ptr<function, vec4<f32>>) {\n  (*outValue).x = xy.x;\n  (*outValue).y = xy.y;\n  (*outValue).z = z;\n  (*outValue).w = w;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Vector2AndScalarToVector4_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Vector2AndScalarToVector4_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL1ZlY3RvcjJBbmRTY2FsYXJUb1ZlY3RvcjQud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiXFxuZm4gdmVjdG9yMkFuZFNjYWxhclRvVmVjdG9yNCh4eTogdmVjMjxmMzI+LCB6OiBmMzIsIHc6IGYzMiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjNDxmMzI+Pikge1xcbiAgKCpvdXRWYWx1ZSkueCA9IHh5Lng7XFxuICAoKm91dFZhbHVlKS55ID0geHkueTtcXG4gICgqb3V0VmFsdWUpLnogPSB6O1xcbiAgKCpvdXRWYWx1ZSkudyA9IHc7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUF5TSxrQkFBYztBQUFXLHVCQUFtQjtBQUE3UCwwQ0FBQyxNQUFnTixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

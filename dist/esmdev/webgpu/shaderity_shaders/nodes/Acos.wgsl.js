// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/Acos.wgsl
var code = "fn _acosF32(value: f32, outValue: ptr<function, f32>) {\n  *outValue = acos(value);\n}\nfn _acosVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {\n  *outValue = acos(value);\n}\nfn _acosVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {\n  *outValue = acos(value);\n}\nfn _acosVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = acos(value);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Acos_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Acos_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL0Fjb3Mud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gX2Fjb3NGMzIodmFsdWU6IGYzMiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgKm91dFZhbHVlID0gYWNvcyh2YWx1ZSk7XFxufVxcbmZuIF9hY29zVmVjMmYodmFsdWU6IHZlYzI8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjMjxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gYWNvcyh2YWx1ZSk7XFxufVxcbmZuIF9hY29zVmVjM2YodmFsdWU6IHZlYzM8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjMzxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gYWNvcyh2YWx1ZSk7XFxufVxcbmZuIF9hY29zVmVjNGYodmFsdWU6IHZlYzQ8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjNDxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gYWNvcyh2YWx1ZSk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUE2WSxrQkFBYztBQUFXLHVCQUFtQjtBQUFqYyxxQkFBQyxNQUFvWixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==

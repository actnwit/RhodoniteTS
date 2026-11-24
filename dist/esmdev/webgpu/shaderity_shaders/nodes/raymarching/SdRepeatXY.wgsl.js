// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdRepeatXY.wgsl
var code = "fn sdRepeatXY(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {\n  *outPosition = vec3f((fract(position.xy / interval) - vec2<f32>(0.5)) * interval, position.z);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRepeatXY_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRepeatXY_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkUmVwZWF0WFkud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gc2RSZXBlYXRYWShwb3NpdGlvbjogdmVjM2YsIGludGVydmFsOiBmMzIsIG91dFBvc2l0aW9uOiBwdHI8ZnVuY3Rpb24sIHZlYzNmPikge1xcbiAgKm91dFBvc2l0aW9uID0gdmVjM2YoKGZyYWN0KHBvc2l0aW9uLnh5IC8gaW50ZXJ2YWwpIC0gdmVjMjxmMzI+KDAuNSkpICogaW50ZXJ2YWwsIHBvc2l0aW9uLnopO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBNEwsa0JBQWM7QUFBVyx1QkFBbUI7QUFBaFAsMkJBQUMsTUFBbU0sYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=

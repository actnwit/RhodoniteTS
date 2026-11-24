// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdRepeatYZ.wgsl
var code = "fn sdRepeatYZ(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {\n  *outPosition = vec3f(position.x, (fract(position.yz / interval) - vec2<f32>(0.5)) * interval);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRepeatYZ_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRepeatYZ_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkUmVwZWF0WVoud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gc2RSZXBlYXRZWihwb3NpdGlvbjogdmVjM2YsIGludGVydmFsOiBmMzIsIG91dFBvc2l0aW9uOiBwdHI8ZnVuY3Rpb24sIHZlYzNmPikge1xcbiAgKm91dFBvc2l0aW9uID0gdmVjM2YocG9zaXRpb24ueCwgKGZyYWN0KHBvc2l0aW9uLnl6IC8gaW50ZXJ2YWwpIC0gdmVjMjxmMzI+KDAuNSkpICogaW50ZXJ2YWwpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBNEwsa0JBQWM7QUFBVyx1QkFBbUI7QUFBaFAsMkJBQUMsTUFBbU0sYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=

// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/SdRepeat.glsl
var code = "void sdRepeat(in vec3 position, in float interval, out vec3 outPosition) {\n  outPosition = (fract(position / interval) - 0.5) * interval;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRepeat_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRepeat_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvU2RSZXBlYXQuZ2xzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwidm9pZCBzZFJlcGVhdChpbiB2ZWMzIHBvc2l0aW9uLCBpbiBmbG9hdCBpbnRlcnZhbCwgb3V0IHZlYzMgb3V0UG9zaXRpb24pIHtcXG4gIG91dFBvc2l0aW9uID0gKGZyYWN0KHBvc2l0aW9uIC8gaW50ZXJ2YWwpIC0gMC41KSAqIGludGVydmFsO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBa0osa0JBQWM7QUFBVyx1QkFBbUI7QUFBdE0seUJBQUMsTUFBeUosYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=

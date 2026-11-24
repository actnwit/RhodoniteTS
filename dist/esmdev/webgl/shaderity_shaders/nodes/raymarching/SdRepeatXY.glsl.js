// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/SdRepeatXY.glsl
var code = "void sdRepeatXY(in vec3 position, in float interval, out vec3 outPosition) {\n  outPosition.xy = (fract(position.xy / interval) - 0.5) * interval;\n  outPosition.z = position.z;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRepeatXY_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRepeatXY_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvU2RSZXBlYXRYWS5nbHNsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJ2b2lkIHNkUmVwZWF0WFkoaW4gdmVjMyBwb3NpdGlvbiwgaW4gZmxvYXQgaW50ZXJ2YWwsIG91dCB2ZWMzIG91dFBvc2l0aW9uKSB7XFxuICBvdXRQb3NpdGlvbi54eSA9IChmcmFjdChwb3NpdGlvbi54eSAvIGludGVydmFsKSAtIDAuNSkgKiBpbnRlcnZhbDtcXG4gIG91dFBvc2l0aW9uLnogPSBwb3NpdGlvbi56O1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBeUwsa0JBQWM7QUFBVyx1QkFBbUI7QUFBN08sMkJBQUMsTUFBZ00sYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=

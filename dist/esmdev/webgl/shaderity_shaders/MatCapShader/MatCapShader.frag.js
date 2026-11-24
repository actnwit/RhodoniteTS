// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/MatCapShader/MatCapShader.frag
var code = "\n/* shaderity: @{glslPrecision} */\n\n/* shaderity: @{vertexIn} */\nin vec3 v_normal_inView;\n\n/* shaderity: @{renderTargetBegin} */\n\n/* shaderity: @{prerequisites} */\n\n/* shaderity: @{getters} */\n\nvoid main ()\n{\n/* shaderity: @{mainPrerequisites} */\n\n  vec3 normal_inView = normalize(v_normal_inView);\n  normal_inView.y *= -1.0;\n  vec2 normalUVCordinate = normal_inView.xy * 0.5 + 0.5;\n  vec4 matCapColor = texture(u_matCapTexture, normalUVCordinate);\n  rt0 = matCapColor;\n\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var MatCapShader_default = { code, shaderStage, isFragmentShader };
export {
  code,
  MatCapShader_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvTWF0Q2FwU2hhZGVyL01hdENhcFNoYWRlci5mcmFnIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJcXG4vKiBzaGFkZXJpdHk6IEB7Z2xzbFByZWNpc2lvbn0gKi9cXG5cXG4vKiBzaGFkZXJpdHk6IEB7dmVydGV4SW59ICovXFxuaW4gdmVjMyB2X25vcm1hbF9pblZpZXc7XFxuXFxuLyogc2hhZGVyaXR5OiBAe3JlbmRlclRhcmdldEJlZ2lufSAqL1xcblxcbi8qIHNoYWRlcml0eTogQHtwcmVyZXF1aXNpdGVzfSAqL1xcblxcbi8qIHNoYWRlcml0eTogQHtnZXR0ZXJzfSAqL1xcblxcbnZvaWQgbWFpbiAoKVxcbntcXG4vKiBzaGFkZXJpdHk6IEB7bWFpblByZXJlcXVpc2l0ZXN9ICovXFxuXFxuICB2ZWMzIG5vcm1hbF9pblZpZXcgPSBub3JtYWxpemUodl9ub3JtYWxfaW5WaWV3KTtcXG4gIG5vcm1hbF9pblZpZXcueSAqPSAtMS4wO1xcbiAgdmVjMiBub3JtYWxVVkNvcmRpbmF0ZSA9IG5vcm1hbF9pblZpZXcueHkgKiAwLjUgKyAwLjU7XFxuICB2ZWM0IG1hdENhcENvbG9yID0gdGV4dHVyZSh1X21hdENhcFRleHR1cmUsIG5vcm1hbFVWQ29yZGluYXRlKTtcXG4gIHJ0MCA9IG1hdENhcENvbG9yO1xcblxcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBbWYsa0JBQWM7QUFBVyx1QkFBbUI7QUFBdmlCLDZCQUFDLE1BQTBmLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K

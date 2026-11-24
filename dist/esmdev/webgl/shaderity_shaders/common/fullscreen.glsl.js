// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/common/fullscreen.glsl
var code = "float x = float((gl_VertexID & 1) << 2);\nfloat y = float((gl_VertexID & 2) << 1);\nv_texcoord_0.x = x * 0.5;\nv_texcoord_0.y = y * 0.5;\ngl_Position = vec4(x - 1.0, y - 1.0, 0, 1);\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var fullscreen_default = { code, shaderStage, isFragmentShader };
export {
  code,
  fullscreen_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvY29tbW9uL2Z1bGxzY3JlZW4uZ2xzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZmxvYXQgeCA9IGZsb2F0KChnbF9WZXJ0ZXhJRCAmIDEpIDw8IDIpO1xcbmZsb2F0IHkgPSBmbG9hdCgoZ2xfVmVydGV4SUQgJiAyKSA8PCAxKTtcXG52X3RleGNvb3JkXzAueCA9IHggKiAwLjU7XFxudl90ZXhjb29yZF8wLnkgPSB5ICogMC41O1xcbmdsX1Bvc2l0aW9uID0gdmVjNCh4IC0gMS4wLCB5IC0gMS4wLCAwLCAxKTtcXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBMEwsa0JBQWM7QUFBVyx1QkFBbUI7QUFBOU8sMkJBQUMsTUFBaU0sYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=

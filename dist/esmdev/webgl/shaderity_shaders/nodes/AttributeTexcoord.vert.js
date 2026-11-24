// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/AttributeTexcoord.vert
var code = "\nvoid attributeTexcoord(in uint texcoordIndex, out vec2 outValue) {\n  if(texcoordIndex == 0u) {\n    outValue = a_texcoord_0;\n  } else if(texcoordIndex == 1u) {\n    outValue = a_texcoord_1;\n  } else {\n    outValue = a_texcoord_2;\n  }\n}\n";
var shaderStage = "vertex";
var isFragmentShader = false;
var AttributeTexcoord_default = { code, shaderStage, isFragmentShader };
export {
  code,
  AttributeTexcoord_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvQXR0cmlidXRlVGV4Y29vcmQudmVydCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiXFxudm9pZCBhdHRyaWJ1dGVUZXhjb29yZChpbiB1aW50IHRleGNvb3JkSW5kZXgsIG91dCB2ZWMyIG91dFZhbHVlKSB7XFxuICBpZih0ZXhjb29yZEluZGV4ID09IDB1KSB7XFxuICAgIG91dFZhbHVlID0gYV90ZXhjb29yZF8wO1xcbiAgfSBlbHNlIGlmKHRleGNvb3JkSW5kZXggPT0gMXUpIHtcXG4gICAgb3V0VmFsdWUgPSBhX3RleGNvb3JkXzE7XFxuICB9IGVsc2Uge1xcbiAgICBvdXRWYWx1ZSA9IGFfdGV4Y29vcmRfMjtcXG4gIH1cXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwidmVydGV4XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6ZmFsc2V9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBd1Asa0JBQWM7QUFBUyx1QkFBbUI7QUFBMVMsa0NBQUMsTUFBK1AsYUFBdUIsaUJBQXdCOyIsCiAgIm5hbWVzIjogW10KfQo=

import Rn from '../../../../dist/esm';

test('ConstantVariable works correctly 1', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  const constant1 = new Rn.ConstantVector4VariableShaderNode(Rn.ComponentType.Float);
  constant1.setDefaultInputValue(Rn.Vector4.fromCopyArray([1, 2, 3, 4]));
  const constant2 = new Rn.ConstantVector4VariableShaderNode(Rn.ComponentType.Float);
  constant2.setDefaultInputValue(Rn.Vector4.fromCopyArray([4, 3, 2, 1]));

  const add = new Rn.AddShaderNode(Rn.CompositionType.Vec4, Rn.ComponentType.Float);
  add.addInputConnection(constant1, constant1.getSocketOutput(), add.getSocketInputLhs());
  add.addInputConnection(constant2, constant2.getSocketOutput(), add.getSocketInputRhs());

  const outPosition = new Rn.OutPositionShaderNode();
  outPosition.addInputConnection(add, add.getSocketOutput(), outPosition.getSocketInput());

  // nodes are intentionally made the order random
  const commonShaderPart = new Rn.StandardShaderPart();
  const ret = Rn.ShaderGraphResolver.createVertexShaderCode(
    engine,
    [constant1, constant2, add, outPosition],
    [],
    commonShaderPart
  );

  // console.log(ret.shaderBody, ret.shader);

  expect(ret!.replace(/\s+/g, '')).toEqual(
    `#version300esprecisionhighpfloat;precisionhighpint;/*shaderity:@{definitions}*/#defineRN_IS_NODE_SHADER/*shaderity:@{prerequisites}*/#ifdefRN_IS_MORPHINGuniformintu_currentPrimitiveIdx;//initialValue=0,isInternalSetting=true,soloDatum=false,needUniformInDataTextureMode=true#endifinvec4a_position;#ifdefRN_USE_COLOR_0invec4a_color;#elseconstvec4a_color=vec4(1.0,1.0,1.0,1.0);#endifinvec3a_normal;inuvec4a_instanceIds;invec2a_texcoord_0;invec2a_texcoord_1;invec2a_texcoord_2;inuvec4a_joint;invec4a_weight;invec4a_baryCentricCoord;invec4a_tangent;flatoutuvec4v_instanceIds;uniformboolu_vertexAttributesExistenceArray[12];/*shaderity:@{getters}*//*shaderity:@{matricesGetters}*//*shaderity:@{opticalDefinition}*//*shaderity:@{shadowDefinition}*//*shaderity:@{pbrDefinition}*//*shaderity:@{iblDefinition}*/voidConstantVector4_0(outvec4outValue){outValue=vec4(1.0,2.0,3.0,4.0);}voidConstantVector4_1(outvec4outValue){outValue=vec4(4.0,3.0,2.0,1.0);}voidadd(infloatlfs,infloatrhs,outfloatoutValue){outValue=lfs+rhs;}voidadd(inintlfs,inintrhs,outintoutValue){outValue=lfs+rhs;}voidadd(invec2lfs,invec2rhs,outvec2outValue){outValue=lfs+rhs;}voidadd(invec3lfs,invec3rhs,outvec3outValue){outValue=lfs+rhs;}voidadd(invec4lfs,invec4rhs,outvec4outValue){outValue=lfs+rhs;}voidoutPosition(invec4inPosition){gl_Position=inPosition;}voidmain(){v_instanceIds=a_instanceIds;/*shaderity:@{mainPrerequisites}*/vec4outValue_0_to_2=vec4(0.0,0.0,0.0,0.0);vec4outValue_1_to_2=vec4(0.0,0.0,0.0,0.0);vec4outValue_2_to_3=vec4(0.0,0.0,0.0,0.0);ConstantVector4_0(outValue_0_to_2);ConstantVector4_1(outValue_1_to_2);add(outValue_0_to_2,outValue_1_to_2,outValue_2_to_3);outPosition(outValue_2_to_3);}
    `.replace(/\s+/g, '')
  );
});

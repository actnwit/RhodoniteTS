let makeOutputSrgb = get_makeOutputSrgb(materialSID, 0);
rt0 = vec4f(select(rt0.rgb, linearToSrgb(rt0.rgb), makeOutputSrgb), rt0.a);

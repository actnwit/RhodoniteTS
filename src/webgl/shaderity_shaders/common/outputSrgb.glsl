float makeOutputSrgb = float(get_makeOutputSrgb(materialSID, 0));
rt0.rgb = mix(rt0.rgb, linearToSrgb(rt0.rgb), makeOutputSrgb);

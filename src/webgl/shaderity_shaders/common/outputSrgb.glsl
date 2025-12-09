float makeOutputSrgb = float(get_makeOutputSrgb(uint(materialSID), 0u));
rt0.rgb = mix(rt0.rgb, linearToSrgb(rt0.rgb), makeOutputSrgb);

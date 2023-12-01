let makeOutputSrgb = get_makeOutputSrgb(materialSID, 0);
resultColor = mix(resultColor.rgb, linearToSrgb(resultColor.rgb), makeOutputSrgb);

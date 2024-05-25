let makeOutputSrgb = get_makeOutputSrgb(materialSID, 0);
resultColor = select(resultColor.rgb, linearToSrgb(resultColor.rgb), makeOutputSrgb);

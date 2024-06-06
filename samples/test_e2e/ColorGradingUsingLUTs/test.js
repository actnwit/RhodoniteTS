const doTests =
  require('../common/testFunc').doTests;

const modes = ['uniform', 'datatexture'];

doTests('ColorGradingUsingLUTs', modes);

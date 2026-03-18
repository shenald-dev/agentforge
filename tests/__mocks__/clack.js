module.exports = {
  intro: jest.fn(),
  outro: jest.fn(),
  spinner: () => ({ start: jest.fn(), stop: jest.fn() }),
  group: jest.fn(),
  text: jest.fn(),
  select: jest.fn(),
  password: jest.fn(),
  cancel: jest.fn(),
  isCancel: jest.fn(),
  log: {
    warn: jest.fn(),
    message: jest.fn(),
    step: jest.fn(),
  }
};

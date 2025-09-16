/*
 * Mock for GObject from gi://GObject
 */

export const ParamFlags = {
  READWRITE: 'readwrite',
  READABLE: 'readable',
  WRITABLE: 'writable',
};

export const BindingFlags = {
  DEFAULT: 'default',
  BIDIRECTIONAL: 'bidirectional',
  SYNC_CREATE: 'sync-create',
};

export const ParamSpec = {
  boolean: jest.fn((name: string, title: string, subtitle: string, flags: string, defaultValue: boolean) => ({
    name,
    title,
    subtitle,
    flags,
    defaultValue,
  })),
  string: jest.fn((name: string, title: string, subtitle: string, flags: string, defaultValue: string) => ({
    name,
    title,
    subtitle,
    flags,
    defaultValue,
  })),
  jsobject: jest.fn((name: string, title: string, subtitle: string, flags: string) => ({
    name,
    title,
    subtitle,
    flags,
  })),
};

export const registerClass = jest.fn((props: any, classConstructor: any) => {
  return classConstructor;
});

export default {
  ParamFlags,
  BindingFlags,
  ParamSpec,
  registerClass,
};
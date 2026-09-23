// Code under src/ reads the loaded configuration from the `__APP_ENV__`
// global that the build defines. Tests start from an empty configuration and
// override it with vi.stubGlobal('__APP_ENV__', {...}) where it matters.
globalThis.__APP_ENV__ = {}

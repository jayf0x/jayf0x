const isDevelopment = true

export const devLog = (...args) => isDevelopment && console.log("[DEV]", ...args)
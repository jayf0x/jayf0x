const isDevelopment = true;

export const devLog = (...args) =>
  isDevelopment && console.warn("[DEV]", ...args);

export const isBase64 = (str) => {
  try {
    return btoa(atob(str)) === str;
  } catch (_err) {
    return false;
  }
};

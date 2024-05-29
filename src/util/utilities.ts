function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO convert to typescript
// const parseCookieString = (cookieString) => {
//   if (!cookieString) {
//     return {};
//   }
//
//   const cookieArray = cookieString
//     .replace(/\s+/g, '')
//     .split(';');
//   const cookieObj = {};
//
//   cookieArray.forEach(cookieStr => {
//     const [cookieKey, cookieVal] = cookieStr.split('=');
//     cookieObj[cookieKey] = cookieVal;
//   });
//
//   return cookieObj;
// };
//
// const getCookieValueFromCookies = (key, cookieString) => {
//   const cookiesObj = parseCookieString(cookieString);
//   return cookiesObj[key];
// };

export default {
  sleep,
}

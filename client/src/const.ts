export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the login page URL.
 * Previously pointed to Manus OAuth portal — now uses our own branded login page.
 */
export const getLoginUrl = (returnPath?: string) => {
  if (returnPath) {
    return `/login?redirect=${encodeURIComponent(returnPath)}`;
  }
  return "/login";
};

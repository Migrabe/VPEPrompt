export const MOBILE_PREFIX = "/mobile";
export const DESKTOP_PREFERENCE_COOKIE = "prefer-desktop";

const PHONE_UA_RE = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const STATIC_FILE_RE = /\.[a-z0-9]{1,8}$/i;

export function isMobilePath(pathname = "") {
  return pathname === MOBILE_PREFIX || pathname.startsWith(`${MOBILE_PREFIX}/`);
}

export function stripMobilePrefix(pathname = "/") {
  if (pathname === MOBILE_PREFIX || pathname === `${MOBILE_PREFIX}/`) return "/";
  if (pathname.startsWith(`${MOBILE_PREFIX}/`)) {
    return pathname.slice(MOBILE_PREFIX.length) || "/";
  }
  return pathname || "/";
}

export function parseCookies(header = "") {
  return header.split(";").reduce((cookies, part) => {
    const [rawKey, ...rawValue] = part.split("=");
    const key = String(rawKey || "").trim();
    if (!key) return cookies;
    cookies[key] = decodeURIComponent(rawValue.join("=").trim());
    return cookies;
  }, {});
}

export function buildRedirectTarget(pathname = "/", search = "", forceMobile = false) {
  const cleanPath = pathname || "/";
  if (forceMobile) {
    if (isMobilePath(cleanPath)) return `${cleanPath}${search}`;
    return `${MOBILE_PREFIX}${cleanPath === "/" ? "/" : cleanPath}${search}`;
  }
  return `${stripMobilePrefix(cleanPath)}${search}`;
}

export function withoutViewParam(originalUrl = "/") {
  const url = new URL(originalUrl, "http://localhost");
  url.searchParams.delete("view");
  const search = url.searchParams.toString();
  return { pathname: url.pathname || "/", search: search ? `?${search}` : "" };
}

export function isPhoneHeaders(headers = {}) {
  const chMobile = headers["sec-ch-ua-mobile"];
  if (chMobile === "?1") return true;
  const ua = String(headers["user-agent"] || "");
  return PHONE_UA_RE.test(ua);
}

export function shouldSkipVersionRouting(pathname = "") {
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/js/") || pathname.startsWith("/config/")) return true;
  return STATIC_FILE_RE.test(pathname);
}

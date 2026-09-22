/**
 * Cookie-based auth marker.
 * Vendosim një cookie të thjeshtë "rezervo_auth=1" që lexohet sinkronikisht
 * nga layout-et, duke shmangur race condition e zustand persist.
 */

const COOKIE_NAME = "rezervo_auth";

export function setAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=604800; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
}

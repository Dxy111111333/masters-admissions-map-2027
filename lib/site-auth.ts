export const SITE_ACCESS_COOKIE = "site_access";

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), value => value.toString(16).padStart(2, "0")).join("");
}

export async function tokenForPassword(password: string) {
  const data = new TextEncoder().encode(`admissions-dossier:${password}`);
  return hex(await crypto.subtle.digest("SHA-256", data));
}

export async function expectedAccessToken() {
  const password = process.env.SITE_PASSWORD;
  return password ? tokenForPassword(password) : null;
}

export function isValidAccessToken(actual: string, expected: string) {
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

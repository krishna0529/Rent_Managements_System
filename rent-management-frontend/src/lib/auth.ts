// src/lib/auth.ts

export interface UserSession {
  token: string;
  role: string;
  fullName: string;
  profileImagePath?: string | null;
}

export interface AdminSession {
  token: string;
  role: string;
  fullName: string;
  gmail: string;
  profileImagePath?: string | null;
}

/**
 * Validates whether a JWT token exists and has not expired.
 * Compares current time against token's expiration timestamp (exp).
 */
export function isTokenValid(token: string | null): boolean {
  if (!token || typeof token !== "string") return false;

  try {
    const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
    const parts = cleanToken.split(".");
    if (parts.length !== 3) return false;

    // Base64 decode payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    if (!payload || !payload.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expiryTimeMs = payload.exp * 1000;
    return expiryTimeMs > Date.now();
  } catch {
    return false;
  }
}

/**
 * Returns remaining milliseconds until token expires.
 * Returns 0 if token is already expired or invalid.
 */
export function getTimeUntilTokenExpiry(token: string | null): number {
  if (!token || typeof token !== "string") return 0;

  try {
    const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
    const parts = cleanToken.split(".");
    if (parts.length !== 3) return 0;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    if (!payload || !payload.exp) return 0;

    const remainingMs = payload.exp * 1000 - Date.now();
    return remainingMs > 0 ? remainingMs : 0;
  } catch {
    return 0;
  }
}

/**
 * Returns active user session if valid and not expired.
 * Automatically clears local storage if session has expired.
 */
export function getUserSession(): UserSession | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("authToken");
  if (!token || !isTokenValid(token)) {
    if (token) clearUserSession();
    return null;
  }

  return {
    token,
    role: localStorage.getItem("userRole") || "ROLE_USER",
    fullName: localStorage.getItem("userFullName") || "User",
    profileImagePath: localStorage.getItem("userProfileImage"),
  };
}

/**
 * Returns active admin session if valid and not expired.
 * Automatically clears local storage if session has expired.
 */
export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("adminToken");
  if (!token || !isTokenValid(token)) {
    if (token) clearAdminSession();
    return null;
  }

  return {
    token,
    role: localStorage.getItem("adminRole") || "ROLE_ADMIN",
    fullName: localStorage.getItem("adminFullName") || "Admin",
    gmail: localStorage.getItem("adminGmail") || "",
    profileImagePath: localStorage.getItem("adminProfileImage"),
  };
}

/**
 * Clears all user session tokens and details from storage.
 */
export function clearUserSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userFullName");
  localStorage.removeItem("userProfileImage");
}

/**
 * Clears all admin session tokens and details from storage.
 */
export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminRole");
  localStorage.removeItem("adminFullName");
  localStorage.removeItem("adminGmail");
  localStorage.removeItem("adminProfileImage");
}

/**
 * Saves user credentials to localStorage upon successful login.
 */
export function saveUserSession(data: {
  token: string;
  role?: string;
  fullName?: string;
  profileImagePath?: string | null;
}): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", data.token);
  if (data.role) localStorage.setItem("userRole", data.role);
  if (data.fullName) localStorage.setItem("userFullName", data.fullName);
  if (data.profileImagePath) {
    localStorage.setItem("userProfileImage", data.profileImagePath);
  } else {
    localStorage.removeItem("userProfileImage");
  }
}

/**
 * Saves admin credentials to localStorage upon successful login.
 */
export function saveAdminSession(data: {
  token: string;
  role?: string;
  fullName?: string;
  email?: string;
  username?: string;
  profileImagePath?: string | null;
}): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("adminToken", data.token);
  if (data.role) localStorage.setItem("adminRole", data.role);
  if (data.fullName) localStorage.setItem("adminFullName", data.fullName);
  const identifier = data.email || data.username || "";
  if (identifier) localStorage.setItem("adminGmail", identifier);
  if (data.profileImagePath) {
    localStorage.setItem("adminProfileImage", data.profileImagePath);
  } else {
    localStorage.removeItem("adminProfileImage");
  }
}

/**
 * Broadcasts a user deletion/invalidation event across all browser tabs.
 */
export function notifyUserDeleted(userId?: number, email?: string): void {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel("auth_sync");
      channel.postMessage({ type: "USER_DELETED", userId, email, timestamp: Date.now() });
      channel.close();
    } catch (e) {
      console.warn("Failed to broadcast USER_DELETED event:", e);
    }
  }
}


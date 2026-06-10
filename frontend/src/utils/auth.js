export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem("token") && getUser());
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

export function getDefaultRoute(role) {
  if (role === "admin") return "/dashboard";
  if (role === "recruiter") return "/recruiter";
  return "/candidate";
}

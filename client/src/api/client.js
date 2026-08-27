const API_URL = import.meta.env.VITE_API_URL;

async function parseResponse(response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return null;
  }

  return response.json();
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Something went wrong.");

    error.statusCode = response.status;
    error.code = data?.error?.code;
    error.data = data;

    throw error;
  }

  return data;
}

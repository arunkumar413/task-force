import { clearApiResponse, setApiResponse } from "./apiSlice";

function getError(payload, response) {
  if (response.ok) {
    return null;
  }

  if (payload?.error && typeof payload.error === "object") {
    return payload.error;
  }

  return {
    message: payload?.statusMessage || `Request failed with status ${response.status}`,
    statusMessage: payload?.statusMessage || null,
  };
}

export async function apiRequest(dispatch, key, url, options) {
  // Remove the previous result before starting a new request so consumers do
  // not render stale data while the request is in flight.
  dispatch(clearApiResponse(key));

  try {
    const response = await fetch(url, options);
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    dispatch(
      setApiResponse({
        key,
        statusCode: response.status,
        data: payload?.data ?? payload,
        error: getError(payload, response),
      })
    );

    return { response, payload };
  } catch (error) {
    dispatch(
      setApiResponse({
        key,
        statusCode: null,
        data: null,
        error: { message: error.message || "Unable to reach the server." },
      })
    );
    throw error;
  }
}


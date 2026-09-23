// MIRA API service layer
//
// Connects the React frontend to the FastAPI backend.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

const SESSION_KEY = "mira_session";
const DEMO_SCAN_KEY = "mira_demo_scan";

class BackendUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

/*
 * Generic API request helper
 */
async function apiRequest(path, options = {}) {
  let response;
  const session = getStoredSession();
  const authHeaders = !options.anonymous && session?.token
    ? { Authorization: `Bearer ${session.token}` }
    : {};

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        headers: {
          Accept: "application/json",
          ...authHeaders,
          ...(options.headers || {}),
        },
        ...options,
      }
    );
  } catch (error) {
    console.error(
      "Backend connection error:",
      error
    );

    throw new BackendUnavailableError(
      "MIRA backend is unavailable. Make sure the FastAPI server is running on " +
        API_BASE_URL
    );
  }

  if (!response.ok) {
    let detail = null;

    try {
      detail = await response.json();
    } catch {
      // Response was not JSON.
    }

    const message =
      detail?.error?.message ||
      detail?.detail ||
      `Request to ${path} failed (${response.status})`;

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function storeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function startDemoSession() {
  clearSession();
  sessionStorage.removeItem(DEMO_SCAN_KEY);
}

export function getDemoScan() {
  try { return JSON.parse(sessionStorage.getItem(DEMO_SCAN_KEY) || "null"); } catch { return null; }
}

/* =========================================================
   AUTH / USERS
   ========================================================= */

export function getCurrentSession() {
  return getStoredSession();
}

export async function registerUser(payload) {
  const session = await apiRequest(
    "/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  return storeSession(session);
}

export async function loginUser(payload) {
  const session = await apiRequest(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  return storeSession(session);
}

export async function createUserProfile(payload) {
  return apiRequest(
    "/auth/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export async function listUserProfiles() {
  return apiRequest("/auth/users");
}

/* =========================================================
   SKIN ANALYSIS
   ========================================================= */

export async function getSkinAnalysis() {
  const data =
    await apiRequest(
      "/skin-analysis/latest"
    );

  return data.metrics;
}

export async function runSkinAnalysis(
  imageBlob
) {
  const form = new FormData();

  if (imageBlob) {
    form.append(
      "frame",
      imageBlob,
      "frame.jpg"
    );
  }

  return apiRequest(
    "/skin-analysis/analyze",
    {
      method: "POST",
      body: form,
    }
  );
}

export async function runDemoSkinAnalysis(imageBlob) {
  const form = new FormData();
  if (imageBlob) form.append("frame", imageBlob, "frame.jpg");
  const data = await apiRequest("/skin-analysis/demo/analyze", { method: "POST", body: form, anonymous: true });
  sessionStorage.setItem(DEMO_SCAN_KEY, JSON.stringify(data));
  return data;
}

export async function getMySkinAnalysisHistory(
  page = 1,
  pageSize = 10
) {
  return apiRequest(
    `/skin-analysis/history/me?page=${page}&page_size=${pageSize}`
  );
}

export async function getPersonalizedSkinInsights() {
  return apiRequest("/skin-insights/me");
}

/* =========================================================
   FACIAL EXPRESSION
   ========================================================= */

export async function getFacialExpression() {
  const data =
    await apiRequest(
      "/expression/latest"
    );

  return {
    current: data.current,
    states: data.states,
    confidence: data.confidence,
  };
}

/*
 * IMPORTANT:
 * MirrorView.jsx imports this function.
 */
export async function runExpressionEstimate() {
  const data =
    await apiRequest(
      "/expression/estimate",
      {
        method: "POST",
      }
    );

  return {
    current: data.current,
    states: data.states,
    confidence: data.confidence,
  };
}

/* =========================================================
   HAND TRACKING
   ========================================================= */

export async function getHandTrackingStatus() {
  return apiRequest(
    "/hand-tracking/status"
  );
}

/* =========================================================
   RECOMMENDATIONS
   ========================================================= */

export async function getRecommendations() {
  const data =
    await apiRequest(
      "/recommendations"
    );

  return data.items;
}

export async function addRecommendationToRoutine(
  id
) {
  return apiRequest(
    `/recommendations/${id}/add-to-routine`,
    {
      method: "PATCH",
    }
  );
}

/* =========================================================
   COSMETIC PRODUCTS (Open Beauty Facts via MIRA backend)
   ========================================================= */
export async function getProductRecommendations() { return apiRequest("/products/recommendations"); }
export async function getDemoProductRecommendations() {
  const scan = getDemoScan();
  if (!scan?.demo_scan_id) throw new Error("Run a demo scan before viewing product recommendations.");
  return apiRequest("/products/demo/recommendations", { method: "POST", anonymous: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ demo_scan_id: scan.demo_scan_id }) });
}
export async function searchProducts(query) { return apiRequest(`/products/search?query=${encodeURIComponent(query)}`); }
export async function getRoutineProducts() { return apiRequest("/products/routine"); }
export async function addProductToRoutine(product) {
  return apiRequest("/products/routine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product }) });
}
export async function removeRoutineProduct(id) { return apiRequest(`/products/routine/${id}`, { method: "DELETE" }); }

/* =========================================================
   ROUTINE
   ========================================================= */

export async function getRoutineProgress() {
  const data =
    await apiRequest(
      "/routine/progress"
    );

  return {
    steps: data.steps || [],
    percentComplete:
      data.percentComplete || 0,
  };
}

export async function completeRoutineStep(
  stepId,
  complete = true
) {
  return apiRequest(
    `/routine/steps/${stepId}/complete?complete=${complete}`,
    {
      method: "PATCH",
    }
  );
}

export async function resetRoutine() {
  return apiRequest(
    "/routine/reset",
    {
      method: "POST",
    }
  );
}

/* =========================================================
   WELLNESS
   ========================================================= */

export async function getWellnessInsights(
  days = 7
) {
  const data =
    await apiRequest(
      `/wellness/insights?days=${days}`
    );

  return {
    trend: data.trend,
    completion: data.completion,
  };
}

/* =========================================================
   PRIVACY
   ========================================================= */

export async function getPrivacyStatus() {
  return apiRequest(
    "/privacy/status"
  );
}

/* =========================================================
   EVENT BUS
   ========================================================= */

/*
 * MirrorView.jsx imports emitAnalysisComplete.
 *
 * This allows other components to refresh after
 * skin/expression analysis is completed.
 */

const analysisListeners =
  new Set();

export function emitAnalysisComplete(
  data = null
) {
  analysisListeners.forEach(
    (listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(
          "Analysis listener error:",
          error
        );
      }
    }
  );
}

export function onAnalysisComplete(
  listener
) {
  analysisListeners.add(listener);

  return () => {
    analysisListeners.delete(
      listener
    );
  };
}

/* =========================================================
   ERROR CLASS
   ========================================================= */

export {
  BackendUnavailableError,
};

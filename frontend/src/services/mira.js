// MIRA API service layer
//
// Connects the React frontend to the FastAPI backend.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

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

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        headers: {
          Accept: "application/json",
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

export async function getSkinAnalysisHistory(
  page = 1,
  pageSize = 10
) {
  return apiRequest(
    `/skin-analysis/history?page=${page}&page_size=${pageSize}`
  );
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
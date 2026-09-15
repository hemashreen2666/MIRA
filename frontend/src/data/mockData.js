// Mock / demo data only. Nothing here is derived from real inference —
// it exists so the interface has realistic content to render while the
// Python/OpenCV + MediaPipe backend is not yet connected. See
// src/services/mira.js for where live data will eventually replace this.

export const skinMetrics = [
  {
    id: "acne",
    label: "Acne-like Spots",
    value: "Low",
    level: 18,
    trend: -3,
    note: "Visible Feature",
  },
  {
    id: "redness",
    label: "Redness",
    value: "Moderate",
    level: 42,
    trend: 5,
    note: "Detected",
  },
  {
    id: "darkCircles",
    label: "Dark Circles",
    value: "Moderate",
    level: 51,
    trend: 2,
    note: "Detected",
  },
  {
    id: "unevenTone",
    label: "Uneven Skin Tone",
    value: "Low",
    level: 24,
    trend: -1,
    note: "Visible Feature",
  },
  {
    id: "brightness",
    label: "Facial Brightness",
    value: "High",
    level: 74,
    trend: 6,
    note: "Detected",
  },
  {
    id: "oily",
    label: "Oily Appearance",
    value: "Low",
    level: 21,
    trend: 0,
    note: "Visible Feature",
  },
];

export const recommendations = [
  {
    id: "hydration",
    title: "Hydration",
    body: "Consider maintaining a consistent hydration-focused routine.",
    priority: "High",
    addedToRoutine: false,
  },
  {
    id: "sun",
    title: "Sun Protection",
    body: "Consider using appropriate sun protection during daytime hours.",
    priority: "High",
    addedToRoutine: true,
  },
  {
    id: "cleanse",
    title: "Skin Cleansing",
    body: "Follow a consistent cleansing routine, morning and night.",
    priority: "Medium",
    addedToRoutine: true,
  },
  {
    id: "sleep",
    title: "Rest & Recovery",
    body: "Visible under-eye signs may ease with a more consistent sleep schedule.",
    priority: "Low",
    addedToRoutine: false,
  },
];

export const expressionStates = ["Happy", "Neutral", "Sad", "Tired"];

export const routineSteps = [
  {
    id: 1,
    title: "Cleanse",
    description: "Gentle cleanser, lukewarm water, 60 seconds.",
    duration: "1 min",
    complete: true,
  },
  {
    id: 2,
    title: "Hydrate",
    description: "Apply hydrating toner or essence to damp skin.",
    duration: "1 min",
    complete: true,
  },
  {
    id: 3,
    title: "Moisturize",
    description: "Lock in moisture with a lightweight daily moisturizer.",
    duration: "2 min",
    complete: false,
  },
  {
    id: 4,
    title: "Sun Protection",
    description: "Broad-spectrum SPF, reapply if heading outdoors.",
    duration: "1 min",
    complete: false,
  },
];

export const wellnessTrend = [
  { day: "Mon", consistency: 62, brightness: 58 },
  { day: "Tue", consistency: 70, brightness: 61 },
  { day: "Wed", consistency: 65, brightness: 64 },
  { day: "Thu", consistency: 78, brightness: 68 },
  { day: "Fri", consistency: 74, brightness: 70 },
  { day: "Sat", consistency: 82, brightness: 72 },
  { day: "Sun", consistency: 88, brightness: 74 },
];

export const routineCompletion = [
  { name: "Cleanse", value: 96 },
  { name: "Hydrate", value: 91 },
  { name: "Moisturize", value: 78 },
  { name: "Sun Care", value: 65 },
];

export const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "skin", label: "Skin Analysis" },
  { id: "wellness", label: "Wellness" },
  { id: "routine", label: "Skincare Routine" },
  { id: "insights", label: "Insights" },
  { id: "settings", label: "Settings" },
];

export const settingsToggles = [
  { id: "camera", label: "Camera", description: "Enable the mirror's live camera feed.", enabled: true },
  { id: "voice", label: "Voice Assistance", description: "Let MIRA speak routine guidance aloud.", enabled: true },
  { id: "hand", label: "Hand Tracking", description: "Navigate routines using hand gestures.", enabled: true },
  { id: "local", label: "Local Processing", description: "Keep all AI inference on this device.", enabled: true },
  { id: "notifications", label: "Notifications", description: "Reminders for upcoming routine steps.", enabled: false },
  { id: "theme", label: "Dark Theme", description: "Optimized for low-light bathroom lighting.", enabled: true },
];

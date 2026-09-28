/** Pure weather helpers and types, safe to import from client components. */

export type Units = "metric" | "imperial";

export type WeatherDay = {
  date: string;
  code: number;
  tMax: number;
  tMin: number;
  sunrise: string; // HH:MM local
  sunset: string;
  precipProb: number | null;
  uvMax: number | null;
};

export type WeatherReport = {
  provider: "open-meteo" | "mock";
  fetchedAt: string;
  units: Units;
  timezone: string;
  current: {
    temp: number;
    feelsLike: number;
    code: number;
    isDay: boolean;
    humidity: number;
    wind: number;
    precipitation: number;
    uv: number | null;
  };
  daily: WeatherDay[];
  airQuality: { usAqi: number | null; europeanAqi: number | null; label: string } | null;
};

export type GeoResult = {
  name: string;
  country: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
};

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "sun" },
  1: { label: "Mainly clear", icon: "sun" },
  2: { label: "Partly cloudy", icon: "cloud-sun" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "cloud-fog" },
  48: { label: "Rime fog", icon: "cloud-fog" },
  51: { label: "Light drizzle", icon: "cloud-drizzle" },
  53: { label: "Drizzle", icon: "cloud-drizzle" },
  55: { label: "Heavy drizzle", icon: "cloud-drizzle" },
  56: { label: "Freezing drizzle", icon: "cloud-drizzle" },
  57: { label: "Freezing drizzle", icon: "cloud-drizzle" },
  61: { label: "Light rain", icon: "cloud-rain" },
  63: { label: "Rain", icon: "cloud-rain" },
  65: { label: "Heavy rain", icon: "cloud-rain" },
  66: { label: "Freezing rain", icon: "cloud-rain" },
  67: { label: "Freezing rain", icon: "cloud-rain" },
  71: { label: "Light snow", icon: "cloud-snow" },
  73: { label: "Snow", icon: "cloud-snow" },
  75: { label: "Heavy snow", icon: "cloud-snow" },
  77: { label: "Snow grains", icon: "cloud-snow" },
  80: { label: "Rain showers", icon: "cloud-rain" },
  81: { label: "Rain showers", icon: "cloud-rain" },
  82: { label: "Violent showers", icon: "cloud-rain" },
  85: { label: "Snow showers", icon: "cloud-snow" },
  86: { label: "Snow showers", icon: "cloud-snow" },
  95: { label: "Thunderstorm", icon: "cloud-lightning" },
  96: { label: "Thunderstorm, hail", icon: "cloud-lightning" },
  99: { label: "Thunderstorm, hail", icon: "cloud-lightning" },
};

export function describeWeather(code: number, isDay = true): { label: string; icon: string } {
  const base = WMO[code] ?? { label: "Unknown", icon: "cloud" };
  if (!isDay && (code === 0 || code === 1)) return { label: base.label, icon: "moon" };
  if (!isDay && code === 2) return { label: base.label, icon: "cloud-moon" };
  return base;
}

export function aqiLabel(usAqi: number | null): string {
  if (usAqi === null) return "Unknown";
  if (usAqi <= 50) return "Good";
  if (usAqi <= 100) return "Moderate";
  if (usAqi <= 150) return "Unhealthy for sensitive groups";
  if (usAqi <= 200) return "Unhealthy";
  if (usAqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

const OUTDOOR = /\b(run|jog|walk|hike|cycle|cycling|bike|biking|swim|garden|surf|outdoor|outside|park|tennis|golf|football|soccer|basketball|ride)\b/i;

/** Weather-aware nudge for outdoor habits, or null. */
export function weatherNudge(habitName: string, report: WeatherReport | null): string | null {
  if (!report || !OUTDOOR.test(habitName)) return null;
  const today = report.daily[0];
  if (!today) return null;
  if ((today.precipProb ?? 0) >= 60) return `Rain likely (${today.precipProb}%). Do the two-minute version indoors if needed.`;
  if (today.code >= 95) return "Storms forecast. Have a backup plan indoors.";
  if (report.current.uv !== null && report.current.uv >= 8) return `UV is ${report.current.uv}. Go early or late and cover up.`;
  if (report.airQuality && report.airQuality.usAqi !== null && report.airQuality.usAqi > 150) return `Air quality is ${report.airQuality.label.toLowerCase()}. Consider an indoor alternative.`;
  if ((today.precipProb ?? 0) <= 20 && today.code <= 2) return "Clear skies. Great day to get outside.";
  return null;
}

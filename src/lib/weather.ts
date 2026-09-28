import { cached } from "./cache";
import { aqiLabel, type GeoResult, type Units, type WeatherDay, type WeatherReport } from "./weather-shared";

export * from "./weather-shared";

function provider(): "open-meteo" | "mock" {
  return process.env.WEATHER_PROVIDER === "mock" ? "mock" : "open-meteo";
}

async function getJSON<T>(url: string, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "HabitScheduler/1.0" } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${new URL(url).host}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

function hhmm(iso: string): string {
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : iso;
}

type OMForecast = {
  timezone: string;
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    is_day: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
    uv_index?: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: (number | null)[];
    uv_index_max: (number | null)[];
  };
};
type OMAir = { current: { us_aqi: number | null; european_aqi: number | null } };

export async function getWeather(lat: number, lon: number, units: Units, timezone: string): Promise<WeatherReport> {
  if (provider() === "mock") return mockWeather(units, timezone);
  const key = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}:${units}:${timezone}`;
  return cached(key, 30 * 60, async () => {
    const base = process.env.OPEN_METEO_BASE ?? "https://api.open-meteo.com";
    const airBase = process.env.OPEN_METEO_AIR_BASE ?? "https://air-quality-api.open-meteo.com";
    const p = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: [
        "temperature_2m", "apparent_temperature", "weather_code", "is_day", "relative_humidity_2m",
        "wind_speed_10m", "precipitation", "uv_index",
      ].join(","),
      daily: [
        "weather_code", "temperature_2m_max", "temperature_2m_min", "sunrise", "sunset",
        "precipitation_probability_max", "uv_index_max",
      ].join(","),
      timezone,
      forecast_days: "7",
    });
    if (units === "imperial") {
      p.set("temperature_unit", "fahrenheit");
      p.set("wind_speed_unit", "mph");
      p.set("precipitation_unit", "inch");
    }
    const forecast = await getJSON<OMForecast>(`${base}/v1/forecast?${p}`);
    let air: OMAir | null = null;
    try {
      const ap = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        current: "us_aqi,european_aqi",
        timezone,
      });
      air = await getJSON<OMAir>(`${airBase}/v1/air-quality?${ap}`, 5000);
    } catch {
      air = null;
    }
    const c = forecast.current;
    return {
      provider: "open-meteo" as const,
      fetchedAt: new Date().toISOString(),
      units,
      timezone: forecast.timezone,
      current: {
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        code: c.weather_code,
        isDay: c.is_day === 1,
        humidity: Math.round(c.relative_humidity_2m),
        wind: Math.round(c.wind_speed_10m),
        precipitation: c.precipitation,
        uv: c.uv_index ?? null,
      },
      daily: forecast.daily.time.map((date, i) => ({
        date,
        code: forecast.daily.weather_code[i],
        tMax: Math.round(forecast.daily.temperature_2m_max[i]),
        tMin: Math.round(forecast.daily.temperature_2m_min[i]),
        sunrise: hhmm(forecast.daily.sunrise[i]),
        sunset: hhmm(forecast.daily.sunset[i]),
        precipProb: forecast.daily.precipitation_probability_max[i] ?? null,
        uvMax: forecast.daily.uv_index_max[i] ?? null,
      })),
      airQuality: air
        ? {
            usAqi: air.current.us_aqi,
            europeanAqi: air.current.european_aqi,
            label: aqiLabel(air.current.us_aqi),
          }
        : null,
    };
  });
}

type OMGeo = {
  results?: {
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }[];
};

export async function geocode(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (provider() === "mock") {
    return [
      { name: "Sydney", country: "Australia", admin1: "New South Wales", latitude: -33.87, longitude: 151.21, timezone: "Australia/Sydney" },
      { name: "London", country: "United Kingdom", admin1: "England", latitude: 51.51, longitude: -0.13, timezone: "Europe/London" },
      { name: "New York", country: "United States", admin1: "New York", latitude: 40.71, longitude: -74.01, timezone: "America/New_York" },
    ].filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || q.length < 3);
  }
  const base = process.env.OPEN_METEO_GEO_BASE ?? "https://geocoding-api.open-meteo.com";
  const url = `${base}/v1/search?${new URLSearchParams({ name: q, count: "6", language: "en", format: "json" })}`;
  const data = await cached(`geo:${q.toLowerCase()}`, 24 * 3600, () => getJSON<OMGeo>(url));
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country ?? null,
    admin1: r.admin1 ?? null,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? null,
  }));
}

export function mockWeather(units: Units, timezone: string): WeatherReport {
  const today = new Date();
  const c = (v: number) => (units === "imperial" ? Math.round(v * 1.8 + 32) : v);
  const daily: WeatherDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + i * 86_400_000);
    const codes = [1, 2, 61, 3, 0, 80, 2];
    return {
      date: d.toISOString().slice(0, 10),
      code: codes[i],
      tMax: c(22 - i),
      tMin: c(12 - Math.floor(i / 2)),
      sunrise: "06:12",
      sunset: "18:47",
      precipProb: [5, 20, 80, 30, 0, 65, 15][i],
      uvMax: [7, 6, 3, 4, 8, 3, 6][i],
    };
  });
  return {
    provider: "mock",
    fetchedAt: new Date().toISOString(),
    units,
    timezone,
    current: { temp: c(19), feelsLike: c(18), code: 2, isDay: true, humidity: 58, wind: units === "imperial" ? 8 : 13, precipitation: 0, uv: 5 },
    daily,
    airQuality: { usAqi: 32, europeanAqi: 21, label: "Good" },
  };
}


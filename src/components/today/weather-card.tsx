"use client";

import Link from "next/link";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Droplets, Moon, Sun, Sunrise, Sunset, Wind } from "lucide-react";
import { Card, Label } from "@/components/ui";
import { describeWeather, type WeatherReport } from "@/lib/weather-shared";
import { weekdayShort } from "@/lib/dates";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  sun: Sun, moon: Moon, "cloud-sun": CloudSun, "cloud-moon": CloudMoon, cloud: Cloud, "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle, "cloud-rain": CloudRain, "cloud-snow": CloudSnow, "cloud-lightning": CloudLightning,
};

export function WeatherIcon({ code, isDay = true, size = 20, className }: { code: number; isDay?: boolean; size?: number; className?: string }) {
  const { icon } = describeWeather(code, isDay);
  const Cmp = ICONS[icon] ?? Cloud;
  return <Cmp size={size} className={className} />;
}

export function WeatherCard({ weather, error, hasLocation, locationName, today }: { weather: WeatherReport | null; error: string | null; hasLocation: boolean; locationName: string | null; today: string }) {
  if (!hasLocation) {
    return (
      <Card className="h-full flex flex-col justify-center">
        <Label>Weather</Label>
        <div className="font-bold mt-1">Add your location for a daily forecast</div>
        <p className="text-sm text-text-2 mt-1">
          Sunrise, sunset, rain chance, UV and air quality from Open-Meteo, plus weather-aware nudges for outdoor habits.{" "}
          <Link href="/settings#location" className="text-accent font-semibold">Set location →</Link>
        </p>
      </Card>
    );
  }
  if (!weather) {
    return (
      <Card className="h-full flex flex-col justify-center">
        <Label>Weather · {locationName}</Label>
        <div className="font-bold mt-1">Forecast unavailable right now</div>
        <p className="text-sm text-text-3 mt-1">{error ?? "Try again in a few minutes."}</p>
      </Card>
    );
  }
  const unit = weather.units === "imperial" ? "°F" : "°C";
  const windUnit = weather.units === "imperial" ? "mph" : "km/h";
  const d0 = weather.daily[0];
  const cur = describeWeather(weather.current.code, weather.current.isDay);
  return (
    <Card className="h-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4 min-w-[190px]">
          <WeatherIcon code={weather.current.code} isDay={weather.current.isDay} size={44} className="text-accent" />
          <div>
            <Label>{locationName}</Label>
            <div className="text-3xl font-extrabold tabular leading-none mt-1">
              {weather.current.temp}
              <span className="text-lg text-text-2">{unit}</span>
            </div>
            <div className="text-sm text-text-2 mt-0.5">{cur.label} · feels {weather.current.feelsLike}{unit}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs text-text-2 flex-1">
          <span className="inline-flex items-center gap-1.5"><Sunrise size={14} className="text-warning" />{d0?.sunrise}</span>
          <span className="inline-flex items-center gap-1.5"><Sunset size={14} className="text-warning" />{d0?.sunset}</span>
          <span className="inline-flex items-center gap-1.5"><Droplets size={14} className="text-accent" />{d0?.precipProb ?? 0}% rain</span>
          <span className="inline-flex items-center gap-1.5"><Wind size={14} />{weather.current.wind} {windUnit}</span>
          <span className="inline-flex items-center gap-1.5"><Sun size={14} />UV {d0?.uvMax ?? weather.current.uv ?? "–"}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: aqiColor(weather.airQuality?.usAqi ?? null) }} aria-hidden />
            AQI {weather.airQuality?.usAqi ?? "–"} {weather.airQuality ? `· ${weather.airQuality.label}` : ""}
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">
        {weather.daily.slice(0, 7).map((d) => (
          <div key={d.date} className="rounded-xl bg-surface-2 border border-border py-2 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">{d.date === today ? "Today" : weekdayShort(d.date)}</span>
            <WeatherIcon code={d.code} size={16} className="text-text-2" />
            <span className="text-xs tabular font-semibold">{d.tMax}°</span>
            <span className="text-[10px] tabular text-text-3">{d.tMin}°</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-text-3">
        Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="hover:underline">Open-Meteo</a>
        {weather.provider === "mock" && " (mock data)"}
      </div>
    </Card>
  );
}

function aqiColor(aqi: number | null): string {
  if (aqi === null) return "var(--text-3)";
  if (aqi <= 50) return "var(--accent)";
  if (aqi <= 100) return "var(--warning)";
  return "var(--danger)";
}

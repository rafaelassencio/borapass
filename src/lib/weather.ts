import { useState, useEffect } from "react";

export type WeatherData = {
  temp: number;
  condition: string;
  climatempoUrl: string;
  cityName: string;
  isLive: boolean;
};

// Cache for city coordinates to minimize network latency
const GEO_CACHE: Record<string, { lat: number; lng: number }> = {
  "rio de janeiro": { lat: -22.9068, lng: -43.1729 },
  "armacao dos buzios": { lat: -22.7561, lng: -41.8887 },
  buzios: { lat: -22.7561, lng: -41.8887 },
  "angra dos reis": { lat: -23.0067, lng: -44.3181 },
  paraty: { lat: -23.2178, lng: -44.7131 },
  "cabo frio": { lat: -22.8892, lng: -42.0286 },
  petropolis: { lat: -22.505, lng: -43.1789 },
  "valparaiso de goias": { lat: -16.0688, lng: -47.9764 },
  gramado: { lat: -29.3788, lng: -50.8742 },
};

function getWeatherCondition(code: number): string {
  if (code === 0) return "Ensolarado";
  if (code >= 1 && code <= 3) return "Sol com nuvens";
  if (code === 45 || code === 48) return "Nevoeiro";
  if (code >= 51 && code <= 67) return "Chuva";
  if (code >= 80 && code <= 82) return "Pancadas de chuva";
  if (code >= 95) return "Tempestade";
  return "Tempo estável";
}

import { getStoredCities } from "./cities";

/**
 * Remove sufixos de estado como "- GO", "(GO)", "- RJ" para busca limpa de clima
 */
function cleanCityName(rawName?: string | null): string {
  if (!rawName) {
    const firstStored = getStoredCities(true)[0];
    return firstStored ? firstStored.name.split("-")[0].split("(")[0].trim() : "Brasil";
  }
  return rawName.split("-")[0].split("(")[0].trim();
}

export function useRealCityWeather(citySlug?: string | null, cityName?: string | null) {
  const targetCityName = cleanCityName(cityName || citySlug);
  const [weather, setWeather] = useState<WeatherData>({
    temp: 24,
    condition: "Sol com nuvens",
    climatempoUrl: `https://www.climatempo.com.br/pesquisa?q=${encodeURIComponent(targetCityName)}`,
    cityName: targetCityName,
    isLive: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const queryName = targetCityName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    const climatempoSearchUrl = `https://www.climatempo.com.br/pesquisa?q=${encodeURIComponent(targetCityName)}`;

    async function fetchLiveWeather() {
      setLoading(true);
      try {
        let coords = GEO_CACHE[queryName];

        // Geocodificação dinâmica via Open-Meteo para a cidade selecionada pelo usuário
        if (!coords) {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(targetCityName)}&count=1&language=pt&format=json`,
          );
          const geoData = await geoRes.json();
          if (geoData && geoData.results && geoData.results.length > 0) {
            coords = {
              lat: geoData.results[0].latitude,
              lng: geoData.results[0].longitude,
            };
            GEO_CACHE[queryName] = coords;
          }
        }

        if (!coords) {
          coords = { lat: -22.9068, lng: -43.1729 };
        }

        // Temperatura em tempo real da latitude/longitude da cidade selecionada
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true`,
        );
        const weatherData = await weatherRes.json();

        if (weatherData && weatherData.current_weather) {
          const currentTemp = Math.round(weatherData.current_weather.temperature);
          const condition = getWeatherCondition(weatherData.current_weather.weathercode);

          if (isMounted) {
            setWeather({
              temp: currentTemp,
              condition,
              climatempoUrl: climatempoSearchUrl,
              cityName: targetCityName,
              isLive: true,
            });
          }
        }
      } catch {
        if (isMounted) {
          setWeather({
            temp: 24,
            condition: "Tempo estável",
            climatempoUrl: climatempoSearchUrl,
            cityName: targetCityName,
            isLive: false,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLiveWeather();

    return () => {
      isMounted = false;
    };
  }, [targetCityName]);

  return { ...weather, loading };
}

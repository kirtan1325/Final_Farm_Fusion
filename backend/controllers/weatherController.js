// backend/controllers/weatherController.js
// Now natively supports WeatherAPI.com keys!
const axios = require("axios");

const WEATHER_BASE = "http://api.weatherapi.com/v1";

const mapIcon = (code, isDay) => {
  const d = isDay ? "d" : "n";
  if (code === 1000) return `01${d}`; // Clear
  if ([1003].includes(code)) return `02${d}`; // Partly cloudy
  if ([1006].includes(code)) return `03${d}`; // Cloudy
  if ([1009].includes(code)) return `04${d}`; // Overcast
  if ([1030, 1135, 1148].includes(code)) return `50${d}`; // Mist/Fog
  if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195].includes(code)) return `09${d}`; // Rain
  if ([1198, 1201].includes(code)) return `10${d}`; // Freezing rain
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return `11${d}`; // Thunder
  return `01${d}`;
};

const getWeather = async (req, res) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey || apiKey === "your_openweather_key_here" || apiKey === "your_openweathermap_api_key") {
      return res.json({ success: true, mock: true, data: getMockWeather(req.query.city || "Your City") });
    }

    const { city, lat, lon } = req.query;
    const q = (lat && lon) ? `${lat},${lon}` : encodeURIComponent(city);
    
    if (!q) return res.status(400).json({ success: false, message: "Provide city or lat/lon" });

    // forecast.json with days=1 returns both current weather and astro (sunrise/set)
    const { data } = await axios.get(`${WEATHER_BASE}/forecast.json?key=${apiKey}&q=${q}&days=1`);
    
    res.json({
      success: true,
      data: {
        city:        data.location.name,
        country:     data.location.country,
        temp:        Math.round(data.current.temp_c),
        feelsLike:   Math.round(data.current.feelslike_c),
        humidity:    data.current.humidity,
        description: data.current.condition.text,
        icon:        mapIcon(data.current.condition.code, data.current.is_day),
        windSpeed:   Number((data.current.wind_kph / 3.6).toFixed(1)),
        visibility:  data.current.vis_km,
        sunrise:     data.forecast.forecastday[0].astro.sunrise,
        sunset:      data.forecast.forecastday[0].astro.sunset,
      },
    });
  } catch (err) {
    if (err.response?.status >= 400 && err.response?.status < 500) {
      return res.status(404).json({ success: false, message: "City not found or API key invalid" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const getForecast = async (req, res) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey || apiKey === "your_openweather_key_here" || apiKey === "your_openweathermap_api_key") {
      return res.json({ success: true, mock: true, data: getMockForecast() });
    }

    const { city, lat, lon } = req.query;
    const q = (lat && lon) ? `${lat},${lon}` : encodeURIComponent(city);
    
    if (!q) return res.status(400).json({ success: false, message: "Provide city name or lat/lon" });

    const { data } = await axios.get(`${WEATHER_BASE}/forecast.json?key=${apiKey}&q=${q}&days=5`);
    
    const forecast = data.forecast.forecastday.map(day => ({
      time:        new Date(day.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }),
      temp:        Math.round(day.day.avgtemp_c),
      description: day.day.condition.text,
      icon:        mapIcon(day.day.condition.code, 1),
      humidity:    day.day.avghumidity,
      windSpeed:   Number((day.day.maxwind_kph / 3.6).toFixed(1)),
    }));

    res.json({ success: true, data: forecast });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMockWeather = (city) => ({
  city, country: "IN",
  temp: 28, feelsLike: 31, humidity: 65,
  description: "partly cloudy",
  icon: "02d", windSpeed: 3.5, visibility: 10,
  sunrise: "06:15 AM", sunset: "06:48 PM",
  mock: true,
});

const getMockForecast = () => [
  { time: "Today",     temp: 28, description: "Partly cloudy", icon: "02d", humidity: 65, windSpeed: 3.5 },
  { time: "Tomorrow",  temp: 25, description: "Light rain",    icon: "10d", humidity: 80, windSpeed: 5.0 },
  { time: "Day after", temp: 30, description: "Sunny",         icon: "01d", humidity: 55, windSpeed: 2.0 },
  { time: "4th day",   temp: 27, description: "Cloudy",        icon: "04d", humidity: 70, windSpeed: 4.0 },
  { time: "5th day",   temp: 29, description: "Clear sky",     icon: "01d", humidity: 60, windSpeed: 3.0 },
];

module.exports = { getWeather, getForecast };

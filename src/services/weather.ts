
import axios from "axios";

interface ForecastDay {
  day: string;
  temperature: number;
  condition: string;
}

interface WeatherData {
  location: string;
  
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: ForecastDay[];
}

export const getWeather = async (city: string): Promise<WeatherData> => {
  try {
    
    const currentResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`
    );

    
    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}&cnt=40`
    );

   
    const currentData = currentResponse.data;
    
   
    const forecastData = forecastResponse.data;
    const dailyForecast: ForecastDay[] = [];
    
   
    for (let i = 0; i < forecastData.list.length; i += 8) {
      const dayData = forecastData.list[i];
      const date = new Date(dayData.dt * 1000);
      
      dailyForecast.push({
        day: date.toLocaleDateString("en-US", { weekday: "long" }),
        temperature: Math.round(dayData.main.temp),
        condition: dayData.weather[0].main
      });
      
      if (dailyForecast.length >= 5) break;
    }

    
    const weatherData: WeatherData = {
      location: currentData.name,
      
      temperature: Math.round(currentData.main.temp),
      condition: currentData.weather[0].main,
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6), 
      forecast: dailyForecast
    };

    return weatherData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Error fetching weather: ${error.response?.data?.message || error.message}`);
    } else if (error instanceof Error) {
      throw new Error(`Error fetching weather: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching weather data");
  }
};
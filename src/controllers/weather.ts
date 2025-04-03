
import { Request, Response } from "express";
import { getWeather } from "../services/weather";

export const fetchWeather = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    
    if (!city || typeof city !== "string") {
      return res.status(400).json({ 
        error: "City parameter is required and must be a string" 
      });
    }

    const data = await getWeather(city);
    res.json(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ 
        error: "Error fetching weather data",
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: "Unknown error occurred",
        details: String(error) 
      });
    }
  }
};
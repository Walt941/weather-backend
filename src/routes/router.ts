import { Router } from 'express';
import { register,login,verifyEmail,forgotPassword,resetPassword,getUserById,} from '../controllers/User'; 
import { fetchWeather } from "../controllers/weather";
const userRoutes = Router();

userRoutes.get("/weather", fetchWeather);
userRoutes.post('/register', register); 
userRoutes.post('/login', login); 
userRoutes.get('/verify-email', verifyEmail); 
userRoutes.post('/forgot-password', forgotPassword); 
userRoutes.post('/reset-password', resetPassword); 
userRoutes.get('/users/:id', getUserById); 


export default userRoutes;
import bcrypt from 'bcryptjs';
import User from '../database/models/User'; 
import { userSchemaValidator } from '../validators/userValidator';
import loginSchemaValidator from '../validators/loginValidator';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/nodeMailer/mailer';
import crypto from 'crypto';
import { logger } from '../database/config/winston.config';

const frontendLink = process.env.FRONTEND_LINK;

interface IUser {
    id: string;
    username: string;
    email: string;
    password: string;
    email_verified: boolean;
    resetCode: string | null;
    resetCodeExpiry: Date | null;
}

export const register = async (req: any, res: any) => {
    const { username, email } = req.body;
    const registerLogMessage = 'Iniciando registro de usuario';
    logger.info(registerLogMessage, { username, email });

    try {
        await userSchemaValidator.validate(req.body);

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            email_verified: false,
        });

        const successMessage = 'Usuario registrado exitosamente';
        logger.info(successMessage, {
            userId: newUser.id,
            email: newUser.email
        });

        sendVerificationEmail(email, username, newUser.id);
        const emailSentMessage = 'Email de verificación enviado';
        logger.debug(emailSentMessage, { email });

        return res.status(201).json({
            message: successMessage,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (error: any) {
        const errorMessage = 'Error en registro de usuario';
        logger.error(errorMessage, {
            error: error.message,
            stack: error.stack
        });

        if (error.name === 'SequelizeUniqueConstraintError') {
            const duplicateEmailMessage = 'El correo electrónico ya existe';
            logger.warn('Intento de registro con email existente', { email: req.body.email });
            return res.status(400).json({ message: duplicateEmailMessage });
        }

        if (error.name === 'ValidationError') {
            const validationMessage = 'Error de validación en registro';
            logger.warn(validationMessage, { errors: error.errors });
            return res.status(400).json({ message: validationMessage, errors: error.errors });
        }

        return res.status(500).json({
            message: errorMessage,
            error: error.message,
        });
    }
};

export const verifyEmail = async (req: any, res: any) => {
    const { userId } = req.query;
    const verifyEmailLogMessage = 'Verificando email de usuario';
    logger.info(verifyEmailLogMessage, { userId });

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            const notFoundMessage = 'Usuario no encontrado';
            logger.warn(notFoundMessage, { userId });
            return res.status(404).json({ message: notFoundMessage });
        }

        if (user.email_verified) {
            const alreadyVerifiedMessage = 'Email ya verificado previamente';
            logger.info(alreadyVerifiedMessage, { userId, email: user.email });
            return res.status(400).send(`
                <html>
                    <head>
                        <meta http-equiv="refresh" content="1; url=${frontendLink}">
                    </head>
                    <body>
                        <div style="display: flex; justify-content: center; align-items: center;height: 100%; background-color: #e3e3e3;">
                            <a href="${frontendLink}" style="border-width: 2px; border-style: solid; border-radius: 20px; border-color: black; width: auto; height: auto; padding-inline: 20px; text-decoration: none;"
                            >
                                <h1 style="color: #ce0014; font-weight: bold;">
                                    Verificación no necesaria
                                </h1>
                            </a>
                        </div>
                    </body>
                </html>
            `);
        }

        user.email_verified = true;
        await user.save();
        
        const verificationSuccessMessage = 'Email verificado exitosamente';
        logger.info(verificationSuccessMessage, { userId, email: user.email });

        return res.status(200).send(`
            <html>
                <head>
                    <meta http-equiv="refresh" content="3; url=${frontendLink}">
                </head>
                <body>
                    <div style="display: flex; justify-content: center; align-items: center;height: 100%; background-color: #e3e3e3;">
                        <a href="${frontendLink}" style="border-width: 2px; border-style: solid; border-radius: 20px; border-color: black; width: auto; height: auto; padding-inline: 20px; text-decoration: none;"
                        >
                            <h1 style="color: #ce0014; font-weight: bold;">
                                Usuario verificado con exito
                            </h1>
                        </a>
                    </div>
                </body>
            </html>
        `);
    } catch (error: any) {
        const errorMessage = 'Error al verificar email';
        logger.error(errorMessage, {
            error: error.message,
            stack: error.stack,
            userId
        });
        return res.status(500).json({ message: errorMessage, error });
    }
};

export const forgotPassword = async (req: any, res: any) => {
    const { email } = req.body;
    const forgotPasswordLogMessage = 'Solicitud de recuperación de contraseña';
    logger.info(forgotPasswordLogMessage, { email });

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            const notFoundMessage = 'email_not_found';
            logger.warn('Email no encontrado para recuperación', { email });
            return res.status(404).json({ message: notFoundMessage });
        }

        const resetCode = `${crypto.randomInt(0, 10)}${crypto.randomInt(0, 10)}${crypto.randomInt(0, 10)}${crypto.randomInt(0, 10)}${crypto.randomInt(0, 10)}${crypto.randomInt(0, 10)}`;
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);

        user.resetCode = resetCode;
        user.resetCodeExpiry = expiryDate;
        await user.save();

        const resetCodeGeneratedMessage = 'Código de recuperación generado';
        logger.debug(resetCodeGeneratedMessage, { 
            email,
            resetCode: '******' 
        });

        await sendResetPasswordEmail(email, resetCode);
        const emailSentMessage = 'Email de recuperación enviado';
        logger.info(emailSentMessage, { email });

        res.status(200).json({ message: 'email enviado' });
    } catch (error: any) {
        const errorMessage = 'error_sending_email';
        logger.error('Error en recuperación de contraseña', {
            error: error.message,
            stack: error.stack,
            email
        });
        res.status(500).json({ message: errorMessage });
    }
};

export const resetPassword = async (req: any, res: any) => {
    const { email, code, newPassword } = req.body;
    const resetPasswordLogMessage = 'Intento de restablecimiento de contraseña';
    logger.info(resetPasswordLogMessage, { email });

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            const notFoundMessage = 'email_not_found';
            logger.warn('Usuario no encontrado al restablecer contraseña', { email });
            return res.status(404).json({ message: notFoundMessage });
        }

        if (user.resetCode !== code) {
            const wrongCodeMessage = 'wrong_code';
            logger.warn('Código de restablecimiento incorrecto', { email });
            return res.status(400).json({ message: wrongCodeMessage });
        }

        const currentTime = new Date();
        if (currentTime > user.resetCodeExpiry!) {
            user.resetCode = null;
            user.resetCodeExpiry = null;
            await user.save();
            
            const expiredCodeMessage = 'expired_code';
            logger.warn('Código de restablecimiento expirado', { email });
            return res.status(400).json({ message: expiredCodeMessage });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetCode = null;
        user.resetCodeExpiry = null;
        await user.save();

        const successMessage = 'contraseña actualizada';
        logger.info('Contraseña restablecida exitosamente', { email });
        res.status(200).json({ message: successMessage });
    } catch (error: any) {
        const errorMessage = 'password_updating_error';
        logger.error('Error al restablecer contraseña', {
            error: error.message,
            stack: error.stack,
            email
        });
        res.status(500).json({ message: errorMessage });
    }
};

export const login = async (req: any, res: any) => {
    const { email } = req.body;
    const loginLogMessage = 'Intento de inicio de sesión';
    logger.info(loginLogMessage, { email });

    try {
        await loginSchemaValidator.validate(req.body);

        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'username', 'email', 'email_verified', 'password'],
        });

        if (!user) {
            const invalidCredentialsMessage = 'invalid_credentials';
            logger.warn('Credenciales inválidas - usuario no encontrado', { email });
            return res.status(401).json({ message: invalidCredentialsMessage });
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) {
            logger.warn('Credenciales inválidas - contraseña incorrecta', { email });
            return res.status(401).json({ message: 'invalid_credentials' });
        }

        if (!user.email_verified) {
            const unverifiedEmailMessage = 'Por favor confirme primero su email';
            logger.warn('Intento de login con email no verificado', { email });
            return res.status(401).json({ message: unverifiedEmailMessage });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        const successMessage = 'Acceso exitoso';
        logger.info('Inicio de sesión exitoso', { 
            userId: user.id,
            email: user.email
        });

        return res.status(201).json({ 
            message: successMessage, 
            token, 
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            } 
        });
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const validationMessage = 'Error de validación en login';
            logger.warn(validationMessage, { 
                errors: error.errors,
                email
            });
            return res.status(400).json({ message: validationMessage, errors: error.errors });
        }

        const errorMessage = 'Error interno del servidor';
        logger.error('Error en inicio de sesión', {
            error: error.message,
            stack: error.stack,
            email
        });
        return res.status(500).json({ message: errorMessage });
    }
};

export const getUserById = async (req: any, res: any) => {
    const { id } = req.params;
    const getUserLogMessage = 'Obteniendo usuario por ID';
    logger.info(getUserLogMessage, { userId: id });

    try {
        const user = await User.findByPk(id);
        if (!user) {
            const notFoundMessage = 'Usuario no encontrado';
            logger.warn(notFoundMessage, { userId: id });
            return res.status(404).json({ message: notFoundMessage });
        }

        const successMessage = 'Usuario obtenido exitosamente';
        logger.info(successMessage, { userId: id });
        return res.status(200).json({
            message: successMessage,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            }
        });
    } catch (error: any) {
        const errorMessage = 'Error al obtener usuario';
        logger.error(errorMessage, {
            error: error.message,
            stack: error.stack,
            userId: id
        });
        return res.status(500).json({
            message: errorMessage,
            error: error.message,
        });
    }
};
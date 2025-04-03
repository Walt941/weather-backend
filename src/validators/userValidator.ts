import * as yup from 'yup';

export const userSchemaValidator = yup.object().shape({
    username: yup.string().required('El nombre de usuario es obligatorio'),
    email: yup.string().email('El correo electrónico debe ser válido').required('El correo electrónico es obligatorio'),
    password: yup.string().min(6, 'La contraseña debe tener al menos 6 caracteres').required('La contraseña es obligatoria'),
    status: yup.mixed().oneOf(['habilitado', 'deshabilitado']).optional(),
});
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/',
  apiTimeout: 30000,
  sentryDsn: '', // Vacío en desarrollo — Sentry no se activa
  sentryEnv: 'development',
  geocoder: {
    url: 'https://nominatim.openstreetmap.org/search',
    email: '', // contacto requerido por la política de Nominatim para uso intensivo
  },
};

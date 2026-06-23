export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio-produccion.com/',
  apiTimeout: 30000,
  sentryDsn: '', // Configurar con el DSN real en CI/CD secrets
  sentryEnv: 'production',
  geocoder: {
    url: 'https://nominatim.openstreetmap.org/search',
    email: '', // contacto requerido por la política de Nominatim para uso intensivo
  },
};

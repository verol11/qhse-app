// Configuration des URLs API
const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
};

console.log('Configuration chargée:', config);
export default config;
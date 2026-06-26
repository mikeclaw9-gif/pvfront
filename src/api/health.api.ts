import { api } from 'boot/axios';

export interface HealthCheckResult {
  available: boolean;
  error?: string;
}

export async function checkHealth(): Promise<HealthCheckResult> {
  try {
    const response = await api.get('/health', {
      timeout: 5000,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      return { available: true };
    }

    return {
      available: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AxiosError' || error.message.includes('timeout')) {
        return { available: false, error: 'Timeout: el servidor no responde en 5s' };
      }
      if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
        return { available: false, error: 'Error de red: no se puede conectar al servidor' };
      }
      return { available: false, error: error.message };
    }
    return { available: false, error: 'Error desconocido al verificar salud del servidor' };
  }
}
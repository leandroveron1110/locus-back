// src/common/dtos/response.dto.ts

/**
 * Estructura estándar para todas las respuestas de la API.
 * Tanto para éxito como para errores.
 */
export interface ApiResponse<T = unknown> {
  // 'data' solo se incluye en respuestas exitosas
  data: T | null;

  // 'error' solo se incluye en respuestas de error
  error: {
    statusCode: number;
    message: string | string[];
    errorCode?: string; 
    timestamp: string;
    path: string;
  } | null;

  // Meta información de la respuesta
  success: boolean;
  timestamp: string;
}
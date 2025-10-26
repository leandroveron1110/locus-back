import { Injectable, LoggerService, Logger, Scope } from '@nestjs/common';

/**
 * Servicio centralizado de logs con formato estructurado (JSON).
 * Reutilizable por toda la aplicación.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService implements LoggerService {
  private readonly logger = new Logger(LoggingService.name);
  private context = 'App';
  private serviceName = 'AppService';

  setContext(context: string) {
    this.context = context;
  }

  setService(serviceName: string) {
    this.serviceName = serviceName;
  }


  private buildPayload(
    level: string,
    message: string,
    data?: Record<string, any>,
  ) {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      service: this.serviceName,
      message,
      ...(data || {}),
    };
  }

  /**
   * Muestra el log según el entorno (formato legible o JSON)
   */
  private output(
    level: 'LOG' | 'WARN' | 'ERROR' | 'DEBUG',
    message: string,
    data?: Record<string, any>,
  ) {
    const payload = this.buildPayload(level, message, data);

    // Producción -> formato JSON estructurado
    if (process.env.NODE_ENV === 'production') {
      const json = JSON.stringify(payload);
      switch (level) {
        case 'WARN':
          this.logger.warn(json);
          break;
        case 'ERROR':
          this.logger.error(json);
          break;
        case 'DEBUG':
          this.logger.debug(json);
          break;
        default:
          this.logger.log(json);
      }
    } else {
    //   // Desarrollo -> formato legible + JSON
      console.log(
        `[${payload.context}] ${payload.level}: ${payload.message}`,
        payload,
      );
    }
  }

  log(message: string, data?: Record<string, any>) {
    this.output('LOG', message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    this.output('WARN', message, data);
  }

  error(message: string, data?: Record<string, any>) {
    this.output('ERROR', message, data);
  }

  debug(message: string, data?: Record<string, any>) {
    this.output('DEBUG', message, data);
  }
}

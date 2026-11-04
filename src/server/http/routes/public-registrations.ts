import type { FastifyInstance } from 'fastify';
import type { PublicClassResponse, RegistrationResult } from '../../../shared/dto.js';
import type { Services } from '../../services/index.js';

export interface PublicRoutesOptions {
  services: Services;
}

/**
 * `/api/public/classes/:code` dan `/api/public/classes/:code/registrations` (FR7–FR10, AD-8).
 * Tanpa auth; handler hanya memanggil use-case. Hasil bisnis sah (Daftar tunggu, sudah aktif) adalah 200.
 */
export async function publicRegistrationsRoutes(app: FastifyInstance, options: PublicRoutesOptions): Promise<void> {
  const { services } = options;

  app.get<{ Params: { code: string } }>('/classes/:code', async (request): Promise<PublicClassResponse> => {
    return services.registrations.getPublicClass(request.params.code);
  });

  app.post<{ Params: { code: string } }>('/classes/:code/registrations', async (request): Promise<RegistrationResult> => {
    return services.registrations.register(request.params.code, request.body);
  });
}

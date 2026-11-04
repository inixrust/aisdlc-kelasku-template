import type { FastifyInstance } from 'fastify';
import type { AdminClassResponse, CreatedClassResponse } from '../../../shared/dto.js';
import { AppError } from '../../../shared/errors.js';
import type { Services } from '../../services/index.js';

/** Id kelas di path: bilangan bulat positif desimal; selain itu sama dengan kelas tak dikenal. */
function parseClassId(raw: string): number {
  if (!/^[1-9]\d{0,15}$/.test(raw)) throw new AppError('class_not_found');
  return Number(raw);
}

/** `/api/admin/classes` (FR2, FR5, AD-8). Didaftarkan di dalam plugin auth admin. */
export function adminClassesRoutes(app: FastifyInstance, services: Services): void {
  app.post('/classes', async (request, reply): Promise<CreatedClassResponse> => {
    const created = services.classes.createClass(request.body);
    reply.code(201);
    return created;
  });

  app.get<{ Params: { id: string } }>('/classes/:id', async (request): Promise<AdminClassResponse> => {
    return services.classes.getClass(parseClassId(request.params.id));
  });
}

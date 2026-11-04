/** Klien `/api/admin/classes` (FR2, FR5, AD-8). */
import type { AdminClassResponse, CreateClassRequest, CreatedClassResponse } from '../../shared/dto.js';
import { apiRequest, type ApiRequestOptions } from './client.js';

export function createClass(body: CreateClassRequest): Promise<CreatedClassResponse> {
  return apiRequest<CreatedClassResponse>('POST', '/api/admin/classes', { body });
}

export function getClass(id: string, options: Pick<ApiRequestOptions, 'signal'> = {}): Promise<AdminClassResponse> {
  return apiRequest<AdminClassResponse>('GET', `/api/admin/classes/${encodeURIComponent(id)}`, options);
}

/** Klien `/api/auth/{login,session,logout}` (AD-8, AD-9). */
import type { AdminSessionResponse, LoginRequest, LogoutResponse } from '../../shared/dto.js';
import { apiRequest, type ApiRequestOptions } from './client.js';

/** 401 di sini berarti kredensial salah, bukan sesi habis: tidak dialihkan. */
export function login(body: LoginRequest): Promise<AdminSessionResponse> {
  return apiRequest<AdminSessionResponse>('POST', '/api/auth/login', { body, on401: 'throw' });
}

export function getSession(options: Pick<ApiRequestOptions, 'on401' | 'signal'> = {}): Promise<AdminSessionResponse> {
  return apiRequest<AdminSessionResponse>('GET', '/api/auth/session', options);
}

export function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>('POST', '/api/auth/logout', { body: {} });
}

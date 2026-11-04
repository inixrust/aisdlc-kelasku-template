/**
 * Komposisi use-case tanpa Fastify (B-1). Dipanggil oleh `main.ts`, test, worker konkurensi,
 * dan skrip CLI dengan koneksi masing-masing.
 */
import type { Db } from '../data/db.js';
import type { Clock } from '../clock.js';
import { type AuthService, createAuthService } from './auth.js';
import { type ClassesService, createClassesService } from './classes.js';
import { createRegistrationsService, type RegistrationsService } from './registrations.js';

export interface ServiceDeps {
  db: Db;
  clock: Clock;
}

export interface Services {
  auth: AuthService;
  classes: ClassesService;
  registrations: RegistrationsService;
}

export function createServices(deps: ServiceDeps): Services {
  return {
    auth: createAuthService(deps),
    classes: createClassesService(deps),
    registrations: createRegistrationsService(deps),
  };
}

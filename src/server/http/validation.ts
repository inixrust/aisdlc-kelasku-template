import type { z } from 'zod';
import { AppError } from '../../shared/errors.js';
import { fieldErrorsOf } from '../../shared/schemas.js';

/** Parse input dengan skema zod dari `src/shared/schemas.ts`; gagal → `validation_error` + `fields` (AD-8). */
export function parseWith<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError('validation_error', { fields: fieldErrorsOf(result.error) });
  return result.data;
}

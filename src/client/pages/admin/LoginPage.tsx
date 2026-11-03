import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ERRORS } from '../../../shared/errors.js';
import { fieldErrorsOf, loginRequestSchema } from '../../../shared/schemas.js';
import { login } from '../../api/auth';
import { ApiError, type LoginLocationState, safeNextPath } from '../../api/client';
import { Alert } from '../../components/Alert';
import { ErrorSummary, type FieldErrorItem } from '../../components/ErrorSummary';
import { Field } from '../../components/Field';
import { PageLayout } from '../../components/PageLayout';

const FIELD_IDS = { email: 'login-email', password: 'login-password' } as const;
type FieldName = keyof typeof FIELD_IDS;

function toSummary(fields: Partial<Record<FieldName, string>>): FieldErrorItem[] {
  return (Object.keys(FIELD_IDS) as FieldName[])
    .filter((name) => fields[name] !== undefined)
    .map((name) => ({ fieldId: FIELD_IDS[name], message: fields[name]! }));
}

function pickFields(fields: Record<string, string> | undefined): Partial<Record<FieldName, string>> {
  return { email: fields?.['email'], password: fields?.['password'] };
}

/** Halaman Masuk admin `/admin/masuk` (FR-1, EXPERIENCE.md › Masuk gagal). */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionExpired = (location.state as LoginLocationState | null)?.sessionExpired === true;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [summary, setSummary] = useState<FieldErrorItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [focusPassword, setFocusPassword] = useState(0);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusPassword > 0) passwordRef.current?.focus();
  }, [focusPassword]);

  const showFieldErrors = (fields: Partial<Record<FieldName, string>>) => {
    setFieldErrors(fields);
    setSummary(toSummary(fields));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = loginRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      showFieldErrors(pickFields(fieldErrorsOf(parsed.error)));
      return;
    }
    showFieldErrors({});
    setSubmitting(true);
    try {
      await login(parsed.data);
      await navigate(safeNextPath(searchParams.get('next')), { replace: true });
    } catch (error) {
      setSubmitting(false);
      const apiError = error instanceof ApiError ? error : new ApiError('unexpected_response', { cause: error });
      if (apiError.code === 'invalid_credentials') {
        setFormError(apiError.message);
        setPassword('');
        setFocusPassword((n) => n + 1);
      } else if (apiError.code === 'validation_error' && apiError.fields !== undefined) {
        showFieldErrors(pickFields(apiError.fields));
      } else {
        setFormError(apiError.message);
      }
    }
  };

  return (
    <PageLayout title="Masuk" narrow>
      {sessionExpired && formError === null ? <Alert variant="info">{ERRORS.unauthorized.message}</Alert> : null}
      {formError === null ? null : (
        <Alert variant="danger" role="alert">
          {formError}
        </Alert>
      )}
      <ErrorSummary errors={summary} />
      <form className="form" noValidate onSubmit={handleSubmit}>
        <Field
          id={FIELD_IDS.email}
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <Field
          ref={passwordRef}
          id={FIELD_IDS.password}
          name="password"
          type="password"
          label="Password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <div>
          <button type="submit" className="button button-primary" disabled={submitting}>
            {submitting ? 'Masuk…' : 'Masuk'}
          </button>
        </div>
      </form>
    </PageLayout>
  );
}

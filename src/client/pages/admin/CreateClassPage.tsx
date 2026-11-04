import { type FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { createClassRequestSchema, fieldErrorsOf } from '../../../shared/schemas.js';
import { createClass } from '../../api/classes';
import { ApiError } from '../../api/client';
import { Alert } from '../../components/Alert';
import { ErrorSummary, type FieldErrorItem } from '../../components/ErrorSummary';
import { Field } from '../../components/Field';
import { PageLayout } from '../../components/PageLayout';
import { Icon } from '../../components/icons';
import { CLASS_SAVED_TOAST, type ClassPageLocationState } from './ClassPage';

const IDS = {
  title: 'class-title',
  quota: 'class-quota',
  addDate: 'class-add-date',
  sessionDatesError: 'class-session-dates-error',
} as const;

const DATE_FIELD_PREFIX = 'class-session-date-';
const dateFieldId = (key: number): string => `${DATE_FIELD_PREFIX}${key}`;

interface DateRow {
  /** Kunci stabil baris (bukan indeks), agar React tidak menukar isian saat baris dihapus. */
  key: number;
  value: string;
}

/** Kuota dari input teks/number: kosong → tidak ada (pesan wajib), selain itu angka apa adanya. */
function parseQuota(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value);
}

/** Halaman Buat kelas `/admin/kelas/baru` (FR2, EXPERIENCE.md › Formulir, Pengisi tanggal sesi). */
export function CreateClassPage() {
  const navigate = useNavigate();
  const nextKey = useRef(0);
  const [title, setTitle] = useState('');
  const [quota, setQuota] = useState('');
  const [rows, setRows] = useState<DateRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<FieldErrorItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const addRow = () => {
    const key = nextKey.current++;
    setRows((current) => [...current, { key, value: '' }]);
    // Fokus ke baris baru setelah dirender.
    requestAnimationFrame(() => document.getElementById(dateFieldId(key))?.focus());
  };

  const removeRow = (key: number) => {
    setRows((current) => current.filter((row) => row.key !== key));
    // Error baris berkunci indeks (`sessionDates.<n>`); setelah baris dihapus indeksnya tidak lagi cocok,
    // jadi semua error per baris dan entri ringkasannya dibuang.
    setFields((current) => Object.fromEntries(Object.entries(current).filter(([field]) => !/^sessionDates\.\d+$/.test(field))));
    setSummary((current) => current.filter((item) => !item.fieldId.startsWith(DATE_FIELD_PREFIX)));
    requestAnimationFrame(() => document.getElementById(IDS.addDate)?.focus());
  };

  /** `fields` server/klien → error per kolom + ringkasan berurutan sesuai formulir. */
  const showErrors = (next: Record<string, string>, submittedRows: readonly DateRow[]) => {
    setFields(next);
    const items: FieldErrorItem[] = [];
    if (next['title'] !== undefined) items.push({ fieldId: IDS.title, message: next['title'] });
    if (next['sessionDates'] !== undefined) items.push({ fieldId: IDS.addDate, message: next['sessionDates'] });
    submittedRows.forEach((row, index) => {
      const message = next[`sessionDates.${index}`];
      if (message !== undefined) items.push({ fieldId: dateFieldId(row.key), message });
    });
    if (next['quota'] !== undefined) items.push({ fieldId: IDS.quota, message: next['quota'] });
    setSummary(items);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    const submittedRows = rows;

    const parsed = createClassRequestSchema.safeParse({
      title,
      sessionDates: submittedRows.map((row) => row.value),
      quota: parseQuota(quota),
    });
    if (!parsed.success) {
      showErrors(fieldErrorsOf(parsed.error), submittedRows);
      return;
    }
    showErrors({}, submittedRows);
    setSubmitting(true);
    try {
      const created = await createClass(parsed.data);
      const state: ClassPageLocationState = { toast: CLASS_SAVED_TOAST };
      await navigate(`/admin/kelas/${created.id}`, { state });
    } catch (error) {
      setSubmitting(false);
      const apiError = error instanceof ApiError ? error : new ApiError('unexpected_response', { cause: error });
      if (apiError.code === 'validation_error' && apiError.fields !== undefined) {
        showErrors(apiError.fields, submittedRows);
      } else {
        setFormError(apiError.message);
      }
    }
  };

  const listError = fields['sessionDates'];

  return (
    <PageLayout title="Buat kelas">
      {formError === null ? null : <Alert variant="danger">{formError}</Alert>}
      <ErrorSummary errors={summary} />
      <form className="form" noValidate onSubmit={handleSubmit}>
        <Field
          id={IDS.title}
          name="title"
          label="Judul kelas"
          required
          autoComplete="off"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fields['title']}
        />

        <fieldset className="session-dates" aria-describedby={listError === undefined ? undefined : IDS.sessionDatesError}>
          <legend>Tanggal sesi (wajib)</legend>
          {rows.map((row, index) => (
            <div className="session-date-row" key={row.key}>
              <Field
                id={dateFieldId(row.key)}
                name="sessionDates"
                type="date"
                label={`Tanggal sesi ${index + 1}`}
                required
                value={row.value}
                onChange={(event) => {
                  const { value } = event.target;
                  setRows((current) => current.map((r) => (r.key === row.key ? { ...r, value } : r)));
                }}
                error={fields[`sessionDates.${index}`]}
              />
              <button
                type="button"
                className="button button-secondary"
                aria-label={`Hapus tanggal sesi ${index + 1}`}
                onClick={() => removeRow(row.key)}
              >
                Hapus
              </button>
            </div>
          ))}
          {listError === undefined ? null : (
            <p id={IDS.sessionDatesError} className="field-error">
              <Icon name="danger" />
              <span>{listError}</span>
            </p>
          )}
          <div>
            <button
              id={IDS.addDate}
              type="button"
              className="button button-secondary"
              onClick={addRow}
              aria-describedby={listError === undefined ? undefined : IDS.sessionDatesError}
            >
              Tambah tanggal
            </button>
          </div>
        </fieldset>

        <Field
          id={IDS.quota}
          name="quota"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          label="Kuota"
          required
          value={quota}
          onChange={(event) => setQuota(event.target.value)}
          error={fields['quota']}
        />

        <div className="form-actions">
          <button type="submit" className="button button-primary" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Simpan kelas'}
          </button>
        </div>
      </form>
    </PageLayout>
  );
}

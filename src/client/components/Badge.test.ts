/**
 * ATDD fase merah Story 1.6 — AC-4 (1.6-UNIT-003, P3). Risiko: R-017.
 * Vitest berjalan di environment `node` (tanpa jsdom), jadi `Badge` dirender ke HTML statis
 * dengan `react-dom/server`, tanpa dependensi baru.
 *
 * Fase hijau: diaktifkan oleh Story 1.6. Kontrak: `<Badge variant="waitlisted" />`, varian = kunci Inggris.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CLASS_STATUS_LABELS, REGISTRATION_STATUS_LABELS } from '../../shared/glossary';
import { Badge, type BadgeVariant } from './Badge';

describe('Badge (UX-DR4, DESIGN.md)', () => {
  it('[P3] AC-4 the Daftar tunggu badge uses the warning tone, never danger, with a decorative icon and glossary text', () => {
    const html = renderToStaticMarkup(createElement(Badge, { variant: 'waitlisted' }));

    // Kriteria inti: Daftar tunggu bukan kegagalan, jadi tidak berwarna danger.
    expect(html).not.toMatch(/danger/);

    expect(html).toMatch(/warning/);
    expect(html).toContain(REGISTRATION_STATUS_LABELS.waitlisted);
    expect(html).toMatch(/aria-hidden="true"/);

    // Semua varian: teks Glosarium, ikon dekoratif, tidak interaktif.
    // Label kelayakan (Layak, Belum layak, Tidak mungkin layak) ditambahkan ke glossary.ts oleh story ini.
    const variants: Array<[BadgeVariant, string]> = [
      ['registered', REGISTRATION_STATUS_LABELS.registered],
      ['waitlisted', REGISTRATION_STATUS_LABELS.waitlisted],
      ['cancelled', REGISTRATION_STATUS_LABELS.cancelled],
      ['open', CLASS_STATUS_LABELS.open],
      ['full', CLASS_STATUS_LABELS.full],
      ['finished', CLASS_STATUS_LABELS.finished],
      ['eligible', 'Layak'],
      ['not_eligible', 'Belum layak'],
      ['cannot_be_eligible', 'Tidak mungkin layak'],
    ];
    for (const [variant, label] of variants) {
      const markup = renderToStaticMarkup(createElement(Badge, { variant }));
      expect(markup, variant).toContain(label);
      expect(markup, variant).toMatch(/aria-hidden="true"/);
      expect(markup, variant).not.toMatch(/<(button|a|input)\b|tabindex=/);
    }
  });
});

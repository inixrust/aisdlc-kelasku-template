/** Ikon dekoratif (`aria-hidden`): makna selalu dibawa teks di sebelahnya. Warna dari `currentColor`. */
export type IconName = 'info' | 'success' | 'warning' | 'danger' | 'check' | 'clock' | 'x' | 'lock' | 'flag' | 'minus' | 'circle';

const PATHS: Record<IconName, string> = {
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z',
  success: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.5 14.5-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7Z',
  warning: 'M12 2 1 21h22L12 2Zm1 16h-2v-2h2v2Zm0-4h-2v-4h2v4Z',
  danger: 'M12 2 1 21h22L12 2Zm1 16h-2v-2h2v2Zm0-4h-2v-4h2v4Z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7Z',
  x: 'M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4Z',
  lock: 'M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9V6Zm9 14H6V10h12v10Z',
  flag: 'M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6Z',
  minus: 'M19 13H5v-2h14v2Z',
  circle: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d={PATHS[name]} />
    </svg>
  );
}

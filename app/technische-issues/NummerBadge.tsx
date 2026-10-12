import { tiCode } from '@/lib/technical-issue-code';

/**
 * Het nummer van een technisch issue als badge, zodat het niet in de titel overloopt.
 * Bruikbaar in server- en clientcomponenten (geen hooks).
 */
export default function NummerBadge({
  nummer,
  groot = false,
  gekoppeld = false,
}: {
  nummer: number;
  groot?: boolean;
  /** Oranje: dit nummer staat er omdat het issue gekoppeld is. */
  gekoppeld?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-full border font-mono font-semibold leading-none align-middle ${
        gekoppeld ? 'border-orange-300 bg-orange-100 text-orange-900' : 'border-slate-300 bg-slate-100 text-slate-700'
      } ${
        groot ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-[11px]'
      }`}
    >
      {tiCode(nummer)}
    </span>
  );
}

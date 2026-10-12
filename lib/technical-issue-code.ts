/**
 * Het zichtbare kenmerk van een technisch issue: #<nummer>. Het nummer schuift nooit op.
 * Eerst TI-<nummer>; het voorvoegsel is weggehaald (besluit Frits 2026-10-12). Het hekje
 * blijft, anders leest "21 2.5.3 Op de pagina..." als één reeks cijfers.
 */
export const tiCode = (nummer: number) => `#${nummer}`;

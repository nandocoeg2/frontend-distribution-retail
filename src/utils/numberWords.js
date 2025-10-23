const NUMBERS_IN_WORDS = [
  'nol',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];

export const normalizeNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'string') {
    const sanitized = value
      .replace(/[^0-9,.-]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.');

    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const spellNumber = (value) => {
  const absolute = Math.floor(Math.abs(value));

  if (absolute < 12) {
    return NUMBERS_IN_WORDS[absolute];
  }

  if (absolute < 20) {
    return `${spellNumber(absolute - 10)} belas`;
  }

  if (absolute < 100) {
    const tens = Math.floor(absolute / 10);
    const remainder = absolute % 10;
    const suffix = remainder ? ` ${spellNumber(remainder)}` : '';
    return `${spellNumber(tens)} puluh${suffix}`;
  }

  if (absolute < 200) {
    const remainder = absolute - 100;
    return remainder ? `seratus ${spellNumber(remainder)}` : 'seratus';
  }

  if (absolute < 1000) {
    const hundreds = Math.floor(absolute / 100);
    const remainder = absolute % 100;
    const suffix = remainder ? ` ${spellNumber(remainder)}` : '';
    return `${spellNumber(hundreds)} ratus${suffix}`;
  }

  if (absolute < 2000) {
    const remainder = absolute - 1000;
    return remainder ? `seribu ${spellNumber(remainder)}` : 'seribu';
  }

  if (absolute < 1000000) {
    const thousands = Math.floor(absolute / 1000);
    const remainder = absolute % 1000;
    const suffix = remainder ? ` ${spellNumber(remainder)}` : '';
    return `${spellNumber(thousands)} ribu${suffix}`;
  }

  if (absolute < 1000000000) {
    const millions = Math.floor(absolute / 1000000);
    const remainder = absolute % 1000000;
    const suffix = remainder ? ` ${spellNumber(remainder)}` : '';
    return `${spellNumber(millions)} juta${suffix}`;
  }

  if (absolute < 1000000000000) {
    const billions = Math.floor(absolute / 1000000000);
    const remainder = absolute % 1000000000;
    const suffix = remainder ? ` ${spellNumber(remainder)}` : '';
    return `${spellNumber(billions)} miliar${suffix}`;
  }

  if (absolute < 1000000000000000) {
    const trillions = Math.floor(absolute / 1000000000000);
    const remainder = absolute % 1000000000000;
    const suffix = remainder ? ` ${spellNumber(remainder)}` : '';
    return `${spellNumber(trillions)} triliun${suffix}`;
  }

  return String(absolute);
};

export const formatAmountInWords = (value) => {
  const numeric = normalizeNumber(value);
  if (numeric === null) {
    return '-';
  }

  const rounded = Math.round(Math.abs(numeric));
  if (rounded === 0) {
    return '# NOL RUPIAH #';
  }

  const words = spellNumber(rounded);
  const text = `${numeric < 0 ? 'minus ' : ''}${words} rupiah`;
  return `# ${text.toUpperCase()} #`;
};

export const formatCurrencyCompact = (value) => {
  const numeric = normalizeNumber(value);
  if (numeric === null) {
    return 'Rp -';
  }

  const rounded = Math.round(numeric);
  return `Rp ${rounded.toLocaleString('id-ID')},-`;
};

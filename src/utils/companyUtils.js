export const DEFAULT_COMPANY_NAME = 'PT DOVEN TRADECO';

export const DEFAULT_COMPANY_PROFILE = {
  companyName: 'PT Doven Tradeco',
  brandName: 'DOVEN',
  brandSuffix: 'tradeco',
  addressLines: [
    'Jl. Kapuk Raya No. 62 A',
    'Pergudangan Duta Indah Kapuk 2 Blok. C8',
    'Jakarta Utara, Indonesia',
    'Telp : (021) 2901 8795',
    'Fax  : (021) 5035 0355',
  ],
  city: 'Jakarta',
  bankInfoLines: [
    'Mohon dana ditransfer ke rekening:',
    'A/N. PT. DOVEN TRADECO',
    'BCA  A/C 865-0091877  Cab. PIK',
  ],
  signerName: 'Bun Sing',
};

const sanitizeString = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const pickCompanyField = (sources, keys = []) => {
  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    for (const key of keys) {
      if (!(key in source)) {
        continue;
      }

      const candidate = source[key];
      if (candidate === null || candidate === undefined) {
        continue;
      }

      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          return trimmed;
        }
      } else if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return String(candidate);
      }
    }
  }

  return null;
};

const deriveBrandParts = (companyName) => {
  if (!companyName) {
    return {
      brandName: DEFAULT_COMPANY_PROFILE.brandName,
      brandSuffix: DEFAULT_COMPANY_PROFILE.brandSuffix,
    };
  }

  const withoutPrefix = companyName.replace(/^PT\.?\s*/i, '').trim();
  if (!withoutPrefix) {
    return {
      brandName: DEFAULT_COMPANY_PROFILE.brandName,
      brandSuffix: DEFAULT_COMPANY_PROFILE.brandSuffix,
    };
  }

  const parts = withoutPrefix.split(/\s+/);
  if (parts.length === 1) {
    return {
      brandName: parts[0].toUpperCase(),
      brandSuffix: '',
    };
  }

  return {
    brandName: parts[0].toUpperCase(),
    brandSuffix: parts.slice(1).join(' ').toLowerCase(),
  };
};

const extractCityFromAddress = (address) => {
  if (!address) {
    return null;
  }

  const segments = address.split(',');
  if (segments.length === 0) {
    return null;
  }

  const candidate = segments[segments.length - 1].trim();
  return candidate || null;
};

const splitAddressLines = (address) => {
  if (!address) {
    return [];
  }

  const lines = [];
  address.split(/\r?\n/).forEach((row) => {
    row
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .forEach((segment) => lines.push(segment));
  });
  return lines;
};

const buildAddressLines = (address, sources) => {
  const lines = splitAddressLines(address);

  const phone = pickCompanyField(sources, ['telp', 'telepon', 'phone']);
  const fax = pickCompanyField(sources, ['fax']);

  if (phone) {
    lines.push(`Telp : ${phone}`);
  }

  if (fax) {
    lines.push(`Fax  : ${fax}`);
  }

  return lines.length > 0 ? lines : [...DEFAULT_COMPANY_PROFILE.addressLines];
};

const buildBankInfoLines = (sources, companyName) => {
  const bankAccountName =
    pickCompanyField(sources, [
      'bank_account_name',
      'bankAccountName',
      'account_name',
    ]) || companyName;

  const bankName = pickCompanyField(sources, ['bank', 'bank_name', 'bankName']);
  const accountNumber = pickCompanyField(sources, [
    'no_rekening',
    'bank_account_number',
    'bankAccountNumber',
  ]);

  const branch = pickCompanyField(sources, [
    'bank_cabang',
    'bankCabang',
    'branch',
  ]);

  if (bankName && accountNumber) {
    const lines = ['Mohon dana ditransfer ke rekening:'];

    if (bankAccountName) {
      lines.push(`A/N. ${bankAccountName.toUpperCase()}`);
    }

    const bankLineParts = [`${bankName.toUpperCase()}  A/C ${accountNumber}`];
    if (branch) {
      bankLineParts.push(`Cab. ${branch}`);
    }

    lines.push(bankLineParts.join('  '));

    return lines;
  }

  return [...DEFAULT_COMPANY_PROFILE.bankInfoLines];
};

const COMPANY_NAME_FIELDS = [
  'company_name',
  'companyName',
  'nama_perusahaan',
  'namaPerusahaan',
  'brand_name',
  'brandName',
  'display_name',
  'displayName',
  'legal_name',
  'legalName',
  'business_name',
  'businessName',
  'short_name',
  'shortName',
  'name',
  'company',
];

export const resolveCompanyName = (source) => {
  if (!source) {
    return null;
  }

  if (typeof source === 'string') {
    const trimmed = source.trim();
    return trimmed || null;
  }

  if (typeof source !== 'object') {
    return null;
  }

  for (const field of COMPANY_NAME_FIELDS) {
    if (!(field in source)) {
      continue;
    }

    const value = source[field];

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    } else if (value && typeof value === 'object') {
      const nested = resolveCompanyName(value);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

const getStoredCompany = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem('company');
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    console.error('Error reading company data from localStorage:', error);
    return null;
  }
};

export const getActiveCompanyProfile = (...candidates) => {
  const sources = [];
  const storedCompany = getStoredCompany();
  if (storedCompany) {
    sources.push(storedCompany);
  }

  candidates.forEach((candidate) => {
    if (candidate && typeof candidate === 'object') {
      sources.push(candidate);
    }
  });

  const companyNameCandidate =
    sources.reduce(
      (resolved, source) => resolved || resolveCompanyName(source),
      null,
    ) || DEFAULT_COMPANY_PROFILE.companyName;

  const companyName =
    sanitizeString(companyNameCandidate) || DEFAULT_COMPANY_PROFILE.companyName;

  const { brandName, brandSuffix } = deriveBrandParts(companyName);

  const primaryAddress =
    pickCompanyField(sources, [
      'alamat_pengiriman',
      'alamatPengiriman',
      'alamat',
      'address',
    ]) || null;

  const addressLines = buildAddressLines(primaryAddress, sources);
  const bankInfoLines = buildBankInfoLines(sources, companyName);

  const explicitCity =
    pickCompanyField(sources, ['city', 'kota', 'kota_company', 'companyCity']) ||
    extractCityFromAddress(primaryAddress);

  const signerName =
    pickCompanyField(sources, [
      'direktur_utama',
      'direkturUtama',
      'signerName',
      'penandatangan',
    ]) || DEFAULT_COMPANY_PROFILE.signerName;

  const city = sanitizeString(explicitCity) || DEFAULT_COMPANY_PROFILE.city;

  return {
    companyName,
    brandName,
    brandSuffix,
    addressLines,
    city,
    bankInfoLines,
    signerName,
  };
};

export const getActiveCompanyName = (...candidates) => {
  const profile = getActiveCompanyProfile(...candidates);
  return profile?.companyName || DEFAULT_COMPANY_NAME;
};

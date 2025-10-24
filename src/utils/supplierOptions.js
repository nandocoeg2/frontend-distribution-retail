const resolveValue = (candidate) => {
  if (candidate === null || candidate === undefined) {
    return null;
  }

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (typeof candidate === 'number') {
    return Number.isNaN(candidate) ? null : String(candidate);
  }

  return String(candidate);
};

export const extractSupplierId = (supplier) => {
  if (!supplier || typeof supplier !== 'object') {
    return null;
  }

  const candidates = [
    supplier.id,
    supplier.supplierId,
    supplier.supplier_id,
    supplier.kode_supplier,
    supplier.kodeSupplier,
    supplier.code,
    supplier.supplierCode,
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const value = resolveValue(candidates[index]);
    if (value) {
      return value;
    }
  }

  return null;
};

export const supplierMatchesId = (supplier, targetId) => {
  if (!targetId && targetId !== 0) {
    return false;
  }

  const normalizedTarget = resolveValue(targetId);
  if (!normalizedTarget) {
    return false;
  }

  const supplierId = extractSupplierId(supplier);
  return supplierId === normalizedTarget;
};

export const normalizeSupplierOption = (supplier) => {
  const id = extractSupplierId(supplier);
  if (!id) {
    return null;
  }

  const code =
    resolveValue(supplier?.code) ||
    resolveValue(supplier?.kode_supplier) ||
    resolveValue(supplier?.supplierCode) ||
    '';

  const name =
    resolveValue(supplier?.name) ||
    resolveValue(supplier?.nama_supplier) ||
    resolveValue(supplier?.company_name) ||
    resolveValue(supplier?.companyName) ||
    resolveValue(supplier?.nama) ||
    '';

  const labelParts = [];
  if (code) {
    labelParts.push(code);
  }
  if (name) {
    labelParts.push(name);
  }

  return {
    id,
    label: labelParts.length > 0 ? labelParts.join(' - ') : id,
    code,
    name,
    raw: supplier || null,
  };
};

export const formatSupplierOptions = (suppliers = [], selectedValue = null) => {
  const optionsMap = new Map();

  if (Array.isArray(suppliers)) {
    suppliers.forEach((supplier) => {
      const option = normalizeSupplierOption(supplier);
      if (!option) {
        return;
      }

      const existing = optionsMap.get(option.id);

      if (
        !existing ||
        (!existing.label && option.label) ||
        (option.label && option.label.length > existing.label.length)
      ) {
        optionsMap.set(option.id, option);
      }
    });
  }

  const normalizedSelected = resolveValue(selectedValue);
  if (normalizedSelected && !optionsMap.has(normalizedSelected)) {
    optionsMap.set(normalizedSelected, {
      id: normalizedSelected,
      label: normalizedSelected,
      code: '',
      name: '',
      raw: null,
    });
  }

  return Array.from(optionsMap.values());
};

export const resolveSupplierFromResponse = (response, fallbackId = null) => {
  if (!response || (typeof response === 'object' && response.success === false)) {
    return null;
  }

  const potentialSources = [
    response?.data,
    response?.supplier,
    response?.result,
    response,
  ];

  let supplierCandidate = null;

  for (let index = 0; index < potentialSources.length; index += 1) {
    const source = potentialSources[index];
    if (!source) {
      continue;
    }

    if (Array.isArray(source?.data) && source.data.length > 0) {
      supplierCandidate = source.data[0];
      break;
    }

    if (source?.data && typeof source.data === 'object' && !Array.isArray(source.data)) {
      supplierCandidate = source.data;
      break;
    }

    if (Array.isArray(source) && source.length > 0) {
      supplierCandidate = source[0];
      break;
    }

    if (typeof source === 'object') {
      supplierCandidate = source;
      break;
    }
  }

  if (!supplierCandidate || typeof supplierCandidate !== 'object') {
    return null;
  }

  const supplierId = extractSupplierId(supplierCandidate);

  if (!supplierId && fallbackId) {
    return {
      ...supplierCandidate,
      id: resolveValue(fallbackId),
    };
  }

  return supplierCandidate;
};

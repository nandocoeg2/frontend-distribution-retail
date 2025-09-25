import React from 'react';

const GRID_CLASS_BY_COLUMNS = {
  1: 'grid grid-cols-1 gap-4',
  2: 'grid gap-4 md:grid-cols-2',
  3: 'grid gap-4 md:grid-cols-3'
};

const FormSection = ({ title, description, children, columns = 2 }) => {
  const gridClass = GRID_CLASS_BY_COLUMNS[columns] || GRID_CLASS_BY_COLUMNS[2];

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
      <header className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h3>
        {description ? <p className="mt-1 text-xs text-gray-600">{description}</p> : null}
      </header>
      <div className={gridClass}>{children}</div>
    </section>
  );
};

export default FormSection;

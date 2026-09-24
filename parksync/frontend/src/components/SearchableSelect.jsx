import { useState, useRef } from 'react';

/**
 * A search-as-you-type dropdown. Pass a flat list of options
 * ({ value, label, sublabel }) already fetched from the API - filtering
 * happens client-side, so there's no extra network call per keystroke.
 */
export default function SearchableSelect({ options, value, onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = query.trim() === ''
    ? options.slice(0, 8)
    : options.filter((o) =>
        `${o.label} ${o.sublabel || ''}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

  const handleSelect = (opt) => {
    onSelect(opt.value);
    setQuery('');
    setOpen(false);
  };

  const handleBlur = () => {
    // small delay so a click on an option registers before the list closes
    blurTimeout.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={open ? query : (selected ? selected.label : '')}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(''); setOpen(true); }}
        onBlur={handleBlur}
        placeholder={placeholder || 'Type to search…'}
      />
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
            background: '#FFFFFF', border: '1.5px solid var(--border)', borderRadius: 10,
            marginTop: 4, maxHeight: 220, overflowY: 'auto',
            boxShadow: '0 8px 20px rgba(0,0,0,0.10)',
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>No matches</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt.value}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13.5 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F7F7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{opt.label}</div>
              {opt.sublabel && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.sublabel}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function MonthSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMonthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  
  const [isOpen, setIsOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(parseInt(currentMonthParam.split('-')[0], 10));

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // When dropdown opens, reset display year to currently selected year
  useEffect(() => {
    if (isOpen) {
      setDisplayYear(parseInt(currentMonthParam.split('-')[0], 10));
    }
  }, [isOpen, currentMonthParam]);

  const months = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'];

  const handleSelect = (monthIndex: number) => {
    const monthStr = (monthIndex + 1).toString().padStart(2, '0');
    const newMonth = `${displayYear}-${monthStr}`;
    router.push(`${pathname}?month=${newMonth}`);
    setIsOpen(false);
  };

  const currentYearStr = currentMonthParam.split('-')[0];
  const currentMonthStr = currentMonthParam.split('-')[1];

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={popupRef}>
      <label style={{ fontWeight: 600, marginRight: '1rem' }}>Chọn tháng:</label>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.75rem 1.25rem', 
          borderRadius: '8px', 
          border: '1px solid var(--border-color)', 
          background: 'var(--surface-color)', 
          color: 'var(--text-primary)', 
          fontFamily: 'inherit',
          cursor: 'pointer',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        Tháng {currentMonthStr} năm {currentYearStr}
        <span style={{ fontSize: '0.8rem' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          marginTop: '0.5rem',
          right: 0,
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.25rem',
          width: '280px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <button 
              onClick={() => setDisplayYear(y => y - 1)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', fontWeight: 'bold' }}
            >
              &lt;
            </button>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{displayYear}</strong>
            <button 
              onClick={() => setDisplayYear(y => y + 1)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', fontWeight: 'bold' }}
            >
              &gt;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {months.map((m, idx) => {
              const isSelected = displayYear === parseInt(currentYearStr) && (idx + 1) === parseInt(currentMonthStr);
              return (
                <button
                  key={m}
                  onClick={() => handleSelect(idx)}
                  style={{
                    padding: '0.6rem 0',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'var(--primary-color)' : 'transparent',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.2s',
                    fontSize: '0.9rem'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

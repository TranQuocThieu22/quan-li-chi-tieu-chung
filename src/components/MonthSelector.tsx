'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { vietnamToday } from '@/lib/budget';

const MONTHS = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'];

export default function MonthSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Cùng tháng mặc định với server (giờ Việt Nam), toISOString là giờ UTC
  const todayMonth = vietnamToday().month;
  const currentMonthParam = searchParams.get('month') || todayMonth;

  const [isOpen, setIsOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(parseInt(currentMonthParam.split('-')[0], 10));

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen]);

  const currentYear = parseInt(currentMonthParam.split('-')[0], 10);
  const currentMonth = parseInt(currentMonthParam.split('-')[1], 10);

  const goTo = (year: number, monthIndex: number) => {
    // monthIndex có thể tràn ra ngoài 0..11 khi bấm tháng trước / sau
    const d = new Date(year, monthIndex, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    router.push(`${pathname}?month=${value}`);
    setIsOpen(false);
  };

  return (
    <div className="month-nav" ref={popupRef}>
      <button type="button" className="icon-btn" aria-label="Tháng trước" onClick={() => goTo(currentYear, currentMonth - 2)}>
        <ChevronLeftIcon />
      </button>

      <button
        type="button"
        className="month-trigger"
        aria-expanded={isOpen}
        onClick={() => {
          if (!isOpen) setDisplayYear(currentYear);
          setIsOpen(!isOpen);
        }}
      >
        Tháng {currentMonth}, {currentYear}
        <ChevronDownIcon />
      </button>

      <button type="button" className="icon-btn" aria-label="Tháng sau" onClick={() => goTo(currentYear, currentMonth)}>
        <ChevronRightIcon />
      </button>

      {isOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setIsOpen(false)} />
          <div className="month-popup" role="dialog" aria-label="Chọn tháng">
            <div className="month-popup-head">
              <button type="button" className="icon-btn" aria-label="Năm trước" onClick={() => setDisplayYear(y => y - 1)}>
                <ChevronLeftIcon />
              </button>
              <strong>{displayYear}</strong>
              <button type="button" className="icon-btn" aria-label="Năm sau" onClick={() => setDisplayYear(y => y + 1)}>
                <ChevronRightIcon />
              </button>
            </div>

            <div className="month-grid">
              {MONTHS.map((m, idx) => {
                const value = `${displayYear}-${String(idx + 1).padStart(2, '0')}`;
                return (
                  <button
                    key={m}
                    type="button"
                    className={`month-cell${value === todayMonth ? ' current' : ''}`}
                    aria-pressed={value === currentMonthParam}
                    onClick={() => goTo(displayYear, idx)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

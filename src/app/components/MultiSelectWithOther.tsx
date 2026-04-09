import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectWithOtherProps {
  label: string;
  options: readonly string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxHeight?: string;
}

export default function MultiSelectWithOther({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  maxHeight = '200px',
}: MultiSelectWithOtherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
        setCustomValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const addCustomValue = () => {
    const trimmedValue = customValue.trim();
    if (trimmedValue && !selectedValues.includes(trimmedValue)) {
      onChange([...selectedValues, trimmedValue]);
    }
    setCustomValue('');
    setShowCustomInput(false);
  };

  const removeValue = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <style>{`
        .dropdown-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .dropdown-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb {
          background: rgba(2, 31, 246, 0.3);
          border-radius: 10px;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(2, 31, 246, 0.5);
        }
      `}</style>

      <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
        {label}
      </label>

      {/* Selected Values Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[44px] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 bg-white cursor-pointer transition-all hover:border-[var(--ispora-brand)] focus-within:border-[var(--ispora-brand)] focus-within:shadow-[0_0_0_3px_rgba(2,31,246,0.07)]"
      >
        {selectedValues.length === 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--ispora-text3)]">{placeholder}</span>
            <ChevronDown className={`w-4 h-4 text-[var(--ispora-text3)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 flex-1">
              {selectedValues.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(value);
                  }}
                >
                  {value}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-600" />
                </span>
              ))}
            </div>
            <ChevronDown className={`w-4 h-4 text-[var(--ispora-text3)] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-[10px] shadow-lg overflow-hidden flex flex-col"
          style={{ maxHeight }}
        >
          <div 
            className="overflow-y-auto flex-1 dropdown-scroll"
            style={{ 
              maxHeight: `calc(${maxHeight} - 50px)`,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(2, 31, 246, 0.3) rgba(0, 0, 0, 0.05)'
            }}
          >
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 px-3 py-2 text-[13px] cursor-pointer hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)]"
                />
                <span className="text-[var(--ispora-text2)]">{option}</span>
              </label>
            ))}
          </div>

          {/* Other Option */}
          <div className="border-t border-[var(--ispora-border)] bg-[var(--ispora-bg)] flex-shrink-0">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full px-3 py-2.5 text-left text-[13px] font-semibold text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-colors"
              >
                + Add Other (Custom)
              </button>
            ) : (
              <div className="p-2 flex gap-2">
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomValue();
                    }
                  }}
                  placeholder="Type custom value..."
                  autoFocus
                  className="flex-1 border border-[var(--ispora-border)] rounded px-2 py-1.5 text-[13px] outline-none focus:border-[var(--ispora-brand)]"
                />
                <button
                  onClick={addCustomValue}
                  className="px-3 py-1.5 bg-[var(--ispora-brand)] text-white text-xs font-semibold rounded hover:bg-[var(--ispora-brand-hover)] transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomValue('');
                  }}
                  className="px-2 py-1.5 text-[var(--ispora-text3)] hover:text-[var(--ispora-text)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check, Search, AlertCircle } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableComboboxProps {
  label: string;
  subLabel?: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  textColorClass?: string;
  borderColorFocusClass?: string;
  minDropdownWidth?: string;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  label,
  subLabel,
  icon,
  value,
  onChange,
  options,
  placeholder = 'Chọn hoặc nhập để tìm...',
  textColorClass = 'text-cyan-300',
  borderColorFocusClass = 'focus:border-cyan-500',
  minDropdownWidth = 'min-w-full',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [hasInvalidInput, setHasInvalidInput] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tìm option tương ứng với value hiện tại
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Đồng bộ inputText khi value từ bên ngoài thay đổi (ví dụ bấm Preset hay Clear)
  useEffect(() => {
    if (!isOpen) {
      if (selectedOption) {
        setInputText(selectedOption.label);
      } else {
        setInputText(value || '');
      }
      setHasInvalidInput(false);
    }
  }, [value, selectedOption, isOpen]);

  // Đóng dropdown khi click ra ngoài & Validate không cho nhận giá trị sai
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          handleCommitValidation();
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, inputText, options, value, selectedOption]);

  // Lọc danh sách theo từ khóa người dùng gõ
  const filteredOptions = useMemo(() => {
    if (!inputText.trim()) return options;
    const term = inputText.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.value.toLowerCase().includes(term) ||
        opt.label.toLowerCase().includes(term) ||
        (opt.description && opt.description.toLowerCase().includes(term))
    );
  }, [options, inputText]);

  // Xử lý kiểm tra hợp lệ khi rời ô (Chỉ nhận giá trị đúng có trong danh mục)
  const handleCommitValidation = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      // Nếu rỗng -> Hợp lệ (xóa chọn)
      onChange('');
      setInputText('');
      setHasInvalidInput(false);
      return;
    }

    // Tìm xem text người dùng gõ có khớp chính xác với option nào không
    const exactMatch = options.find(
      (opt) =>
        opt.value.toUpperCase() === trimmed.toUpperCase() ||
        opt.label.toUpperCase() === trimmed.toUpperCase()
    );

    if (exactMatch) {
      // Khớp chính xác -> Nhận giá trị
      onChange(exactMatch.value);
      setInputText(exactMatch.label);
      setHasInvalidInput(false);
    } else {
      // Nhập sai không có trong danh mục -> Từ chối giá trị sai, khôi phục lại giá trị hợp lệ trước đó
      setHasInvalidInput(true);
      setTimeout(() => setHasInvalidInput(false), 2000);

      if (selectedOption) {
        setInputText(selectedOption.label);
      } else {
        setInputText(value || '');
      }
    }
  };

  // Chọn một option từ danh sách
  const handleSelectOption = (opt: ComboboxOption) => {
    onChange(opt.value);
    setInputText(opt.label);
    setHasInvalidInput(false);
    setIsOpen(false);
  };

  // Xóa lựa chọn
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setInputText('');
    setHasInvalidInput(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Xử lý phím Enter / Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        // Nhấn Enter chọn ngay kết quả đầu tiên
        handleSelectOption(filteredOptions[0]);
      } else {
        handleCommitValidation();
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedOption) setInputText(selectedOption.label);
      else setInputText(value || '');
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Tiêu đề & phụ đề */}
      <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1 truncate">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        {subLabel && <span className="text-[10px] text-slate-500 font-normal shrink-0 ml-1">{subLabel}</span>}
      </label>

      {/* Khung Input nhập nhanh & mở dropdown */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value.toUpperCase());
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (inputRef.current) {
              inputRef.current.select();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-[34px] bg-slate-950 border ${
            hasInvalidInput
              ? 'border-rose-500 text-rose-300'
              : `border-slate-700/80 ${borderColorFocusClass} ${textColorClass}`
          } rounded-lg pl-2.5 pr-8 text-xs font-mono placeholder-slate-600 focus:outline-none transition-colors truncate`}
        />

        {/* Nút Clear hoặc Mũi tên */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {hasInvalidInput && (
            <span title="Giá trị không tồn tại trong danh mục!">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            </span>
          )}
          {value || inputText ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear(e);
              }}
              className="p-0.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Xóa ô này"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsOpen(!isOpen);
                if (!isOpen && inputRef.current) inputRef.current.focus();
              }}
              className="p-0.5 text-slate-500 hover:text-slate-300"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-indigo-400' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Cảnh báo khi nhập sai */}
      {hasInvalidInput && (
        <div className="absolute left-0 -bottom-4 text-[10px] text-rose-400 font-sans z-20">
          * Không có trong danh mục (đã hủy)
        </div>
      )}

      {/* POPUP MENU SỔ XUỐNG VỪA KHÍT 100% ĐỘ DÀI CỦA Ô KÉO CHỌN */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 w-full mt-1 z-50 bg-[#0B101D] border border-indigo-500/40 rounded-xl shadow-2xl shadow-black/95 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-72"
        >
          {/* Header nhỏ hiển thị trạng thái tìm kiếm */}
          <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-500" />
              <span>
                Tìm thấy: <strong className="text-cyan-400 font-mono">{filteredOptions.length}</strong>
              </span>
            </span>
            <span className="text-slate-500 text-[9px]">Click chọn hoặc Enter</span>
          </div>

          {/* Danh sách các Options cuộn mượt mà - Dùng onMouseDown e.preventDefault() để không bao giờ bị miss click */}
          <div className="overflow-y-auto overflow-x-hidden flex-1 divide-y divide-slate-800/40 font-mono text-xs p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-sans">
                Không tìm thấy "{inputText}" trong danh mục
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Ngăn input blur sớm gây mất click
                      handleSelectOption(opt);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between gap-2 group ${
                      isSelected
                        ? 'bg-indigo-600/25 border border-indigo-500/50 text-indigo-200 font-bold'
                        : 'hover:bg-slate-800/70 text-slate-300 hover:text-cyan-200'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs truncate ${isSelected ? 'text-cyan-300 font-bold' : 'group-hover:text-cyan-300'}`}
                          title={opt.label}
                        >
                          {opt.label}
                        </span>
                        {opt.value === 'ALL' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-sans">
                            Chung
                          </span>
                        )}
                      </div>
                      {opt.description && opt.description !== opt.label && (
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-sans truncate">
                          {opt.description}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, type MouseEvent } from 'react';
import { ChevronsUpDown, Check, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Label } from '../ui/label';
import { useTheme } from '../../contexts/theme';

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

export interface MultiSelectProps {
  selected?: Array<string | number>;
  onChange: (next: string[]) => void;
  options?: MultiSelectOption[];
  label?: string;
  placeholder?: string;
  emptyText?: string;
  max?: number | null;
  id?: string;
  containerClass?: string;
}

function MultiSelect({
  selected = [],
  onChange,
  options = [],
  label = 'Selecione',
  placeholder = 'Buscar...',
  emptyText = 'Nenhum resultado.',
  max = null,
  id = 'multiselect',
  containerClass = '',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const selectedValues = Array.isArray(selected) ? selected.map(String) : [];
  const selectedOptions = options.filter(opt => selectedValues.includes(String(opt.value)));
  const atLimit = max && selectedValues.length >= max;

  const handleToggle = (value: string | number) => {
    const strValue = String(value);
    if (selectedValues.includes(strValue)) {
      onChange(selectedValues.filter((v) => v !== strValue));
    } else if (!atLimit) {
      onChange([...selectedValues, strValue]);
    }
  };

  const handleRemove = (value: string | number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== String(value)));
  };

  return (
    <div className={`flex flex-col gap-2 ${containerClass}`}>
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}
        >
          {label}
        </Label>
        {max && (
          <span className={`text-xs font-medium ${
            atLimit
              ? 'text-amber-500'
              : isLight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {selectedValues.length}/{max}
          </span>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors
                ${isLight
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-purple-900/40 text-purple-300 border border-purple-700/50'}`}
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => handleRemove(opt.value, e)}
                className={`ml-0.5 rounded-full p-0.5 transition-colors cursor-pointer
                  ${isLight
                    ? 'hover:bg-purple-200 text-purple-500'
                    : 'hover:bg-purple-800 text-purple-400'}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            role="combobox"
            aria-expanded={open}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors
              ${isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800 hover:border-purple-400'
                : 'bg-slate-800/50 border-slate-600 text-white hover:border-purple-500'}
              focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500`}
          >
            <span className="opacity-50">
              {selectedValues.length === 0
                ? placeholder
                : `${selectedValues.length} selecionado${selectedValues.length > 1 ? 's' : ''}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={`w-[--radix-popover-trigger-width] p-0 ${isLight
            ? 'bg-white border-slate-300'
            : 'bg-slate-800 border-slate-600'}`}
        >
          <Command
            className={isLight ? 'bg-white' : 'bg-slate-800'}
            filter={(value, search) => {
              const opt = options.find(o => String(o.value) === value);
              if (!opt) return 0;
              return opt.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput
              placeholder={placeholder}
              className={isLight ? 'text-slate-800' : 'text-white'}
            />
            <CommandList>
              <CommandEmpty className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                {emptyText}
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = selectedValues.includes(String(opt.value));
                  const isDisabled = Boolean(atLimit) && !isSelected;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={String(opt.value)}
                      disabled={isDisabled}
                      onSelect={() => handleToggle(opt.value)}
                      className={`${isLight
                        ? 'text-slate-700 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-700'
                        : 'text-slate-200 data-[selected=true]:bg-purple-900/30 data-[selected=true]:text-purple-300'}
                        ${isDisabled ? 'opacity-40' : ''}`}
                    >
                      <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded border transition-colors
                        ${isSelected
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : isLight
                            ? 'border-slate-300'
                            : 'border-slate-500'}`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      {opt.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {atLimit && (
        <p className={`text-xs ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
          Limite máximo atingido ({max})
        </p>
      )}
    </div>
  );
}

export default MultiSelect;

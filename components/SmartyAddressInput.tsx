import React, { useState, useEffect, useRef } from 'react';
import * as SmartyCore from 'smartystreets-javascript-sdk';
import { MapPin } from 'lucide-react'; // or whatever exists

const authId = 'f38b6f9a-9fb0-e4d0-0993-f9c62a03676c';
const authToken = 'rzJp4AZikSiNfIEKIOMX';

const credentials = new SmartyCore.core.StaticCredentials(authId, authToken);
const client = new SmartyCore.core.ClientBuilder(credentials).buildInternationalAddressAutocompleteClient();

export interface AddressDetails {
  street: string;
  city: string;
  state: string;
  zip: string;
  countryIso3: string;
}

interface SmartyAddressInputProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressSelect: (details: AddressDetails) => void;
  countryIso3?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  name?: string;
}

export const SmartyAddressInput: React.FC<SmartyAddressInputProps> = ({
  label = "Street Address",
  value,
  onChange,
  onAddressSelect,
  countryIso3 = "GBR",
  placeholder = "Start typing your address...",
  error,
  required,
  name = "addressStreet"
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchText: string) => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const lookup = new SmartyCore.internationalAddressAutocomplete.Lookup({
        search: searchText,
        country: countryIso3
      });
      const response = await client.send(lookup);
      if (response.result && response.result.length > 0) {
        setSuggestions(response.result);
        setIsOpen(true);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Smarty Autocomplete error:", err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    const val = e.target.value;
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (val.length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    if (suggestion.entries > 0) {
      // Fetch sub-building or detailed level
      setIsLoading(true);
      try {
        const lookup = new SmartyCore.internationalAddressAutocomplete.Lookup({
          addressId: suggestion.addressId,
          country: countryIso3
        });
        const response = await client.send(lookup);
        if (response.result && response.result.length > 0) {
          // If the response is a list of sub-units (entries still > 0 for some), show them
          const needsFurtherDrillDown = response.result.some((r: any) => r.entries > 0);
          if (needsFurtherDrillDown || response.result.length > 1) {
            setSuggestions(response.result);
            setIsOpen(true);
          } else {
            // Got the final address
            finalizeAddress(response.result[0]);
          }
        }
      } catch (err) {
        console.error("Smarty Drilldown error:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fetch detailed address for this specific building
      setIsLoading(true);
      try {
        const lookup = new SmartyCore.internationalAddressAutocomplete.Lookup({
          addressId: suggestion.addressId,
          country: countryIso3
        });
        const response = await client.send(lookup);
        if (response.result && response.result.length > 0) {
          finalizeAddress(response.result[0]);
        }
      } catch(err) {
        console.error("Smarty detail fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const finalizeAddress = (detail: any) => {
    setIsOpen(false);
    setSuggestions([]);
    
    // Create a mock synthetic event to update the input value in the parent
    const syntheticEvent = {
      target: {
        name,
        value: detail.street || detail.addressText || ''
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);

    onAddressSelect({
      street: detail.street || '',
      city: detail.locality || '',
      state: detail.administrativeAreaShort || detail.administrativeArea || '',
      zip: detail.postalCode || '',
      countryIso3: detail.countryIso3 || countryIso3
    });
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-xs font-bold text-[#0F172A] dark:text-white mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="w-5 h-5 text-[#0F172A]" />
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={`w-full bg-white dark:bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-red-500">{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <li
              key={s.addressId || idx}
              onClick={() => handleSuggestionClick(s)}
              className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-300/50 last:border-0 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-[#0F172A] dark:text-[#1E293B]">
                  {s.addressText || s.street}
                </span>
              </div>
              {s.entries > 1 && (
                <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-900 text-[#0F172A] rounded-lg whitespace-nowrap">
                  {s.entries} units
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { WordData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SearchBarProps {
  onSearch: (word: string) => void;
  onAutocomplete: (prefix: string) => WordData[];
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onAutocomplete, placeholder }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<WordData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      const results = onAutocomplete(query.toLowerCase());
      setSuggestions(results.slice(0, 8));
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [query, onAutocomplete]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (word: string) => {
    setQuery(word);
    setIsOpen(false);
    onSearch(word);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query) {
      onSearch(query);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-24 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          placeholder={placeholder || "Search for a word..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => query && handleSelect(query)}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          >
            <ul className="py-2">
              {suggestions.map((item, index) => (
                <li key={item.word}>
                  <button
                    onClick={() => handleSelect(item.word)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">{item.word}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {item.partOfSpeech}
                      </span>
                    </div>
                    <Search className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;

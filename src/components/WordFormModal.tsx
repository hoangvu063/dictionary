import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Type, MessageSquare, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WordData } from '../types';

interface WordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: WordData) => void;
  initialData?: WordData;
}

const WordFormModal: React.FC<WordFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<WordData>({
    word: '',
    definition: '',
    partOfSpeech: 'noun',
    example: '',
    synonyms: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ word: '', definition: '', partOfSpeech: 'noun', example: '', synonyms: [] });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.word) return;
    onSave({ ...formData, word: formData.word.toLowerCase() });
    setFormData({ word: '', definition: '', partOfSpeech: 'noun', example: '', synonyms: [] });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {initialData ? <Edit2 className="h-5 w-5 text-blue-500" /> : <Plus className="h-5 w-5 text-blue-500" />}
                {initialData ? 'Sửa từ' : 'Thêm từ mới'}
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Type className="h-4 w-4 text-slate-400" />
                  Từ vựng
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Ví dụ: Resilience"
                  value={formData.word}
                  onChange={e => setFormData({ ...formData, word: e.target.value })}
                  disabled={!!initialData}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    Từ loại
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    value={formData.partOfSpeech}
                    onChange={e => setFormData({ ...formData, partOfSpeech: e.target.value })}
                  >
                    <option value="noun">noun</option>
                    <option value="verb">verb</option>
                    <option value="adjective">adjective</option>
                    <option value="adverb">adverb</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  Nghĩa
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="Ý nghĩa của từ này là gì?"
                  value={formData.definition}
                  onChange={e => setFormData({ ...formData, definition: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                {initialData ? 'Lưu thay đổi' : 'Thêm vào từ điển'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WordFormModal;

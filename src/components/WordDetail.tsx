import React from 'react';
import { WordData } from '../types';
import { Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface WordDetailProps {
  wordData: WordData;
  onEdit: (word: WordData) => void;
  onDelete: (word: string) => void;
}

const WordDetail: React.FC<WordDetailProps> = ({ wordData, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{wordData.word}</h1>
            </div>
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg italic">
              {wordData.partOfSpeech}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(wordData)}
              className="p-3 bg-white border border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-500 rounded-xl transition-all"
              title="Sửa nghĩa"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button 
              onClick={() => onDelete(wordData.word)}
              className="p-3 bg-white border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 rounded-xl transition-all"
              title="Xóa từ"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Nghĩa</h3>
            <p className="text-lg text-slate-700 leading-relaxed">
              {wordData.definition || <span className="text-slate-300 italic">Chưa có nghĩa.</span>}
            </p>
          </section>

          {wordData.synonyms && wordData.synonyms.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Từ đồng nghĩa</h3>
              <div className="flex flex-wrap gap-2">
                {wordData.synonyms.map(syn => (
                  <span key={syn} className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm hover:bg-white hover:border-blue-200 hover:text-blue-500 cursor-pointer transition-all">
                    {syn}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WordDetail;

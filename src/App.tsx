/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, Star, History, Layout, Info, Github, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RadixTrie, TrieStep } from './lib/RadixTrie';
import { WordData, LogEntry, TrieNodeData } from './types';
import initialData from './data/dictionary.json';

// Components
import SearchBar from './components/SearchBar';
import WordDetail from './components/WordDetail';
import TrieVisualizer from './components/TrieVisualizer';
import OperationLogs from './components/OperationLogs';
import WordFormModal from './components/WordFormModal';

export default function App() {
  const [trie] = useState(() => new RadixTrie());
  const [treeData, setTreeData] = useState<TrieNodeData | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordData | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'full-trie' | 'full-detail'>('split');
  const [currentSteps, setCurrentSteps] = useState<TrieStep[]>([]);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      console.log(`Loading ${initialData.length} words into Trie...`);
      initialData.forEach(item => {
        trie.insert(item.word.toLowerCase(), item as WordData);
      });
      setTreeData(trie.getTreeData());
      console.log("Trie population complete.");
    }
  }, [trie]);

  const [searchResult, setSearchResult] = useState<'none' | 'found' | 'not-found'>('none');

  const [pendingDeleteWord, setPendingDeleteWord] = useState<string | null>(null);

  const executePendingDelete = useCallback(() => {
    if (pendingDeleteWord) {
      const allWords = trie.autocomplete('');
      const remainingWords = allWords.filter(w => w.word !== pendingDeleteWord);
      
      trie.clear();
      remainingWords.forEach(item => {
        trie.insert(item.word, item);
      });

      setTreeData(trie.getTreeData());
      
      if (selectedWord?.word === pendingDeleteWord) setSelectedWord(null);
      setFavorites(prev => prev.filter(w => w !== pendingDeleteWord));
      setRecent(prev => prev.filter(w => w !== pendingDeleteWord));
      
      setPendingDeleteWord(null);
    }
  }, [pendingDeleteWord, trie, selectedWord]);

  const handleSearch = useCallback((word: string) => {
    executePendingDelete();
    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord) return;

    const result = trie.search(trimmedWord);
    setCurrentSteps(result.steps);

    if (result.found && result.data) {
      setSelectedWord(result.data);
      setSearchResult('found');
      setRecent(prev => [trimmedWord, ...prev.filter(w => w !== trimmedWord)].slice(0, 10));
    } else {
      setSelectedWord(null);
      setSearchResult('not-found');
    }
  }, [trie, executePendingDelete]);

  const handleAutocomplete = useCallback((prefix: string) => {
    return trie.autocomplete(prefix);
  }, [trie]);

  const handleAddWord = (wordData: WordData) => {
    executePendingDelete();
    const searchResult = trie.search(wordData.word.toLowerCase());
    if (searchResult.found) {
      alert("Từ này đã tồn tại");
      return;
    }

    const result = trie.insert(wordData.word, wordData);
    setCurrentSteps(result.steps);
    setTreeData(trie.getTreeData());
    setSelectedWord(wordData);
  };

  const handleEditWord = (wordData: WordData) => {
    executePendingDelete();
    // Delete old word and insert new one to update data
    trie.delete(wordData.word);
    const result = trie.insert(wordData.word, wordData);
    setCurrentSteps(result.steps);
    setTreeData(trie.getTreeData());
    setSelectedWord(wordData);
  };

  const handleDeleteWord = (word: string) => {
    executePendingDelete();
    const searchResult = trie.search(word);
    if (!searchResult.found) return;

    const steps = [...searchResult.steps, { type: 'remove' as const, nodeId: searchResult.steps[searchResult.steps.length - 1].nodeId, message: `Deleting ${word}...` }];
    
    setCurrentSteps(steps);
    setPendingDeleteWord(word);
  };

  const handleAnimationComplete = () => {
    executePendingDelete();
  };

  const toggleFavorite = (word: string) => {
    setFavorites(prev => 
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = 10;
  const allWords = trie.autocomplete('');
  const totalPages = Math.ceil(allWords.length / wordsPerPage);
  const currentWords = allWords.slice((currentPage - 1) * wordsPerPage, currentPage * wordsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Từ điển</h1>
            </div>
          </div>

          <div className="flex-1 max-w-2xl px-12">
            <SearchBar 
              onSearch={handleSearch} 
              onAutocomplete={handleAutocomplete}
              placeholder="Tìm kiếm..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-md"
            >
              <Plus className="h-4 w-4" />
              Thêm từ mới
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 flex gap-6 h-[calc(100vh-100px)]">
        {/* Left Sidebar: Word List */}
        <div className="w-64 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Danh sách từ
            </h2>
            <p className="text-xs text-slate-500 mt-1">Tổng cộng: {allWords.length} từ</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {currentWords.map((item) => (
              <button
                key={item.word}
                onClick={() => handleSearch(item.word)}
                className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-all ${
                  selectedWord?.word === item.word 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {item.word}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Trước
            </button>
            <span className="text-xs font-semibold text-slate-500">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Sau
            </button>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Top: Word Detail */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedWord ? (
                <WordDetail 
                  key={selectedWord.word}
                  wordData={selectedWord}
                  onEdit={(word) => {
                    setEditingWord(word);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={handleDeleteWord}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-slate-400 text-center h-full"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Info className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    {searchResult === 'not-found' ? 'Không tìm thấy từ' : 'Chưa chọn từ nào'}
                  </h3>
                  <p className="text-sm max-w-xs">
                    {searchResult === 'not-found' 
                      ? "Chúng mình không tìm thấy từ này trong từ điển. Bạn có thể thử từ khác hoặc thêm từ mới!" 
                      : "Tra cứu một từ hoặc chọn từ danh sách gợi ý để xem chi tiết và quá trình duyệt cây."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom: Visualization */}
          <div className="flex-[1.5] min-h-0">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Layout className="h-4 w-4 text-blue-500" />
                  Radix Trie
                </h2>
              </div>
              <div className="flex-1 min-h-0">
                {treeData && (
                  <TrieVisualizer 
                    data={treeData} 
                    steps={currentSteps} 
                    onAnimationComplete={handleAnimationComplete}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <WordFormModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingWord(null);
        }} 
        onSave={(word) => {
          if (editingWord) {
            handleEditWord(word);
          } else {
            handleAddWord(word);
          }
        }}
        initialData={editingWord || undefined}
      />
    </div>
  );
}



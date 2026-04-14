export interface WordData {
  word: string;
  definition: string;
  example?: string;
  partOfSpeech?: string;
  synonyms?: string[];
}

export interface TrieNodeData {
  id: string;
  label: string;
  isEndOfWord: boolean;
  children: { [key: string]: TrieNodeData };
  wordData?: WordData;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  operation: 'insert' | 'delete' | 'search' | 'autocomplete';
}

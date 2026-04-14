import { WordData, TrieNodeData } from '../types';

export interface TrieStep {
  type: 'visit' | 'split' | 'add' | 'remove' | 'merge' | 'mark';
  nodeId: string;
  message: string;
  treeSnapshot?: TrieNodeData;
}

class RadixNode {
  id: string;
  label: string;
  children: Map<string, RadixNode>;
  isEndOfWord: boolean;
  wordData?: WordData;

  constructor(label: string = '', isEndOfWord: boolean = false) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.label = label;
    this.children = new Map();
    this.isEndOfWord = isEndOfWord;
  }
}

export class RadixTrie {
  root: RadixNode;

  constructor() {
    this.root = new RadixNode();
  }

  clear() {
    this.root = new RadixNode();
  }

  private pushStep(steps: TrieStep[], type: TrieStep['type'], nodeId: string, message: string) {
    steps.push({ type, nodeId, message, treeSnapshot: this.getTreeData() });
  }

  insert(word: string, data: WordData): { steps: TrieStep[] } {
    const steps: TrieStep[] = [];
    let curr = this.root;
    let i = 0;

    this.pushStep(steps, 'visit', curr.id, 'Starting at root');

    while (i < word.length) {
      let foundChild = false;
      const remaining = word.substring(i);

      for (const [label, child] of curr.children) {
        const commonPrefix = this.getCommonPrefix(remaining, label);

        if (commonPrefix.length > 0) {
          foundChild = true;
          this.pushStep(steps, 'visit', child.id, `Checking branch "${label}"`);
          
          if (commonPrefix === label) {
            this.pushStep(steps, 'visit', child.id, `Full match for "${label}", moving deeper.`);
            curr = child;
            i += label.length;
          } else {
            this.pushStep(steps, 'split', child.id, `Partial match "${commonPrefix}". Splitting node.`);
            
            // Create a new node for the remaining part of the existing label
            const splitNode = new RadixNode(label.substring(commonPrefix.length), child.isEndOfWord);
            splitNode.children = child.children;
            splitNode.wordData = child.wordData;

            // Update the current child to be the common prefix
            child.label = commonPrefix;
            child.children = new Map();
            child.isEndOfWord = false;
            child.wordData = undefined;
            child.children.set(splitNode.label, splitNode);

            // Update parent's reference to the child (using the new label)
            curr.children.delete(label);
            curr.children.set(commonPrefix, child);

            this.pushStep(steps, 'visit', child.id, `Node split complete. New common prefix: "${commonPrefix}".`);

            if (commonPrefix === remaining) {
              child.isEndOfWord = true;
              child.wordData = data;
              this.pushStep(steps, 'mark', child.id, `Word ends at split point "${commonPrefix}".`);
            } else {
              const newNode = new RadixNode(remaining.substring(commonPrefix.length), true);
              newNode.wordData = data;
              child.children.set(newNode.label, newNode);
              this.pushStep(steps, 'add', newNode.id, `Added new branch "${newNode.label}".`);
            }
            return { steps };
          }
          break;
        }
      }

      if (!foundChild) {
        const newNode = new RadixNode(remaining, true);
        newNode.wordData = data;
        curr.children.set(remaining, newNode);
        this.pushStep(steps, 'add', newNode.id, `No prefix match. Added new node "${remaining}".`);
        return { steps };
      }
    }

    if (!curr.isEndOfWord) {
      curr.isEndOfWord = true;
      curr.wordData = data;
      this.pushStep(steps, 'mark', curr.id, `Marked existing node as end of word.`);
    } else {
      this.pushStep(steps, 'visit', curr.id, `Word already exists.`);
    }

    return { steps };
  }

  search(word: string): { found: boolean; data?: WordData; steps: TrieStep[] } {
    const steps: TrieStep[] = [];
    let curr = this.root;
    let i = 0;

    this.pushStep(steps, 'visit', curr.id, 'Starting search at root');

    while (i < word.length) {
      let foundChild = false;
      const remaining = word.substring(i);

      for (const [label, child] of curr.children) {
        const commonPrefix = this.getCommonPrefix(remaining, label);
        
        if (commonPrefix.length > 0) {
          if (commonPrefix === label) {
            this.pushStep(steps, 'visit', child.id, `Matched "${label}"...`);
            curr = child;
            i += label.length;
            foundChild = true;
            break;
          } else {
            // Partial match on edge but doesn't consume the whole label
            // This means the word is not in the trie
            this.pushStep(steps, 'visit', child.id, `Partial match "${commonPrefix}" on "${label}", but not a full edge match.`);
            return { found: false, steps };
          }
        }
      }

      if (!foundChild) {
        this.pushStep(steps, 'visit', curr.id, `No match found for "${remaining}".`);
        return { found: false, steps };
      }
    }

    if (curr.isEndOfWord) {
      this.pushStep(steps, 'mark', curr.id, `Found word!`);
      return { found: true, data: curr.wordData, steps };
    }

    this.pushStep(steps, 'visit', curr.id, `Prefix found, but not a complete word.`);
    return { found: false, steps };
  }

  delete(word: string): { success: boolean; steps: TrieStep[] } {
    const visualSteps: TrieStep[] = [];
    const result = this._delete(this.root, word, visualSteps);
    
    if (result.deleted) {
      this.pushStep(visualSteps, 'mark', this.root.id, `Successfully deleted "${word}"`);
    } else {
      this.pushStep(visualSteps, 'visit', this.root.id, `Word "${word}" not found`);
    }
    
    return { success: result.deleted, steps: visualSteps };
  }

  private _delete(node: RadixNode, word: string, steps: TrieStep[]): { deleted: boolean; shouldRemove: boolean } {
    this.pushStep(steps, 'visit', node.id, word.length === 0 ? 'Reached target node' : `Traversing for "${word}"`);

    if (word.length === 0) {
      if (!node.isEndOfWord) return { deleted: false, shouldRemove: false };
      node.isEndOfWord = false;
      node.wordData = undefined;
      this.pushStep(steps, 'mark', node.id, `Removed word-end status`);
      // If node has no children, it can be removed by parent
      return { deleted: true, shouldRemove: node.children.size === 0 };
    }

    for (const [label, child] of node.children) {
      const commonPrefix = this.getCommonPrefix(word, label);
      if (commonPrefix === label) {
        const result = this._delete(child, word.substring(label.length), steps);
        if (result.deleted) {
          if (result.shouldRemove) {
            node.children.delete(label);
            this.pushStep(steps, 'remove', child.id, `Pruning unused node "${label}"`);
          }

          // After deletion, check if we need to merge
          // Case 1: The child node now has only one child and is not an end-of-word
          if (node.children.has(label)) { // If child wasn't removed
            const updatedChild = node.children.get(label)!;
            if (updatedChild.children.size === 1 && !updatedChild.isEndOfWord) {
              const [onlyLabel, onlyGrandChild] = updatedChild.children.entries().next().value;
              
              // Merge updatedChild with onlyGrandChild
              const newLabel = updatedChild.label + onlyLabel;
              updatedChild.label = newLabel;
              updatedChild.children = onlyGrandChild.children;
              updatedChild.isEndOfWord = onlyGrandChild.isEndOfWord;
              updatedChild.wordData = onlyGrandChild.wordData;
              
              // Update parent's reference
              node.children.delete(label);
              node.children.set(newLabel, updatedChild);
              
              this.pushStep(steps, 'merge', updatedChild.id, `Merging nodes "${label}" + "${onlyLabel}"`);
            }
          }

          // Case 2: The current node now has only one child and is not an end-of-word (handled by parent's recursion)
          // Exception: Root should not be merged
          
          return { deleted: true, shouldRemove: node !== this.root && node.children.size === 0 && !node.isEndOfWord };
        }
      }
    }

    return { deleted: false, shouldRemove: false };
  }

  autocomplete(prefix: string): WordData[] {
    let curr = this.root;
    let i = 0;

    while (i < prefix.length) {
      let foundChild = false;
      const remaining = prefix.substring(i);

      for (const [label, child] of curr.children) {
        const commonPrefix = this.getCommonPrefix(remaining, label);
        
        if (commonPrefix.length > 0) {
          if (commonPrefix === label) {
            // Full edge match, continue deeper
            curr = child;
            i += label.length;
            foundChild = true;
            break;
          } else if (commonPrefix === remaining) {
            // Prefix ends in the middle of this label
            // All words in this subtree are valid suggestions
            const results: WordData[] = [];
            this.collectWords(child, results);
            return results;
          } else {
            // Mismatch
            return [];
          }
        }
      }

      if (!foundChild) return [];
    }

    const results: WordData[] = [];
    this.collectWords(curr, results);
    return results;
  }

  private collectWords(node: RadixNode, results: WordData[]) {
    if (node.isEndOfWord && node.wordData) {
      results.push(node.wordData);
    }
    for (const child of node.children.values()) {
      this.collectWords(child, results);
    }
  }

  getTreeData(): TrieNodeData {
    return this.serializeNode(this.root);
  }

  private serializeNode(node: RadixNode): TrieNodeData {
    const children: { [key: string]: TrieNodeData } = {};
    for (const [label, child] of node.children) {
      children[label] = this.serializeNode(child);
    }
    return {
      id: node.id,
      label: node.label || 'ROOT',
      isEndOfWord: node.isEndOfWord,
      children,
      wordData: node.wordData
    };
  }

  private getCommonPrefix(a: string, b: string): string {
    let common = '';
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] === b[i]) common += a[i];
      else break;
    }
    return common;
  }
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { generateAndSaveWordExpansionAction } from '@/app/word-expansion/actions';

const BATCH_SIZE = 3;

export type WordStatus = 'pending' | 'loading' | 'ready' | 'error';

export interface LookupItem {
  word: string;
  status: WordStatus;
  expansion?: string;
  error?: string;
}

export type LookupState = Record<string, LookupItem>;

export function useWordLookup() {
  const [lookupState, setLookupState] = useState<LookupState>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const addWord = useCallback((word: string) => {
    const cleanedWord = word.toLowerCase().replace(/[.,·;]/g, '');
    if (!cleanedWord) return;

    setLookupState((prev) => {
      // Don't add if it already exists
      if (prev[cleanedWord]) {
        toast({
            title: 'Already in Panel',
            description: `The word "${cleanedWord}" is already in the lookup panel.`,
        });
        return prev;
      }
      return {
        ...prev,
        [cleanedWord]: { word: cleanedWord, status: 'pending' },
      };
    });
  }, [toast]);

  const removeWord = useCallback((word: string) => {
    setLookupState((prev) => {
      const newState = { ...prev };
      delete newState[word];
      return newState;
    });
  }, []);
  
  const clearPanel = useCallback(() => {
    setLookupState({});
  }, []);

  useEffect(() => {
    const processQueue = async () => {
      const pendingWords = Object.values(lookupState).filter(
        (item) => item.status === 'pending'
      );

      if (pendingWords.length === 0 || isProcessing) {
        return;
      }

      setIsProcessing(true);
      const batch = pendingWords.slice(0, BATCH_SIZE).map(item => item.word);

      // Set status to 'loading' for the batch
      setLookupState((prev) => {
        const newState = { ...prev };
        batch.forEach(word => {
          if (newState[word]) {
            newState[word].status = 'loading';
          }
        });
        return newState;
      });

      try {
        const result = await generateAndSaveWordExpansionAction(batch.join(','));
        
        if (result.data) {
          setLookupState(prev => {
            const newState = { ...prev };
            result.data?.forEach(expandedWord => {
                const w = expandedWord.word.toLowerCase();
                if(newState[w]) {
                    newState[w].status = 'ready';
                    newState[w].expansion = expandedWord.expansion;
                }
            });
             toast({
                title: 'Expansion Ready',
                description: `Details for "${result.data.map(d => d.word).join(', ')}" are now available.`,
             });
            return newState;
          });
        }
        
        // Handle words that might have failed in the batch (if generateAndSaveWordExpansionAction supports partial success reporting)
        if(result.error) {
            console.error("Batch expansion error:", result.error);
            // For now, mark the whole batch as error if the top-level error is set
            setLookupState(prev => {
                const newState = { ...prev };
                batch.forEach(word => {
                    if (newState[word]?.status === 'loading') {
                        newState[word].status = 'error';
                        newState[word].error = result.error;
                    }
                });
                return newState;
            });
        }

      } catch (error) {
        console.error('Failed to process word lookup batch:', error);
        setLookupState((prev) => {
          const newState = { ...prev };
          batch.forEach((word) => {
            if (newState[word]) {
              newState[word].status = 'error';
              newState[word].error = 'An unexpected error occurred.';
            }
          });
          return newState;
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // Use a timer to check the queue periodically
    const intervalId = setInterval(processQueue, 2000); 

    return () => clearInterval(intervalId);
  }, [lookupState, isProcessing, toast]);

  const pendingCount = Object.values(lookupState).filter(item => item.status === 'pending' || item.status === 'loading').length;

  return {
    lookupState,
    addWord,
    removeWord,
    clearPanel,
    pendingCount,
  };
}


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

  // Normalize keys consistently so lookups match returned results
  const normalizeKey = (w: string) =>
    w
      .toLowerCase()
      .replace(/[.,·;]/g, '')
      .normalize('NFC')
      .trim();

  const addWord = useCallback((word: string) => {
    const cleanedWord = word.toLowerCase().replace(/[.,·;]/g, '');
    if (!cleanedWord) return;

    // Check current state first and show toast outside of the setState updater
    if (lookupState[cleanedWord]) {
      toast({
        title: 'Already in Panel',
        description: `The word "${cleanedWord}" is already in the lookup panel.`,
      });
      return;
    }

  setLookupState((prev) => ({
      ...prev,
      [cleanedWord]: { word: cleanedWord, status: 'pending' },
    }));
  }, [toast, lookupState]);


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

  // useEffect(() => {
  //   const processQueue = async () => {
  //     const pendingWords = Object.values(lookupState).filter(
  //       (item) => item.status === 'pending'
  //     );

  //     if (pendingWords.length === 0 || isProcessing) {
  //       return;
  //     }

  //     setIsProcessing(true);
  //     const batch = pendingWords.slice(0, BATCH_SIZE).map(item => item.word);

  //     // Set status to 'loading' for the batch
  //     setLookupState((prev) => {
  //       const newState = { ...prev };
  //       batch.forEach(word => {
  //         if (newState[word]) {
  //           newState[word].status = 'loading';
  //         }
  //       });
  //       return newState;
  //     });

  //     try {
  //       const result = await generateAndSaveWordExpansionAction(batch.join(','));
        
  //       if (result.data) {
  //         setLookupState(prev => {
  //           const newState = { ...prev };
  //           result.data?.forEach(expandedWord => {
  //               const w = expandedWord.word.toLowerCase();
  //               if(newState[w]) {
  //                   newState[w].status = 'ready';
  //                   newState[w].expansion = expandedWord.expansion;
  //               }
  //           });
  //           //  toast({
  //           //     title: 'Expansion Ready',
  //           //     description: `Details for "${result.data.map(d => d.word).join(', ')}" are now available.`,
  //           //  });
  //           return newState;
  //         });

  //         toast({
  //           title: 'Expansion Ready',
  //           description: `Details for "${result.data.map(d => d.word).join(', ')}" are now available.`,
  //         });
  //       }
        
  //       // Handle words that might have failed in the batch (if generateAndSaveWordExpansionAction supports partial success reporting)
  //       if(result.error) {
  //           console.error("Batch expansion error:", result.error);
  //           // For now, mark the whole batch as error if the top-level error is set
  //           setLookupState(prev => {
  //               const newState = { ...prev };
  //               batch.forEach(word => {
  //                   if (newState[word]?.status === 'loading') {
  //                       newState[word].status = 'error';
  //                       newState[word].error = result.error;
  //                   }
  //               });
  //               return newState;
  //           });
  //       }

  //     } catch (error) {
  //       console.error('Failed to process word lookup batch:', error);
  //       setLookupState((prev) => {
  //         const newState = { ...prev };
  //         batch.forEach((word) => {
  //           if (newState[word]) {
  //             newState[word].status = 'error';
  //             newState[word].error = 'An unexpected error occurred.';
  //           }
  //         });
  //         return newState;
  //       });
  //     } finally {
  //       setIsProcessing(false);
  //     }
  //   };

  //   // Use a timer to check the queue periodically
  //   const intervalId = setInterval(processQueue, 2000); 

  //   return () => clearInterval(intervalId);
  // }, [lookupState, isProcessing, toast]);
useEffect(() => {
    const processQueue = async () => {
      const pendingWords = Object.values(lookupState).filter(
        (item) => item.status === 'pending'
      );

      if (pendingWords.length === 0 || isProcessing) {
        return;
      }

      setIsProcessing(true);
      // Ensure batch contains normalized keys
      const batch = pendingWords.slice(0, BATCH_SIZE).map(item => normalizeKey(item.word));

      // Set status to 'loading' for the batch
      setLookupState((prev) => {
        const newState = { ...prev };
        batch.forEach(word => {
          if (newState[word]) {
            newState[word] = { ...newState[word], status: 'loading' };
          }
        });
        return newState;
      });

      try {
        // If the action expects an array, pass array; otherwise adjust accordingly.
        const result = await generateAndSaveWordExpansionAction(batch.join(','));

        // If no usable data returned, mark batch as error so spinner does not loop
        if (!result || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
          const errMsg = (result && result.error) ? result.error : 'No expansion data returned.';
          console.warn('Word expansion returned no data for batch:', batch, result);
          setLookupState(prev => {
            const newState = { ...prev };
            batch.forEach(word => {
              if (newState[word]?.status === 'loading') {
                newState[word] = { ...newState[word], status: 'error', error: errMsg };
              }
            });
            return newState;
          });
          // optional toast to surface the failure
          toast({
            title: 'Expansion Failed',
            description: `No expansion results for: ${batch.join(', ')}`,
          });
        } else {
          // Update any words present in the returned data
          setLookupState(prev => {
            const newState = { ...prev };
            result.data?.forEach((expandedWord: any) => {
              const wRaw = expandedWord.word || expandedWord.input || '';
              const w = normalizeKey(String(wRaw));
              if (newState[w]) {
                newState[w] = {
                  ...newState[w],
                  status: 'ready',
                  expansion: expandedWord.expansion ?? expandedWord.result ?? '',
                };
              }
            });
            return newState;
          });

          toast({
            title: 'Expansion Ready',
            description: `Details for "${result.data.map((d: any) => d.word).join(', ')}" are now available.`,
          });
        }

        // Handle words that might have failed at top-level
        if (result?.error) {
          console.error("Batch expansion error:", result.error);
          setLookupState(prev => {
            const newState = { ...prev };
            batch.forEach(word => {
              if (newState[word]?.status === 'loading') {
                newState[word] = { ...newState[word], status: 'error', error: result.error };
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
              newState[word] = { ...newState[word], status: 'error', error: 'An unexpected error occurred.' };
            }
          });
          return newState;
        });
      } finally {
        setIsProcessing(false);
      }
    };

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

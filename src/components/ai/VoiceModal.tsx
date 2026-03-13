// Hello Khata OS - Voice AI Component
// Voice-first experience with waveform animation and live transcription

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSessionStore } from '@/stores/sessionStore';
import { Button } from '@/components/ui/premium';
import { 
  Mic, 
  MicOff, 
  X, 
  Copy, 
  Check, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VoiceResult {
  id: string;
  query: string;
  answer: string;
  answerBn: string;
  data?: {
    headers: string[];
    rows: (string | number)[][];
  };
  actions: Array<{
    id: string;
    label: string;
    labelBn: string;
  }>;
}

export function VoiceModal({ isOpen, onClose }: VoiceModalProps) {
  const { isBangla } = useAppTranslation();
  const businessId = useSessionStore((state) => state.business?.id);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fullTranscriptRef = useRef('');

  // Update ref whenever transcript changes
  useEffect(() => {
    fullTranscriptRef.current = transcript + interimTranscript;
  }, [transcript, interimTranscript]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = isBangla ? 'bn-BD' : 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptText = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcriptText;
            } else {
              interim += transcriptText;
            }
          }

          if (final) {
            setTranscript(prev => prev + final);
          }
          setInterimTranscript(interim);
        };

        recognitionRef.current.onerror = (event) => {
          // "no-speech" and "aborted" are common and not real errors
          if (event.error === 'no-speech' || event.error === 'aborted') {
            console.log('Speech recognition ended:', event.error);
            setIsListening(false);
            return;
          }
          console.error('Speech recognition error:', event.error);
          setError(event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          // Recognition ended - don't auto-restart
        };
      }
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isBangla]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setResult(null);
    fullTranscriptRef.current = '';
    setIsListening(true);
    
    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('not-allowed');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    setIsListening(false);
    
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
    
    // Get the full transcript including interim results
    const finalTranscript = (transcript + ' ' + interimTranscript).trim();
    
    // Process the transcript with real AI API
    if (finalTranscript) {
      setIsProcessing(true);
      
      try {
        console.log('Sending query to AI:', finalTranscript);
        
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-business-id': businessId || '',
          },
          body: JSON.stringify({
            query: finalTranscript,
            language: isBangla ? 'bn' : 'en',
          }),
        });

        const data = await response.json();
        console.log('AI response:', data);

        if (data.success && data.data) {
          const aiResponse = data.data;
          setResult({
            id: Date.now().toString(),
            query: finalTranscript,
            answer: isBangla ? (aiResponse.answerBn || aiResponse.answer) : aiResponse.answer,
            answerBn: aiResponse.answerBn || aiResponse.answer,
            data: aiResponse.tables?.[0] ? {
              headers: aiResponse.tables[0].headers,
              rows: aiResponse.tables[0].rows,
            } : undefined,
            actions: [
              { id: '1', label: 'View Details', labelBn: 'বিস্তারিত দেখুন' },
            ],
          });
        } else {
          // API returned error
          console.error('API error:', data);
          setResult({
            id: Date.now().toString(),
            query: finalTranscript,
            answer: isBangla 
              ? 'দুঃখিত, আমি আপনার প্রশ্ন বুঝতে পারিনি। অনুগ্রহ করে আবার চেষ্টা করুন।'
              : 'Sorry, I could not understand your question. Please try again.',
            answerBn: 'দুঃখিত, আমি আপনার প্রশ্ন বুঝতে পারিনি। অনুগ্রহ করে আবার চেষ্টা করুন।',
            actions: [],
          });
        }
      } catch (error) {
        console.error('Voice AI error:', error);
        setResult({
          id: Date.now().toString(),
          query: finalTranscript,
          answer: isBangla 
            ? 'একটি ত্রুটি হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
            : 'An error occurred. Please try again later.',
          answerBn: 'একটি ত্রুটি হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
          actions: [],
        });
      }
      
      setIsProcessing(false);
    } else {
      // No transcript captured
      setError('no-speech');
    }
  }, [transcript, interimTranscript, isBangla, businessId]);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setTranscript('');
    setInterimTranscript('');
    setResult(null);
    setError(null);
    fullTranscriptRef.current = '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col min-w-[300px] w-fit max-w-lg mx-4 bg-card border border-border-subtle rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Mic className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">
                {isBangla ? 'ভয়েস AI' : 'Voice AI'}
              </span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Waveform Animation */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                {/* Pulsing background rings */}
                {isListening && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/30"
                      animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
                
                {/* Mic button */}
                <motion.button
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    'relative h-20 w-20 rounded-full flex items-center justify-center transition-colors',
                    isListening 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {isListening ? (
                    <MicOff className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </motion.button>
              </div>

              {/* Waveform visualization */}
              {isListening && (
                <div className="flex items-center gap-1 h-8">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      animate={{
                        height: [16, 32, 16],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.05,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Status text */}
              <p className="text-sm text-muted-foreground mt-3">
                {isListening 
                  ? (isBangla ? 'শুনছি... থামতে আবার ক্লিক করুন' : 'Listening... Click again to stop')
                  : isProcessing
                  ? (isBangla ? 'প্রসেসিং...' : 'Processing...')
                  : (isBangla ? 'মাইক্রোফোনে ক্লিক করুন' : 'Click mic to speak')
                }
              </p>
            </div>

            {/* Transcript */}
            {(transcript || interimTranscript) && !result && (
              <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border-subtle">
                <p className="text-sm text-foreground">
                  {transcript}
                  <span className="text-muted-foreground">{interimTranscript}</span>
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-destructive font-medium">
                    {isBangla ? 'ত্রুটি' : 'Error'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error === 'not-allowed' 
                      ? (isBangla ? 'মাইক্রোফোন অনুমতি দিন' : 'Please allow microphone access in your browser settings')
                      : error === 'no-speech'
                      ? (isBangla ? 'কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।' : 'No speech detected. Please try again.')
                      : error === 'network'
                      ? (isBangla ? 'নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ চেক করুন।' : 'Network error. Please check your internet connection.')
                      : (isBangla ? 'একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।' : 'An error occurred. Please try again.')
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Query */}
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {isBangla ? 'আপনার প্রশ্ন' : 'Your Query'}
                  </p>
                  <p className="text-sm font-medium text-foreground">{result.query}</p>
                </div>

                {/* Answer */}
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">
                        AI Response
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                        title={isBangla ? 'কপি করুন' : 'Copy'}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={handleReset}
                        className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                        title={isBangla ? 'নতুন প্রশ্ন করুন' : 'Ask new question'}
                      >
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">
                    {isBangla ? result.answerBn : result.answer}
                  </p>
                </div>

                {/* Data Table */}
                {result.data && (
                  <div className="rounded-xl border border-border-subtle overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          {result.data.headers.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.rows.map((row, i) => (
                          <tr key={i} className="border-t border-border-subtle">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-foreground">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Actions */}
                {result.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.actions.map((action) => (
                      <Button key={action.id} variant="outline" size="sm">
                        {isBangla ? action.labelBn : action.label}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Voice Button Component (for top bar)
export function VoiceButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative h-10 w-10 rounded-xl flex items-center justify-center',
        'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
        'hover:opacity-90 transition-opacity shadow-lg'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Mic className="h-5 w-5" />
      {/* Subtle pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-primary/30"
        animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.button>
  );
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default VoiceModal;

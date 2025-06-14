class SpeechService {
  private synthesis: SpeechSynthesis;
  private recognition: any;
  private isListening: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognitionTimeout: NodeJS.Timeout | null = null;
  private silenceTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.setupSpeechRecognition();
  }

  private setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      // Improved settings for better recognition
      this.recognition.grammars = null;
      this.recognition.serviceURI = '';
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate || 0.85; // Slightly slower for better clarity
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || 0.9;
      
      // Try to use a more natural voice
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Natural'))
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (error) => {
        this.currentUtterance = null;
        reject(error);
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  startListening(onResult: (transcript: string, isFinal: boolean) => void, onError?: (error: any) => void): void {
    if (!this.recognition) {
      onError?.(new Error('Speech recognition not supported'));
      return;
    }

    // Clear any existing timeouts
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    this.isListening = true;
    let lastTranscript = '';
    let finalTranscriptReceived = false;
    
    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          finalTranscriptReceived = true;
        } else {
          interimTranscript += transcript;
        }
      }

      // Clear silence timeout when we receive speech
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }

      if (finalTranscript && finalTranscript.trim() !== lastTranscript.trim()) {
        lastTranscript = finalTranscript.trim();
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript && interimTranscript.trim()) {
        onResult(interimTranscript.trim(), false);
        
        // Set silence timeout for interim results
        this.silenceTimeout = setTimeout(() => {
          if (interimTranscript.trim() && !finalTranscriptReceived) {
            onResult(interimTranscript.trim(), true);
          }
        }, 3000); // 3 seconds of silence
      }
    };

    this.recognition.onspeechstart = () => {
      // Clear timeouts when speech starts
      if (this.recognitionTimeout) {
        clearTimeout(this.recognitionTimeout);
        this.recognitionTimeout = null;
      }
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
    };

    this.recognition.onspeechend = () => {
      // Set a timeout to restart recognition if no final result
      this.recognitionTimeout = setTimeout(() => {
        if (this.isListening && !finalTranscriptReceived) {
          this.restartRecognition(onResult, onError);
        }
      }, 1000);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific errors
      if (event.error === 'no-speech') {
        // Restart recognition for no-speech errors
        setTimeout(() => {
          if (this.isListening) {
            this.restartRecognition(onResult, onError);
          }
        }, 500);
      } else if (event.error === 'audio-capture') {
        this.isListening = false;
        onError?.(new Error('Microphone access denied or not available'));
      } else if (event.error === 'network') {
        // Try to restart on network errors
        setTimeout(() => {
          if (this.isListening) {
            this.restartRecognition(onResult, onError);
          }
        }, 1000);
      } else {
        this.isListening = false;
        onError?.(event.error);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart recognition if still listening
      if (this.isListening) {
        setTimeout(() => {
          this.restartRecognition(onResult, onError);
        }, 100);
      }
    };

    try {
      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      onError?.(error);
    }
  }

  private restartRecognition(onResult: (transcript: string, isFinal: boolean) => void, onError?: (error: any) => void): void {
    if (!this.isListening) return;
    
    try {
      this.recognition.stop();
      setTimeout(() => {
        if (this.isListening) {
          this.recognition.start();
        }
      }, 100);
    } catch (error) {
      console.error('Error restarting recognition:', error);
      // Try to start fresh
      setTimeout(() => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            onError?.(e);
          }
        }
      }, 500);
    }
  }

  stopListening(): void {
    this.isListening = false;
    
    // Clear all timeouts
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  isSupported(): { synthesis: boolean; recognition: boolean } {
    return {
      synthesis: 'speechSynthesis' in window,
      recognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    };
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}
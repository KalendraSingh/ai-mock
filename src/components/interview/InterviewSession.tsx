import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Play, Square,
  MessageCircle, Brain, User,
  FileText, AlertCircle, Clock,
  CheckCircle, Target, BarChart3,
  Sparkles
} from 'lucide-react';
import { speechService } from '../../services/speechService';
import { geminiService } from '../../services/geminiService';
import { storageService } from '../../services/storageService';
import {
  ConversationEntry,
  InterviewSession as InterviewSessionType,
  ResumeData,
  QuestionProgress,
  InterviewQuestion
} from '../../types';

const InterviewSession: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [sessionId] = useState(() => Date.now().toString());
  const [startTime] = useState(() => new Date());
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [pauseTimer, setPauseTimer] = useState<NodeJS.Timeout | null>(null);
  const [pauseCountdown, setPauseCountdown] = useState(0);
  const [questionProgress, setQuestionProgress] = useState<QuestionProgress | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSubmitted = useRef(false);
  const isSubmitting = useRef(false);
  const lastSubmittedText = useRef('');
  const shouldAutoStartListening = useRef(false);
  const guidanceGiven = useRef(false);

  const speechSupport = speechService.isSupported();
  const totalQuestions = 25;

  useEffect(() => {
    const resumeData = storageService.getResumes();
    setResumes(resumeData);
    if (resumeData.length > 0) {
      setSelectedResume(resumeData[resumeData.length - 1]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    return () => {
      if (pauseTimer) clearTimeout(pauseTimer);
    };
  }, [pauseTimer]);

  // Auto-start listening after AI finishes speaking
  useEffect(() => {
    if (!isAISpeaking && shouldAutoStartListening.current && isSessionActive && !isProcessing) {
      shouldAutoStartListening.current = false;
      setTimeout(() => {
        if (!isListening && !isProcessing) {
          startListening();
        }
      }, 500); // Small delay to ensure AI has finished
    }
  }, [isAISpeaking, isSessionActive, isProcessing, isListening]);

  const startInterview = async () => {
    if (!selectedResume) {
      alert('Please select a resume before starting the interview');
      return;
    }

    setIsSessionActive(true);
    setIsGeneratingQuestions(true);

    try {
      // Generate structured questions based on resume
      const questions = await geminiService.generateStructuredQuestions(selectedResume);
      setQuestionProgress(questions);
      
      // Get first question (introduction only)
      const firstQuestion = await geminiService.getNextQuestion(questions, 0);
      setCurrentQuestion(firstQuestion);
      setCurrentQuestionIndex(0);
      setQuestionsAsked(1);

      const resumeContext = `
        Candidate's name: ${selectedResume.personalInfo.name}
        Experience: ${selectedResume.experience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
        Skills: ${selectedResume.skills.join(', ')}
        Education: ${selectedResume.education.map(edu => `${edu.degree} from ${edu.institution}`).join(', ')}
      `;

      const greeting = await geminiService.generatePersonalizedGreeting(resumeContext, firstQuestion?.question || "Tell me about yourself");
      const aiEntry: ConversationEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        speaker: 'ai',
        message: greeting,
        questionId: firstQuestion?.id,
        category: firstQuestion?.category
      };
      setConversation([aiEntry]);

      if (speechSupport.synthesis) {
        setIsAISpeaking(true);
        shouldAutoStartListening.current = true; // Set flag to auto-start listening
        try {
          await speechService.speak(greeting);
        } finally {
          setIsAISpeaking(false);
        }
      } else {
        // If no speech synthesis, start listening immediately
        setTimeout(() => startListening(), 1000);
      }
    } catch (error) {
      console.error('Interview start error:', error);
      const fallback = `Hello ${selectedResume.personalInfo.name}, welcome to your AI interview session. Let's start with an introduction - tell me about yourself and your background.`;
      setConversation([{
        id: Date.now().toString(),
        timestamp: new Date(),
        speaker: 'ai',
        message: fallback
      }]);
      if (speechSupport.synthesis) {
        setIsAISpeaking(true);
        shouldAutoStartListening.current = true;
        try {
          await speechService.speak(fallback);
        } finally {
          setIsAISpeaking(false);
        }
      } else {
        setTimeout(() => startListening(), 1000);
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const startPauseTimer = (currentText: string) => {
    if (pauseTimer) clearTimeout(pauseTimer);
    if (isSubmitting.current) return;
    
    setPauseCountdown(15); // Reduced from 20 to 15 seconds

    const countdown = setInterval(() => {
      setPauseCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(() => {
      clearInterval(countdown);
      if (currentText.trim() && !isSubmitting.current && currentText !== lastSubmittedText.current) {
        handleUserResponse(currentText);
      }
      setPauseTimer(null);
      setPauseCountdown(0);
    }, 15000); // Reduced from 20 to 15 seconds

    setPauseTimer(timer);
  };

  const startListening = () => {
    if (!speechSupport.recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for the best experience.');
      return;
    }

    setIsListening(true);
    setCurrentTranscript('');
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      setPauseTimer(null);
      setPauseCountdown(0);
    }

    speechService.startListening(
      (transcript, isFinal) => {
        if (isSubmitting.current) return;
        
        setCurrentTranscript(transcript);
        if (pauseTimer) {
          clearTimeout(pauseTimer);
          setPauseTimer(null);
          setPauseCountdown(0);
        }

        if (isFinal && transcript.trim() && transcript !== lastSubmittedText.current) {
          handleUserResponse(transcript);
        } else if (!isFinal && transcript.trim()) {
          startPauseTimer(transcript);
        }
      },
      (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
        if (pauseTimer) {
          clearTimeout(pauseTimer);
          setPauseTimer(null);
          setPauseCountdown(0);
        }
        
        // Show user-friendly error message
        if (err.toString().includes('not-allowed') || err.toString().includes('audio-capture')) {
          alert('Microphone access is required for the interview. Please allow microphone access and try again.');
        }
      }
    );
  };

  const stopListening = () => {
    speechService.stopListening();
    setIsListening(false);
    setCurrentTranscript('');
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      setPauseTimer(null);
      setPauseCountdown(0);
    }
  };

  const handleUserResponse = async (transcript: string) => {
    if (!transcript.trim() || 
        isSubmitting.current || 
        !currentQuestion || 
        !selectedResume ||
        transcript === lastSubmittedText.current) {
      return;
    }

    isSubmitting.current = true;
    lastSubmittedText.current = transcript;
    
    stopListening();

    const userEntry: ConversationEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      speaker: 'candidate',
      message: transcript,
      questionId: currentQuestion.id,
      category: currentQuestion.category
    };
    setConversation(prev => [...prev, userEntry]);
    setIsProcessing(true);

    try {
      // Check if candidate is asking a question
      const isQuestion = await geminiService.isUserAskingQuestion(transcript);
      
      if (isQuestion) {
        // Handle candidate's question
        const response = await geminiService.answerCandidateQuestion(transcript, selectedResume);
        const aiEntry: ConversationEntry = {
          id: (Date.now() + 1).toString(),
          timestamp: new Date(),
          speaker: 'ai',
          message: response
        };
        setConversation(prev => [...prev, aiEntry]);

        if (speechSupport.synthesis) {
          setIsAISpeaking(true);
          shouldAutoStartListening.current = true; // Auto-restart listening after response
          try {
            await speechService.speak(response);
          } finally {
            setIsAISpeaking(false);
          }
        } else {
          // If no speech synthesis, restart listening immediately
          setTimeout(() => {
            if (!isListening) startListening();
          }, 500);
        }
      } else {
        // Validate the answer
        const validation = await geminiService.validateAnswer(currentQuestion, transcript, selectedResume);
        
        // Update current question with answer and validation
        const updatedQuestion = {
          ...currentQuestion,
          candidateAnswer: transcript,
          isCorrect: validation.isCorrect,
          score: validation.score,
          feedback: validation.feedback
        };

        // Update question progress
        if (questionProgress) {
          const updatedProgress = { ...questionProgress };
          const category = currentQuestion.category;
          const questionIndex = updatedProgress[category].questions.findIndex(q => q.id === currentQuestion.id);
          if (questionIndex >= 0) {
            updatedProgress[category].questions[questionIndex] = updatedQuestion;
            updatedProgress[category].completed += 1;
          }
          setQuestionProgress(updatedProgress);
        }

        // Provide guidance if answer is incorrect or incomplete, but only once per question
        if ((!validation.isCorrect || validation.score < 70) && !guidanceGiven.current) {
          guidanceGiven.current = true;
          const guidance = await geminiService.provideGuidance(currentQuestion, transcript, selectedResume);
          const guidanceEntry: ConversationEntry = {
            id: (Date.now() + 1).toString(),
            timestamp: new Date(),
            speaker: 'ai',
            message: guidance
          };
          setConversation(prev => [...prev, guidanceEntry]);

          if (speechSupport.synthesis) {
            setIsAISpeaking(true);
            shouldAutoStartListening.current = true; // Auto-restart listening after guidance
            try {
              await speechService.speak(guidance);
            } finally {
              setIsAISpeaking(false);
            }
          } else {
            setTimeout(() => {
              if (!isListening) startListening();
            }, 500);
          }
        } else {
          // Move to next question or end interview
          guidanceGiven.current = false; // Reset for next question
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex < totalQuestions && questionProgress) {
            const nextQuestion = await geminiService.getNextQuestion(questionProgress, nextIndex);
            if (nextQuestion) {
              setCurrentQuestion(nextQuestion);
              setCurrentQuestionIndex(nextIndex);
              setQuestionsAsked(prev => prev + 1);

              const nextQuestionText = await geminiService.generateNextQuestionTransition(nextQuestion, selectedResume);
              const aiEntry: ConversationEntry = {
                id: (Date.now() + 2).toString(),
                timestamp: new Date(),
                speaker: 'ai',
                message: nextQuestionText,
                questionId: nextQuestion.id,
                category: nextQuestion.category
              };

              setConversation(prev => [...prev, aiEntry]);

              if (speechSupport.synthesis) {
                setIsAISpeaking(true);
                shouldAutoStartListening.current = true; // Auto-restart listening after next question
                try {
                  await speechService.speak(nextQuestionText);
                } finally {
                  setIsAISpeaking(false);
                }
              } else {
                setTimeout(() => {
                  if (!isListening) startListening();
                }, 500);
              }
            }
          } else {
            // Interview completed
            const completionMessage = "Thank you for completing the interview! Your responses have been recorded and analyzed. Let me provide you with detailed feedback on your performance.";
            const aiEntry: ConversationEntry = {
              id: (Date.now() + 2).toString(),
              timestamp: new Date(),
              speaker: 'ai',
              message: completionMessage
            };

            setConversation(prev => [...prev, aiEntry]);

            if (speechSupport.synthesis) {
              setIsAISpeaking(true);
              try {
                await speechService.speak(completionMessage);
              } finally {
                setIsAISpeaking(false);
              }
            }

            setTimeout(() => {
              endInterview();
            }, 3000);
          }
        }
      }
    } catch (err) {
      console.error('Response processing error:', err);
      const errorMessage = 'I apologize, but I had trouble processing that. Could you please repeat your response?';
      setConversation(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
        speaker: 'ai',
        message: errorMessage
      }]);

      if (speechSupport.synthesis) {
        setIsAISpeaking(true);
        shouldAutoStartListening.current = true;
        try {
          await speechService.speak(errorMessage);
        } finally {
          setIsAISpeaking(false);
        }
      } else {
        setTimeout(() => {
          if (!isListening) startListening();
        }, 500);
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isSubmitting.current = false;
        lastSubmittedText.current = '';
      }, 1000);
    }
  };

  const endInterview = async () => {
    setIsSessionActive(false);
    stopListening();
    speechService.stopSpeaking();
    shouldAutoStartListening.current = false;
    guidanceGiven.current = false;
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      setPauseTimer(null);
      setPauseCountdown(0);
    }

    if (conversation.length > 0 && selectedResume && questionProgress) {
      const session: InterviewSessionType = {
        id: sessionId,
        date: startTime,
        duration: Math.floor((Date.now() - startTime.getTime()) / 1000 / 60),
        transcript: conversation,
        scores: {
          communication: 0,
          technicalKnowledge: 0,
          problemSolving: 0,
          confidence: 0,
          clarityOfThought: 0,
          overallAccuracy: 0
        },
        feedback: {
          strengths: [],
          improvements: [],
          mistakes: [],
          tips: [],
          resources: [],
          categoryScores: {
            introduction: 0,
            technical: 0,
            experience: 0,
            certification: 0,
            careerGoals: 0,
            softSkills: 0
          },
          correctAnswers: 0,
          totalQuestions: totalQuestions,
          accuracyPercentage: 0
        },
        status: 'completed',
        resumeId: selectedResume.id,
        questionProgress,
        currentQuestionIndex,
        totalQuestions
      };

      try {
        const fullTranscript = conversation.map(c => `${c.speaker}: ${c.message}`).join('\n');
        const evaluation = await geminiService.evaluateInterview(fullTranscript, selectedResume, questionProgress);
        session.scores = evaluation.scores;
        session.feedback = evaluation.feedback;
        storageService.saveInterview(session);
      } catch {
        storageService.saveInterview(session);
      } finally {
        window.location.href = `/feedback?session=${sessionId}`;
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-purple-400 mr-2" />
          <h1 className="text-3xl font-bold gradient-text">AI Interview Session</h1>
          <Sparkles className="w-6 h-6 text-pink-400 ml-2" />
        </div>
        <p className="text-lg text-gray-300">
          Professional interview experience with AI-powered assessment
        </p>
      </div>

      {/* Simple Progress Indicator (No Question Numbers) */}
      {isSessionActive && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Interview Progress</h3>
            </div>
            <div className="text-sm text-gray-400">
              Questions Asked: {questionsAsked}
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${(questionsAsked / totalQuestions) * 100}%` }}
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Interview in progress - Answer naturally and take your time
            </p>
          </div>
        </div>
      )}

      {/* Resume Selection */}
      {!isSessionActive && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Select Resume for Interview</h3>
          </div>
          
          {resumes.length > 0 ? (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  onClick={() => setSelectedResume(resume)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedResume?.id === resume.id
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{resume.fileName}</p>
                      <p className="text-sm text-gray-400">{resume.personalInfo.name}</p>
                      <p className="text-xs text-gray-500">
                        Score: {resume.analysis.overallScore}/100 • 
                        Uploaded {new Date(resume.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedResume?.id === resume.id && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No resumes found</p>
              <a
                href="/resume"
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Upload a resume first
              </a>
            </div>
          )}
        </div>
      )}

      {/* Interview Controls */}
      <div className="card">
        <div className="flex items-center justify-center space-x-4">
          {!isSessionActive ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startInterview}
              disabled={!selectedResume || isGeneratingQuestions}
              className="flex items-center space-x-2 btn-tertiary px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span>{isGeneratingQuestions ? 'Preparing Interview...' : 'Start Interview'}</span>
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isListening ? stopListening : startListening}
                disabled={isAISpeaking || isProcessing || isSubmitting.current}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isListening ? 'Stop Speaking' : 'Start Speaking'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={endInterview}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                <Square className="w-5 h-5" />
                <span>End Interview</span>
              </motion.button>
            </>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isAISpeaking ? 'bg-purple-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">AI Speaking</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">Listening</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">Processing</span>
          </div>
          {pauseCountdown > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm text-orange-400">Auto-submit in {pauseCountdown}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Transcript */}
      {currentTranscript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">You're saying:</span>
            </div>
            {pauseCountdown > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-orange-400 font-medium">
                  Auto-submit in {pauseCountdown}s
                </span>
              </div>
            )}
          </div>
          <p className="text-purple-200">{currentTranscript}</p>
        </motion.div>
      )}

      {/* Selected Resume Info */}
      {selectedResume && isSessionActive && (
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">
              Interview based on: {selectedResume.fileName} ({selectedResume.personalInfo.name})
            </span>
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="card">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Interview Conversation</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {conversation.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${entry.speaker === 'candidate' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[80%] ${
                  entry.speaker === 'candidate' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.speaker === 'ai' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {entry.speaker === 'ai' ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-2xl p-4 ${
                    entry.speaker === 'ai'
                      ? 'bg-white/5 text-gray-200 border border-white/10'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  }`}>
                    <p className="text-sm">{entry.message}</p>
                    <p className={`text-xs mt-2 ${
                      entry.speaker === 'ai' ? 'text-gray-500' : 'text-purple-200'
                    }`}>
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {conversation.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Your interview conversation will appear here</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Browser Support Warning */}
      {(!speechSupport.synthesis || !speechSupport.recognition) && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="text-sm font-medium text-yellow-300">Limited Browser Support</h3>
              <p className="text-sm text-yellow-400 mt-1">
                {!speechSupport.synthesis && 'Text-to-speech is not supported. '}
                {!speechSupport.recognition && 'Speech recognition is not supported. '}
                For the best experience, please use Chrome or Edge.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
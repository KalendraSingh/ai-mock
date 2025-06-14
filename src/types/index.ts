export interface ResumeData {
  id: string;
  fileName: string;
  uploadDate: Date;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  summary: string;
  analysis: ResumeAnalysis;
}

export interface ExperienceItem {
  company: string;
  position: string;
  duration: string;
  description: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  year: string;
  gpa?: string;
}

export interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  overallScore: number;
}

export interface InterviewSession {
  id: string;
  date: Date;
  duration: number;
  transcript: ConversationEntry[];
  scores: SkillScores;
  feedback: InterviewFeedback;
  status: 'completed' | 'in-progress' | 'cancelled';
  resumeId?: string;
  questionProgress: QuestionProgress;
  currentQuestionIndex: number;
  totalQuestions: number;
}

export interface QuestionProgress {
  introduction: { completed: number; total: 2; questions: InterviewQuestion[] };
  technical: { completed: number; total: 15; questions: InterviewQuestion[] };
  experience: { completed: number; total: 2; questions: InterviewQuestion[] };
  certification: { completed: number; total: 1; questions: InterviewQuestion[] };
  careerGoals: { completed: number; total: 1; questions: InterviewQuestion[] };
  softSkills: { completed: number; total: 1; questions: InterviewQuestion[] };
  other: { completed: number; total: 3; questions: InterviewQuestion[] };
}

export interface InterviewQuestion {
  id: string;
  category: 'introduction' | 'technical' | 'experience' | 'certification' | 'careerGoals' | 'softSkills' | 'other';
  question: string;
  expectedAnswer?: string;
  candidateAnswer?: string;
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
}

export interface ConversationEntry {
  id: string;
  timestamp: Date;
  speaker: 'ai' | 'candidate';
  message: string;
  audioUrl?: string;
  questionId?: string;
  category?: string;
}

export interface SkillScores {
  communication: number;
  technicalKnowledge: number;
  problemSolving: number;
  confidence: number;
  clarityOfThought: number;
  overallAccuracy: number;
}

export interface InterviewFeedback {
  strengths: string[];
  improvements: string[];
  mistakes: string[];
  tips: string[];
  resources: ResourceLink[];
  categoryScores: {
    introduction: number;
    technical: number;
    experience: number;
    certification: number;
    careerGoals: number;
    softSkills: number;
  };
  correctAnswers: number;
  totalQuestions: number;
  accuracyPercentage: number;
}

export interface ResourceLink {
  title: string;
  url: string;
  type: 'article' | 'video' | 'course';
}

export interface User {
  id: string;
  name: string;
  email: string;
  joinDate: Date;
  totalInterviews: number;
  averageScore: number;
}
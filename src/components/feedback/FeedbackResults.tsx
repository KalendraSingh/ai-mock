import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  BookOpen, 
  Download,
  Star,
  Target,
  Award,
  Brain,
  Sparkles
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { storageService } from '../../services/storageService';
import { InterviewSession } from '../../types';

const FeedbackResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    if (sessionId) {
      const interviewSession = storageService.getInterview(sessionId);
      setSession(interviewSession);
      
      if (interviewSession) {
        const data = [
          { skill: 'Communication', score: interviewSession.scores.communication },
          { skill: 'Technical', score: interviewSession.scores.technicalKnowledge },
          { skill: 'Problem Solving', score: interviewSession.scores.problemSolving },
          { skill: 'Confidence', score: interviewSession.scores.confidence },
          { skill: 'Clarity', score: interviewSession.scores.clarityOfThought },
          { skill: 'Accuracy', score: interviewSession.scores.overallAccuracy }
        ];
        setRadarData(data);

        if (interviewSession.feedback.categoryScores) {
          const catData = [
            { category: 'Introduction', score: interviewSession.feedback.categoryScores.introduction },
            { category: 'Technical', score: interviewSession.feedback.categoryScores.technical },
            { category: 'Experience', score: interviewSession.feedback.categoryScores.experience },
            { category: 'Certification', score: interviewSession.feedback.categoryScores.certification },
            { category: 'Career Goals', score: interviewSession.feedback.categoryScores.careerGoals },
            { category: 'Soft Skills', score: interviewSession.feedback.categoryScores.softSkills }
          ];
          setCategoryData(catData);
        }
      }
    }
  }, [sessionId]);

  if (!session) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Interview Session Not Found</h2>
        <p className="text-gray-400">The requested interview session could not be found.</p>
      </div>
    );
  }

  const averageScore = Math.round(
    Object.values(session.scores).reduce((sum, score) => sum + score, 0) / Object.keys(session.scores).length
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-purple-400 mr-2" />
          <h1 className="text-3xl font-bold gradient-text">Structured Interview Results</h1>
          <Sparkles className="w-6 h-6 text-pink-400 ml-2" />
        </div>
        <p className="text-lg text-gray-300">
          Detailed analysis of your 25-question interview performance
        </p>
      </div>

      {/* Overall Performance & Accuracy */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-bold mb-4 animate-float">
            {averageScore}%
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Overall Performance</h2>
          <p className="text-gray-400">
            {averageScore >= 80 && "Excellent performance! You demonstrated strong skills across all areas."}
            {averageScore >= 60 && averageScore < 80 && "Good performance with room for improvement in some areas."}
            {averageScore < 60 && "There are several areas where you can improve. Keep practicing!"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-2xl font-bold mb-4 animate-float">
            {session.feedback.accuracyPercentage}%
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Answer Accuracy</h2>
          <p className="text-gray-400">
            {session.feedback.correctAnswers} out of {session.feedback.totalQuestions} questions answered correctly
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Skill Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Skill Assessment</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(session.scores).map(([skill, score]) => {
              const skillNames = {
                communication: 'Communication',
                technicalKnowledge: 'Technical Knowledge',
                problemSolving: 'Problem Solving',
                confidence: 'Confidence',
                clarityOfThought: 'Clarity of Thought',
                overallAccuracy: 'Overall Accuracy'
              };
              
              return (
                <div key={skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      {skillNames[skill as keyof typeof skillNames]}
                    </span>
                    <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Target className="w-5 h-5 text-pink-400" />
            <h3 className="text-xl font-semibold text-white">Performance Radar</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Category Performance */}
      {categoryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Brain className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Category Performance</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="score" fill="url(#gradient)" />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Interview Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Award className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Interview Statistics</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-white">{session.totalQuestions}</div>
            <div className="text-sm text-gray-400">Total Questions</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{session.feedback.correctAnswers}</div>
            <div className="text-sm text-gray-400">Correct Answers</div>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{session.duration}m</div>
            <div className="text-sm text-gray-400">Duration</div>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400">{session.feedback.accuracyPercentage}%</div>
            <div className="text-sm text-gray-400">Accuracy Rate</div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Feedback */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Strengths</h3>
          </div>
          <div className="space-y-3">
            {session.feedback.strengths.map((strength, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{strength}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Areas for Improvement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Areas for Improvement</h3>
          </div>
          <div className="space-y-3">
            {session.feedback.improvements.map((improvement, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{improvement}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mistakes Made */}
        {session.feedback.mistakes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card"
          >
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Common Mistakes</h3>
            </div>
            <div className="space-y-3">
              {session.feedback.mistakes.map((mistake, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{mistake}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tips & Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Tips & Recommendations</h3>
          </div>
          <div className="space-y-3">
            {session.feedback.tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex justify-center space-x-4"
      >
        <button
          onClick={() => window.location.href = '/interview'}
          className="btn-tertiary px-8 py-3 font-semibold hover:shadow-lg transition-all"
        >
          Take Another Interview
        </button>
        <button
          onClick={() => window.print()}
          className="btn-secondary px-8 py-3 font-semibold hover:bg-white/10 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Results</span>
        </button>
      </motion.div>
    </div>
  );
};

export default FeedbackResults;
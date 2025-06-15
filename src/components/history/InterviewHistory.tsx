import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  TrendingUp, 
  Eye, 
  Calendar,
  BarChart3,
  Trash2,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { InterviewSession } from '../../types';

const InterviewHistory: React.FC = () => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    recentTrend: [] as number[]
  });

  useEffect(() => {
    const interviewSessions = storageService.getInterviews();
    const interviewStats = storageService.getInterviewStats();
    
    setSessions(interviewSessions.reverse()); // Most recent first
    setStats(interviewStats);
  }, []);

  const deleteSession = (id: string) => {
    if (window.confirm('Are you sure you want to delete this interview session?')) {
      storageService.deleteInterview(id);
      setSessions(sessions.filter(s => s.id !== id));
      setStats(storageService.getInterviewStats());
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-purple-400 mr-2" />
          <h1 className="text-3xl font-bold gradient-text">Interview History</h1>
          <Sparkles className="w-6 h-6 text-pink-400 ml-2" />
        </div>
        <p className="text-lg text-gray-300">
          Track your progress and review past interview sessions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <MessageCircle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalInterviews}</p>
          <p className="text-sm text-gray-400">Total Interviews</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center"
        >
          <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.averageScore}%</p>
          <p className="text-sm text-gray-400">Average Score</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center"
        >
          <BarChart3 className="w-8 h-8 text-pink-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.bestScore}%</p>
          <p className="text-sm text-gray-400">Best Score</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center"
        >
          <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {sessions.length > 0 ? Math.ceil((Date.now() - new Date(sessions[0].date).getTime()) / (1000 * 60 * 60 * 24)) : 0}
          </p>
          <p className="text-sm text-gray-400">Days Since Last</p>
        </motion.div>
      </div>

      {/* Interview Sessions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Your Interview Sessions</h2>
        </div>

        {sessions.length > 0 ? (
          <div className="divide-y divide-white/10">
            {sessions.map((session, index) => {
              const averageScore = Math.round(
                Object.values(session.scores).reduce((sum, score) => sum + score, 0) / 5
              );
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                        {averageScore}%
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Interview Session #{sessions.length - index}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(session.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(session.duration)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{session.transcript.length} messages</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Skill Scores Preview */}
                      <div className="hidden md:flex items-center space-x-2">
                        {Object.entries(session.scores).map(([skill, score]) => (
                          <div
                            key={skill}
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(score)}`}
                            title={skill}
                          >
                            {score}%
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/feedback?session=${session.id}`}
                          className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                          title="View Feedback"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Interview History</h3>
            <p className="text-gray-400 mb-6">
              You haven't completed any interviews yet. Start your first interview to see your progress here.
            </p>
            <Link
              to="/interview"
              className="btn-tertiary px-8 py-3 font-semibold hover:shadow-lg transition-all"
            >
              Start Your First Interview
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InterviewHistory;
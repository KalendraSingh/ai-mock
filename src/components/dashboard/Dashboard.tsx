import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Mic, 
  BarChart3, 
  TrendingUp, 
  Award, 
  Clock,
  ArrowRight,
  Upload,
  Sparkles
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { ResumeData, InterviewSession } from '../../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    recentTrend: [] as number[]
  });
  const [recentInterviews, setRecentInterviews] = useState<InterviewSession[]>([]);
  const [resumes, setResumes] = useState<ResumeData[]>([]);

  useEffect(() => {
    const interviewStats = storageService.getInterviewStats();
    const interviews = storageService.getInterviews();
    const resumeData = storageService.getResumes();
    
    setStats(interviewStats);
    setRecentInterviews(interviews.slice(-3).reverse());
    setResumes(resumeData);
  }, []);

  const quickActions = [
    {
      title: 'Upload Resume',
      description: 'Get AI-powered analysis and improvements',
      icon: Upload,
      color: 'from-green-500 to-emerald-500',
      path: '/resume'
    },
    {
      title: 'Start Interview',
      description: 'Begin your AI-powered interview session',
      icon: Mic,
      color: 'from-purple-500 to-pink-500',
      path: '/interview'
    },
    {
      title: 'View Analytics',
      description: 'Track your progress and performance',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-500',
      path: '/feedback'
    }
  ];

  const statCards = [
    {
      title: 'Total Interviews',
      value: stats.totalInterviews,
      icon: Mic,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Best Performance',
      value: `${stats.bestScore}%`,
      icon: Award,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Resumes Uploaded',
      value: resumes.length,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-purple-400 mr-2 animate-pulse" />
          <h1 className="text-4xl font-bold gradient-text">
            Welcome to AI Interview Pro
          </h1>
          <Sparkles className="w-8 h-8 text-pink-400 ml-2 animate-pulse" />
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Master your interviews with AI-powered practice sessions, personalized feedback, 
          and professional resume enhancement.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-6"
      >
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className="group block"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card hover-effect group-hover:border-purple-500/30"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 animate-float`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                {action.title}
              </h3>
              <p className="text-gray-400 mb-4">{action.description}</p>
              <div className="flex items-center text-purple-400 font-medium group-hover:translate-x-1 transition-transform">
                Get started <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Recent Interviews */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Interviews</h2>
            <Link 
              to="/history" 
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          
          {recentInterviews.length > 0 ? (
            <div className="space-y-4">
              {recentInterviews.map((interview) => {
                const avgScore = Math.round(
                  Object.values(interview.scores).reduce((sum, score) => sum + score, 0) / 5
                );
                return (
                  <div key={interview.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          Interview Session
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(interview.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-400">{avgScore}%</p>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mic className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No interviews yet</p>
              <Link 
                to="/interview" 
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Start your first interview
              </Link>
            </div>
          )}
        </div>

        {/* Resume Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Resumes</h2>
            <Link 
              to="/resume" 
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              Manage
            </Link>
          </div>
          
          {resumes.length > 0 ? (
            <div className="space-y-4">
              {resumes.slice(0, 3).map((resume) => (
                <div key={resume.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {resume.fileName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Score: {resume.analysis.overallScore}/100
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-3 h-3 rounded-full ${
                      resume.analysis.overallScore >= 80 
                        ? 'bg-green-500' 
                        : resume.analysis.overallScore >= 60 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No resumes uploaded</p>
              <Link 
                to="/resume" 
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Upload your first resume
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
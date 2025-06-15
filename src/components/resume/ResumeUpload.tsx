import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { storageService } from '../../services/storageService';
import { ResumeData } from '../../types';

const ResumeUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load resumes on component mount
  useEffect(() => {
    const loadedResumes = storageService.getResumes();
    setResumes(loadedResumes);
    if (loadedResumes.length > 0 && !selectedResume) {
      setSelectedResume(loadedResumes[loadedResumes.length - 1]);
    }
  }, []);

  const simulateProgress = (callback: () => void) => {
    setUploadProgress(0);
    setUploadStatus('Reading file...');
    
    // Simulate file reading progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 30) {
          clearInterval(progressInterval);
          setUploadStatus('Analyzing with AI...');
          
          // Simulate AI analysis progress
          const analysisInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(analysisInterval);
                setUploadStatus('Finalizing results...');
                setTimeout(() => {
                  setUploadProgress(100);
                  setTimeout(callback, 500);
                }, 1000);
                return 90;
              }
              return prev + Math.random() * 10;
            });
          }, 300);
          
          return 30;
        }
        return prev + Math.random() * 5;
      });
    }, 200);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Prevent multiple uploads
    if (isUploading || isProcessing) {
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);
    setUploadError(null);

    try {
      // Check if file with same name already exists
      const existingResumes = storageService.getResumes();
      const existingFile = existingResumes.find(resume => 
        resume.fileName === file.name
      );

      if (existingFile) {
        setUploadError(`A resume with the name "${file.name}" already exists. Please rename the file or delete the existing one.`);
        setIsUploading(false);
        setIsProcessing(false);
        setUploadProgress(0);
        setUploadStatus('');
        return;
      }

      simulateProgress(async () => {
        try {
          // Simulate PDF text extraction (in real app, use pdf-parse or similar)
          const reader = new FileReader();
          reader.onload = async (e) => {
            const text = e.target?.result as string;
            
            try {
              // Use Gemini to analyze the resume
              const analysisResult = await geminiService.analyzeResume(text || 'Sample resume text for analysis');
              
              const resumeData: ResumeData = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
                fileName: file.name,
                uploadDate: new Date(),
                ...analysisResult
              };

              // Save the resume
              storageService.saveResume(resumeData);
              
              // Update state with fresh data from storage to ensure consistency
              const updatedResumes = storageService.getResumes();
              setResumes(updatedResumes);
              
              // Set the newly uploaded resume as selected
              const newResume = updatedResumes.find(r => r.id === resumeData.id);
              if (newResume) {
                setSelectedResume(newResume);
              }
              
              // Reset progress states
              setTimeout(() => {
                setIsUploading(false);
                setIsProcessing(false);
                setUploadProgress(0);
                setUploadStatus('');
              }, 1000);
            } catch (error) {
              console.error('Analysis error:', error);
              setUploadError('Failed to analyze resume. Please try again.');
              setIsUploading(false);
              setIsProcessing(false);
              setUploadProgress(0);
              setUploadStatus('');
            }
          };
          
          reader.onerror = () => {
            setUploadError('Failed to read file. Please try again.');
            setIsUploading(false);
            setIsProcessing(false);
            setUploadProgress(0);
            setUploadStatus('');
          };
          
          reader.readAsText(file);
        } catch (error) {
          setUploadError('Failed to process file. Please try again.');
          setIsUploading(false);
          setIsProcessing(false);
          setUploadProgress(0);
          setUploadStatus('');
        }
      });
    } catch (error) {
      setUploadError('Failed to process file. Please try again.');
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  }, [isUploading, isProcessing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isUploading || isProcessing
  });

  const deleteResume = (id: string) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      storageService.deleteResume(id);
      const updatedResumes = storageService.getResumes();
      setResumes(updatedResumes);
      if (selectedResume?.id === id) {
        setSelectedResume(updatedResumes.length > 0 ? updatedResumes[0] : null);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Resume Analysis</h1>
        <p className="text-lg text-gray-600">
          Upload your resume for AI-powered analysis and improvement suggestions
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <motion.div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : isUploading || isProcessing
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            whileHover={!isUploading && !isProcessing ? { scale: 1.02 } : {}}
            whileTap={!isUploading && !isProcessing ? { scale: 0.98 } : {}}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-blue-600 font-medium">{uploadStatus}</p>
                    <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
                  </div>
                </div>
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              )}
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isUploading ? 'Processing Resume...' : 'Upload Your Resume'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isUploading ? 'Please wait while we analyze your resume' : 'Drop your resume here or click to browse'}
                </p>
                {!isUploading && (
                  <p className="text-xs text-gray-500 mt-2">
                    Supports PDF, DOC, DOCX, TXT
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{uploadError}</span>
            </motion.div>
          )}

          {/* Resume List */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Resumes ({resumes.length})</h3>
            <div className="space-y-3">
              {resumes.length > 0 ? (
                resumes.map((resume) => (
                  <motion.div
                    key={resume.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedResume?.id === resume.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedResume(resume)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {resume.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Score: {resume.analysis.overallScore}/100 • {new Date(resume.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteResume(resume.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No resumes uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedResume ? (
              <motion.div
                key={selectedResume.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Overall Score */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Overall Score</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${
                        selectedResume.analysis.overallScore >= 80 
                          ? 'bg-green-500' 
                          : selectedResume.analysis.overallScore >= 60 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`} />
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedResume.analysis.overallScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        selectedResume.analysis.overallScore >= 80 
                          ? 'bg-green-500' 
                          : selectedResume.analysis.overallScore >= 60 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedResume.analysis.overallScore}%` }}
                    />
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedResume.analysis.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-700">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedResume.analysis.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-700">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <Eye className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Suggestions</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedResume.analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-700">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Resume Selected
                </h3>
                <p className="text-gray-600">
                  Upload a resume or select one from your list to see detailed analysis
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
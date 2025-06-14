import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './components/dashboard/Dashboard';
import ResumeUpload from './components/resume/ResumeUpload';
import InterviewSession from './components/interview/InterviewSession';
import FeedbackResults from './components/feedback/FeedbackResults';
import InterviewHistory from './components/history/InterviewHistory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="resume" element={<ResumeUpload />} />
          <Route path="interview" element={<InterviewSession />} />
          <Route path="feedback" element={<FeedbackResults />} />
          <Route path="history" element={<InterviewHistory />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
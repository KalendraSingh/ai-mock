import axios from 'axios';
import { ResumeData, InterviewSession, SkillScores, InterviewFeedback, InterviewQuestion, QuestionProgress } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

class GeminiService {
  private async makeRequest(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async analyzeResume(resumeText: string): Promise<any> {
    const prompt = `
      Analyze this specific resume text carefully and extract accurate information. Return a JSON object with the following structure:
      {
        "personalInfo": {
          "name": "extracted name from resume",
          "email": "extracted email from resume",
          "phone": "extracted phone from resume",
          "location": "extracted location from resume"
        },
        "experience": [
          {
            "company": "actual company name from resume",
            "position": "actual job title from resume",
            "duration": "actual time period from resume",
            "description": ["actual responsibilities from resume"]
          }
        ],
        "education": [
          {
            "institution": "actual school name from resume",
            "degree": "actual degree from resume",
            "year": "actual graduation year from resume",
            "gpa": "gpa if mentioned in resume"
          }
        ],
        "skills": ["actual skills listed in resume"],
        "summary": "actual professional summary from resume or create one based on experience",
        "analysis": {
          "strengths": ["specific strengths based on this resume content"],
          "weaknesses": ["specific areas for improvement based on this resume"],
          "suggestions": ["specific suggestions for improving this particular resume"],
          "overallScore": score_between_60_and_95_based_on_resume_quality
        }
      }

      IMPORTANT: 
      - Extract ACTUAL information from the resume text provided
      - Do not use generic or placeholder information
      - Base the analysis on the SPECIFIC content of this resume
      - Make strengths, weaknesses, and suggestions specific to this person's background
      - Score should reflect the actual quality and completeness of this specific resume

      Resume text to analyze:
      ${resumeText}
    `;

    const response = await this.makeRequest(prompt);
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('JSON parsing error:', error);
      // Return a more realistic default structure
      return {
        personalInfo: { 
          name: "Resume Analysis", 
          email: "Please update with actual email", 
          phone: "Please update with actual phone", 
          location: "Please update with actual location" 
        },
        experience: [{
          company: "Please review and update",
          position: "Please review and update", 
          duration: "Please review and update",
          description: ["Please review the original resume and update with actual experience"]
        }],
        education: [{
          institution: "Please review and update",
          degree: "Please review and update",
          year: "Please review and update"
        }],
        skills: ["Please review and update with actual skills"],
        summary: "Please review the original resume and update with actual professional summary",
        analysis: {
          strengths: ["Resume was successfully uploaded and processed"],
          weaknesses: ["Resume content needs to be reviewed and properly formatted"],
          suggestions: ["Please ensure resume is in clear text format", "Review and update all sections with accurate information"],
          overallScore: 65
        }
      };
    }
  }

  async generateStructuredQuestions(resumeData: ResumeData): Promise<QuestionProgress> {
    const prompt = `
      Based on this resume, generate exactly 25 SHORT and RELEVANT interview questions following this structure:
      - 2 Introduction questions (keep simple and short)
      - 15 Technical questions (based on skills: ${resumeData.skills.join(', ')}) - make them specific and short
      - 2 Experience/Projects questions (based on their actual experience)
      - 1 Certification question
      - 1 Career Goals question
      - 1 Soft Skills question
      - 3 Other relevant questions

      Resume Details:
      Name: ${resumeData.personalInfo.name}
      Education: ${resumeData.education.map(e => `${e.degree} from ${e.institution}`).join(', ')}
      Experience: ${resumeData.experience.map(e => `${e.position} at ${e.company}`).join(', ')}
      Skills: ${resumeData.skills.join(', ')}
      Summary: ${resumeData.summary}

      IMPORTANT: 
      - Keep ALL questions SHORT (maximum 10-15 words)
      - Make questions SPECIFIC to their resume content
      - Technical questions should be directly related to their listed skills
      - Experience questions should reference their actual companies/roles
      - First question should ONLY be about introduction/background

      Return a JSON object with this exact structure:
      {
        "introduction": {
          "completed": 0,
          "total": 2,
          "questions": [
            {"id": "intro_1", "category": "introduction", "question": "Tell me about yourself"},
            {"id": "intro_2", "category": "introduction", "question": "Walk me through your education"}
          ]
        },
        "technical": {
          "completed": 0,
          "total": 15,
          "questions": [
            {"id": "tech_1", "category": "technical", "question": "short specific technical question based on their skills"},
            // ... 14 more technical questions
          ]
        },
        "experience": {
          "completed": 0,
          "total": 2,
          "questions": [
            {"id": "exp_1", "category": "experience", "question": "Tell me about your role at [specific company]"},
            {"id": "exp_2", "category": "experience", "question": "Describe a challenging project"}
          ]
        },
        "certification": {
          "completed": 0,
          "total": 1,
          "questions": [
            {"id": "cert_1", "category": "certification", "question": "What certifications do you have?"}
          ]
        },
        "careerGoals": {
          "completed": 0,
          "total": 1,
          "questions": [
            {"id": "goal_1", "category": "careerGoals", "question": "Where do you see yourself in 5 years?"}
          ]
        },
        "softSkills": {
          "completed": 0,
          "total": 1,
          "questions": [
            {"id": "soft_1", "category": "softSkills", "question": "How do you handle pressure?"}
          ]
        },
        "other": {
          "completed": 0,
          "total": 3,
          "questions": [
            {"id": "other_1", "category": "other", "question": "Why this position?"},
            {"id": "other_2", "category": "other", "question": "Salary expectations?"},
            {"id": "other_3", "category": "other", "question": "Questions for us?"}
          ]
        }
      }
    `;

    const response = await this.makeRequest(prompt);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Question generation error:', error);
      // Return default structure
      return this.getDefaultQuestionStructure();
    }
  }

  private getDefaultQuestionStructure(): QuestionProgress {
    return {
      introduction: {
        completed: 0,
        total: 2,
        questions: [
          { id: "intro_1", category: "introduction", question: "Tell me about yourself" },
          { id: "intro_2", category: "introduction", question: "Walk me through your education" }
        ]
      },
      technical: {
        completed: 0,
        total: 15,
        questions: Array.from({ length: 15 }, (_, i) => ({
          id: `tech_${i + 1}`,
          category: "technical" as const,
          question: `Technical question ${i + 1}`
        }))
      },
      experience: {
        completed: 0,
        total: 2,
        questions: [
          { id: "exp_1", category: "experience", question: "Tell me about your work experience" },
          { id: "exp_2", category: "experience", question: "Describe a challenging project" }
        ]
      },
      certification: {
        completed: 0,
        total: 1,
        questions: [
          { id: "cert_1", category: "certification", question: "What certifications do you have?" }
        ]
      },
      careerGoals: {
        completed: 0,
        total: 1,
        questions: [
          { id: "goal_1", category: "careerGoals", question: "Where do you see yourself in 5 years?" }
        ]
      },
      softSkills: {
        completed: 0,
        total: 1,
        questions: [
          { id: "soft_1", category: "softSkills", question: "How do you handle pressure?" }
        ]
      },
      other: {
        completed: 0,
        total: 3,
        questions: [
          { id: "other_1", category: "other", question: "Why this position?" },
          { id: "other_2", category: "other", question: "Salary expectations?" },
          { id: "other_3", category: "other", question: "Questions for us?" }
        ]
      }
    };
  }

  async generatePersonalizedGreeting(resumeContext: string, firstQuestion: string): Promise<string> {
    const prompt = `
      You are an AI interviewer. Generate a warm, professional greeting for an interview based on this candidate's resume information:
      
      ${resumeContext}
      
      Create a greeting that:
      1. Welcomes the candidate by name
      2. Sets a positive, encouraging tone
      3. Mentions this is a structured interview
      4. Asks the first question: "${firstQuestion}"
      
      Keep it conversational and concise (2-3 sentences max). Return only the greeting message.
    `;

    return await this.makeRequest(prompt);
  }

  async getNextQuestion(questionProgress: QuestionProgress, currentIndex: number): Promise<InterviewQuestion | null> {
    const allQuestions = [
      ...questionProgress.introduction.questions,
      ...questionProgress.technical.questions,
      ...questionProgress.experience.questions,
      ...questionProgress.certification.questions,
      ...questionProgress.careerGoals.questions,
      ...questionProgress.softSkills.questions,
      ...questionProgress.other.questions
    ];

    return allQuestions[currentIndex] || null;
  }

  async isUserAskingQuestion(candidateResponse: string): Promise<boolean> {
    const prompt = `
      Analyze this candidate response and determine if they are asking a question to the interviewer:
      
      Response: "${candidateResponse}"
      
      Return only "true" if they are asking a question, "false" if they are answering.
      
      Examples of questions:
      - "What is the company culture like?"
      - "Can you tell me more about the team?"
      - "What are the growth opportunities?"
      
      Examples of answers:
      - "I have 5 years of experience in..."
      - "My strength is problem solving..."
      - "I worked at XYZ company..."
    `;

    const response = await this.makeRequest(prompt);
    return response.toLowerCase().includes('true');
  }

  async answerCandidateQuestion(candidateQuestion: string, resumeData: ResumeData): Promise<string> {
    const prompt = `
      You are an AI interviewer. The candidate has asked this question: "${candidateQuestion}"
      
      Provide a helpful, professional response that:
      1. Answers their question appropriately
      2. Keeps the interview moving forward
      3. Shows you're engaged and supportive
      4. Transitions back to the interview questions
      
      Keep the response concise (2-3 sentences) and professional.
    `;

    return await this.makeRequest(prompt);
  }

  async provideGuidance(question: InterviewQuestion, candidateAnswer: string, resumeData: ResumeData): Promise<string> {
    const prompt = `
      The candidate gave this answer to the question "${question.question}":
      Answer: "${candidateAnswer}"
      
      Based on their resume background:
      Skills: ${resumeData.skills.join(', ')}
      Experience: ${resumeData.experience.map(e => `${e.position} at ${e.company}`).join(', ')}
      
      Provide helpful guidance that:
      1. Acknowledges their answer positively
      2. Provides a specific hint or direction for improvement
      3. Encourages them to provide more detail or clarity
      4. Relates to their resume background when possible
      
      IMPORTANT: Do NOT repeat the question again. Just provide guidance and encouragement.
      Keep it supportive and brief (1-2 sentences). End with "Please continue with your answer."
    `;

    return await this.makeRequest(prompt);
  }

  async generateNextQuestionTransition(nextQuestion: InterviewQuestion, resumeData: ResumeData): Promise<string> {
    const prompt = `
      Generate a smooth transition to the next interview question.
      
      Next question: "${nextQuestion.question}"
      Category: ${nextQuestion.category}
      
      Create a brief transition (1 sentence) that:
      1. Acknowledges the previous answer (generically)
      2. Introduces the next question naturally
      
      Examples:
      - "Thank you for that. Now, ${nextQuestion.question}"
      - "Great, let's move on. ${nextQuestion.question}"
      - "I see. Next question: ${nextQuestion.question}"
      
      Keep it natural and conversational. Return only the transition with the question.
    `;

    return await this.makeRequest(prompt);
  }

  async validateAnswer(question: InterviewQuestion, candidateAnswer: string, resumeData: ResumeData): Promise<{
    isCorrect: boolean;
    score: number;
    feedback: string;
  }> {
    const prompt = `
      Evaluate this interview answer based on the candidate's resume:
      
      Question: ${question.question}
      Category: ${question.category}
      Candidate's Answer: ${candidateAnswer}
      
      Resume Context:
      Name: ${resumeData.personalInfo.name}
      Education: ${resumeData.education.map(e => `${e.degree} from ${e.institution}`).join(', ')}
      Experience: ${resumeData.experience.map(e => `${e.position} at ${e.company}`).join(', ')}
      Skills: ${resumeData.skills.join(', ')}
      
      Evaluate the answer and return JSON:
      {
        "isCorrect": true/false,
        "score": 0-100,
        "feedback": "specific feedback on the answer quality and accuracy"
      }
      
      Consider:
      - Does the answer align with their resume?
      - Is it relevant to the question?
      - Is it technically accurate (for technical questions)?
      - Is it complete and well-structured?
      - Score 80+ for excellent answers, 70-79 for good answers, 60-69 for okay answers, below 60 for poor answers
    `;

    const response = await this.makeRequest(prompt);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Answer validation error:', error);
      return {
        isCorrect: true,
        score: 75,
        feedback: "Answer received and processed"
      };
    }
  }

  async evaluateInterview(transcript: string, resumeData: ResumeData, questionProgress: QuestionProgress): Promise<{ scores: SkillScores; feedback: InterviewFeedback }> {
    // Calculate actual statistics from the interview
    const allQuestions = [
      ...questionProgress.introduction.questions,
      ...questionProgress.technical.questions,
      ...questionProgress.experience.questions,
      ...questionProgress.certification.questions,
      ...questionProgress.careerGoals.questions,
      ...questionProgress.softSkills.questions,
      ...questionProgress.other.questions
    ];

    // Count questions that were actually answered
    const answeredQuestions = allQuestions.filter(q => q.candidateAnswer && q.candidateAnswer.trim().length > 0);
    const correctAnswers = allQuestions.filter(q => q.isCorrect === true).length;
    const totalAnsweredQuestions = answeredQuestions.length;
    const accuracyPercentage = totalAnsweredQuestions > 0 ? Math.round((correctAnswers / totalAnsweredQuestions) * 100) : 0;

    // Calculate category scores based on actual answers
    const categoryScores = {
      introduction: this.calculateCategoryScore(questionProgress.introduction.questions),
      technical: this.calculateCategoryScore(questionProgress.technical.questions),
      experience: this.calculateCategoryScore(questionProgress.experience.questions),
      certification: this.calculateCategoryScore(questionProgress.certification.questions),
      careerGoals: this.calculateCategoryScore(questionProgress.careerGoals.questions),
      softSkills: this.calculateCategoryScore(questionProgress.softSkills.questions)
    };

    const prompt = `
      Analyze this interview session and provide realistic evaluation based on ACTUAL performance:
      
      ACTUAL INTERVIEW DATA:
      - Total questions asked: ${totalAnsweredQuestions} out of 25
      - Questions answered: ${totalAnsweredQuestions}
      - Correct answers: ${correctAnswers}
      - Accuracy rate: ${accuracyPercentage}%
      - Interview was ${totalAnsweredQuestions < 5 ? 'ended very early' : totalAnsweredQuestions < 10 ? 'ended early' : 'completed normally'}
      
      Transcript: ${transcript}
      
      Resume Context:
      Name: ${resumeData.personalInfo.name}
      Skills: ${resumeData.skills.join(', ')}
      Experience: ${resumeData.experience.map(e => `${e.position} at ${e.company}`).join(', ')}
      
      IMPORTANT: Base scores on ACTUAL performance, not ideal scenarios:
      - If interview ended early (< 5 questions), scores should be low (30-50 range)
      - If few questions answered, technical knowledge should be low
      - Communication score based on actual responses given
      - Don't give high scores for incomplete interviews
      
      Return JSON with realistic scores:
      {
        "scores": {
          "communication": score_based_on_actual_responses,
          "technicalKnowledge": score_based_on_technical_answers_given,
          "problemSolving": score_based_on_problem_solving_shown,
          "confidence": score_based_on_confidence_displayed,
          "clarityOfThought": score_based_on_clarity_shown,
          "overallAccuracy": ${accuracyPercentage}
        },
        "feedback": {
          "strengths": ["actual strengths observed", "specific to what was demonstrated"],
          "improvements": ["areas needing work based on performance", "specific to gaps shown"],
          "mistakes": ["actual mistakes made", "specific issues observed"],
          "tips": ["specific advice for improvement", "based on actual performance gaps"],
          "resources": [],
          "categoryScores": {
            "introduction": ${categoryScores.introduction},
            "technical": ${categoryScores.technical},
            "experience": ${categoryScores.experience},
            "certification": ${categoryScores.certification},
            "careerGoals": ${categoryScores.careerGoals},
            "softSkills": ${categoryScores.softSkills}
          },
          "correctAnswers": ${correctAnswers},
          "totalQuestions": ${totalAnsweredQuestions},
          "accuracyPercentage": ${accuracyPercentage}
        }
      }
      
      Be honest about performance - if interview was cut short, reflect that in scores and feedback.
    `;

    const response = await this.makeRequest(prompt);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // Ensure accuracy is correctly set
        result.scores.overallAccuracy = accuracyPercentage;
        result.feedback.correctAnswers = correctAnswers;
        result.feedback.totalQuestions = totalAnsweredQuestions;
        result.feedback.accuracyPercentage = accuracyPercentage;
        return result;
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Evaluation parsing error:', error);
      // Return realistic fallback based on actual performance
      const baseScore = totalAnsweredQuestions < 5 ? 35 : totalAnsweredQuestions < 10 ? 50 : 65;
      return {
        scores: {
          communication: Math.max(baseScore - 10, 20),
          technicalKnowledge: Math.max(baseScore - 15, 15),
          problemSolving: Math.max(baseScore - 10, 20),
          confidence: Math.max(baseScore - 5, 25),
          clarityOfThought: Math.max(baseScore - 10, 20),
          overallAccuracy: accuracyPercentage
        },
        feedback: {
          strengths: totalAnsweredQuestions > 0 ? ["Participated in the interview session"] : ["Started the interview process"],
          improvements: [
            "Complete more questions in future interviews",
            "Provide more detailed responses",
            "Practice interview skills regularly"
          ],
          mistakes: totalAnsweredQuestions < 5 ? ["Interview ended too early", "Limited responses provided"] : ["Some answers could be more comprehensive"],
          tips: [
            "Practice answering common interview questions",
            "Prepare specific examples from your experience",
            "Take time to complete full interview sessions"
          ],
          resources: [],
          categoryScores,
          correctAnswers,
          totalQuestions: totalAnsweredQuestions,
          accuracyPercentage
        }
      };
    }
  }

  private calculateCategoryScore(questions: InterviewQuestion[]): number {
    const answeredQuestions = questions.filter(q => q.candidateAnswer && q.candidateAnswer.trim().length > 0);
    if (answeredQuestions.length === 0) return 0;
    
    const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
    return Math.round(totalScore / answeredQuestions.length);
  }
}

export const geminiService = new GeminiService();
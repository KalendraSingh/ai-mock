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
      1. Acknowledges their answer
      2. Provides a hint or direction for a better response
      3. Encourages them to elaborate or clarify
      4. Relates to their resume background
      
      Keep it supportive and brief (1-2 sentences). Then say "Let me ask you this again" and restate the question.
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
      
      Keep it natural and conversational.
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
      - Score 70+ for good answers, 50-69 for okay answers, below 50 for poor answers
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
    const allQuestions = [
      ...questionProgress.introduction.questions,
      ...questionProgress.technical.questions,
      ...questionProgress.experience.questions,
      ...questionProgress.certification.questions,
      ...questionProgress.careerGoals.questions,
      ...questionProgress.softSkills.questions,
      ...questionProgress.other.questions
    ];

    const correctAnswers = allQuestions.filter(q => q.isCorrect).length;
    const totalQuestions = allQuestions.length;
    const accuracyPercentage = Math.round((correctAnswers / totalQuestions) * 100);

    const prompt = `
      Analyze this structured interview with 25 questions and provide detailed evaluation:
      
      Transcript: ${transcript}
      Resume Data: ${JSON.stringify(resumeData)}
      Total Questions: ${totalQuestions}
      Correct Answers: ${correctAnswers}
      Accuracy: ${accuracyPercentage}%
      
      Question Categories:
      - Introduction: ${questionProgress.introduction.questions.length} questions
      - Technical: ${questionProgress.technical.questions.length} questions  
      - Experience: ${questionProgress.experience.questions.length} questions
      - Certification: ${questionProgress.certification.questions.length} questions
      - Career Goals: ${questionProgress.careerGoals.questions.length} questions
      - Soft Skills: ${questionProgress.softSkills.questions.length} questions
      
      Return a JSON object with this structure:
      {
        "scores": {
          "communication": 85,
          "technicalKnowledge": 78,
          "problemSolving": 82,
          "confidence": 88,
          "clarityOfThought": 80,
          "overallAccuracy": ${accuracyPercentage}
        },
        "feedback": {
          "strengths": ["specific strength 1", "specific strength 2"],
          "improvements": ["specific area 1", "specific area 2"],
          "mistakes": ["specific mistake 1", "specific mistake 2"],
          "tips": ["specific tip 1", "specific tip 2"],
          "resources": [],
          "categoryScores": {
            "introduction": 85,
            "technical": 75,
            "experience": 80,
            "certification": 90,
            "careerGoals": 85,
            "softSkills": 80
          },
          "correctAnswers": ${correctAnswers},
          "totalQuestions": ${totalQuestions},
          "accuracyPercentage": ${accuracyPercentage}
        }
      }
      
      Evaluate based on answer accuracy, technical knowledge, communication skills, and resume alignment.
    `;

    const response = await this.makeRequest(prompt);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Evaluation parsing error:', error);
      return {
        scores: {
          communication: 75,
          technicalKnowledge: 70,
          problemSolving: 75,
          confidence: 70,
          clarityOfThought: 75,
          overallAccuracy: accuracyPercentage
        },
        feedback: {
          strengths: ["Completed the structured interview", "Provided answers to all questions"],
          improvements: ["Continue practicing interview skills", "Work on providing more detailed responses"],
          mistakes: ["Some answers could be more specific"],
          tips: ["Practice technical concepts", "Prepare specific examples from experience"],
          resources: [],
          categoryScores: {
            introduction: 75,
            technical: 70,
            experience: 75,
            certification: 70,
            careerGoals: 75,
            softSkills: 75
          },
          correctAnswers,
          totalQuestions,
          accuracyPercentage
        }
      };
    }
  }
}

export const geminiService = new GeminiService();
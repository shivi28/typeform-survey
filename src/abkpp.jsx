import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, CheckCircle, Play, LogOut, User, Briefcase, Stethoscope, Building2, Users, Pause, RefreshCw, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './SurveyStyles.css';
import SurveyDashboard from './SurveyDashboard';

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [uploadedVideos, setUploadedVideos] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [profession, setProfession] = useState('');
  const [showProfessionSelect, setShowProfessionSelect] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  
  const videoRef = useRef(null);
  
  // Google Client ID
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Configure axios with the API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL;
  console.log('Using API URL:', API_URL);

  // Set axios defaults
  axios.defaults.baseURL = API_URL;
  
  // Update the video auto-play effect
  useEffect(() => {
    // Auto-play video when question changes
    setIsPlaying(false);
    setShowPlayButton(true);
    
    // Add a small delay to ensure the video element is properly loaded
    const autoPlayTimer = setTimeout(() => {
      if (videoRef.current) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setShowPlayButton(false);
            })
            .catch(error => {
              // Auto-play was prevented by the browser
              console.log('Autoplay prevented:', error);
              setIsPlaying(false);
              setShowPlayButton(true);
            });
        }
      }
    }, 500);
    
    return () => clearTimeout(autoPlayTimer);
  }, [currentIndex]);

  // Handle video end
  const handleVideoEnd = () => {
    setShowPlayButton(true);
    setIsPlaying(false);
  };

  // Update the toggle play function
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error('Play error:', error);
              setIsPlaying(false);
            });
        }
      }
    }
  };
  
  // Configure axios to include the auth token in all requests
  useEffect(() => {
    if (user) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  // Question sets based on profession
  const questionSets = {
    student: [
      {
        id: 1,
        questionText: "How many hours do you study per day?",
        type: "multipleChoice",
        options: [
          "Less than 2 hours", 
          "2-4 hours", 
          "4-6 hours",
          "More than 6 hours"
        ],
        videoSrc: "/typeform-survey/videos/video1.mp4",
        allowVideoUpload: true
      },
      {
        id: 2,
        questionText: "What's your biggest challenge as a student?",
        type: "text",
        placeholder: "Describe your biggest academic challenge...",
        videoSrc: "/typeform-survey/videos/video2.mp4",
        allowVideoUpload: true
      }
    ],
    // other profession question sets remain the same
    // ... existing code for other professions
  };
  
  // Active questions based on selected profession
  const [questions, setQuestions] = useState(questionSets.other);

  // Check user status on component mount
  useEffect(() => {
    // Check if dashboard URL parameter is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dashboard') === 'true') {
      setShowDashboard(true);
    }
    
    const token = localStorage.getItem('surveyToken');
    if (token) {
      try {
        // Decode the token
        const decodedToken = jwtDecode(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          console.log('Token expired');
          localStorage.removeItem('surveyToken');
          return;
        }

        // Check if user has already submitted - if yes, auto-logout on refresh
        if (decodedToken.hasSubmitted && !showThankYou) {
          console.log('User has already submitted, logging out on refresh');
          setTimeout(() => handleLogout(), 3000); // Delay to show the "already submitted" message
          // Show message before logging out
          setUser({
            token,
            email: decodedToken.email || '',
            name: decodedToken.name || '',
            picture: decodedToken.picture || ''
          });
          setHasSubmitted(true);
          return;
        }
        
        // Set user data from token
        setUser({
          token,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture
        });
        
        // Check if user has already submitted
        setHasSubmitted(decodedToken.hasSubmitted);
        
        // Verify token with the server
        verifyUserStatus(token);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('surveyToken');
      }
    }
  }, []);
  
  // Fetch submissions from backend on component mount
  useEffect(() => {
    if (isSubmitted) {
      fetchSubmissions();
    }
  }, [isSubmitted]);
  
  // Update questions when profession changes
  useEffect(() => {
    if (profession && questionSets[profession]) {
      setQuestions(questionSets[profession]);
      setCurrentIndex(0);
      setAnswers({});
      setSelectedAnswer('');
    }
  }, [profession]);
  
  const verifyUserStatus = async (token) => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/user/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHasSubmitted(response.data.hasSubmitted);
      setIsLoading(false);
      
      // If user hasn't submitted and we have their profession saved, set it
      if (!response.data.hasSubmitted && response.data.profession) {
        setProfession(response.data.profession);
      } else if (!response.data.hasSubmitted) {
        // Show profession select screen if they haven't chosen one yet
        setShowProfessionSelect(true);
      }
    } catch (error) {
      console.error('Error verifying user status:', error);
      setUser(null);
      localStorage.removeItem('surveyToken');
      setIsLoading(false);
    }
  };
  
  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/submissions');
      console.log('Submissions received:', response.data);
      setSubmissions(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to fetch submissions. ' + (error.response?.data?.message || error.message));
      setIsLoading(false);
    }
  };
  
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      // Implement retry logic with exponential backoff
      const maxRetries = 3;
      let retryCount = 0;
      let delay = 1000; // Start with 1 second delay
      
      const attemptLogin = async () => {
        try {
          // Send the token to your backend for verification
          const response = await axios.post('/api/auth/google', {
            token: credentialResponse.credential
          });
          
          // Store the session token
          localStorage.setItem('surveyToken', response.data.token);
          
          // Update user state
          setUser({
            token: response.data.token,
            ...response.data.user
          });
          
          // Check if the user has already submitted
          setHasSubmitted(response.data.hasSubmitted);
          
          // If they haven't submitted and we have their profession, set it
          if (!response.data.hasSubmitted && response.data.profession) {
            setProfession(response.data.profession);
          } else if (!response.data.hasSubmitted) {
            // Show profession select screen
            setShowProfessionSelect(true);
          }
          
          return true; // Success
        } catch (error) {
          // If we hit a rate limit (429) and haven't exhausted retries
          if (error.response?.status === 429 && retryCount < maxRetries) {
            console.log(`Rate limited, retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
            
            // Wait for the delay period
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Increase retry count and delay for exponential backoff
            retryCount++;
            delay *= 2; // Double the delay each time
            
            // Try again
            return attemptLogin();
          }
          
          // If it's another error or we've exhausted retries, throw the error
          throw error;
        }
      };
      
      // Start the login attempt process
      await attemptLogin();
      setIsLoading(false);
    } catch (error) {
      console.error('Google login error:', error);
      let errorMessage = 'Failed to authenticate with Google. ';
      
      if (error.response?.status === 429) {
        errorMessage += 'You\'ve reached the rate limit. Please wait a few minutes before trying again.';
      } else {
        errorMessage += (error.response?.data?.message || error.message);
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  
  const handleProfessionSelect = (selectedProfession) => {
    setProfession(selectedProfession);
    setShowProfessionSelect(false);
    
    // Save profession to backend
    saveProfession(selectedProfession);
  };
  
  const saveProfession = async (selectedProfession) => {
    try {
      await axios.post('/api/user/profession', {
        profession: selectedProfession
      });
    } catch (error) {
      console.error('Error saving profession:', error);
      // Continue anyway, as this is not critical
    }
  };
  
  const handleGoogleError = (error) => {
    console.error('Google sign-in error:', error);
    setError('Google sign-in was unsuccessful. Please try again in a few minutes.');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('surveyToken');
    setUser(null);
    setHasSubmitted(false);
    setProfession('');
    setShowProfessionSelect(false);
    resetSurvey();
  };

  const resetSurvey = () => {
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer('');
    setUploadedVideos({});
    setIsSubmitted(false);
    setShowThankYou(false);
    setError(null);
    setShowPlayButton(true);
  };

  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
    
    // Update URL without refreshing page
    const url = new URL(window.location);
    if (!showDashboard) {
      url.searchParams.set('dashboard', 'true');
    } else {
      url.searchParams.delete('dashboard');
    }
    window.history.pushState({}, '', url);
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer) => {
    const newAnswers = { 
      ...answers, 
      [currentQuestion.id]: answer 
    };
    setAnswers(newAnswers);
    setSelectedAnswer(answer);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer('');
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      formData.append('answers', JSON.stringify(finalAnswers));
      formData.append('profession', profession);
  
      Object.entries(uploadedVideos).forEach(([questionId, videoData]) => {
        formData.append(`video-${questionId}`, videoData.file);
      });
  
      console.log('Submitting survey to:', `${API_URL}/api/submit-survey`);
      const response = await axios.post(
        '/api/submit-survey', 
        formData, 
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
  
      console.log('Submission response:', response.data);
      setIsSubmitted(true);
      setShowThankYou(true);
      setHasSubmitted(true);
      setIsLoading(false);
      
      // Update the stored token to reflect the submission
      if (user && user.token) {
        verifyUserStatus(user.token);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError('Failed to submit survey. ' + (error.response?.data?.message || error.message));
      setIsLoading(false);
    }
  };

  const renderGoogleLogin = () => {
    return (
      <div className="auth-page-container">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        
        <div className="auth-card">
          <h2 className="auth-title">Welcome to Our Survey</h2>
          <p className="auth-description">
            Your feedback is valuable to us! Sign in with Google to share your thoughts and help us improve.
          </p>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
              {error.includes('429') || error.includes('rate limit') ? (
                <>
                  <p className="error-suggestion">This happens when Google's authentication service reaches its limit. Please try again after a few minutes.</p>
                  <button 
                    onClick={() => setError(null)} 
                    className="retry-button"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Try Again
                  </button>
                </>
              ) : null}
            </div>
          )}
          
          <div className="signin-container">
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                text="signin_with"
                shape="circle"
                size="large"
              />
            </GoogleOAuthProvider>
          </div>
          
          <p className="privacy-text">
            We only use your email to prevent duplicate submissions.
            We don't share your information with third parties.
          </p>
          
          <div className="mt-6">
            <button
              onClick={toggleDashboard}
              className="flex items-center mx-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
            >
              <BarChart2 size={18} className="mr-2" />
              {showDashboard ? "Return to Survey" : "View Survey Results"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Other render functions remain the same
  // ...

  // Show loading indicator while checking user status
  if (isLoading && !user && !error && !showDashboard) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Render dashboard if showDashboard is true
  if (showDashboard) {
    return (
      <div>
        <div className="bg-white p-3 shadow-sm flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Survey Analytics Dashboard</h1>
          <button 
            onClick={toggleDashboard}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
          >
            Return to Survey
          </button>
        </div>
        <SurveyDashboard />
      </div>
    );
  }

  // Determine what to render based on the current state
  const renderContent = () => {
    // Step 1: If not logged in, show Google login
    if (!user) {
      return renderGoogleLogin();
    }
    
    // Step 2: If logged in but need to select profession
    if (showProfessionSelect) {
      return renderProfessionSelect();
    }
    
    // Step 3: If logged in but already submitted, show already submitted screen
    if (hasSubmitted && !showThankYou) {
      return renderAlreadySubmitted();
    }
    
    // Step 4: If just submitted, show thank you screen
    if (showThankYou) {
      return renderThankYouScreen();
    }
    
    // Step 5: If viewing submissions
    if (isSubmitted) {
      return renderSubmissions();
    }
    
    // Step 6: Otherwise, show the survey
    return renderSurvey();
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
}

export default App;
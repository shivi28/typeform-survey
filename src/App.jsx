import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, CheckCircle, Play, LogOut, User, Briefcase, Stethoscope, Building2, Users, Pause, RefreshCw, BarChart2, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './SurveyStyles.css';
import SurveyDashboard from './SurveyDashboard';
import { questionSets } from './questions';

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState([]);
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
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  
  const videoRef = useRef(null);
  
  // Google Client ID
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Add debug info to help troubleshoot
  console.log("OAuth Client ID is set:", !!GOOGLE_CLIENT_ID);
  
  // Configure axios with the API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'https://typeform-backend-6qnp.onrender.com';
  
  // We'll use direct URLs instead of setting axios defaults
  // to avoid any potential conflicts
  
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
  
  // Active questions based on selected profession
  const [questions, setQuestions] = useState(questionSets.other);

  // // Check for existing token on component mount
  // useEffect(() => {
  //   const token = localStorage.getItem('surveyToken');
  //   if (token) {
  //     try {
        
  //       // Decode the JWT to get user info
  //       const decodedToken = jwtDecode(token);
        
  //       // Check if token is expired
  //       const currentTime = Date.now() / 1000;
  //       if (decodedToken.exp && decodedToken.exp < currentTime) {
  //         handleLogout();
  //         return;
  //       }
        
  //       // Set user state with info from token
  //       setUser({
  //         email: decodedToken.email,
  //         name: decodedToken.name,
  //         picture: decodedToken.picture
  //       });
        
  //       // Set hasSubmitted from token
  //       if (decodedToken.hasSubmitted) {
  //         setHasSubmitted(true);
  //       }
        
  //       // If user has a profession in the token, set it
  //       if (decodedToken.profession) {
  //         setProfession(decodedToken.profession);
  //       }
        
  //       // Determine what to show next
  //       if (decodedToken.hasSubmitted) {
  //         // If user has submitted, show the already submitted screen
  //         setShowIntroVideo(false);
  //         setShowProfessionSelect(false);
  //       } else if (decodedToken.profession) {
  //         // If user has a profession but hasn't submitted, show the survey
  //         setShowIntroVideo(false);
  //         setShowProfessionSelect(false);
  //       } else {
  //         // If user hasn't submitted and doesn't have a profession, show intro video
  //         setShowIntroVideo(true);
  //         setShowProfessionSelect(false);
  //       }
  //     } catch (error) {
  //       console.error('Error processing stored token:', error);
  //       localStorage.removeItem('surveyToken');
  //     }
  //   }
  // }, []);
  
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
      
      // Get the API URL directly
      const apiUrl = import.meta.env.VITE_API_URL || 'https://typeform-backend-6qnp.onrender.com';
      
      // Make API call to verify user status
      const response = await fetch(`${apiUrl}/api/user/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', response.status, errorText);
        throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
      }
      
      const data = await response.json();
 
      
      // Update hasSubmitted state based on response
      setHasSubmitted(data.hasSubmitted);
      
      // If user hasn't submitted and we have their profession saved, set it
      if (!data.hasSubmitted && data.profession) {
        setProfession(data.profession);
        // Skip intro video if they already have a profession set
        setShowIntroVideo(false);
        setShowProfessionSelect(false);
      } else if (!data.hasSubmitted) {
        // If user hasn't submitted and doesn't have a profession, show intro video
        setShowIntroVideo(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      
      // If there's an authentication error, clear user state
      if (error.message.includes('401') || error.message.includes('403')) {
        setUser(null);
        localStorage.removeItem('surveyToken');
      }
      
      setIsLoading(false);
    }
  };
  
  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/submissions`);
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
      setError(null);
      
      // Get the API URL directly
      const apiUrl = import.meta.env.VITE_API_URL || 'https://typeform-backend-6qnp.onrender.com';
      
      // First, send the Google token to our backend to verify and create a session
      const response = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', response.status, errorText);
        throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
      }
      
      const data = await response.json();
      
      // Store the token from our backend
      const backendToken = data.token;
      localStorage.setItem('surveyToken', backendToken);
      
      // Decode the token to get user info
      const decodedToken = jwtDecode(backendToken);
      
      // Set user state with info from backend token
      setUser({
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        token: backendToken
      });
      
      // Check if user has already submitted a survey
      setHasSubmitted(data.hasSubmitted);
      
      // If user hasn't submitted and we have their profession saved, set it
      if (!data.hasSubmitted && data.profession) {
        setProfession(data.profession);
        setShowProfessionSelect(false);
      } else if (!data.hasSubmitted) {
        // Show intro video if user hasn't submitted yet
        setShowIntroVideo(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to process Google login. Error: ' + error.message);
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
    const token = localStorage.getItem('surveyToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      await axios.post(
        `${API_URL}/api/user/profession`, 
        { profession: selectedProfession },
        {
          headers: { 
            'Authorization': `Bearer ${token}`
           }
        }  
      );
    } catch (error) {
      console.error('Error saving profession:', error);
      // Continue anyway, as this is not critical
    }
  };
  
  const handleGoogleError = (error) => {
    console.error('Google sign-in error:', error);
    setError('Google sign-in was unsuccessful. Please try again in a few minutes.');
  };
  
  // const handleLogout = () => {
  //   localStorage.removeItem('surveyToken');
  //   setUser(null);
  //   setHasSubmitted(false);
  //   setProfession('');
  //   setShowProfessionSelect(false);
  //   resetSurvey();
  // };

  const resetSurvey = () => {
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer('');
    setSelectedAnswers([]);
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
    if (currentQuestion.type === "multipleChoice" && currentQuestion.allowMultiple) {
      // Handle multiple selection
      let newSelectedAnswers;
      if (selectedAnswers.includes(answer)) {
        // Remove the answer if it's already selected
        newSelectedAnswers = selectedAnswers.filter(a => a !== answer);
      } else {
        // Add the answer if it's not selected
        newSelectedAnswers = [...selectedAnswers, answer];
      }
      setSelectedAnswers(newSelectedAnswers);
      setSelectedAnswer(newSelectedAnswers.join(', ')); // For display purposes
    } else {
      // Handle single selection or text input
      const newAnswers = { 
        ...answers, 
        [currentQuestion.id]: answer 
      };
      setAnswers(newAnswers);
      setSelectedAnswer(answer);
    }
  };

  const handleNext = () => {
    if (currentQuestion.type === "multipleChoice" && currentQuestion.allowMultiple) {
      // For multiple choice questions, store the array of selected answers
      const newAnswers = {
        ...answers,
        [currentQuestion.id]: selectedAnswers
      };
      setAnswers(newAnswers);
    } else {
      // For single choice or text questions
      const newAnswers = {
        ...answers,
        [currentQuestion.id]: selectedAnswer
      };
      setAnswers(newAnswers);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer('');
      setSelectedAnswers([]);
    } else {
      handleSubmit(answers);
    }
  };
// Add these changes to the handleSubmit function in App.js

const handleSubmit = async (finalAnswers) => {
  try {
    setIsLoading(true);
    const formData = new FormData();
    
    // Include the current question's answer in the final submission
    const allAnswers = {
      ...finalAnswers,
      [currentQuestion.id]: currentQuestion.type === "multipleChoice" && currentQuestion.allowMultiple
        ? selectedAnswers
        : selectedAnswer
    };
    
    // Get the API URL directly
    const apiUrl = import.meta.env.VITE_API_URL || 'https://typeform-backend-6qnp.onrender.com';
    
    // Get the token from localStorage
    const token = localStorage.getItem('surveyToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Prepare the form data
    formData.append('answers', JSON.stringify(allAnswers));
    formData.append('profession', profession);
    
    // Add any video uploads
    if (Object.keys(uploadedVideos).length > 0) {
      Object.entries(uploadedVideos).forEach(([questionId, videoData]) => {
        formData.append(`video-${questionId}`, videoData.file);
      });
    }
    
    const response = await axios.post(
      `${apiUrl}/api/submit-survey`, 
      formData, 
      {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = response.data;
    console.log('Submission response:', data);
    
    // Update all relevant state variables
    setIsSubmitted(true);
    setShowThankYou(true);
    setHasSubmitted(true);
    
    // Important: Update localStorage with the submission status
    try {
      // Get current token data
      const currentToken = localStorage.getItem('surveyToken');
      if (currentToken) {
        const decodedToken = jwtDecode(currentToken);
        
        // Create updated token data with hasSubmitted=true
        const updatedTokenData = {
          ...decodedToken,
          hasSubmitted: true
        };
        
        // Store updated information in localStorage
        localStorage.setItem('submissionStatus', JSON.stringify({
          hasSubmitted: true,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (tokenError) {
      console.error('Error updating token data:', tokenError);
      // Continue anyway as the main submission was successful
    }
    
    setIsLoading(false);
  } catch (error) {
    console.error('Submission error:', error);
    setError('Failed to submit survey. Error: ' + error.message);
    setIsLoading(false);
  }
};

// Then update the token-checking useEffect
useEffect(() => {
  const token = localStorage.getItem('surveyToken');
  const submissionStatus = localStorage.getItem('submissionStatus');
  
  if (token) {
    try {
      // Decode the JWT to get user info
      const decodedToken = jwtDecode(token);
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        handleLogout();
        return;
      }
      
      // Set user state with info from token
      setUser({
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      });
      
      // First check localStorage for submission status
      let userHasSubmitted = false;
      if (submissionStatus) {
        try {
          const parsedStatus = JSON.parse(submissionStatus);
          userHasSubmitted = parsedStatus.hasSubmitted === true;
        } catch (e) {
          console.error('Error parsing submission status:', e);
        }
      }
      
      // If not found in localStorage, check the token data
      if (!userHasSubmitted) {
        userHasSubmitted = decodedToken.hasSubmitted === true;
      }
      
      // Set submission status
      setHasSubmitted(userHasSubmitted);
      
      // If user has a profession in the token, set it
      if (decodedToken.profession) {
        setProfession(decodedToken.profession);
      }
      
      // Determine what to show next based on submission status
      if (userHasSubmitted) {
        // If user has submitted, show the already submitted screen
        setShowIntroVideo(false);
        setShowProfessionSelect(false);
      } else if (decodedToken.profession) {
        // If user has a profession but hasn't submitted, show the survey
        setShowIntroVideo(false);
        setShowProfessionSelect(false);
      } else {
        // If user hasn't submitted and doesn't have a profession, show intro video
        setShowIntroVideo(true);
        setShowProfessionSelect(false);
      }
    } catch (error) {
      console.error('Error processing stored token:', error);
      localStorage.removeItem('surveyToken');
      localStorage.removeItem('submissionStatus');
    }
  }
}, []);

// Also update the handleLogout function to clear all storage
const handleLogout = () => {
  localStorage.removeItem('surveyToken');
  localStorage.removeItem('submissionStatus');
  setUser(null);
  setHasSubmitted(false);
  setProfession('');
  setShowProfessionSelect(false);
  resetSurvey();
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
            Your feedback is valuable! <br />
            Sign in with Google to share your thoughts.
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
          </p>
        </div>
      </div>
    );
  };

  const renderProfessionSelect = () => {
    const professionOptions = [
      { id: 'student', label: 'Student', icon: <User className="w-8 h-8" /> },
      { id: 'softwareEngineer', label: 'Software Engineers', icon: <Briefcase className="w-8 h-8" /> },
      { id: 'manager', label: 'Managers', icon: <Users className="w-8 h-8" /> },
      { id: 'doctor', label: 'Doctors', icon: <Stethoscope className="w-8 h-8" /> },
      { id: 'caHr', label: 'CA/Human Resource', icon: <FileText className="w-8 h-8" /> },
      { id: 'other', label: 'Others', icon: <Users className="w-8 h-8" /> }
    ];
    
    return (
      <div className="auth-page-container">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        
        <div className="auth-card profession-card">
          <h2 className="auth-title">Tell us about yourself</h2>
          <p className="auth-description">
            Please select your profession to help us personalize your survey experience.
          </p>
          
          <div className="profession-options">
            {professionOptions.map(option => (
              <button
                key={option.id}
                className="profession-option"
                onClick={() => handleProfessionSelect(option.id)}
              >
                <div className="profession-icon">
                  {option.icon}
                </div>
                <span className="profession-label">{option.label}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex items-center justify-center">
            <button 
              onClick={handleLogout}
              className="logout-button"
            >
              <LogOut className="w-5 h-5 mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAlreadySubmitted = () => {
    return (
      <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-green-500 to-teal-400 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Already Submitted</h2>
          
          {user && (
            <div className="flex flex-col items-center justify-center mb-6">
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-24 h-24 rounded-full border-4 border-white shadow-md mb-3"
              />
              <div className="text-center">
                <p className="font-semibold text-lg">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          )}
          
          <p className="text-lg text-gray-600 mb-6">
            You have already completed this survey. 
            Thank you for your valuable feedback!
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => {
                setShowDashboard(true);
                window.history.pushState({}, '', '?dashboard=true');
              }}
              className="flex items-center justify-center mx-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full transition duration-300 transform hover:-translate-y-1"
            >
              <BarChart2 className="w-5 h-5 mr-2" />
              <span>View Results</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center mx-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-full transition duration-300 transform hover:-translate-y-1 mt-3"
            >
              <LogOut className="w-5 h-5 mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderThankYou = () => {
    return (
      <div className="thank-you-container">
        <div className="thank-card">
          <div className="thank-icon-container">
            <CheckCircle className="thank-icon" size={80} />
          </div>
          <h2 className="thank-title">Thank You!</h2>
          <p className="thank-description">
            Your survey response has been successfully submitted. 
            We appreciate your time and valuable feedback.
          </p>
          
          <div className="thank-actions">
            <button
              onClick={() => {
                setShowDashboard(true);
                window.history.pushState({}, '', '?dashboard=true');
              }}
              className="thank-button dashboard-button"
            >
              <BarChart2 size={16} className="mr-2" />
              View Results
            </button>
            
            <button
              onClick={handleLogout}
              className="thank-button"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderIntroVideo = () => {
    return (
      <div className="auth-page-container">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        
        <div className="auth-card video-card">
          <h2 className="auth-title">Welcome to Our Survey</h2>
          <p className="auth-description">
            Please watch this introduction before proceeding.
          </p>
          
          <div className="video-container">
            <video
              className="intro-video"
              controls
              autoPlay
              src="/typeform-survey/videos/intro.mp4" // Update this path to your actual video file
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          <button 
            onClick={handleContinueFromVideo} 
            className="action-button mt-6"
          >
            Continue to Survey
          </button>
        </div>
      </div>
    );
  };

  const handleContinueFromVideo = () => {
    console.log('Continue from video clicked');
    setShowIntroVideo(false);
    setShowProfessionSelect(true);
  };

  const renderSurvey = () => {
    return (
      <div className="survey-container">
        {/* User header */}
        {user && (
          <div className="user-header">
            <div className="user-header-info">
              <img 
                src={user.picture} 
                alt={user.name} 
                className="user-header-avatar"
              />
              <span className="user-header-name">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="user-header-logout"
            >
              <LogOut size={16} className="mr-1" />
              Sign Out
            </button>
          </div>
        )}
        
        <div className="survey-content">
          <div className="survey-card">
            {/* Add video container */}
            {currentQuestion?.videoSrc && (
              <div className="custom-video-controls">
                <video
                  ref={videoRef}
                  src={currentQuestion.videoSrc}
                  className="video"
                  onEnded={handleVideoEnd}
                  playsInline
                  muted={false}
                />
                <div className="play-pause-overlay" onClick={togglePlay}>
                  <div className="play-pause-button">
                    {isPlaying ? (
                      <Pause className="play-pause-icon" size={32} />
                    ) : (
                      <Play className="play-pause-icon" size={32} />
                    )}
                  </div>
                </div>
                {isPlaying && (
                  <div className="video-playing-indicator">
                    <div className="video-progress-dot"></div>
                    <span>Playing</span>
                  </div>
                )}
              </div>
            )}

            <div className="question-container">
              <h2 className="question-text">
                {currentQuestion?.questionText}
              </h2>

              {currentQuestion?.type === "multipleChoice" && (
                <div className="options-container">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`option-button ${
                        currentQuestion.allowMultiple
                          ? selectedAnswers.includes(option)
                            ? 'selected'
                            : ''
                          : selectedAnswer === option
                            ? 'selected'
                            : ''
                      }`}
                    >
                      {currentQuestion.allowMultiple && (
                        <span className="checkbox">
                          {selectedAnswers.includes(option) ? '✓' : ''}
                        </span>
                      )}
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion?.type === "text" && (
                <div className="text-answer-container">
                  <textarea
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="text-answer-input"
                  />
                </div>
              )}

              <div className="navigation-container">
                <button
                  onClick={handleNext}
                  disabled={
                    (currentQuestion.type === "multipleChoice" && currentQuestion.allowMultiple && selectedAnswers.length === 0) ||
                    (!currentQuestion.allowMultiple && !selectedAnswer) ||
                    isLoading
                  }
                  className={`next-button ${
                    ((currentQuestion.type === "multipleChoice" && currentQuestion.allowMultiple && selectedAnswers.length === 0) ||
                    (!currentQuestion.allowMultiple && !selectedAnswer) ||
                    isLoading)
                      ? 'disabled'
                      : ''
                  }`}
                >
                  <span>
                    {isLoading ? 'Processing...' : currentIndex < questions.length - 1 ? 'Next' : 'Submit'}
                  </span>
                  {!isLoading && <ChevronRight className="next-icon" />}
                </button>
              </div>

              <div className="progress-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmissions = () => {
    return (
      <div className="submissions-container">
        <h2 className="submissions-title">Survey Submissions</h2>
        {isLoading ? (
          <p>Loading submissions...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : submissions.length === 0 ? (
          <p>No submissions found.</p>
        ) : (
          submissions.map((submission, index) => (
            <div 
              key={submission._id || index} 
              className="submission-card"
            >
              <h3 className="submission-header">
                Submission #{index + 1}
              </h3>
              <p className="submission-info">
                Email: {submission.email}
              </p>
              <p className="submission-info">
                Profession: {submission.profession}
              </p>
              <p className="submission-info">
                Submitted on: {new Date(submission.timestamp).toLocaleString()}
              </p>
              
              {questions.map((question) => (
                <div key={question.id} className="submission-answer">
                  <p className="submission-question">{question.questionText}</p>
                  <p className="submission-response">
                    {submission.answers[question.id] || submission.answers[question.id.toString()] || 'No answer'}
                  </p>
                </div>
              ))}
            </div>
          ))
        )}
        <button
          onClick={handleLogout}
          className="logout-button"
        >
          <LogOut className="w-5 h-5 mr-2" />
          <span>Sign Out</span>
        </button>
      </div>
    );
  };

  // Show loading indicator while checking user status
  if (isLoading && !user && !error) {
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
      <div className="bg-cover bg-center min-h-screen" style={{ backgroundImage: "url('https://picsum.photos/1920/1080')" }}>
        <div className="bg-white/80 backdrop-blur-sm p-1 pl-5 pr-4 shadow-sm flex justify-between items-center mb-4">
          <div className="flex items-center">
            <img 
              src="/typeform-survey/images/DigiBrainLogo.jpeg" 
              alt="Company Logo" 
              className="h-12 object-contain rounded-sm" 
            />
          </div>
          <button 
            onClick={toggleDashboard}
            className="flex items-center bg-orange-800 hover:bg-orange-900 text-white py-2 px-4 rounded transition-colors"
          >
            Return to Survey
          </button>
        </div>
        <div className="container mx-auto px-4">
          <SurveyDashboard submissions={submissions} />
        </div>
      </div>
    );
  }
  // Determine what to render based on the current state
  const renderContent = () => {
    console.log('Rendering content with state:', {
      user: !!user,
      isLoading,
      error: !!error,
      showDashboard,
      hasSubmitted,
      isSubmitted,
      showThankYou,
      showIntroVideo,
      showProfessionSelect,
      profession
    });
    
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <div className="error-message">
            <p>{error}</p>
            <p className="error-suggestion">Please try again or contact support if the problem persists.</p>
            <button onClick={() => setError(null)} className="retry-button">
              <RefreshCw size={16} className="mr-2" />
              Retry
            </button>
          </div>
        </div>
      );
    }
    
    if (!user) {
      return renderGoogleLogin();
    }
    
    if (showDashboard) {
      return <SurveyDashboard submissions={submissions} />;
    }
    
    // Prioritize showing the thank you screen
    if (showThankYou) {
      return renderThankYou();
    }
    
    if (hasSubmitted) {
      return renderAlreadySubmitted();
    }
    
    if (isSubmitted) {
      return renderThankYou();
    }
    
    // Show intro video after login if needed
    if (showIntroVideo) {
      return renderIntroVideo();
    }
    
    if (showProfessionSelect) {
      return renderProfessionSelect();
    }
    
    return renderSurvey();
  };

  return (
     <div className="bg-cover bg-center min-h-screen" style={{ backgroundImage: "url('https://picsum.photos/1920/1080')" }}>
      {renderContent()}
    </div>
  );
}

export default App;
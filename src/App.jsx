import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, CheckCircle, Play, LogOut } from 'lucide-react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

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
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [user, setUser] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const videoRef = useRef(null);
  
  // Google Client ID
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Configure axios with the API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL;
  console.log('Using API URL:', API_URL);

  // Set axios defaults
  axios.defaults.baseURL = API_URL;
  
  // Configure axios to include the auth token in all requests
  useEffect(() => {
    if (user) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  const questions = [
    {
      id: 1,
      questionText: "Do you find yourself procrastinating?",
      type: "multipleChoice",
      options: [
        "Yes, all the time", 
        "Sometimes", 
        "No, I always organize well"
      ],
      videoSrc: "/typeform-survey/videos/video1.mp4",
      allowVideoUpload: true
    },
    {
      id: 2,
      questionText: "What's your main productivity challenge?",
      type: "text",
      placeholder: "Describe your biggest productivity hurdle...",
      videoSrc: "/typeform-survey/videos/video2.mp4",
      allowVideoUpload: true
    }
  ];

  // Check user status on component mount
  useEffect(() => {
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
  
  // Reset play button when question changes
  useEffect(() => {
    setShowPlayButton(true);
  }, [currentIndex]);

  // Fetch submissions from backend on component mount
  useEffect(() => {
    if (isSubmitted) {
      fetchSubmissions();
    }
  }, [isSubmitted]);
  
  const verifyUserStatus = async (token) => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/user/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHasSubmitted(response.data.hasSubmitted);
      setIsLoading(false);
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
      
      setIsLoading(false);
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to authenticate with Google. ' + (error.response?.data?.message || error.message));
      setIsLoading(false);
    }
  };
  
  const handleGoogleError = () => {
    setError('Google sign-in was unsuccessful. Please try again.');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('surveyToken');
    setUser(null);
    setHasSubmitted(false);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Our Survey</h2>
          <p className="text-gray-600 mb-8">
            Please sign in with Google to participate in our survey.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-center mb-6">
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
          
          <p className="text-xs text-gray-500">
            We only use your email to prevent duplicate submissions.
            We don't share your information with third parties.
          </p>
        </div>
      </div>
    );
  };

  const renderAlreadySubmitted = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <CheckCircle className="mx-auto w-20 h-20 text-green-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Already Submitted</h2>
          
          {user && (
            <div className="flex items-center justify-center mb-4">
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-12 h-12 rounded-full mr-3"
              />
              <div className="text-left">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 mb-6">
            You have already completed this survey. 
            Thank you for your participation!
          </p>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition mx-auto"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  };

  const renderThankYouScreen = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 text-center">
          <CheckCircle className="mx-auto w-24 h-24 text-green-500 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your survey response has been successfully submitted. 
            We appreciate your time and feedback.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSurvey = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
        {/* User header */}
        {user && (
          <div className="bg-white shadow px-4 py-2 flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="font-medium">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 flex items-center text-sm"
            >
              <LogOut size={16} className="mr-1" />
              Sign Out
            </button>
          </div>
        )}
        
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Question-Specific Video Section */}
            <div className="relative w-full overflow-hidden" style={{ height: 'min(80vh, 500px)' }}>
              <video 
                key={currentQuestion.id}
                src={currentQuestion.videoSrc}
                className="absolute inset-0 w-full h-full object-contain"
                ref={videoRef}
                playsInline
                controls
              />
              {showPlayButton && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer z-10"
                  onClick={() => {
                    if (videoRef.current) {
                      const playPromise = videoRef.current.play();
                      if (playPromise !== undefined) {
                        playPromise.then(() => {
                          setShowPlayButton(false);
                        }).catch(error => {
                          console.error('Play error:', error);
                          // Keep play button visible if play fails
                        });
                      }
                    }
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                    <Play size={40} className="text-blue-500 ml-2" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentQuestion.questionText}
              </h2>

              {currentQuestion.type === "multipleChoice" && (
                <div className="space-y-4">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 
                        ${selectedAnswer === option 
                          ? 'bg-blue-500 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "text" && (
                <div className="space-y-4">
                  <textarea
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg min-h-[120px] focus:border-blue-400 focus:outline-none transition-all"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => handleAnswer(selectedAnswer)}
                  disabled={!selectedAnswer || isLoading}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 
                    ${selectedAnswer && !isLoading
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  <span>
                    {isLoading ? 'Processing...' : currentIndex < questions.length - 1 ? 'Next' : 'Submit'}
                  </span>
                  {!isLoading && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
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
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Survey Submissions</h2>
        {isLoading ? (
          <p>Loading submissions...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : submissions.length === 0 ? (
          <p>No submissions found.</p>
        ) : (
          submissions.map((submission, index) => (
            <div 
              key={submission._id || index} 
              className="bg-white shadow-md rounded-lg p-6 mb-4"
            >
              <h3 className="text-xl font-semibold mb-2">
                Submission #{index + 1}
              </h3>
              <p className="text-gray-600 mb-2">
                Email: {submission.email}
              </p>
              <p className="text-gray-600 mb-2">
                Submitted on: {new Date(submission.timestamp).toLocaleString()}
              </p>
              
              {questions.map((question) => (
                <div key={question.id} className="mb-3">
                  <p className="font-medium">{question.questionText}</p>
                  <p className="text-gray-700">
                    {submission.answers[question.id] || submission.answers[question.id.toString()] || 'No answer'}
                  </p>
                </div>
              ))}
            </div>
          ))
        )}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition mt-4"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    );
  };

  // Show loading indicator while checking user status
  if (isLoading && !user && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Determine what to render based on the current state
  const renderContent = () => {
    // Step 1: If not logged in, show Google login
    if (!user) {
      return renderGoogleLogin();
    }
    
    // Step 2: If logged in but already submitted, show already submitted screen
    if (hasSubmitted && !showThankYou) {
      return renderAlreadySubmitted();
    }
    
    // Step 3: If just submitted, show thank you screen
    if (showThankYou) {
      return renderThankYouScreen();
    }
    
    // Step 4: If viewing submissions
    if (isSubmitted) {
      return renderSubmissions();
    }
    
    // Step 5: Otherwise, show the survey
    return renderSurvey();
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
}

export default App;
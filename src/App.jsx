import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, CheckCircle } from 'lucide-react';
import axios from 'axios';

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
  const videoRef = useRef(null);

  
// Configure axios with the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;
console.log('Using API URL:', API_URL); // For debugging purposes

// Set axios defaults
axios.defaults.baseURL = API_URL;


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

  // Fetch submissions from backend on component mount
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching submissions from:', `${API_URL}/api/submissions`);
        const response = await axios.get('/api/submissions');
        console.log('Submissions received:', response.data);
        setSubmissions(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching submissions:', error.response || error.message);
        setError('Failed to fetch submissions. ' + (error.response?.data?.message || error.message));
        setIsLoading(false);
      }
    };

    if (isSubmitted) {
      fetchSubmissions();
    }
  }, [isSubmitted, API_URL]);

  const resetSurvey = () => {
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer('');
    setUploadedVideos({});
    setIsSubmitted(false);
    setShowThankYou(false);
    setError(null);
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
      setIsLoading(false);
    } catch (error) {
      console.error('Submission error:', error.response || error.message);
      setError('Failed to submit survey. ' + (error.response?.data?.message || error.message));
      alert('Failed to submit survey. Please check console for details.');
      setIsLoading(false);
    }
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
          <button
            onClick={() => {
              resetSurvey();
              setShowThankYou(false);
            }}
            className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition"
          >
            Take Survey Again
          </button>
        </div>
      </div>
    );
  };

  const renderSurvey = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
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
                  videoRef.current.play();
                  setShowPlayButton(false);
                }}
              >
                <div className="w-20 h-20 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
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
          onClick={resetSurvey}
          className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition mt-4"
        >
          Take Survey Again
        </button>
      </div>
    );
  };

  // Determine what to render based on the current state
  const renderContent = () => {
    if (showThankYou) {
      return renderThankYouScreen();
    }
    if (isSubmitted) {
      return renderSubmissions();
    }
    return renderSurvey();
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
}

export default App;
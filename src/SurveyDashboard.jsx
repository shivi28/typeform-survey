import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const SurveyDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfession, setSelectedProfession] = useState('governmentEmployee');
  const [activeTab, setActiveTab] = useState('charts');

  // Get API URL from environment variables or use default
  const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.com';

  // Define colors for charts - used for pie chart
  const COLORS = ['#4299E1', '#68D391', '#F6AD55', '#FC8181', '#9F7AEA', '#63B3ED'];
  
  // Define colors for response options - used for bar charts
  const RESPONSE_COLORS = {
    // For time-based responses
    "Less than 5 years": "#4F46E5", // Indigo
    "5-10 years": "#7C3AED", // Violet
    "10-20 years": "#EC4899", // Pink
    "More than 20 years": "#EF4444", // Red
    
    // For hour-based responses
    "Less than 2 hours": "#4F46E5",
    "2-4 hours": "#7C3AED",
    "4-6 hours": "#EC4899",
    "More than 6 hours": "#EF4444",
    
    // For general responses
    "Yes, all the time": "#4F46E5",
    "Sometimes": "#7C3AED",
    "No, I always organize well": "#EC4899",
    
    // For departments
    "Administration": "#4F46E5",
    "Health": "#7C3AED",
    "Education": "#EC4899",
    "Finance": "#EF4444",
    "Other": "#F59E0B",
    
    // For medical specialties
    "General Practice": "#4F46E5",
    "Surgery": "#7C3AED",
    "Pediatrics": "#EC4899",
    "Other specialty": "#EF4444",
    
    // For technologies
    "Front-end": "#4F46E5",
    "Back-end": "#7C3AED",
    "Full stack": "#EC4899", 
    "DevOps": "#EF4444",
    "Data": "#F59E0B",
    
    // For study methods
    "Reading": "#4F46E5",
    "Practice problems": "#7C3AED",
    "Group study": "#EC4899",
    "Video lectures": "#EF4444",
    "Flashcards": "#F59E0B"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/submissions`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        const responseData = await response.json();
        setData(responseData);
        setLoading(false);
      } catch (err) {
        setError(`Failed to fetch survey data: ${err.message}`);
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [API_URL]);

  // Get unique professions
  const professions = data.length > 0 
    ? [...new Set(data.map(item => item.profession))]
    : ['student', 'governmentEmployee'];

  // Filter data by selected profession
  const filteredData = data.filter(item => item.profession === selectedProfession);

  // Process data for profession distribution (pie chart)
  const professionDistributionData = React.useMemo(() => {
    const counts = data.reduce((acc, item) => {
      acc[item.profession] = (acc[item.profession] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).map(key => ({
      name: getProfessionLabel(key),
      value: counts[key]
    }));
  }, [data]);

  // Helper function to get readable profession labels
  function getProfessionLabel(profession) {
    const labels = {
      student: 'Student',
      itProfessional: 'IT Professional',
      doctor: 'Doctor',
      governmentEmployee: 'Government Employee',
      other: 'Other'
    };
    return labels[profession] || profession;
  }

  // Get questions and their possible answers for the selected profession
  const getQuestionsForProfession = (profession) => {
    const questionSets = {
      student: [
        { 
          id: 1, 
          text: "How many hours do you study per day?",
          options: ["Less than 2 hours", "2-4 hours", "4-6 hours", "More than 6 hours"]
        },
        { 
          id: 3, 
          text: "What study methods do you prefer?",
          options: ["Reading", "Practice problems", "Group study", "Video lectures", "Flashcards"]
        }
      ],
      itProfessional: [
        { 
          id: 1, 
          text: "How many years of experience do you have in IT?",
          options: ["Less than 5 years", "5-10 years", "10-20 years", "More than 20 years"]
        },
        { 
          id: 3, 
          text: "Which technologies do you use most often?",
          options: ["Front-end", "Back-end", "Full stack", "DevOps", "Data"]
        }
      ],
      doctor: [
        { 
          id: 1, 
          text: "What medical specialty do you practice?",
          options: ["General Practice", "Surgery", "Pediatrics", "Other specialty"]
        },
        { 
          id: 3, 
          text: "How many patients do you see per week?",
          options: ["Less than 20", "20-50", "50-100", "More than 100"]
        }
      ],
      governmentEmployee: [
        { 
          id: 1, 
          text: "How long have you worked in the public sector?",
          options: ["Less than 5 years", "5-10 years", "10-20 years", "More than 20 years"]
        },
        { 
          id: 3, 
          text: "What department do you work in?",
          options: ["Administration", "Health", "Education", "Finance", "Other"]
        }
      ],
      other: [
        { 
          id: 1, 
          text: "Do you find yourself procrastinating?",
          options: ["Yes, all the time", "Sometimes", "No, I always organize well"]
        },
        { 
          id: 3, 
          text: "How many hours do you work per week?",
          options: ["Less than 20", "20-40", "40-60", "More than 60"]
        }
      ]
    };
    
    return questionSets[profession] || [];
  };

  // Get response data for a specific question in the format needed for the chart
  const getQuestionResponseData = (question) => {
    if (filteredData.length === 0) {
      // Return the options with zero counts for empty data
      return question.options.map(option => ({
        name: option,
        value: 0,
        color: RESPONSE_COLORS[option] || '#888888'
      }));
    }

    // Get all possible options for this question
    const options = question.options || [];
    
    // Initialize with all options at 0 count
    const initialCounts = {};
    options.forEach(option => {
      initialCounts[option] = 0;
    });

    // Count responses for this question
    const responseCounts = filteredData.reduce((acc, submission) => {
      const answer = submission.answers[question.id];
      if (answer && acc.hasOwnProperty(answer)) {
        acc[answer] += 1;
      }
      return acc;
    }, {...initialCounts});

    // Convert to array format for chart
    return options.map(option => ({
      name: option,
      value: responseCounts[option] || 0,
      color: RESPONSE_COLORS[option] || '#888888'
    }));
  };

  // Render vertical bar chart for a question
  const renderVerticalBarChart = (question) => {
    const questionData = getQuestionResponseData(question);
    
    if (!questionData || questionData.length === 0) {
      return <p className="text-gray-500">No response data available for this question.</p>;
    }
    
    // Find maximum response count for setting domain
    const maxCount = Math.max(...questionData.map(item => item.value), 3); // Minimum of 3 for scale
    const yAxisDomain = [0, Math.ceil(maxCount * 1.2)]; // Add 20% headroom
  
    return (
      <div className="h-72 w-full mt-6"> {/* Added mt-6 for more top margin */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={questionData}
            margin={{ top: 60, right: 10, left: 20, bottom: 10 }}
          >
            {<CartesianGrid strokeDasharray="1 1" /> }
            <XAxis 
              dataKey="name" 
              angle={-35} 
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
              interval={0} // Force all labels to show
            />
            <YAxis 
              allowDecimals={false}
              domain={yAxisDomain}
              label={{ 
                value: 'Number of Responses', 
                angle: -90, 
                position: 'insideLeft', 
                style: { textAnchor: 'middle' },
                offset: -5
              }}
            />
            <Tooltip 
              formatter={(value) => [`${value} response${value !== 1 ? 's' : ''}`, 'Count']}
              labelFormatter={(value) => `Option: ${value}`}
            />
            <Bar 
              dataKey="value"
              name="Responses"
              barSize={30}
              maxBarSize={80}
              radius={[4, 4, 0, 0]}
            >
              {questionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render color legend for response options
  const renderResponseLegend = (question) => {
    const options = question.options || [];
    const responseData = getQuestionResponseData(question);
    
    return (
      <div className="h-72 w-full flex flex-col justify-center">
        <div className="space-y-4">
          {options.map(option => {
            const color = RESPONSE_COLORS[option] || '#888888';
            const response = responseData.find(item => item.name === option);
            const count = response ? response.value : 0;
            
            return (
              <div key={option} className="flex items-center">
                <div 
                  className="w-6 h-6 mr-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                ></div>
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium text-gray-700">{option}</span>
                  {/* <span className="text-sm font-bold text-gray-900 ml-2">{count} response{count !== 1 ? 's' : ''}</span> */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render pie chart for profession distribution
  const renderProfessionPieChart = () => {
    if (professionDistributionData.length === 0) {
      return <p className="text-gray-500">No data available to display profession distribution.</p>;
    }
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Respondent Distribution by Profession</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={professionDistributionData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {professionDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render stats summary
  const renderSummaryStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-800">Total Responses</h3>
          <p className="text-3xl font-bold text-blue-600">{data.length}</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-800">Unique Professions voted</h3>
          <p className="text-3xl font-bold text-green-600">
            {professions.length}
          </p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-purple-800">Latest Response</h3>
          <p className="text-xl font-bold text-purple-600">
            {data.length > 0 ? new Date(data[0].timestamp).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    );
  };

  // Render question cards for charts view - with side-by-side layout
  const renderQuestionCards = () => {
    const questions = getQuestionsForProfession(selectedProfession);
    
    if (questions.length === 0) {
      return <p className="text-gray-500">No questions available for this profession.</p>;
    }
    
    return (
      <div className="grid grid-cols-1 gap-8">
        {questions.map(question => (
          <div key={question.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            {/* Question header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">{question.text}</h3>
            </div>
            
            {/* Two-column layout */}
            <div className="flex flex-col md:flex-row">
              {/* Chart column - left half */}
              <div className="w-full md:w-1/2 p-2 pb-0 md:border-b-0 border-gray-100">
                {renderVerticalBarChart(question)}
              </div>
              
              {/* Legend column - right half - centered vertically and horizontally */}
              <div className="w-full md:w-1/2 p-6 flex justify-center items-center">
                <div className="w-full max-w-md">
                  {renderResponseLegend(question)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-blue-500">Loading survey data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
        <div className="mt-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Survey Results Dashboard</h1>
      
      {data.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800 mb-6">
          <h2 className="text-lg font-semibold mb-2">No Survey Data Available</h2>
          <p>There are no survey responses in the database yet. Data will appear here once participants complete the survey.</p>
        </div>
      ) : (
        <>
          {/* Filter and tab controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-xl border border-gray-50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Profession
              </label>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {professions.map(profession => (
                  <option key={profession} value={profession}>
                    {getProfessionLabel(profession)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sm:ml-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View
              </label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 ${activeTab === 'summary' ? 'bg-orange-800 text-white' : 'bg-white'}`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`px-4 py-2 ${activeTab === 'charts' ? 'bg-orange-800 text-white' : 'bg-white'}`}
                >
                  Charts
                </button>
              </div>
            </div>
          </div>
          
          {/* Dashboard content */}
          {activeTab === 'summary' && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              {renderSummaryStats()}
              {renderProfessionPieChart()}
            </div>
          )}
          
          {activeTab === 'charts' && renderQuestionCards()}
        </>
      )}
    </div>
  );
};

export default SurveyDashboard;
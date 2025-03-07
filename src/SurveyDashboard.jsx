import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const SurveyDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfession, setSelectedProfession] = useState('all');
  const [activeTab, setActiveTab] = useState('summary');

  // Get API URL from environment variables or use default
  const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.com';

  // Define colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use absolute URL instead of relative URL
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

  // Rest of the component remains the same
  // Get unique professions
  const professions = data.length > 0 
    ? ['all', ...new Set(data.map(item => item.profession))]
    : ['all'];

  // Filter data by selected profession
  const filteredData = selectedProfession === 'all' 
    ? data 
    : data.filter(item => item.profession === selectedProfession);

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

  // Process data for the first question of each profession (bar chart)
  const questionResponseData = React.useMemo(() => {
    // Define mapping for first question of each profession type
    const firstQuestions = {
      student: { id: 1, text: "How many hours do you study per day?" },
      itProfessional: { id: 1, text: "How many years of experience do you have in IT?" },
      doctor: { id: 1, text: "What medical specialty do you practice?" },
      governmentEmployee: { id: 1, text: "How long have you worked in the public sector?" },
      other: { id: 1, text: "Do you find yourself procrastinating?" }
    };

    if (filteredData.length === 0) return [];

    // Get the relevant question for the selected profession
    const professionToUse = selectedProfession === 'all' ? 'other' : selectedProfession;
    const targetQuestion = firstQuestions[professionToUse];

    // Count responses for this question
    const responseCounts = filteredData.reduce((acc, submission) => {
      const answer = submission.answers[targetQuestion.id];
      if (answer) {
        acc[answer] = (acc[answer] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.keys(responseCounts).map(answer => ({
      name: answer,
      count: responseCounts[answer]
    }));
  }, [filteredData, selectedProfession]);

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

  // Render bar chart for question responses
  const renderQuestionBarChart = () => {
    if (questionResponseData.length === 0) {
      return <p className="text-gray-500">No response data available for the selected profession.</p>;
    }
    
    const professionToUse = selectedProfession === 'all' ? 'other' : selectedProfession;
    const questions = {
      student: { id: 1, text: "How many hours do you study per day?" },
      itProfessional: { id: 1, text: "How many years of experience do you have in IT?" },
      doctor: { id: 1, text: "What medical specialty do you practice?" },
      governmentEmployee: { id: 1, text: "How long have you worked in the public sector?" },
      other: { id: 1, text: "Do you find yourself procrastinating?" }
    };

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {questions[professionToUse].text}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={questionResponseData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
              <Legend />
              <Bar dataKey="count" name="Responses" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render stats summary
  const renderSummaryStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-800">Total Responses</h3>
          <p className="text-3xl font-bold text-blue-600">{data.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-800">Professions Represented</h3>
          <p className="text-3xl font-bold text-green-600">
            {professions.filter(p => p !== 'all').length}
          </p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-purple-800">Latest Response</h3>
          <p className="text-xl font-bold text-purple-600">
            {data.length > 0 ? new Date(data[0].timestamp).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    );
  };

  // Render text responses summary (for the second question)
  const renderTextResponses = () => {
    const professionToUse = selectedProfession === 'all' ? null : selectedProfession;
    
    // Define the second question for each profession
    const secondQuestions = {
      student: { id: 2, text: "What's your biggest challenge as a student?" },
      itProfessional: { id: 2, text: "What technology trends are you most excited about?" },
      doctor: { id: 2, text: "What healthcare challenges concern you most?" },
      governmentEmployee: { id: 2, text: "What improvements would you suggest for public services?" },
      other: { id: 2, text: "What's your main productivity challenge?" }
    };

    // Filter responses based on profession
    const relevantResponses = professionToUse
      ? filteredData
          .filter(submission => submission.answers && submission.answers[2])
          .map(submission => ({
            email: submission.email,
            answer: submission.answers[2],
            timestamp: new Date(submission.timestamp).toLocaleDateString()
          }))
      : [];

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {professionToUse 
            ? `Text Responses: ${secondQuestions[professionToUse].text}` 
            : 'Select a profession to view text responses'}
        </h3>
        
        {professionToUse ? (
          relevantResponses.length > 0 ? (
            <div className="overflow-auto max-h-96 border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relevantResponses.map((response, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{response.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{response.answer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{response.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No text responses available for this profession.</p>
          )
        ) : (
          <p className="text-gray-500">Please select a specific profession to view text responses.</p>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading survey data...</div>;
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Survey Results Dashboard</h1>
      
      {data.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800 mb-6">
          <h2 className="text-lg font-semibold mb-2">No Survey Data Available</h2>
          <p>There are no survey responses in the database yet. Data will appear here once participants complete the survey.</p>
        </div>
      ) : (
        <>
          {/* Filter controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Profession
              </label>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              >
                {professions.map(profession => (
                  <option key={profession} value={profession}>
                    {profession === 'all' ? 'All Professions' : getProfessionLabel(profession)}
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
                  className={`px-4 py-2 ${activeTab === 'summary' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`px-4 py-2 ${activeTab === 'charts' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Charts
                </button>
                <button
                  onClick={() => setActiveTab('responses')}
                  className={`px-4 py-2 ${activeTab === 'responses' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                >
                  Text Responses
                </button>
              </div>
            </div>
          </div>
          
          {/* Dashboard content */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            {activeTab === 'summary' && (
              <>
                {renderSummaryStats()}
                {renderProfessionPieChart()}
              </>
            )}
            
            {activeTab === 'charts' && (
              <>
                {renderProfessionPieChart()}
                {renderQuestionBarChart()}
              </>
            )}
            
            {activeTab === 'responses' && (
              <>
                {renderTextResponses()}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SurveyDashboard;
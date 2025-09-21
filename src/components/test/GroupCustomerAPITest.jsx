import React, { useState, useEffect } from 'react';
import { groupCustomerService } from '../../services/groupCustomerService';
import { useAlert } from '../ui/Alert';

const GroupCustomerAPITest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { showInfo, AlertComponent } = useAlert();

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing Group Customer API...');
      const response = await groupCustomerService.getAllGroupCustomers(1, 10);
      console.log('API Response:', response);
      setResult(response);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testToken = () => {
    const token = localStorage.getItem('token');
    console.log('Current token:', token);
    showInfo(`Token: ${token ? 'Present' : 'Missing'}`);
  };

  const testDirectFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5050/api/v1/group-customers?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Direct fetch response status:', response.status);
      console.log('Direct fetch response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Direct fetch error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Direct fetch result:', data);
      setResult(data);
    } catch (err) {
      console.error('Direct fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Group Customer API Test</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={testToken}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Check Token
          </button>
          <button
            onClick={testAPI}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Service API
          </button>
          <button
            onClick={testDirectFetch}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Direct Fetch
          </button>
        </div>

        {loading && (
          <div className="text-blue-600">Loading...</div>
        )}

        {error && (
          <div className="text-red-600 bg-red-100 p-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 p-3 rounded">
            <strong>Success!</strong>
            <pre className="mt-2 text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
};

export default GroupCustomerAPITest;

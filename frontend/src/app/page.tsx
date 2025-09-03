'use client';

import { useState, useEffect } from 'react';
import { parsePythonFile, checkHealth, type ApiResponse, type ParsedFunction, type ParsedClass } from '../lib/api';

export default function Home() {
  const [filePath, setFilePath] = useState('../examples/python_project/hello.py');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend health on component mount
  useEffect(() => {
    checkHealth().then((health) => {
      setBackendStatus('status' in health ? 'online' : 'offline');
    });
  }, []);

  const handleParse = async () => {
    if (!filePath.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await parsePythonFile(filePath);
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to parse file' });
    } finally {
      setLoading(false);
    }
  };

  const renderFunction = (func: ParsedFunction, index: number) => (
    <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
      <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400">
        def {func.name}({func.args.join(', ')}) {func.returns ? `-> ${func.returns}` : ''}
      </h3>
      {func.docstring && (
        <p className="text-gray-600 dark:text-gray-300 mt-2 italic">
          {func.docstring}
        </p>
      )}
    </div>
  );

  const renderClass = (cls: ParsedClass, index: number) => (
    <div key={index} className="border rounded-lg p-4 mb-6 bg-blue-50 dark:bg-blue-900/20">
      <h3 className="font-semibold text-xl text-purple-600 dark:text-purple-400">
        class {cls.name}
        {cls.bases.length > 0 && `(${cls.bases.join(', ')})`}
      </h3>
      {cls.docstring && (
        <p className="text-gray-600 dark:text-gray-300 mt-2 italic">
          {cls.docstring}
        </p>
      )}
      {cls.methods.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-lg mb-2">Methods:</h4>
          <div className="space-y-2">
            {cls.methods.map((method, methodIndex) => (
              <div key={methodIndex} className="ml-4 border-l-2 border-purple-300 pl-4">
                <h5 className="font-medium text-green-600 dark:text-green-400">
                  def {method.name}({method.args.join(', ')}) {method.returns ? `-> ${method.returns}` : ''}
                </h5>
                {method.docstring && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1 italic text-sm">
                    {method.docstring}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Code-to-Knowledge Explorer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Parse Python source code into structured knowledge graphs
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              backendStatus === 'online' ? 'bg-green-500' :
              backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Backend: {backendStatus === 'online' ? 'Online' :
                       backendStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Parse Python File
          </h2>

          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="Enter Python file path..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleParse}
              disabled={loading || backendStatus !== 'online'}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Parsing...' : 'Parse File'}
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p>Example: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">../examples/python_project/hello.py</code></p>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              Analysis Results
            </h2>

            {'error' in result ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  Error: {result.error}
                </p>
              </div>
            ) : (
              <div>
                {result.functions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      Functions ({result.functions.length})
                    </h3>
                    {result.functions.map(renderFunction)}
                  </div>
                )}

                {result.classes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      Classes ({result.classes.length})
                    </h3>
                    {result.classes.map(renderClass)}
                  </div>
                )}

                {result.functions.length === 0 && result.classes.length === 0 && (
                  <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                    No functions or classes found in the file.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

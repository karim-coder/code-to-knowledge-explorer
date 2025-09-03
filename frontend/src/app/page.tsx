"use client";

import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import KnowledgeGraph from "../components/KnowledgeGraph";
import {
  parsePythonFile,
  checkHealth,
  type ApiResponse,
  type ParsedFunction,
  type ParsedClass,
} from "../lib/api";

export default function Home() {
  const [filePath, setFilePath] = useState(
    "../examples/python_project/hello.py"
  );
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [activeTab, setActiveTab] = useState<"text" | "graph">("text");

  // Check backend health on component mount
  useEffect(() => {
    checkHealth().then((health) => {
      setBackendStatus("status" in health ? "online" : "offline");
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
      console.error("Parse error:", error);
      setResult({ error: "Failed to parse file" });
    } finally {
      setLoading(false);
    }
  };

  const renderFunction = (func: ParsedFunction, index: number) => {
    const functionCode = `def ${func.name}(${func.args.join(", ")})${
      func.returns ? ` -> ${func.returns}` : ""
    }:
    """${func.docstring || "No docstring available"}"""
    pass`;

    return (
      <div
        key={index}
        className="border rounded-lg overflow-hidden mb-4 bg-gray-900 dark:bg-gray-800 shadow-lg"
      >
        <div className="bg-gray-800 dark:bg-gray-700 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-300">Function</span>
            <span className="text-xs text-gray-500">#{index + 1}</span>
          </div>
        </div>
        <div className="p-0">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              background: "transparent",
            }}
            showLineNumbers={true}
            wrapLines={true}
          >
            {functionCode}
          </SyntaxHighlighter>
        </div>
        <div className="bg-gray-800 dark:bg-gray-700 px-4 py-2 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <span className="font-medium">Args:</span> {func.args.length} |{" "}
            <span className="font-medium">Returns:</span>{" "}
            {func.returns || "None"}
          </div>
        </div>
      </div>
    );
  };

  const renderClass = (cls: ParsedClass, index: number) => {
    const classCode = `class ${cls.name}${
      cls.bases.length > 0 ? `(${cls.bases.join(", ")})` : ""
    }:
    """${cls.docstring || "No class docstring available"}"""

${cls.methods
  .map(
    (method) =>
      `    def ${method.name}(${method.args.join(", ")})${
        method.returns ? ` -> ${method.returns}` : ""
      }:
        """${method.docstring || "No method docstring available"}"""
        pass`
  )
  .join("\n\n")}

    pass`;

    return (
      <div
        key={index}
        className="border rounded-lg overflow-hidden mb-6 bg-gray-900 dark:bg-gray-800 shadow-lg"
      >
        <div className="bg-gray-800 dark:bg-gray-700 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm font-medium text-gray-300">Class</span>
            <span className="text-xs text-gray-500">#{index + 1}</span>
          </div>
        </div>
        <div className="p-0">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              background: "transparent",
            }}
            showLineNumbers={true}
            wrapLines={true}
          >
            {classCode}
          </SyntaxHighlighter>
        </div>
        <div className="bg-gray-800 dark:bg-gray-700 px-4 py-2 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <span className="font-medium">Methods:</span> {cls.methods.length} |{" "}
            <span className="font-medium">Bases:</span>{" "}
            {cls.bases.length > 0 ? cls.bases.join(", ") : "None"}
          </div>
        </div>
      </div>
    );
  };

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
            <div
              className={`w-3 h-3 rounded-full ${
                backendStatus === "online"
                  ? "bg-green-500"
                  : backendStatus === "offline"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Backend:{" "}
              {backendStatus === "online"
                ? "Online"
                : backendStatus === "offline"
                ? "Offline"
                : "Checking..."}
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
              disabled={loading || backendStatus !== "online"}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Parsing..." : "Parse File"}
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p>
              Example:{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                ../examples/python_project/hello.py
              </code>
            </p>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              Analysis Results
            </h2>

            {"error" in result ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  Error: {result.error}
                </p>
              </div>
            ) : (
              <>
                {/* Tab Navigation */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    📄 Text View
                  </button>
                  <button
                    onClick={() => setActiveTab("graph")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === "graph"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    🕸️ Graph View
                  </button>
                </div>

                {/* Text View Tab */}
                {activeTab === "text" && (
                  <div className="space-y-6">
                    {/* Code Metrics Overview */}
                    {result.metrics && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          📊 Code Analysis Dashboard
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {result.metrics.total_lines}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Total Lines
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {result.metrics.function_count}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Functions
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {result.metrics.class_count}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Classes
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {result.metrics.documentation_coverage}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Docs Coverage
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-red-600">
                              {result.metrics.complexity_score}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Complexity Score
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-indigo-600">
                              {result.metrics.relationship_density}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Relationships
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Key Insights */}
                    {result.insights && result.insights.length > 0 && (
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          💡 AI-Powered Insights
                        </h3>
                        <div className="space-y-3">
                          {result.insights.map((insight, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-700"
                            >
                              <span className="text-yellow-500 text-lg mt-1">
                                💭
                              </span>
                              <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {insight}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Architecture Overview */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        🏗️ Architecture Overview
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Code Structure
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Functions:</span>
                              <span className="font-medium">
                                {result.functions?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Classes:</span>
                              <span className="font-medium">
                                {result.classes?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Methods:</span>
                              <span className="font-medium">
                                {result.classes?.reduce(
                                  (sum, cls) => sum + cls.methods.length,
                                  0
                                ) || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Dependencies
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Imports:</span>
                              <span className="font-medium">
                                {result.imports?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Function Calls:</span>
                              <span className="font-medium">
                                {result.relationships?.function_calls?.length ||
                                  0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Method Calls:</span>
                              <span className="font-medium">
                                {result.relationships?.method_calls?.length ||
                                  0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Functions */}
                    {result.functions && result.functions.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          🔧 Functions ({result.functions.length})
                        </h3>
                        <div className="space-y-4">
                          {result.functions.map((func, index) =>
                            renderFunction(func, index)
                          )}
                        </div>
                      </div>
                    )}

                    {/* Classes */}
                    {result.classes && result.classes.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          🏗️ Classes ({result.classes.length})
                        </h3>
                        <div className="space-y-4">
                          {result.classes.map((cls, index) =>
                            renderClass(cls, index)
                          )}
                        </div>
                      </div>
                    )}

                    {/* Imports */}
                    {result.imports && result.imports.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          📦 Dependencies ({result.imports.length})
                        </h3>
                        <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {result.imports.map((imp, index) => (
                              <div
                                key={index}
                                className="text-green-400 font-mono text-sm bg-gray-800 dark:bg-gray-700 p-2 rounded"
                              >
                                {imp.type === "import"
                                  ? `import ${imp.name}${
                                      imp.asname ? ` as ${imp.asname}` : ""
                                    }`
                                  : `from ${imp.module} import ${imp.name}${
                                      imp.asname ? ` as ${imp.asname}` : ""
                                    }`}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {(!result.functions || result.functions.length === 0) &&
                      (!result.classes || result.classes.length === 0) && (
                        <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                          No functions or classes found in the file.
                        </p>
                      )}
                  </div>
                )}

                {/* Graph View Tab */}
                {activeTab === "graph" && (
                  <div>
                    <KnowledgeGraph
                      functions={result.functions}
                      classes={result.classes}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

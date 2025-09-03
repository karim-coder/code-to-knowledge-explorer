// API client for communicating with the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface ParsedFunction {
  name: string;
  args: string[];
  returns: string | null;
  docstring: string | null;
}

export interface ParsedClass {
  name: string;
  bases: string[];
  docstring: string | null;
  methods: ParsedFunction[];
}

export interface ImportInfo {
  name?: string;
  module?: string;
  asname: string | null;
  type: "import" | "from_import";
}

export interface Relationship {
  caller?: string | null;
  callee?: string;
  object?: string;
  method?: string;
  attribute?: string;
  type: "function_call" | "method_call" | "attribute_access";
}

export interface CodeMetrics {
  total_lines: number;
  code_lines: number;
  function_count: number;
  class_count: number;
  complexity_score: number;
  relationship_density: number;
  documentation_coverage: number;
}

export interface ParseResult {
  functions: ParsedFunction[];
  classes: ParsedClass[];
  imports: ImportInfo[];
  relationships: {
    function_calls: Relationship[];
    class_inheritance: Relationship[];
    method_calls: Relationship[];
    attribute_access: Relationship[];
  };
  metrics: CodeMetrics;
  insights: string[];
}

export interface ErrorResult {
  error: string;
}

export type ApiResponse = ParseResult | ErrorResult;

export async function parsePythonFile(filePath: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/parse/python?path=${encodeURIComponent(filePath)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error parsing file:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function checkHealth(): Promise<
  { status: string } | { error: string }
> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking health:", error);
    return {
      error: error instanceof Error ? error.message : "Backend not available",
    };
  }
}

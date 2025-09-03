// API client for communicating with the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ParsedFunction {
  name: string;
  args: string[];
  returns: string | null;
  docstring: string | null;
}

export interface ParsedMethod extends ParsedFunction {}

export interface ParsedClass {
  name: string;
  bases: string[];
  docstring: string | null;
  methods: ParsedMethod[];
}

export interface ParseResult {
  functions: ParsedFunction[];
  classes: ParsedClass[];
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

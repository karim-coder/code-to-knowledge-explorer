"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import dagre from "cytoscape-dagre";
import klay from "cytoscape-klay";

import type {
  ParsedFunction,
  ParsedClass,
  Relationship,
  CodeMetrics,
} from "../lib/api";

// Register layout extensions
cytoscape.use(coseBilkent);
cytoscape.use(dagre);
cytoscape.use(klay);

interface KnowledgeGraphProps {
  functions: ParsedFunction[];
  classes: ParsedClass[];
  relationships?: {
    function_calls: Relationship[];
    class_inheritance: Relationship[];
    method_calls: Relationship[];
    attribute_access: Relationship[];
  };
  metrics?: CodeMetrics;
}

interface NodeData {
  name: string;
  args?: string[];
  returns?: string | null;
  docstring?: string | null;
  bases?: string[];
  methods?: ParsedFunction[];
}

interface GraphNode {
  data: {
    id: string;
    label: string;
    type: "function" | "class" | "method";
    nodeData: NodeData;
  };
}

interface GraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    type: "calls" | "inherits" | "contains";
  };
}

export default function KnowledgeGraph({
  functions,
  classes,
  relationships = {
    function_calls: [],
    class_inheritance: [],
    method_calls: [],
    attribute_access: [],
  },
  metrics,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [layout, setLayout] = useState<"cose" | "dagre" | "klay">("cose");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFunctions, setShowFunctions] = useState(true);
  const [showClasses, setShowClasses] = useState(true);
  const [showMethods, setShowMethods] = useState(true);
  const [showRelationships, setShowRelationships] = useState(true);

  // Transform parsed data into Cytoscape format
  const transformDataToGraph = useCallback((): {
    nodes: GraphNode[];
    edges: GraphEdge[];
  } => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, string>(); // name -> nodeId

    // Add function nodes
    if (showFunctions) {
      functions.forEach((func, index) => {
        if (
          !searchTerm ||
          func.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          const nodeId = `func-${index}`;
          nodes.push({
            data: {
              id: nodeId,
              label: func.name,
              type: "function",
              nodeData: func,
            },
          });
          nodeMap.set(func.name, nodeId);
        }
      });
    }

    // Add class nodes and their methods
    if (showClasses) {
      classes.forEach((cls, classIndex) => {
        if (
          !searchTerm ||
          cls.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          const classId = `class-${classIndex}`;
          nodes.push({
            data: {
              id: classId,
              label: cls.name,
              type: "class",
              nodeData: cls,
            },
          });
          nodeMap.set(cls.name, classId);

          // Add method nodes
          if (showMethods) {
            cls.methods.forEach((method, methodIndex) => {
              if (
                !searchTerm ||
                method.name.toLowerCase().includes(searchTerm.toLowerCase())
              ) {
                const methodId = `method-${classIndex}-${methodIndex}`;
                nodes.push({
                  data: {
                    id: methodId,
                    label: method.name,
                    type: "method",
                    nodeData: method,
                  },
                });

                // Connect class to method
                edges.push({
                  data: {
                    id: `edge-${classId}-${methodId}`,
                    source: classId,
                    target: methodId,
                    type: "contains",
                  },
                });
              }
            });
          }

          // Add inheritance edges
          if (cls.bases.length > 0) {
            cls.bases.forEach((base, baseIndex) => {
              const baseId = nodeMap.get(base) || `base-${base}`;
              if (!nodes.find((n) => n.data.id === baseId)) {
                nodes.push({
                  data: {
                    id: baseId,
                    label: base,
                    type: "class",
                    nodeData: {
                      name: base,
                      bases: [],
                      docstring: null,
                      methods: [],
                    },
                  },
                });
                nodeMap.set(base, baseId);
              }
              edges.push({
                data: {
                  id: `inherit-${classId}-${baseId}-${baseIndex}`,
                  source: classId,
                  target: baseId,
                  type: "inherits",
                },
              });
            });
          }
        }
      });
    }

    // Add relationship edges only if relationships are enabled
    if (showRelationships) {
      relationships.function_calls.forEach((call, index) => {
        if (call.callee && nodeMap.has(call.callee)) {
          const callerId =
            call.caller && nodeMap.has(call.caller)
              ? nodeMap.get(call.caller)
              : null;
          const calleeId = nodeMap.get(call.callee);
          if (callerId && calleeId && callerId !== calleeId) {
            edges.push({
              data: {
                id: `call-${index}`,
                source: callerId,
                target: calleeId,
                type: "calls",
              },
            });
          }
        }
      });

      relationships.method_calls.forEach((call, index) => {
        if (call.object && call.method && nodeMap.has(call.object)) {
          const objectId = nodeMap.get(call.object);
          // Find method node
          const methodNode = nodes.find(
            (n) =>
              n.data.type === "method" &&
              n.data.nodeData.name === call.method &&
              n.data.id.includes(`method-`)
          );
          if (objectId && methodNode) {
            edges.push({
              data: {
                id: `method-call-${index}`,
                source: objectId,
                target: methodNode.data.id,
                type: "calls",
              },
            });
          }
        }
      });
    }

    return { nodes, edges };
  }, [
    functions,
    classes,
    relationships,
    searchTerm,
    showFunctions,
    showClasses,
    showMethods,
    showRelationships,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const { nodes, edges } = transformDataToGraph();

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: "node",
          style: {
            "background-color": (ele: cytoscape.NodeSingular) => {
              switch (ele.data("type")) {
                case "function":
                  return "#3B82F6"; // blue
                case "class":
                  return "#10B981"; // green
                case "method":
                  return "#F59E0B"; // amber
                default:
                  return "#6B7280"; // gray
              }
            },
            label: "data(label)",
            color: "#ffffff",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": (ele: cytoscape.NodeSingular) => {
              // Dynamic font size based on node type and complexity
              const type = ele.data("type");
              const nodeData = ele.data("nodeData");
              if (
                type === "class" &&
                nodeData.methods &&
                nodeData.methods.length > 5
              ) {
                return "14px";
              }
              return "12px";
            },
            "font-weight": "bold",
            width: (ele: cytoscape.NodeSingular) => {
              const type = ele.data("type");
              const nodeData = ele.data("nodeData");
              let baseWidth = 40;

              if (type === "class") {
                baseWidth =
                  60 + (nodeData.methods ? nodeData.methods.length * 3 : 0);
              } else if (type === "function") {
                baseWidth = 50 + (nodeData.args ? nodeData.args.length * 4 : 0);
              } else if (type === "method") {
                baseWidth = 45 + (nodeData.args ? nodeData.args.length * 3 : 0);
              }

              return Math.min(baseWidth, 120); // Cap at 120px
            },
            height: (ele: cytoscape.NodeSingular) => {
              const type = ele.data("type");
              const nodeData = ele.data("nodeData");
              let baseHeight = 35;

              if (type === "class") {
                baseHeight =
                  45 + (nodeData.methods ? nodeData.methods.length * 2 : 0);
              }

              return Math.min(baseHeight, 80); // Cap at 80px
            },
            "border-width": "2px",
            "border-color": "#ffffff",
            "text-wrap": "wrap",
            "text-max-width": "100px",
          },
        },
        {
          selector: "edge",
          style: {
            width: (ele: cytoscape.EdgeSingular) => {
              // Thicker edges for more important relationships
              switch (ele.data("type")) {
                case "calls":
                  return "3px";
                case "inherits":
                  return "4px";
                case "contains":
                  return "2px";
                default:
                  return "2px";
              }
            },
            "line-color": (ele: cytoscape.EdgeSingular) => {
              switch (ele.data("type")) {
                case "calls":
                  return "#EF4444"; // red
                case "inherits":
                  return "#8B5CF6"; // purple
                case "contains":
                  return "#06B6D4"; // cyan
                default:
                  return "#6B7280"; // gray
              }
            },
            "target-arrow-color": (ele: cytoscape.EdgeSingular) => {
              switch (ele.data("type")) {
                case "calls":
                  return "#EF4444";
                case "inherits":
                  return "#8B5CF6";
                case "contains":
                  return "#06B6D4";
                default:
                  return "#6B7280";
              }
            },
            "target-arrow-shape": (ele: cytoscape.EdgeSingular) => {
              switch (ele.data("type")) {
                case "inherits":
                  return "triangle";
                case "contains":
                  return "none";
                default:
                  return "triangle";
              }
            },
            "curve-style": "bezier",
            "line-style": (ele: cytoscape.EdgeSingular) => {
              switch (ele.data("type")) {
                case "contains":
                  return "dashed";
                default:
                  return "solid";
              }
            },
          },
        },
        {
          selector: ":selected",
          style: {
            "border-width": "4px",
            "border-color": "#F97316", // orange
            "background-color": "#FB923C",
          },
        },
        {
          selector: "node[type='class']",
          style: {
            shape: "round-rectangle",
          },
        },
        {
          selector: "node[type='function']",
          style: {
            shape: "ellipse",
          },
        },
        {
          selector: "node[type='method']",
          style: {
            shape: "diamond",
          },
        },
      ],
      layout: {
        name: layout,
        animate: true,
        animationDuration: 1000,
        fit: true,
        padding: 50,
      },
    });

    cyRef.current = cy;

    // Event handlers
    cy.on("tap", "node", (event) => {
      const node = event.target;
      setSelectedNode(node.data("nodeData"));
    });

    cy.on("tap", (event) => {
      if (event.target === cy) {
        setSelectedNode(null);
      }
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [transformDataToGraph, layout]);

  // Update layout when layout changes
  useEffect(() => {
    if (!cyRef.current) return;

    const newLayout = cyRef.current.layout({
      name: layout,
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
    });

    newLayout.run();
  }, [layout]);

  const renderNodeDetails = () => {
    if (!selectedNode) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
          {selectedNode.name}
        </h3>

        <div className="space-y-3">
          {selectedNode.docstring && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                Description
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNode.docstring}
              </p>
            </div>
          )}

          {selectedNode.args && selectedNode.args.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                Parameters ({selectedNode.args.length})
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {selectedNode.args.join(", ")}
              </div>
            </div>
          )}

          {selectedNode.returns && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                Returns
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {selectedNode.returns}
              </div>
            </div>
          )}

          {selectedNode.methods && selectedNode.methods.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                Methods ({selectedNode.methods.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedNode.methods.map((method, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-1 rounded"
                  >
                    <span className="font-medium">{method.name}</span>(
                    {method.args.join(", ")})
                    {method.returns && ` → ${method.returns}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedNode.bases && selectedNode.bases.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                Inherits from
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNode.bases.join(", ")}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Layout:
          </label>
          <select
            value={layout}
            onChange={(e) =>
              setLayout(e.target.value as "cose" | "dagre" | "klay")
            }
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="cose">Force Directed</option>
            <option value="dagre">Hierarchical</option>
            <option value="klay">Tree Layout</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Search:
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search nodes..."
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFunctions}
              onChange={(e) => setShowFunctions(e.target.checked)}
              className="rounded"
            />
            Functions
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showClasses}
              onChange={(e) => setShowClasses(e.target.checked)}
              className="rounded"
            />
            Classes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showMethods}
              onChange={(e) => setShowMethods(e.target.checked)}
              className="rounded"
            />
            Methods
          </label>
        </div>
      </div>

      <div className="flex-1 flex gap-4">
        {/* Graph Container */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div
            ref={containerRef}
            className="w-full h-full min-h-[600px]"
            style={{ background: "#f8fafc" }}
          />
        </div>

        {/* Node Details Panel */}
        <div className="w-80">
          {renderNodeDetails() || (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Click on a node to see details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
          Legend
        </h4>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Function</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rotate-45"></div>
            <span>Method</span>
          </div>
        </div>
        <div className="flex gap-6 text-sm mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-cyan-500"></div>
            <span>Contains</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-purple-500"></div>
            <span>Inherits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500"></div>
            <span>Calls</span>
          </div>
        </div>
      </div>
    </div>
  );
}

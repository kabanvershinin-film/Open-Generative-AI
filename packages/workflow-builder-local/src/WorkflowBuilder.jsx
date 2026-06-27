"use client"

import React from "react";
import { ReactFlowProvider } from "reactflow";
import NodeFlow from "./components/NodeFlow";

export default function Home({ initialNodeSchemas, initialWorkflowData }) {
  return (
    <div className="h-screen w-full min-h-screen">
      <ReactFlowProvider>
        <NodeFlow 
          initialNodeSchemas={initialNodeSchemas} 
          initialWorkflowData={initialWorkflowData} 
        />
      </ReactFlowProvider>
    </div>
  );
}

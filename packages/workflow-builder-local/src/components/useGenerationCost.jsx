import { useState, useEffect } from "react";
import axios from "axios";

export const useGenerationCost = (selectedModel, formValues) => {
  const [generationCost, setGenerationCost] = useState(null);
  const [isRefreshingCost, setIsRefreshingCost] = useState(false);

  useEffect(() => {
    const modelId = typeof selectedModel === 'string' ? selectedModel : selectedModel?.id;
    
    if (!modelId || modelId.includes("passthrough")) {
      setGenerationCost(null);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setIsRefreshingCost(true);
      axios.post("/api/app/calculate_dynamic_cost", {
        task_name: modelId,
        payload: formValues
      })
      .then((response) => {
        setGenerationCost(response.data.cost);
        setIsRefreshingCost(false);
      })
      .catch((error) => {
        console.error("Error fetching cost:", error);
        setGenerationCost(null);
        setIsRefreshingCost(false);
      });
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [selectedModel, formValues]);

  return { generationCost, isRefreshingCost };
};

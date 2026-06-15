import { useState, useEffect } from "react";
import {
  getT2iModels,
  getI2iModels,
  getT2vModels,
  getI2vModels,
  getV2vModels
} from "./models.js";

export function useModelConfig(isAdmin = false) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    t2iModels: getT2iModels(isAdmin),
    i2iModels: getI2iModels(isAdmin),
    t2vModels: getT2vModels(isAdmin),
    i2vModels: getI2vModels(isAdmin),
    v2vModels: getV2vModels(isAdmin),
  });

  useEffect(() => {
    // If we want to fetch dynamic config from an API in the future, 
    // we can set loading to true here and perform the fetch.
    // For now, we just keep it synchronized with the static models.js
    setConfig({
      t2iModels: getT2iModels(isAdmin),
      i2iModels: getI2iModels(isAdmin),
      t2vModels: getT2vModels(isAdmin),
      i2vModels: getI2vModels(isAdmin),
      v2vModels: getV2vModels(isAdmin),
    });
  }, [isAdmin]);

  return { ...config, loading };
}

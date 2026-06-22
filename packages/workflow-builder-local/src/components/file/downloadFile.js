import axios from "axios";
import { toast } from "react-hot-toast";

export const downloadFile = async (file_url, filename = "download") => {
  if (!file_url) {
    toast.error("File URL not found");
    return;
  }

  const response = await axios.post("/api/workflow/cloudfront-signed-url",
    {
      url: file_url
    }
  );

  const signed_url = response.data.signed_url;

  try {
    const downloadResponse = await fetch(signed_url, { mode: "cors" });
    const blob = await downloadResponse.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    toast.error("Download failed");
  }
};

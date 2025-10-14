import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import GigCard from "./GigCard";

function App() {
  // useWidgetProps is reactive - automatically updates when window.openai.toolOutput changes
  const props = useWidgetProps({});

  // Local editable state for user modifications (separate from props)
  const [localGig, setLocalGig] = useState(props);

  // Sync local state when props change (when ChatGPT provides data)
  React.useEffect(() => {
    if (props && Object.keys(props).length > 0) {
      setLocalGig(props);
    }
  }, [props]);

  return (
    <div className="antialiased w-full p-4">
      <GigCard data={localGig} setData={setLocalGig} />
    </div>
  );
}

createRoot(document.getElementById("prompthire-gig-root")).render(<App />);

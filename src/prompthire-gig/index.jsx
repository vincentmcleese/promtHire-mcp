import React from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import GigCard from "./GigCard";

function App() {
  const props = useWidgetProps({
    gig_title: "Sample Freelance Gig",
    gig_description: "This is a demo gig card",
    timeline: "2 weeks",
    budget: "$1000",
    skills_required: ["React", "Tailwind"]
  });

  return (
    <div className="antialiased w-full p-4">
      <GigCard {...props} />
    </div>
  );
}

createRoot(document.getElementById("prompthire-gig-root")).render(<App />);

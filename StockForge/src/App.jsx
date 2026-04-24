import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SentimentDashboard from "./Components/SentimentAnalysisEngineScreen";
import Dashboard from "./Components/Dashboard";
import AlphaSignalAI from "./Components/AlphaSignalAI";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sentiment" element={<SentimentDashboard />} />
        <Route path="/alpha" element={<AlphaSignalAI />} />
      </Routes>
    </Router>
  );
}

export default App;

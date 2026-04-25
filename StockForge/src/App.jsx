import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SentimentDashboard from "./Components/SentimentAnalysisEngineScreen";
import Dashboard from "./Components/Dashboard";
import AlphaSignalAI from "./Components/AlphaSignalAI";
import ModelTraining from "./Components/ModelTrainingAndAnalytics.jsx"
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sentiment" element={<SentimentDashboard />} />
        <Route path="/alpha" element={<AlphaSignalAI />} />
        <Route path="/model" element={<ModelTraining />} />
      </Routes>
    </Router>
  );
}

export default App;

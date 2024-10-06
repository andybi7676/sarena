// EvaluationPanel.js
import React, { useState } from 'react';
import EvaluationAspect from './molecules/EvaluationAspect';

function EvaluationPanel({ ws, clientId, handleNext }) {
  const evaluationAspects = ['Intelligibility', 'Naturalness', 'Overall'];

  const [selections, setSelections] = useState({
    Intelligibility: null,
    Naturalness: null,
    Overall: null,
  });

  const handleSelectionChange = (aspect, selection) => {
    setSelections((prev) => ({ ...prev, [aspect]: selection }));
  };

  const allSelected = Object.values(selections).every((s) => s !== null);

  const handleSend = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const data = {
        type: 'evaluation_submission',
        client_id: clientId,
        intelligibility: selections.Intelligibility,
        naturalness: selections.Naturalness,
        overall: selections.Overall,
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(data));

      // Optionally reset selections after sending
      setSelections({
        Intelligibility: null,
        Naturalness: null,
        Overall: null,
      });
    } else {
      console.error('WebSocket is not open');
    }
  };

  return (
    <div className="w-4/5 h-full flex items-center flex-col mt-4 py-4 rounded-xl bg-gray-800">
      {evaluationAspects.map((aspect) => (
        <EvaluationAspect
          key={aspect}
          aspect={aspect}
          value={selections[aspect]}
          onChange={(selection) => handleSelectionChange(aspect, selection)}
        />
      ))}
      <div className="flex mt-4">
        <button
          className={`mr-4 px-4 py-2 rounded ${
            allSelected
              ? 'bg-blue-500 text-white'
              : 'bg-gray-400 text-gray-700 cursor-not-allowed'
          }`}
          onClick={handleSend}
          disabled={!allSelected}
        >
          Send
        </button>
        <button
          className="px-4 py-2 rounded bg-green-500 text-white"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default EvaluationPanel;

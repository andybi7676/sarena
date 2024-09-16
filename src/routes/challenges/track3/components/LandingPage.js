import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Import any icon library or use SVG icons
import { FaPlus, FaServer } from 'react-icons/fa'; // Using react-icons for example

export default function LandingPage() {
  const [modelNodes, setModelNodes] = useState([
    { host: 'localhost', port: '8080', icon: <FaServer size={50} /> },
  ]);
  const [newNodeHost, setNewNodeHost] = useState('');
  const [newNodePort, setNewNodePort] = useState('');
  const [newNodeIcon, setNewNodeIcon] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  const addModelNode = () => {
    if (newNodeHost.trim() && newNodePort.trim()) {
      setModelNodes([
        ...modelNodes,
        {
          host: newNodeHost.trim(),
          port: newNodePort.trim(),
          icon: newNodeIcon || <FaServer size={50} />,
        },
      ]);
      setNewNodeHost('');
      setNewNodePort('');
      setNewNodeIcon(null);
      setShowAddForm(false);
    }
  };

  const joinModelNode = (node) => {
    const roomId = `${node.host}:${node.port}`;
    navigate(`meeting/${encodeURIComponent(roomId)}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-2xl p-4">
        <p className="font-sans text-2xl text-slate-100 text-center font-semibold mb-6">
          Available Model Nodes
        </p>
        <div className="grid grid-cols-2 gap-4">
          {modelNodes.map((node, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-4 flex flex-col items-center"
            >
              <div className="mb-2">{node.icon}</div>
              <span className="text-white mb-2">{`${node.host}:${node.port}`}</span>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
                onClick={() => joinModelNode(node)}
              >
                Join
              </button>
            </div>
          ))}

          {/* Add Model Node Button */}
          <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
            {!showAddForm ? (
              <button
                className="text-white hover:text-gray-400"
                onClick={() => setShowAddForm(true)}
              >
                <FaPlus size={50} />
              </button>
            ) : (
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Host"
                  value={newNodeHost}
                  onChange={(e) => setNewNodeHost(e.target.value)}
                  className="w-full mb-2 px-2 py-1 rounded bg-gray-700 text-white"
                />
                <input
                  type="text"
                  placeholder="Port"
                  value={newNodePort}
                  onChange={(e) => setNewNodePort(e.target.value)}
                  className="w-full mb-2 px-2 py-1 rounded bg-gray-700 text-white"
                />
                {/* Icon Selection */}
                <div className="mb-2">
                  <label className="text-white">Choose an icon:</label>
                  <div className="flex space-x-2 mt-2">
                    <button
                      className={`p-2 rounded ${
                        newNodeIcon === 'server' ? 'bg-blue-500' : 'bg-gray-700'
                      }`}
                      onClick={() => setNewNodeIcon(<FaServer size={50} />)}
                    >
                      <FaServer size={30} className="text-white" />
                    </button>
                    {/* Add more icons as needed */}
                    <button
                      className={`p-2 rounded ${
                        newNodeIcon === 'custom' ? 'bg-blue-500' : 'bg-gray-700'
                      }`}
                      onClick={() => setNewNodeIcon(<FaPlus size={50} />)}
                    >
                      <FaPlus size={30} className="text-white" />
                    </button>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400 mb-2"
                  onClick={addModelNode}
                >
                  Add
                </button>
                <button
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

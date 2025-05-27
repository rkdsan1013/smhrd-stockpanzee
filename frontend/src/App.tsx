import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="flex space-x-4">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="h-20" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="h-20" alt="React logo" />
        </a>
      </div>
      <h1 className="text-4xl font-bold mt-6">Vite + React + Tailwind</h1>
      <div className="mt-6 p-6 bg-gary-800 rounded-lg shadow-lg text-center">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="ox-4 py-2 bg-blue-500 rounded-md hover:bg-blue-700 transition"
        >
          Count is {count}
        </button>
        <p className="mt-4 text-gray-300">
          Edit <code className="text-yellow-300">src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="mt-6 text-sm text-gray-400">Click on the Vite and React logos to learn more</p>
    </div>
  );
}

export default App;

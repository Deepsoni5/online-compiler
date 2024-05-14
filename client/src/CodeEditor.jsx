// src/CodeEditor.js

import { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react"; // Ensure you're importing from the correct package

function CodeEditor() {
  const [code, setCode] = useState("// type your code here");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  const languageIds = {
    javascript: 63, // Example ID for JavaScript
    python: 71,
    rust: 73,
    solidity: 80, // Example ID for Python
    // Add more mappings as needed
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };
  useEffect(() => {
    console.log("Editor mounted");
    // Additional setup or cleanup could go here
  }, []); // Empty array ensures this runs once on mount

  const handleEditorChange = (newValue, e) => {
    console.log("onChange", { newValue, e });
    setCode(newValue);
  };

  const runCode = async () => {
    const languageId = languageIds[language]; // Get the languageId based on the selected language

    try {
      const response = await fetch("http://localhost:3000/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ languageId, code }), // Send languageId along with code
      });
      console.log(response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      data.stdout == null ? setOutput(data.stderr) : setOutput(data.stdout); // Assuming the backend returns an object with an 'output' field
    } catch (error) {
      console.error("Error:", error);
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <div className="editor-container h-full">
        <div className="options-container flex justify-between p-4 bg-gray-800">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="language-select bg-gray-700 text-white p-2 rounded"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="rust">Rust</option>
            <option value="solidity">Solidity</option>
            {/* Add more languages as needed */}
          </select>
          <button
            onClick={runCode}
            className="run-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Run
          </button>
        </div>
        {/* Ensure the MonacoEditor component can be styled or accepts className prop for styling */}
        <MonacoEditor
          height="60vh"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            automaticLayout: true, // This option helps with resizing
            fontSize: 18,
            autoClosingBrackets: true,
            autoprefixer: true,
            // Set the font size to 18px, adjust as needed
          }} // This option helps with resizing
        />
      </div>
      {/* Display the output below the editor */}
      <div className="output-container mt-4 p-4 bg-gray-900 text-white">
        <h3 className="output-title font-bold">Output:</h3>
        <pre>{output}</pre>
      </div>
    </>
  );
}

export default CodeEditor;

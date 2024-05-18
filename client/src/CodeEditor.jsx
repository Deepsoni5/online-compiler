import { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react"; // Ensure you're importing from the correct package

function CodeEditor() {
  const [code, setCode] = useState("// type your code here");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  const languageIds = {
    javascript: 63,
    python: 71,
    rust: 73,
    solidity: 80,
    motoko: 81,
    // Decode :- Add more mappings as needed
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };
  useEffect(() => {
    console.log("Editor mounted");
  }, []);

  const handleEditorChange = (newValue, e) => {
    console.log("onChange", { newValue, e });
    setCode(newValue);
  };

  const runCode = async () => {
    const languageId = languageIds[language]; // Decode :- Get the languageId based on the selected language

    try {
      const response = await fetch("http://localhost:3000/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ languageId, code }), // Decode :- Send languageId along with code
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log(response);
      const data = await response.json();
      console.log(data);
      data.stdout == null ? setOutput(data.stderr) : setOutput(data.stdout);
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
            <option value="motoko">Motoko</option>
            {/* Decode :- Add more languages as needed */}
          </select>
          <button
            onClick={runCode}
            className="run-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Run
          </button>
        </div>

        <MonacoEditor
          height="60vh"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            automaticLayout: true,
            fontSize: 18,
            autoClosingBrackets: true,
            autoprefixer: true,
          }}
        />
      </div>

      <div className="output-container mt-4 p-4 bg-gray-900 text-white">
        <h3 className="output-title font-bold">Output:</h3>
        <pre>{output}</pre>
      </div>
    </>
  );
}

export default CodeEditor;

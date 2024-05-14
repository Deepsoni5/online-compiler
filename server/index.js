import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Route to compile and execute code
app.post("/compile", async (req, res) => {
  const { languageId, code } = req.body;
  console.log("Received request:", { languageId, code }); // Log the incoming request

  console.log("Using languageId:", languageId); // Log the determined language ID

  try {
    const response = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key":
            "a91b25b81amshf7b9ad8b4b69e7dp1ab4abjsn955240abb7f8",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
        }),
      }
    );

    if (!response.ok) {
      console.error("Judge0 API error:", await response.text()); // Log the error response from Judge0
      throw new Error("Failed to communicate with Judge0 API");
    }

    const jsonResponse = await response.json();
    console.log("Judge0 response:", jsonResponse); // Log the successful response from Judge0

    const token = jsonResponse.token;
    let result = await getSubmissionResult(token);

    res.json(result);
  } catch (error) {
    console.error("Error in /compile route:", error);
    res.status(500).json({ error: "Failed to compile and execute the code." });
  }

  async function getSubmissionResult(token) {
    try {
      let resultResponse = await fetch(
        `https://api.judge0.com/submissions/${token}?base64_encoded=false`,
        {
          headers: {
            "X-RapidAPI-Key":
              "a91b25b81amshf7b9ad8b4b69e7dp1ab4abjsn955240abb7f8",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );
      let result = await resultResponse.json();

      // Polling (consider adding delay and limit the number of attempts in a real scenario)
      while (result.status.id <= 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay for 1 second
        resultResponse = await fetch(
          `https://api.judge0.com/submissions/${token}?base64_encoded=false`,
          {
            headers: {
              "X-RapidAPI-Key":
                "a91b25b81amshf7b9ad8b4b69e7dp1ab4abjsn955240abb7f8",
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );
        result = await resultResponse.json();
      }

      return result;
    } catch (error) {
      console.error("Error getting submission result:", error);
      throw error;
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

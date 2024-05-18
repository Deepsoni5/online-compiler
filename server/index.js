import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";

import solc from "solc";
import mo from "motoko";

import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// decode :- this function compiles the motoko code and retunrns function
async function executeMotoko(code) {
  const motokoCode = code;
  mo.write("Main.mo", motokoCode);

  return { func: mo.candid("Main.mo") };
}
app.post("/compile", async (req, res) => {
  const { languageId, code } = req.body;
  console.log("Received request:", { languageId, code });

  try {
    if (languageId == 80) {
      try {
        const input = {
          language: "Solidity",
          sources: {
            "temp.sol": {
              content: code,
            },
          },
          settings: {
            outputSelection: {
              "*": {
                "*": ["*"],
              },
            },
          },
        };
        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        // Assuming you want to return the compiled contract's ABI and bytecode
        const compiledContracts = Object.keys(output.contracts["temp.sol"]).map(
          (contractName) => {
            return {
              contractName,
              abi: output.contracts["temp.sol"][contractName].abi,
              bytecode:
                output.contracts["temp.sol"][contractName].evm.bytecode.object,
            };
          }
        );
        // Decode :- the whole below commented code is used for deployment solidity contracts
        // const abi = compiledContracts[0].abi;
        // const bytecode = compiledContracts[0].bytecode;
        // const web3 = new Web3(
        //   new Web3.providers.HttpProvider(
        //     "https://mainnet.infura.io/v3/51a370a5ee6a472bac1059c64788901d"
        //   )
        // );
        // async function deployContract() {
        //   try {
        //     const accounts = await web3.eth.getAccounts(); // Get accounts from your Ethereum node

        //     if (accounts.length === 0) {
        //       throw new Error("No accounts found");
        //     }

        //     console.log(
        //       "Attempting to deploy contract from account",
        //       accounts[0]
        //     );

        //     const contract = new web3.eth.Contract(abi);

        //     const contractArguments = []; // Replace arg1, arg2, ... with actual constructor arguments

        //     const deployedContract = await contract
        //       .deploy({
        //         data: bytecode,
        //         arguments: contractArguments,
        //       })
        //       .send({
        //         from: accounts[0],
        //         gas: "1000000", // Adjust gas limit as needed
        //         gasPrice: web3.utils.toWei("10", "gwei"), // Adjust gas price as needed
        //       });

        //     console.log(
        //       "Contract deployed to:",
        //       deployedContract.options.address
        //     );
        //   } catch (error) {
        //     console.error("Error deploying contract:", error);
        //   }
        // }

        // deployContract();
        res.json({ stdout: compiledContracts[0].contractName });
      } catch (error) {
        res.json({ stderr: "Solidity compilation failed." });
      }
    } else if (languageId == 81) {
      try {
        const response = await executeMotoko(code);
        res.json({ stdout: response.func });
      } catch (error) {
        res.json({ stderr: "Motoko compilation error" });
      }
    } else {
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
        console.error("Judge0 API error:", await response.text());
        throw new Error("Failed to communicate with Judge0 API");
      }

      const jsonResponse = await response.json();
      console.log("Judge0 response:", jsonResponse);

      const token = jsonResponse.token;
      let result = await getSubmissionResult(token);

      res.json(result);
    }
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

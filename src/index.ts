import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import * as dotenv from "dotenv";
import Papa from "papaparse";

// 加载环境变量
dotenv.config();

// Optional: Define configuration schema to require configuration at connection time
export const configSchema = z.object({
  DUNE_API_KEY: z.string().describe("Dune API Key (from https://dune.com/docs/api/)"),
  BASE_URL: z.string().optional().default("https://api.dune.com/api/v1").describe("Dune API base url (optional, default: https://api.dune.com/api/v1)"),
});

export default function createStatelessServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "Dune Analytics MCP Server",
    version: "1.0.0",
    description: "Dune Analytics tools",
  });

  // 配置从 config 读取
  const DUNE_API_KEY = config.DUNE_API_KEY;
  const BASE_URL = config.BASE_URL || "https://api.dune.com/api/v1";
  const HEADERS = { "X-Dune-API-Key": DUNE_API_KEY };

  // 获取最新结果工具
  server.tool(
    "get_latest_result",
    "Get the latest results for a specific query ID as a CSV string on dune analytics",
    {
      query_id: z.number().describe("Dune query ID"),
      limit: z.number().default(100).describe("Limit the number of results returned (default: 100)"),
    },
    async ({ query_id, limit }) => {
      try {
        const url = `${BASE_URL}/query/${query_id}/results?limit=${limit}`;
        const response = await axios.get(url, { headers: HEADERS, timeout: 300000 });
        const data = response.data;
        const resultData = data?.result?.rows || [];
        if (!resultData.length) {
          return { content: [{ type: "text", text: "No data available" }] };
        }
        // 转为 CSV
        const csv = Papa.unparse(resultData);
        return { content: [{ type: "text", text: csv }] };
      } catch (e: any) {
        if (e.response) {
          return { content: [{ type: "text", text: `HTTP error fetching query results: ${e.message}` }] };
        }
        return { content: [{ type: "text", text: `Error processing query results: ${e.message}` }] };
      }
    }
  );

  // 运行查询工具
  server.tool(
    "run_query",
    "Run a query by ID and return results as a CSV string on dune analytics",
    {
      query_id: z.number().describe("Dune query ID"),
      limit: z.number().default(100).describe("Limit the number of results returned (default: 100)"),
    },
    async ({ query_id, limit }) => {
      try {
        // 执行查询
        const executeUrl = `${BASE_URL}/query/execute/${query_id}`;
        const executeResponse = await axios.post(executeUrl, {}, { headers: HEADERS, timeout: 300000 });
        const executionData = executeResponse.data;
        const execution_id = executionData?.execution_id;
        if (!execution_id) {
          return { content: [{ type: "text", text: "Failed to start query execution" }] };
        }
        // 轮询状态
        const statusUrl = `${BASE_URL}/execution/${execution_id}/status`;
        let state = "";
        while (true) {
          const statusResponse = await axios.get(statusUrl, { headers: HEADERS });
          const statusData = statusResponse.data;
          state = statusData?.state;
          if (state === "EXECUTING" || state === "PENDING") {
            await new Promise((res) => setTimeout(res, 5000));
          } else if (state === "COMPLETED") {
            break;
          } else {
            return { content: [{ type: "text", text: `Query execution failed with state: ${state}` }] };
          }
        }
        // 获取结果
        const resultsUrl = `${BASE_URL}/execution/${execution_id}/results?limit=${limit}`;
        const resultsResponse = await axios.get(resultsUrl, { headers: HEADERS });
        const resultsData = resultsResponse.data;
        const resultData = resultsData?.result?.rows || [];
        if (!resultData.length) {
          return { content: [{ type: "text", text: "No data available" }] };
        }
        // 转为 CSV
        const csv = Papa.unparse(resultData);
        return { content: [{ type: "text", text: csv }] };
      } catch (e: any) {
        if (e.response) {
          return { content: [{ type: "text", text: `HTTP error running query: ${e.message}` }] };
        }
        return { content: [{ type: "text", text: `Error processing query: ${e.message}` }] };
      }
    }
  );

  // Chainlink revenue data tool
  server.tool(
    "get_chainlink_revenue",
    "Get comprehensive Chainlink revenue data including cumulative revenue, product-wise income, and financial metrics. This tool aggregates data from multiple Dune Analytics queries to provide insights into Chainlink's revenue streams across different products like Feeds, VRF (Verifiable Random Function), CCIP (Cross-Chain Interoperability Protocol), and Automation. The data covers revenue periods from October 2020 to July 2024, showing total product revenue breakdown and cumulative income trends.",
    {
      limit: z.number().default(100).describe("Limit the number of results returned per query (default: 100)"),
    },
    async ({ limit }) => {
      try {
        const queryIds = [3295297, 3300590, 3295297, 3295297, 3295297, 3295297, 3300575, 3295234, 3295196, 3295226, 3294714];
        const results: Array<{ query_id: number; data: any[]; csv: string }> = [];
        
        for (const queryId of queryIds) {
          try {
            const url = `${BASE_URL}/query/${queryId}/results?limit=${limit}`;
            const response = await axios.get(url, { headers: HEADERS, timeout: 300000 });
            const data = response.data;
            const resultData = data?.result?.rows || [];
            
            if (resultData.length > 0) {
              results.push({
                query_id: queryId,
                data: resultData,
                csv: Papa.unparse(resultData)
              });
            }
          } catch (e: any) {
            console.error(`Error fetching query ${queryId}:`, e.message);
          }
        }
        
        if (results.length === 0) {
          return { content: [{ type: "text", text: "No data available from any queries" }] };
        }
        
        // Format results as string instead of merging CSV
        let resultText = `Successfully retrieved data from ${results.length} queries.\n\n`;
        
        for (const result of results) {
          resultText += `=== Query ID: ${result.query_id} ===\n`;
          resultText += `CSV data:\n${result.csv}\n\n`;
        }
        
        return { 
          content: [
            { 
              type: "text", 
              text: resultText
            }
          ] 
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error processing Chainlink revenue data: ${e.message}` }] };
      }
    }
  );

  // Pump.fun data tool
  server.tool(
    "get_pumpfun_data",
    "Get comprehensive Pump.fun platform data including top token creators, active wallets, address distribution, and trader rankings. This tool aggregates data from multiple Dune Analytics queries to provide insights into Pump.fun's ecosystem metrics. The data includes top token creators with metrics like token creation count, graduated tokens, graduation rate, and daily token numbers. It also covers active Pump.fun wallets ranked by realized profits over the past 30 days, total Pumpfun and PumpSwap addresses with volume distribution (excluding bots), and PumpFun trader leaderboards showing wallet addresses, transaction counts, active days, total volume, and rankings with distinction between including and excluding high-frequency bots.",
    {
      limit: z.number().default(100).describe("Limit the number of results returned per query (default: 100)"),
    },
    async ({ limit }) => {
      try {
        const queryIds = [4032586, 5232018, 5239138, 5239155, 5324340];
        const results: Array<{ query_id: number; data: any[]; csv: string }> = [];
        
        for (const queryId of queryIds) {
          try {
            const url = `${BASE_URL}/query/${queryId}/results?limit=${limit}`;
            const response = await axios.get(url, { headers: HEADERS, timeout: 300000 });
            const data = response.data;
            const resultData = data?.result?.rows || [];
            
            if (resultData.length > 0) {
              results.push({
                query_id: queryId,
                data: resultData,
                csv: Papa.unparse(resultData)
              });
            }
          } catch (e: any) {
            console.error(`Error fetching query ${queryId}:`, e.message);
          }
        }
        
        if (results.length === 0) {
          return { content: [{ type: "text", text: "No data available from any queries" }] };
        }
        
        // Format results as string instead of merging CSV
        let resultText = `Successfully retrieved data from ${results.length} queries.\n\n`;
        
        for (const result of results) {
          resultText += `=== Query ID: ${result.query_id} ===\n`;
          resultText += `CSV data:\n${result.csv}\n\n`;
        }
        
        return { 
          content: [
            { 
              type: "text", 
              text: resultText
            }
          ] 
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error processing Pump.fun data: ${e.message}` }] };
      }
    }
  );

  // Solana memecoin launch platforms data tool
  server.tool(
    "get_solana_memecoin_data",
    "Get comprehensive Solana memecoin launch platform ecosystem data including platform performance metrics, daily statistics, and trending tokens. This tool aggregates data from multiple Dune Analytics queries to provide insights into various Solana memecoin launch platforms like Pump.fun, LaunchLab, Moonshot, Believe, LetsBonk, and Boop. The data includes platform statistics such as launched token counts, active addresses, and graduated token numbers. It also covers performance metrics like daily active addresses, daily graduated tokens, market share, and daily deployed token counts. Additionally, it provides trending tokens from the past 24 hours and 7 days with detailed tables showing market cap and launch platforms, highlighting top performers like 'sdmtinggi' and 'INFERNO' on Pump.fun. The tool also includes platform descriptions and independent dashboard links for featured launch platforms.",
    {
      limit: z.number().default(100).describe("Limit the number of results returned per query (default: 100)"),
    },
    async ({ limit }) => {
      try {
        const queryIds = [4010816, 5126341, 5001416, 4006260, 5370965, 5370964, 5073803, 5402837, 4010816, 5126416, 5126361, 5041379, 5374546, 5371447, 5073810, 5131612, 5129526, 5002608, 5126485, 4007266, 5073823, 5002622, 5137851, 5138002];
        const results: Array<{ query_id: number; data: any[]; csv: string }> = [];
        
        for (const queryId of queryIds) {
          try {
            const url = `${BASE_URL}/query/${queryId}/results?limit=${limit}`;
            const response = await axios.get(url, { headers: HEADERS, timeout: 300000 });
            const data = response.data;
            const resultData = data?.result?.rows || [];
            
            if (resultData.length > 0) {
              results.push({
                query_id: queryId,
                data: resultData,
                csv: Papa.unparse(resultData)
              });
            }
          } catch (e: any) {
            console.error(`Error fetching query ${queryId}:`, e.message);
          }
        }
        
        if (results.length === 0) {
          return { content: [{ type: "text", text: "No data available from any queries" }] };
        }
        
        // Format results as string instead of merging CSV
        let resultText = `Successfully retrieved data from ${results.length} queries.\n\n`;
        
        for (const result of results) {
          resultText += `=== Query ID: ${result.query_id} ===\n`;
          resultText += `CSV data:\n${result.csv}\n\n`;
        }
        
        return { 
          content: [
            { 
              type: "text", 
              text: resultText
            }
          ] 
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error processing Solana memecoin data: ${e.message}` }] };
      }
    }
  );

  // DEX trading data tool
  server.tool(
    "get_dex_trading_data",
    "Get comprehensive DEX (Decentralized Exchange) trading data including volume metrics, unique trading addresses, market share analysis, and platform rankings. This tool aggregates data from multiple Dune Analytics queries to provide insights into DEX trading volumes across different time periods (24 hours, 7 days, 30 days, and 12 months), with total 12-month volume reaching $2.7 trillion. It covers unique trading addresses exceeding 210 million total addresses. The data includes market share analysis by trading volume for DEXs, frontend market share, and Solana DEX trading volume. It also provides DEX and aggregator rankings based on 7-day and 24-hour trading volumes, with Pancakeswap leading among DEXs and 1inch topping the aggregator rankings. The tool explains the methodology used for calculating USD trading volumes and trader counts, noting that some trading volume may be omitted for uncommon tokens and proxy contract interactions are counted as single traders.",
    {
      limit: z.number().default(100).describe("Limit the number of results returned per query (default: 100)"),
    },
    async ({ limit }) => {
      try {
        const queryIds = [4234, 4235, 21693, 4319, 4319, 2180075, 4388, 21689, 4323, 4323, 1847, 4424, 3084516, 3084516, 3364122, 3155213, 2687239, 7486, 8243, 14138];
        const results: Array<{ query_id: number; data: any[]; csv: string }> = [];
        
        for (const queryId of queryIds) {
          try {
            const url = `${BASE_URL}/query/${queryId}/results?limit=${limit}`;
            const response = await axios.get(url, { headers: HEADERS, timeout: 300000 });
            const data = response.data;
            const resultData = data?.result?.rows || [];
            
            if (resultData.length > 0) {
              results.push({
                query_id: queryId,
                data: resultData,
                csv: Papa.unparse(resultData)
              });
            }
          } catch (e: any) {
            console.error(`Error fetching query ${queryId}:`, e.message);
          }
        }
        
        if (results.length === 0) {
          return { content: [{ type: "text", text: "No data available from any queries" }] };
        }
        
        // Format results as string instead of merging CSV
        let resultText = `Successfully retrieved data from ${results.length} queries.\n\n`;
        
        for (const result of results) {
          resultText += `=== Query ID: ${result.query_id} ===\n`;
          resultText += `CSV data:\n${result.csv}\n\n`;
        }
        
        return { 
          content: [
            { 
              type: "text", 
              text: resultText
            }
          ] 
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error processing DEX trading data: ${e.message}` }] };
      }
    }
  );

  return server.server;
}

# Dune Analytics MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to Dune Analytics data through various specialized tools for blockchain analytics and DeFi insights.

## Features

This MCP server offers six powerful tools for accessing and analyzing Dune Analytics data:

### 1. `get_latest_result`
Get the latest results for a specific query ID as a CSV string on Dune Analytics.

**Parameters:**
- `query_id` (number): Dune query ID
- `limit` (number, optional): Limit the number of results returned (default: 100)

### 2. `run_query`
Run a query by ID and return results as a CSV string on Dune Analytics. This tool executes the query and waits for completion before returning results.

**Parameters:**
- `query_id` (number): Dune query ID
- `limit` (number, optional): Limit the number of results returned (default: 100)

### 3. `get_chainlink_revenue`
Get comprehensive Chainlink revenue data including cumulative revenue, product-wise income, and financial metrics. This tool aggregates data from multiple Dune Analytics queries to provide insights into Chainlink's revenue streams across different products like Feeds, VRF (Verifiable Random Function), CCIP (Cross-Chain Interoperability Protocol), and Automation. The data covers revenue periods from October 2020 to July 2024, showing total product revenue breakdown and cumulative income trends.

**Parameters:**
- `limit` (number, optional): Limit the number of results returned per query (default: 100)

### 4. `get_pumpfun_data`
Get comprehensive Pump.fun platform data including top token creators, active wallets, address distribution, and trader rankings. This tool aggregates data from multiple Dune Analytics queries to provide insights into Pump.fun's ecosystem metrics. The data includes top token creators with metrics like token creation count, graduated tokens, graduation rate, and daily token numbers. It also covers active Pump.fun wallets ranked by realized profits over the past 30 days, total Pumpfun and PumpSwap addresses with volume distribution (excluding bots), and PumpFun trader leaderboards showing wallet addresses, transaction counts, active days, total volume, and rankings with distinction between including and excluding high-frequency bots.

**Parameters:**
- `limit` (number, optional): Limit the number of results returned per query (default: 100)

### 5. `get_solana_memecoin_data`
Get comprehensive Solana memecoin launch platform ecosystem data including platform performance metrics, daily statistics, and trending tokens. This tool aggregates data from multiple Dune Analytics queries to provide insights into various Solana memecoin launch platforms like Pump.fun, LaunchLab, Moonshot, Believe, LetsBonk, and Boop. The data includes platform statistics such as launched token counts, active addresses, and graduated token numbers. It also covers performance metrics like daily active addresses, daily graduated tokens, market share, and daily deployed token counts. Additionally, it provides trending tokens from the past 24 hours and 7 days with detailed tables showing market cap and launch platforms, highlighting top performers like 'sdmtinggi' and 'INFERNO' on Pump.fun. The tool also includes platform descriptions and independent dashboard links for featured launch platforms.

**Parameters:**
- `limit` (number, optional): Limit the number of results returned per query (default: 100)

### 6. `get_dex_trading_data`
Get comprehensive DEX (Decentralized Exchange) trading data including volume metrics, unique trading addresses, market share analysis, and platform rankings. This tool aggregates data from multiple Dune Analytics queries to provide insights into DEX trading volumes across different time periods (24 hours, 7 days, 30 days, and 12 months), with total 12-month volume reaching $2.7 trillion. It covers unique trading addresses exceeding 210 million total addresses. The data includes market share analysis by trading volume for DEXs, frontend market share, and Solana DEX trading volume. It also provides DEX and aggregator rankings based on 7-day and 24-hour trading volumes, with Pancakeswap leading among DEXs and 1inch topping the aggregator rankings. The tool explains the methodology used for calculating USD trading volumes and trader counts, noting that some trading volume may be omitted for uncommon tokens and proxy contract interactions are counted as single traders.

**Parameters:**
- `limit` (number, optional): Limit the number of results returned per query (default: 100)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd donut-dune-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your Dune API key:
```
DUNE_API_KEY=your_dune_api_key_here
```

## Configuration

The server requires the following configuration parameters:

- `DUNE_API_KEY` (required): Your Dune API key from https://dune.com/docs/api/
- `BASE_URL` (optional): Dune API base URL (default: https://api.dune.com/api/v1)
- `debug` (optional): Enable debug logging (default: false)

## Data Sources

This MCP server aggregates data from various Dune Analytics queries covering:

- **Chainlink Revenue**: 11 queries covering revenue streams and financial metrics
- **Pump.fun Platform**: 5 queries covering token creators, wallets, and trader rankings
- **Solana Memecoin Platforms**: 24 queries covering launch platforms and ecosystem metrics
- **DEX Trading**: 20 queries covering trading volumes, market shares, and platform rankings

## API Endpoints

All tools return data in CSV format for easy integration and analysis. The server handles:

- Rate limiting and timeout management (5-minute timeouts)
- Error handling for individual query failures
- Data aggregation and CSV conversion
- Comprehensive logging for debugging


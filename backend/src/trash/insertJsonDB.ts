// File: src/insertJsonDB.ts
import fs from "fs/promises";
import pool from "../config/db"; // Import DB connection pool from src/config/db.ts
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define interface for JSON data structure
interface Coin {
  symbol: string;
  name: string;
  market: string;
}

async function insertJsonToDb(): Promise<void> {
  try {
    // 1. List of JSON files to process (Windows 절대 경로 직접 작성)
    const jsonFiles = [
      "C:\\Users\\SMHRD\\smhrd-stockpanzee\\backend\\src\\trash\\binance_all_listed_coin2.json",
      "C:\\Users\\SMHRD\\smhrd-stockpanzee\\backend\\src\\trash\\us_listed_companies.json",
      "C:\\Users\\SMHRD\\smhrd-stockpanzee\\backend\\src\\trash\\krx_basic_info.json",
    ];

    // 2. Process each JSON file
    for (const jsonPath of jsonFiles) {
      try {
        // Read JSON file
        const rawData = await fs.readFile(jsonPath, "utf-8");
        const coins: Coin[] = JSON.parse(rawData);

        // 3. Batch insert data into assets table
        const query = `
          INSERT INTO assets (symbol, name, market)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            market = VALUES(market),
            updated_at = CURRENT_TIMESTAMP;
        `;
        const values = coins.map((coin) => [coin.symbol, coin.name, coin.market]);

        // Execute query using connection pool
        // @ts-ignore
        await pool.query(query, [values]);
        console.log(`✅ Inserted ${coins.length} records from ${jsonPath}`);
      } catch (fileError) {
        console.error(
          `❌ Error processing ${jsonPath}:`,
          fileError instanceof Error ? fileError.message : fileError,
        );
      }
    }

    console.log("✅ All data insertion completed");
  } catch (error) {
    console.error("❌ Error occurred:", error instanceof Error ? error.message : error);
  }
}

// Execute the script
insertJsonToDb();

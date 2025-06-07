// backend/src/token.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function getAccessToken(): Promise<string> {
  const url = 'https://openapi.koreainvestment.com:9443/oauth2/tokenP';
  const response = await axios.post(url, {
    grant_type: 'client_credentials',
    appkey: process.env.APP_KEY,
    appsecret: process.env.APP_SECRET,
  });
  return response.data.access_token;
}

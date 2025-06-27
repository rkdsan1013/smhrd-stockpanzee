// /frontend/src/utils/googleAuth.ts
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
console.log("REDIRECT_URI:", REDIRECT_URI);

export function getGoogleAuthUrl() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: [
      "openid",
      "profile",
      "email"
    ].join(" "),
    prompt: "consent"
  };
  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

// Decoding base64 URL-safe token
export default function decodeToken(token) {
  // Decode the base64 URL-safe token
  const decoded = atob(token.replace(/_/g, "/").replace(/-/g, "+"));

  // Split the decoded token into message and signature
  const parts = decoded.split("|");
  const message = parts.slice(0, -1).join("|"); // all except last part
  console.log(message);

  return message;
}

// Helper function to generate a secure verification code
export function generateVerificationCode(): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 32; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

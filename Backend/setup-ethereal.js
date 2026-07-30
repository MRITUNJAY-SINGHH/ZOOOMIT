import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

async function main() {
  const testAccount = await nodemailer.createTestAccount();
  
  console.log("Ethereal Test Account created!");
  console.log("User: %s", testAccount.user);
  console.log("Pass: %s", testAccount.pass);
  console.log("SMTP Host: %s", testAccount.smtp.host);
  console.log("SMTP Port: %s", testAccount.smtp.port);
  
  const envPath = path.join(process.cwd(), '.env');
  let envFile = fs.readFileSync(envPath, 'utf8');
  
  // Replace SMTP_HOST etc if they exist
  const replacements = {
    SMTP_HOST: testAccount.smtp.host,
    SMTP_PORT: testAccount.smtp.port,
    SMTP_USER: testAccount.user,
    SMTP_PASS: testAccount.pass,
    FROM_EMAIL: testAccount.user,
    FROM_NAME: 'Zooom System'
  };
  
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envFile)) {
      envFile = envFile.replace(regex, `${key}=${value}`);
    } else {
      envFile += `\n${key}=${value}`;
    }
  }
  
  fs.writeFileSync(envPath, envFile);
  console.log("Updated .env with Ethereal SMTP credentials.");
}

main().catch(console.error);

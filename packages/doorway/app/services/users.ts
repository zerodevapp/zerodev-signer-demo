import fs from 'fs';
import path from 'path';

const CSV_FILE_PATH = path.join(process.cwd(), 'users.csv');

export interface User {
  id: number;
  email: string;
  subOrganizationId: string;
}

function ensureCSVExists() {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    fs.writeFileSync(CSV_FILE_PATH, 'id,email,subOrganizationId\n');
  }
}

function getNextId(): number {
  ensureCSVExists();
  const content = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length <= 1) return 1;

  const lastLine = lines[lines.length - 1];
  const lastId = parseInt(lastLine.split(',')[0]);
  return lastId + 1;
}

export async function createUser({
  email,
  subOrganizationId,
}: {
  email: string;
  subOrganizationId: string;
}): Promise<User> {
  ensureCSVExists();

  const id = getNextId();
  const csvLine = `${id},${email},${subOrganizationId}\n`;

  fs.appendFileSync(CSV_FILE_PATH, csvLine);

  return { id, email, subOrganizationId };
}

export async function getUser({
  email,
}: {
  email: string;
}): Promise<User | null> {
  ensureCSVExists();

  const content = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const lines = content.trim().split('\n');

  for (let i = 1; i < lines.length; i++) {
    const [id, userEmail, subOrganizationId] = lines[i].split(',');
    if (userEmail === email) {
      return {
        id: parseInt(id),
        email: userEmail,
        subOrganizationId,
      };
    }
  }

  return null;
}

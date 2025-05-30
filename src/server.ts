import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import router from './routes';
import cors from 'cors';
import { execSync } from 'child_process';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  // origin: 'https://lgd-dev-star-centi-onboarding.vercel.app',
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'uploads')));

app.use('/api', router);

try {
  // Find the PID(s) using port 5000
  const result = execSync('netstat -ano | findstr :5000').toString();
  const lines = result.split('\n').filter(line => line.trim() !== '');
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      // Kill the process using the PID
      execSync(`taskkill /PID ${pid} /F`);
      console.log(`Killed process on port 5000 (PID: ${pid})`);
    }
  }
} catch (err) {
  // It's OK if nothing is running on port 5000
  console.log('No process found on port 5000 or already killed.');
}

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

// secret_YcwGHS8NoWglAGJc
// token_X9piEd5n
// token_V84FjM04
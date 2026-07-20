import { pool } from './src/db';
import bcrypt from 'bcryptjs';

async function testBruteForce() {
  const hashes = [
    '$2a$10$kUZCp40o4sRksLADFf5xiuN9HKTGBbH4s4UFHHCfS3WYJJaWncc7i', // abc@gmail.com
    '$2a$10$3gJAfyWqKNRCAXsgRvBBF.yMKw50eykLO7KVrC7..bVlmldKiTYAq', // ashraf@gmail.com
    '$2a$10$Q5/eWOzVjB5HwjC3rQKA1eGKC4szTi6AMTUhf7hKzo56BMBsToEoq', // umarajmla@gmail.com
  ];

  const candidatePasswords = [
    'FalconSwift123',
    'FalconSwift@123',
    'student123',
    'password',
    'password123',
    '123456',
    '12345678',
    '123456789',
    '+924324213213', // abc
    '+923120612443', // ashraf
    '+923486676159', // umarajmla
    'abc@gmail.com',
    'ashraf@gmail.com',
    'umarajmla@gmail.com',
  ];

  for (const hash of hashes) {
    let found = false;
    for (const pwd of candidatePasswords) {
      if (await bcrypt.compare(pwd, hash)) {
        console.log(`Hash ${hash} matches password: "${pwd}"`);
        found = true;
        break;
      }
    }
    if (!found) console.log(`Hash ${hash} did not match any candidates.`);
  }
}

testBruteForce();

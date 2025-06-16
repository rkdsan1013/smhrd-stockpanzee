// /backend/src/models/authQueries.ts
export const SELECT_USER_BY_EMAIL = `
  SELECT * FROM users 
  WHERE email = ?
`;

export const INSERT_USER = `
  INSERT INTO users (uuid, email, password)
  VALUES (?, ?, ?)
`;

export const INSERT_USER_PROFILE = `
  INSERT INTO user_profiles (uuid, name)
  VALUES (?, ?)
`;

export const SELECT_USER_BY_UUID = `
  SELECT * FROM users
  WHERE uuid = ?
`;

// /backend/src/models/authQueries.ts
export const SELECT_USER_BY_EMAIL = `
  SELECT uuid, email, password
  FROM users
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
  SELECT u.uuid, u.email, up.name AS username, up.avatar_url
  FROM users u
  JOIN user_profiles up ON u.uuid = up.uuid
  WHERE u.uuid = ?
`;

/**
 * 프로필 수정용 UPDATE 쿼리들
 */
export const UPDATE_USER_EMAIL = `
  UPDATE users
  SET email = ?
  WHERE uuid = ?
`;

export const UPDATE_USER_PASSWORD = `
  UPDATE users
  SET password = ?
  WHERE uuid = ?
`;

export const UPDATE_USER_PROFILE = `
  UPDATE user_profiles
  SET name = ?
  WHERE uuid = ?
`;

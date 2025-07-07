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
  INSERT INTO user_profiles (uuid, name, avatar_url)
  VALUES (?, ?, ?)
`;

export const SELECT_USER_BY_UUID = `
  SELECT
    u.uuid,
    u.email,
    p.name   AS username,
    p.avatar_url
  FROM users u
  JOIN user_profiles p
    ON u.uuid = p.uuid
  WHERE u.uuid = ?
`;

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

export const DELETE_LIKES_BY_USER = `
  DELETE FROM likes
  WHERE user_uuid = ?
`;

export const DELETE_FAVORITES_BY_USER = `
  DELETE FROM user_favorites
  WHERE user_uuid = ?
`;

export const DELETE_COMMENTS_BY_USER = `
  DELETE FROM comments
  WHERE writer_uuid = ?
`;

export const DELETE_POSTS_BY_USER = `
  DELETE FROM community
  WHERE writer_uuid = ?
`;

export const DELETE_PROFILE_BY_USER = `
  DELETE FROM user_profiles
  WHERE uuid = ?
`;

export const DELETE_USER = `
  DELETE FROM users
  WHERE uuid = ?
`;

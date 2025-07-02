// /backend/src/utils/validator.ts
import validator from "validator";

export interface SignUpInput {
  username: string;
  email: string;
  password: string;
}

export interface SignUpErrors {
  username?: string;
  email?: string;
  password?: string;
}

/**
 * 회원가입용 입력값 검증
 */
export function validateSignUp(input: SignUpInput): SignUpErrors {
  const errors: SignUpErrors = {};

  // 사용자 이름: 빈값 검사 + 최소 2글자
  if (validator.isEmpty(input.username.trim())) {
    errors.username = "사용자 이름을 입력해주세요.";
  } else if (!validator.isLength(input.username.trim(), { min: 2 })) {
    errors.username = "사용자 이름은 최소 2글자 이상이어야 합니다.";
  }

  // 이메일 형식 검사
  if (validator.isEmpty(input.email.trim())) {
    errors.email = "이메일을 입력해주세요.";
  } else if (!validator.isEmail(input.email.trim())) {
    errors.email = "올바른 이메일 형식이 아닙니다.";
  }

  // 비밀번호: 빈값 검사 + 최소 8글자
  if (validator.isEmpty(input.password)) {
    errors.password = "비밀번호를 입력해주세요.";
  } else if (!validator.isLength(input.password, { min: 8 })) {
    errors.password = "비밀번호는 최소 8자 이상이어야 합니다.";
  }

  return errors;
}

import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  AuthCodeInput,
  EmailInput,
  Input,
  PasswordInput,
} from '@/components/atoms/Input';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import userService from '@/services/userService';
import useUserAuthStore from '@/stores/userAuthStore';
import { validateName } from '@/utils/validation';

interface SignupData {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
}

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.includes('@dutymate.demo');

const validatePassword = (password: string) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

const SignupForm = () => {
  const navigate = useNavigate();
  const { setTimeout } = useUserAuthStore();
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
  });
  const [isAgreed, setIsAgreed] = useState(false);

  const [error, setError] = useState<{
    email?: string;
    password?: string;
    passwordConfirm?: string;
    name?: string;
  }>({});

  const {
    // email,
    setEmail,
    authCode,
    setAuthCode,
    authCodeSent,
    authCodeStatus,
    isVerified,
    timer,
    emailError,
    isSending,
    sendCode,
    verifyCode,
    resetVerification,
  } = useEmailVerification('signup');

  // const handleKakaoSignup = () => {
  // 	window.location.href = import.meta.env.VITE_KAKAO_LOGIN_URL;
  // };
  // const handleGoogleSignup = () => {
  // 	window.location.href = import.meta.env.VITE_GOOGLE_LOGIN_URL;
  // };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData((prevData) => ({ ...prevData, [name]: value }));

    let errorMessage = '';
    if (name === 'email') {
      setEmail(value);
      if (!validateEmail(value.trim()))
        errorMessage = '올바른 이메일 형식이 아닙니다.';
    } else if (name === 'password') {
      if (!validatePassword(value.trim()))
        errorMessage = '8자 이상, 숫자 및 특수문자를 포함해야 합니다.';
      if (
        signupData.passwordConfirm &&
        value.trim() !== signupData.passwordConfirm.trim()
      ) {
        setError((prev) => ({
          ...prev,
          passwordConfirm: '비밀번호가 일치하지 않습니다.',
        }));
      }
    } else if (name === 'passwordConfirm') {
      if (value.trim() !== signupData.password.trim())
        errorMessage = '비밀번호가 일치하지 않습니다.';
    } else if (name === 'name') {
      const nameValidation = validateName(value.trim());
      if (!nameValidation.isValid) {
        errorMessage = nameValidation.message;
      }
    }
    setError((prevError) => ({ ...prevError, [name]: errorMessage }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;
    let newErrors: typeof error = {};

    if (!signupData.email.trim() || !validateEmail(signupData.email.trim())) {
      newErrors.email = !signupData.email.trim()
        ? '이메일을 입력해 주세요.'
        : '올바른 이메일 형식이 아닙니다.';
      isValid = false;
    }
    if (
      !signupData.password.trim() ||
      !validatePassword(signupData.password.trim())
    ) {
      newErrors.password = !signupData.password.trim()
        ? '비밀번호를 입력해주세요.'
        : '비밀번호는 8자 이상, 숫자 및 특수문자를 포함해야 합니다.';
      isValid = false;
    }
    if (
      !signupData.passwordConfirm.trim() ||
      signupData.passwordConfirm.trim() !== signupData.password.trim()
    ) {
      newErrors.passwordConfirm = !signupData.passwordConfirm.trim()
        ? '비밀번호 확인을 입력해주세요.'
        : '비밀번호가 일치하지 않습니다.';
      isValid = false;
    }
    if (!signupData.name.trim()) {
      newErrors.name = '이름을 입력해 주세요.';
      isValid = false;
    } else {
      const nameValidation = validateName(signupData.name.trim());
      if (!nameValidation.isValid) {
        newErrors.name = nameValidation.message;
        isValid = false;
      }
    }
    if (!isAgreed) {
      toast.error('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    if (!isValid) {
      setError(newErrors);
      return;
    }

    try {
      await userService.checkEmail(signupData.email.trim());
      await userService.signup({
        email: signupData.email.trim(),
        password: signupData.password.trim(),
        passwordConfirm: signupData.passwordConfirm.trim(),
        name: signupData.name.trim(),
      });
      setTimeout(false);
      sessionStorage.removeItem('demo-start-time');
      toast.success('정상적으로 회원가입 되었습니다.');
      navigate('/login');
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          setError((prev) => ({ ...prev, email: '이미 가입된 이메일입니다.' }));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(error.message);
      }
    }
  };

  useEffect(() => {
    if (timer === 0 && authCodeSent && !isVerified) {
      resetVerification();
      setSignupData((prev) => ({ ...prev, email: '' }));
      toast.error('인증 시간이 만료되었습니다. 다시 시도해주세요.');
    }
  }, [timer, authCodeSent]);

  return (
    <div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] w-[20rem] px-[2rem] py-[2rem] sm:w-[23rem] sm:px-[2.5rem] sm:py-[2.5rem] lg:w-[26rem] lg:px-[3rem] lg:py-[3rem]">
      <form onSubmit={handleSignupSubmit} className="lg:block">
        <span className="font-medium text-gray-900 text-base sm:text-lg">
          회원가입
        </span>
        <div className="space-y-[0.25rem] sm:space-y-[0.5rem]">
          <EmailInput
            id="signup-email"
            label=""
            name="email"
            value={signupData.email}
            onChange={handleSignupChange}
            error={emailError || error.email}
            placeholder="이메일"
            disabled={authCodeSent || isVerified}
            autoComplete="username"
          />
          {!authCodeSent && (
            <button
              type="button"
              className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] bg-primary-20 text-primary-dark rounded"
              onClick={sendCode}
              disabled={isSending}
            >
              {isSending ? '발송 중...' : '인증번호 발송'}
            </button>
          )}
          {authCodeSent && (
            <AuthCodeInput
              id="signup-authcode"
              name="authCode"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              timer={timer}
              onVerifyClick={verifyCode}
              isVerified={isVerified}
              status={authCodeStatus}
              error={
                authCodeStatus === 'error'
                  ? '인증 코드가 일치하지 않습니다.'
                  : undefined
              }
              successText={
                authCodeStatus === 'success' ? '인증되었습니다.' : undefined
              }
            />
          )}
          {isVerified && (
            <div>
              <PasswordInput
                id="signup-password"
                label=""
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                error={error.password}
                placeholder="비밀번호"
                autoComplete="new-password"
              />
              <PasswordInput
                id="signup-password-confirm"
                label=""
                name="passwordConfirm"
                value={signupData.passwordConfirm}
                onChange={handleSignupChange}
                error={error.passwordConfirm}
                placeholder="비밀번호 확인"
                autoComplete="new-password"
              />
              <Input
                id="signup-name"
                name="name"
                label=""
                value={signupData.name}
                onChange={handleSignupChange}
                error={error.name}
                placeholder="이름"
                autoComplete="name"
              />

              <div className="mt-[1rem] sm:mt-[1.5rem] flex justify-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="signup-agreement"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="w-[0.875rem] h-[0.875rem] sm:w-[1rem] sm:h-[1rem] text-primary-dark"
                  />
                  <label
                    htmlFor="signup-agreement"
                    className="ml-[0.375rem] text-[0.75rem] sm:text-[0.875rem] text-gray-600"
                  >
                    개인정보 수집 및 이용에 동의합니다.
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-[0.75rem] sm:mt-[1rem] space-y-[0.375rem] sm:space-y-[0.5rem]">
          <button
            type="submit"
            className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] font-medium rounded-md
						text-white bg-base-black hover:bg-neutral-900 focus:ring-base-black
						disabled:bg-base-muted disabled:text-base-muted-30
						focus:outline-none focus:ring-2 focus:ring-offset-2"
            disabled={
              !isVerified ||
              !signupData.email.trim() ||
              !signupData.password.trim() ||
              !signupData.passwordConfirm.trim() ||
              !signupData.name.trim() ||
              !isAgreed
            }
          >
            회원가입
          </button>
          {/*
					<div className="flex items-center">
						<div className="flex-grow h-[0.0625rem] bg-gray-200"></div>
						<span className="px-[0.75rem] text-[0.75rem] sm:text-[0.875rem] text-gray-500">
							또는
						</span>
						<div className="flex-grow h-[0.0625rem] bg-gray-200"></div>
					</div>
					<button
						type="button"
						className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] font-medium text-[#000000] bg-[#FEE500] rounded-md hover:bg-[#FDD835] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500] relative"
						onClick={handleKakaoSignup}
					>
						<img
							src="/images/kakao_logo.png"
							alt="카카오 아이콘"
							className="w-[0.875rem] h-[0.875rem] sm:w-[1rem] sm:h-[1rem] absolute left-[1.05rem] sm:left-[1.05rem] top-1/2 transform -translate-y-1/2"
						/>
						<span className="w-full text-center">카카오 계정으로 시작하기</span>
					</button>
					<button
						type="button"
						className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] font-medium text-[#000000] bg-[#F2F2F2] rounded-md hover:bg-[#E6E6E6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F2F2F2] relative"
						onClick={handleGoogleSignup}
					>
						<img
							src="/images/google.logo.png"
							alt="구글 아이콘"
							className="w-[0.875rem] h-[0.875rem] sm:w-[1rem] sm:h-[1rem] absolute left-[1.05rem] sm:left-[1.05rem] top-1/2 transform -translate-y-1/2"
						/>
						<span className="w-full text-center">구글 계정으로 시작하기</span>
					</button>
				*/}
        </div>
      </form>
      <div className="text-center mt-[1rem]">
        <span className="text-gray-600">이미 계정이 있으신가요? </span>
        <Link to="/login" className="text-primary-dark hover:underline">
          로그인
        </Link>
      </div>
    </div>
  );
};

export default SignupForm;

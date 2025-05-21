import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  AuthCodeInput,
  EmailInput,
  PasswordInput,
} from '@/components/atoms/Input';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import userService from '@/services/userService';

interface ResetPasswordData {
  email: string;
  password: string;
  passwordConfirm: string;
}

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password: string) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

const PasswordResetForm = () => {
  const navigate = useNavigate();

  const [resetData, setResetData] = useState<ResetPasswordData>({
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const [error, setError] = useState<{
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});

  const {
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
  } = useEmailVerification('reset');

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetData((prevData) => ({ ...prevData, [name]: value }));

    let errorMessage = '';
    if (name === 'email') {
      setEmail(value);
      // 이메일이 변경되면 인증 코드 상태 초기화
      if (authCodeSent && !isVerified) {
        resetVerification();
      }
      if (!validateEmail(value.trim()))
        errorMessage = '올바른 이메일 형식이 아닙니다.';
    } else if (name === 'password') {
      if (!validatePassword(value.trim()))
        errorMessage = '8자 이상, 숫자 및 특수문자를 포함해야 합니다.';
      if (
        resetData.passwordConfirm &&
        value.trim() !== resetData.passwordConfirm.trim()
      ) {
        setError((prev) => ({
          ...prev,
          passwordConfirm: '비밀번호가 일치하지 않습니다.',
        }));
      }
    } else if (name === 'passwordConfirm') {
      if (value.trim() !== resetData.password.trim())
        errorMessage = '비밀번호가 일치하지 않습니다.';
    }
    setError((prevError) => ({ ...prevError, [name]: errorMessage }));
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;
    let newErrors: typeof error = {};

    if (!resetData.email.trim() || !validateEmail(resetData.email.trim())) {
      newErrors.email = !resetData.email.trim()
        ? '이메일을 입력해 주세요.'
        : '올바른 이메일 형식이 아닙니다.';
      isValid = false;
    }

    if (!isVerified) {
      toast.error('이메일 인증이 필요합니다.');
      isValid = false;
    }

    if (
      !resetData.password.trim() ||
      !validatePassword(resetData.password.trim())
    ) {
      newErrors.password = !resetData.password.trim()
        ? '비밀번호를 입력해주세요.'
        : '비밀번호는 8자 이상, 숫자 및 특수문자를 포함해야 합니다.';
      isValid = false;
    }

    if (
      !resetData.passwordConfirm.trim() ||
      resetData.passwordConfirm.trim() !== resetData.password.trim()
    ) {
      newErrors.passwordConfirm = !resetData.passwordConfirm.trim()
        ? '비밀번호 확인을 입력해주세요.'
        : '비밀번호가 일치하지 않습니다.';
      isValid = false;
    }

    if (!isValid) {
      setError(newErrors);
      return;
    }

    try {
      await userService.resetPassword({
        email: resetData.email.trim(),
        password: resetData.password.trim(),
      });
      toast.success('비밀번호가 성공적으로 재설정되었습니다.');
      navigate('/login');
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || '비밀번호 재설정에 실패했습니다.'
        );
      } else {
        toast.error('비밀번호 재설정에 실패했습니다.');
      }
    }
  };

  useEffect(() => {
    if (timer === 0 && authCodeSent && !isVerified) {
      resetVerification();
      setResetData((prev) => ({ ...prev, email: '' }));
      toast.error('인증 시간이 만료되었습니다. 다시 시도해주세요.');
    }
  }, [timer, authCodeSent]);

  return (
    <div className="bg-white rounded-[0.925rem] shadow-[0_0_0.9375rem_rgba(0,0,0,0.1)] w-[20rem] px-[2rem] py-[2rem] sm:w-[23rem] sm:px-[2.5rem] sm:py-[2.5rem] lg:w-[26rem] lg:px-[3rem] lg:py-[3rem]">
      <form onSubmit={handleResetSubmit} className="lg:block">
        <span className="font-medium text-gray-900 text-base sm:text-lg">
          비밀번호 재설정
        </span>
        <div className="space-y-[0.25rem] sm:space-y-[0.5rem]">
          <EmailInput
            id="reset-email"
            name="email"
            value={resetData.email}
            onChange={(e) => {
              setEmail(e.target.value);
              handleResetChange(e);
            }}
            error={emailError || error.email}
            placeholder="이메일"
            disabled={isVerified} // authCodeSent 제거, isVerified만 남김
          />

          {(!authCodeSent || (authCodeSent && !isVerified)) && (
            <button
              type="button"
              className="w-full px-[0.75rem] py-[0.6rem] sm:py-[0.5rem] text-[0.75rem] sm:text-[0.875rem] bg-primary-20 text-primary-dark rounded"
              onClick={sendCode}
              disabled={isSending}
            >
              {isSending
                ? '발송 중...'
                : authCodeSent
                  ? '인증번호 재발송'
                  : '인증번호 발송'}
            </button>
          )}

          {authCodeSent && (
            <AuthCodeInput
              id="reset-authcode"
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
            <>
              <PasswordInput
                id="reset-password"
                name="password"
                value={resetData.password}
                onChange={handleResetChange}
                error={error.password}
                placeholder="새 비밀번호"
              />
              <PasswordInput
                id="reset-password-confirm"
                name="passwordConfirm"
                value={resetData.passwordConfirm}
                onChange={handleResetChange}
                error={error.passwordConfirm}
                placeholder="새 비밀번호 확인"
              />
            </>
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
              !resetData.email.trim() ||
              !resetData.password.trim() ||
              !resetData.passwordConfirm.trim() ||
              !!error.password ||
              !!error.passwordConfirm
            }
          >
            비밀번호 재설정
          </button>
        </div>
      </form>

      <div className="text-center mt-[1rem]">
        <span className="text-gray-600">변경하지 않고 </span>
        <Link to="/login" className="text-primary-dark hover:underline">
          로그인하기
        </Link>
      </div>
    </div>
  );
};

export default PasswordResetForm;

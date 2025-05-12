import { useState } from 'react';

import { Button } from '@/components/atoms/Button';
import { WardCodeInput } from '@/components/atoms/WardCodeInput';

interface EnterWardFormProps {
  onSubmit: (wardCode: string) => Promise<void>;
  onCancel: () => void;
}

const EnterWardForm = ({ onSubmit, onCancel }: EnterWardFormProps) => {
  const [wardCode, setWardCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateWardCode = (code: string) => {
    if (!code) {
      setError('병동 코드를 입력해주세요.');
      return false;
    }
    if (code.length !== 6) {
      setError('병동 코드는 6자리여야 합니다.');
      return false;
    }
    if (!/^[A-Za-z0-9]+$/.test(code)) {
      setError('영문과 숫자만 입력 가능합니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateWardCode(wardCode)) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await onSubmit(wardCode);
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setWardCode(value);
    setError('');
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[1.5rem]">
        <div className="flex flex-col gap-[0.5rem]">
          <div className="relative">
            <label className="block text-[1.125rem] font-medium text-gray-700 mb-[0.5rem] text-left">
              병동 코드
            </label>
            <div className="w-full flex justify-center">
              <WardCodeInput
                id="ward-code"
                name="wardCode"
                label=""
                onChange={handleInputChange}
                error={error}
                showInvalidMessage={true}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        <div className="mt-[0.75rem] sm:mt-[1rem]">
          <Button
            type="submit"
            color="primary"
            size="md"
            fullWidth
            disabled={isLoading || !!error || wardCode.length !== 6}
            className={`text-[0.75rem] lg:text-[0.875rem] h-[2.5rem] ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-[0.5rem]">
                <span className="animate-spin">⌛</span>
                <span className="text-[0.75rem] lg:text-[0.875rem]">
                  확인 중...
                </span>
              </div>
            ) : (
              <span className="text-[0.75rem] lg:text-[0.875rem]">
                입장하기
              </span>
            )}
          </Button>
        </div>
        <div className="mt-[0.25rem] sm:mt-[0.5rem]">
          <Button
            type="button"
            color="muted"
            size="md"
            fullWidth
            onClick={onCancel}
            className="text-[0.75rem] lg:text-[0.875rem] h-[2.5rem]"
          >
            <span className="text-[0.75rem] lg:text-[0.875rem]">뒤로가기</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnterWardForm;

import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import '@/styles/animations.css';

import { Button } from '@/components/atoms/Button';
import UpdateNoticeModal from '@/components/organisms/UpdateNoticeModal';
import LandingTemplate from '@/components/templates/LandingTemplate';
import { SEO } from '@/components/SEO';
import axiosInstance from '@/lib/axios';
import useUserAuthStore from '@/stores/userAuthStore';

const Landing = () => {
  const navigate = useNavigate();
  const setUserInfo = useUserAuthStore((state) => state.setUserInfo); //상태 업데이트 함수

  useEffect(() => {
    // 랜딩 페이지로 접근 시, 토큰 삭제
    sessionStorage.removeItem('user-auth-storage');
  }, []);

  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname !== '/shift-admin') {
      sessionStorage.removeItem('user-auth-storage');
    }
  }, []);

  const handleStart = async () => {
    try {
      navigate('/login');
    } catch (error) {
      console.error('페이지 이동 실패:', error);
      if (error instanceof Error) {
        if (error.message === '서버 연결 실패') {
          toast.error('잠시 후 다시 시도해주세요.');
          return;
        }
        if (error.message === 'UNAUTHORIZED') {
          navigate('/login');
          return;
        }
      }
      if ((error as AxiosError)?.response?.status === 400) {
        toast.error('잘못된 접근입니다.');
        return;
      }
      // 그 외의 모든 에러는 에러 페이지로 이동
      navigate('/error');
    }
  };

  const handleDemoLogin = async () => {
    try {
      const { data } = await axiosInstance.post('/member/login/demo');

      setUserInfo({
        token: data.token,
        memberId: data.memberId,
        name: data.name,
        role: data.role,
        provider: data.provider,
        profileImg: data.profileImg,
        existAdditionalInfo: data.existAdditionalInfo,
        existMyWard: data.existMyWard,
        sentWardCode: data.sentWardCode,
        isDemo: true,
      });
      sessionStorage.setItem('demo-start-time', Date.now().toString());

      sessionStorage.setItem(
        'user-auth-storage',
        JSON.stringify({
          state: {
            userInfo: {
              name: data.name,
              role: data.role,
              profileImg: data.profileImg,
              provider: data.provider,
              token: data.token,
              existAdditionalInfo: data.existAdditionalInfo,
              existMyWard: data.existMyWard,
              sentWardCode: data.sentWardCode,
              isDemo: true,
            },
          },
        })
      );

      //이동
      setTimeout(() => {
        navigate('/shift-admin');
      }, 50);
    } catch (error) {
      toast.error('데모 로그인 실패. 다시 시도해주세요.');
      console.error(error);
    }
  };

  const handleGoToTutorial = () => {
    try {
      window.open(import.meta.env.VITE_TUTORIAL_URL, '_blank');
    } catch (error) {
      navigate('/error');
    }
  };

  const handleGoToYoutube = () => {
    try {
      window.open(import.meta.env.VITE_YOUTUBE_URL, '_blank');
    } catch (error) {
      navigate('/error');
    }
  };

  const [showNoticeModal, setShowNoticeModal] = useState(false);

  useEffect(() => {
    const isHiddenToday = Cookies.get('dutyMateNoticeHidden');

    if (!isHiddenToday) {
      setShowNoticeModal(true);
    }
  }, []);

  const handleCloseModal = () => {
    setShowNoticeModal(false);
  };

  const handleDoNotShowToday = () => {
    Cookies.set('dutyMateNoticeHidden', 'true', { expires: 1 }); // 1일 후 자동 삭제
    setShowNoticeModal(false);
  };

  return (
    <>
      <SEO
        title="랜딩 | Dutymate"
        description="듀티메이트의 랜딩 페이지입니다."
      />
      {showNoticeModal && (
        <UpdateNoticeModal
          onClose={handleCloseModal}
          onDoNotShowToday={handleDoNotShowToday}
        />
      )}
      <LandingTemplate showIntroText={true}>
        <div className="flex flex-col items-center gap-4 w-full">
          {/* 모바일: 세로 스택, 데스크탑: 가로 배치 */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[23.2rem]">
            {/* <Button
							color="secondary"
							size="lg"
							className="w-full h-[3.5rem] sm:h-[3rem] bg-white border border-gray-300 hover:text-black"
							onClick={() => toast.info("준비 중입니다.")}
						>
							<span className="text-[1rem]">Google Play</span>
						</Button>

						<Button
							color="secondary"
							size="lg"
							className="w-full h-[3.5rem] sm:h-[3rem] bg-white border border-gray-300 hover:text-black"
							onClick={() => toast.info("준비 중입니다.")}
						>
							<span className="text-[1rem]">App Store</span>
						</Button> */}
          </div>

          <Button
            color="secondary"
            size="lg"
            width="long"
            className="h-[3.5rem] sm:h-[3rem] bg-[#fff4ee] text-[#f47056] border-[0.5px] border-[#f47056] hover:bg-primary w-full max-w-[23.2rem]"
            onClick={handleDemoLogin}
          >
            <span className="text-[1rem]">서비스 맛보기</span>
          </Button>

          <Button
            color="tertiary"
            size="lg"
            width="long"
            onClick={handleStart}
            className="h-[3.5rem] sm:h-[3rem] bg-primary hover:bg-primary-dark text-white w-full max-w-[23.2rem] mt-1 shadow-md"
          >
            <span className="text-[1rem]">시작하기</span>
          </Button>

          <div className="w-full max-w-[23.2rem] mt-4 pt-4 border-t border-gray-200">
            <p className="text-center text-gray-600">
              사용법이 궁금하다면?{' '}
              <span
                className="text-primary-dark cursor-pointer font-semibold"
                onClick={handleGoToTutorial}
              >
                튜토리얼
              </span>{' '}
              |{' '}
              <span
                className="text-primary-dark cursor-pointer font-semibold"
                onClick={handleGoToYoutube}
              >
                소개영상
              </span>
            </p>
          </div>
        </div>
      </LandingTemplate>
    </>
  );
};

export default Landing;

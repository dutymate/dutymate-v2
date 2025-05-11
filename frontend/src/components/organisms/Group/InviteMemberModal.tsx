import { Icon } from '@/components/atoms/Icon';
import React, { useState } from 'react';

declare global {
  interface Window {
    Kakao: any;
  }
}

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  inviteLink: string;
  groupName: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  onClose,
  inviteLink,
  // groupName,
}) => {
  const inviteUrl = inviteLink;
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  // const [kakaoInitialized, setKakaoInitialized] = useState(false);

  // useEffect(() => {
  //   // 카카오 SDK 초기화
  //   const script = document.createElement('script');
  //   script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js';
  //   script.async = true;
  //   script.onload = () => {
  //     if (window.Kakao && !window.Kakao.isInitialized()) {
  //       window.Kakao.init(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY);
  //       setKakaoInitialized(true);
  //     }
  //   };
  //   document.body.appendChild(script);

  //   return () => {
  //     document.body.removeChild(script);
  //   };
  // }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setModalMessage('링크가 복사되었습니다!');
      setShowModal(true);
    } catch {
      setModalMessage('복사에 실패했습니다.');
      setShowModal(true);
    }
  };

  // const handleKakaoShare = () => {
  //   if (!window.Kakao || !kakaoInitialized) {
  //     setModalMessage(
  //       '카카오톡 공유 기능을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.'
  //     );
  //     setShowModal(true);
  //     return;
  //   }

  //   window.Kakao.Share.sendDefault({
  //     objectType: 'feed',
  //     content: {
  //       title: `${groupName} 그룹 초대`,
  //       description: '그룹에 참여하여 함께 근무표를 공유해보세요!',
  //       imageUrl: 'https://dutymate.com/images/logo.png', // 서비스 로고 이미지 URL로 변경하세요
  //       link: {
  //         // mobileWebUrl: inviteUrl,
  //         webUrl: inviteUrl,
  //       },
  //     },
  //     buttons: [
  //       {
  //         title: '그룹 참여하기',
  //         link: {
  //           // mobileWebUrl: inviteUrl,
  //           webUrl: inviteUrl,
  //         },
  //       },
  //     ],
  //   });
  // };

  const handleOutsideClick = () => {
    onClose();
    setShowModal(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="absolute inset-0" onClick={handleOutsideClick} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 flex flex-col items-center z-10">
          <button
            className="absolute top-4 right-4 text-gray-400 text-2xl"
            onClick={handleOutsideClick}
          >
            ×
          </button>
          <h2 className="text-lg font-bold mb-4">친구 초대 링크</h2>
          <div className="w-full bg-gray-100 rounded px-3 py-2 text-xs text-gray-700 break-all mb-4 text-center">
            {inviteUrl}
          </div>
          <div className="flex flex-col w-full gap-2">
            <button
              className="flex items-center justify-center gap-2 w-full bg-primary text-white text-base font-bold py-2 rounded-xl shadow active:bg-primary-dark transition"
              onClick={handleCopy}
            >
              <Icon name="copy" size={20} className="text-white" />
              <span>링크 복사하기</span>
            </button>
            {/* <button
              className="w-full bg-[#FEE500] text-[#3C1E1E] text-base font-bold py-2 rounded-xl shadow transition flex items-center justify-center"
              onClick={handleKakaoShare}
            >
              <SiKakaotalk className="mr-2" /> 카카오톡으로 공유하기
            </button> */}
          </div>
        </div>
      </div>

      {/* 알림 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="absolute inset-0" onClick={handleOutsideClick} />
          <div className="bg-white rounded-xl shadow-xl px-8 py-6 flex flex-col items-center relative z-10">
            <div className="text-base font-semibold mb-4">{modalMessage}</div>
            <button
              className="mt-2 px-6 py-2 bg-primary text-white rounded-lg font-bold shadow hover:bg-primary-dark transition"
              onClick={() => setShowModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InviteMemberModal;

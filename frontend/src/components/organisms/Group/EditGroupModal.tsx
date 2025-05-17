import React, { useState, useEffect } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery';
import { groupService } from '@/services/groupService';
import { toast } from 'react-toastify';

interface EditGroupModalProps {
  open: boolean;
  onClose: () => void;
  onAddGroup?: (group: {
    groupName: string;
    groupDescription: string;
    groupImg: string | null;
  }) => void;
  initialData?: {
    groupName: string;
    groupDescription: string;
    groupImg: string | null;
    groupId: number;
  };
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  open,
  onClose,
  onAddGroup,
  initialData,
}) => {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [name, setName] = useState(initialData?.groupName || '');
  const [desc, setDesc] = useState(initialData?.groupDescription || '');
  const [img, setImg] = useState<string | null>(initialData?.groupImg || null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!open) {
      setName(initialData?.groupName || '');
      setDesc(initialData?.groupDescription || '');
      setImg(initialData?.groupImg || null);
      setShowModal(false);
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleImgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];

      if (file) {
        // 미리보기용 임시 URL 생성
        const previewUrl = URL.createObjectURL(file);
        setImg(previewUrl); // 임시 미리보기 URL 설정

        try {
          // 이미지 업로드 API 호출
          const response = await groupService.uploadGroupImage(file);
          // 업로드 완료 후 실제 URL로 교체
          setImg(response.groupImgUrl);
        } catch (error) {
          // 오류 처리
        }
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('이미지 업로드에 실패했습니다.');
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 20) setName(value);
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 20) setDesc(value);
  };

  const handleRandomImage = async () => {
    try {
      if (initialData?.groupId) {
        const response = await groupService.updateGroupRandomImage(
          initialData.groupId
        );
        setImg(response.groupImgUrl);
      }
    } catch (error: any) {
      console.error('Failed to get random image:', error);
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('랜덤 이미지를 불러오는데 실패했습니다.');
      }
      // Fallback to null if API call fails
      setImg(null);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !desc.trim()) {
      setShowModal(true);
      return;
    }

    onAddGroup &&
      onAddGroup({ groupName: name, groupDescription: desc, groupImg: img });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`
          relative bg-white rounded-t-2xl lg:rounded-2xl shadow-xl w-full
          ${
            isMobile
              ? 'max-w-full pb-4 pt-2 px-4 animate-slideup'
              : 'max-w-sm p-5'
          }
          flex flex-col items-center
          z-10
        `}
        style={isMobile ? { bottom: 0 } : {}}
      >
        {/* 닫기 버튼 */}
        <button
          className="absolute top-3 right-3 text-gray-400 text-xl"
          onClick={onClose}
        >
          ×
        </button>
        {/* 타이틀 */}
        <div className="text-center mb-4 mt-1 w-full">
          <h2 className="text-xl font-semibold tracking-tight">
            {initialData ? '그룹 수정하기' : '그룹 만들기'}
          </h2>
        </div>
        {/* 이미지 업로드 */}
        <div className="flex flex-col items-center mb-4 w-full">
          <label className="w-24 h-24 border-2 border-gray-300 rounded-xl flex items-center justify-center cursor-pointer text-2xl text-gray-400 bg-gray-100 hover:bg-gray-200 transition overflow-hidden relative">
            {img ? (
              <img
                src={img}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-gray-400">＋</span>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImgChange}
            />
            {/* 카메라 아이콘 (수정 모드에서만) */}
            {initialData && (
              <span className="absolute bottom-2 right-2 bg-white rounded-full p-0.5 shadow text-black border border-gray-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75v-7.5A2.25 2.25 0 014.5 6h2.036a2.25 2.25 0 002.12-1.591l.225-.674A1.5 1.5 0 0110.293 3h3.414a1.5 1.5 0 011.412 1.735l-.225.674A2.25 2.25 0 0017.464 6H19.5a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0119.5 18h-15a2.25 2.25 0 01-2.25-2.25z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11.25a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
            )}
          </label>
          {/* 랜덤 이미지 버튼 (수정 모드에서만) */}
          {initialData && (
            <button
              onClick={handleRandomImage}
              className="mt-2 text-xs text-gray-500 hover:text-orange-500 cursor-pointer"
            >
              랜덤 이미지 선택
            </button>
          )}
        </div>
        {/* 입력폼 */}
        {initialData ? (
          <div className="w-full flex flex-col items-center mb-6">
            <label className="text-gray-400 text-xs mb-1">그룹명</label>
            <div className="w-full flex flex-col items-center mb-3">
              <input
                className="block w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:border-orange-300"
                placeholder="그룹명을 작성해주세요"
                value={name}
                onChange={handleNameChange}
                maxLength={20}
              />
            </div>
            <label className="text-gray-400 text-xs mb-1">그룹 설명</label>
            <div className="w-full flex flex-col items-center">
              <input
                className="block w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-300"
                placeholder="그룹 소개글을 작성해주세요"
                value={desc}
                onChange={handleDescChange}
                maxLength={20}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-full flex flex-col items-center mb-6">
              <label className="text-gray-400 text-xs mb-1">그룹명</label>
              <div className="w-full flex flex-col items-center mb-3">
                <input
                  className="block w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:border-orange-300"
                  placeholder="그룹명을 작성해주세요"
                  value={name}
                  onChange={handleNameChange}
                  maxLength={20}
                />
              </div>
              <label className="text-gray-400 text-xs mb-1">그룹 설명</label>
              <div className="w-full flex flex-col items-center">
                <input
                  className="block w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-300"
                  placeholder="그룹 소개글을 작성해주세요"
                  value={desc}
                  onChange={handleDescChange}
                  maxLength={20}
                />
              </div>
            </div>
          </>
        )}
        {/* 등록/수정 버튼 */}
        <button
          className="w-full bg-[#F5A281] text-white text-base font-bold py-2 rounded-xl shadow mt-2 active:bg-[#F37C4C] transition mb-2"
          style={{ boxShadow: '0 2px 8px 0 #f5a28133' }}
          onClick={handleSubmit}
        >
          {initialData ? '수정하기' : '등록'}
        </button>
        {/* 경고 모달 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl px-8 py-6 flex flex-col items-center">
              <div className="text-base font-semibold mb-4">
                그룹명과 소개글을 모두 작성해주세요
              </div>
              <button
                className="mt-2 px-6 py-2 bg-primary text-white rounded-lg font-bold shadow hover:bg-primary-dark transition"
                onClick={() => setShowModal(false)}
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditGroupModal;

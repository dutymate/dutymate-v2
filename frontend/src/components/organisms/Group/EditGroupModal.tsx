import React, { useState, useEffect } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery';

interface EditGroupModalProps {
  open: boolean;
  onClose: () => void;
  onAddGroup?: (group: { name: string; desc: string; img: string }) => void;
  initialData?: {
    name: string;
    desc: string;
    img: string;
  };
}

const RANDOM_IMAGES = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
  'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99',
];

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  open,
  onClose,
  onAddGroup,
  initialData,
}) => {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [name, setName] = useState(initialData?.name || '');
  const [desc, setDesc] = useState(initialData?.desc || '');
  const [img, setImg] = useState<string | null>(initialData?.img || null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!open) {
      setName(initialData?.name || '');
      setDesc(initialData?.desc || '');
      setImg(initialData?.img || null);
      setToast(false);
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImg(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!name.trim() || !desc.trim()) {
      setToast(true);
      setTimeout(() => setToast(false), 1500);
      return;
    }
    const groupImg =
      img || RANDOM_IMAGES[Math.floor(Math.random() * RANDOM_IMAGES.length)];
    onAddGroup && onAddGroup({ name, desc, img: groupImg });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`
          relative bg-white rounded-t-2xl lg:rounded-2xl shadow-xl w-full
          ${isMobile ? 'max-w-full pb-6 pt-4 px-6 animate-slideup' : 'max-w-md p-8'}
          flex flex-col items-center
          z-10
        `}
        style={isMobile ? { bottom: 0 } : {}}
      >
        {/* 닫기 버튼 */}
        <button
          className="absolute top-4 right-4 text-gray-400 text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        {/* 타이틀 */}
        <div className="text-center mb-6 mt-2 w-full">
          <h2 className="text-2xl font-bold tracking-tight">
            {initialData ? '그룹 수정하기' : '그룹 만들기'}
          </h2>
        </div>
        {/* 이미지 업로드 */}
        <div className="flex justify-center mb-6 w-full">
          <label className="w-28 h-28 border-2 border-orange-300 rounded-xl flex items-center justify-center cursor-pointer text-3xl text-orange-400 bg-white hover:bg-orange-50 transition overflow-hidden">
            {img ? (
              <img
                src={img}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-orange-400">＋</span>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImgChange}
            />
          </label>
        </div>
        {/* 입력폼 */}
        <input
          className="block w-full border-0 border-b-2 border-orange-300 focus:border-orange-400 outline-none text-center text-lg mb-4 placeholder:text-gray-400"
          placeholder="그룹명을 작성해주세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="block w-full border-0 border-b-2 border-orange-300 focus:border-orange-400 outline-none text-center text-base mb-8 placeholder:text-gray-400"
          placeholder="그룹 소개글을 작성해주세요"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        {/* 등록 버튼 */}
        <button
          className="w-full bg-[#F5A281] text-white text-lg font-bold py-3 rounded-xl shadow mt-2 active:bg-[#F37C4C] transition mb-2"
          style={{ boxShadow: '0 4px 12px 0 #f5a28133' }}
          onClick={handleSubmit}
        >
          {initialData ? '수정하기' : '등록'}
        </button>
        {/* 토스트 메시지 */}
        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-24 bg-black/80 text-white text-sm rounded px-4 py-2 z-50 pointer-events-none animate-fadein">
            그룹명과 소개글을 모두 작성해주세요
          </div>
        )}
      </div>
    </div>
  );
};

export default EditGroupModal;

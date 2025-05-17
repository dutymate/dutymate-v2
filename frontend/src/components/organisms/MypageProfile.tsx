import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import { IoMdCamera } from 'react-icons/io';

import { Button } from '@/components/atoms/Button';
import { MypageInput, MypageSelect } from '@/components/atoms/Input';
import MypageExitConfirmModal from '@/components/organisms/MypageExitConfirmModal';
import { ApiErrorResponse, profileService } from '@/services/profileService';
import useProfileStore from '@/stores/profileStore';
import useUserAuthStore from '@/stores/userAuthStore';
import { wardService } from '@/services/wardService';
import { validateNickname } from '@/utils/validation';

const MypageProfile = () => {
  const navigate = useNavigate();
  const {
    profile,
    fetchProfile,
    updateProfile,
    checkNickname,
    uploadProfileImage,
    deleteProfileImage,
  } = useProfileStore();
  const { userInfo, setUserInfo } = useUserAuthStore();
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isMypageExitConfirmModalOpen, setMypageExitConfirmModalOpen] =
    useState(false);
  const [exitRequestType, setExitRequestType] = useState<
    'CREATE-WARD' | 'WARD' | 'WITHDRAWAL' | null
  >(null);
  const [hasPendingNurses, setHasPendingNurses] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    gender: 'F',
    grade: '1',
  });
  const [nicknameStatus, setNicknameStatus] = useState<{
    isValid: boolean | null;
    message: string;
  }>({ isValid: null, message: '' });
  const [nameStatus, setNameStatus] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 이미지 업로드 input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        nickname: profile.nickname,
        gender: profile.gender,
        grade: String(profile.grade),
      });
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!isDirty) {
      toast.info('변경된 내용이 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        nickname: formData.nickname,
        gender: formData.gender as 'F' | 'M',
        grade: Number(formData.grade),
      });
      setIsDirty(false);
      toast.success('프로필이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      toast.error('프로필 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const genderOptions = [
    { value: 'F', label: '여자' },
    { value: 'M', label: '남자' },
  ];

  // 연차 옵션 배열 생성 (ExtraInfoForm과 동일한 방식)
  const gradeOptions = Array.from({ length: 50 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const debouncedCheckNickname = useCallback(
    debounce(async (nickname: string) => {
      if (nickname === profile?.nickname) {
        setNicknameStatus({ isValid: null, message: '' });
        setIsAvailable(nameStatus.isValid);
        return;
      }

      // 먼저 닉네임 유효성 검사
      const nicknameValidation = validateNickname(nickname);
      if (!nicknameValidation.isValid) {
        setNicknameStatus({
          isValid: false,
          message: nicknameValidation.message,
        });
        setIsAvailable(false);
        return;
      }

      if (nickname.length > 0 && nickname.length < 20) {
        try {
          const isAvail = await checkNickname(nickname);
          setNicknameStatus({
            isValid: isAvail,
            message: isAvail
              ? '사용 가능한 닉네임입니다.'
              : '이미 사용 중인 닉네임입니다.',
          });
          setIsAvailable(isAvail && nameStatus.isValid);
        } catch (error) {
          setNicknameStatus({
            isValid: false,
            message: '닉네임 확인 중 오류가 발생했습니다.',
          });
          setIsAvailable(false);
        }
      } else {
        setNicknameStatus({
          isValid: false,
          message: '닉네임은 최대 20자까지 가능합니다.',
        });
        setIsAvailable(false);
      }
    }, 500),
    [profile, checkNickname, nameStatus.isValid]
  );

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNickname = e.target.value;
    setFormData({ ...formData, nickname: newNickname });
    debouncedCheckNickname(newNickname);
    setIsDirty(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName });

    // Validate name length
    const isNameValid = newName.length <= 20;

    if (!isNameValid) {
      setNameStatus({
        isValid: false,
        message: '이름은 최대 20자까지 가능합니다.',
      });
    } else {
      setNameStatus({ isValid: true, message: '' });
    }

    // Update isAvailable based on both name and nickname validity
    setIsAvailable(
      isNameValid &&
        (nicknameStatus.isValid === true || nicknameStatus.isValid === null)
    );

    setIsDirty(true);
  };

  useEffect(() => {
    return () => {
      debouncedCheckNickname.cancel();
    };
  }, [debouncedCheckNickname]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/heic',
      'image/heif',
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('JPG, PNG, JPEG, HEIC 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      toast.error('파일 크기는 30MB 이하여야 합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await uploadProfileImage(file);
      await fetchProfile();
      toast.success('프로필 이미지가 업로드되었습니다.');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/heic',
      'image/heif',
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('JPG, PNG, JPEG, HEIC 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      toast.error('파일 크기는 30MB 이하여야 합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await uploadProfileImage(file);
      await fetchProfile();
      toast.success('프로필 이미지가 업로드되었습니다.');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('이미지 업로드 중 오류가 발생했습니다.');
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    try {
      await deleteProfileImage();
      setPreviewImage(null);
      toast.success('기본 프로필 이미지로 변경됐습니다.');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('이미지 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleOpenModal = async (
    type: 'CREATE-WARD' | 'WARD' | 'WITHDRAWAL'
  ) => {
    if (type === 'WARD' && userInfo?.role === 'HN') {
      try {
        const nurses = await wardService.getNurseWaitList();
        setHasPendingNurses(nurses.length > 0);
      } catch (error) {
        console.error('Failed to fetch waiting nurses:', error);
        setHasPendingNurses(false);
      }
    } else {
      setHasPendingNurses(false);
    }
    setExitRequestType(type);
    setMypageExitConfirmModalOpen(true);
  };

  const handleCreateWard = () => {
    profileService.editRole(
      { role: null },
      () => {
        if (!userInfo) {
          return;
        }

        // userInfo 최신화
        setUserInfo({
          ...userInfo,
          role: null,
          existMyWard: false,
          sentWardCode: false,
        });

        navigate('/create-ward');
      },
      (error: ApiErrorResponse) => {
        toast.error(error.message);
      }
    );
  };

  const handleExitButton = () => {
    profileService.exitWard(
      () => {
        if (userInfo?.role === 'RN') {
          if (!userInfo) {
            return;
          }

          // userInfo 최신화
          setUserInfo({
            ...userInfo,
            existMyWard: false,
            sentWardCode: false,
          });

          navigate('/my-shift');
        } else {
          if (!userInfo) {
            return;
          }

          // userInfo 최신화
          setUserInfo({
            ...userInfo,
            role: null,
            existMyWard: false,
            sentWardCode: false,
          });

          navigate('/extra-info');
        }
      },
      (error: ApiErrorResponse) => {
        toast.error(error.message);
      }
    );
  };

  const handleWithdrawal = () => {
    profileService.withdrawlMember(
      () => {
        navigate('/login');
      },
      (error: ApiErrorResponse) => {
        toast.error(error.message);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-white rounded-lg shadow-md p-4 transition-all duration-200 hover:shadow-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">
          프로필 설정
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 왼쪽 프로필 아이콘 */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="text-center mb-2">
              <h3 className="text-base font-bold text-gray-800">
                {profile?.hospitalName}
              </h3>
              <p className="text-sm text-gray-600">{profile?.wardName}</p>
            </div>

            {/* 프로필 이미지 영역 */}
            <div
              className={`relative w-[7rem] h-[7rem] rounded-full overflow-hidden ${
                isDragging ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewImage || profile?.profileImg ? (
                <img
                  src={previewImage || profile?.profileImg || ''}
                  alt="프로필 이미지"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <IoMdCamera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">프로필 이미지 없음</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <Button
                type="button"
                size="sm"
                color="primary"
                className="w-[7rem] h-[2.25rem] text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                사진 변경하기
              </Button>
              {profile?.profileImg && (
                <button
                  onClick={handleRemoveImage}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  기본 이미지로 변경
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center">
              JPG, PNG 형식 (최대 5MB)
            </p>
          </div>

          {/* 오른쪽 정보 */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <div className="grid gap-4">
                <div className="relative">
                  <MypageInput
                    id="email"
                    name="email"
                    label="이메일"
                    value={profile?.email || ''}
                    disabled
                    className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-primary-20"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    개인정보
                  </h4>
                  <div className="relative">
                    <MypageInput
                      id="name"
                      name="name"
                      label="이름"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-primary-20 transition-all duration-200"
                    />
                    {nameStatus.message && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {nameStatus.message}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <MypageInput
                      id="nickname"
                      name="nickname"
                      label="닉네임"
                      value={formData.nickname}
                      onChange={handleNicknameChange}
                      className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-primary-20 transition-all duration-200"
                    />
                    {nicknameStatus.message && (
                      <p
                        className={`mt-1 text-xs font-medium ${
                          nicknameStatus.isValid
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {nicknameStatus.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    근무 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <MypageSelect
                      id="gender"
                      name="gender"
                      label="성별"
                      options={genderOptions}
                      value={formData.gender}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          gender: e.target.value as 'F' | 'M',
                        });
                        setIsDirty(true);
                      }}
                      className="bg-white border-0 shadow-sm focus:ring-2 focus:ring-primary-20 transition-all duration-200"
                    />
                    <MypageSelect
                      id="grade"
                      name="grade"
                      label="연차"
                      options={gradeOptions}
                      value={formData.grade}
                      onChange={(e) => {
                        setFormData({ ...formData, grade: e.target.value });
                        setIsDirty(true);
                      }}
                      className="bg-white border-0 shadow-sm scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 focus:ring-2 focus:ring-primary-20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            type="button"
            size="sm"
            color="primary"
            className={`w-full lg:w-[8rem] h-[2.25rem] transition-all duration-300 ${
              !isAvailable || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleSubmit}
            disabled={!isAvailable || isLoading || !isDirty}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                저장 중...
              </div>
            ) : (
              '저장하기'
            )}
          </Button>
        </div>
      </div>

      {/* 계정 관리 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">
          계정 관리
        </h2>
        <div className="space-y-4">
          {/* 병동 생성하기 (RN 병동X) */}
          {!userInfo?.existMyWard && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-800">
                병동 생성하기
              </h3>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-600 md:max-w-[80%]">
                  새로운 병동을 생성하게 되면 기존에 작성했던 근무표 데이터에
                  접근할 수 없게 됩니다. 병동을 생성하면 병동 단위의 근무표를
                  생성하고 관리할 수 있습니다.
                </p>
                <Button
                  type="button"
                  size="sm"
                  color="night"
                  className="w-full md:w-[8rem] h-[2.25rem] mt-2 md:mt-0"
                  onClick={() => handleOpenModal('CREATE-WARD')}
                >
                  병동 생성하기
                </Button>
              </div>
            </div>
          )}

          {/* 병동 나가기 (RN 병동O, HN) */}
          {userInfo?.existMyWard && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-800">
                병동 나가기
              </h3>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-600 md:max-w-[80%]">
                  현재 병동을 나가면 해당 병동의 모든 데이터에 접근할 수 없게
                  됩니다. 다른 병동으로 이동하시려면 먼저 현재 병동을 나가야
                  합니다.
                </p>
                <Button
                  type="button"
                  size="sm"
                  color="night"
                  className="w-full md:w-[8rem] h-[2.25rem] mt-2 md:mt-0"
                  onClick={() => handleOpenModal('WARD')}
                >
                  병동 나가기
                </Button>
              </div>
            </div>
          )}

          {/* 회원 탈퇴 */}
          <div className="space-y-2 pt-3 border-t">
            <h3 className="text-base font-semibold text-gray-800">회원 탈퇴</h3>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-600 md:max-w-[80%]">
                회원 탈퇴 시 모든 개인정보와 데이터가 영구적으로 삭제되며 복구할
                수 없습니다. 탈퇴 전에 반드시 필요한 데이터를 백업해주세요.
              </p>
              <Button
                type="button"
                size="sm"
                color="evening"
                className="w-full md:w-[8rem] h-[2.25rem] mt-2 md:mt-0"
                onClick={() => handleOpenModal('WITHDRAWAL')}
              >
                회원 탈퇴하기
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MypageExitConfirmModal
        isOpen={isMypageExitConfirmModalOpen}
        onClose={() => setMypageExitConfirmModalOpen(false)}
        onConfirm={
          exitRequestType == 'CREATE-WARD'
            ? handleCreateWard
            : exitRequestType == 'WARD'
              ? handleExitButton
              : handleWithdrawal
        }
        exitRequestType={exitRequestType}
        hasPendingNurses={hasPendingNurses}
      />
    </div>
  );
};

export default MypageProfile;

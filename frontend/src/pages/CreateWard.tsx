import { AxiosError } from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import CreateWardForm from '@/components/organisms/CreateWardForm';
import LandingTemplate from '@/components/templates/LandingTemplate';
import { SEO } from '@/components/SEO';
import { HospitalInfo, wardService } from '@/services/wardService';
import useUserAuthStore from '@/stores/userAuthStore';

const CreateWard = () => {
  const navigate = useNavigate();
  const userAuthStore = useUserAuthStore();
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchHospitals = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setHospitals([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await wardService.searchHospitals(searchTerm);
      setHospitals(results);
    } catch (error) {
      console.error('병원 검색 실패:', error);
      toast.error('병원 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateWard = async (hospitalName: string, wardName: string) => {
    try {
      await wardService.createWard({
        hospitalName,
        wardName,
      });

      const currentUserInfo = userAuthStore.userInfo;
      if (currentUserInfo) {
        userAuthStore.setUserInfo({
          ...currentUserInfo,
          existMyWard: true,
          role: 'HN',
        });
      }

      // 성공 토스트 메시지 표시
      toast.success('병동이 생성되었습니다.');

      // 잠시 후 페이지 이동
      setTimeout(() => {
        navigate('/shift-admin');
      }, 1000);
    } catch (error) {
      console.error('병동 생성 실패:', error);
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
        toast.error('병동 생성에 실패했습니다.');
        navigate('/ward-admin');
        return;
      }
      // 그 외의 모든 에러는 에러 페이지로 이동
      navigate('/error');
    }
  };

  return (
    <>
      <SEO
        title="병동 생성 | Dutymate"
        description="병동 생성을 위한 기본 정보를 입력해주세요."
      />
      <LandingTemplate showIntroText={false}>
        <CreateWardForm
          onSubmit={handleCreateWard}
          onSearchHospitals={handleSearchHospitals}
          hospitals={hospitals}
          isSearching={isSearching}
        />
      </LandingTemplate>
    </>
  );
};

export default CreateWard;

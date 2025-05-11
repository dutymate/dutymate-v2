import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Community from '@/pages/Community';
import CommunityDetailPage from '@/pages/CommunityDetailPage';
import CommunityWritePage from '@/pages/CommunityWritePage';
import CreateWard from '@/pages/CreateWard';
import EnterWard from '@/pages/EnterWard';
import Error from '@/pages/Error';
import ExtraInfo from '@/pages/ExtraInfo';
import Game from '@/pages/Game';
import { GoogleRedirect } from '@/pages/GoogleRedirect';
import { KakaoRedirect } from '@/pages/KakaoRedirect';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Mypage from '@/pages/Mypage';
import MyShift from '@/pages/MyShift';
import PasswordReset from '@/pages/PasswordReset';
import ReqAdmin from '@/pages/ReqAdmin';
import ShiftAdmin from '@/pages/ShiftAdmin';
import Signup from '@/pages/Signup';
import TeamShift from '@/pages/TeamShift';
import WardAdmin from '@/pages/WardAdmin';
import useUserAuthStore from '@/stores/userAuthStore';
import NurseGroupPage from '@/pages/Group/NurseGroupPage';
import GroupDetailPage from '@/pages/Group/GroupDetailPage';
import GroupMemberPage from '@/pages/Group/GroupMemberPage';
import GroupInvitePage from '@/pages/Group/GroupInvitePage';

interface ProtectedRouteProps {
  element: ReactElement;
}

const ProtectedRoute = ({ element }: ProtectedRouteProps) => {
  const token = sessionStorage.getItem('user-auth-storage');
  const { userInfo } = useUserAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 데모 버전에서 커뮤니티 페이지와 마이페이지 접근 차단
  if (
    userInfo?.isDemo &&
    (window.location.pathname.startsWith('/community') ||
      window.location.pathname === '/my-page')
  ) {
    return <Navigate to="/error" replace />;
  }

  return element;
};

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<Signup />} />
      <Route path="/oauth/kakao" element={<KakaoRedirect />} />
      <Route path="/oauth/google" element={<GoogleRedirect />} />
      <Route path="/password-reset" element={<PasswordReset />} />

      {/* 그룹 초대 링크 - 로그인 필요 */}
      <Route
        path="/invite/:inviteToken"
        element={<ProtectedRoute element={<GroupInvitePage />} />}
      />

      {/* 로그인이 필요한 페이지 */}
      <Route
        path="/my-shift"
        element={<ProtectedRoute element={<MyShift />} />}
      />
      <Route
        path="/team-shift"
        element={<ProtectedRoute element={<TeamShift />} />}
      />
      <Route
        path="/ward-admin"
        element={<ProtectedRoute element={<WardAdmin />} />}
      />
      <Route
        path="/create-ward"
        element={<ProtectedRoute element={<CreateWard />} />}
      />
      <Route
        path="/enter-ward"
        element={<ProtectedRoute element={<EnterWard />} />}
      />
      <Route
        path="/extra-info"
        element={<ProtectedRoute element={<ExtraInfo />} />}
      />
      <Route
        path="/community"
        element={<ProtectedRoute element={<Community />} />}
      />
      <Route
        path="/community/:boardId"
        element={<ProtectedRoute element={<CommunityDetailPage />} />}
      />
      <Route
        path="/community/write"
        element={<ProtectedRoute element={<CommunityWritePage />} />}
      />

      {/* 그룹 관련 페이지 */}
      <Route
        path="/group"
        element={<ProtectedRoute element={<NurseGroupPage />} />}
      />
      <Route
        path="/group/:groupId"
        element={<ProtectedRoute element={<GroupDetailPage />} />}
      />
      <Route
        path="/group/:groupId/member"
        element={<ProtectedRoute element={<GroupMemberPage />} />}
      />

      <Route
        path="/req-admin"
        element={<ProtectedRoute element={<ReqAdmin />} />}
      />
      <Route
        path="/shift-admin"
        element={<ProtectedRoute element={<ShiftAdmin />} />}
      />
      <Route
        path="/my-page"
        element={<ProtectedRoute element={<Mypage />} />}
      />
      {/* 이스터에그 */}
      <Route path="/game" element={<ProtectedRoute element={<Game />} />} />

      {/* 기타 */}
      <Route path="/error" element={<Error />} />
      <Route path="*" element={<Error />} />
      {/* <Route path="/_playgrounds" element={<Playgrounds />} /> */}
    </Routes>
  );
};

export default Router;

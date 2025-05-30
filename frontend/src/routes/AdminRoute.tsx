//듀티메이트 용 관리자 라우트

// src/routes/AdminRoute.tsx
import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import useUserAuthStore from '@/stores/userAuthStore';

interface AdminRouteProps {
  element: ReactElement;
}

const AdminRoute = ({ element }: AdminRouteProps) => {
  const { userInfo } = useUserAuthStore();
  const token = userInfo?.token;
  const email = userInfo?.email;

  if (!token || email !== 'dutymate.net@gmail.com') {
    return <Navigate to="/notice" replace />;
  }

  return element;
};

export default AdminRoute;

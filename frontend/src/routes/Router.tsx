import { Navigate, Route, Routes } from "react-router-dom";
// import Playgrounds from "../pages/_playgrounds";
import CommunityDetailPage from "@/pages/CommunityDetailPage";
import CommunityWritePage from "@/pages/CommunityWritePage";
import Community from "../pages/Community";
import CreateWard from "../pages/CreateWard";
import EnterWard from "../pages/EnterWard";
import Error from "../pages/Error";
import ExtraInfo from "../pages/ExtraInfo";
import { GoogleRedirect } from "../pages/GoogleRedirect";
import { KakaoRedirect } from "../pages/KakaoRedirect";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Mypage from "../pages/Mypage";
import MyShift from "../pages/MyShift";
import ReqAdmin from "../pages/ReqAdmin";
import ShiftAdmin from "../pages/ShiftAdmin";
import Signup from "../pages/Signup";
import { ReactElement } from "react";
import Game from "../pages/Game";
import TeamShift from "../pages/TeamShift";
import WardAdmin from "../pages/WardAdmin";

interface ProtectedRouteProps {
	element: ReactElement;
}

const ProtectedRoute = ({ element }: ProtectedRouteProps) => {
	const token = sessionStorage.getItem("user-auth-storage");
	return token ? element : <Navigate to="/login" replace />;
};

const Router = () => {
	return (
		<Routes>
			<Route path="/" element={<Landing />} />
			<Route path="/login" element={<Login />} />
			<Route path="/sign-up" element={<Signup />} />
			<Route path="/oauth/kakao" element={<KakaoRedirect />} />
			<Route path="/oauth/google" element={<GoogleRedirect />} />

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

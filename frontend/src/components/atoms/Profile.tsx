import useUserAuthStore from "@/store/userAuthStore";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "./Icon";

const Profile = () => {
	const userAuthStore = useUserAuthStore();
	const userInfo = userAuthStore.userInfo;
	const location = useLocation();

	const isMypage = location.pathname === "/my-page";
	const privacyPolicyUrl = import.meta.env.VITE_PRIVACY_POLICY_URL || "#";

	return (
		<div className="px-[1.3rem] pb-10">
			<div className="flex flex-col">
				{/* 마이페이지 텍스트와 아이콘 */}
				<Link
					to="/my-page"
					className={`
						flex items-center gap-x-6 px-4 mb-4 rounded-lg py-2
						${
							isMypage
								? "bg-gray-100 text-gray-700"
								: "text-gray-700 hover:bg-gray-100"
						}
					`}
				>
					{userInfo?.profileImg ? (
						<img
							src={userInfo.profileImg}
							alt="프로필 이미지"
							className="w-[1.125rem] h-[1.125rem] min-w-[1.125rem] text-gray-500 rounded-full"
							onError={(e) => {
								e.currentTarget.onerror = null;
								e.currentTarget.style.display = "none";
							}}
						/>
					) : (
						<Icon
							name="user"
							className={`w-[1.125rem] h-[1.125rem] min-w-[1.125rem] rounded-full
								${isMypage ? "text-primary-dark" : "text-gray-500"}
							`}
						/>
					)}
					<span className="text-sm font-semibold">마이페이지</span>
				</Link>

				{/* 가운데 정렬된 선 */}
				<div className="mx-2 mb-4">
					<div className="border-t border-gray-200 w-full"></div>
				</div>

				{/* 회사명과 사이트 주소 */}
				<div className="flex flex-col gap-y-1 px-4">
					<span className="text-xs font-bold text-gray-600">
						(주)듀티메이트
					</span>
					<span className="text-xs text-gray-400">
						<a href={privacyPolicyUrl}>개인정보처리방침</a>
					</span>
				</div>
			</div>
		</div>
	);
};

export default React.memo(Profile);

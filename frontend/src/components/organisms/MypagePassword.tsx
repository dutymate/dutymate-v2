import useUserAuthStore from "@/store/userAuthStore";
import { Button } from "../atoms/Button";
import {
	PasswordUpdateRequest,
	profileService,
} from "@/services/profileService";
import { useState } from "react";
import { toast } from "react-toastify";

const MypagePassword = () => {
	const userAuthStore = useUserAuthStore();
	const [passwordData, setPasswordData] = useState<PasswordUpdateRequest>({
		currentPassword: "",
		newPassword: "",
		newPasswordConfirm: "",
	});

	if (userAuthStore.userInfo?.provider !== "NONE") {
		return;
	}

	const handleButtonClick = () => {
		console.log(passwordData);
		profileService.updatePassword(
			passwordData,
			() => toast.success("비밀번호 변경에 성공했습니다."),
			(error) => {
				toast.error(error.message);
			},
		);
		setPasswordData((preData) => ({
			...preData,
			currentPassword: "",
			newPassword: "",
			newPasswordConfirm: "",
		}));
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setPasswordData((preData) => ({
			...preData,
			[name]: value,
		}));
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-[1rem]">
			<h2 className="text-base font-semibold text-gray-900 mb-[1rem]">
				비밀번호 변경
			</h2>
			<div className="space-y-[1rem]">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-[0.75rem]">
					<div className="flex flex-col">
						<span className="text-sm text-gray-600 mb-[0.5rem]">
							현재 비밀번호
						</span>
						<input
							type="password"
							name="currentPassword"
							className="p-[0.5rem] border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-20"
							placeholder="**********"
							value={passwordData.currentPassword}
							onChange={handlePasswordChange}
						/>
					</div>
					<div className="flex flex-col">
						<span className="text-sm text-gray-600 mb-[0.5rem]">
							새로운 비밀번호
						</span>
						<input
							type="password"
							name="newPassword"
							className="p-[0.5rem] border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-20"
							placeholder="**********"
							value={passwordData.newPassword}
							onChange={handlePasswordChange}
						/>
					</div>
					<div className="flex flex-col">
						<span className="text-sm text-gray-600 mb-[0.5rem]">
							비밀번호 확인
						</span>
						<input
							type="password"
							name="newPasswordConfirm"
							className="p-[0.5rem] border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-20"
							placeholder="**********"
							value={passwordData.newPasswordConfirm}
							onChange={handlePasswordChange}
						/>
					</div>
				</div>
				<div className="flex justify-center lg:justify-end">
					<Button
						type="button"
						size="sm"
						color="primary"
						className="w-full lg:w-[7.5rem] h-[2.25rem] max-w-[23.75rem]"
						onClick={handleButtonClick}
					>
						변경하기
					</Button>
				</div>
			</div>
		</div>
	);
};

export default MypagePassword;

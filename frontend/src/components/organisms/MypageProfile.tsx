import { Icon } from "../atoms/Icon";
import { Button } from "../atoms/Button";
import { MypageInput, MypageSelect } from "../atoms/Input";
import { MypageToggleButton } from "../atoms/ToggleButton";
import { useState, useEffect, useCallback, useRef } from "react";
import useProfileStore from "../../store/profileStore";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";

const MypageProfile = () => {
	const {
		profile,
		fetchProfile,
		updateProfile,
		checkNickname,
		uploadProfileImage,
		deleteProfileImage,
	} = useProfileStore();
	const [selectedImageOption, setSelectedImageOption] = useState(0);
	const [isAvailable, setIsAvailable] = useState(true);
	const [formData, setFormData] = useState({
		name: "",
		nickname: "",
		gender: "F",
		grade: "1",
	});
	const [nicknameStatus, setNicknameStatus] = useState<{
		isValid: boolean | null;
		message: string;
	}>({ isValid: null, message: "" });

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
		try {
			await updateProfile({
				name: formData.name,
				nickname: formData.nickname,
				gender: formData.gender as "F" | "M",
				grade: Number(formData.grade),
			});
			toast.success("프로필이 수정되었습니다.");
		} catch (error) {
			console.error("프로필 수정 실패:", error); // 디버깅용
			toast.error("프로필 수정에 실패했습니다.");
		}
	};

	const genderOptions = [
		{ value: "F", label: "여자" },
		{ value: "M", label: "남자" },
	];

	// 연차 옵션 배열 생성 (ExtraInfoForm과 동일한 방식)
	const gradeOptions = Array.from({ length: 50 }, (_, i) => ({
		value: String(i + 1),
		label: String(i + 1),
	}));

	const debouncedCheckNickname = useCallback(
		debounce(async (nickname: string) => {
			if (nickname === profile?.nickname) {
				setNicknameStatus({ isValid: null, message: "" });
				return;
			}

			if (nickname.length > 0) {
				try {
					const isAvail = await checkNickname(nickname);
					setIsAvailable(isAvail);
					setNicknameStatus({
						isValid: isAvail,
						message: isAvail
							? "사용 가능한 닉네임입니다."
							: "이미 사용 중인 닉네임입니다.",
					});
				} catch (error) {
					setNicknameStatus({
						isValid: false,
						message: "닉네임 확인 중 오류가 발생했습니다.",
					});
				}
				console.log(nicknameStatus);
			} else {
				setNicknameStatus({ isValid: null, message: "" });
			}
		}, 500),
		[profile, checkNickname],
	);

	const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newNickname = e.target.value;
		setFormData({ ...formData, nickname: newNickname });
		debouncedCheckNickname(newNickname);
	};

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newName = e.target.value;
		setFormData({ ...formData, name: newName });
	};

	useEffect(() => {
		return () => {
			debouncedCheckNickname.cancel();
		};
	}, [debouncedCheckNickname]);

	// 이미지 토글 처리
	const handleImageOptionChange = async (index: number) => {
		try {
			if (index === 0) {
				// 기본이미지 선택
				await deleteProfileImage();
				setSelectedImageOption(index); // 상태 업데이트를 성공 후에 진행
				toast.success("프로필 이미지가 삭제되었습니다.");
				// console.log(profile)
			} else {
				// 사진 등록 선택
				setSelectedImageOption(index);
				fileInputRef.current?.click();
			}
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("프로필 이미지 처리 중 오류가 발생했습니다.");
			}
		}
	};

	// 파일 선택 처리
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// 파일 형식 검사
		const validTypes = ["image/jpeg", "image/png", "image/jpg"];
		if (!validTypes.includes(file.type)) {
			toast.error("JPG, PNG, JPEG 형식의 이미지만 업로드 가능합니다.");
			return;
		}

		try {
			await uploadProfileImage(file);
			await fetchProfile(); // 명시적으로 프로필 새로고침
			toast.success("프로필 이미지가 업로드되었습니다.");
			// console.log(profile)
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("이미지 업로드 중 오류가 발생했습니다.");
			}
		}

		// 파일 input 초기화
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-[1rem]">
			<h2 className="text-sm font-semibold text-gray-900 mb-[0.5rem]">
				프로필 설정
			</h2>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-[1rem]">
				{/* 왼쪽 프로필 아이콘 */}
				<div className="flex flex-col items-center justify-center space-y-[1.5rem]">
					<div className="text-center mb-[0.25rem]">
						<h3 className="text-sm font-bold">{profile?.hospitalName}</h3>
						<p className="text-xs text-gray-600">{profile?.wardName}</p>
					</div>
					{profile?.profileImg ? (
						<img
							src={profile.profileImg}
							alt="프로필 이미지"
							className="w-[5rem] h-[5rem] lg:w-[6rem] lg:h-[6rem] rounded-full object-cover"
							onError={(e) => {
								e.currentTarget.onerror = null;
								e.currentTarget.style.display = "none";
							}}
						/>
					) : (
						<Icon
							name="user"
							className="w-[5rem] h-[5rem] lg:w-[6rem] lg:h-[6rem] text-gray-400"
						/>
					)}
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept=".jpg,.jpeg,.png"
						onChange={handleFileChange}
					/>
					<MypageToggleButton
						options={[{ text: "기본이미지" }, { text: "사진 등록" }]}
						selectedIndex={selectedImageOption}
						onChange={handleImageOptionChange}
					/>
				</div>
				{/* 오른쪽 정보 */}
				<div className="flex flex-col justify-center space-y-[1rem] mt-[1.5rem] lg:mt-0">
					<MypageInput
						id="email"
						name="email"
						label="이메일"
						value={profile?.email || ""}
						disabled
					/>
					<MypageInput
						id="name"
						name="name"
						label="이름"
						value={formData.name}
						onChange={handleNameChange}
						className="focus:outline-none focus:ring-2 focus:ring-primary-20"
					/>
					<div className="relative">
						<MypageInput
							id="nickname"
							name="nickname"
							label="닉네임"
							value={formData.nickname}
							onChange={handleNicknameChange}
							className="focus:outline-none focus:ring-2 focus:ring-primary-20"
						/>
						{nicknameStatus.message && (
							<p
								className={`mt-1 text-sm ${
									nicknameStatus.isValid ? "text-green-600" : "text-red-600"
								}`}
							>
								{nicknameStatus.message}
							</p>
						)}
					</div>
					<div className="grid grid-cols-2 gap-2">
						<MypageSelect
							id="gender"
							name="gender"
							label="성별"
							options={genderOptions}
							value={formData.gender}
							onChange={(e) =>
								setFormData({
									...formData,
									gender: e.target.value as "F" | "M",
								})
							}
							className="focus:outline-none focus:ring-2 focus:ring-primary-20"
						/>
						<MypageSelect
							id="grade"
							name="grade"
							label="연차"
							options={gradeOptions}
							value={formData.grade}
							onChange={(e) =>
								setFormData({ ...formData, grade: e.target.value })
							}
							className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-20"
						/>
					</div>
				</div>
			</div>
			<div className="flex justify-center lg:justify-end mt-[1.5rem]">
				<Button
					type="button"
					size="sm"
					className={`w-full lg:w-[7.5rem] h-[2.25rem] ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
					onClick={handleSubmit}
					disabled={!isAvailable}
				>
					저장하기
				</Button>
			</div>
		</div>
	);
};

export default MypageProfile;

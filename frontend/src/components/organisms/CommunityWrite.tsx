import { BsImage } from "react-icons/bs";
import { CommunityRegisterButton } from "../atoms/Button";
import { useRef, useState, useMemo } from "react";
import { toast } from "react-toastify";
import boardService, { BoardRequest } from "@/services/boardService";
import { useNavigate } from "react-router-dom";

const CommunityWrite = () => {
	const categories = [
		{ key: "DAILY", value: "일상글" },
		{ key: "QNA", value: "간호지식 Q&A" },
		{ key: "INFO", value: "이직 정보" },
	];
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFileName, setSelectedFileName] = useState<string>("");
	const [formData, setFormData] = useState<BoardRequest>({
		category: "",
		title: "",
		content: "",
		boardImgUrl: "",
	});

	// 폼 유효성 검사
	const isFormValid = useMemo(() => {
		return (
			formData.category !== "" &&
			formData.title.trim() !== "" &&
			formData.content.trim() !== ""
		);
	}, [formData.category, formData.title, formData.content]);

	const handleImageClick = () => {
		fileInputRef.current?.click();
	};

	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const { name, value } = e.target;

		setFormData((preData) => ({
			...preData,
			[name]: value,
		}));
	};

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setFormData((preData) => ({
			...preData,
			[name]: value,
		}));
	};

	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = e.target;

		setFormData((preData) => ({
			...preData,
			[name]: value,
		}));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) {
			return;
		}

		// 파일 형식 검사
		const validTypes = ["image/jpeg", "image/png", "image/jpg"];
		if (!validTypes.includes(file.type)) {
			toast.error("JPG, PNG, JPEG 형식의 이미지만 업로드 가능합니다.");
			return;
		}
		setSelectedFileName(file.name);

		boardService.uploadBoardImage(
			file,
			({ boardImgUrl }) => {
				setFormData((preData) => ({
					...preData,
					boardImgUrl: boardImgUrl,
				}));
			},
			(error) => toast.error(error.message),
		);

		// 파일 input 초기화
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const onRegister = () => {
		if (!isFormValid) return;

		boardService.writePost(
			formData,
			() => {
				toast.success("게시글이 작성되었습니다.");
				navigate("/community");
			},
			(error) => toast.error(error.message),
		);
		window.history.pushState(null, "", "/community");
	};

	return (
		<div className="flex flex-col gap-6">
			{/* 글쓰기 폼 */}
			<div className="bg-white rounded-lg p-6 shadow-xl">
				<div className="flex justify mb-3">
					<button
						onClick={() => navigate("/community")}
						className="text-foreground text-sm sm:text-base"
					>
						← 목록으로
					</button>
				</div>
				{/* 카테고리 선택 */}
				<div className="flex gap-2 sm:gap-4 mb-4 flex-col sm:flex-row sm:items-center">
					<label className="w-20 text-gray-700 font-medium shrink-0 text-sm sm:text-base">
						카테고리
					</label>
					<select
						className="flex-1 p-3 border border-gray-200 rounded-lg text-gray-600 text-sm sm:text-base"
						name="category"
						value={formData.category}
						onChange={handleSelectChange}
					>
						<option value="">카테고리를 선택해주세요.</option>
						{categories.map((category) => (
							<option key={category.key} value={category.key}>
								{category.value}
							</option>
						))}
					</select>
				</div>

				{/* 제목 입력 */}
				<div className="flex gap-2 sm:gap-4 mb-4 flex-col sm:flex-row sm:items-center">
					<label className="w-20 text-gray-700 font-medium shrink-0 text-sm sm:text-base">
						제목
					</label>
					<input
						type="text"
						placeholder="제목을 입력해주세요"
						className="flex-1 p-3 border border-gray-200 rounded-lg text-sm sm:text-base"
						name="title"
						value={formData.title}
						onChange={handleTitleChange}
					/>
				</div>

				{/* 내용 입력 */}
				<div className="flex gap-2 sm:gap-4 mb-2 flex-col sm:flex-row sm:items-center">
					<label className="w-20 text-gray-700 font-medium text-sm sm:text-base">
						내용
					</label>
					<textarea
						placeholder={`간호사 커뮤니티 이용 규칙 및 운영 정책\n
	1. 홍보 및 상업적 활동 금지: 본 커뮤니티에서는 개인 또는 기업의 홍보 및 상업적 활동을 금지합니다. 제품 판매, 의료기관 및 특정 강의 홍보, 리크루팅 게시글, 영리 목적의 광고 등은 사전 경고 없이 삭제될 수 있으며, 반복적인 위반 시 계정 이용이 제한될 수 있습니다.\n
	2. 정치·사회적 이슈 관련 게시물 금지: 커뮤니티 내에서는 정치적 성향을 띠거나 사회적으로 논란이 될 수 있는 게시물을 금지합니다. 특정 정당, 사회적 이슈, 종교, 이념과 관련된 게시물은 불필요한 갈등을 초래할 수 있으므로 허용되지 않습니다.\n
	3. 비방, 욕설 및 혐오 표현 금지: 타 회원을 대상으로 한 비방, 모욕적인 언행, 차별적 발언 및 혐오 표현은 엄격히 금지됩니다. 특정 개인, 단체, 직군을 향한 공격적인 표현 및 명예훼손 게시글 작성 시 즉시 삭제 및 경고 조치가 이루어지며, 반복될 경우 강제 탈퇴 및 법적 조치가 이루어질 수 있습니다.\n
	4. 성적 수치심을 유발하는 콘텐츠 금지: 성적 수치심을 유발할 수 있는 게시물, 이미지, 발언, 링크 등을 게시하는 행위는 금지됩니다. 이와 관련된 게시물은 즉시 삭제되며, 작성자는 커뮤니티 이용이 제한될 수 있습니다.\n
	5. 허위 정보 및 명예훼손 금지: 근거 없는 의료 정보, 특정 병원 및 의료진에 대한 허위 사실 유포, 악의적인 루머 확산은 금지됩니다. 이는 커뮤니티의 신뢰도를 저하시킬 뿐만 아니라 법적 문제를 초래할 수 있으므로 정확한 정보만 공유해 주시기 바랍니다.\n
	6. 반복적인 도배 및 무의미한 게시물 제한: 같은 내용의 게시글을 반복적으로 작성하거나, 의미 없는 문자 나열, 채팅형 댓글 도배 등은 금지됩니다. 이러한 행위가 발견될 경우 게시물이 삭제되며, 지속적으로 규칙을 위반하는 경우 커뮤니티 이용이 제한될 수 있습니다.`}
						className="flex-1 h-[33rem] min-h-[160px] p-3 border border-gray-200 rounded-lg resize-none text-xs sm:text-sm"
						name="content"
						value={formData.content}
						onChange={handleContentChange}
					/>
				</div>

				{/* 이미지 업로드 영역 */}
				<div className="flex mb-4">
					<div className="sm:w-20 shrink-0 " />
					<div className="flex items-center gap-2">
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept="image/*"
							onChange={handleFileChange}
						/>
						<button
							onClick={handleImageClick}
							className="p-2 hover:bg-gray-100 rounded-lg"
						>
							<BsImage className="w-6 h-6 text-gray-600" />
						</button>
						<span className="text-gray-400 text-sm">
							{selectedFileName || "이미지를 선택해주세요"}
						</span>
					</div>
				</div>
				{/* 등록 버튼 */}
				<div className="flex justify-end -mt-2">
					<CommunityRegisterButton
						onClick={onRegister}
						disabled={!isFormValid}
					/>
				</div>
			</div>
		</div>
	);
};

export default CommunityWrite;

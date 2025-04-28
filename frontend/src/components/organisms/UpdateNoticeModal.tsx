import { createPortal } from "react-dom";

interface UpdateNoticeModalProps {
	onClose: () => void;
	onDoNotShowToday: () => void;
}

const UpdateNoticeModal = ({
	onClose,
	onDoNotShowToday,
}: UpdateNoticeModalProps) => {
	// 바깥 클릭 막기 위해 stopPropagation만 처리
	const handleOverlayClick = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 min-h-screen py-12">
			<div
				className="bg-white w-full max-w-lg p-6  m-6 my-6 rounded-2xl shadow-lg flex flex-col gap-6 max-h-screen overflow-y-auto"
				onClick={handleOverlayClick}
			>
				<div className="text-left">
					<h2 className="text-xl font-semibold mb-4 text-center">
						📢 듀티메이트 Ver.2 업데이트 안내
					</h2>
					<p className="mb-2">
						안녕하세요, 듀티메이트 팀입니다.
						<br /> <br />
						듀티메이트를 이용해주시는 모든 분들께 감사드리며,
						<br />
						<strong>2025년 4월 24일</strong>부로{" "}
						<strong>듀티메이트 2.0.1 ver</strong>이 정식 업데이트 되었음을
						안내드립니다.
					</p>

					<p className="my-6">
						이번 업데이트에서는 다음과 같은 주요 개선 사항이 반영되었습니다.
					</p>
					<ul className="list-disc pl-5 mb-8">
						<li>
							<strong>근무 유형 확장</strong>: M(미드) 근무 추가
						</li>
						<li>
							<strong>서비스 맛보기 기능 개발</strong>: 로그인 없이 시스템을
							체험할 수 있는 맛보기 버전 제공
						</li>
						<li>
							<strong>사용자 관리</strong>: 문의 창구 및 회원 탈퇴 기능 구현
						</li>
					</ul>

					{/* <p className="my-4">향후 예정된 업데이트는 다음과 같습니다.</p>
					<ul className="list-disc pl-5 mb-2">
						<li>근무 유형 및 근무 규칙 커스터마이징</li>
						<li>간호사 그룹 생성 기능</li>
						<li>약속날짜 찾아주기 기능</li>
						<li>하이브리드 앱 개발</li>
					</ul> */}

					<p className="my-4">
						앞으로도 더욱 안정적이고 편리한 서비스를 제공해드리기 위해
						지속적으로 개선해 나가겠습니다.
						<br />
						서비스 이용 중 문의 사항이나 불편사항이 있으신 경우,{" "}
						<strong>화면 우측 하단의 채널톡</strong>을 통해 문의해 주시기
						바랍니다.
					</p>
					<p className="my-2">
						항상 듀티메이트를 이용해주셔서 진심으로 감사드립니다.
					</p>
					<p className="text-center mt-4">
						<strong>- 팀 듀티메이트 드림 -</strong>
					</p>
				</div>
				<div className="flex gap-2">
					<button
						className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold"
						onClick={onDoNotShowToday}
					>
						오늘 하루 보지 않기
					</button>
					<button
						className="flex-1 py-2 rounded-lg bg-primary text-white font-semibold"
						onClick={onClose}
					>
						닫기
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
};

export default UpdateNoticeModal;

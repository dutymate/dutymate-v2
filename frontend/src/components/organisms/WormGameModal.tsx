import { useEffect, useRef, useState } from "react";
import DutyBadgeEng from "../atoms/DutyBadgeEng";
import Title from "../atoms/Title";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";

interface Position {
	x: number;
	y: number;
}

interface WormGameModalProps {
	isOpen: boolean;
	onClose: () => void;
	isAutoGenerating?: boolean;
	onAutoGenerateComplete?: () => void;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 200; // 초기 속도를 더 느리게 설정
const SPEED_INCREMENT = 10; // 점수당 증가할 속도
const MIN_SPEED = 80; // 최소 속도 (가장 빠른 속도)
const DUTY_TYPES = ["D", "E", "N", "O"] as const;

// KeyboardGuide 컴포넌트 수정
const GameKeyboardGuide = () => {
	return (
		<div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg text-[11px] border border-gray-200">
			<div className="flex items-center gap-1">
				<span className="text-xs font-bold text-gray-500">조작키</span>
				<div className="flex gap-0.5">
					<kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
						← → ↑ ↓
					</kbd>
				</div>
			</div>
		</div>
	);
};

export const WormGameModal = ({ isOpen, onClose }: WormGameModalProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [worm, setWorm] = useState<Position[]>([{ x: 10, y: 10 }]);
	const [direction, setDirection] = useState<"UP" | "DOWN" | "LEFT" | "RIGHT">(
		"RIGHT",
	);
	const [food, setFood] = useState<
		Position & { type: (typeof DUTY_TYPES)[number] }
	>({
		x: 15,
		y: 15,
		type: "D",
	});
	const [score, setScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED);

	// 음식 랜덤 생성
	const generateFood = () => {
		const x = Math.floor(Math.random() * GRID_SIZE);
		const y = Math.floor(Math.random() * GRID_SIZE);
		const type = DUTY_TYPES[Math.floor(Math.random() * DUTY_TYPES.length)];
		setFood({ x, y, type });
	};

	// 게임 초기화
	const resetGame = () => {
		setWorm([{ x: 10, y: 10 }]);
		setDirection("RIGHT");
		setScore(0);
		setGameOver(false);
		setGameSpeed(INITIAL_SPEED);
		generateFood();
	};

	// 점수에 따른 게임 속도 조정
	useEffect(() => {
		const newSpeed = Math.max(
			INITIAL_SPEED - score * SPEED_INCREMENT,
			MIN_SPEED,
		);
		setGameSpeed(newSpeed);
	}, [score]);

	// 키보드 이벤트 처리
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			// 이벤트 전파 중단
			e.preventDefault();
			e.stopPropagation();

			switch (e.key) {
				case "ArrowUp":
					setDirection("UP");
					break;
				case "ArrowDown":
					setDirection("DOWN");
					break;
				case "ArrowLeft":
					setDirection("LEFT");
					break;
				case "ArrowRight":
					setDirection("RIGHT");
					break;
			}
		};

		if (isOpen && !gameOver) {
			window.addEventListener("keydown", handleKeyPress);
			return () => window.removeEventListener("keydown", handleKeyPress);
		}
	}, [isOpen, gameOver]);

	// 게임 루프
	useEffect(() => {
		if (!isOpen || gameOver) return;

		const gameLoop = setInterval(() => {
			setWorm((currentWorm) => {
				const head = { ...currentWorm[0] };

				// 새로운 머리 위치 계산
				switch (direction) {
					case "UP":
						head.y -= 1;
						break;
					case "DOWN":
						head.y += 1;
						break;
					case "LEFT":
						head.x -= 1;
						break;
					case "RIGHT":
						head.x += 1;
						break;
				}

				// 벽과 충돌 체크
				if (
					head.x < 0 ||
					head.x >= GRID_SIZE ||
					head.y < 0 ||
					head.y >= GRID_SIZE ||
					currentWorm.some(
						(segment) => segment.x === head.x && segment.y === head.y,
					)
				) {
					setGameOver(true);
					return currentWorm;
				}

				// 음식을 먹었는지 체크
				if (head.x === food.x && head.y === food.y) {
					setScore((s) => s + 1);
					generateFood();
					return [head, ...currentWorm];
				}

				// 지렁이 이동
				return [head, ...currentWorm.slice(0, -1)];
			});
		}, gameSpeed);

		return () => clearInterval(gameLoop);
	}, [isOpen, direction, food, gameOver, gameSpeed]);

	// 캔버스 렌더링
	useEffect(() => {
		if (!canvasRef.current) return;

		const ctx = canvasRef.current.getContext("2d");
		if (!ctx) return;

		// 캔버스 클리어
		ctx.clearRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

		// 지렁이와 음식은 React 컴포넌트로 직접 렌더링
		return () => {
			// cleanup
			ctx.clearRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
		};
	}, []);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-xl p-8 max-w-[600px] w-full mx-4">
				{/* 헤더 영역 */}
				<div className="flex justify-between items-start mb-6">
					<Title
						title="DutyWorm Game"
						subtitle="자동 생성을 기다리는 동안 게임을 즐겨보세요!"
					/>
					<Button size="sm" color="muted" onClick={onClose} className="mt-1">
						<Icon name="close" size={20} />
					</Button>
				</div>

				{/* 게임 영역 */}
				<div className="relative bg-gray-50 rounded-lg p-4 mb-6">
					<canvas
						ref={canvasRef}
						width={GRID_SIZE * CELL_SIZE}
						height={GRID_SIZE * CELL_SIZE}
						className="border border-gray-200 rounded-lg bg-white"
					/>
					{/* 지렁이 렌더링 */}
					{worm.map(({ x, y }, index) => (
						<div
							key={index}
							style={{
								position: "absolute",
								left: `${x * CELL_SIZE + 16}px`,
								top: `${y * CELL_SIZE + 16}px`,
								transform: "scale(0.8)",
								transition: "all 0.1s ease-in-out",
							}}
						>
							<DutyBadgeEng
								type={
									index === 0
										? "D"
										: (["E", "N", "O"][index % 3] as "D" | "E" | "N" | "O")
								}
								size="xs"
							/>
						</div>
					))}
					{/* 음식 렌더링 */}
					<div
						style={{
							position: "absolute",
							left: `${food.x * CELL_SIZE + 16}px`,
							top: `${food.y * CELL_SIZE + 16}px`,
							transform: "scale(0.8)",
						}}
					>
						<DutyBadgeEng type={food.type} size="xs" />
					</div>
				</div>

				{/* 게임 정보 영역 */}
				<div className="flex flex-col gap-4">
					<div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
						<div>
							<p className="text-2xl font-bold text-primary mb-1">
								Score: {score}
							</p>
							<p className="text-sm text-gray-600">
								방향키로 이동하여 듀티를 먹으세요!
							</p>
						</div>
						<GameKeyboardGuide />
					</div>

					<div className="p-4 rounded-lg text-center bg-blue-50">
						<p className="text-sm text-blue-600">
							{gameOver ? (
								<div className="text-center space-y-3">
									<div className="flex flex-col gap-2">
										<Button
											size="md"
											color="primary"
											onClick={resetGame}
											className="w-full max-w-xs mx-auto"
										>
											다시 시작하기
										</Button>
									</div>
								</div>
							) : (
								<>
									근무표 자동 생성 중이에요.
									<br />
									그동안 게임을 즐겨보세요 🎮
								</>
							)}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

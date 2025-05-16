import { StyledText } from "@/components/common/StyledText";

/**
 * TimerProps는 Timer 컴포넌트의 props를 정의합니다.
 */
interface TimerProps {
	timer: number;
	isVerified: boolean;
}

/**
 * Timer 컴포넌트는 인증 타이머를 렌더링합니다.
 * @param timer
 * @param isVerified
 */
export const Timer = ({ timer, isVerified }: TimerProps) => {
	const formattedTime = `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`;
	return (
		<StyledText
			className={"text-red-500 font-bold text-xs w-[3rem] text-right"}
		>
			{isVerified ? "" : formattedTime}
		</StyledText>
	);
};

import { useRef, useState } from "react";

interface WardCodeInputProps {
	id: string;
	name: string;
	label?: string;
	error?: string;
	disabled?: boolean;
	length?: number;
	onChange?: (value: string) => void;
	showInvalidMessage?: boolean;
}

export const WardCodeInput = ({
	id,
	name,
	label = "병동 코드",
	error,
	disabled,
	length = 6,
	onChange,
	showInvalidMessage = false,
}: WardCodeInputProps) => {
	const [values, setValues] = useState<string[]>(Array(length).fill(""));
	const [invalidInput, setInvalidInput] = useState(false);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const handleChange = (index: number, value: string) => {
		// 영문(대소문자)과 숫자만 허용하고 대문자로 변환
		const sanitizedValue = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

		// 입력값이 있고 영문자나 숫자가 아닌 문자가 포함된 경우
		if (value && !/^[A-Za-z0-9]*$/.test(value)) {
			setInvalidInput(true);
			setTimeout(() => setInvalidInput(false), 2000); // 2초 후 메시지 숨김
		}

		if (sanitizedValue.length <= 1) {
			const newValues = [...values];
			newValues[index] = sanitizedValue;
			setValues(newValues);

			// 다음 입력 칸으로 포커스 이동
			if (sanitizedValue && index < length - 1) {
				inputRefs.current[index + 1]?.focus();
			}

			// 전체 값을 문자열로 합쳐서 상위 컴포넌트에 전달
			onChange?.(newValues.join(""));
		}
	};

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Backspace" && !values[index] && index > 0) {
			// 현재 칸이 비어있고 Backspace를 누르면 이전 칸으로 이동
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: any): void => {
		e.preventDefault();
		const pastedText = e.clipboardData.getData("text");
		const chars = pastedText.slice(0, length).split("");

		const newValues = [...values];
		chars.forEach((char: any, index: any) => {
			if (index < length) {
				newValues[index] = char;
			}
		});

		setValues(newValues);

		// Call onChange with joined value
		onChange?.(newValues.join(""));

		// Focus on the next empty input or the last input
		const nextEmptyIndex = newValues.findIndex((val) => !val);
		const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
		inputRefs.current[focusIndex]?.focus();
	};

	const singleInputClass = error
		? "w-8 h-10 sm:w-9 sm:h-12 rounded-md bg-white text-center text-[1rem] sm:text-[1.125rem] text-red-900 border border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
		: "w-8 h-10 sm:w-9 sm:h-12 rounded-md bg-white text-center text-[1rem] sm:text-[1.125rem] text-gray-900 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed";

	return (
		<div>
			{label && (
				<label
					htmlFor={`${id}-0`}
					className="block text-[1rem] font-medium text-gray-900 sm:text-[1.125rem] mb-2"
				>
					{label}
				</label>
			)}
			<div className="flex gap-5 sm:gap-4">
				{Array(length)
					.fill(0)
					.map((_, index) => (
						<input
							key={index}
							ref={(el) => (inputRefs.current[index] = el)}
							id={`${id}-${index}`}
							name={`${name}-${index}`}
							type="text"
							maxLength={1}
							value={values[index] || ""}
							onChange={(e) => handleChange(index, e.target.value)}
							onKeyDown={(e) => handleKeyDown(index, e)}
							onPaste={handlePaste}
							disabled={disabled}
							className={singleInputClass}
							aria-invalid={error ? "true" : undefined}
						/>
					))}
			</div>
			{showInvalidMessage && invalidInput && (
				<p className="text-[0.875rem] text-red-600 sm:text-[1rem]">
					영문자와 숫자만 입력 가능합니다.
				</p>
			)}
			{error && (
				<p className="text-[0.875rem] text-red-600 sm:text-[1rem]">{error}</p>
			)}
		</div>
	);
};

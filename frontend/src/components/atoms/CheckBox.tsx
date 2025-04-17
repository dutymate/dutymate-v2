import { useState } from "react";

interface CheckBoxProps {
	id: string;
	name: string;
	label: string;
	checked?: boolean;
	disabled?: boolean;
	error?: string;
	onChange?: (checked: boolean) => void;
}

export const CheckBox = ({
	id,
	name,
	label,
	checked = false,
	disabled = false,
	error,
	onChange,
}: CheckBoxProps) => {
	const [isChecked, setIsChecked] = useState(checked);

	const handleChange = () => {
		if (!disabled) {
			const newChecked = !isChecked;
			setIsChecked(newChecked);
			onChange?.(newChecked);
		}
	};

	const checkboxClass = error
		? "h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-600 disabled:opacity-50"
		: "h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50";

	return (
		<div className="relative flex items-start">
			<div className="flex h-6 items-center">
				<input
					id={id}
					name={name}
					type="checkbox"
					checked={isChecked}
					disabled={disabled}
					onChange={handleChange}
					className={checkboxClass}
					aria-invalid={error ? "true" : undefined}
					aria-describedby={error ? `${id}-error` : undefined}
				/>
			</div>
			<div className="ml-3 text-sm leading-6">
				<label
					htmlFor={id}
					className={`font-medium ${
						error ? "text-red-900" : "text-gray-900"
					} ${disabled ? "opacity-50" : ""}`}
				>
					{label}
				</label>
				{error && (
					<p id={`${id}-error`} className="mt-1 text-red-600">
						{error}
					</p>
				)}
			</div>
		</div>
	);
};

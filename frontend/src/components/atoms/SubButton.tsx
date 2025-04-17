import { Icon } from "./Icon";

interface SubButtonProps {
	type: "sort" | "filter";
	label: string;
	onClick?: () => void;
	active?: boolean;
	disabled?: boolean;
}

export const SubButton = ({
	type,
	label,
	onClick,
	active = false,
	disabled = false,
}: SubButtonProps) => {
	const baseClasses = `
    inline-flex items-center gap-1 px-3 py-1.5 
    rounded-full text-sm transition-colors
    ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
  `;

	const activeClasses = active
		? "bg-primary text-white hover:bg-primary-dark"
		: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300";

	const disabledClasses = disabled
		? "opacity-50 bg-gray-100 text-gray-400 border-gray-200"
		: "";

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
		>
			<Icon
				name={type}
				size={16}
				className={active ? "text-white" : "text-gray-500"}
			/>
			{label}
		</button>
	);
};

// 정렬 버튼 컴포넌트
export const SortButton = (props: Omit<SubButtonProps, "type">) => {
	return <SubButton type="sort" {...props} />;
};

// 필터 버튼 컴포넌트
export const FilterButton = (props: Omit<SubButtonProps, "type">) => {
	return <SubButton type="filter" {...props} />;
};

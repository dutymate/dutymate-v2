// Icon.tsx

import { HiExclamationCircle, HiMagnifyingGlass } from "react-icons/hi2";
import { SlCalender } from "react-icons/sl";
import { FaHospital, FaUserCircle, FaDoorOpen } from "react-icons/fa";
import { FaChevronRight, FaChevronLeft, FaChevronDown } from "react-icons/fa6";
import {
	AiFillSchedule,
	AiOutlineIdcard,
	AiOutlineHeart,
	AiOutlineMessage,
	AiOutlineEye,
	AiFillHeart,
} from "react-icons/ai";
import { BiSolidUserPin } from "react-icons/bi";
import { HiOutlineUsers } from "react-icons/hi2";
import { IoIosChatboxes, IoMdMenu } from "react-icons/io";
import { IoFemale, IoMale, IoCloseOutline } from "react-icons/io5";
import { MdHistory } from "react-icons/md";
import {
	MdSignalCellular1Bar,
	MdSignalCellular3Bar,
	MdSignalCellular4Bar,
	MdModeEdit,
	MdOutlineSort,
	MdContentCopy,
} from "react-icons/md";
import { BsThreeDotsVertical, BsFunnel, BsThreeDots } from "react-icons/bs";
import { GrUndo } from "react-icons/gr";
import { GrPowerReset } from "react-icons/gr";
import { HiDownload } from "react-icons/hi";
import { RiRulerLine } from "react-icons/ri";
import { MdAutoMode } from "react-icons/md";

const iconComponents = {
	alert: HiExclamationCircle,
	search: HiMagnifyingGlass,
	calendar: SlCalender,
	hospital: FaHospital,
	schedule: AiFillSchedule,
	userPin: BiSolidUserPin,
	group: HiOutlineUsers,
	chat: IoIosChatboxes,
	user: FaUserCircle,
	female: IoFemale,
	male: IoMale,
	idCard: AiOutlineIdcard,
	low: MdSignalCellular1Bar,
	mid: MdSignalCellular3Bar,
	high: MdSignalCellular4Bar,
	edit: MdModeEdit,
	dots: BsThreeDotsVertical,
	sort: MdOutlineSort,
	filter: BsFunnel,
	copy: MdContentCopy,
	door: FaDoorOpen,
	right: FaChevronRight,
	left: FaChevronLeft,
	undo: GrUndo,
	menu: IoMdMenu,
	close: IoCloseOutline,
	history: MdHistory,
	chevronDown: FaChevronDown,
	reset: GrPowerReset,
	heart: AiOutlineHeart,
	heartFilled: AiFillHeart,
	message: AiOutlineMessage,
	eye: AiOutlineEye,
	more: BsThreeDots,
	rule: RiRulerLine,
	auto: MdAutoMode,
	download: HiDownload,
};

export type IconName =
	| "sort"
	| "filter"
	| "chevronDown"
	| "heart"
	| "heartFilled"
	| "message"
	| "eye"
	| "more"
	| "rule"
	| "auto"
	| "download"
	| keyof typeof iconComponents;

interface IconProps {
	name: IconName;
	className?: string;
	size?: number;
	onClick?: () => void;
}

export const Icon = ({
	name,
	className = "",
	size = 24,
	onClick,
}: IconProps) => {
	const IconComponent = iconComponents[name];

	if (!IconComponent) {
		return null;
	}

	return <IconComponent className={className} size={size} onClick={onClick} />;
};

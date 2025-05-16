import React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyledText } from "@/components/custom/StyledText";

interface ToggleButtonOption {
  text: string;
  icon?: string;
}

interface ToggleButtonProps {
  options: ToggleButtonOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
  variant?: "default" | "request" | "gender";
}

export const ToggleButton = ({
  options,
  selectedIndex,
  onChange,
  variant = "default",
}: ToggleButtonProps) => {
  return (
    <View className="flex-row bg-base-muted-30 rounded-lg p-1 w-full">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => onChange(index)}
            className={`
              flex-1 
              p-3 
              rounded-md
              ${isSelected ? "bg-white border border-primary" : "bg-transparent border border-transparent"}
              items-center 
              justify-center 
              flex-row 
              gap-2
            `}
          >
           
            <StyledText
              className={`
                text-lg
                ${isSelected ? "text-primary font-medium" : "text-base-foreground"}
              `}
            >
              {option.text}
            </StyledText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}; 
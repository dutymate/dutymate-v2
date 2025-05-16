import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { StyledText } from '../custom/StyledText';

interface DropdownProps {
  label?: string;
  placeholder?: string;
  data: Array<{ label: string; value: string | number }>;
  value: string | number | null;
  onChange: (value: any) => void;
  status?: "idle" | "success" | "error";
  successText?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  optional?: boolean;
}

export const DropdownComponent = ({
  label,
  placeholder = "연차를 선택해주세요.",
  data,
  value,
  onChange,
  status,
  successText,
  helpText,
  error,
  disabled,
  required,
  optional,
}: DropdownProps) => {
  const [isFocus, setIsFocus] = useState(false);

  const dropdownStyle = useMemo(() => {
    const baseStyle: ViewStyle[] = [
      styles.baseDropdown,
      {
        backgroundColor: disabled ? '#f9fafb' : 'white',
        borderColor: isFocus ? '#FF9999' : '#FFE3E3',
        borderWidth: isFocus ? 2 : 1,
      },
    ];

    if (status === "success") {
      baseStyle.push({ borderColor: "#22c55e", borderWidth: 2 } as ViewStyle);
    } else if (error || status === "error") {
      baseStyle.push({ borderColor: "#ef4444", borderWidth: 2 } as ViewStyle);
    }

    return baseStyle;
  }, [status, error, disabled, isFocus]);

  const selectedTextStyle = useMemo(() => ({
    ...styles.selectedTextStyle,
    color: disabled ? '#6b7280' : '#111827',
  }), [disabled]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {error && (
          <StyledText style={styles.errorText}>{error}</StyledText>
        )}
        {optional && (
          <StyledText style={styles.optionalText}>선택 사항</StyledText>
        )}
        {status === "success" && successText && (
          <StyledText style={styles.successText}>{successText}</StyledText>
        )}
      </View>

      <View style={styles.dropdownContainer}>
        <Dropdown
          style={dropdownStyle}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={selectedTextStyle}
          data={data}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? placeholder : '...'}
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            onChange(item.value);
            setIsFocus(false);
          }}
          disable={disabled}
          iconStyle={styles.iconStyle}
          containerStyle={styles.dropdownListContainer}
          itemContainerStyle={styles.dropdownItemContainer}
          itemTextStyle={styles.dropdownItemText}
          renderRightIcon={() => (
            <MaterialIcons 
              name={isFocus ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color="#666666"
            />
          )}
        />
        {error && (
          <View style={styles.errorIconContainer}>
            <MaterialIcons name="error" size={24} color="#ef4444" />
          </View>
        )}
      </View>

      {helpText && (
        <StyledText style={styles.helpText}>
          {helpText}
        </StyledText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 360,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  requiredMark: {
    color: '#ef4444',
  },
  optionalText: {
    fontSize: 14,
    color: '#6b7280',
  },
  successText: {
    fontSize: 14,
    color: '#22c55e',
  },
  dropdownContainer: {
    position: 'relative',
  },
  baseDropdown: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#666666',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#111827',
  },
  errorIconContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  helpText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  iconStyle: {
    width: 24,
    height: 24,
  },
  dropdownListContainer: {
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FFE3E3',
    backgroundColor: 'white',
  },
  dropdownItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#111827',
  },
});
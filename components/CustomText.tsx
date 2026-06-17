import React from 'react';
import { 
  Text as RNText, 
  TextInput as RNTextInput, 
  TextProps, 
  TextInputProps, 
  StyleSheet, 
  TextStyle 
} from 'react-native';
import { useLanguage } from '../app/context/LanguageContext';

export const Text = React.forwardRef<RNText, TextProps>(({ style, children, ...props }, ref) => {
  const { isRTL, t } = useLanguage();

  // Translate children if they are strings or array of strings
  let translatedChildren = children;
  if (typeof children === 'string') {
    translatedChildren = t(children);
  } else if (Array.isArray(children)) {
    translatedChildren = children.map(child => typeof child === 'string' ? t(child) : child);
  }

  // Handle alignment:
  // 1. If Arabic (isRTL), any text that defaults to left alignment (or explicitly left) should align right.
  // 2. Center aligned text keeps center alignment.
  const flatStyle = StyleSheet.flatten(style) || {};
  const isCentered = flatStyle.textAlign === 'center';

  const alignStyle: TextStyle = isRTL 
    ? { 
        textAlign: isCentered ? 'center' : 'right', 
        writingDirection: 'rtl' 
      }
    : {};

  return (
    <RNText ref={ref} style={[alignStyle, style]} {...props}>
      {translatedChildren}
    </RNText>
  );
});

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(({ style, placeholder, ...props }, ref) => {
  const { isRTL, t } = useLanguage();

  const flatStyle = StyleSheet.flatten(style) || {};
  const isCentered = flatStyle.textAlign === 'center';

  const alignStyle: TextStyle = isRTL 
    ? { 
        textAlign: isCentered ? 'center' : 'right', 
        writingDirection: 'rtl' 
      }
    : {};

  const translatedPlaceholder = placeholder ? t(placeholder) : undefined;

  return (
    <RNTextInput 
      ref={ref}
      style={[alignStyle, style]} 
      placeholder={translatedPlaceholder} 
      {...props} 
    />
  );
});

Text.displayName = 'CustomText';
TextInput.displayName = 'CustomTextInput';

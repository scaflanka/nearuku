import React from "react";
import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";

interface SafetyIconProps {
  color: string;
  size?: number;
}

const SafetyIcon: React.FC<SafetyIconProps> = ({ color, size = 28 }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <G clipPath="url(#clip0_288_2686)">
      <Path
        d="M14.4501 28C12.1335 27.4167 10.2211 26.0873 8.71313 24.012C7.20447 21.9373 6.45013 19.6333 6.45013 17.1V11L14.4501 8L22.4501 11V17.1C22.4501 19.6333 21.6961 21.9373 20.1881 24.012C18.6795 26.0873 16.7668 27.4167 14.4501 28ZM14.4501 25.9C16.1835 25.35 17.6168 24.25 18.7501 22.6C19.8835 20.95 20.4501 19.1167 20.4501 17.1V12.375L14.4501 10.125L8.45013 12.375V17.1C8.45013 19.1167 9.0168 20.95 10.1501 22.6C11.2835 24.25 12.7168 25.35 14.4501 25.9Z"
        fill={color}
      />
    </G>
    <Defs>
      <ClipPath id="clip0_288_2686">
        <Rect width="27.9863" height="27.9863" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default SafetyIcon;

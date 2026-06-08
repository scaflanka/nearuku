import React, { useEffect, useRef } from 'react';
import { TouchableWithoutFeedback, Animated, StyleSheet, ViewStyle } from 'react-native';

interface CustomSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    trackColor?: { false?: string; true?: string };
    thumbColor?: string;
    style?: ViewStyle;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ 
    value, 
    onValueChange, 
    trackColor = { false: "#D1D5DB", true: "#113C9C" },
    style 
}) => {
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value, animatedValue]);

    // Container width = 38, height = 21. Thumb = 17, height = 17.
    // Left padding = (21 - 17) / 2 = 2.
    // When value is 0, thumb X = 2.
    // When value is 1, thumb X = 38 - 17 - 2 = 19.
    const thumbPosition = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 19],
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [trackColor.false || '#D1D5DB', trackColor.true || '#113C9C'],
    });

    return (
        <TouchableWithoutFeedback onPress={() => onValueChange(!value)}>
            <Animated.View style={[styles.container, { backgroundColor }, style]}>
                <Animated.View style={[styles.thumb, { left: thumbPosition }]} />
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 38,
        height: 21,
        borderRadius: 15,
        justifyContent: 'center',
    },
    thumb: {
        width: 17,
        height: 17,
        borderRadius: 8.5,
        backgroundColor: '#FFF',
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 3,
    },
});

export default CustomSwitch;

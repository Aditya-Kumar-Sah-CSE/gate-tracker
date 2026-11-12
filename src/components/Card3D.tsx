import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Card3DProps {
  children: React.ReactNode;
  gradient?: readonly [string, string, ...string[]] | [string, string];
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tiltAngle?: number; // Maximum tilt degrees, default 15
  glowColor?: string;
  borderColor?: string;
  disableTilt?: boolean;
}

export function Card3D({
  children,
  gradient = ['rgba(26, 32, 48, 0.95)', 'rgba(14, 18, 28, 0.98)'],
  style,
  onPress,
  tiltAngle = 14,
  glowColor = 'rgba(99, 102, 241, 0.25)',
  borderColor = 'rgba(255, 255, 255, 0.12)',
  disableTilt = false,
}: Card3DProps) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardWidth = useSharedValue(320);
  const cardHeight = useSharedValue(180);

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(!disableTilt)
    .onBegin(() => {
      scale.value = withSpring(1.025, { damping: 14, stiffness: 150 });
    })
    .onUpdate((event) => {
      const halfW = cardWidth.value / 2 || 160;
      const halfH = cardHeight.value / 2 || 90;

      // Invert coordinates for natural 3D tilt
      rotateY.value = interpolate(
        event.x - halfW,
        [-halfW, halfW],
        [-tiltAngle, tiltAngle],
        Extrapolation.CLAMP
      );
      rotateX.value = interpolate(
        event.y - halfH,
        [-halfH, halfH],
        [tiltAngle, -tiltAngle],
        Extrapolation.CLAMP
      );
    })
    .onFinalize(() => {
      rotateX.value = withSpring(0, { damping: 14, stiffness: 140 });
      rotateY.value = withSpring(0, { damping: 14, stiffness: 140 });
      scale.value = withSpring(1, { damping: 14, stiffness: 140 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (onPress) {
        runOnJS(handlePress)();
      }
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 850 },
        { scale: scale.value },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ],
    };
  });

  const glareStyle = useAnimatedStyle(() => {
    const translateX = interpolate(rotateY.value, [-tiltAngle, tiltAngle], [-70, 70]);
    const translateY = interpolate(rotateX.value, [-tiltAngle, tiltAngle], [-50, 50]);
    const opacity = interpolate(
      Math.abs(rotateX.value) + Math.abs(rotateY.value),
      [0, tiltAngle * 1.5],
      [0.05, 0.45],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { translateY }],
      opacity,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        onLayout={(e) => {
          cardWidth.value = e.nativeEvent.layout.width;
          cardHeight.value = e.nativeEvent.layout.height;
        }}
        style={[
          styles.cardOuter,
          {
            shadowColor: glowColor,
            borderColor,
          },
          animatedStyle,
          style,
        ]}
      >
        <LinearGradient
          colors={gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientSurface}
        >
          {/* Dynamic 3D Glare effect */}
          <Animated.View style={[styles.glareLayer, glareStyle]}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.55)', 'rgba(255, 255, 255, 0.0)']}
              start={{ x: 0.2, y: 0.2 }}
              end={{ x: 0.8, y: 0.8 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Card Content */}
          <View style={styles.contentContainer}>{children}</View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  gradientSurface: {
    borderRadius: 21,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  glareLayer: {
    position: 'absolute',
    top: -80,
    left: -80,
    right: -80,
    bottom: -80,
    pointerEvents: 'none',
  },
  contentContainer: {
    zIndex: 2,
  },
});

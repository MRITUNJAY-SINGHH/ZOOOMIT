import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

export const HeaderMandalaBg = React.memo(({ width = 240, height = 220 }) => {
  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <G transform="translate(190, 24)" stroke="rgba(217, 119, 6, 0.12)" strokeWidth="1" fill="none">
          <Circle cx="0" cy="0" r="18" />
          <Circle cx="0" cy="0" r="36" strokeDasharray="3,3" />
          <Circle cx="0" cy="0" r="58" />
          <Circle cx="0" cy="0" r="82" strokeDasharray="4,4" />
          <Circle cx="0" cy="0" r="112" />
          <Circle cx="0" cy="0" r="148" strokeDasharray="6,4" />
          <Circle cx="0" cy="0" r="190" />

          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = Math.cos(angle) * 36;
            const y1 = Math.sin(angle) * 36;
            const x2 = Math.cos(angle) * 82;
            const y2 = Math.sin(angle) * 82;
            const px = Math.cos(angle + 0.15) * 58;
            const py = Math.sin(angle + 0.15) * 58;
            return (
              <Path
                key={`p-${i}`}
                d={`M${x1} ${y1} Q${px} ${py} ${x2} ${y2}`}
                stroke="rgba(217, 119, 6, 0.10)"
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: -1,
  },
});

export default HeaderMandalaBg;

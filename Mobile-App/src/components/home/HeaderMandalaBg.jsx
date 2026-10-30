import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

export const HeaderMandalaBg = React.memo(() => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={200} height={160} viewBox="0 0 200 160">
        <G transform="translate(160, 10)" stroke="rgba(217, 119, 6, 0.12)" strokeWidth="1" fill="none">
          <Circle cx="0" cy="0" r="16" />
          <Circle cx="0" cy="0" r="32" strokeDasharray="3,3" />
          <Circle cx="0" cy="0" r="50" />
          <Circle cx="0" cy="0" r="70" strokeDasharray="4,4" />
          <Circle cx="0" cy="0" r="95" />
          <Circle cx="0" cy="0" r="125" strokeDasharray="6,4" />

          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = Math.cos(angle) * 32;
            const y1 = Math.sin(angle) * 32;
            const x2 = Math.cos(angle) * 70;
            const y2 = Math.sin(angle) * 70;
            const px = Math.cos(angle + 0.15) * 52;
            const py = Math.sin(angle + 0.15) * 52;
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
    width: 200,
    height: 160,
    overflow: 'hidden',
    zIndex: -1,
  },
});

export default HeaderMandalaBg;

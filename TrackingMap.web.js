import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Web fallback for TrackingMap. react-native-maps only works on iOS/Android,
 * so on the web we embed a Google map of the job address instead.
 * Metro picks this file automatically on web because of the .web.js suffix.
 * The worker's live position is not drawn here; use a web map library
 * (Leaflet, Mapbox GL) if you need that on the web.
 */
export default function TrackingMap({ address, style }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address || '')}&output=embed`;
  return (
    <View style={[styles.box, style]}>
      {React.createElement('iframe', {
        src,
        title: 'Job location',
        style: { border: 0, width: '100%', height: '100%' },
        loading: 'lazy',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 240, borderRadius: 10, overflow: 'hidden', marginBottom: 8, backgroundColor: '#17212B' },
});

import React from 'react';
import { Slot } from 'expo-router';
import { Shell } from '../../src/components/Shell';
export default function Workspace() {
  return (
    <Shell>
      <Slot />
    </Shell>
  );
}

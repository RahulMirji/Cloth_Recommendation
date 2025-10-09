/**
 * Example Test - ImageGen ExploreSection Component
 * 
 * Simple smoke test to demonstrate co-located testing setup.
 * This test ensures the component can be imported without crashing.
 * No logic or UI modifications.
 */

import React from 'react';
import { ExploreSection } from './ExploreSection';

describe('ImageGen - ExploreSection', () => {
  it('component exports correctly', () => {
    // Simple check that the component is defined
    expect(ExploreSection).toBeDefined();
    expect(typeof ExploreSection).toBe('function');
  });
});

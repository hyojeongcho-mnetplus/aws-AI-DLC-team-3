import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SourceHealthRail } from './SourceHealthRail';
import type { SourceHealth } from '@ffr/shared';

const sources: SourceHealth[] = [
  { source: 'appstore', status: 'LIVE', reviewCount: 10, updatedAt: '2026-05-20T00:00:00Z' },
  { source: 'googleplay', status: 'BLOCKED', reviewCount: 5, lastErrorAt: '2026-05-20T00:00:00Z', errorMessage: 'timeout', updatedAt: '2026-05-20T00:00:00Z' },
];

describe('SourceHealthRail', () => {
  it('renders all sources with status', () => {
    render(<SourceHealthRail sources={sources} />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    expect(screen.getByText('10건')).toBeInTheDocument();
  });

  it('has accessible list role', () => {
    render(<SourceHealthRail sources={sources} />);
    expect(screen.getByRole('list', { name: '소스 상태' })).toBeInTheDocument();
  });
});

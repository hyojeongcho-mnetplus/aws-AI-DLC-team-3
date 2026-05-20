import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RisingIssuesList } from './RisingIssuesList';
import type { ClusterSnapshot } from '@ffr/shared';

const issues: ClusterSnapshot[] = [
  { clusterId: 'c1', category: 'ads', severity: 2, title: '광고 이슈', issueType: 'error', errorLevel: 2, reviewCount: 5, recentReviewIds: [], updatedAt: '' },
  { clusterId: 'c2', category: 'vote', severity: 1, title: '투표 장애', issueType: 'error', errorLevel: 1, reviewCount: 12, recentReviewIds: [], updatedAt: '' },
];

describe('RisingIssuesList', () => {
  it('sorts by severity (P1 first)', () => {
    render(<RisingIssuesList issues={issues} onSelect={() => {}} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('투표 장애');
    expect(items[1]).toHaveTextContent('광고 이슈');
  });

  it('calls onSelect with clusterId on click', () => {
    const onSelect = vi.fn();
    render(<RisingIssuesList issues={issues} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('광고 이슈'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });

  it('highlights selected item', () => {
    render(<RisingIssuesList issues={issues} selectedId="c2" onSelect={() => {}} />);
    const selected = screen.getAllByRole('listitem')[0]; // c2 is first (severity 1)
    expect(selected.className).toContain('ring-1');
  });
});

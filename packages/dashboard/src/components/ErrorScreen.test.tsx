import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorScreen } from './ErrorScreen';

describe('ErrorScreen', () => {
  it('displays error message', () => {
    render(<ErrorScreen error="네트워크 오류" onRetry={() => {}} />);
    expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
  });

  it('calls onRetry when button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorScreen error="err" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: '재시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RewardsSection } from '../components/RewardsSection';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock motion/react
vi.mock('motion/react', () => {
  const MotionDiv = ({ children, whileHover, whileTap, transition, ...rest }: any) => (
    <div {...rest}>{children}</div>
  );

  return {
    motion: {
      div: MotionDiv,
    },
  };
});

// Mock the pointsService
vi.mock('../services/points.service', () => ({
  pointsService: {
    redeemReward: vi.fn(),
  },
}));

describe('RewardsSection', () => {
  beforeEach(() => {
    // Mock fetch to simulate API failure and fallback to mock data
    global.fetch = vi.fn().mockRejectedValue(new Error('API not available'));
  });

  it('renders loading state initially', async () => {
    render(<RewardsSection userPoints={1000} />);

    expect(screen.getByText('加载奖励中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('加载奖励中...')).not.toBeInTheDocument();
    });
  });

  it('renders rewards after loading', async () => {
    render(<RewardsSection userPoints={1000} />);
    
    // Wait for the loading to finish and fallback data to appear
    await waitFor(() => {
      expect(screen.queryByText('加载奖励中...')).not.toBeInTheDocument();
    });

    // Check if fallback rewards are displayed
    await waitFor(() => {
      expect(screen.getByText('乐高积木套装')).toBeInTheDocument();
      expect(screen.getByText('儿童图书套装')).toBeInTheDocument();
    });
  });

  it('handles API failure gracefully with fallback data', async () => {
    render(<RewardsSection userPoints={1000} />);
    
    await waitFor(() => {
      expect(screen.getByText('乐高积木套装')).toBeInTheDocument();
    });

    // Verify that fetch was called (and failed)
    expect(global.fetch).toHaveBeenCalledWith('/api/rewards/available');
  });
});

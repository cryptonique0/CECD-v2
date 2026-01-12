// continuousLearningService.ts
// Training, after-action review, AI-driven improvement recommendations

import type { Incident } from '../types';

export interface TrainingSession {
  id: string;
  title: string;
  participants: string[];
  scenario: string;
  completed: boolean;
  score: number;
  feedback: string;
  timestamp: number;
}

export interface AfterActionReview {
  id: string;
  incidentId: string;
  summary: string;
  lessonsLearned: string[];
  aiRecommendations: string[];
  timestamp: number;
}

class ContinuousLearningService {
  private sessions: TrainingSession[] = [];
  private reviews: AfterActionReview[] = [];

  addTrainingSession(session: Omit<TrainingSession, 'id' | 'timestamp'>): TrainingSession {
    const newSession: TrainingSession = {
      ...session,
      id: `training-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now()
    };
    this.sessions.push(newSession);
    return newSession;
  }

  getTrainingSessions(): TrainingSession[] {
    return this.sessions;
  }

  addAfterActionReview(review: Omit<AfterActionReview, 'id' | 'timestamp'>): AfterActionReview {
    // AI-driven recommendations (stub)
    const aiRecommendations = [
      'Increase responder training for high-severity incidents',
      'Improve communication protocols during multi-agency response',
      'Optimize resource allocation based on predictive analytics'
    ];
    const newReview: AfterActionReview = {
      ...review,
      id: `aar-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      aiRecommendations,
      timestamp: Date.now()
    };
    this.reviews.push(newReview);
    return newReview;
  }

  getAfterActionReviews(): AfterActionReview[] {
    return this.reviews;
  }
}

export const continuousLearningService = new ContinuousLearningService();

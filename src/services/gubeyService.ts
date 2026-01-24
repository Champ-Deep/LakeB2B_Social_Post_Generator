/**
 * GubeyService - Interaction tracking service
 *
 * Handles tracking of Gubey mascot interactions for analytics.
 * Uses localStorage for tracking when database is not available.
 */

import type { GubeyInteractionData } from '../types/gubey';

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * GubeyService class
 *
 * Singleton service for tracking Gubey interactions.
 * Uses localStorage for persistence since we're running fully local.
 */
class GubeyServiceClass {
  private static instance: GubeyServiceClass;
  private sessionId: string;

  private constructor() {
    this.sessionId = generateSessionId();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GubeyServiceClass {
    if (!GubeyServiceClass.instance) {
      GubeyServiceClass.instance = new GubeyServiceClass();
    }
    return GubeyServiceClass.instance;
  }

  /**
   * Track an interaction
   *
   * @param data - Interaction data to track
   */
  async trackInteraction(data: GubeyInteractionData): Promise<void> {
    // Skip if running on server
    if (typeof window === 'undefined') return;

    try {
      // Log interaction for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('Gubey interaction:', {
          sessionId: this.sessionId,
          ...data,
          timestamp: new Date().toISOString()
        });
      }

      // Store interaction in localStorage for local analytics
      const storageKey = 'gubey_interactions';
      const existingData = localStorage.getItem(storageKey);
      const interactions = existingData ? JSON.parse(existingData) : [];

      interactions.push({
        sessionId: this.sessionId,
        interactionType: data.interactionType,
        contextPathname: data.contextPathname || null,
        stateFrom: data.stateFrom || null,
        stateTo: data.stateTo || null,
        metadata: data.metadata || {},
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 interactions to prevent storage bloat
      const trimmedInteractions = interactions.slice(-100);
      localStorage.setItem(storageKey, JSON.stringify(trimmedInteractions));

    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug('Gubey: Error tracking interaction:', error);
    }
  }

  /**
   * Check if this is the user's first visit
   *
   * Uses localStorage for tracking.
   */
  async getFirstVisitStatus(): Promise<boolean> {
    // Check localStorage
    if (typeof window !== 'undefined') {
      const visited = localStorage.getItem('gubey_visited');
      return visited !== 'true';
    }

    return true;
  }

  /**
   * Mark first visit as complete
   */
  markFirstVisitComplete(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gubey_visited', 'true');
    }

    // Also track in local storage
    this.trackInteraction({
      interactionType: 'greeting_shown',
    });
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Reset session (for testing)
   */
  resetSession(): void {
    this.sessionId = generateSessionId();
  }

  /**
   * Get stored interactions (for debugging)
   */
  getStoredInteractions(): any[] {
    if (typeof window === 'undefined') return [];

    try {
      const storageKey = 'gubey_interactions';
      const existingData = localStorage.getItem(storageKey);
      return existingData ? JSON.parse(existingData) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored interactions (for testing)
   */
  clearStoredInteractions(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gubey_interactions');
    }
  }
}

// Export singleton instance
export const gubeyService = GubeyServiceClass.getInstance();

// Also export class for testing
export { GubeyServiceClass };

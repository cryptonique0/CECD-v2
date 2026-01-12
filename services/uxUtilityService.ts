// UXUtilityService
// Tracks cognitive load, accessibility, and minimal mode state

export type AccessibilityMode = 'default' | 'colorblind' | 'low-light' | 'large-text';

class UXUtilityService {
  private cognitiveLoad: number = 0; // 0-100 scale
  private minimalMode: boolean = false;
  private accessibilityMode: AccessibilityMode = 'default';

  setCognitiveLoad(load: number) {
    this.cognitiveLoad = Math.max(0, Math.min(100, load));
  }
  getCognitiveLoad() {
    return this.cognitiveLoad;
  }

  setMinimalMode(enabled: boolean) {
    this.minimalMode = enabled;
  }
  isMinimalMode() {
    return this.minimalMode;
  }

  setAccessibilityMode(mode: AccessibilityMode) {
    this.accessibilityMode = mode;
  }
  getAccessibilityMode() {
    return this.accessibilityMode;
  }
}

export const uxUtilityService = new UXUtilityService();

import { Haptics as CapHaptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Universal Haptics Engine combining Capacitor 8 Native Haptics Plugin with Web Vibration Fallbacks.
 * Delivers precise tactile feedback for banking transactions, security alerts, PIN authorization, and micro-interactions.
 */
export const Haptics = {
  // Subtle tactile button press
  tap: async () => {
    try {
      await CapHaptics.impact({ style: ImpactStyle.Light });
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  },

  // Medium action feedback
  medium: async () => {
    try {
      await CapHaptics.impact({ style: ImpactStyle.Medium });
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25);
      }
    }
  },

  // Heavy impact for large transfers & authorizations
  heavy: async () => {
    try {
      await CapHaptics.impact({ style: ImpactStyle.Heavy });
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  },

  // Success feedback (double haptic confirmation pulse)
  success: async () => {
    try {
      await CapHaptics.notification({ type: NotificationType.Success });
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 80, 20]);
      }
    }
  },

  // Warning feedback for limits / compliance holds
  warning: async () => {
    try {
      await CapHaptics.notification({ type: NotificationType.Warning });
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    }
  },

  // Error/Security alert pulse
  error: async () => {
    try {
      await CapHaptics.notification({ type: NotificationType.Error });
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 100, 50, 100, 50]);
      }
    }
  },

  // Selection change feedback for tabs and list pickers
  selection: async () => {
    try {
      await CapHaptics.selectionChanged();
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(5);
      }
    }
  },

  // Biometric / FaceID scan sensory sequence
  auth: async () => {
    try {
      await CapHaptics.impact({ style: ImpactStyle.Medium });
      setTimeout(() => {
        CapHaptics.notification({ type: NotificationType.Success }).catch(() => {});
      }, 120);
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 50, 10, 50, 30]);
      }
    }
  },

  // Refined institutional haptic pattern for 'Safety Guard' threshold breach
  safetyGuard: async (intensity: number = 80) => {
    try {
      // 1. Initial warning alert notification pulse
      await CapHaptics.notification({ type: NotificationType.Warning });
      
      // 2. Secondary heavy impact pulse after brief cadence
      setTimeout(async () => {
        try {
          await CapHaptics.impact({ style: ImpactStyle.Heavy });
        } catch (_) {}
      }, 140);

      // 3. Final firm settling impact for urgent tactile awareness
      setTimeout(async () => {
        try {
          await CapHaptics.impact({ style: ImpactStyle.Medium });
        } catch (_) {}
      }, 280);
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 80, 100, 60, 40]);
      }
    }
  }
};

export const triggerSafetyGuardHaptic = async (intensity: number = 80) => {
  await Haptics.safetyGuard(intensity);
};

export const triggerHaptic = async (pattern: number | number[] = 10, intensity: number = 80) => {
  try {
    if (typeof pattern === 'number') {
      if (pattern >= 40) {
        await CapHaptics.impact({ style: ImpactStyle.Heavy });
      } else if (pattern >= 20) {
        await CapHaptics.impact({ style: ImpactStyle.Medium });
      } else {
        await CapHaptics.impact({ style: ImpactStyle.Light });
      }
    } else {
      await CapHaptics.vibrate({ duration: 300 });
    }
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
};

export const triggerSuccessHaptic = async (intensity: number = 80) => {
  try {
    await CapHaptics.notification({ type: NotificationType.Success });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 80, 20]);
    }
  }
};

export const triggerFailureHaptic = async (intensity: number = 80) => {
  try {
    await CapHaptics.notification({ type: NotificationType.Error });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 100, 50, 100, 50]);
    }
  }
};

export const triggerWarningHaptic = async (intensity: number = 80) => {
  try {
    await CapHaptics.notification({ type: NotificationType.Warning });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
  }
};

export const triggerSecurityAlertHaptic = async () => {
  try {
    await CapHaptics.notification({ type: NotificationType.Error });
    await CapHaptics.vibrate({ duration: 400 });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }
};

export const triggerButtonPressHaptic = async () => {
  try {
    await CapHaptics.impact({ style: ImpactStyle.Light });
  } catch (_) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
  }
};


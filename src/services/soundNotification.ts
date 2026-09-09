// Browser Audio & Desktop Push Notification Service for Arishten
// Provides audio chime synthesized with Web Audio API + HTML5 Desktop Notification

class SoundNotificationService {
  private audioCtx: AudioContext | null = null;
  private permissionGranted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        this.permissionGranted = Notification.permission === 'granted';
      }
    }
  }

  // Request browser desktop notification permission
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permissionGranted = result === 'granted';
      return this.permissionGranted;
    } catch (e) {
      console.warn('Could not request notification permission:', e);
      return false;
    }
  }

  public hasPermission(): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  }

  // Plays a pleasant 3-tone chime for new orders using Web Audio API
  public playOrderChime() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Note sequence: E5 (659.25Hz), G#5 (830.61Hz), B5 (987.77Hz), E6 (1318.51Hz)
      const notes = [
        { freq: 587.33, start: 0, duration: 0.18 }, // D5
        { freq: 739.99, start: 0.14, duration: 0.2 }, // F#5
        { freq: 880.00, start: 0.28, duration: 0.25 }, // A5
        { freq: 1174.66, start: 0.44, duration: 0.65 } // D6 ring
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        // Gentle attack and smooth decay
        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.35, now + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  // Triggers browser desktop notification
  public showDesktopNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=120&auto=format&fit=crop&q=80',
          badge: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=96&auto=format&fit=crop&q=80',
          ...options
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        // Auto close after 8 seconds
        setTimeout(() => {
          try {
            notif.close();
          } catch (e) {}
        }, 8000);
      } catch (e) {
        console.warn('Error showing Notification:', e);
      }
    }
  }

  // Unified helper for incoming order notification: sound + desktop alert
  public notifyNewOrder(order: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    phone: string;
    district?: string;
  }) {
    // 1. Play sound chime
    this.playOrderChime();

    // 2. Desktop notification
    const title = `🛒 নতুন অর্ডার এসেছে! #${order.orderNumber}`;
    const body = `${order.customerName} (৳${order.totalAmount})\n📞 ${order.phone} | 📍 ${order.district || 'বাংলাদেশ'}`;

    this.showDesktopNotification(title, {
      body,
      tag: `order-${order.orderNumber}`
    });
  }
}

export const soundNotification = new SoundNotificationService();

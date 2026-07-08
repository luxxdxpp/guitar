import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Define global channel subscribers for mock real-time events
type SubscriptionCallback = (payload: any) => void;
const channelSubscribers: Record<string, Set<SubscriptionCallback>> = {};

// Create actual client if configured, otherwise we'll run a local mock engine
let supabaseInstance: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

export const supabase = supabaseInstance;

// Auth Interface
export interface UserProfile {
  id: string;
  email: string;
  role?: string;
  created_at: string;
}

// Simulated Local/Real DB Layer
class StudioDatabaseService {
  private static STORAGE_KEY_REVIEWS = 'studio_reviews';
  private static STORAGE_KEY_AUTH = 'studio_user';

  // Auth Operations
  static getSessionUser(): UserProfile | null {
    if (isSupabaseConfigured && supabase) {
      // Direct session fetch would be handled via supabase.auth.getSession
    }
    const saved = localStorage.getItem(this.STORAGE_KEY_AUTH);
    return saved ? JSON.parse(saved) : null;
  }

  static async signUp(email: string): Promise<{ user: UserProfile | null; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password: 'password123!' });
      if (error) return { user: null, error };
      const profile: UserProfile = {
        id: data.user?.id || Math.random().toString(36).substr(2, 9),
        email: email,
        created_at: new Date().toISOString(),
      };
      return { user: profile, error: null };
    }

    // Mock SignUp
    const profile: UserProfile = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      email,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(this.STORAGE_KEY_AUTH, JSON.stringify(profile));
    return { user: profile, error: null };
  }

  static async signIn(email: string): Promise<{ user: UserProfile | null; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: 'password123!' });
      if (error) return { user: null, error };
      const profile: UserProfile = {
        id: data.user?.id || 'usr-default',
        email: data.user?.email || email,
        created_at: data.user?.created_at || new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY_AUTH, JSON.stringify(profile));
      return { user: profile, error: null };
    }

    // Mock SignIn
    const profile: UserProfile = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      email,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(this.STORAGE_KEY_AUTH, JSON.stringify(profile));
    return { user: profile, error: null };
  }

  static async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(this.STORAGE_KEY_AUTH);
  }

  // Review Operations
  static getReviews(studioId: string): any[] {
    const saved = localStorage.getItem(`${this.STORAGE_KEY_REVIEWS}_${studioId}`);
    return saved ? JSON.parse(saved) : [];
  }

  static async addReview(studioId: string, user: string, rating: number, content: string): Promise<any> {
    const newReview = {
      id: 'rev-' + Date.now(),
      user,
      rating,
      content,
      date: new Date().toISOString().split('T')[0],
      studio_id: studioId,
    };

    if (isSupabaseConfigured && supabase) {
      // Write to Supabase table: reviews
      const { data, error } = await supabase
        .from('reviews')
        .insert([{ studio_id: studioId, user_name: user, rating, content }])
        .select();
      
      if (!error && data) {
        // Trigger real-time callback via channel if anyone is listening
        this.triggerRealtime(studioId, newReview);
        return data[0];
      }
    }

    // Local Storage Mock Write
    const existing = this.getReviews(studioId);
    const updated = [newReview, ...existing];
    localStorage.setItem(`${this.STORAGE_KEY_REVIEWS}_${studioId}`, JSON.stringify(updated));

    // Trigger real-time callback
    this.triggerRealtime(studioId, newReview);
    return newReview;
  }

  // Real-time listener subscription (Simulated/Supabase channel)
  static subscribeToReviews(studioId: string, callback: SubscriptionCallback): () => void {
    const channelName = `reviews:${studioId}`;

    if (isSupabaseConfigured && supabase) {
      // Connect real-time subscription channel using supabase
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'reviews', filter: `studio_id=eq.${studioId}` },
          (payload) => {
            const transformed = {
              id: payload.new.id,
              user: payload.new.user_name || 'Anonymous User',
              rating: payload.new.rating,
              content: payload.new.content,
              date: new Date(payload.new.created_at).toISOString().split('T')[0],
              studio_id: payload.new.studio_id,
            };
            callback(transformed);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // Local Mock Real-time Listener
    if (!channelSubscribers[studioId]) {
      channelSubscribers[studioId] = new Set();
    }
    channelSubscribers[studioId].add(callback);

    return () => {
      channelSubscribers[studioId]?.delete(callback);
    };
  }

  private static triggerRealtime(studioId: string, data: any) {
    if (channelSubscribers[studioId]) {
      channelSubscribers[studioId].forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error('Error in subscriber callback:', e);
        }
      });
    }
  }
}

export { StudioDatabaseService };

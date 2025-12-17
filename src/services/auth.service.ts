import { supabase } from "@/integrations/supabase/client";

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  preferences?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  async signUp(data: SignUpData): Promise<{ userId: string | null; error: Error | null }> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName
        }
      }
    });

    if (authError || !authData.user) {
      return { userId: null, error: authError };
    }

    // Update profile with additional data
    if (data.phone || data.preferences) {
      await supabase
        .from("profiles")
        .update({
          phone: data.phone,
          preferences: data.preferences
        })
        .eq("user_id", authData.user.id);
    }

    return { userId: authData.user.id, error: null };
  }

  async signIn(data: SignInData): Promise<{ userId: string | null; error: Error | null }> {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error || !authData.user) {
      return { userId: null, error };
    }

    return { userId: authData.user.id, error: null };
  }

  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
    return { error };
  }

  async getSession() {
    return supabase.auth.getSession();
  }

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return { data, error };
  }

  async updateProfile(userId: string, updates: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    preferences?: Record<string, any>;
  }) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    return { data, error };
  }

  async checkRole(userId: string, role: 'admin' | 'superadmin' | 'moderator' | 'user'): Promise<boolean> {
    const { data } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: role
    });
    return !!data;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const isAdmin = await this.checkRole(userId, 'admin');
    const isSuperadmin = await this.checkRole(userId, 'superadmin');
    return isAdmin || isSuperadmin;
  }
}

export const authService = new AuthService();

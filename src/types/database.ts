export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      age_categories: {
        Row: {
          age_from: number
          age_to: number
          created_at: string | null
          food_factor: number
          id: string
          meal_factor: number
          name: string
          overnight_factor: number
          sort_order: number | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          age_from: number
          age_to: number
          created_at?: string | null
          food_factor?: number
          id?: string
          meal_factor?: number
          name: string
          overnight_factor?: number
          sort_order?: number | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          age_from?: number
          age_to?: number
          created_at?: string | null
          food_factor?: number
          id?: string
          meal_factor?: number
          name?: string
          overnight_factor?: number
          sort_order?: number | null
          trip_id?: string
          updated_at?: string | null
        }
      }
      attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          meal_confirmed: boolean | null
          overnight_confirmed: boolean | null
          person_id: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          meal_confirmed?: boolean | null
          overnight_confirmed?: boolean | null
          person_id: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          meal_confirmed?: boolean | null
          overnight_confirmed?: boolean | null
          person_id?: string
          trip_id?: string
          updated_at?: string | null
        }
      }
      billing_groups: {
        Row: {
          contact_person_id: string | null
          created_at: string | null
          id: string
          name: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          contact_person_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          contact_person_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          trip_id?: string
          updated_at?: string | null
        }
      }
      billings: {
        Row: {
          amount_due_meal: number
          billed_at: string | null
          billed_by: string | null
          billing_group_id: string
          created_at: string | null
          expenses_total: number
          flat_rate_applied: boolean
          id: string
          meal_cost: number
          meal_days: number
          meal_rate: number
          overnight_billed: boolean | null
          overnight_billed_at: string | null
          overnight_cost: number
          overnight_count: number
          overnight_rate_base: number
          paid_meal: number | null
          paid_overnight: number | null
          snapshot_attendance: Json | null
          snapshot_expenses: Json | null
          snapshot_persons: Json | null
          surplus_flat_meal: number | null
          surplus_flat_overnight: number | null
          surplus_meal: number | null
          trip_id: string
          type: 'interim' | 'final'
          updated_at: string | null
        }
        Insert: {
          amount_due_meal: number
          billed_at?: string | null
          billed_by?: string | null
          billing_group_id: string
          created_at?: string | null
          expenses_total?: number
          flat_rate_applied?: boolean
          id?: string
          meal_cost: number
          meal_days: number
          meal_rate: number
          overnight_billed?: boolean | null
          overnight_billed_at?: string | null
          overnight_cost: number
          overnight_count: number
          overnight_rate_base: number
          paid_meal?: number | null
          paid_overnight?: number | null
          snapshot_attendance?: Json | null
          snapshot_expenses?: Json | null
          snapshot_persons?: Json | null
          surplus_flat_meal?: number | null
          surplus_flat_overnight?: number | null
          surplus_meal?: number | null
          trip_id: string
          type: 'interim' | 'final'
          updated_at?: string | null
        }
        Update: {
          amount_due_meal?: number
          billed_at?: string | null
          billed_by?: string | null
          billing_group_id?: string
          created_at?: string | null
          expenses_total?: number
          flat_rate_applied?: boolean
          id?: string
          meal_cost?: number
          meal_days?: number
          meal_rate?: number
          overnight_billed?: boolean | null
          overnight_billed_at?: string | null
          overnight_cost?: number
          overnight_count?: number
          overnight_rate_base?: number
          paid_meal?: number | null
          paid_overnight?: number | null
          snapshot_attendance?: Json | null
          snapshot_expenses?: Json | null
          snapshot_persons?: Json | null
          surplus_flat_meal?: number | null
          surplus_flat_overnight?: number | null
          surplus_meal?: number | null
          trip_id?: string
          type?: 'interim' | 'final'
          updated_at?: string | null
        }
      }
      dish_ingredients: {
        Row: {
          amount_per_person: number
          created_at: string | null
          dish_id: string
          id: string
          name: string
          sort_order: number | null
          unit: string
        }
        Insert: {
          amount_per_person: number
          created_at?: string | null
          dish_id: string
          id?: string
          name: string
          sort_order?: number | null
          unit: string
        }
        Update: {
          amount_per_person?: number
          created_at?: string | null
          dish_id?: string
          id?: string
          name?: string
          sort_order?: number | null
          unit?: string
        }
      }
      dishes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          trip_id?: string
          updated_at?: string | null
        }
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          id: string
          person_id: string | null
          photo: string | null
          receipt_checked: boolean | null
          rejection_reason: string | null
          status: 'submitted' | 'confirmed' | 'rejected' | null
          submitted_by: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          person_id?: string | null
          photo?: string | null
          receipt_checked?: boolean | null
          rejection_reason?: string | null
          status?: 'submitted' | 'confirmed' | 'rejected' | null
          submitted_by?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          person_id?: string | null
          photo?: string | null
          receipt_checked?: boolean | null
          rejection_reason?: string | null
          status?: 'submitted' | 'confirmed' | 'rejected' | null
          submitted_by?: string | null
          trip_id?: string
          updated_at?: string | null
        }
      }
      meal_plan: {
        Row: {
          created_at: string | null
          date: string
          dish_id: string | null
          id: string
          notes: string | null
          responsible_1_id: string | null
          responsible_2_id: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          dish_id?: string | null
          id?: string
          notes?: string | null
          responsible_1_id?: string | null
          responsible_2_id?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          dish_id?: string | null
          id?: string
          notes?: string | null
          responsible_1_id?: string | null
          responsible_2_id?: string | null
          trip_id?: string
          updated_at?: string | null
        }
      }
      persons: {
        Row: {
          arrival_date: string
          billing_group_id: string | null
          birth_date: string
          city: string | null
          created_at: string | null
          departure_date: string
          email: string | null
          first_name: string
          house_number: string | null
          id: string
          id_number: string | null
          id_type: 'id_card' | 'passport' | null
          issuing_authority: string | null
          last_name: string
          nationality: string | null
          phone: string | null
          postal_code: string | null
          registration_required: boolean | null
          room_id: string | null
          street: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          arrival_date: string
          billing_group_id?: string | null
          birth_date: string
          city?: string | null
          created_at?: string | null
          departure_date: string
          email?: string | null
          first_name: string
          house_number?: string | null
          id?: string
          id_number?: string | null
          id_type?: 'id_card' | 'passport' | null
          issuing_authority?: string | null
          last_name: string
          nationality?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_required?: boolean | null
          room_id?: string | null
          street?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          arrival_date?: string
          billing_group_id?: string | null
          birth_date?: string
          city?: string | null
          created_at?: string | null
          departure_date?: string
          email?: string | null
          first_name?: string
          house_number?: string | null
          id?: string
          id_number?: string | null
          id_type?: 'id_card' | 'passport' | null
          issuing_authority?: string | null
          last_name?: string
          nationality?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_required?: boolean | null
          room_id?: string | null
          street?: string | null
          trip_id?: string
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          person_id: string | null
          role: 'admin' | 'user' | 'guest' | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          person_id?: string | null
          role?: 'admin' | 'user' | 'guest' | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          person_id?: string | null
          role?: 'admin' | 'user' | 'guest' | null
          updated_at?: string | null
        }
      }
      rooms: {
        Row: {
          beds: number
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          beds?: number
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          beds?: number
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          trip_id?: string
          updated_at?: string | null
        }
      }
      trips: {
        Row: {
          bank_iban: string | null
          cabin_price: number
          created_at: string | null
          created_by: string | null
          end_date: string
          flat_rate_meal: number
          flat_rate_overnight: number
          id: string
          name: string
          start_date: string
          status: 'planning' | 'active' | 'completed' | 'archived'
          updated_at: string | null
          year: number
        }
        Insert: {
          bank_iban?: string | null
          cabin_price?: number
          created_at?: string | null
          created_by?: string | null
          end_date: string
          flat_rate_meal?: number
          flat_rate_overnight?: number
          id?: string
          name: string
          start_date: string
          status?: 'planning' | 'active' | 'completed' | 'archived'
          updated_at?: string | null
          year: number
        }
        Update: {
          bank_iban?: string | null
          cabin_price?: number
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          flat_rate_meal?: number
          flat_rate_overnight?: number
          id?: string
          name?: string
          start_date?: string
          status?: 'planning' | 'active' | 'completed' | 'archived'
          updated_at?: string | null
          year?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_role: { Args: Record<string, never>; Returns: string }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_user_or_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Trip = Tables<'trips'>
export type AgeCategory = Tables<'age_categories'>
export type Room = Tables<'rooms'>
export type BillingGroup = Tables<'billing_groups'>
export type Person = Tables<'persons'>
export type Profile = Tables<'profiles'>
export type Attendance = Tables<'attendance'>
export type Expense = Tables<'expenses'>
export type Dish = Tables<'dishes'>
export type DishIngredient = Tables<'dish_ingredients'>
export type MealPlan = Tables<'meal_plan'>
export type Billing = Tables<'billings'>

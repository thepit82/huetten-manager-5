export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
        Relationships: [
          {
            foreignKeyName: "age_categories_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "attendance_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "billing_groups_contact_person_fk"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_groups_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
          type: string
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
          type: string
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
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billings_billing_group_id_fkey"
            columns: ["billing_group_id"]
            isOneToOne: false
            referencedRelation: "billing_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "dishes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          submitted_by?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "meal_plan_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_responsible_1_id_fkey"
            columns: ["responsible_1_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_responsible_2_id_fkey"
            columns: ["responsible_2_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
          id_type: string | null
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
          id_type?: string | null
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
          id_type?: string | null
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
        Relationships: [
          {
            foreignKeyName: "persons_billing_group_id_fkey"
            columns: ["billing_group_id"]
            isOneToOne: false
            referencedRelation: "billing_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          person_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          person_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          person_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "rooms_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
          status: string
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
          status?: string
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
          status?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_user_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ============================================================
// Convenience Type Aliases – direkt verwendbar in Komponenten
// ============================================================

export type Trip = Tables<'trips'>
export type TripInsert = TablesInsert<'trips'>
export type TripUpdate = TablesUpdate<'trips'>

export type AgeCategory = Tables<'age_categories'>
export type AgeCategoryInsert = TablesInsert<'age_categories'>
export type AgeCategoryUpdate = TablesUpdate<'age_categories'>

export type Room = Tables<'rooms'>
export type RoomInsert = TablesInsert<'rooms'>
export type RoomUpdate = TablesUpdate<'rooms'>

export type Person = Tables<'persons'>
export type PersonInsert = TablesInsert<'persons'>
export type PersonUpdate = TablesUpdate<'persons'>

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type BillingGroup = Tables<'billing_groups'>
export type BillingGroupInsert = TablesInsert<'billing_groups'>
export type BillingGroupUpdate = TablesUpdate<'billing_groups'>

export type Attendance = Tables<'attendance'>
export type AttendanceInsert = TablesInsert<'attendance'>
export type AttendanceUpdate = TablesUpdate<'attendance'>

export type Expense = Tables<'expenses'>
export type ExpenseInsert = TablesInsert<'expenses'>
export type ExpenseUpdate = TablesUpdate<'expenses'>

export type Dish = Tables<'dishes'>
export type DishInsert = TablesInsert<'dishes'>
export type DishUpdate = TablesUpdate<'dishes'>

export type DishIngredient = Tables<'dish_ingredients'>
export type DishIngredientInsert = TablesInsert<'dish_ingredients'>
export type DishIngredientUpdate = TablesUpdate<'dish_ingredients'>

export type MealPlan = Tables<'meal_plan'>
export type MealPlanInsert = TablesInsert<'meal_plan'>
export type MealPlanUpdate = TablesUpdate<'meal_plan'>

export type Billing = Tables<'billings'>
export type BillingInsert = TablesInsert<'billings'>
export type BillingUpdate = TablesUpdate<'billings'>

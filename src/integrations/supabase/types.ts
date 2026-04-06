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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      classes: {
        Row: {
          academic_year: number | null
          created_at: string
          grade: string
          id: string
          name: string
          school_id: string
          shift: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          created_at?: string
          grade: string
          id?: string
          name: string
          school_id: string
          shift?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          created_at?: string
          grade?: string
          id?: string
          name?: string
          school_id?: string
          shift?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          name: string
          required: boolean
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          required?: boolean
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          required?: boolean
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assignment_id: string
          average: number | null
          created_at: string
          grade1: number | null
          grade2: number | null
          grade3: number | null
          grade4: number | null
          id: string
          observation: string | null
          school_id: string
          student_id: string
          term: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          average?: number | null
          created_at?: string
          grade1?: number | null
          grade2?: number | null
          grade3?: number | null
          grade4?: number | null
          id?: string
          observation?: string | null
          school_id: string
          student_id: string
          term?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          average?: number | null
          created_at?: string
          grade1?: number | null
          grade2?: number | null
          grade3?: number | null
          grade4?: number | null
          id?: string
          observation?: string | null
          school_id?: string
          student_id?: string
          term?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "teacher_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          financial_responsible: boolean
          full_name: string
          id: string
          phone: string | null
          relationship: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          financial_responsible?: boolean
          full_name: string
          id?: string
          phone?: string | null
          relationship?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          financial_responsible?: boolean
          full_name?: string
          id?: string
          phone?: string | null
          relationship?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_signatures: {
        Row: {
          created_at: string
          id: string
          role_name: string
          school_id: string
          signature_url: string | null
          signer_name: string
          signer_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_name: string
          school_id: string
          signature_url?: string | null
          signer_name: string
          signer_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role_name?: string
          school_id?: string
          signature_url?: string | null
          signer_name?: string
          signer_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_signatures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          status: Database["public"]["Enums"]["school_user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          status?: Database["public"]["Enums"]["school_user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          status?: Database["public"]["Enums"]["school_user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academic_year: number | null
          address: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_documents: {
        Row: {
          approved_by: string | null
          created_at: string
          document_id: string
          due_date: string | null
          file_url: string | null
          id: string
          notes: string | null
          school_id: string
          status: Database["public"]["Enums"]["document_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          document_id: string
          due_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["document_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          document_id?: string
          due_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          is_primary: boolean
          school_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          is_primary?: boolean
          school_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          is_primary?: boolean
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string | null
          class_id: string | null
          cpf: string | null
          created_at: string
          enrollment_code: string | null
          full_name: string
          id: string
          notes: string | null
          photo_url: string | null
          school_id: string
          status: Database["public"]["Enums"]["student_status"]
          turn: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          class_id?: string | null
          cpf?: string | null
          created_at?: string
          enrollment_code?: string | null
          full_name: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["student_status"]
          turn?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          class_id?: string | null
          cpf?: string | null
          created_at?: string
          enrollment_code?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["student_status"]
          turn?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          academic_year: number | null
          assistant_id: string | null
          class_id: string
          created_at: string
          id: string
          school_id: string
          subject_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          assistant_id?: string | null
          class_id: string
          created_at?: string
          id?: string
          school_id: string
          subject_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          assistant_id?: string | null
          class_id?: string
          created_at?: string
          id?: string
          school_id?: string
          subject_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          profile_id: string | null
          school_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          school_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          school_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teste_conexao: {
        Row: {
          created_at: string | null
          id: string | null
          nome: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          nome?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          nome?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
      user_has_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _school_id: string
        }
        Returns: boolean
      }
      user_school_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "secretaria"
        | "coordenador"
        | "professor"
        | "auxiliar"
      document_status:
        | "pendente"
        | "enviado"
        | "aprovado"
        | "rejeitado"
        | "atrasado"
      school_user_status: "ativo" | "inativo"
      student_status:
        | "ativo"
        | "incompleto"
        | "irregular"
        | "transferido"
        | "inativo"
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
    Enums: {
      app_role: [
        "owner",
        "admin",
        "secretaria",
        "coordenador",
        "professor",
        "auxiliar",
      ],
      document_status: [
        "pendente",
        "enviado",
        "aprovado",
        "rejeitado",
        "atrasado",
      ],
      school_user_status: ["ativo", "inativo"],
      student_status: [
        "ativo",
        "incompleto",
        "irregular",
        "transferido",
        "inativo",
      ],
    },
  },
} as const

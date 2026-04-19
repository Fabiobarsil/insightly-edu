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
      academic_results: {
        Row: {
          academic_year: number
          created_at: string | null
          dependency_count: number | null
          final_status: string
          id: string
          school_id: string
          student_id: string
        }
        Insert: {
          academic_year: number
          created_at?: string | null
          dependency_count?: number | null
          final_status: string
          id?: string
          school_id: string
          student_id: string
        }
        Update: {
          academic_year?: number
          created_at?: string | null
          dependency_count?: number | null
          final_status?: string
          id?: string
          school_id?: string
          student_id?: string
        }
        Relationships: []
      }
      account_members: {
        Row: {
          access_expires_at: string | null
          access_type: string
          account_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          access_type?: string
          account_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          access_type?: string
          account_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          assessment_date: string | null
          class_id: string
          created_at: string | null
          id: string
          max_score: number | null
          name: string
          school_id: string
          subject_id: string
          teacher_id: string | null
          term: number
          type: string
          weight: number | null
        }
        Insert: {
          assessment_date?: string | null
          class_id: string
          created_at?: string | null
          id?: string
          max_score?: number | null
          name: string
          school_id: string
          subject_id: string
          teacher_id?: string | null
          term: number
          type: string
          weight?: number | null
        }
        Update: {
          assessment_date?: string | null
          class_id?: string
          created_at?: string | null
          id?: string
          max_score?: number | null
          name?: string
          school_id?: string
          subject_id?: string
          teacher_id?: string | null
          term?: number
          type?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_boletim"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_boletim_base"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          id: string
          school_id: string
          subject_id: string | null
          term: string | null
          title: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          school_id: string
          subject_id?: string | null
          term?: string | null
          title: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          school_id?: string
          subject_id?: string | null
          term?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_assignment_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignment_subject"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignment_subject"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_boletim"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "fk_assignment_subject"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_boletim_base"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          school_id: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          school_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          school_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      backup_classes_20260417: {
        Row: {
          academic_year: number | null
          capacity: number | null
          grade: string | null
          grade_id: string | null
          id: string | null
          name: string | null
          school_id: string | null
          shift: string | null
          shift_id: string | null
        }
        Insert: {
          academic_year?: number | null
          capacity?: number | null
          grade?: string | null
          grade_id?: string | null
          id?: string | null
          name?: string | null
          school_id?: string | null
          shift?: string | null
          shift_id?: string | null
        }
        Update: {
          academic_year?: number | null
          capacity?: number | null
          grade?: string | null
          grade_id?: string | null
          id?: string | null
          name?: string | null
          school_id?: string | null
          shift?: string | null
          shift_id?: string | null
        }
        Relationships: []
      }
      backup_guardians: {
        Row: {
          address: string | null
          birth_date: string | null
          can_authorize_image: boolean | null
          can_pickup: boolean | null
          can_receive_reports: boolean | null
          city: string | null
          company: string | null
          complement: string | null
          cpf: string | null
          district: string | null
          email: string | null
          email_secondary: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          income_range: string | null
          is_financial: boolean | null
          is_pedagogical: boolean | null
          is_primary: boolean | null
          marital_status: string | null
          nationality: string | null
          notes: string | null
          number: string | null
          phone: string | null
          phone_secondary: string | null
          profession: string | null
          relationship_description: string | null
          relationship_type: string | null
          rg: string | null
          school_id: string | null
          state: string | null
          whatsapp_enabled: boolean | null
          work_phone: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          can_authorize_image?: boolean | null
          can_pickup?: boolean | null
          can_receive_reports?: boolean | null
          city?: string | null
          company?: string | null
          complement?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          email_secondary?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          income_range?: string | null
          is_financial?: boolean | null
          is_pedagogical?: boolean | null
          is_primary?: boolean | null
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone_secondary?: string | null
          profession?: string | null
          relationship_description?: string | null
          relationship_type?: string | null
          rg?: string | null
          school_id?: string | null
          state?: string | null
          whatsapp_enabled?: boolean | null
          work_phone?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          can_authorize_image?: boolean | null
          can_pickup?: boolean | null
          can_receive_reports?: boolean | null
          city?: string | null
          company?: string | null
          complement?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          email_secondary?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          income_range?: string | null
          is_financial?: boolean | null
          is_pedagogical?: boolean | null
          is_primary?: boolean | null
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone_secondary?: string | null
          profession?: string | null
          relationship_description?: string | null
          relationship_type?: string | null
          rg?: string | null
          school_id?: string | null
          state?: string | null
          whatsapp_enabled?: boolean | null
          work_phone?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      backup_guardians_20260417: {
        Row: {
          address: string | null
          birth_date: string | null
          can_authorize_image: boolean | null
          can_pickup: boolean | null
          can_receive_reports: boolean | null
          city: string | null
          company: string | null
          complement: string | null
          cpf: string | null
          district: string | null
          email: string | null
          email_secondary: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          income_range: string | null
          is_financial: boolean | null
          is_pedagogical: boolean | null
          is_primary: boolean | null
          marital_status: string | null
          nationality: string | null
          notes: string | null
          number: string | null
          phone: string | null
          phone_secondary: string | null
          profession: string | null
          relationship_description: string | null
          relationship_type: string | null
          rg: string | null
          school_id: string | null
          state: string | null
          whatsapp_enabled: boolean | null
          work_phone: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          can_authorize_image?: boolean | null
          can_pickup?: boolean | null
          can_receive_reports?: boolean | null
          city?: string | null
          company?: string | null
          complement?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          email_secondary?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          income_range?: string | null
          is_financial?: boolean | null
          is_pedagogical?: boolean | null
          is_primary?: boolean | null
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone_secondary?: string | null
          profession?: string | null
          relationship_description?: string | null
          relationship_type?: string | null
          rg?: string | null
          school_id?: string | null
          state?: string | null
          whatsapp_enabled?: boolean | null
          work_phone?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          can_authorize_image?: boolean | null
          can_pickup?: boolean | null
          can_receive_reports?: boolean | null
          city?: string | null
          company?: string | null
          complement?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          email_secondary?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          income_range?: string | null
          is_financial?: boolean | null
          is_pedagogical?: boolean | null
          is_primary?: boolean | null
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone_secondary?: string | null
          profession?: string | null
          relationship_description?: string | null
          relationship_type?: string | null
          rg?: string | null
          school_id?: string | null
          state?: string | null
          whatsapp_enabled?: boolean | null
          work_phone?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      backup_student_guardians: {
        Row: {
          guardian_id: string | null
          school_id: string | null
          student_id: string | null
        }
        Insert: {
          guardian_id?: string | null
          school_id?: string | null
          student_id?: string | null
        }
        Update: {
          guardian_id?: string | null
          school_id?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      backup_student_guardians_20260417: {
        Row: {
          guardian_id: string | null
          school_id: string | null
          student_id: string | null
        }
        Insert: {
          guardian_id?: string | null
          school_id?: string | null
          student_id?: string | null
        }
        Update: {
          guardian_id?: string | null
          school_id?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      backup_students: {
        Row: {
          academic_year: number | null
          address: string | null
          birth_date: string | null
          blood_type: string | null
          city: string | null
          class_id: string | null
          cpf: string | null
          district: string | null
          email: string | null
          enrollment_number: string | null
          full_name: string | null
          id: string | null
          notes: string | null
          number: string | null
          phone: string | null
          photo_url: string | null
          rg: string | null
          school_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          zip_code: string | null
        }
        Insert: {
          academic_year?: number | null
          address?: string | null
          birth_date?: string | null
          blood_type?: string | null
          city?: string | null
          class_id?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          enrollment_number?: string | null
          full_name?: string | null
          id?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          photo_url?: string | null
          rg?: string | null
          school_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          zip_code?: string | null
        }
        Update: {
          academic_year?: number | null
          address?: string | null
          birth_date?: string | null
          blood_type?: string | null
          city?: string | null
          class_id?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          enrollment_number?: string | null
          full_name?: string | null
          id?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          photo_url?: string | null
          rg?: string | null
          school_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          zip_code?: string | null
        }
        Relationships: []
      }
      backup_students_20260417: {
        Row: {
          academic_year: number | null
          birth_date: string | null
          class_id: string | null
          cpf: string | null
          email: string | null
          full_name: string | null
          id: string | null
          photo_url: string | null
          rg: string | null
          school_id: string | null
          status: Database["public"]["Enums"]["student_status"] | null
        }
        Insert: {
          academic_year?: number | null
          birth_date?: string | null
          class_id?: string | null
          cpf?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          photo_url?: string | null
          rg?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
        }
        Update: {
          academic_year?: number | null
          birth_date?: string | null
          class_id?: string | null
          cpf?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          photo_url?: string | null
          rg?: string | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
        }
        Relationships: []
      }
      backup_teacher_assignments_20260417: {
        Row: {
          class_id: string | null
          id: string | null
          school_id: string | null
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id?: string | null
          id?: string | null
          school_id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string | null
          id?: string | null
          school_id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: []
      }
      backup_teacher_classes_20260417: {
        Row: {
          class_id: string | null
          id: string | null
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id?: string | null
          id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string | null
          id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year: number | null
          capacity: number | null
          grade: string | null
          grade_id: string | null
          id: string
          name: string
          school_id: string
          shift: string | null
          shift_id: string | null
        }
        Insert: {
          academic_year?: number | null
          capacity?: number | null
          grade?: string | null
          grade_id?: string | null
          id?: string
          name: string
          school_id: string
          shift?: string | null
          shift_id?: string | null
        }
        Update: {
          academic_year?: number | null
          capacity?: number | null
          grade?: string | null
          grade_id?: string | null
          id?: string
          name?: string
          school_id?: string
          shift?: string | null
          shift_id?: string | null
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
      document_templates: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string | null
          orientation: string | null
          school_id: string | null
          template_html: string | null
          type: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string | null
          orientation?: string | null
          school_id?: string | null
          template_html?: string | null
          type?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string | null
          orientation?: string | null
          school_id?: string | null
          template_html?: string | null
          type?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          due_date: string | null
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          name: string | null
          notes: string | null
          reviewed_at: string | null
          school_id: string
          status: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          due_date?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          name?: string | null
          notes?: string | null
          reviewed_at?: string | null
          school_id: string
          status?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          due_date?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          name?: string | null
          notes?: string | null
          reviewed_at?: string | null
          school_id?: string
          status?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          academic_year: number
          class_id: string | null
          created_at: string | null
          grade_id: string | null
          id: string
          school_id: string
          status: string | null
          student_id: string
        }
        Insert: {
          academic_year: number
          class_id?: string | null
          created_at?: string | null
          grade_id?: string | null
          id?: string
          school_id: string
          status?: string | null
          student_id: string
        }
        Update: {
          academic_year?: number
          class_id?: string | null
          created_at?: string | null
          grade_id?: string | null
          id?: string
          school_id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          assignment_id: string | null
          enrollment_id: string
          grade_value: number | null
          id: string
          school_id: string | null
          student_id: string | null
          term: string | null
        }
        Insert: {
          assignment_id?: string | null
          enrollment_id: string
          grade_value?: number | null
          id?: string
          school_id?: string | null
          student_id?: string | null
          term?: string | null
        }
        Update: {
          assignment_id?: string | null
          enrollment_id?: string
          grade_value?: number | null
          id?: string
          school_id?: string | null
          student_id?: string | null
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_grade_enrollment"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_grade_enrollment"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "v_boletim"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "fk_grade_enrollment"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "v_boletim_base"
            referencedColumns: ["enrollment_id"]
          },
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
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          address: string | null
          birth_date: string | null
          can_authorize_image: boolean | null
          can_pickup: boolean | null
          can_receive_reports: boolean | null
          city: string | null
          company: string | null
          complement: string | null
          cpf: string | null
          district: string | null
          email: string | null
          email_secondary: string | null
          full_name: string | null
          gender: string | null
          id: string
          income_range: string | null
          is_financial: boolean | null
          is_pedagogical: boolean | null
          is_primary: boolean | null
          marital_status: string | null
          nationality: string | null
          notes: string | null
          number: string | null
          phone: string | null
          phone_secondary: string | null
          profession: string | null
          relationship_description: string | null
          relationship_type: string | null
          rg: string | null
          school_id: string
          state: string | null
          whatsapp_enabled: boolean | null
          work_phone: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          can_authorize_image?: boolean | null
          can_pickup?: boolean | null
          can_receive_reports?: boolean | null
          city?: string | null
          company?: string | null
          complement?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          email_secondary?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          income_range?: string | null
          is_financial?: boolean | null
          is_pedagogical?: boolean | null
          is_primary?: boolean | null
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone_secondary?: string | null
          profession?: string | null
          relationship_description?: string | null
          relationship_type?: string | null
          rg?: string | null
          school_id: string
          state?: string | null
          whatsapp_enabled?: boolean | null
          work_phone?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          can_authorize_image?: boolean | null
          can_pickup?: boolean | null
          can_receive_reports?: boolean | null
          city?: string | null
          company?: string | null
          complement?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          email_secondary?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          income_range?: string | null
          is_financial?: boolean | null
          is_pedagogical?: boolean | null
          is_primary?: boolean | null
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone_secondary?: string | null
          profession?: string | null
          relationship_description?: string | null
          relationship_type?: string | null
          rg?: string | null
          school_id?: string
          state?: string | null
          whatsapp_enabled?: boolean | null
          work_phone?: string | null
          zipcode?: string | null
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
      message_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          school_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          school_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          school_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pedagogical_interventions: {
        Row: {
          action_type: string | null
          avg_grade: number | null
          class_id: string | null
          created_at: string
          created_by: string | null
          created_role: string | null
          freq_percent: number | null
          id: string
          impact: string | null
          reason: string
          recommendation: string | null
          school_id: string
          severity: string
          status: string
          student_id: string
          subject_id: string | null
          teacher_id: string | null
          teacher_notes: string | null
          updated_at: string
        }
        Insert: {
          action_type?: string | null
          avg_grade?: number | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          created_role?: string | null
          freq_percent?: number | null
          id?: string
          impact?: string | null
          reason: string
          recommendation?: string | null
          school_id: string
          severity?: string
          status?: string
          student_id: string
          subject_id?: string | null
          teacher_id?: string | null
          teacher_notes?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string | null
          avg_grade?: number | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          created_role?: string | null
          freq_percent?: number | null
          id?: string
          impact?: string | null
          reason?: string
          recommendation?: string | null
          school_id?: string
          severity?: string
          status?: string
          student_id?: string
          subject_id?: string | null
          teacher_id?: string | null
          teacher_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedagogical_interventions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_interventions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_interventions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_interventions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_interventions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_boletim"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "pedagogical_interventions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_boletim_base"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "pedagogical_interventions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          school_id: string
          status: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          school_id: string
          status?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          school_id?: string
          status?: string | null
        }
        Relationships: []
      }
      recovery_grades: {
        Row: {
          created_at: string | null
          enrollment_id: string
          id: string
          recovery_score: number
          subject_id: string
          term: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_id: string
          id?: string
          recovery_score: number
          subject_id: string
          term?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string
          id?: string
          recovery_score?: number
          subject_id?: string
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_recovery_enrollment"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recovery_enrollment"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "v_boletim"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "fk_recovery_enrollment"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "v_boletim_base"
            referencedColumns: ["enrollment_id"]
          },
        ]
      }
      role_delegations: {
        Row: {
          account_id: string
          created_at: string
          created_by: string | null
          delegated_role: string
          ends_at: string
          from_user_id: string
          id: string
          starts_at: string
          status: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by?: string | null
          delegated_role: string
          ends_at: string
          from_user_id: string
          id?: string
          starts_at?: string
          status?: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string | null
          delegated_role?: string
          ends_at?: string
          from_user_id?: string
          id?: string
          starts_at?: string
          status?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_grades: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number | null
          name: string
          school_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          name?: string
          school_id?: string
        }
        Relationships: []
      }
      school_memberships: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          status: Database["public"]["Enums"]["school_user_status"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["school_user_status"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["school_user_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_shifts: {
        Row: {
          created_at: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          cnpj: string | null
          complement: string | null
          created_at: string | null
          director_name: string | null
          director_role: string | null
          id: string
          logo_url: string | null
          mec_authorization_code: string | null
          name: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          complement?: string | null
          created_at?: string | null
          director_name?: string | null
          director_role?: string | null
          id?: string
          logo_url?: string | null
          mec_authorization_code?: string | null
          name: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          complement?: string | null
          created_at?: string | null
          director_name?: string | null
          director_role?: string | null
          id?: string
          logo_url?: string | null
          mec_authorization_code?: string | null
          name?: string
        }
        Relationships: []
      }
      secretary_requests: {
        Row: {
          class_id: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          origin: string
          priority: string
          request_type: string
          resolved_notified: boolean
          school_id: string
          status: string
          student_id: string | null
          student_name: string | null
          student_status: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          origin?: string
          priority?: string
          request_type: string
          resolved_notified?: boolean
          school_id: string
          status?: string
          student_id?: string | null
          student_name?: string | null
          student_status?: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          origin?: string
          priority?: string
          request_type?: string
          resolved_notified?: boolean
          school_id?: string
          status?: string
          student_id?: string | null
          student_name?: string | null
          student_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretary_requests_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretary_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretary_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      student_certificates: {
        Row: {
          additional_skills: string | null
          city: string | null
          completion_year: number
          course_name: string
          created_at: string | null
          director_name: string | null
          establishment: string | null
          id: string
          institution_name: string | null
          issue_date: string | null
          notes: string | null
          registry_book: string | null
          registry_number: string | null
          registry_page: string | null
          school_id: string
          secretary_name: string | null
          state: string | null
          student_id: string
          workload_hours: number | null
        }
        Insert: {
          additional_skills?: string | null
          city?: string | null
          completion_year: number
          course_name: string
          created_at?: string | null
          director_name?: string | null
          establishment?: string | null
          id?: string
          institution_name?: string | null
          issue_date?: string | null
          notes?: string | null
          registry_book?: string | null
          registry_number?: string | null
          registry_page?: string | null
          school_id: string
          secretary_name?: string | null
          state?: string | null
          student_id: string
          workload_hours?: number | null
        }
        Update: {
          additional_skills?: string | null
          city?: string | null
          completion_year?: number
          course_name?: string
          created_at?: string | null
          director_name?: string | null
          establishment?: string | null
          id?: string
          institution_name?: string | null
          issue_date?: string | null
          notes?: string | null
          registry_book?: string | null
          registry_number?: string | null
          registry_page?: string | null
          school_id?: string
          secretary_name?: string | null
          state?: string | null
          student_id?: string
          workload_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      student_dependencies: {
        Row: {
          academic_year: number
          created_at: string | null
          id: string
          status: string | null
          student_id: string
          subject_id: string | null
          subject_name: string | null
        }
        Insert: {
          academic_year: number
          created_at?: string | null
          id?: string
          status?: string | null
          student_id: string
          subject_id?: string | null
          subject_name?: string | null
        }
        Update: {
          academic_year?: number
          created_at?: string | null
          id?: string
          status?: string | null
          student_id?: string
          subject_id?: string | null
          subject_name?: string | null
        }
        Relationships: []
      }
      student_enrollments: {
        Row: {
          academic_year: number
          class_id: string
          created_at: string | null
          end_date: string | null
          enrolled_at: string | null
          enrollment_number: string | null
          id: string
          notes: string | null
          origin_enrollment_id: string | null
          school_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Insert: {
          academic_year: number
          class_id: string
          created_at?: string | null
          end_date?: string | null
          enrolled_at?: string | null
          enrollment_number?: string | null
          id?: string
          notes?: string | null
          origin_enrollment_id?: string | null
          school_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Update: {
          academic_year?: number
          class_id?: string
          created_at?: string | null
          end_date?: string | null
          enrolled_at?: string | null
          enrollment_number?: string | null
          id?: string
          notes?: string | null
          origin_enrollment_id?: string | null
          school_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_enrollment_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollment_origin"
            columns: ["origin_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollment_origin"
            columns: ["origin_enrollment_id"]
            isOneToOne: false
            referencedRelation: "v_boletim"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "fk_enrollment_origin"
            columns: ["origin_enrollment_id"]
            isOneToOne: false
            referencedRelation: "v_boletim_base"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "fk_enrollment_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollment_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollment_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          guardian_id: string
          school_id: string | null
          student_id: string
        }
        Insert: {
          guardian_id: string
          school_id?: string | null
          student_id: string
        }
        Update: {
          guardian_id?: string
          school_id?: string | null
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
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      student_reports: {
        Row: {
          content: string | null
          created_at: string
          id: string
          school_id: string
          student_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          school_id: string
          student_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year: number | null
          address: string | null
          birth_date: string | null
          blood_type: string | null
          city: string | null
          class_id: string | null
          complement: string | null
          cpf: string | null
          district: string | null
          email: string | null
          enrollment_number: string | null
          full_name: string
          id: string
          notes: string | null
          number: string | null
          phone: string | null
          photo_url: string | null
          rg: string | null
          school_id: string
          state: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          zip_code: string | null
        }
        Insert: {
          academic_year?: number | null
          address?: string | null
          birth_date?: string | null
          blood_type?: string | null
          city?: string | null
          class_id?: string | null
          complement?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          enrollment_number?: string | null
          full_name: string
          id?: string
          notes?: string | null
          number?: string | null
          phone?: string | null
          photo_url?: string | null
          rg?: string | null
          school_id: string
          state?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          zip_code?: string | null
        }
        Update: {
          academic_year?: number | null
          address?: string | null
          birth_date?: string | null
          blood_type?: string | null
          city?: string | null
          class_id?: string | null
          complement?: string | null
          cpf?: string | null
          district?: string | null
          email?: string | null
          enrollment_number?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          number?: string | null
          phone?: string | null
          photo_url?: string | null
          rg?: string | null
          school_id?: string
          state?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          zip_code?: string | null
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
          id: string
          name: string | null
          school_id: string
        }
        Insert: {
          id?: string
          name?: string | null
          school_id: string
        }
        Update: {
          id?: string
          name?: string | null
          school_id?: string
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
          class_id: string | null
          id: string
          school_id: string
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id?: string | null
          id?: string
          school_id: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string | null
          id?: string
          school_id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_boletim"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "v_boletim_base"
            referencedColumns: ["subject_id"]
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
      teacher_classes: {
        Row: {
          class_id: string | null
          id: string
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id?: string | null
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string | null
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          email: string | null
          full_name: string | null
          id: string
          profile_id: string | null
          school_id: string
          status: string | null
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          id?: string
          profile_id?: string | null
          school_id: string
          status?: string | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          id?: string
          profile_id?: string | null
          school_id?: string
          status?: string | null
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
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          school_id: string
          status: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role: string
          school_id: string
          status?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          school_id?: string
          status?: string | null
          token?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_boletim: {
        Row: {
          disciplina: string | null
          enrollment_id: string | null
          full_name: string | null
          media: number | null
          situacao: string | null
          subject_id: string | null
          term: string | null
        }
        Relationships: []
      }
      v_boletim_base: {
        Row: {
          disciplina: string | null
          enrollment_id: string | null
          full_name: string | null
          media: number | null
          subject_id: string | null
          term: string | null
        }
        Relationships: []
      }
      v_dashboard_main: {
        Row: {
          da_coordenacao: number | null
          pendentes: number | null
          resolvidos: number | null
          school_id: string | null
          urgentes: number | null
        }
        Relationships: []
      }
      v_historico_escolar: {
        Row: {
          disciplina: string | null
          grade_value: number | null
          student_id: string | null
          term: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_student_performance: {
        Row: {
          full_name: string | null
          id: string | null
          media: number | null
          photo_url: string | null
          status_frequencia: string | null
          status_nota: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_final_status: { Args: { dep_count: number }; Returns: string }
      close_academic_year: { Args: { p_year: number }; Returns: number }
      close_academic_year_debug: {
        Args: { p_year: number }
        Returns: {
          aprovados: number
          dependencia: number
          reprovados: number
          total: number
        }[]
      }
      current_account_id: { Args: never; Returns: string }
      current_school_id: { Args: never; Returns: string }
      enroll_student: {
        Args: {
          p_class_id: string
          p_school_id: string
          p_student_id: string
          p_year: number
        }
        Returns: string
      }
      ensure_user_school: { Args: never; Returns: undefined }
      get_effective_role: { Args: never; Returns: string }
      get_student_historico: { Args: { student_uuid: string }; Returns: Json }
      is_member_of_school: { Args: { _school_id: string }; Returns: boolean }
      process_rematricula: { Args: { p_year: number }; Returns: number }
      process_rematricula_with_class: {
        Args: { p_year: number }
        Returns: number
      }
      promote_students: { Args: { p_year: number }; Returns: number }
      user_has_access: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "secretaria"
        | "coordenador"
        | "professor"
        | "auxiliar"
      enrollment_status: "ativo" | "transferido" | "trancado" | "cancelado"
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
      enrollment_status: ["ativo", "transferido", "trancado", "cancelado"],
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

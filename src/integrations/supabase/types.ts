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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string
          direccion: string | null
          dpi: string | null
          id: string
          telefono: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          dpi?: string | null
          id?: string
          telefono?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          dpi?: string | null
          id?: string
          telefono?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comercios: {
        Row: {
          banco_comercio_id: number | null
          created_at: string
          cuenta_numero: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          banco_comercio_id?: number | null
          created_at?: string
          cuenta_numero?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          banco_comercio_id?: number | null
          created_at?: string
          cuenta_numero?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      orden_items: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          orden_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          updated_at: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          orden_id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          updated_at?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          orden_id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_items_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          created_at: string
          direccion_envio: string
          estado: Database["public"]["Enums"]["estado_orden"]
          fecha_creacion: string
          id: string
          telefono: string
          total: number
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          direccion_envio: string
          estado?: Database["public"]["Enums"]["estado_orden"]
          fecha_creacion?: string
          id?: string
          telefono: string
          total?: number
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          direccion_envio?: string
          estado?: Database["public"]["Enums"]["estado_orden"]
          fecha_creacion?: string
          id?: string
          telefono?: string
          total?: number
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          banco_pago_id: string | null
          comercio_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_pago"]
          id: string
          idempotency_key: string
          monto: number
          orden_id: string
          referencia: string | null
          updated_at: string
        }
        Insert: {
          banco_pago_id?: string | null
          comercio_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_pago"]
          id?: string
          idempotency_key: string
          monto: number
          orden_id: string
          referencia?: string | null
          updated_at?: string
        }
        Update: {
          banco_pago_id?: string | null
          comercio_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_pago"]
          id?: string
          idempotency_key?: string
          monto?: number
          orden_id?: string
          referencia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_webhook_logs: {
        Row: {
          created_at: string
          headers: Json | null
          id: string
          pago_id: string | null
          payload: Json
          recibido_en: string
        }
        Insert: {
          created_at?: string
          headers?: Json | null
          id?: string
          pago_id?: string | null
          payload: Json
          recibido_en?: string
        }
        Update: {
          created_at?: string
          headers?: Json | null
          id?: string
          pago_id?: string | null
          payload?: Json
          recibido_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_webhook_logs_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          estado: string
          fecha_creacion: string
          foto_url: string | null
          id: string
          marca: string
          nombre: string
          precio: number
          stock: number
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_creacion?: string
          foto_url?: string | null
          id?: string
          marca: string
          nombre: string
          precio: number
          stock?: number
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_creacion?: string
          foto_url?: string | null
          id?: string
          marca?: string
          nombre?: string
          precio?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          correo_electronico: string
          created_at: string
          id: string
          nombre_completo: string
          rol: Database["public"]["Enums"]["app_role"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          correo_electronico: string
          created_at?: string
          id: string
          nombre_completo: string
          rol?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          correo_electronico?: string
          created_at?: string
          id?: string
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          correo_electronico: string
          fecha_creacion: string
          id: string
          nombre_completo: string
          password_hash: string | null
          rol: Database["public"]["Enums"]["app_role"]
          telefono: string | null
        }
        Insert: {
          correo_electronico: string
          fecha_creacion?: string
          id?: string
          nombre_completo: string
          password_hash?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
        }
        Update: {
          correo_electronico?: string
          fecha_creacion?: string
          id?: string
          nombre_completo?: string
          password_hash?: string | null
          rol?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirmar_orden_y_restar_stock: {
        Args: { p_pago_id: string }
        Returns: boolean
      }
      is_operador: {
        Args: { user_id: string }
        Returns: boolean
      }
      revertir_stock_orden: {
        Args: { p_orden_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "cliente" | "operador"
      estado_orden:
        | "PENDING"
        | "CONFIRMED"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
      estado_pago: "PENDING" | "APROBADO" | "RECHAZADO" | "REFUNDED"
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
      app_role: ["cliente", "operador"],
      estado_orden: [
        "PENDING",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      estado_pago: ["PENDING", "APROBADO", "RECHAZADO", "REFUNDED"],
    },
  },
} as const

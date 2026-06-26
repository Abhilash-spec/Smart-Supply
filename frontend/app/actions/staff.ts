"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notify } from "@/lib/notifications/service"
import { StaffInviteEmail } from "@/lib/email/templates/StaffInviteEmail"
import React from "react"

export async function createStaffMember({
  email,
  password,
  firstName,
  lastName,
  staffType, // 'shop' | 'vendor'
  permissions // array of strings or JSON object
}: {
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  staffType: 'shop' | 'vendor',
  permissions: any
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
        }
      }
    )

    // 1. Get current logged in owner
    const { data: { user: owner }, error: userError } = await supabase.auth.getUser()
    if (userError || !owner) throw new Error("Unauthorized")

    // 2. Fetch owner's tenant_id and tenant name
    const { data: ownerData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('tenant_id, tenants(name)')
      .eq('id', owner.id)
      .single()

    if (dbError || !ownerData?.tenant_id) throw new Error("Could not find owner's tenant")

    const tenantId = ownerData.tenant_id
    const shopName = (ownerData.tenants as any)?.name || "SmartSupply Shop"

    // 3. Create the auth user using Admin API (does not log the owner out)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'staff',
        staff_type: staffType,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        permissions: permissions
      }
    })

    if (authError) throw authError

    const staffUserId = authData.user.id

    // 4. Ensure the user record is correctly mapped in `public.users`
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: staffUserId,
        tenant_id: tenantId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        status: 'active'
      }, { onConflict: 'id' })

    if (upsertError) throw upsertError

    // 5. Send Notification
    await notify({
      tenantId,
      userId: staffUserId,
      channel: 'both',
      title: 'Welcome to SmartSupply',
      body: `You have been invited to join ${shopName} as a ${staffType}.`,
      email: {
        to: email,
        subject: `You have been invited to join ${shopName}`,
        react: React.createElement(StaffInviteEmail, {
          firstName,
          shopName,
          role: staffType,
          loginUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:3000/login'
        })
      }
    });

    return { success: true, userId: staffUserId }
  } catch (error: any) {
    console.error("Create Staff Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getStaffMembers() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
        }
      }
    )

    const { data: { user: owner }, error: userError } = await supabase.auth.getUser()
    if (userError || !owner) throw new Error("Unauthorized")

    const { data: ownerData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', owner.id)
      .single()

    if (dbError || !ownerData?.tenant_id) throw new Error("Could not find owner's tenant")

    const tenantId = ownerData.tenant_id

    // Fetch all users for this tenant who are not the owner
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, status, created_at')
      .eq('tenant_id', tenantId)
      .neq('id', owner.id)

    if (staffError) throw staffError

    return { success: true, staff: staffData }
  } catch (error: any) {
    console.error("Get Staff Error:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteStaffMember(userId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
        }
      }
    )

    const { data: { user: owner }, error: userError } = await supabase.auth.getUser()
    if (userError || !owner) throw new Error("Unauthorized")

    const { data: ownerData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', owner.id)
      .single()

    if (dbError || !ownerData?.tenant_id) throw new Error("Could not find owner's tenant")

    // Verify staff belongs to this tenant
    const { data: staffData } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single()
      
    if (staffData?.tenant_id !== ownerData.tenant_id) {
      throw new Error("Unauthorized to delete this staff member")
    }

    // Delete from auth.users (cascade will delete from public.users)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    // Also explicitly delete from public.users just in case cascade is disabled
    await supabaseAdmin.from('users').delete().eq('id', userId)

    return { success: true }
  } catch (error: any) {
    console.error("Delete Staff Error:", error)
    return { success: false, error: error.message }
  }
}

export async function updateStaffMember(userId: string, data: { firstName: string, lastName: string, status?: string }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
        }
      }
    )

    const { data: { user: owner }, error: userError } = await supabase.auth.getUser()
    if (userError || !owner) throw new Error("Unauthorized")

    const { data: ownerData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', owner.id)
      .single()

    if (dbError || !ownerData?.tenant_id) throw new Error("Could not find owner's tenant")

    // Verify staff belongs to this tenant
    const { data: staffData } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single()
      
    if (staffData?.tenant_id !== ownerData.tenant_id) {
      throw new Error("Unauthorized to update this staff member")
    }

    // Update public.users
    const updatePayload: any = {
      first_name: data.firstName,
      last_name: data.lastName,
      display_name: `${data.firstName} ${data.lastName}`
    }
    
    if (data.status) {
      updatePayload.status = data.status
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', userId)

    if (updateError) throw updateError

    // Also update auth user metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: `${data.firstName} ${data.lastName}`
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error("Update Staff Error:", error)
    return { success: false, error: error.message }
  }
}

export async function updateStaffPassword(userId: string, newPassword: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
        }
      }
    )

    const { data: { user: owner }, error: userError } = await supabase.auth.getUser()
    if (userError || !owner) throw new Error("Unauthorized")

    const { data: ownerData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', owner.id)
      .single()

    if (dbError || !ownerData?.tenant_id) throw new Error("Could not find owner's tenant")

    // Verify staff belongs to this tenant
    const { data: staffData } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single()
      
    if (staffData?.tenant_id !== ownerData.tenant_id) {
      throw new Error("Unauthorized to update this staff member's password")
    }

    // Update auth.users password using admin api
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (updateError) throw updateError

    return { success: true }
  } catch (error: any) {
    console.error("Update Staff Password Error:", error)
    return { success: false, error: error.message }
  }
}

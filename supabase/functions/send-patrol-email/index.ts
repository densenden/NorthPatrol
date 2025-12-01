import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ScanDetail {
  checkpoint_name: string
  checkpoint_order: number
  status: string
  note: string | null
  timestamp: string
}

interface SessionData {
  id: string
  user_email: string
  start_time: string
  end_time: string
  scans: ScanDetail[]
  has_notes: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      throw new Error("Session ID is required")
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get notification email from settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "notification_email")
      .single()

    const notificationEmail = settingsData?.value || "info@northproservices.de"

    // Get session with user and scans
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(`
        *,
        users (email),
        scans (
          status,
          note,
          timestamp,
          checkpoints (name, order)
        )
      `)
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error("Session not found: " + (sessionError?.message || ""))
    }

    // Format session data
    const sessionData: SessionData = {
      id: session.id,
      user_email: session.users?.email || "Unbekannt",
      start_time: session.start_time,
      end_time: session.end_time,
      has_notes: session.has_notes,
      scans: session.scans.map((scan: any) => ({
        checkpoint_name: scan.checkpoints?.name || `Checkpoint ${scan.checkpoints?.order}`,
        checkpoint_order: scan.checkpoints?.order,
        status: scan.status,
        note: scan.note,
        timestamp: scan.timestamp,
      })).sort((a: ScanDetail, b: ScanDetail) => a.checkpoint_order - b.checkpoint_order),
    }

    // Build email HTML
    const emailHtml = buildEmailHtml(sessionData)

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NorthPatrol <dev@sen.studio>",
        to: [notificationEmail],
        subject: `NorthPatrol Bericht - ${formatDate(sessionData.end_time)}${sessionData.has_notes ? " ⚠️ mit Notizen" : ""}`,
        html: emailHtml,
      }),
    })

    const resendResult = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error("Resend error: " + JSON.stringify(resendResult))
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendResult.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDuration(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const duration = endDate.getTime() - startDate.getTime()
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

function buildEmailHtml(session: SessionData): string {
  // NorthPro colors
  const deepNavy = "#1E3340"
  const iceWhite = "#F8F9FA"
  const successGreen = "#4CAF50"
  const errorRed = "#ff3333"

  const scannedCount = session.scans.length
  const notOkScans = session.scans.filter(s => s.status === "not_ok")

  // Build scans list with notes
  let scansList = ""
  session.scans.forEach(scan => {
    const statusColor = scan.status === "ok" ? successGreen : errorRed
    const statusText = scan.status === "ok" ? "OK" : "NICHT OK"

    scansList += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong style="color: ${deepNavy};">${scan.checkpoint_name}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <span style="background: ${scan.status === 'ok' ? '#e8f5e9' : '#ffebee'}; color: ${statusColor}; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px;">
            ${statusText}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">
          ${formatDate(scan.timestamp)}
        </td>
      </tr>
      ${scan.note ? `
      <tr>
        <td colspan="3" style="padding: 8px 12px 16px; border-bottom: 1px solid #eee;">
          <div style="border-left: 3px solid ${errorRed}; padding-left: 12px;">
            <strong style="color: ${errorRed};">Notiz:</strong>
            <p style="margin: 8px 0 0; color: ${deepNavy};">${scan.note}</p>
          </div>
        </td>
      </tr>
      ` : ""}
    `
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: ${deepNavy}; padding: 24px; text-align: center;">
              <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAwIDIwMDAiPjxwb2x5Z29uIGZpbGw9IiNmZmZmZmYiIHBvaW50cz0iODM2LjI3IDkwOC43NyA4MzYuMjcgMTU0NS41NSA2MjUuNTYgMTU0NS41NSA2MjUuNTYgNTE0LjM1IDYyNS41NiA0NTMuNyA2MjUuNTYgMzgwLjkxIDU1Mi43NyAzODAuOTEgNTUyLjc3IDQ1My43IDU1Mi43NyAxNTQ1LjU1IDU1Mi43NyAxNjE4LjM0IDYyNS41NiAxNjE4LjM0IDgzNi4yNyAxNjE4LjM0IDkwOS4wNiAxNjE4LjM0IDkwOS4wNiAxNTQ1LjU1IDkwOS4wNiAxMTkxLjk4IDExMjAuMzEgMTU4MC4zMyAxMTQwLjk5IDE2MTguMzQgMTE4NC4yNSAxNjE4LjM0IDExODQuMjUgMTU0NS41NSA4MzcuODYgOTA4Ljc3IDgzNi4yNyA5MDguNzciLz48cG9seWdvbiBmaWxsPSIjZmZmZmZmIiBwb2ludHM9IjEzNTMuNDUgMzgwLjkxIDExNDEuMTUgMzgwLjkxIDEwNjguMzYgMzgwLjkxIDEwNjguMzYgNDUzLjcgMTA2OC4zNiA3NzQuODEgODc2LjM3IDQxOS4xMyA4NTUuNzQgMzgwLjkxIDgxMi4zMiAzODAuOTEgODEyLjMyIDQ1My43IDExMzkuNTYgMTA1OS45NSAxMTQxLjE1IDEwNTkuOTUgMTE0MS4xNSA0NTMuNyAxMzUzLjQ1IDQ1My43IDEzNTMuNDUgMTM4NC42NSAxMzUzLjQ1IDE1NDUuNTUgMTM1My40NSAxNjE4LjM0IDE0MjYuMjQgMTYxOC4zNCAxNDI2LjI0IDE1NDUuNTUgMTQyNi4yNCA0NTMuNyAxNDI2LjI0IDM4MC45MSAxMzUzLjQ1IDM4MC45MSIvPjwvc3ZnPg==" alt="NorthPatrol" style="height: 50px; margin-bottom: 12px;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">NorthPatrol Bericht</h1>
            </td>
          </tr>

          <!-- Alert Banner if has notes -->
          ${session.has_notes ? `
          <tr>
            <td style="background: ${errorRed}; padding: 16px; text-align: center;">
              <strong style="color: white; font-size: 16px;">⚠️ Rundgang mit Notizen</strong>
            </td>
          </tr>
          ` : ""}

          <!-- Summary -->
          <tr>
            <td style="padding: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px; background: ${iceWhite}; border-radius: 8px; margin-bottom: 16px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 13px;">Benutzer:</td>
                        <td style="color: ${deepNavy}; font-weight: 600;">${session.user_email}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 13px;">Start:</td>
                        <td style="color: ${deepNavy};">${formatDate(session.start_time)}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 13px;">Ende:</td>
                        <td style="color: ${deepNavy};">${formatDate(session.end_time)}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 13px;">Dauer:</td>
                        <td style="color: ${deepNavy};">${getDuration(session.start_time, session.end_time)}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 13px;">Gescannte Checkpoints:</td>
                        <td style="color: ${deepNavy}; font-weight: 600;">${scannedCount} / 15</td>
                      </tr>
                      ${notOkScans.length > 0 ? `
                      <tr>
                        <td style="color: #666; font-size: 13px;">Probleme gemeldet:</td>
                        <td style="color: ${errorRed}; font-weight: 600;">${notOkScans.length}</td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Scan Details -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <h3 style="color: ${deepNavy}; margin: 0 0 16px; font-size: 16px;">Scan Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: ${iceWhite};">
                    <th style="padding: 12px; text-align: left; color: #666; font-size: 12px; text-transform: uppercase;">Checkpoint</th>
                    <th style="padding: 12px; text-align: left; color: #666; font-size: 12px; text-transform: uppercase;">Status</th>
                    <th style="padding: 12px; text-align: left; color: #666; font-size: 12px; text-transform: uppercase;">Zeit</th>
                  </tr>
                </thead>
                <tbody>
                  ${scansList}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: ${iceWhite}; padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 16px; color: #666; font-size: 13px;">© 2025 North Pro Services • NorthPatrol Security System</p>

              <!-- StudioSen Logo -->
              <a href="https://dev.sen.studio" style="display: inline-block; opacity: 0.4;">
                <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDUyMS42IDUxNy40Ij4KICA8Zz4KICAgIDxnIGlkPSJFYmVuZV8xIj4KICAgICAgPGcgaWQ9IkViZW5lXzIiPgogICAgICAgIDxnIGlkPSJFYmVuZV8xLTItMiI+CiAgICAgICAgICA8ZyBpZD0iS3JlaXNfTG9nby0zIj4KICAgICAgICAgICAgPHBhdGggZD0iTTIyNi40LDBoMS42YzMuMy40LDUuNiwzLjIsNS42LDYuM3YxODMuNGMwLDIuNC0xLjQsNC43LTMuNSw1LjgtLjkuNC0xLjguNy0yLjkuN3MtMi44LS40LTMuOS0xLjNMODEuMiw4Ny4xbC04LDkuM2MtOC45LDEwLjItMTcuMSwyMS40LTI0LjIsMzMuMWwtNi4yLDEwLjEsNjUuOSw1MGMyLjgsMi4xLDMuNCw2LjIsMS4yLDguOS0xLjIsMS42LTMuMiwyLjUtNS4xLDIuNXMtMi41LS4zLTMuOC0xLjNsLTY0LjMtNDguOC02LjQsMTZjLTkuMSwyMi43LTE0LjYsNDYuNi0xNi43LDcxbC0xLjIsMTQuMmg0OTYuOGwtMS4yLTE0LjJjLTItMjQuNC03LjYtNDguMy0xNi43LTcxbC02LjQtMTYtNjQuMyw0OC44Yy0xLjQsMS4xLTIuOSwxLjMtMy44LDEuMy0yLDAtMy45LS45LTUuMS0yLjUtMi4xLTIuOC0xLjYtNi44LDEuMi04LjlsNjUuOS01MC02LjItMTAuMWMtNy4xLTExLjctMTUuMi0yMi43LTI0LjItMzMuMWwtOC05LjMtMTQyLjEsMTA3LjhjLTEuMi44LTIuNSwxLjMtMy45LDEuM3MtMi0uMy0yLjktLjdjLTIuMi0xLjEtMy41LTMuMy0zLjUtNS44VjYuNGMwLTMuMiwyLjQtNS45LDUuNS02LjNoMS43YzU2LjIsNy40LDEwOS41LDMzLjYsMTQ5LjgsNzMuOWwuNC40YzMuNywzLjcsNy40LDcuNiwxMC45LDExLjcsNDIsNDcuNyw2NS4zLDEwOC45LDY1LjMsMTcyLjVzLTIzLjIsMTI1LjEtNjUuMywxNzIuOGMtMy41LDMuOS03LjIsNy45LTEwLjksMTEuN2wtLjQuNGMtNDAuMyw0MC4zLTkzLjYsNjYuNi0xNDkuOCw3My45aC0uOHEwLS4xLDAtLjFoLS44Yy0zLjItLjQtNS41LTMuMi01LjUtNi4zdi0xODMuNGMwLTIuNCwxLjQtNC43LDMuNS01LjguOS0uNCwxLjgtLjcsMi45LS43czIuOC40LDMuOSwxLjNsMTQyLjEsMTA3LjgsOC05LjNjOC45LTEwLjIsMTcuMS0yMS40LDI0LjItMzMuMWw2LjItMTAuMS02NS45LTUwYy0xLjgtMS40LTIuNC0zLjMtMi41LTQuMnMtLjEtMi45LDEuMi00LjdjMS4yLTEuNiwzLjItMi41LDUuMS0yLjVzMi41LjMsMy44LDEuM2w2NC4zLDQ4LjgsNi40LTE2YzkuMS0yMi43LDE0LjYtNDYuNiwxNi43LTcxbDEuMi0xNC4ySDEyLjVsMS4yLDE0LjJjMiwyNC40LDcuNiw0OC4zLDE2LjcsNzFsNi40LDE2LDY0LjMtNDguOGMxLjQtMS4xLDIuOS0xLjMsMy44LTEuMywyLDAsNy45LjksNS4xLDIuNSwxLjQsMS44LDEuNCwzLjgsMS4zLDQuN3MtLjcsMi45LTIuNSw0LjJsLTY1LjksNTAsNi4yLDEwLjFjNy4xLDExLjcsMTUuMiwyMi43LDI0LjIsMzMuMWw4LDkuMywxNDIuMS0xMDcuOGMxLjItLjgsMi41LTEuMywzLjktMS4zczIsLjMsMi45LjdjMi4yLDEuMSwzLjUsMy4zLDMuNSw1Ljh2MTgzLjRjMCwzLjItMi40LDUuOS01LjYsNi4zaC0xLjZjLTU2LjMtNy41LTEwOS42LTMzLjctMTUwLTczLjlsLS40LS40Yy0zLjctMy43LTcuNC03LjYtMTAuOS0xMS43QzIzLjMsMzgzLjcsMCwzMjIuNSwwLDI1OC44SDBDMCwxOTUsMjMuMywxMzMuNyw2NS4zLDg2YzMuNy00LjEsNy40LTgsMTAuOS0xMS43bC40LS40QzExNi45LDMzLjcsMTcwLjEsNy41LDIyNi40LDBNMzAwLjcsNTA0LjFsMTYuMi0zLjdjMzctOC41LDcyLjItMjYsMTAxLjYtNTAuM2wxMi45LTEwLjUtMTMwLjUtOTkuMXYxNjMuNmgtLjEsMFpNMTk5LjgsMzU2LjVsLTEwOS41LDgzLjEsMTIuOSwxMC41YzI5LjQsMjQuMyw2NC42LDQxLjYsMTAxLjYsNTAuM2wxNi4yLDMuN3YtMTYzLjZsLTIxLDE2aC0uMVpNMzAwLjcsMTc3bDEzMC41LTk5LjEtMTIuOS0xMC41Yy0yOS40LTI0LjMtNjQuNi00MS42LTEwMS42LTUwLjNsLTE2LjItMy43djE2My42aC4xLDBaTTIwNC43LDE3LjFjLTM3LDguNS03Mi4yLDI2LTEwMS42LDUwLjNsLTEyLjksMTAuNSwxMzAuNSw5OS4xVjEzLjRsLTE2LjIsMy43aC4xLDBaIi8+CiAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgICA8L2c+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4=" alt="StudioSen" style="height: 24px; width: auto;">
              </a>

              <p style="margin: 12px 0 0; color: #999; font-size: 11px;">
                Diese E-Mail wurde automatisch generiert.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

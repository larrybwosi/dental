use crate::db::get_db_conn;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, command, Emitter};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WaiverRequest {
    pub id: String,
    pub appointment_id: String,
    pub patient_id: String,
    pub patient_name: String,
    pub doctor_id: String,
    pub requested_by: String,
    pub status: String, // 'pending', 'approved', 'denied'
    pub created_at: String,
    pub updated_at: String,
}

#[command]
pub fn list_waiver_requests(app_handle: AppHandle) -> Result<Vec<WaiverRequest>, String> {
    let conn = get_db_conn(&app_handle).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, appointment_id, patient_id, patient_name, doctor_id, requested_by, status, created_at, updated_at FROM waiver_requests").map_err(|e| e.to_string())?;

    let iter = stmt.query_map([], |row| {
        Ok(WaiverRequest {
            id: row.get(0)?,
            appointment_id: row.get(1)?,
            patient_id: row.get(2)?,
            patient_name: row.get(3)?,
            doctor_id: row.get(4)?,
            requested_by: row.get(5)?,
            status: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut requests = Vec::new();
    for r in iter {
        requests.push(r.map_err(|e| e.to_string())?);
    }
    Ok(requests)
}

#[command]
pub fn create_waiver_request(
    app_handle: AppHandle,
    appointment_id: String,
    patient_id: String,
    patient_name: String,
    doctor_id: String,
    requested_by: String,
) -> Result<WaiverRequest, String> {
    let conn = get_db_conn(&app_handle).map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO waiver_requests (id, appointment_id, patient_id, patient_name, doctor_id, requested_by, status, created_at, updated_at, sync_status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7, ?8, 'pending')",
        rusqlite::params![id, appointment_id, patient_id, patient_name, doctor_id, requested_by, now, now],
    ).map_err(|e| e.to_string())?;

    let request = WaiverRequest {
        id,
        appointment_id,
        patient_id,
        patient_name,
        doctor_id,
        requested_by,
        status: "pending".to_string(),
        created_at: now.clone(),
        updated_at: now,
    };

    let _ = app_handle.emit("sync-event", serde_json::json!({ "type": "waiver_request" }));

    Ok(request)
}

#[command]
pub fn update_waiver_status(
    app_handle: AppHandle,
    id: String,
    status: String,
) -> Result<(), String> {
    let conn = get_db_conn(&app_handle).map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    let appointment_id: String = conn.query_row(
        "SELECT appointment_id FROM waiver_requests WHERE id = ?1",
        [&id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE waiver_requests SET status = ?1, updated_at = ?2, sync_status = 'pending' WHERE id = ?3",
        [status.clone(), now, id],
    ).map_err(|e| e.to_string())?;

    if status == "approved" {
        conn.execute(
            "UPDATE appointments SET reception_fee_waived = 1, updated_at = ?1, sync_status = 'pending' WHERE id = ?2",
            [Utc::now().to_rfc3339(), appointment_id],
        ).map_err(|e| e.to_string())?;
    }

    let _ = app_handle.emit("sync-event", serde_json::json!({ "type": "waiver_status_updated" }));

    Ok(())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DoctorStatus {
    pub doctor_id: String,
    pub current_appointment_id: Option<String>,
    pub updated_at: String,
}

#[command]
pub fn get_doctor_status(app_handle: AppHandle, doctor_id: String) -> Result<Option<DoctorStatus>, String> {
    let conn = get_db_conn(&app_handle).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT doctor_id, current_appointment_id, updated_at FROM doctor_status WHERE doctor_id = ?1").map_err(|e| e.to_string())?;

    let status = stmt.query_row([doctor_id], |row| {
        Ok(DoctorStatus {
            doctor_id: row.get(0)?,
            current_appointment_id: row.get(1)?,
            updated_at: row.get(2)?,
        })
    }).ok();

    Ok(status)
}

#[command]
pub fn list_doctor_statuses(app_handle: AppHandle) -> Result<Vec<DoctorStatus>, String> {
    let conn = get_db_conn(&app_handle).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT doctor_id, current_appointment_id, updated_at FROM doctor_status").map_err(|e| e.to_string())?;

    let iter = stmt.query_map([], |row| {
        Ok(DoctorStatus {
            doctor_id: row.get(0)?,
            current_appointment_id: row.get(1)?,
            updated_at: row.get(2)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut statuses = Vec::new();
    for s in iter {
        statuses.push(s.map_err(|e| e.to_string())?);
    }
    Ok(statuses)
}

#[command]
pub fn update_doctor_status(
    app_handle: AppHandle,
    doctor_id: String,
    current_appointment_id: Option<String>,
) -> Result<(), String> {
    let conn = get_db_conn(&app_handle).map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO doctor_status (doctor_id, current_appointment_id, updated_at, sync_status) VALUES (?1, ?2, ?3, 'pending') ON CONFLICT(doctor_id) DO UPDATE SET current_appointment_id = excluded.current_appointment_id, updated_at = excluded.updated_at, sync_status = 'pending'",
        rusqlite::params![doctor_id, current_appointment_id, now],
    ).map_err(|e| e.to_string())?;

    let _ = app_handle.emit("sync-event", serde_json::json!({ "type": "doctor_status_updated" }));

    Ok(())
}

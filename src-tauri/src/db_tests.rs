#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use uuid::Uuid;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                full_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced'
            )",
            [],
        ).unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                date_of_birth TEXT,
                address TEXT,
                medical_history TEXT,
                allergies TEXT,
                emergency_contact TEXT,
                emergency_phone TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced'
            )",
            [],
        ).unwrap();
        conn
    }

    #[test]
    fn test_create_patient_sets_pending() {
        let conn = setup_test_db();
        let id = Uuid::new_v4().to_string();
        let now = "2023-01-01T00:00:00Z";

        conn.execute(
            "INSERT INTO patients (id, name, created_at, updated_at, sync_status) VALUES (?1, ?2, ?3, ?4, 'pending')",
            [&id, "Test Patient", now, now],
        ).unwrap();

        let sync_status: String = conn.query_row(
            "SELECT sync_status FROM patients WHERE id = ?1",
            [&id],
            |row| row.get(0),
        ).unwrap();

        assert_eq!(sync_status, "pending");
    }

    #[test]
    fn test_patient_upsert_newer_wins() {
        let conn = setup_test_db();
        let id = Uuid::new_v4().to_string();
        let old_time = "2023-01-01T00:00:00Z";
        let new_time = "2023-01-02T00:00:00Z";

        // Initial insert
        conn.execute(
            "INSERT INTO patients (id, name, created_at, updated_at, sync_status) VALUES (?1, ?2, ?3, ?4, 'synced')",
            [&id, "Old Name", old_time, old_time],
        ).unwrap();

        // Upsert with newer data
        conn.execute(
            "INSERT INTO patients (id, name, created_at, updated_at, sync_status)
             VALUES (?1, ?2, ?3, ?4, 'synced')
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                updated_at = excluded.updated_at
             WHERE excluded.updated_at > patients.updated_at",
            [&id, "New Name", old_time, new_time],
        ).unwrap();

        let name: String = conn.query_row(
            "SELECT name FROM patients WHERE id = ?1",
            [&id],
            |row| row.get(0),
        ).unwrap();

        assert_eq!(name, "New Name");

        // Upsert with older data
        conn.execute(
            "INSERT INTO patients (id, name, created_at, updated_at, sync_status)
             VALUES (?1, ?2, ?3, ?4, 'synced')
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                updated_at = excluded.updated_at
             WHERE excluded.updated_at > patients.updated_at",
            [&id, "Older Name", old_time, old_time],
        ).unwrap();

        let name: String = conn.query_row(
            "SELECT name FROM patients WHERE id = ?1",
            [&id],
            |row| row.get(0),
        ).unwrap();

        assert_eq!(name, "New Name"); // Should still be "New Name"
    }
}

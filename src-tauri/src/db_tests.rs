#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use uuid::Uuid;
    use crate::db::init_schema;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        init_schema(&mut conn).expect("Failed to initialize schema");
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

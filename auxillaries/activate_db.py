from app.backend.services.database_service import DatabaseService

def main():
    db = DatabaseService()
    print("Initial database status:", db.is_activated())
    db.activate_database()
    print("Database status after activation:", db.is_activated())

if __name__ == "__main__":
    main() 